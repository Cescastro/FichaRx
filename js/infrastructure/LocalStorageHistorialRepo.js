const KEY = 'medicheck_historial';

export class LocalStorageHistorialRepo {
  get() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }

  guardar(idx) {
    const h = this.get().filter(i => i !== idx);
    h.unshift(idx);
    localStorage.setItem(KEY, JSON.stringify(h.slice(0, 5)));
  }

  limpiar() {
    localStorage.removeItem(KEY);
  }
}
