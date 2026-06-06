import { escapeHtml } from './utils.js';
import { saveHistorial } from './history.js';

function safetyClass(field, value) {
  const v = (value || '').toUpperCase().trim();
  if (!v) return 'neutral';
  if (field === 'fotosensibilidad') {
    if (v === 'SI' || v === 'SÍ') return 'caution';
    if (v === 'NO') return 'ok';
    return 'neutral';
  }
  if (v.includes('NO SE CONTRAINDICA') || v.includes('COMPATIBLE') || v.includes('PERMITID')) return 'ok';
  if (v === 'NO' || v.includes('CONTRAINDICAD') || v.includes('NO SE RECOMIENDA') || v.includes('PROHIBID') || v.includes('CATEGORÍA X')) return 'danger';
  if (v.includes('PRECAUCIÓN') || v.includes('PRECAUCION') || v.includes('CAUTELA') || v.includes('VIGILAR') || v.includes('MONITOREAR')) return 'caution';
  return 'neutral';
}

function safetyIcon(cls) {
  if (cls === 'ok')      return '✓';
  if (cls === 'danger')  return '✗';
  if (cls === 'caution') return '⚠';
  return '·';
}

export function abrirFicha(idx, data) {
  saveHistorial(idx);
  const m = data[idx];
  document.getElementById('ficha-title').textContent = m.nombre_generico || m.nombre_base;
  document.getElementById('ficha-subtitle').textContent = m.grupo_farmacologico
    ? (m.subgrupo ? `${m.grupo_farmacologico} · ${m.subgrupo}` : m.grupo_farmacologico)
    : 'Información consolidada del manual';

  const cont = document.getElementById('ficha-content');
  let html = '';

  const riesgoStrip = document.getElementById('riesgo-strip');
  if (m.alto_riesgo) {
    riesgoStrip.style.display = 'flex';
    if (m.alto_riesgo.pauta_vigilancia) {
      html += `
        <div class="alert-banner alert-riesgo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div><div style="font-size: 13px;">${escapeHtml(m.alto_riesgo.pauta_vigilancia)}</div></div>
        </div>`;
    }
  } else {
    riesgoStrip.style.display = 'none';
  }

  if (m.presentaciones && m.presentaciones.length) {
    html += `
      <div class="section">
        <div class="section-header">
          <div class="section-icon icon-teal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/>
            </svg>
          </div>
          <h3>Presentaciones y estabilidad (${m.presentaciones.length})</h3>
        </div>
        <div class="section-body">`;

    m.presentaciones.forEach(p => {
      html += `<div class="presentacion-card">`;
      html += `<div class="pres-head">`;
      html += `<span class="pres-name">${escapeHtml(p.nombre_comercial || 'Sin marca')}</span>`;
      if (p.laboratorio) html += `<span class="pres-lab">${escapeHtml(p.laboratorio)}</span>`;
      if (p.presentacion || p.forma_farmaceutica) {
        html += `<span class="pres-sub">${escapeHtml(p.presentacion || p.forma_farmaceutica)}</span>`;
      }
      html += `</div>`;

      if (p.reconstitucion && Object.keys(p.reconstitucion).length) {
        html += `<div class="subsection"><div class="subsection-title">Reconstitución</div><dl class="kv">`;
        if (p.reconstitucion.vehiculo) html += `<dt>Vehículo</dt><dd>${escapeHtml(p.reconstitucion.vehiculo)}</dd>`;
        if (p.reconstitucion.cantidad_ml) html += `<dt>Cantidad (mL)</dt><dd>${escapeHtml(p.reconstitucion.cantidad_ml)}</dd>`;
        if (p.reconstitucion.temperatura_almacenamiento) html += `<dt>Temperatura</dt><dd>${escapeHtml(p.reconstitucion.temperatura_almacenamiento)}</dd>`;
        if (p.reconstitucion.tiempo_estabilidad) html += `<dt>Tiempo estabilidad</dt><dd>${escapeHtml(p.reconstitucion.tiempo_estabilidad)}</dd>`;
        html += `</dl></div>`;
      } else if (p.volumen_reconstitucion || p.concentracion_final) {
        html += `<div class="subsection"><div class="subsection-title">Reconstitución</div><dl class="kv">`;
        if (p.volumen_reconstitucion) html += `<dt>Volumen</dt><dd>${escapeHtml(p.volumen_reconstitucion)}</dd>`;
        if (p.concentracion_final) html += `<dt>Concentración final</dt><dd>${escapeHtml(p.concentracion_final)}</dd>`;
        html += `</dl></div>`;
      }

      if (p.diluciones && p.diluciones.length) {
        const validas = p.diluciones.filter(d => d.solucion);
        if (validas.length) {
          html += `<div class="subsection"><div class="subsection-title">Dilución — Soluciones compatibles</div>`;
          validas.forEach(d => {
            html += `<div class="dilucion-row">`;
            html += `<div class="dilucion-solucion">${escapeHtml(d.solucion)}</div>`;
            const meta = [];
            if (d.temperatura) meta.push(d.temperatura);
            if (d.estabilidad_valor && d.unidad_tiempo) meta.push(`${d.estabilidad_valor} ${d.unidad_tiempo.toLowerCase()}`);
            else if (d.estabilidad_valor) meta.push(d.estabilidad_valor);
            else if (d.unidad_tiempo) meta.push(d.unidad_tiempo);
            if (meta.length) html += `<div class="dilucion-meta">${escapeHtml(meta.join(' · '))}</div>`;
            html += `</div>`;
          });
          html += `</div>`;
        }
      } else if (p.solucion_dilucion || p.estabilidad_ficha_tecnica) {
        html += `<div class="subsection"><div class="subsection-title">Dilución</div><dl class="kv">`;
        if (p.solucion_dilucion) html += `<dt>Solución</dt><dd>${escapeHtml(p.solucion_dilucion)}</dd>`;
        if (p.estabilidad_ficha_tecnica) html += `<dt>Estabilidad (ficha técnica)</dt><dd>${escapeHtml(p.estabilidad_ficha_tecnica)}</dd>`;
        if (p.estabilidad_otra_ref) html += `<dt>Estabilidad (otra ref.)</dt><dd>${escapeHtml(p.estabilidad_otra_ref)}</dd>`;
        if (p.proteccion_luz) html += `<dt>Protección luz</dt><dd>${escapeHtml(p.proteccion_luz)}</dd>`;
        if (p.refrigeracion) html += `<dt>Refrigeración</dt><dd>${escapeHtml(p.refrigeracion)}</dd>`;
        html += `</dl></div>`;
      }

      if (p.administracion && Object.values(p.administracion).some(v => v)) {
        html += `<div class="subsection"><div class="subsection-title">Administración</div><dl class="kv">`;
        if (p.administracion.via) html += `<dt>Vía</dt><dd>${escapeHtml(p.administracion.via)}</dd>`;
        if (p.administracion.concentracion_infusion) html += `<dt>Concentración / infusión</dt><dd>${escapeHtml(p.administracion.concentracion_infusion)}</dd>`;
        if (p.administracion.max_concentracion_pediatria) html += `<dt>Máx. pediatría</dt><dd>${escapeHtml(p.administracion.max_concentracion_pediatria)}</dd>`;
        html += `</dl></div>`;
      }

      if (p.seguridad && Object.values(p.seguridad).some(v => v)) {
        html += `<div class="subsection"><div class="subsection-title">Seguridad</div><div class="safety-grid">`;
        const campos = [
          { key: 'embarazo',        label: 'Embarazo' },
          { key: 'lactancia',       label: 'Lactancia' },
          { key: 'fotosensibilidad',label: 'Fotosensibilidad' },
          { key: 'bomba_infusion',  label: 'Bomba infusión' },
          { key: 'alcohol_bencilico', label: 'Alcohol bencílico' },
        ];
        campos.forEach(({ key, label }) => {
          const val = p.seguridad[key];
          if (!val) return;
          const cls = safetyClass(key, val);
          html += `<div class="safety-item safety-${cls}">
            <span class="safety-label">${safetyIcon(cls)} ${label}</span>
            <span class="safety-value">${escapeHtml(val)}</span>
          </div>`;
        });
        html += `</div></div>`;
      }

      if (p.propiedades_fq && Object.values(p.propiedades_fq).some(v => v)) {
        html += `<div class="subsection"><div class="subsection-title">Propiedades fisicoquímicas</div><dl class="kv">`;
        if (p.propiedades_fq.pH) html += `<dt>pH</dt><dd>${escapeHtml(p.propiedades_fq.pH)}</dd>`;
        if (p.propiedades_fq.osmolaridad) html += `<dt>Osmolaridad</dt><dd>${escapeHtml(p.propiedades_fq.osmolaridad)}</dd>`;
        html += `</dl></div>`;
      }

      if (p.observaciones) {
        html += `<div class="subsection"><div class="subsection-title">Observaciones</div><div class="prose">${escapeHtml(p.observaciones)}</div></div>`;
      }

      if (p.referencia || p.referencia_bibliografica) {
        html += `<div class="subsection" style="font-size: 11px; color: var(--text-muted);">📚 ${escapeHtml(p.referencia || p.referencia_bibliografica)}</div>`;
      }

      html += `</div>`;
    });
    html += `</div></div>`;
  }

  if (m.vida_multidosis && m.vida_multidosis.length) {
    html += `
      <div class="section">
        <div class="section-header">
          <div class="section-icon icon-amber">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3>Vida útil después de apertura (multidosis)</h3>
        </div>
        <div class="section-body">`;
    m.vida_multidosis.forEach(v => {
      html += `<div class="presentacion-card">`;
      if (v.marca || v.laboratorio) {
        html += `<div class="pres-head">`;
        if (v.marca) html += `<span class="pres-name">${escapeHtml(v.marca)}</span>`;
        if (v.laboratorio) html += `<span class="pres-lab">${escapeHtml(v.laboratorio)}</span>`;
        html += `</div>`;
      }
      html += `<dl class="kv">`;
      if (v.presentacion) html += `<dt>Presentación</dt><dd>${escapeHtml(v.presentacion)}</dd>`;
      if (v.tiempo_post_apertura) html += `<dt>Tiempo tras apertura</dt><dd><strong>${escapeHtml(v.tiempo_post_apertura)}</strong></dd>`;
      if (v.condiciones_conservacion) html += `<dt>Conservación</dt><dd>${escapeHtml(v.condiciones_conservacion)}</dd>`;
      if (v.bibliografia) html += `<dt>Bibliografía</dt><dd style="font-size: 11px; color: var(--text-muted);">${escapeHtml(v.bibliografia)}</dd>`;
      html += `</dl></div>`;
    });
    html += `</div></div>`;
  }

  if (m.horario_vo) {
    html += `
      <div class="section">
        <div class="section-header">
          <div class="section-icon icon-purple">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 3H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6"/><polyline points="12 16 16 12 20 16"/><path d="M16 12v9"/><path d="M19 5h.01M15 5h.01M11 5h.01"/>
            </svg>
          </div>
          <h3>Administración por vía oral</h3>
        </div>
        <div class="section-body"><dl class="kv">`;
    if (m.horario_vo.horario) html += `<dt>Horario</dt><dd>${escapeHtml(m.horario_vo.horario)}</dd>`;
    if (m.horario_vo.tomar_con) html += `<dt>Tomar con</dt><dd>${escapeHtml(m.horario_vo.tomar_con)}</dd>`;
    html += `</dl></div></div>`;
  }

  if (m.fuentes && m.fuentes.length) {
    html += `
      <div class="section">
        <div class="section-header">
          <div class="section-icon icon-gray">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h3>Fuentes consultadas</h3>
        </div>
        <div class="section-body">
          <div class="fuentes-list">
            ${m.fuentes.map(f => `<span class="fuente-chip">${escapeHtml(f)}</span>`).join('')}
          </div>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 10px;">
            Información consolidada del manual FO-SF-20 v8.1. No reemplaza el juicio clínico.
          </p>
        </div>
      </div>`;
  }

  html += `<div class="footer-disclaimer">
    Prototipo con datos reales del manual FO-SF-20. Para uso de validación UX únicamente.
  </div>`;

  cont.innerHTML = html;
  document.getElementById('ficha').classList.add('open');
  document.getElementById('ficha').scrollTop = 0;
  history.pushState({ view: 'ficha', idx }, '', '#med-' + idx);
}

export function cerrarFicha() {
  document.getElementById('ficha').classList.remove('open');
  if (location.hash.startsWith('#med-')) history.back();
}
