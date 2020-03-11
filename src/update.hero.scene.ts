import {Scene, SceneController} from "./scene";
import {GenerateOptions} from "./dungeon.generator";
import {HeroCharacter, HeroStateView} from "./hero";
import {BackpackInventoryView, BeltInventoryView, EquipmentInventoryView} from "./inventory";
import {SelectableMap} from "./selectable";
import {Button, Colors, Sizes} from "./ui";
import {DropCardView, Weapon} from "./drop";
import * as PIXI from "pixi.js";

export class UpdateHeroScene implements Scene {
  private readonly controller: SceneController;
  private readonly hero: HeroCharacter;
  private readonly options: GenerateOptions;

  private title: PIXI.BitmapText | null = null;
  private sprite: PIXI.AnimatedSprite | null = null;
  private spriteBg: PIXI.Graphics | null = null;
  private state: HeroStateView | null = null;
  private equipment: EquipmentInventoryView | null = null;
  private belt: BeltInventoryView | null = null;
  private backpack: BackpackInventoryView | null = null;
  private dropCard: DropCardView | null = null;

  private readonly selectable: SelectableMap = new SelectableMap();

  private readonly buttons: Button[] = [];
  private readonly actions: [Button, number, number][] = [];

  constructor(controller: SceneController, options: GenerateOptions) {
    this.controller = controller;
    this.hero = options.hero;
    this.options = options;
  }

  destroy(): void {
    this.title?.destroy();
    this.sprite?.destroy();
    this.spriteBg?.destroy();
    this.state?.destroy();
    this.equipment?.destroy();
    this.belt?.destroy();
    this.backpack?.destroy();
    this.dropCard?.destroy();
    for (let button of this.buttons) {
      button.destroy();
    }
    for (let [button] of this.actions) {
      button.destroy();
    }
    this.sprite = null;
    this.spriteBg = null;
    this.title = null;
    this.state = null;
    this.equipment = null;
    this.belt = null;
    this.backpack = null;
    this.dropCard = null;
    this.buttons.splice(0, 1000);
    this.actions.splice(0, 1000);
  }

  init(): void {
    const layout = new Layout();
    this.renderTitle(layout);
    this.renderState(layout);
    this.renderIcon(layout);
    this.renderContinue(layout);
    layout.reset();
    layout.offset(256 + Sizes.uiMargin, 0);
    layout.commit();
    this.renderIncreaseHealth(layout);
    layout.reset();
    layout.offset(24 + Sizes.uiMargin * 2, 0);
    layout.commit();
    this.renderInventory(layout);
    this.renderDropCard(layout);
    this.selectable.reset();
  }

  update(_delta: number): void {
    this.handleInput();
  }

  private renderTitle(layout: Layout) {
    this.title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    this.title.anchor = new PIXI.Point(0.5, 0);
    this.title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(this.title);
    layout.offset(0, 128 + Sizes.uiMargin);
    layout.commit();
  }

  private renderState(layout: Layout) {
    layout.offset(Sizes.uiMargin, 0);
    layout.commit();
    this.state = new HeroStateView(this.hero, {fixedHPSize: true});
    this.state.position.set(layout.x, layout.y);
    this.controller.stage.addChild(this.state);
    layout.offset(0, this.state.getBounds().height);
  }

  private renderIcon(layout: Layout) {
    this.sprite = this.controller.resources.animated(this.hero.name + "_idle");
    this.sprite.play();
    this.sprite.animationSpeed = 0.2;
    const w = this.sprite.width;
    const h = this.sprite.height;
    this.sprite.width = 256 - (Sizes.uiMargin << 1);
    const scale = this.sprite.width / w;
    this.sprite.height = Math.floor(scale * h);
    // compute real height by trimmed size
    const trimmed_h = Math.floor(scale * this.sprite.texture.trim.height);
    const offset_y = this.sprite.height - trimmed_h;
    layout.offset(0, Sizes.uiMargin);
    this.sprite.position.set(layout.x + Sizes.uiMargin, layout.y + Sizes.uiMargin - offset_y);
    this.spriteBg = new PIXI.Graphics()
      .beginFill(Colors.uiBackground)
      .drawRect(0, 0, 256, trimmed_h + (Sizes.uiMargin << 1))
      .endFill();
    this.spriteBg.position.set(layout.x, layout.y);
    this.controller.stage.addChild(this.spriteBg, this.sprite);
    layout.offset(0, trimmed_h + (Sizes.uiMargin << 1));
  }

