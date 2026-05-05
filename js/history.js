const HISTORIAL_KEY = 'medicheck_historial';

export function getHistorial() {
  try { return JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]'); } catch { return []; }
}

export function saveHistorial(idx) {
  let h = getHistorial().filter(i => i !== idx);
  h.unshift(idx);
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(h.slice(0, 5)));
}

export function clearHistorial() {
  localStorage.removeItem(HISTORIAL_KEY);
}
