import * as PIXI from "pixi.js";
import {Scene, SceneController} from "./scene";
import {GenerateOptions} from "./dungeon";
import {Hero, HeroStateView} from "./characters";
import {HeroInventoryController, InventoryView} from "./inventory";
import {UIButton, UILayout, UISelectableGrid, Colors, Sizes} from "./ui";

export class UpdateHeroScene extends Scene {
  private readonly _hero: Hero;
  private readonly _options: GenerateOptions;

  private _title: PIXI.BitmapText | null = null;
  private _sprite: PIXI.AnimatedSprite | null = null;
  private _spriteBg: PIXI.Graphics | null = null;
  private _state: HeroStateView | null = null;
  private _inventory: InventoryView | null = null;

  private readonly _selectable: UISelectableGrid;

  constructor(controller: SceneController, options: GenerateOptions) {
    super(controller);
    this._hero = options.hero;
    this._options = options;
    this._selectable = new UISelectableGrid(controller.joystick);
  }

  init(): void {
    const layout = new UILayout();
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
    this._controller.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this._controller.ticker.remove(this.handleInput, this);
    super.destroy({children: true});
  }

  pause(): void {
  }

  resume(): void {
  }

  private renderTitle(layout: UILayout): void {
    this._title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    this._title.anchor = new PIXI.Point(0.5, 0);
    this._title.position.set(this._controller.screen.width >> 1, 64);
    this.addChild(this._title);
    layout.offset(0, 128 + Sizes.uiMargin);
    layout.commit();
  }

  private renderState(layout: UILayout): void {
    layout.offset(Sizes.uiMargin, 0);
    layout.commit();
    this._state = new HeroStateView(this._hero, {fixedHPSize: true});
    this._state.position.set(layout.x, layout.y);
    this.addChild(this._state);
    layout.offset(0, this._state.getBounds().height);
  }

  private renderIcon(layout: UILayout): void {
    this._sprite = this._controller.resources.animated(this._hero.name + "_idle");
    const w = this._sprite.width;
    const h = this._sprite.height;
    this._sprite.width = 256 - (Sizes.uiMargin << 1);
    const scale = this._sprite.width / w;
    this._sprite.height = Math.floor(scale * h);
    // compute real height by trimmed size
    const trimmedH = Math.floor(scale * this._sprite.texture.trim.height);
    const offsetY = this._sprite.height - trimmedH;
    layout.offset(0, Sizes.uiMargin);
    this._sprite.position.set(layout.x + Sizes.uiMargin, layout.y + Sizes.uiMargin - offsetY);
    this._spriteBg = new PIXI.Graphics()
      .beginFill(Colors.uiBackground)
      .drawRect(0, 0, 256, trimmedH + (Sizes.uiMargin << 1))
      .endFill();
    this._spriteBg.position.set(layout.x, layout.y);
    this.addChild(this._spriteBg, this._sprite);
    layout.offset(0, trimmedH + (Sizes.uiMargin << 1));
  }

  private renderIncreaseHealth(layout: UILayout): void {
    const button = new UIButton({
      label: "+",
      width: 24,
      height: 24
    });
    button.position.set(layout.x, layout.y);
    this._selectable.set(1, 0, button, () => this._hero.increaseHealth());
    this._selectable.merge(1, 0, 1, 12);
    this.addChild(button);
    layout.offset(0, 24);
  }

  private renderContinue(layout: UILayout): void {
    layout.offset(0, Sizes.uiMargin);
    const button = new UIButton({
      label: "Continue ...",
      width: 256,
      height: 32,
    });
    button.position.set(layout.x, layout.y);
    this._selectable.set(0, 0, button, () => this._controller.generateDungeon(this._options));
    this._selectable.merge(0, 0, 1, 12);
    this.addChild(button);
    layout.offset(0, 32);
  }

  private renderInventory(layout: UILayout): void {
    const controller = new HeroInventoryController(this._hero.inventory);
    this._inventory = new InventoryView(this._controller.resources, controller, this._selectable, 2, 0);
    this._inventory.position.set(layout.x, layout.y);
    this.addChild(this._inventory);
  }

  private handleInput(): void {
    this._selectable.handleInput();
  }
}