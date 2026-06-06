import { AltoRiesgoSection }    from './sections/AltoRiesgoSection.js';
import { PresentacionesSection } from './sections/PresentacionesSection.js';
import { MultidosisSection }     from './sections/MultidosisSection.js';
import { HorarioVoSection }      from './sections/HorarioVoSection.js';
import { FuentesSection }        from './sections/FuentesSection.js';

// Factory Method (GoF): centraliza la creación de renderers de sección
// OCP (SOLID): agregar sección nueva = agregar entrada al registro, sin tocar código existente
const REGISTRY = {
  alto_riesgo:    AltoRiesgoSection,
  presentaciones: PresentacionesSection,
  multidosis:     MultidosisSection,
  horario_vo:     HorarioVoSection,
  fuentes:        FuentesSection,
};

export class SectionFactory {
  static create(type) {
    const Ctor = REGISTRY[type];
    if (!Ctor) throw new Error(`SectionFactory: tipo desconocido "${type}"`);
    return new Ctor();
  }
}
