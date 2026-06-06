// Command (GoF): encapsula la acción "abrir ficha de un medicamento"
// Compose Method + SLAP: execute() es una secuencia de intenciones al mismo nivel
export class AbrirFichaCommand {
  constructor({ repository, historialRepo, fichaView }) {
    this._repository   = repository;
    this._historialRepo = historialRepo;
    this._fichaView    = fichaView;
  }

  execute(idx) {
    const medicamento = this._repository.getByIndex(idx);
    if (!medicamento) return;
    this._historialRepo.guardar(idx);
    this._fichaView.renderHeader(medicamento);
    this._fichaView.renderContent(medicamento);
    this._fichaView.open();
    this._fichaView.navigateTo(idx);
  }
}
