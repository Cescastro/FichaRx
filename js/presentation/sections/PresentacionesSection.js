import { SectionRenderer, CHEVRON_SVG } from './SectionRenderer.js';
import { escapeHtml } from '../../utils/html.js';
import { Medicamento } from '../../domain/Medicamento.js';

const PILL_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`;
const PRES_CHEVRON = `<svg class="pres-toggle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>`;

const CAMPOS_SEGURIDAD = [
  { key: 'embarazo',          label: 'Embarazo' },
  { key: 'lactancia',         label: 'Lactancia' },
  { key: 'fotosensibilidad',  label: 'Fotosensibilidad' },
  { key: 'bomba_infusion',    label: 'Bomba infusión' },
  { key: 'alcohol_bencilico', label: 'Alcohol bencílico' },
];

// Strategy (GoF): implementación concreta para la sección "presentaciones y estabilidad"
export class PresentacionesSection extends SectionRenderer {
  get iconClass() { return 'icon-teal'; }
  get iconSvg()   { return PILL_SVG; }
  get title()     { return `Presentaciones y estabilidad (${this._count})`; }
  hasData(data)   { return data?.length > 0; }

  // Sobreescribe render() para fijar el contador antes de que _renderHeader() lea `title`
  render(presentaciones) {
    this._count = presentaciones?.length ?? 0;
    return super.render(presentaciones);
  }

  // Compose Method: cada llamada nombra explícitamente un bloque de la tarjeta
  _renderBody(presentaciones) {
    return presentaciones
      .map((p, i) => this._renderTarjeta(p, i > 0 && presentaciones.length > 1))
      .join('');
  }

  _renderTarjeta(p, autoCollapsed) {
    return `
      <div class="presentacion-card${autoCollapsed ? ' collapsed' : ''}">
        ${this._renderCabecera(p)}
        <div class="pres-body">
          ${this._renderReconstitucion(p)}
          ${this._renderDilucion(p)}
          ${this._renderAdministracion(p)}
          ${this._renderSeguridad(p)}
          ${this._renderPropiedadesFQ(p)}
          ${this._renderObservaciones(p)}
          ${this._renderReferencia(p)}
        </div>
      </div>`;
  }

  _renderCabecera(p) {
    return `
      <div class="pres-head" data-toggle="pres">
        <span class="pres-name">${escapeHtml(p.nombre_comercial || 'Sin marca')}</span>
        ${p.laboratorio ? `<span class="pres-lab">${escapeHtml(p.laboratorio)}</span>` : ''}
        ${p.presentacion || p.forma_farmaceutica
          ? `<span class="pres-sub">${escapeHtml(p.presentacion || p.forma_farmaceutica)}</span>`
          : ''}
        ${PRES_CHEVRON}
      </div>`;
  }

  _renderReconstitucion(p) {
    if (p.reconstitucion && Object.keys(p.reconstitucion).length) {
      return `<div class="subsection"><div class="subsection-title">Reconstitución</div><dl class="kv">
        ${p.reconstitucion.vehiculo                  ? `<dt>Vehículo</dt><dd>${escapeHtml(p.reconstitucion.vehiculo)}</dd>` : ''}
        ${p.reconstitucion.cantidad_ml               ? `<dt>Cantidad (mL)</dt><dd>${escapeHtml(p.reconstitucion.cantidad_ml)}</dd>` : ''}
        ${p.reconstitucion.temperatura_almacenamiento ? `<dt>Temperatura</dt><dd>${escapeHtml(p.reconstitucion.temperatura_almacenamiento)}</dd>` : ''}
        ${p.reconstitucion.tiempo_estabilidad         ? `<dt>Tiempo estabilidad</dt><dd>${escapeHtml(p.reconstitucion.tiempo_estabilidad)}</dd>` : ''}
      </dl></div>`;
    }
    if (p.volumen_reconstitucion || p.concentracion_final) {
      return `<div class="subsection"><div class="subsection-title">Reconstitución</div><dl class="kv">
        ${p.volumen_reconstitucion ? `<dt>Volumen</dt><dd>${escapeHtml(p.volumen_reconstitucion)}</dd>` : ''}
        ${p.concentracion_final    ? `<dt>Concentración final</dt><dd>${escapeHtml(p.concentracion_final)}</dd>` : ''}
      </dl></div>`;
    }
    return '';
  }

