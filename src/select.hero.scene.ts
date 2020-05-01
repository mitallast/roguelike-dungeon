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
  private readonly controller: SceneController;
  private readonly heroes: SelectHeroView[] = [];
  private readonly selectable: SelectableGrid;

  constructor(controller: SceneController) {
    this.controller = controller;
    this.selectable = new SelectableGrid(controller.joystick);
  }

  init(): void {
    this.renderTitle();
    this.renderHeroes();
    this.controller.app.ticker.add(this.selectable.handleInput, this.selectable);
  }

  destroy(): void {
    this.controller.app.ticker.remove(this.selectable.handleInput, this.selectable);
    this.heroes.forEach(h => h.destroy());
    this.controller.stage.removeChildren();
  }

  pause(): void {
  }

  resume(): void {
  }

  private renderTitle() {
    let title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(title);
  }

  private renderHeroes() {
    const c_w = this.controller.app.screen.width;
    const c_h = this.controller.app.screen.height;

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

      const view = new SelectHeroView(rect_w, rect_h, heroName, this.controller.resources);
      view.position.set(d_x, d_y);
      this.heroes.push(view);
      this.controller.stage.addChild(view);

      this.selectable.set(i, 0, view, () => this.select(heroName));
    }
    this.selectable.reset();
  }

  private select(name: string): void {
    const hero = Hero.load(name, this.controller.persistent);
    const weapon = new Weapon(weapons.knife);
    hero.inventory.equipment.weapon.set(weapon);
    this.controller.generateDungeon({
      level: 1,
      hero: hero
    });
  }
}

class SelectHeroView extends PIXI.Container implements Selectable {
  private readonly selectedBg: PIXI.Graphics;
  private readonly notSelectedBg: PIXI.Graphics;
  private readonly title: PIXI.BitmapText;
  private readonly sprite: PIXI.AnimatedSprite;
  private isSelected = false;

  constructor(
    width: number,
    height: number,
    heroName: string,
    resources: Resources
  ) {
    super();
    this.selectedBg = new PIXI.Graphics()
      .beginFill(Colors.uiSelected)
      .drawRect(0, 0, width, height)
      .endFill();
    this.notSelectedBg = new PIXI.Graphics()
      .beginFill(Colors.uiNotSelected)
      .drawRect(0, 0, width, height)
      .endFill();

    this.title = new PIXI.BitmapText(heroName, {font: {name: 'alagard', size: title_h}});
    this.title.anchor = 0.5;
    this.title.position.set(width >> 1, margin);

    const sprite_w = width - (margin << 1);
    const scale = sprite_w / tile_w;
    const sprite_h = Math.floor(tile_h * scale);

    this.sprite = resources.animated(heroName + "_idle");
    this.sprite.width = sprite_w;
    this.sprite.height = sprite_h;
    this.sprite.position.set(margin, margin + margin + title_h);

    this.addChild(this.selectedBg, this.notSelectedBg, this.title, this.sprite);
    this.selected = false;
  }

  get selected(): boolean {
    return this.isSelected;
  }

  set selected(selected: boolean) {
    this.isSelected = selected;
    if (selected) {
      this.selectedBg.visible = true;
      this.notSelectedBg.visible = false;
      this.title.visible = true;
      this.sprite.gotoAndPlay(0);
    } else {
      this.selectedBg.visible = false;
      this.notSelectedBg.visible = true;
      this.title.visible = false;
      this.sprite.gotoAndStop(0);
    }
  }

  destroy() {
    super.destroy();
    this.selectedBg.destroy();
    this.notSelectedBg.destroy();
    this.title.destroy();
    this.sprite.destroy();
  }
}