import { SectionRenderer } from './SectionRenderer.js';
import { escapeHtml } from '../../utils/html.js';

const BOOK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;

// Strategy (GoF): implementación concreta para la sección "fuentes"
export class FuentesSection extends SectionRenderer {
  get iconClass() { return 'icon-gray'; }
  get iconSvg()   { return BOOK_SVG; }
  get title()     { return 'Fuentes consultadas'; }
  hasData(data)   { return data?.length > 0; }

  _renderBody(fuentes) {
    return `
      <div class="fuentes-list">
        ${fuentes.map(f => `<span class="fuente-chip">${escapeHtml(f)}</span>`).join('')}
      </div>
      <p style="font-size: 11px; color: var(--text-muted); margin-top: 10px;">
        Información consolidada del manual FO-SF-20 v8.1. No reemplaza el juicio clínico.
      </p>`;
  }
}
