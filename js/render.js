import { normalizar } from './search.js';
import { escapeHtml } from './utils.js';
import { getHistorial } from './history.js';

function resaltar(texto, query) {
  if (!query) return escapeHtml(texto);
  const qn = normalizar(query);
  const tn = normalizar(texto);
  const idx = tn.indexOf(qn);
  if (idx < 0) return escapeHtml(texto);
  return escapeHtml(texto.slice(0, idx))
    + '<em>' + escapeHtml(texto.slice(idx, idx + qn.length)) + '</em>'
    + escapeHtml(texto.slice(idx + qn.length));
}

export function renderResultados(resultados, query, data) {
  const cont = document.getElementById('results');
  if (!query) {
    const historial = getHistorial().filter(i => data[i]);
    if (!historial.length) {
      cont.innerHTML = `
        <div class="empty-state">
          <div style="background:white;border-radius:16px;padding:16px 20px;margin-bottom:20px;box-shadow:0 4px 16px rgba(0,0,0,0.10);display:inline-block;">
            <img src="VidaCheck_full.png" alt="VidaCheck" style="width:240px;height:auto;display:block;">
          </div>
          <p style="font-size: 15px; margin-bottom: 6px;">Busca por nombre genérico o comercial</p>
          <p style="font-size: 13px;">${data.length} medicamentos disponibles · 100% offline</p>
        </div>`;
      return;
    }
    let html = `
      <div class="stats">
        <span style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Consultados recientemente
        </span>
        <button onclick="clearHistorial()" style="font-size:12px;color:var(--text-muted);text-decoration:underline;cursor:pointer;">Borrar</button>
      </div>`;
    for (const idx of historial) {
      const m = data[idx];
      const tags = [];
      if (m.alto_riesgo) tags.push('<span class="tag-riesgo">ALTO RIESGO</span>');
      const esOnco = (m.presentaciones || []).some(p => p.fuente === 'oncologicos');
      if (esOnco) tags.push('<span class="tag-onco">ONCOLÓGICO</span>');
      const esFoto = (m.presentaciones || []).some(p => p.seguridad && p.seguridad.fotosensibilidad && p.seguridad.fotosensibilidad.toUpperCase() === 'SI');
      if (esFoto) tags.push('<span class="tag-foto">FOTOSENSIBLE</span>');
      const comerciales = new Set();
      (m.presentaciones || []).forEach(p => { if (p.nombre_comercial) comerciales.add(p.nombre_comercial); });
      (m.vida_multidosis || []).forEach(v => { if (v.marca) comerciales.add(v.marca); });
      const comercialesText = [...comerciales].slice(0, 3).join(' · ');
      html += `
        <div class="result-item" tabindex="0" onclick="abrirFicha(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirFicha(${idx})}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gray-400);flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div style="flex:1; min-width: 0;">
            <div class="result-name">${escapeHtml(m.nombre_generico || m.nombre_base)}${tags.join('')}</div>
            ${comercialesText ? `<div class="result-meta">${escapeHtml(comercialesText)}</div>` : ''}
            ${m.grupo_farmacologico ? `<span class="result-group">${escapeHtml(m.grupo_farmacologico)}</span>` : ''}
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gray-400);flex-shrink:0;"><path d="m9 18 6-6-6-6"/></svg>
        </div>`;
    }
    cont.innerHTML = html;
    return;
  }
  if (resultados.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <p style="font-size: 15px;">No encontramos "${escapeHtml(query)}"</p>
        <p style="font-size: 13px; margin-top: 4px;">Intenta con el nombre genérico o revisa la ortografía.</p>
      </div>`;
    return;
  }

  let html = `<div class="stats"><span>${resultados.length} resultado${resultados.length !== 1 ? 's' : ''}</span><span>Toca para ver la ficha</span></div>`;
  for (const r of resultados) {
    const m = data[r.idx];
    const tags = [];
    if (m.alto_riesgo) tags.push('<span class="tag-riesgo">ALTO RIESGO</span>');
    const esOnco = (m.presentaciones || []).some(p => p.fuente === 'oncologicos');
    if (esOnco) tags.push('<span class="tag-onco">ONCOLÓGICO</span>');
    const esFoto = (m.presentaciones || []).some(p => p.seguridad && p.seguridad.fotosensibilidad && p.seguridad.fotosensibilidad.toUpperCase() === 'SI');
    if (esFoto) tags.push('<span class="tag-foto">FOTOSENSIBLE</span>');
    const comerciales = new Set();
    (m.presentaciones || []).forEach(p => { if (p.nombre_comercial) comerciales.add(p.nombre_comercial); });
    (m.vida_multidosis || []).forEach(v => { if (v.marca) comerciales.add(v.marca); });
    const comercialesText = [...comerciales].slice(0, 3).join(' · ');
    html += `
      <div class="result-item" tabindex="0" onclick="abrirFicha(${r.idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirFicha(${r.idx})}">
        <div style="flex:1; min-width: 0;">
          <div class="result-name">${resaltar(m.nombre_generico || m.nombre_base, query)}${tags.join('')}</div>
          ${comercialesText ? `<div class="result-meta">${escapeHtml(comercialesText)}</div>` : ''}
          ${m.grupo_farmacologico ? `<span class="result-group">${escapeHtml(m.grupo_farmacologico)}</span>` : ''}
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--gray-400); flex-shrink: 0;">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>`;
  }
  cont.innerHTML = html;
}
