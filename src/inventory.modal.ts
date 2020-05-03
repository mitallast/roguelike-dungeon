import {ModalScene, SceneController} from "./scene";
import {Button, HStack, SelectableGrid, Sizes, VStack} from "./ui";
import {InventoryController, InventoryView} from "./inventory";

export class InventoryModalScene implements ModalScene {
  private readonly controller: SceneController;
  private readonly actionsController: InventoryController;

  private container: VStack | null = null;
  private head: HStack | null = null;
  private title: PIXI.BitmapText | null = null;
  private close: Button | null = null;
  private selectable: SelectableGrid | null = null;
  private inventoryView: InventoryView | null = null;

  constructor(controller: SceneController, actionsController: InventoryController) {
    this.controller = controller;
    this.actionsController = actionsController;
  }

  init(): void {
    this.selectable = new SelectableGrid(this.controller.joystick);

    this.container = new VStack({background: {color: 0x000000}});

    this.head = new HStack({padding: 0});
    this.container.addChild(this.head);

    this.close = new Button({label: "X", width: 40, height: 32});
    this.head.addChild(this.close);
    this.selectable.set(0, 0, this.close, () => this.controller.closeModal());

    this.title = new PIXI.BitmapText(this.actionsController.title, {font: {name: "alagard", size: 32}});
    this.head.addChild(this.title);

    this.inventoryView = new InventoryView(this.controller.resources, this.actionsController, this.selectable, 0, 1);
    this.inventoryView.position.set(Sizes.uiMargin, Sizes.uiMargin);
    this.inventoryView.calculateBounds();
    this.inventoryView.zIndex = 1;
    this.container.addChild(this.inventoryView);
    const width = this.container.width;
    const height = this.container.height;

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
    this.head?.destroy();
    this.head = null;
    this.title?.destroy();
    this.title = null;
    this.close?.destroy();
    this.close = null;
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