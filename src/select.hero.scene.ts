import {Scene, SceneController} from "./scene";
import {heroCharacterNames, Hero} from "./characters";
import {Weapon, weapons} from "./drop";
import {Colors, Selectable, SelectableGrid} from "./ui";
import {Resources} from "./resources";
import * as PIXI from "pixi.js";

const MARGIN = 40;
const TITLE_H = 32;
const TILE_W = 16;
const TILE_H = 28;

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

  private renderTitle(): void {
    const title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this._controller.app.screen.width >> 1, 64);
    this._controller.stage.addChild(title);
  }

  private renderHeroes(): void {
    const screen = this._controller.app.screen;

    const total = heroCharacterNames.length;

    const rectWidth = Math.floor((screen.width - MARGIN * (total + 1)) / total);
    const spriteWidth = rectWidth - (MARGIN << 1);
    const scale = spriteWidth / TILE_W;
    const spriteHeight = Math.floor(TILE_H * scale);
    const rectHeight = spriteHeight + TITLE_H + MARGIN * 3;

    for (let i = 0; i < total; i++) {
      const heroName = heroCharacterNames[i];

      const posX = MARGIN * (i + 1) + rectWidth * i;
      const posY = (screen.height >> 1) - (rectHeight >> 1);

      const view = new SelectHeroView(rectWidth, rectHeight, heroName, this._controller.resources);
      view.position.set(posX, posY);
      this._heroes.push(view);
      this._controller.stage.addChild(view);

      this._selectable.set(i, 0, view, () => this.select(heroName));
    }
    this._selectable.reset();
  }

  private select(name: string): void {
    const hero = Hero.load(name, this._controller.persistent);
    const weapon = new Weapon(weapons.rusty_sword);
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

    this._title = new PIXI.BitmapText(heroName, {font: {name: 'alagard', size: TITLE_H}});
    this._title.anchor = 0.5;
    this._title.position.set(width >> 1, MARGIN);

    const spriteWidth = width - (MARGIN << 1);
    const scale = spriteWidth / TILE_W;
    const spriteHeight = Math.floor(TILE_H * scale);

    this._sprite = resources.animated(heroName + "_idle");
    this._sprite.width = spriteWidth;
    this._sprite.height = spriteHeight;
    this._sprite.position.set(MARGIN, MARGIN + MARGIN + TITLE_H);

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

  destroy(): void {
    super.destroy();
    this._selectedBg.destroy();
    this._notSelectedBg.destroy();
    this._title.destroy();
    this._sprite.destroy();
  }
}