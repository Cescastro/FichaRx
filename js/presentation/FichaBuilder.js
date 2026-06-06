import { SectionFactory } from './SectionFactory.js';

// Builder (GoF) + Compose Method + SLAP:
// build() es una secuencia de pasos nombrados al mismo nivel de abstracción
export class FichaBuilder {
  constructor(medicamento) {
    this._med = medicamento;
  }

  build() {
    return [
      this._buildAlertaAltoRiesgo(),
      this._buildPresentaciones(),
      this._buildMultidosis(),
      this._buildHorarioVO(),
      this._buildFuentes(),
      this._buildFooter(),
    ].join('');
  }

  _buildAlertaAltoRiesgo() {
    return SectionFactory.create('alto_riesgo').render(this._med.raw.alto_riesgo);
  }

  _buildPresentaciones() {
    return SectionFactory.create('presentaciones').render(this._med.raw.presentaciones);
  }

  _buildMultidosis() {
    return SectionFactory.create('multidosis').render(this._med.raw.vida_multidosis);
  }

  _buildHorarioVO() {
    return SectionFactory.create('horario_vo').render(this._med.raw.horario_vo);
  }

  _buildFuentes() {
    return SectionFactory.create('fuentes').render(this._med.raw.fuentes);
  }

  _buildFooter() {
    return `<div class="footer-disclaimer">
      Prototipo con datos reales del manual FO-SF-20. Para uso de validación UX únicamente.
    </div>`;
  }
}
