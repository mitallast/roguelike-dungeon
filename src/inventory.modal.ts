import {ModalScene, SceneController} from "./scene";
import {Hero} from "./hero";
import {SelectableMap, Sizes} from "./ui";
import {InventoryView} from "./inventory";

export class InventoryModalScene implements ModalScene {
  private readonly controller: SceneController;
  private readonly hero: Hero;

  private container: PIXI.Container | null = null;
  private background: PIXI.Graphics | null = null;
  private selectable: SelectableMap | null = null;
  private inventoryView: InventoryView | null = null;

  constructor(controller: SceneController, hero: Hero) {
    this.controller = controller;
    this.hero = hero;
  }

  init(): void {
    this.background = new PIXI.Graphics();

    this.selectable = new SelectableMap();
    this.inventoryView = new InventoryView(this.hero.inventory, this.selectable, 0);
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
    const selectable = this.selectable!;
    const joystick = this.controller.joystick;

    if (!joystick.inventory.processed) {
      joystick.inventory.processed = true;
      this.controller.closeModal();
      return;
    }
    if (!joystick.moveUp.processed) {
      joystick.moveUp.processed = true;
      selectable.moveUp();
    }
    if (!joystick.moveDown.processed) {
      joystick.moveDown.processed = true;
      selectable.moveDown();
    }
    if (!joystick.moveLeft.processed) {
      joystick.moveLeft.processed = true;
      selectable.moveLeft();
    }
    if (!joystick.moveRight.processed) {
      joystick.moveRight.processed = true;
      selectable.moveRight();
    }
    if (!joystick.hit.processed) {
      joystick.hit.reset();
      const selected = selectable.selected;
      if (selected) {
        let [, callback] = selected;
        callback();
      }
    }
  }
}