// Command (GoF): encapsula la acción "buscar y mostrar resultados"
// Compose Method + SLAP: execute() delega a pasos nombrados al mismo nivel
export class BuscarCommand {
  constructor({ busquedaService, repository, historialRepo, resultadosRenderer }) {
    this._busquedaService   = busquedaService;
    this._repository        = repository;
    this._historialRepo     = historialRepo;
    this._resultadosRenderer = resultadosRenderer;
  }

  execute(query) {
    if (!query) {
      this._renderSinQuery();
    } else {
      this._renderConQuery(query);
    }
  }

  limpiarHistorial() {
    this._historialRepo.limpiar();
    this.execute('');
  }

  _renderSinQuery() {
    const historial = this._historialRepo.get();
    const conMedicamento = this._hidratarHistorial(historial);
    if (!conMedicamento.length) {
      this._resultadosRenderer.renderVacio(this._repository.getAll().length);
    } else {
      this._resultadosRenderer.renderHistorial(conMedicamento);
    }
  }

  _renderConQuery(query) {
    const resultados = this._busquedaService.buscar(query);
    if (!resultados.length) {
      this._resultadosRenderer.renderSinResultados(query);
      return;
    }
    const conMedicamento = resultados.map(r => ({
      idx: r.idx,
      medicamento: this._repository.getByIndex(r.idx),
    }));
    this._resultadosRenderer.renderResultados(conMedicamento, query);
  }

  _hidratarHistorial(historial) {
    return historial
      .map(idx => ({ idx, medicamento: this._repository.getByIndex(idx) }))
      .filter(({ medicamento }) => Boolean(medicamento));
  }
}
