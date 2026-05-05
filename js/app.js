import { indexar, buscar } from './search.js';
import { renderResultados } from './render.js';
import { abrirFicha, cerrarFicha } from './ficha.js';
import { clearHistorial } from './history.js';

let DATA = [];
let INDICE = [];

function updateOnline() {
  const dot = document.getElementById('online-dot');
  const text = document.getElementById('offline-text');
  if (navigator.onLine) {
    dot.classList.remove('off');
    text.textContent = 'Disponible offline';
  } else {
    dot.classList.add('off');
    text.textContent = 'Sin conexión · funcionando';
  }
}

function showTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('hidden', p.id !== 'tab-' + name);
  });
  window.scrollTo(0, 0);
  if (name === 'inicio') {
    setTimeout(() => document.getElementById('search').focus(), 50);
  }
}

async function init() {
  try {
    if (window.__STANDALONE_DATA__) {
      DATA = window.__STANDALONE_DATA__;
    } else {
      const res = await fetch('dataset_final.json');
      DATA = await res.json();
    }
    INDICE = indexar(DATA);
    renderResultados([], '', DATA);
  } catch {
    document.getElementById('results').innerHTML =
      '<div class="empty-state"><p>Error cargando el manual. Refresca la página.</p></div>';
  }
}

document.getElementById('search').addEventListener('input', (e) => {
  const q = e.target.value;
  renderResultados(buscar(q, INDICE), q, DATA);
});

document.getElementById('back-btn').addEventListener('click', cerrarFicha);

window.addEventListener('popstate', (e) => {
  if (!e.state || e.state.view !== 'ficha') {
    document.getElementById('ficha').classList.remove('open');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('ficha').classList.contains('open')) {
    cerrarFicha();
  }
  if (e.key === '/' && !e.target.matches('input')) {
    e.preventDefault();
    document.getElementById('search').focus();
  }
});

window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

window.abrirFicha = (idx) => abrirFicha(idx, DATA);
window.clearHistorial = () => { clearHistorial(); renderResultados([], '', DATA); };
window.showTab = showTab;

init();
