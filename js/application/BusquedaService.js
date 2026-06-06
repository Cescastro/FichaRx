import { normalizar } from '../utils/normalizer.js';

// Pure Fabrication (GRASP): servicio sin contraparte en el dominio real
export class BusquedaService {
  constructor() {
    this._indice = [];
  }

  indexar(medicamentos) {
    this._indice = medicamentos.map((m, idx) => ({
      idx,
      haystack: normalizar(m.getTodosLosNombres().join(' ')),
    }));
  }

  buscar(query) {
    const q = normalizar(query);
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const resultados = [];
    for (const entry of this._indice) {
      const score = this._puntuar(entry.haystack, q, tokens);
      if (score > 0) resultados.push({ idx: entry.idx, score });
    }
    return resultados.sort((a, b) => b.score - a.score).slice(0, 40);
  }

  // Compose Method: un paso del algoritmo de puntuación por token
  _puntuar(haystack, q, tokens) {
    let score = 0;
    let matchTokens = 0;
    for (const t of tokens) {
      if (!haystack.includes(t)) continue;
      matchTokens++;
      if (haystack.startsWith(t))        score += 100;
      else if (haystack.includes(' ' + t)) score += 50;
      else                                score += 10;
    }
    if (matchTokens < tokens.length) return 0;
    if (haystack === q)              score += 1000;
    if (haystack.startsWith(q))      score += 200;
    return score;
  }
}
