// Information Expert (GRASP): toda lógica derivada de datos vive aquí
export class Medicamento {
  constructor(raw) {
    this.raw = raw;
  }

  get nombre() {
    return this.raw.nombre_generico || this.raw.nombre_base;
  }

  get subtitulo() {
    const { grupo_farmacologico, subgrupo } = this.raw;
    if (!grupo_farmacologico) return 'Información consolidada del manual';
    return subgrupo ? `${grupo_farmacologico} · ${subgrupo}` : grupo_farmacologico;
  }

  get esAltoRiesgo() {
    return Boolean(this.raw.alto_riesgo);
  }

  get esOncologico() {
    return (this.raw.presentaciones || []).some(p => p.fuente === 'oncologicos');
  }

  get esFotosensible() {
    return (this.raw.presentaciones || [])
      .some(p => p.seguridad?.fotosensibilidad?.toUpperCase() === 'SI');
  }

  getTags() {
    return [
      this.esAltoRiesgo   && { type: 'riesgo', label: 'ALTO RIESGO' },
      this.esOncologico   && { type: 'onco',   label: 'ONCOLÓGICO' },
      this.esFotosensible && { type: 'foto',   label: 'FOTOSENSIBLE' },
    ].filter(Boolean);
  }

  getNombresComerciales(max = 3) {
    const set = new Set();
    (this.raw.presentaciones  || []).forEach(p => p.nombre_comercial && set.add(p.nombre_comercial));
    (this.raw.vida_multidosis || []).forEach(v => v.marca && set.add(v.marca));
    return [...set].slice(0, max);
  }

  getTodosLosNombres() {
    const nombres = [];
    if (this.raw.nombre_generico) nombres.push(this.raw.nombre_generico);
    if (this.raw.nombre_base)     nombres.push(this.raw.nombre_base);
    (this.raw.presentaciones  || []).forEach(p => p.nombre_comercial && nombres.push(p.nombre_comercial));
    (this.raw.vida_multidosis || []).forEach(v => v.marca && nombres.push(v.marca));
    return nombres;
  }

  // Regla clínica: nivel de seguridad de un campo dado su valor
  static getSafetyLevel(key, value) {
    const v = (value || '').toUpperCase().trim();
    if (!v) return 'neutral';
    if (key === 'fotosensibilidad') {
      if (v === 'SI' || v === 'SÍ') return 'caution';
      if (v === 'NO') return 'ok';
      return 'neutral';
    }
    if (v.includes('NO SE CONTRAINDICA') || v.includes('COMPATIBLE') || v.includes('PERMITID')) return 'ok';
    if (v === 'NO' || v.includes('CONTRAINDICAD') || v.includes('NO SE RECOMIENDA') ||
        v.includes('PROHIBID') || v.includes('CATEGORÍA X')) return 'danger';
    if (v.includes('PRECAUCIÓN') || v.includes('PRECAUCION') || v.includes('CAUTELA') ||
        v.includes('VIGILAR')    || v.includes('MONITOREAR')) return 'caution';
    return 'neutral';
  }

  static getSafetyIcon(level) {
    if (level === 'ok')      return '✓';
    if (level === 'danger')  return '✗';
    if (level === 'caution') return '⚠';
    return '·';
  }
}
