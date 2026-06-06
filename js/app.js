// Composition Root: única responsabilidad — construir el grafo de dependencias y arrancar
import { JsonMedicamentosRepository }  from './infrastructure/JsonMedicamentosRepository.js';
import { LocalStorageHistorialRepo }   from './infrastructure/LocalStorageHistorialRepo.js';
import { BusquedaService }             from './application/BusquedaService.js';
import { AbrirFichaCommand }           from './application/commands/AbrirFichaCommand.js';
import { BuscarCommand }               from './application/commands/BuscarCommand.js';
import { CerrarFichaCommand }          from './application/commands/CerrarFichaCommand.js';
import { FichaView }                   from './presentation/FichaView.js';
import { ResultadosRenderer }          from './presentation/ResultadosRenderer.js';
import { AppController }               from './presentation/AppController.js';

try {
  const repository        = new JsonMedicamentosRepository();
  const historialRepo     = new LocalStorageHistorialRepo();
  const busquedaService   = new BusquedaService();
  const fichaView         = new FichaView();
  const resultadosRenderer = new ResultadosRenderer(document.getElementById('results'));

  const medicamentos = await repository.load();
  busquedaService.indexar(medicamentos);

  const abrirCmd  = new AbrirFichaCommand({ repository, historialRepo, fichaView });
  const buscarCmd = new BuscarCommand({ busquedaService, repository, historialRepo, resultadosRenderer });
  const cerrarCmd = new CerrarFichaCommand({ fichaView });

  const controller = new AppController({ abrirCmd, buscarCmd, cerrarCmd, fichaView });
  controller.bindEvents();
  buscarCmd.execute('');

  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('sw.js'); } catch { /* offline-first — fallo silencioso */ }
  }
} catch {
  document.getElementById('results').innerHTML =
    '<div class="empty-state"><p>Error cargando el manual. Refresca la página.</p></div>';
}