  private renderIncreaseHealth(layout: Layout): void {
    const button = new Button({
      label: "+",
      width: 24,
      height: 24
    });
    button.position.set(layout.x, layout.y);
    this.selectable.set(1, 0, button, () => this.increaseHealth());
    this.buttons.push(button);
    this.controller.stage.addChild(button);
    layout.offset(0, 24);
  }

  private renderContinue(layout: Layout): void {
    layout.offset(0, Sizes.uiMargin);
    const button = new Button({
      label: "Continue ...",
      width: 256,
      height: 32,
    });
    button.position.set(layout.x, layout.y);
    this.selectable.set(0, 1, button, () => this.continueGame());
    this.buttons.push(button);
    this.controller.stage.addChild(button);
    layout.offset(0, 32);
  }

  private renderInventory(layout: Layout): void {
    this.equipment = new EquipmentInventoryView(this.hero.inventory.equipment);
    this.equipment.position.set(layout.x, layout.y);
    layout.offset(0, 32 + (Sizes.uiBorder << 1));
    layout.offset(0, Sizes.uiMargin);

    this.selectable.set(2, 0, this.equipment.weapon, () => this.showWeaponInfo());

    this.belt = new BeltInventoryView(this.hero.inventory.belt);
    this.belt.position.set(layout.x, layout.y);
    layout.offset(0, 32 + (Sizes.uiBorder << 1));
    layout.offset(0, Sizes.uiMargin);

    this.backpack = new BackpackInventoryView(this.hero.inventory.backpack);
    this.backpack.position.set(layout.x, layout.y);
    layout.offset(0, Sizes.uiBorder + (32 + Sizes.uiBorder) * this.backpack.height);

    for (let x = 0; x < this.backpack.width; x++) {
      const index = x;
      this.selectable.set(x + 2, 1, this.belt.cell(x), () => this.showBeltInfo(index));
      for (let y = 0; y < this.backpack.height; y++) {
        const cell_x = x;
        const cell_y = y;
        this.selectable.set(x + 2, y + 2, this.backpack.cell(x, y), () => this.showBackpackInfo(cell_x, cell_y));
      }
    }

    layout.reset();
    layout.offset(Sizes.uiBorder + (32 + Sizes.uiBorder) * 10, 0);
    layout.offset(Sizes.uiMargin, 0);
    layout.commit();

    this.controller.stage.addChild(this.equipment, this.backpack, this.belt);
  }

  private renderDropCard(layout: Layout): void {
    const width = this.controller.app.screen.width - layout.x - Sizes.uiMargin;
    const height = this.controller.app.screen.height - layout.y - Sizes.uiMargin - 32 - Sizes.uiMargin;
    this.dropCard = new DropCardView({
      width: width,
      height: height
    });
    this.dropCard.position.set(layout.x, layout.y);
    this.controller.stage.addChild(this.dropCard);
  }

  private removeActions(): void {
    for (let [button, x, y] of this.actions) {
      this.selectable.remove(x, y);
      button.destroy();
    }
  }

  private showWeaponInfo(): void {
    const drop = this.hero.inventory.equipment.weapon.get();
    this.dropCard!.drop = drop;
    this.removeActions();

    if (drop) {
      const cardBounds = this.dropCard!.getBounds();
      let offsetX = cardBounds.x;
      let offsetY = cardBounds.y + cardBounds.height + Sizes.uiMargin;
      let width = 128;
      let height = 32;

      const buttonToBelt = new Button({
        label: "To belt",
        width: width,
        height: height,
      });
      this.actions.push([buttonToBelt, 13, 0]);
      this.selectable.set(13, 0, buttonToBelt, () => this.weaponToBelt());
      buttonToBelt.position.set(offsetX, offsetY);
      this.controller.stage.addChild(buttonToBelt);
      offsetX += width + Sizes.uiMargin;

      const buttonToBackpack = new Button({
        label: "To backpack",
        width: width,
        height: height,
      });
      this.actions.push([buttonToBackpack, 14, 0]);
      this.selectable.set(14, 0, buttonToBackpack, () => this.weaponToBackpack());
      buttonToBackpack.position.set(offsetX, offsetY);
      this.controller.stage.addChild(buttonToBackpack);
      offsetX += width + Sizes.uiMargin;

      const buttonDrop = new Button({
        label: "Drop",
        width: width,
        height: height,
      });
      this.actions.push([buttonDrop, 15, 0]);
      this.selectable.set(15, 0, buttonDrop, () => this.weaponDrop());
      buttonDrop.position.set(offsetX, offsetY);
      this.controller.stage.addChild(buttonDrop);
    }
  }

