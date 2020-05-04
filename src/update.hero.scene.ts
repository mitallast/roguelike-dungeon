import {Scene, SceneController} from "./scene";
import {GenerateOptions} from "./dungeon.generator";
import {Hero, HeroStateView} from "./hero";
import {DefaultInventoryActionsController, InventoryView} from "./inventory";
import {Button, Layout, SelectableGrid, Colors, Sizes} from "./ui";
import * as PIXI from "pixi.js";

export class UpdateHeroScene implements Scene {
  private readonly _controller: SceneController;
  private readonly _hero: Hero;
  private readonly _options: GenerateOptions;

  private _title: PIXI.BitmapText | null = null;
  private _sprite: PIXI.AnimatedSprite | null = null;
  private _spriteBg: PIXI.Graphics | null = null;
  private _state: HeroStateView | null = null;
  private _inventory: InventoryView | null = null;

  private readonly _selectable: SelectableGrid;

  private readonly _buttons: Button[] = [];

  constructor(controller: SceneController, options: GenerateOptions) {
    this._controller = controller;
    this._hero = options.hero;
    this._options = options;
    this._selectable = new SelectableGrid(controller.joystick);
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
    this._selectable.reset();
    this._controller.app.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this._controller.app.ticker.remove(this.handleInput, this);
    this._title?.destroy();
    this._sprite?.destroy();
    this._spriteBg?.destroy();
    this._state?.destroy();
    this._inventory?.destroy();
    for (let button of this._buttons) {
      button.destroy();
    }
    this._sprite = null;
    this._spriteBg = null;
    this._title = null;
    this._state = null;
    this._inventory = null;
    this._buttons.splice(0, 1000);
  }

  pause(): void {
  }

  resume(): void {
  }

  private renderTitle(layout: Layout) {
    this._title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    this._title.anchor = new PIXI.Point(0.5, 0);
    this._title.position.set(this._controller.app.screen.width >> 1, 64);
    this._controller.stage.addChild(this._title);
    layout.offset(0, 128 + Sizes.uiMargin);
    layout.commit();
  }

  private renderState(layout: Layout) {
    layout.offset(Sizes.uiMargin, 0);
    layout.commit();
    this._state = new HeroStateView(this._hero, {fixedHPSize: true});
    this._state.position.set(layout.x, layout.y);
    this._controller.stage.addChild(this._state);
    layout.offset(0, this._state.getBounds().height);
  }

  private renderIcon(layout: Layout) {
    this._sprite = this._controller.resources.animated(this._hero.name + "_idle");
    const w = this._sprite.width;
    const h = this._sprite.height;
    this._sprite.width = 256 - (Sizes.uiMargin << 1);
    const scale = this._sprite.width / w;
    this._sprite.height = Math.floor(scale * h);
    // compute real height by trimmed size
    const trimmed_h = Math.floor(scale * this._sprite.texture.trim.height);
    const offset_y = this._sprite.height - trimmed_h;
    layout.offset(0, Sizes.uiMargin);
    this._sprite.position.set(layout.x + Sizes.uiMargin, layout.y + Sizes.uiMargin - offset_y);
    this._spriteBg = new PIXI.Graphics()
      .beginFill(Colors.uiBackground)
      .drawRect(0, 0, 256, trimmed_h + (Sizes.uiMargin << 1))
      .endFill();
    this._spriteBg.position.set(layout.x, layout.y);
    this._controller.stage.addChild(this._spriteBg, this._sprite);
    layout.offset(0, trimmed_h + (Sizes.uiMargin << 1));
  }

  private renderIncreaseHealth(layout: Layout): void {
    const button = new Button({
      label: "+",
      width: 24,
      height: 24
    });
    button.position.set(layout.x, layout.y);
    this._selectable.set(1, 0, button, () => this._hero.increaseHealth());
    this._selectable.merge(1, 0, 1, 12);
    this._buttons.push(button);
    this._controller.stage.addChild(button);
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
    this._selectable.set(0, 0, button, () => this._controller.generateDungeon(this._options));
    this._selectable.merge(0, 0, 1, 12);
    this._buttons.push(button);
    this._controller.stage.addChild(button);
    layout.offset(0, 32);
  }

  private renderInventory(layout: Layout): void {
    const controller = new DefaultInventoryActionsController(this._hero.inventory);
    this._inventory = new InventoryView(this._controller.resources, controller, this._selectable, 2, 0);
    this._inventory.position.set(layout.x, layout.y);
    this._controller.stage.addChild(this._inventory);
  }

  private handleInput() {
    this._selectable.handleInput();
  }
}