import { SectionRenderer } from './SectionRenderer.js';
import { escapeHtml } from '../../utils/html.js';

const VO_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 3H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6"/><polyline points="12 16 16 12 20 16"/><path d="M16 12v9"/><path d="M19 5h.01M15 5h.01M11 5h.01"/></svg>`;

// Strategy (GoF): implementación concreta para la sección "vía oral"
export class HorarioVoSection extends SectionRenderer {
  get iconClass() { return 'icon-purple'; }
  get iconSvg()   { return VO_SVG; }
  get title()     { return 'Administración por vía oral'; }
  hasData(data)   { return Boolean(data?.horario || data?.tomar_con); }

  _renderBody(horarioVO) {
    return `<dl class="kv">
      ${horarioVO.horario   ? `<dt>Horario</dt><dd>${escapeHtml(horarioVO.horario)}</dd>` : ''}
      ${horarioVO.tomar_con ? `<dt>Tomar con</dt><dd>${escapeHtml(horarioVO.tomar_con)}</dd>` : ''}
    </dl>`;
  }
}
