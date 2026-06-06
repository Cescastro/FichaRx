import { FichaBuilder } from './FichaBuilder.js';

// Pure Fabrication (GRASP): abstrae el DOM de la ficha; los Commands no tocan el DOM directamente
export class FichaView {
  constructor() {
    this._overlay    = document.getElementById('ficha');
    this._container  = document.getElementById('ficha-content');
    this._titleEl    = document.getElementById('ficha-title');
    this._subtitleEl = document.getElementById('ficha-subtitle');
    this._riesgoBar  = document.getElementById('riesgo-strip');
  }

  renderHeader(medicamento) {
    this._titleEl.textContent    = medicamento.nombre;
    this._subtitleEl.textContent = medicamento.subtitulo;
    this._riesgoBar.style.display = medicamento.esAltoRiesgo ? 'flex' : 'none';
  }

  renderContent(medicamento) {
    this._container.innerHTML = new FichaBuilder(medicamento).build();
  }

  open() {
    this._overlay.classList.add('open');
    this._overlay.scrollTop = 0;
  }

  close() {
    this._overlay.classList.remove('open');
  }

  isOpen() {
    return this._overlay.classList.contains('open');
  }

  navigateTo(idx) {
    history.pushState({ view: 'ficha', idx }, '', '#med-' + idx);
  }
}
