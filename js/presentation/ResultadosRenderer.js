import { escapeHtml } from '../utils/html.js';
import { normalizar }  from '../utils/normalizer.js';

// Pure Fabrication (GRASP): genera HTML de resultados sin lógica de negocio
// La lógica de tags y nombres vive en Medicamento (Information Expert)
export class ResultadosRenderer {
  constructor(container) {
    this._container = container;
  }

  renderVacio(totalMeds) {
    this._container.innerHTML = `
      <div class="empty-state">
        <p style="font-size: 15px; margin-bottom: 6px;">Busca por nombre genérico o comercial</p>
        <p style="font-size: 13px;">${totalMeds} medicamentos disponibles · 100% offline</p>
      </div>`;
  }

  renderHistorial(medicamentosConIdx) {
    let html = `
      <div class="stats">
        <span style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Consultados recientemente
        </span>
        <button data-action="clear-historial"
                style="font-size:12px;color:var(--text-muted);text-decoration:underline;cursor:pointer;">
          Borrar
        </button>
      </div>`;
    for (const { medicamento, idx } of medicamentosConIdx) {
      const comerciales = medicamento.getNombresComerciales();
      html += `
        <div class="result-item${medicamento.esAltoRiesgo ? ' is-riesgo' : ''}"
             data-idx="${idx}" tabindex="0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               style="color:var(--gray-400);flex-shrink:0;">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div style="flex:1; min-width: 0;">
            <div class="result-name">
              ${escapeHtml(medicamento.nombre)}${this._renderTags(medicamento)}
            </div>
            ${comerciales.length ? `<div class="result-meta">${escapeHtml(comerciales.join(' · '))}</div>` : ''}
            ${medicamento.raw.grupo_farmacologico
              ? `<span class="result-group">${escapeHtml(medicamento.raw.grupo_farmacologico)}</span>`
              : ''}
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               style="color:var(--gray-400);flex-shrink:0;">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>`;
    }
    this._container.innerHTML = html;
  }

  renderSinResultados(query) {
    this._container.innerHTML = `
      <div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <p style="font-size: 15px;">No encontramos "${escapeHtml(query)}"</p>
        <p style="font-size: 13px; margin-top: 4px;">Intenta con el nombre genérico o revisa la ortografía.</p>
      </div>`;
  }

  renderResultados(resultadosConMed, query) {
    const { length } = resultadosConMed;
    let html = `<div class="stats">
      <span>${length} resultado${length !== 1 ? 's' : ''}</span>
      <span>Toca para ver la ficha</span>
    </div>`;
    for (const { medicamento, idx } of resultadosConMed) {
      const comerciales = medicamento.getNombresComerciales();
      html += `
        <div class="result-item${medicamento.esAltoRiesgo ? ' is-riesgo' : ''}"
             data-idx="${idx}" tabindex="0">
          <div style="flex:1; min-width: 0;">
            <div class="result-name">
              ${this._resaltar(medicamento.nombre, query)}${this._renderTags(medicamento)}
            </div>
            ${comerciales.length ? `<div class="result-meta">${escapeHtml(comerciales.join(' · '))}</div>` : ''}
            ${medicamento.raw.grupo_farmacologico
              ? `<span class="result-group">${escapeHtml(medicamento.raw.grupo_farmacologico)}</span>`
              : ''}
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               style="color: var(--gray-400); flex-shrink: 0;">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>`;
    }
    this._container.innerHTML = html;
  }

  _renderTags(medicamento) {
    return medicamento.getTags()
      .map(t => `<span class="tag-${t.type}">${t.label}</span>`)
      .join('');
  }

  _resaltar(texto, query) {
    if (!query) return escapeHtml(texto);
    const qn  = normalizar(query);
    const tn  = normalizar(texto);
    const idx = tn.indexOf(qn);
    if (idx < 0) return escapeHtml(texto);
    return escapeHtml(texto.slice(0, idx))
      + '<em>' + escapeHtml(texto.slice(idx, idx + qn.length)) + '</em>'
      + escapeHtml(texto.slice(idx + qn.length));
  }
}
