import {ModalScene, SceneController} from "../scene";
import {InventoryController} from "./InventoryController";
import {InventoryView} from "./InventoryView";

export class InventoryModalScene extends ModalScene {
  private readonly _actionsController: InventoryController;

  constructor(controller: SceneController, actionsController: InventoryController) {
    super(controller, actionsController.title);
    this._actionsController = actionsController;
  }

  init(): void {
    super.init();
    this.addChild(new InventoryView(this._controller.resources, this._actionsController, this._selectable, 0, 1));
    this._controller.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this._controller.ticker.remove(this.handleInput, this);
    super.destroy();
  }

  private handleInput(): void {
    if (this._controller.joystick.inventory.once()) {
      this._controller.closeModal();
      return;
    }
  }
}