  private weaponToBelt(): void {
    const weapon = this.hero.inventory.equipment.weapon.get();
    if (weapon) {
      if (this.hero.inventory.belt.add(weapon)) {
        this.hero.inventory.equipment.weapon.set(null);
        this.dropCard!.drop = null;
        this.removeActions();
      }
    }
  }

  private weaponToBackpack(): void {
    const weapon = this.hero.inventory.equipment.weapon.get();
    if (weapon) {
      if (this.hero.inventory.backpack.set(weapon)) {
        this.hero.inventory.equipment.weapon.set(null);

        this.dropCard!.drop = null;
        this.removeActions();
      }
    }
  }

  private weaponDrop(): void {
    this.hero.inventory.equipment.weapon.set(null);
    this.dropCard!.drop = null;
    this.removeActions();
  }

  private showBeltInfo(index: number): void {
    const drop = this.hero.inventory.belt.cell(index).item.get();
    this.dropCard!.drop = drop;
    this.removeActions();

    if (drop) {
      const cardBounds = this.dropCard!.getBounds();
      let offsetX = cardBounds.x;
      let offsetY = cardBounds.y + cardBounds.height + Sizes.uiMargin;
      let width = 128;
      let height = 32;

      if (drop instanceof Weapon) {
        const buttonToBelt = new Button({
          label: "Equip",
          width: width,
          height: height,
        });
        this.actions.push([buttonToBelt, 13, 0]);
        this.selectable.set(13, 0, buttonToBelt, () => this.beltEquip(index));
        buttonToBelt.position.set(offsetX, offsetY);
        this.controller.stage.addChild(buttonToBelt);
        offsetX += width + Sizes.uiMargin;
      } else {
        const buttonToBelt = new Button({
          label: "Use item",
          width: width,
          height: height,
        });
        this.actions.push([buttonToBelt, 13, 0]);
        this.selectable.set(13, 0, buttonToBelt, () => this.beltUseItem(index));
        buttonToBelt.position.set(offsetX, offsetY);
        this.controller.stage.addChild(buttonToBelt);
        offsetX += width + Sizes.uiMargin;
      }

      const buttonToBackpack = new Button({
        label: "To backpack",
        width: width,
        height: height,
      });
      this.actions.push([buttonToBackpack, 14, 0]);
      this.selectable.set(14, 0, buttonToBackpack, () => this.beltToBackpack(index));
      buttonToBackpack.position.set(offsetX, offsetY);
      this.controller.stage.addChild(buttonToBackpack);
      offsetX += width + Sizes.uiMargin;

      const buttonDrop = new Button({
        label: "Drop",
        width: width,
        height: height,
      });
      this.actions.push([buttonDrop, 15, 0]);
      this.selectable.set(15, 0, buttonDrop, () => this.beltDrop(index));
      buttonDrop.position.set(offsetX, offsetY);
      this.controller.stage.addChild(buttonDrop);
    }
  }

  private beltEquip(index: number): void {
    const cell = this.hero.inventory.belt.cell(index);
    const drop = cell.item.get();
    if (drop && drop instanceof Weapon) {
      const prev = this.hero.inventory.equipment.weapon.get();
      this.hero.inventory.equipment.weapon.set(drop);
      cell.clear();
      if (prev) {
        cell.set(prev);
      }
      this.dropCard!.drop = null;
      this.removeActions();
    }
  }

  private beltUseItem(index: number): void {
    const cell = this.hero.inventory.belt.cell(index);
    const drop = cell.item.get();
    if (drop) {
      if (cell.use() && cell.isEmpty) {
        this.dropCard!.drop = null;
        this.removeActions();
      }
    }
  }

  private beltToBackpack(index: number): void {
    const cell = this.hero.inventory.belt.cell(index);
    if (!cell.isEmpty) {
      const drop = cell.item.get();
      while (drop && !cell.isEmpty) {
        if (this.hero.inventory.backpack.add(drop)) {
          cell.decrease();
        } else {
          break;
        }
      }
      if (cell.isEmpty) {
        this.dropCard!.drop = null;
        this.removeActions();
      }
    }
  }

