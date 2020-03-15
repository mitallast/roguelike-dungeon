import {Scene, SceneController} from "./scene";
import {GenerateOptions} from "./dungeon.generator";
import {Hero, HeroStateView} from "./hero";
import {InventoryView} from "./inventory";
import {Button, Colors, Layout, Sizes, SelectableMap} from "./ui";
import * as PIXI from "pixi.js";

export class UpdateHeroScene implements Scene {
  private readonly controller: SceneController;
  private readonly hero: Hero;
  private readonly options: GenerateOptions;

  private title: PIXI.BitmapText | null = null;
  private sprite: PIXI.AnimatedSprite | null = null;
  private spriteBg: PIXI.Graphics | null = null;
  private state: HeroStateView | null = null;
  private inventory: InventoryView | null = null;

  private readonly selectable: SelectableMap = new SelectableMap();

  private readonly buttons: Button[] = [];

  constructor(controller: SceneController, options: GenerateOptions) {
    this.controller = controller;
    this.hero = options.hero;
    this.options = options;
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
    this.selectable.reset();
    this.controller.app.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this.controller.app.ticker.remove(this.handleInput, this);
    this.title?.destroy();
    this.sprite?.destroy();
    this.spriteBg?.destroy();
    this.state?.destroy();
    this.inventory?.destroy();
    for (let button of this.buttons) {
      button.destroy();
    }
    this.sprite = null;
    this.spriteBg = null;
    this.title = null;
    this.state = null;
    this.inventory = null;
    this.buttons.splice(0, 1000);
  }

  pause(): void {
  }

  resume(): void {
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
    this.selectable.set(1, 0, button, () => this.hero.increaseHealth());
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
    this.selectable.set(0, 1, button, () => this.controller.generateDungeon(this.options));
    this.buttons.push(button);
    this.controller.stage.addChild(button);
    layout.offset(0, 32);
  }

  private renderInventory(layout: Layout): void {
    this.inventory = new InventoryView(this.hero.inventory, this.selectable, 2);
    this.inventory.position.set(layout.x, layout.y);
    this.controller.stage.addChild(this.inventory);
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