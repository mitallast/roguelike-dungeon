import {ModalScene, SceneController} from "../scene";
import {Button, Colors, HStack, SelectableGrid, Sizes, VStack} from "../ui";
import {InventoryController} from "./InventoryController";
import {InventoryView} from "./InventoryView";
import * as PIXI from "pixi.js";

export class InventoryModalScene extends VStack implements ModalScene {
  private readonly _controller: SceneController;
  private readonly _actionsController: InventoryController;
  private readonly _selectable: SelectableGrid;

  constructor(controller: SceneController, actionsController: InventoryController) {
    super({background: {color: Colors.background}});
    this._controller = controller;
    this._actionsController = actionsController;
    this._selectable = new SelectableGrid(this._controller.joystick);
  }

  init(): void {
    const head = new HStack({padding: 0});
    this.addChild(head);

    const close = new Button({label: "X", width: 40, height: 32});
    head.addChild(close);
    this._selectable.set(0, 0, close, () => this._controller.closeModal());

    const title = new PIXI.BitmapText(this._actionsController.title, {font: {name: "alagard", size: 32}});
    head.addChild(title);

    const inventoryView = new InventoryView(this._controller.resources, this._actionsController, this._selectable, 0, 1);
    inventoryView.position.set(Sizes.uiMargin, Sizes.uiMargin);
    inventoryView.calculateBounds();
    inventoryView.zIndex = 1;
    this.addChild(inventoryView);

    this.position.set(
      (this._controller.app.screen.width >> 1) - (this.width >> 1),
      (this._controller.app.screen.height >> 1) - (this.height >> 1),
    );

    this._controller.stage.addChild(this);
    this._controller.app.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this._controller.app.ticker.remove(this.handleInput, this);
    super.destroy({children: true});
  }

  private handleInput(): void {
    const joystick = this._controller.joystick;
    if (joystick.inventory.once()) {
      this._controller.closeModal();
      return;
    }
    this._selectable.handleInput();
  }
}