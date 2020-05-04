import {ModalScene, SceneController} from "./scene";
import {Button, HStack, SelectableGrid, Sizes, VStack} from "./ui";
import {InventoryController, InventoryView} from "./inventory";
import * as PIXI from "pixi.js";

export class InventoryModalScene implements ModalScene {
  private readonly _controller: SceneController;
  private readonly _actionsController: InventoryController;

  private _container: VStack | null = null;
  private _head: HStack | null = null;
  private _title: PIXI.BitmapText | null = null;
  private _close: Button | null = null;
  private _selectable: SelectableGrid | null = null;
  private _inventoryView: InventoryView | null = null;

  constructor(controller: SceneController, actionsController: InventoryController) {
    this._controller = controller;
    this._actionsController = actionsController;
  }

  init(): void {
    this._selectable = new SelectableGrid(this._controller.joystick);

    this._container = new VStack({background: {color: 0x000000}});

    this._head = new HStack({padding: 0});
    this._container.addChild(this._head);

    this._close = new Button({label: "X", width: 40, height: 32});
    this._head.addChild(this._close);
    this._selectable.set(0, 0, this._close, () => this._controller.closeModal());

    this._title = new PIXI.BitmapText(this._actionsController.title, {font: {name: "alagard", size: 32}});
    this._head.addChild(this._title);

    this._inventoryView = new InventoryView(this._controller.resources, this._actionsController, this._selectable, 0, 1);
    this._inventoryView.position.set(Sizes.uiMargin, Sizes.uiMargin);
    this._inventoryView.calculateBounds();
    this._inventoryView.zIndex = 1;
    this._container.addChild(this._inventoryView);
    const width = this._container.width;
    const height = this._container.height;

    this._container.position.set(
      (this._controller.app.screen.width >> 1) - (width >> 1),
      (this._controller.app.screen.height >> 1) - (height >> 1),
    );

    this._controller.stage.addChild(this._container);
    this._controller.app.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this._controller.app.ticker.remove(this.handleInput, this);
    this._container?.destroy();
    this._container = null;
    this._head?.destroy();
    this._head = null;
    this._title?.destroy();
    this._title = null;
    this._close?.destroy();
    this._close = null;
    this._inventoryView?.destroy();
    this._inventoryView = null;
    this._selectable = null;
  }

  private handleInput(): void {
    const joystick = this._controller.joystick;
    if (joystick.inventory.once()) {
      this._controller.closeModal();
      return;
    }
    this._selectable?.handleInput();
  }
}