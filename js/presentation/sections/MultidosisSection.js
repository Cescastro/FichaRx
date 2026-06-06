import { SectionRenderer } from './SectionRenderer.js';
import { escapeHtml } from '../../utils/html.js';

const CLOCK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

// Strategy (GoF): implementación concreta para la sección "vida multidosis"
export class MultidosisSection extends SectionRenderer {
  get iconClass() { return 'icon-amber'; }
  get iconSvg()   { return CLOCK_SVG; }
  get title()     { return 'Vida útil después de apertura (multidosis)'; }
  hasData(data)   { return data?.length > 0; }

  _renderBody(vidaMultidosis) {
    return vidaMultidosis.map(v => this._renderCard(v)).join('');
  }

  _renderCard(v) {
    return `<div class="presentacion-card">
      ${this._renderCabecera(v)}
      <dl class="kv">
        ${v.presentacion        ? `<dt>Presentación</dt><dd>${escapeHtml(v.presentacion)}</dd>` : ''}
        ${v.tiempo_post_apertura ? `<dt>Tiempo tras apertura</dt><dd><strong>${escapeHtml(v.tiempo_post_apertura)}</strong></dd>` : ''}
        ${v.condiciones_conservacion ? `<dt>Conservación</dt><dd>${escapeHtml(v.condiciones_conservacion)}</dd>` : ''}
        ${v.bibliografia        ? `<dt>Bibliografía</dt><dd style="font-size: 11px; color: var(--text-muted);">${escapeHtml(v.bibliografia)}</dd>` : ''}
      </dl>
    </div>`;
  }

  _renderCabecera(v) {
    if (!v.marca && !v.laboratorio) return '';
    return `<div class="pres-head">
      ${v.marca       ? `<span class="pres-name">${escapeHtml(v.marca)}</span>` : ''}
      ${v.laboratorio ? `<span class="pres-lab">${escapeHtml(v.laboratorio)}</span>` : ''}
    </div>`;
  }
}
