import {Scene, SceneController} from "./scene";
import {heroCharacterNames, Hero} from "./hero";
import {Weapon, weapons} from "./drop";
import {Colors, Selectable, SelectableGrid} from "./ui";
import {Resources} from "./resources";
import * as PIXI from "pixi.js";

const margin = 40;
const title_h = 32;
const tile_w = 16;
const tile_h = 28;

export class SelectHeroScene implements Scene {
  private readonly _controller: SceneController;
  private readonly _heroes: SelectHeroView[] = [];
  private readonly _selectable: SelectableGrid;

  constructor(controller: SceneController) {
    this._controller = controller;
    this._selectable = new SelectableGrid(controller.joystick);
  }

  init(): void {
    this.renderTitle();
    this.renderHeroes();
    this._controller.app.ticker.add(this._selectable.handleInput, this._selectable);
  }

  destroy(): void {
    this._controller.app.ticker.remove(this._selectable.handleInput, this._selectable);
    this._heroes.forEach(h => h.destroy());
    this._controller.stage.removeChildren();
  }

  pause(): void {
  }

  resume(): void {
  }

  private renderTitle() {
    let title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this._controller.app.screen.width >> 1, 64);
    this._controller.stage.addChild(title);
  }

  private renderHeroes() {
    const c_w = this._controller.app.screen.width;
    const c_h = this._controller.app.screen.height;

    const total = heroCharacterNames.length;

    const rect_w = Math.floor((c_w - margin * (total + 1)) / total);
    const sprite_w = rect_w - (margin << 1);
    const scale = sprite_w / tile_w;
    const sprite_h = Math.floor(tile_h * scale);
    const rect_h = sprite_h + title_h + margin * 3;

    for (let i = 0; i < total; i++) {
      const heroName = heroCharacterNames[i];

      const d_x = margin * (i + 1) + rect_w * i;
      const d_y = (c_h >> 1) - (rect_h >> 1);

      const view = new SelectHeroView(rect_w, rect_h, heroName, this._controller.resources);
      view.position.set(d_x, d_y);
      this._heroes.push(view);
      this._controller.stage.addChild(view);

      this._selectable.set(i, 0, view, () => this.select(heroName));
    }
    this._selectable.reset();
  }

  private select(name: string): void {
    const hero = Hero.load(name, this._controller.persistent);
    const weapon = new Weapon(weapons.knife);
    hero.inventory.equipment.weapon.set(weapon);
    this._controller.generateDungeon({
      level: 1,
      hero: hero
    });
  }
}

class SelectHeroView extends PIXI.Container implements Selectable {
  private readonly _selectedBg: PIXI.Graphics;
  private readonly _notSelectedBg: PIXI.Graphics;
  private readonly _title: PIXI.BitmapText;
  private readonly _sprite: PIXI.AnimatedSprite;
  private _isSelected = false;

  constructor(
    width: number,
    height: number,
    heroName: string,
    resources: Resources
  ) {
    super();
    this._selectedBg = new PIXI.Graphics()
      .beginFill(Colors.uiSelected)
      .drawRect(0, 0, width, height)
      .endFill();
    this._notSelectedBg = new PIXI.Graphics()
      .beginFill(Colors.uiNotSelected)
      .drawRect(0, 0, width, height)
      .endFill();

    this._title = new PIXI.BitmapText(heroName, {font: {name: 'alagard', size: title_h}});
    this._title.anchor = 0.5;
    this._title.position.set(width >> 1, margin);

    const sprite_w = width - (margin << 1);
    const scale = sprite_w / tile_w;
    const sprite_h = Math.floor(tile_h * scale);

    this._sprite = resources.animated(heroName + "_idle");
    this._sprite.width = sprite_w;
    this._sprite.height = sprite_h;
    this._sprite.position.set(margin, margin + margin + title_h);

    this.addChild(this._selectedBg, this._notSelectedBg, this._title, this._sprite);
    this.selected = false;
  }

  get selected(): boolean {
    return this._isSelected;
  }

  set selected(selected: boolean) {
    this._isSelected = selected;
    if (selected) {
      this._selectedBg.visible = true;
      this._notSelectedBg.visible = false;
      this._title.visible = true;
      this._sprite.gotoAndPlay(0);
    } else {
      this._selectedBg.visible = false;
      this._notSelectedBg.visible = true;
      this._title.visible = false;
      this._sprite.gotoAndStop(0);
    }
  }

  destroy() {
    super.destroy();
    this._selectedBg.destroy();
    this._notSelectedBg.destroy();
    this._title.destroy();
    this._sprite.destroy();
  }
}