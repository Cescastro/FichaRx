#!/usr/bin/env python3
"""
ETL: FO-SF-20 GUIA DE ESTABILIDAD MANEJO MEDICAMENTOS V8 → dataset_final.json

Lee las 7 hojas del Excel, consolida por principio activo y emite:
  - dataset_final.json   (reemplaza el archivo actual, encoding limpio)
  - dataset_report.txt   (reporte de calidad: campos faltantes, discrepancias)

Uso:
  python scripts/build_dataset.py
  python scripts/build_dataset.py --dry-run   # solo reporte, no escribe JSON
"""

import zipfile, xml.etree.ElementTree as ET, json, re, unicodedata, sys, argparse
from pathlib import Path
from collections import defaultdict

# ── rutas ──────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).resolve().parent.parent
EXCEL     = ROOT / "FO-SF-20 GUIA DE ESTABILIDAD MANEJO MEDICAMENTOS V8 (1).xlsx"
OUT_JSON  = ROOT / "dataset_final.json"
OUT_REPORT = ROOT / "dataset_report.txt"

NS = {"w": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

# Valores que equivalen a "no hay dato"
VACIOS = {"N/A", "NA", "NR", "N.A", "NO APLICA", "NO REPORTA", "NINGUNA",
          "NINGUNO", "NINGUNA.", "NO REPORTA.", "NO SE REPORTA", "NO SE APLICA"}

# ── helpers de lectura ─────────────────────────────────────────────────────────

def load_shared_strings(z):
    sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
    strings = []
    for si in sst.findall("w:si", NS):
        parts = [t.text or "" for t in si.findall(".//w:t", NS)]
        strings.append("".join(parts).strip())
    return strings


def _cell_val(c, strings):
    t   = c.get("t", "")
    v_el = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
    if v_el is None or v_el.text is None:
        return ""
    if t == "s":
        return strings[int(v_el.text)]
    if t == "inlineStr":
        is_el = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is")
        if is_el is not None:
            return "".join(x.text or "" for x in is_el.findall(".//w:t", NS))
    return v_el.text


def _col(cell_ref):
    """'AB11' → 'AB'"""
    m = re.match(r"([A-Z]+)", cell_ref or "")
    return m.group(1) if m else ""


def iter_rows(z, sheet_file, strings, start_row=1):
    """Yield (row_num, {col: value}) para filas >= start_row con al menos una celda."""
    xml = ET.fromstring(z.read(sheet_file))
    for row in xml.findall(".//w:row", NS):
        rn = int(row.get("r", 0))
        if rn < start_row:
            continue
        cells = {}
        for c in row.findall("w:c", NS):
            col = _col(c.get("r", ""))
            if col:
                val = _cell_val(c, strings).strip()
                if val:
                    cells[col] = val
        if cells:
            yield rn, cells


# ── helpers de limpieza ────────────────────────────────────────────────────────

def clean(val):
    """Colapsa espacios y saltos de línea internos."""
    if not val:
        return ""
    return re.sub(r"\s+", " ", str(val).replace("\n", " ")).strip()


def is_empty(v):
    """True si el valor equivale a 'sin dato'."""
    return not v or clean(v).upper() in VACIOS


def normalize_key(name):
    """Clave de búsqueda: sin acentos, mayúsculas, espacios colapsados."""
    if not name:
        return ""
    n = unicodedata.normalize("NFD", name.strip())
    n = "".join(c for c in n if unicodedata.category(c) != "Mn")
    n = n.upper()
    n = re.sub(r"\s+", " ", n).strip()
    return n


def extract_nombre_base(nombre):
    """Extrae el principio activo quitando concentración y forma farmacéutica."""
    n = clean(nombre)
    # Concentraciones: 100MG/ML, 20 MG, 1.5G, 0.5%, etc.
    n = re.sub(
        r"\d+[\.,]?\d*\s*"
        r"(MG|MCG|G|ML|UI|U|MEQ|MEQL|%|MG\/ML|MCG\/ML|UI\/ML|MEQ\/ML|MG\/KG)"
        r"(?:\s*\/\s*\d+[\.,]?\d*\s*(?:MG|ML|G|UI))?",
        "", n, flags=re.IGNORECASE
    )
    # Formas farmacéuticas
    for forma in [
        "SOLUCION INYECTABLE", "SOLUCION ORAL", "SUSPENSION ORAL",
        "POLVO PARA INYECCION", "TABLETAS", "TABLETA", "CAPSULAS", "CAPSULA",
        "AMPOLLAS", "AMPOLLA", "INYECTABLE", "TOPICO", "GOTAS", "JARABE",
        "CREMA", "GEL", "SUSPENSION", "SOLUCION", "COMPRIMIDOS", "COMPRIMIDO",
    ]:
        n = re.sub(r"\b" + re.escape(forma) + r"\b", "", n, flags=re.IGNORECASE)
    # Artefactos: "(10%)", "X 240ML", "- AMP", trailing "-"
    n = re.sub(r"\(\s*\d+[\.,]?\d*\s*%?\s*\)", "", n)
    n = re.sub(r"\s+X\s+\d+[\w]*\s*$", "", n)
    n = re.sub(r"\s+X\s*$", "", n)
    n = re.sub(r"\s*-\s*AMP\b", "", n, flags=re.IGNORECASE)
    n = re.sub(r"[-\s]+$", "", n.strip())
    n = re.sub(r"\s+", " ", n).strip()
    return n if n else clean(nombre)


def strip_empty_fields(d):
    """Elimina claves con valores vacíos o equivalentes a sin-dato."""
    if isinstance(d, dict):
        return {k: strip_empty_fields(v) for k, v in d.items()
                if v is not None and v != "" and not (isinstance(v, str) and is_empty(v))
                and not (isinstance(v, (dict, list)) and not v)}
    if isinstance(d, list):
        return [strip_empty_fields(i) for i in d if i is not None and i != ""]
    return d


# ── lectores por hoja ──────────────────────────────────────────────────────────

def read_multidosis(z, strings):
    """Hoja 3 → dict[key] = lista de entradas vida_multidosis."""
    result = defaultdict(list)
    for _, cells in iter_rows(z, "xl/worksheets/sheet3.xml", strings, start_row=8):
        nombre = clean(cells.get("A", ""))
        if not nombre:
            continue
        entry = strip_empty_fields({
            "presentacion":             nombre,
            "marca":                    clean(cells.get("B", "")),
            "laboratorio":              clean(cells.get("C", "")),
            "tiempo_post_apertura":     clean(cells.get("D", "")),
            "condiciones_conservacion": clean(cells.get("E", "")),
            "bibliografia":             clean(cells.get("F", "")),
        })
        result[normalize_key(nombre)].append(entry)
    return result


def read_alto_riesgo(z, strings):
    """Hoja 5 → dict[key] = {presentacion, pauta_vigilancia}."""
    result = {}
    for _, cells in iter_rows(z, "xl/worksheets/sheet5.xml", strings, start_row=8):
        nombre = clean(cells.get("A", ""))
        if not nombre:
            continue
        result[normalize_key(nombre)] = {
            "presentacion":     nombre,
            "pauta_vigilancia": clean(cells.get("B", "")),
        }
    return result


def read_horario_vo(z, strings):
    """Hoja 6 → dict[key] = {horario, tomar_con}."""
    result = {}
    for _, cells in iter_rows(z, "xl/worksheets/sheet6.xml", strings, start_row=8):
        nombre = clean(cells.get("A", ""))
        if not nombre:
            continue
        entry = strip_empty_fields({
            "horario":   clean(cells.get("B", "")),
            "tomar_con": clean(cells.get("D", "")),
        })
        if entry:
            result[normalize_key(nombre)] = entry
    return result


def read_oncologicos(z, strings):
    """Hoja 1 → dict[key] = lista de presentaciones oncológicas."""
    result = defaultdict(list)
    for _, cells in iter_rows(z, "xl/worksheets/sheet1.xml", strings, start_row=7):
        nombre = clean(cells.get("A", ""))
        if not nombre:
            continue
        pres = strip_empty_fields({
            "fuente":                    "oncologicos",
            "nombre_comercial":          clean(cells.get("B", "")),
            "forma_farmaceutica":        clean(cells.get("C", "")),
            "laboratorio":               clean(cells.get("D", "")),
            "volumen_reconstitucion":    clean(cells.get("E", "")),
            "concentracion_final":       clean(cells.get("F", "")),
            "solucion_dilucion":         clean(cells.get("G", "").replace("\n", " ")),
            "estabilidad_ficha_tecnica": clean(cells.get("H", "").replace("\n", " ")),
            "estabilidad_otra_ref":      clean(cells.get("I", "")),
            "referencia_bibliografica":  clean(cells.get("J", "").replace("\n", " ")),
            "proteccion_luz":            clean(cells.get("K", "")),
            "refrigeracion":             clean(cells.get("L", "")),
            "observaciones":             clean(cells.get("M", "")),
        })
        pres["fuente"] = "oncologicos"  # garantizar que fuente siempre esté
        result[normalize_key(nombre)].append(pres)
    return result


def read_uci_uce(z, strings):
    """Hoja 7 → dict[key] = lista de entradas UCI/UCE."""
    result = defaultdict(list)
    current_group = ""
    for _, cells in iter_rows(z, "xl/worksheets/sheet7.xml", strings, start_row=8):
        # Columna A = categoría del grupo (aparece junto con B/C en la primera fila del grupo)
        if "A" in cells:
            current_group = clean(cells["A"])
        if "C" not in cells:
            continue  # fila sin medicamento

        nombre_raw = clean(cells.get("C", "").replace("\n", " "))
        if not nombre_raw:
            continue

        # Separar nombre de la concentración en paréntesis
        m = re.match(r"^(.*?)\s*\(([^)]+)\)\s*$", nombre_raw)
        nombre_clean = clean(m.group(1)) if m else nombre_raw
        nombre_full  = nombre_raw

        limites = strip_empty_fields({
            "suave_inferior": clean(cells.get("H", "")),
            "flujo_estandar": clean(cells.get("I", "").replace("\n", " ")),
            "suave_superior": clean(cells.get("J", "")),
            "duro_superior":  clean(cells.get("K", "")),
        })

        entry = strip_empty_fields({
            "grupo":         current_group,
            "nombre":        nombre_clean,
            "nombre_full":   nombre_full if nombre_full != nombre_clean else None,
            "comentarios":   clean(cells.get("D", "").replace("\n", " ")),
            "volumen_total": clean(cells.get("E", "")),
            "soluto":        clean(cells.get("F", "")),
            "modo_dosis":    clean(cells.get("G", "")),
        })
        if limites:
            entry["limites"] = limites

        key = normalize_key(nombre_clean)
        result[key].append(entry)
    return result


def _build_pres_generales(cells, source):
    """Construye un objeto presentacion desde una fila de GENERALES o PROFILAXIS."""
    # Columnas de seguridad y fisicoquímica difieren entre hojas
    if source == "generales":
        seg_cols   = [("Q","embarazo"), ("R","lactancia"), ("S","fotosensibilidad"),
                      ("T","bomba_infusion"), ("W","alcohol_bencilico")]
        ph_col, osm_col, ref_col = "U", "V", "X"
    else:  # profilaxis
        seg_cols   = [("P","fotosensibilidad"), ("T","alcohol_bencilico")]
        ph_col, osm_col, ref_col = "Q", "R", "U"

    reconstitucion = strip_empty_fields({
        "vehiculo":                  clean(cells.get("E", "")),
        "cantidad_ml":               clean(cells.get("F", "")),
        "temperatura_almacenamiento": clean(cells.get("G", "")),
        "tiempo_estabilidad":        clean(cells.get("H", "")),
        "vehiculo_fabricante":       clean(cells.get("I", "")),
    })

    dil_sol   = clean(cells.get("J", ""))
    dil_temp  = clean(cells.get("K", ""))
    dil_estab = clean(cells.get("L", ""))
    dil_unidad = clean(cells.get("M", ""))
    diluciones = []
    if dil_sol and not is_empty(dil_sol):
        dil = strip_empty_fields({
            "solucion":          dil_sol,
            "temperatura":       dil_temp,
            "estabilidad_valor": dil_estab,
            "unidad_tiempo":     dil_unidad,
        })
        diluciones.append(dil)

    via   = clean(cells.get("N", ""))
    o_val = clean(cells.get("O", ""))
    p_val = "" if source == "profilaxis" else clean(cells.get("P", ""))
    administracion = strip_empty_fields({
        "via":                         via,
        "concentracion_infusion":      o_val,
        "max_concentracion_pediatria": p_val,
    })

    seguridad = strip_empty_fields(
        {field: clean(cells.get(col, "")) for col, field in seg_cols}
    )

    propfq = strip_empty_fields({
        "pH":          clean(cells.get(ph_col, "")),
        "osmolaridad": clean(cells.get(osm_col, "")),
    })
    if source == "profilaxis":
        s_val = clean(cells.get("S", ""))
        if s_val and not is_empty(s_val):
            propfq["aporte_sodio_meq"] = s_val

    pres = {
        "fuente":         source,
        "nombre_comercial": clean(cells.get("B", "")),
        "presentacion":   clean(cells.get("C", "")),
        "laboratorio":    clean(cells.get("D", "")),
    }
    if reconstitucion: pres["reconstitucion"] = reconstitucion
    if diluciones:     pres["diluciones"]     = diluciones
    if administracion: pres["administracion"] = administracion
    if seguridad:      pres["seguridad"]      = seguridad
    if propfq:         pres["propiedades_fq"] = propfq
    ref = clean(cells.get(ref_col, ""))
    if ref and not is_empty(ref):
        pres["referencia"] = ref

    return strip_empty_fields(pres)


def read_generales_sheet(z, strings, sheet_file, source):
    """
    Lee ESTABILIDADES GENERALES (sheet2) o PROFILAXIS QUIRÚRGICA (sheet4).

    Patrón multi-fila:
      - Fila con A  → nuevo medicamento + nueva presentación
      - Fila sin A, con B/C/D → nueva presentación del medicamento actual
      - Fila sin A/B/C/D, con E-I → nueva reconstitución para misma presentación
                                     (copia B/C/D del último y crea nueva entrada)
      - Fila solo con J-M → dilución adicional para la última presentación
    """
    start_row = 11 if source == "generales" else 9
    result   = {}   # key → {nombre_generico, grupo, subgrupo, presentaciones:[]}
    curr_key  = None
    curr_pres = None          # última presentación añadida (referencia mutable)
    last_bcd  = ("", "", "")  # último (nombre_comercial, presentacion, laboratorio)

    for _, cells in iter_rows(z, sheet_file, strings, start_row=start_row):
        a_val = clean(cells.get("A", ""))
        b_val = clean(cells.get("B", ""))
        c_val = clean(cells.get("C", ""))
        d_val = clean(cells.get("D", ""))

        has_drug_info    = bool(a_val or b_val or c_val or d_val)
        has_reconst_info = any(not is_empty(clean(cells.get(k, ""))) for k in ["E","F","G","H","I"])
        has_dil_info     = bool(cells.get("J"))

        if a_val:
            # Nuevo medicamento
            curr_key = normalize_key(a_val)
            if curr_key not in result:
                result[curr_key] = {
                    "nombre_generico":     a_val,
                    "grupo_farmacologico": clean(cells.get("Y", "")) if source == "generales" else "",
                    "subgrupo":            clean(cells.get("Z", "")) if source == "generales" else "",
                    "presentaciones":      [],
                }

        if not curr_key:
            continue

        if has_drug_info or has_reconst_info:
            # Si no hay B/C/D, copiar del último conocido
            if not b_val and not c_val and not d_val:
                b_val, c_val, d_val = last_bcd
            else:
                last_bcd = (b_val, c_val, d_val)

            merged_cells = dict(cells)
            merged_cells.setdefault("B", b_val)
            merged_cells.setdefault("C", c_val)
            merged_cells.setdefault("D", d_val)

            curr_pres = _build_pres_generales(merged_cells, source)
            result[curr_key]["presentaciones"].append(curr_pres)

        elif has_dil_info and curr_pres is not None:
            # Dilución adicional para la última presentación
            dil_sol    = clean(cells.get("J", ""))
            dil_temp   = clean(cells.get("K", ""))
            dil_estab  = clean(cells.get("L", ""))
            dil_unidad = clean(cells.get("M", ""))
            if dil_sol and not is_empty(dil_sol):
                dil = strip_empty_fields({
                    "solucion":          dil_sol,
                    "temperatura":       dil_temp,
                    "estabilidad_valor": dil_estab,
                    "unidad_tiempo":     dil_unidad,
                })
                curr_pres.setdefault("diluciones", []).append(dil)

    # Limpiar campos vacíos de grupo farmacológico
    for rec in result.values():
        if not rec.get("grupo_farmacologico"):
            rec.pop("grupo_farmacologico", None)
        if not rec.get("subgrupo"):
            rec.pop("subgrupo", None)

    return result


# ── fusión de hojas ────────────────────────────────────────────────────────────

def _find_key(key, registry, prefijo_min=6):
    """
    Busca key en registry. Primero exacto, luego por prefijo truncado.
    prefijo_min: longitud mínima del prefijo para intentar match parcial.
    """
    if key in registry:
        return key
    # Prefijo: comparar los primeros N chars del key buscado contra las claves
    for rk in registry:
        n = min(len(key), len(rk), max(prefijo_min, len(key)))
        if key[:n] == rk[:n]:
            return rk
    return None


def merge_all(generales, oncologicos, profilaxis, multidosis,
              alto_riesgo, horario_vo, uci_uce):
    """
    Consolida todos los diccionarios por hoja en una lista de registros finales.
    Orden de prioridad para nombre_generico: generales > oncologicos > profilaxis
    > multidosis > alto_riesgo > horario > uci_uce.
    """
    # Registro maestro: key → record
    master = {}

    # 1. Poblar desde GENERALES
    for key, rec in generales.items():
        master[key] = {
            "nombre_generico": rec["nombre_generico"],
            "presentaciones":  rec["presentaciones"],
        }
        if rec.get("grupo_farmacologico"):
            master[key]["grupo_farmacologico"] = rec["grupo_farmacologico"]
        if rec.get("subgrupo"):
            master[key]["subgrupo"] = rec["subgrupo"]

    # 2. Agregar ONCOLOGICOS
    for key, pres_list in oncologicos.items():
        if key in master:
            master[key].setdefault("presentaciones", []).extend(pres_list)
        else:
            nombre = pres_list[0].get("nombre_comercial", "") if pres_list else key
            # Usar nombre del primer elemento con nombre generico real
            # El key normalizado es el nombre generico
            nombre_gen = _reconstruct_nombre(key)
            master[key] = {
                "nombre_generico": nombre_gen,
                "presentaciones":  pres_list,
            }

    # 3. Agregar PROFILAXIS
    for key, rec in profilaxis.items():
        if key in master:
            master[key].setdefault("presentaciones", []).extend(rec["presentaciones"])
        else:
            master[key] = {
                "nombre_generico": rec["nombre_generico"],
                "presentaciones":  rec["presentaciones"],
            }

    # 4. Agregar MULTIDOSIS (puede crear nuevos registros o enriquecer existentes)
    for key, entries in multidosis.items():
        found = _find_key(key, master)
        if found:
            master[found].setdefault("vida_multidosis", []).extend(entries)
        else:
            nombre = entries[0]["presentacion"] if entries else key
            master[key] = {
                "nombre_generico": nombre,
                "vida_multidosis": entries,
            }

    # 5. Agregar ALTO RIESGO
    for key, ar_data in alto_riesgo.items():
        found = _find_key(key, master)
        if found:
            master[found]["alto_riesgo"] = ar_data
        else:
            nombre = ar_data["presentacion"]
            master[key] = {
                "nombre_generico": nombre,
                "alto_riesgo":     ar_data,
            }

    # 6. Agregar HORARIO VO (nombres cortos, matcheo más tolerante)
    for key, hvo in horario_vo.items():
        found = _find_key(key, master, prefijo_min=5)
        if found:
            master[found]["horario_vo"] = hvo
        else:
            master[key] = {
                "nombre_generico": key,
                "horario_vo":      hvo,
            }

    # 7. Agregar UCI/UCE: solo match exacto o prefijo largo (≥10) para evitar falsos positivos
    for key, entries in uci_uce.items():
        found = _find_key(key, master, prefijo_min=10)
        if found:
            master[found].setdefault("uci_uce", []).extend(entries)
        else:
            nombre = entries[0]["nombre"] if entries else key
            master[key] = {
                "nombre_generico": nombre,
                "uci_uce":         entries,
            }

    return master


def _reconstruct_nombre(normalized_key):
    """Reconstruye un nombre legible desde la clave normalizada (ya sin acentos)."""
    # Capitalizar palabras excepto conectores cortos
    words = normalized_key.split()
    stopwords = {"DE", "DEL", "LA", "LAS", "LOS", "EL", "Y", "E", "O", "U", "CON", "SIN"}
    result = []
    for i, w in enumerate(words):
        if i > 0 and w in stopwords:
            result.append(w.lower())
        else:
            result.append(w)
    return " ".join(result)


# ── fuentes y campos derivados ─────────────────────────────────────────────────

FUENTES_MAP = {
    "presentaciones": lambda pres: sorted({
        "Generales"   if p.get("fuente") == "generales"  else
        "Oncológicos" if p.get("fuente") == "oncologicos" else
        "Profilaxis"
        for p in pres
    }),
}

def compute_fuentes(record):
    fuentes = []
    pres = record.get("presentaciones", [])
    for p in pres:
        f = p.get("fuente", "")
        if f == "generales"   and "Generales"    not in fuentes: fuentes.append("Generales")
        if f == "oncologicos" and "Oncológicos"  not in fuentes: fuentes.append("Oncológicos")
        if f == "profilaxis"  and "Profilaxis"   not in fuentes: fuentes.append("Profilaxis")
    if record.get("vida_multidosis"):  fuentes.append("Multidosis")
    if record.get("alto_riesgo"):      fuentes.append("Alto riesgo")
    if record.get("horario_vo"):       fuentes.append("Horario VO")
    if record.get("uci_uce"):          fuentes.append("UCI/UCE")
    return fuentes


# ── reporte de calidad ─────────────────────────────────────────────────────────

def build_report(records):
    lines = [
        "=" * 70,
        "REPORTE DE CALIDAD — dataset_final.json",
        "=" * 70,
        f"Total registros: {len(records)}",
        "",
    ]

    fuentes_count = defaultdict(int)
    sin_referencia, sin_via, sin_estabilidad = [], [], []
    alto_riesgo_incompletos = []
    campos_faltantes_criticos = []

    for rec in records:
        for f in rec.get("fuentes", []):
            fuentes_count[f] += 1

        nombre = rec.get("nombre_generico", "?")

        # Presentaciones de estabilidad sin referencia bibliográfica
        for p in rec.get("presentaciones", []):
            if not p.get("referencia") and not p.get("referencia_bibliografica"):
                sin_referencia.append(f"  {nombre} [{p.get('fuente','')}]")
            if p.get("fuente") == "generales":
                if not p.get("administracion", {}).get("via"):
                    sin_via.append(f"  {nombre}")
                dils = p.get("diluciones", [])
                if not dils or all(is_empty(d.get("solucion","")) for d in dils):
                    sin_estabilidad.append(f"  {nombre}")

        # Alto riesgo sin pauta de vigilancia
        ar = rec.get("alto_riesgo")
        if ar and not ar.get("pauta_vigilancia"):
            alto_riesgo_incompletos.append(f"  {nombre}")

        # Registros solo con nombre (sin ningún dato clínico)
        tiene_datos = any([
            rec.get("presentaciones"),
            rec.get("vida_multidosis"),
            rec.get("horario_vo"),
            rec.get("alto_riesgo"),
            rec.get("uci_uce"),
        ])
        if not tiene_datos:
            campos_faltantes_criticos.append(f"  {nombre}")

    lines.append("── Registros por fuente ──────────────────────────────────────────")
    for f, n in sorted(fuentes_count.items(), key=lambda x: -x[1]):
        lines.append(f"  {f:<25} {n:>5} registros")

    lines += ["", "── Presentaciones sin referencia bibliográfica ────────────────────",
              f"  Total: {len(sin_referencia)}"]
    if sin_referencia[:20]:
        lines += sin_referencia[:20]
        if len(sin_referencia) > 20:
            lines.append(f"  ... y {len(sin_referencia)-20} más")

    lines += ["", "── Presentaciones (generales) sin vía de administración ───────────",
              f"  Total: {len(sin_via)}"]
    if sin_via[:15]:
        lines += sin_via[:15]

    lines += ["", "── Presentaciones sin diluciones válidas ──────────────────────────",
              f"  Total: {len(sin_estabilidad)}"]
    if sin_estabilidad[:15]:
        lines += sin_estabilidad[:15]

    if alto_riesgo_incompletos:
        lines += ["", "── ALTO RIESGO sin pauta de vigilancia (CRÍTICO) ──────────────────"]
        lines += alto_riesgo_incompletos

    if campos_faltantes_criticos:
        lines += ["", "── Registros sin ningún dato clínico ──────────────────────────────"]
        lines += campos_faltantes_criticos

    lines += ["", "=" * 70]
    return "\n".join(lines)


# ── main ───────────────────────────────────────────────────────────────────────

def log(msg):
    """Print con encoding seguro para terminales Windows cp1252."""
    sys.stdout.buffer.write((msg + "\n").encode("utf-8", "replace"))
    sys.stdout.buffer.flush()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Solo genera el reporte, no escribe el JSON")
    args = parser.parse_args()

    if not EXCEL.exists():
        sys.stderr.write(f"ERROR: No se encontro el Excel en {EXCEL}\n")
        sys.exit(1)

    log(f"Leyendo {EXCEL.name} ...")

    with zipfile.ZipFile(EXCEL) as z:
        strings = load_shared_strings(z)

        log("  > Hoja: Estabilidades Generales")
        generales   = read_generales_sheet(z, strings, "xl/worksheets/sheet2.xml", "generales")

        log("  > Hoja: Estabilidades Oncologicos")
        oncologicos = read_oncologicos(z, strings)

        log("  > Hoja: Profilaxis Quirurgica")
        profilaxis  = read_generales_sheet(z, strings, "xl/worksheets/sheet4.xml", "profilaxis")

        log("  > Hoja: Estabilidad Multidosis")
        multidosis  = read_multidosis(z, strings)

        log("  > Hoja: Medicamentos Alto Riesgo")
        alto_riesgo = read_alto_riesgo(z, strings)

        log("  > Hoja: Horario Administracion VO")
        horario_vo  = read_horario_vo(z, strings)

        log("  > Hoja: UCI/UCE")
        uci_uce     = read_uci_uce(z, strings)

    log(f"  Generales:   {len(generales)} medicamentos")
    log(f"  Oncologicos: {len(oncologicos)} medicamentos")
    log(f"  Profilaxis:  {len(profilaxis)} medicamentos")
    log(f"  Multidosis:  {len(multidosis)} medicamentos")
    log(f"  Alto riesgo: {len(alto_riesgo)} medicamentos")
    log(f"  Horario VO:  {len(horario_vo)} medicamentos")
    log(f"  UCI/UCE:     {len(uci_uce)} medicamentos")

    log("Fusionando hojas ...")
    master = merge_all(generales, oncologicos, profilaxis,
                       multidosis, alto_riesgo, horario_vo, uci_uce)

    # Construir lista final ordenada alfabeticamente
    dataset = []
    for key, rec in sorted(master.items()):
        nombre_base = extract_nombre_base(rec["nombre_generico"])
        fuentes     = compute_fuentes(rec)
        entry = {
            "nombre_generico": rec["nombre_generico"],
            "nombre_base":     nombre_base,
        }
        for campo in ("grupo_farmacologico", "subgrupo", "alto_riesgo",
                      "horario_vo", "presentaciones", "vida_multidosis", "uci_uce"):
            if rec.get(campo):
                entry[campo] = rec[campo]

        entry["fuentes"] = fuentes
        entry["clave"]   = rec["nombre_generico"]
        dataset.append(entry)

    log(f"Total registros: {len(dataset)}")

    # Generar y guardar reporte de calidad
    report = build_report(dataset)
    OUT_REPORT.write_text(report, encoding="utf-8")
    log(f"Reporte escrito en: {OUT_REPORT.name}")

    if not args.dry_run:
        OUT_JSON.write_text(
            json.dumps(dataset, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        log(f"Dataset escrito en: {OUT_JSON.name}  ({OUT_JSON.stat().st_size // 1024} KB)")
    else:
        log("(--dry-run activo: JSON no sobreescrito)")


if __name__ == "__main__":
    main()
