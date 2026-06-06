# AGENTS.md — VidaCheck / Manual de Medicamentos FO-SF-20

> Guía para agentes de IA (Copilot, Cursor, Claude, etc.). Ver [CLAUDE.md](CLAUDE.md) para instrucciones específicas de Claude Code.

## Contexto del proyecto

Prototipo UX para **FO-SF-20 v8.1** — guía clínica de referencia de medicamentos. Objetivo: validar la experiencia de búsqueda + ficha unificada antes de construir un backend. **Sin sistema de build, sin npm, sin framework — todo vanilla HTML/CSS/ES Modules.**

## Cómo ejecutar

```bash
# PWA (recomendado — habilita instalación + offline)
python -m http.server 8080
# abrir http://localhost:8080 en Chrome/Edge

# Standalone (sin servidor)
# abrir prototipo_standalone.html directamente en el navegador
```

No hay `npm install`, `build`, ni paso de compilación.

## Arquitectura

Ver [CLAUDE.md § Architecture](CLAUDE.md) para la tabla de archivos clave.

### Módulos JS (todos `type="module"`)

```
app.js          ← entry point, orquesta todo
  ├─ search.js  ← normalizar / indexar / buscar (fuzzy, tolerante a acentos)
  ├─ render.js  ← renderResultados (lista de resultados)
  ├─ ficha.js   ← abrirFicha / cerrarFicha (overlay detalle)
  ├─ history.js ← getHistorial / saveHistorial / clearHistorial (localStorage)
  └─ utils.js   ← escapeHtml
```

### CSS

`css/styles.css` usa CSS custom properties para el sistema de diseño (paleta teal/coral/purple/amber). No uses valores de color hardcodeados — referencia las variables existentes.

## Reglas críticas para agentes

### 1. Sincronización dual obligatoria
Cualquier cambio en datos de medicamentos o lógica de UI **debe reflejarse en ambos**:
- `dataset_final.json` + `prototipo_standalone.html` (datos embebidos)
- `index.html` + `js/*.js` (versión PWA)

### 2. Service Worker — bump de versión
Al modificar cualquier asset cacheado, incrementar el nombre del cache en `sw.js`:
```js
// antes:
const CACHE_NAME = 'manual-fosf20-v2';
// después de cambio:
const CACHE_NAME = 'manual-fosf20-v3';
```
Si no se hace, los usuarios verán la versión anterior indefinidamente.

### 3. Clave de localStorage (nombre legacy)
El historial usa la clave `medicheck_historial` (nombre anterior a la re-marca a VidaCheck). **No cambiar esta clave** sin migrar datos existentes de usuarios.

### 4. Schema del dataset — campos opcionales
No todos los medicamentos tienen todos los campos. Los únicos garantizados son `nombre_generico`, `nombre_base`, `clave`. Los demás son opcionales:
- `presentaciones[]` — solo si hay datos de estabilidad/administración
- `vida_multidosis[]` — solo si hay datos de multidosis
- `horario_vo` — solo si hay datos de administración oral
- `alto_riesgo` (objeto, no booleano) — solo en 57 medicamentos; contiene `pauta_vigilancia`
- `fuentes[]` — array con las hojas Excel que aportaron datos

Siempre usar optional chaining (`?.`) al leer campos de presentaciones o subcampos.

### 5. Fuera de alcance (no agregar)
Backend, autenticación, base de datos, ETL, bundlers, frameworks JS, dependencias npm. Ver [README.md](README.md) para la lista completa de lo diferido al MVP.

## Convenciones de código

- Nombres de funciones y variables en **camelCase español** (ej. `buscar`, `renderResultados`, `abrirFicha`)
- Sin comentarios que expliquen *qué* hace el código — solo el *por qué* cuando no sea obvio
- Sin `console.log` de depuración en commits
- `escapeHtml` de `utils.js` es obligatorio al insertar cualquier dato del dataset en el DOM

## Tests manuales sugeridos

Buscar estos medicamentos para verificar casos representativos:
`amiodarona` (alto riesgo), `vancomicina`, `morfina`, `acetaminofen`, `cefazolina`, `insulina`
