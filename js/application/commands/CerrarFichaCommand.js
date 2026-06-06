// Command (GoF): encapsula la acción "cerrar la ficha"
export class CerrarFichaCommand {
  constructor({ fichaView }) {
    this._fichaView = fichaView;
  }

  execute() {
    this._fichaView.close();
    if (location.hash.startsWith('#med-')) history.back();
  }
}
