import {ModalScene, SceneController} from "./scene";
import {SelectableGrid, Sizes} from "./ui";
import {InventoryController, InventoryView} from "./inventory";

export class InventoryModalScene implements ModalScene {
  private readonly controller: SceneController;
  private readonly actionsController: InventoryController;

  private container: PIXI.Container | null = null;
  private background: PIXI.Graphics | null = null;
  private selectable: SelectableGrid | null = null;
  private inventoryView: InventoryView | null = null;

  constructor(controller: SceneController, actionsController: InventoryController) {
    this.controller = controller;
    this.actionsController = actionsController;
  }

  init(): void {
    this.background = new PIXI.Graphics();

    this.selectable = new SelectableGrid(this.controller.joystick);


    this.inventoryView = new InventoryView(this.controller.resources, this.actionsController, this.selectable, 0);
    this.inventoryView.position.set(Sizes.uiMargin, Sizes.uiMargin);
    this.inventoryView.calculateBounds();
    this.inventoryView.zIndex = 1;

    const width = this.inventoryView.width + (Sizes.uiMargin << 1);
    const height = this.inventoryView.height + (Sizes.uiMargin << 1);

    this.background
      .beginFill(0x000000)
      .drawRect(0, 0, width, height)
      .endFill();
    this.background.zIndex = 0;

    this.container = new PIXI.Container();
    this.container.addChild(this.background, this.inventoryView);
    this.container.sortChildren();
    this.container.position.set(
      (this.controller.app.screen.width >> 1) - (width >> 1),
      (this.controller.app.screen.height >> 1) - (height >> 1),
    );

    this.controller.stage.addChild(this.container);
    this.controller.app.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this.controller.app.ticker.remove(this.handleInput, this);
    this.container?.destroy();
    this.container = null;
    this.background?.destroy();
    this.background = null;
    this.inventoryView?.destroy();
    this.inventoryView = null;
    this.selectable = null;
  }

  private handleInput(): void {
    const joystick = this.controller.joystick;
    if (joystick.inventory.once()) {
      this.controller.closeModal();
      return;
    }
    this.selectable?.handleInput();
  }
}