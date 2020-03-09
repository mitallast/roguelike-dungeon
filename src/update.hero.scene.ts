import {Scene, SceneController} from "./scene";
import {GenerateOptions} from "./dungeon.generator";
import {HeroState, HeroStateView} from "./hero";
import {BagpackInventoryView, BeltInventoryView, EquipmentInventoryView} from "./inventory";
import {SelectableMap} from "./selectable";
// @ts-ignore
import * as PIXI from "pixi.js";
import {Button} from "./ui";
import {DropCardView} from "./drop";

const margin = 40;
const tile_w = 16;
const tile_h = 28;

export class UpdateHeroScene implements Scene {
  private readonly controller: SceneController;
  private readonly hero: HeroState;
  private readonly options: GenerateOptions;

  private title: PIXI.BitmapText;
  private sprite: PIXI.AnimatedSprite;
  private state: HeroStateView;
  private equipment: EquipmentInventoryView;
  private belt: BeltInventoryView;
  private bagpack: BagpackInventoryView;
  private dropCard: DropCardView;

  private readonly selectable: SelectableMap = new SelectableMap();

  private readonly buttons: Button[] = [];

  constructor(controller: SceneController, options: GenerateOptions) {
    this.controller = controller;
    this.hero = options.hero;
    this.options = options;
  }

  destroy(): void {
    this.title?.destroy();
    this.sprite?.destroy();
    this.state?.destroy();
    (this.equipment as PIXI.Container)?.destroy();
    (this.belt as PIXI.Container)?.destroy();
    (this.bagpack as PIXI.Container)?.destroy();
    (this.dropCard as PIXI.Container)?.destroy();
    for (let button of this.buttons) {
      (button as PIXI.Container).destroy();
    }
    this.sprite = null;
    this.title = null;
    this.state = null;
    this.equipment = null;
    this.belt = null;
    this.bagpack = null;
    this.dropCard = null;
    this.buttons.splice(0, 100);
  }

  init(): void {
    this.renderTitle();
    this.renderState();
    this.renderIcon();
    this.renderButtons();
    this.renderInventory();
    this.selectable.reset();
  }

  update(delta: number): void {
    this.handleInput();
  }

  private renderTitle() {
    this.title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    this.title.anchor = 0.5;
    this.title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(this.title);
  }

  private renderState() {
    this.state = new HeroStateView(this.hero);
    (this.state as PIXI.Container).position.set(margin + 24 + 8, 128 + margin);
    this.controller.stage.addChild(this.state);
  }

  private renderIcon() {
    const bounds = (this.state as PIXI.Container).getBounds();
    console.log("bounds", bounds);

    const scale = 10;
    this.sprite = this.controller.resources.animated(this.hero.name + "_idle");
    this.sprite.play();
    this.sprite.animationSpeed = 0.2;
    this.sprite.width = tile_w * scale;
    this.sprite.height = tile_h * scale;
    this.sprite.position.set(margin, bounds.y + bounds.height + margin);
    this.controller.stage.addChild(this.sprite);
  }

  private renderButtons() {
    const increaseHealth = new Button({label: "+", width: 24});
    (increaseHealth as PIXI.Container).position.set(margin, 128 + margin);
    this.selectable.set(0, 0, increaseHealth, () => this.increaseHealth());

    const c_h = this.controller.app.screen.height;
    const continueGame = new Button({label: "Continue ..."});
    (continueGame as PIXI.Container).position.set(margin, c_h - margin - 24);
    this.selectable.set(0, 1, continueGame, () => this.continueGame());

    this.buttons.push(increaseHealth, continueGame);
    this.controller.stage.addChild(increaseHealth, continueGame);
  }

  private renderInventory(): void {
    const offsetX = 400;
    const offsetY = 128 + margin + 102;
    const inventoryWidth = 364;

    this.equipment = new EquipmentInventoryView(this.hero.inventory.equipment);
    (this.equipment as PIXI.Container).position.set(offsetX, offsetY);

    this.selectable.set(1, 0, this.equipment.weapon, () => this.showWeaponInfo());

    this.belt = new BeltInventoryView(this.hero.inventory.belt);
    (this.belt as PIXI.Container).position.set(offsetX, offsetY + 40 + margin);

    this.bagpack = new BagpackInventoryView(this.hero.inventory.bagpack);
    (this.bagpack as PIXI.Container).position.set(offsetX, offsetY + 40 + margin + 40 + margin);

    for (let x = 0; x < this.bagpack.width; x++) {
      const index = x;
      this.selectable.set(x + 1, 1, this.belt.cell(x), () => this.showBeltInfo(index));
      for (let y = 0; y < this.bagpack.height; y++) {
        const cell_x = x;
        const cell_y = y;
        this.selectable.set(x + 1, y + 2, this.bagpack.cell(x, y), () => this.showBackpackInfo(cell_x, cell_y));
      }
    }

    const equipmentBounds = (this.equipment as PIXI.Container).getBounds();
    const bagpackBounds = (this.bagpack as PIXI.Container).getBounds();

    this.dropCard = new DropCardView({
      height: bagpackBounds.y + bagpackBounds.height - equipmentBounds.y
    });
    (this.dropCard as PIXI.Container).position.set(offsetX + inventoryWidth + margin, offsetY);

    this.controller.stage.addChild(this.equipment, this.bagpack, this.belt, this.dropCard);
  }

  private showWeaponInfo(): void {
    this.dropCard.drop = this.hero.inventory.equipment.weapon.get();
  }

  private showBeltInfo(index: number): void {
    this.dropCard.drop = this.hero.inventory.belt.cell(index).item.get();
  }

  private showBackpackInfo(x: number, y: number): void {
    this.dropCard.drop = this.hero.inventory.bagpack.cell(x, y).item.get();
  }

  private increaseHealth(): void {
    this.hero.increaseHealth();
  }

  private continueGame(): void {
    this.controller.generateDungeon(this.options);
  }

  private handleInput() {
    const joystick = this.controller.joystick;

    if (!joystick.moveUp.processed) {
      joystick.moveUp.processed = true;
      this.selectable.moveUp();
    }
    if (!joystick.moveDown.processed) {
      joystick.moveDown.processed = true;
      this.selectable.moveDown();
    }
    if (!joystick.moveLeft.processed) {
      joystick.moveLeft.processed = true;
      this.selectable.moveLeft();
    }
    if (!joystick.moveRight.processed) {
      joystick.moveRight.processed = true;
      this.selectable.moveRight();
    }

    if (!joystick.hit.processed) {
      joystick.hit.reset();
      this.action();
    }
  }

  private action(): void {
    let [ignore, callback] = this.selectable.selected;
    callback();
  }
}