  private beltDrop(index: number): void {
    this.hero.inventory.belt.cell(index).clear();

    this.dropCard!.drop = null;
    this.removeActions();
  }

  private showBackpackInfo(x: number, y: number): void {
    const drop = this.hero.inventory.backpack.cell(x, y).item.get();
    this.dropCard!.drop = drop;
    this.removeActions();

    if (drop) {
      const cardBounds = this.dropCard!.getBounds();
      let offsetX = cardBounds.x;
      let offsetY = cardBounds.y + cardBounds.height + Sizes.uiMargin;
      let width = 128;
      let height = 32;

      if (drop instanceof Weapon) {
        const buttonToBelt = new Button({
          label: "Equip",
          width: width,
          height: height,
        });
        this.actions.push([buttonToBelt, 13, 0]);
        this.selectable.set(13, 0, buttonToBelt, () => this.backpackEquip(x, y));
        buttonToBelt.position.set(offsetX, offsetY);
        this.controller.stage.addChild(buttonToBelt);
        offsetX += width + Sizes.uiMargin;
      } else {
        const buttonToBelt = new Button({
          label: "Use item",
          width: width,
          height: height,
        });
        this.actions.push([buttonToBelt, 13, 0]);
        this.selectable.set(13, 0, buttonToBelt, () => this.backpackUseItem(x, y));
        buttonToBelt.position.set(offsetX, offsetY);
        this.controller.stage.addChild(buttonToBelt);
        offsetX += width + Sizes.uiMargin;
      }

      const buttonToBackpack = new Button({
        label: "To belt",
        width: width,
        height: height,
      });
      this.actions.push([buttonToBackpack, 14, 0]);
      this.selectable.set(14, 0, buttonToBackpack, () => this.backpackToBelt(x, y));
      buttonToBackpack.position.set(offsetX, offsetY);
      this.controller.stage.addChild(buttonToBackpack);
      offsetX += width + Sizes.uiMargin;

      const buttonDrop = new Button({
        label: "Drop",
        width: width,
        height: height,
      });
      this.actions.push([buttonDrop, 15, 0]);
      this.selectable.set(15, 0, buttonDrop, () => this.backpackDrop(x, y));
      buttonDrop.position.set(offsetX, offsetY);
      this.controller.stage.addChild(buttonDrop);
    }
  }

  private backpackEquip(x: number, y: number): void {
    const cell = this.hero.inventory.backpack.cell(x, y);
    const drop = cell.item.get();
    if (drop && drop instanceof Weapon) {
      const prev = this.hero.inventory.equipment.weapon.get();
      this.hero.inventory.equipment.weapon.set(drop);
      cell.clear();
      if (prev) {
        cell.set(prev);
      }
      this.dropCard!.drop = null;
      this.removeActions();
    }
  }

  private backpackUseItem(x: number, y: number): void {
    const cell = this.hero.inventory.backpack.cell(x, y);
    const drop = cell.item.get();
    if (drop) {
      if (cell.use() && cell.isEmpty) {
        this.dropCard!.drop = null;
        this.removeActions();
      }
    }
  }

  private backpackToBelt(x: number, y: number): void {
    const cell = this.hero.inventory.backpack.cell(x, y);
    if (!cell.isEmpty) {
      const drop = cell.item.get();
      while (drop && !cell.isEmpty) {
        if (this.hero.inventory.belt.add(drop)) {
          cell.decrease();
        } else {
          break;
        }
      }
      if (cell.isEmpty) {
        this.dropCard!.drop = null;
        this.removeActions();
      }
    }
  }

  private backpackDrop(x: number, y: number): void {
    this.hero.inventory.backpack.cell(x, y).clear();

    this.dropCard!.drop = null;
    this.removeActions();
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
    const selected = this.selectable.selected;
    if (selected) {
      let [, callback] = selected;
      callback();
    }
  }
}

class Layout {
  private commitX: number = 0;
  private commitY: number = 0;

  private offsetX: number = 0;
  private offsetY: number = 0;

  commit(): void {
    this.commitX = this.offsetX;
    this.commitY = this.offsetY;
  }

  reset(): void {
    this.offsetX = this.commitX;
    this.offsetY = this.commitY;
  }

  offset(x: number, y: number) {
    this.offsetX += x;
    this.offsetY += y;
  }

  get x(): number {
    return this.offsetX;
  }

  get y(): number {
    return this.offsetY;
  }
}