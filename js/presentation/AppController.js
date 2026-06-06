// Controller (GRASP): punto de entrada único para eventos del sistema
// Facade (GoF): oculta la complejidad del wiring de comandos al resto de la app
// Compose Method: bindEvents() es una secuencia de intenciones al mismo nivel
export class AppController {
  _currentTab = 'inicio';

  constructor({ abrirCmd, buscarCmd, cerrarCmd, fichaView }) {
    this._abrir    = abrirCmd;
    this._buscar   = buscarCmd;
    this._cerrar   = cerrarCmd;
    this._fichaView = fichaView;
  }

  bindEvents() {
    this._bindTabNavigation();
    this._bindBusqueda();
    this._bindResultados();
    this._bindFicha();
    this._bindNavegacion();
    this._bindTeclado();
    this._bindConectividad();
  }

  showTab(name) {
    this._currentTab = name;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === name);
    });
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('hidden', p.id !== 'tab-' + name);
    });
    window.scrollTo(0, 0);
    if (name === 'inicio') {
      setTimeout(() => document.getElementById('search').focus(), 50);
    } else {
      document.getElementById('header-search-wrap').classList.remove('visible');
    }
  }

  _bindTabNavigation() {
    document.querySelector('.tab-nav').addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (btn) this.showTab(btn.dataset.tab);
    });
  }

  _bindBusqueda() {
    const mainSearch   = document.getElementById('search');
    const headerSearch = document.getElementById('header-search');
    const headerWrap   = document.getElementById('header-search-wrap');

    mainSearch.addEventListener('input', e => {
      headerSearch.value = e.target.value;
      this._buscar.execute(e.target.value);
    });

    headerSearch.addEventListener('input', e => {
      mainSearch.value = e.target.value;
      this._buscar.execute(e.target.value);
    });

    new IntersectionObserver(([entry]) => {
      if (this._currentTab === 'inicio') {
        headerWrap.classList.toggle('visible', !entry.isIntersecting);
      }
    }, { threshold: 0 }).observe(mainSearch);
  }

  _bindResultados() {
    const container = document.getElementById('results');
    container.addEventListener('click',   e => this._handleResultadosClick(e));
    container.addEventListener('keydown', e => this._handleResultadosKeydown(e));
  }

  _handleResultadosClick(e) {
    if (e.target.closest('[data-action="clear-historial"]')) {
      this._buscar.limpiarHistorial();
      return;
    }
    const item = e.target.closest('[data-idx]');
    if (item) this._abrir.execute(Number(item.dataset.idx));
  }

  _handleResultadosKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('[data-idx]');
    if (!item) return;
    e.preventDefault();
    this._abrir.execute(Number(item.dataset.idx));
  }

  _bindFicha() {
    document.getElementById('back-btn').addEventListener('click', () => this._cerrar.execute());
    document.getElementById('ficha-content').addEventListener('click', e => this._handleFichaClick(e));
  }

  _handleFichaClick(e) {
    const sectionHead = e.target.closest('[data-toggle="section"]');
    if (sectionHead) {
      sectionHead.closest('.section').classList.toggle('collapsed');
      return;
    }
    const presHead = e.target.closest('[data-toggle="pres"]');
    if (presHead) presHead.closest('.presentacion-card').classList.toggle('collapsed');
  }

  _bindNavegacion() {
    window.addEventListener('popstate', e => {
      if (!e.state || e.state.view !== 'ficha') this._fichaView.close();
    });
  }

  _bindTeclado() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._fichaView.isOpen()) {
        this._cerrar.execute();
      }
      if (e.key === '/' && !e.target.matches('input')) {
        e.preventDefault();
        document.getElementById('search').focus();
      }
    });
  }

  _bindConectividad() {
    const badge = document.getElementById('offline-badge');
    const update = () => {
      badge.classList.toggle('off', !navigator.onLine);
      badge.title = navigator.onLine ? 'Disponible offline' : 'Sin conexión · funcionando';
    };
    window.addEventListener('online',  update);
    window.addEventListener('offline', update);
    update();
  }
}
