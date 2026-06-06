// Template Method (GoF): define el esqueleto de renderizado de sección
// Las subclases implementan los hooks sin cambiar la estructura

export const CHEVRON_SVG = `<svg class="section-toggle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>`;

export class SectionRenderer {
  get iconClass() { return 'icon-gray'; }
  get iconSvg()   { return ''; }
  get title()     { return ''; }

  hasData(data) { return Boolean(data); }

  // Template Method: esqueleto fijo — subclases no lo sobreescriben
  render(data) {
    if (!this.hasData(data)) return '';
    return this._wrapSection(
      this._renderHeader(),
      this._renderBody(data),
    );
  }

  _wrapSection(header, body) {
    return `<div class="section">${header}<div class="section-body">${body}</div></div>`;
  }

  _renderHeader() {
    return `
      <div class="section-header" data-toggle="section">
        <div class="section-icon ${this.iconClass}">${this.iconSvg}</div>
        <h3>${this.title}</h3>
        ${CHEVRON_SVG}
      </div>`;
  }

  // Hook abstracto: cada Strategy concreta lo implementa
  _renderBody(_data) {
    throw new Error(`${this.constructor.name} debe implementar _renderBody()`);
  }
}
