export function normalizar(txt) {
  return (txt || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();
}

export function indexar(dataset) {
  return dataset.map((m, idx) => {
    const nombres = [];
    if (m.nombre_generico) nombres.push(m.nombre_generico);
    if (m.nombre_base) nombres.push(m.nombre_base);
    (m.presentaciones || []).forEach(p => {
      if (p.nombre_comercial) nombres.push(p.nombre_comercial);
    });
    (m.vida_multidosis || []).forEach(v => {
      if (v.marca) nombres.push(v.marca);
    });
    return {
      idx,
      haystack: normalizar(nombres.join(' ')),
      nombre_display: m.nombre_generico || m.nombre_base,
    };
  });
}

export function buscar(query, indice) {
  const q = normalizar(query);
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const resultados = [];
  for (const entry of indice) {
    let score = 0;
    let matchTokens = 0;
    for (const t of tokens) {
      if (entry.haystack.includes(t)) {
        matchTokens++;
        if (entry.haystack.startsWith(t)) score += 100;
        else if (entry.haystack.includes(' ' + t)) score += 50;
        else score += 10;
      }
    }
    if (matchTokens === tokens.length) {
      if (entry.haystack === q) score += 1000;
      if (entry.haystack.startsWith(q)) score += 200;
      resultados.push({ ...entry, score });
    }
  }
  resultados.sort((a, b) => b.score - a.score);
  return resultados.slice(0, 40);
}