  _renderDilucion(p) {
    if (p.diluciones?.length) {
      const validas = p.diluciones.filter(d => d.solucion);
      if (!validas.length) return '';
      return `<div class="subsection"><div class="subsection-title">Dilución — Soluciones compatibles</div>
        ${validas.map(d => this._renderFilaDilucion(d)).join('')}
      </div>`;
    }
    if (p.solucion_dilucion || p.estabilidad_ficha_tecnica) {
      return `<div class="subsection"><div class="subsection-title">Dilución</div><dl class="kv">
        ${p.solucion_dilucion          ? `<dt>Solución</dt><dd>${escapeHtml(p.solucion_dilucion)}</dd>` : ''}
        ${p.estabilidad_ficha_tecnica  ? `<dt>Estabilidad (ficha técnica)</dt><dd>${escapeHtml(p.estabilidad_ficha_tecnica)}</dd>` : ''}
        ${p.estabilidad_otra_ref       ? `<dt>Estabilidad (otra ref.)</dt><dd>${escapeHtml(p.estabilidad_otra_ref)}</dd>` : ''}
        ${p.proteccion_luz             ? `<dt>Protección luz</dt><dd>${escapeHtml(p.proteccion_luz)}</dd>` : ''}
        ${p.refrigeracion              ? `<dt>Refrigeración</dt><dd>${escapeHtml(p.refrigeracion)}</dd>` : ''}
      </dl></div>`;
    }
    return '';
  }

  _renderFilaDilucion(d) {
    const meta = [];
    if (d.temperatura) meta.push(d.temperatura);
    // Bugfix: String() protege contra valores numéricos en unidad_tiempo
    if (d.estabilidad_valor && d.unidad_tiempo) {
      meta.push(`${d.estabilidad_valor} ${String(d.unidad_tiempo).toLowerCase()}`);
    } else if (d.estabilidad_valor) {
      meta.push(d.estabilidad_valor);
    } else if (d.unidad_tiempo) {
      meta.push(d.unidad_tiempo);
    }
    return `<div class="dilucion-row">
      <div class="dilucion-solucion">${escapeHtml(d.solucion)}</div>
      ${meta.length ? `<div class="dilucion-meta">${escapeHtml(meta.join(' · '))}</div>` : ''}
    </div>`;
  }

  _renderAdministracion(p) {
    if (!p.administracion || !Object.values(p.administracion).some(v => v)) return '';
    return `<div class="subsection"><div class="subsection-title">Administración</div><dl class="kv">
      ${p.administracion.via                      ? `<dt>Vía</dt><dd>${escapeHtml(p.administracion.via)}</dd>` : ''}
      ${p.administracion.concentracion_infusion   ? `<dt>Concentración / infusión</dt><dd>${escapeHtml(p.administracion.concentracion_infusion)}</dd>` : ''}
      ${p.administracion.max_concentracion_pediatria ? `<dt>Máx. pediatría</dt><dd>${escapeHtml(p.administracion.max_concentracion_pediatria)}</dd>` : ''}
    </dl></div>`;
  }

  _renderSeguridad(p) {
    if (!p.seguridad || !Object.values(p.seguridad).some(v => v)) return '';
    const items = CAMPOS_SEGURIDAD
      .filter(({ key }) => p.seguridad[key])
      .map(({ key, label }) => {
        const val = p.seguridad[key];
        const cls  = Medicamento.getSafetyLevel(key, val);
        const icon = Medicamento.getSafetyIcon(cls);
        return `<div class="safety-item safety-${cls}">
          <span class="safety-label">${icon} ${label}</span>
          <span class="safety-value">${escapeHtml(val)}</span>
        </div>`;
      })
      .join('');
    return `<div class="subsection"><div class="subsection-title">Seguridad</div>
      <div class="safety-grid">${items}</div>
    </div>`;
  }

  _renderPropiedadesFQ(p) {
    if (!p.propiedades_fq || !Object.values(p.propiedades_fq).some(v => v)) return '';
    return `<div class="subsection"><div class="subsection-title">Propiedades fisicoquímicas</div><dl class="kv">
      ${p.propiedades_fq.pH          ? `<dt>pH</dt><dd>${escapeHtml(p.propiedades_fq.pH)}</dd>` : ''}
      ${p.propiedades_fq.osmolaridad ? `<dt>Osmolaridad</dt><dd>${escapeHtml(p.propiedades_fq.osmolaridad)}</dd>` : ''}
    </dl></div>`;
  }

  _renderObservaciones(p) {
    if (!p.observaciones) return '';
    return `<div class="subsection"><div class="subsection-title">Observaciones</div>
      <div class="prose">${escapeHtml(p.observaciones)}</div>
    </div>`;
  }

  _renderReferencia(p) {
    const ref = p.referencia || p.referencia_bibliografica;
    if (!ref) return '';
    return `<div class="subsection" style="font-size: 11px; color: var(--text-muted);">📚 ${escapeHtml(ref)}</div>`;
  }
}
