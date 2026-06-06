import { escapeHtml } from '../../utils/html.js';

// Renderer independiente (no extiende SectionRenderer — no es una sección colapsable)
export class AltoRiesgoSection {
  render(altoRiesgo) {
    if (!altoRiesgo?.pauta_vigilancia) return '';
    return `
      <div class="alert-banner alert-riesgo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div><div style="font-size: 13px;">${escapeHtml(altoRiesgo.pauta_vigilancia)}</div></div>
      </div>`;
  }
}
