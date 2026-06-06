import { Medicamento } from '../domain/Medicamento.js';

// DIP (SOLID): los Commands dependen de este contrato, no de fetch/localStorage directamente
export class JsonMedicamentosRepository {
  constructor() {
    this._data = [];
  }

  async load() {
    const raw = window.__STANDALONE_DATA__
      || await fetch('dataset_final.json').then(r => r.json());
    this._data = raw.map(m => new Medicamento(m));
    return this._data;
  }

  getByIndex(idx) {
    return this._data[idx] ?? null;
  }

  getAll() {
    return this._data;
  }
}
