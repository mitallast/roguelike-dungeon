import {Scene, SceneController} from "./scene";
import {heroMonsterNames, HeroState} from "./hero";
import {WeaponConfig} from "./drop";
import {Colors} from "./colors";
// @ts-ignore
import * as PIXI from "pixi.js";

export class SelectHeroScene implements Scene {
  private readonly controller: SceneController;

  private selected = 0;
  private readonly heroes: SelectHeroView[] = [];

  constructor(controller: SceneController) {
    this.controller = controller;
  }

  init(): void {
    this.renderTitle();
    this.renderHeroes();
  }

  update(delta: number): void {
    this.handleInput();
    this.updateHeroes();
  }

  destroy(): void {
    this.heroes.forEach(h => h.destroy());
    this.controller.stage.removeChildren();
  }

  renderTitle() {
    let title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = 0.5;
    title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(title);
  }

  renderHeroes() {
    const c_w = this.controller.app.screen.width;
    const c_h = this.controller.app.screen.height;

    const total = heroMonsterNames.length;
    const margin = 40;
    const rect_w = Math.floor((c_w - margin * (total + 1)) / total);

    const tile_w = 16;
    const tile_h = 28;

    const title_h = 32;

    const sprite_w = rect_w - (margin << 1);
    const scale = sprite_w / tile_w;
    const sprite_h = Math.floor(tile_h * scale);
    const rect_h = sprite_h + title_h + margin * 3;

    console.log("stage", c_w, c_h);
    console.log("rect", rect_w, rect_h);
    console.log("sprite", sprite_w, sprite_h);

    for (let i = 0; i < total; i++) {
      const heroName = heroMonsterNames[i];

      const d_x = margin * (i + 1) + rect_w * i;
      const d_y = (c_h >> 1) - (rect_h >> 1);
      const container = new PIXI.Container();
      console.log(d_x, d_y);
      container.position.set(d_x, d_y);

      const selected = new PIXI.Graphics();
      selected.beginFill(Colors.uiSelected);
      selected.drawRect(0, 0, rect_w, rect_h);
      selected.endFill();
      container.addChild(selected);

      const notSelected = new PIXI.Graphics();
      notSelected.beginFill(Colors.uiNotSelected);
      notSelected.drawRect(0, 0, rect_w, rect_h);
      notSelected.endFill();
      container.addChild(notSelected);

      let title = new PIXI.BitmapText(heroName, {font: {name: 'alagard', size: title_h}});
      title.anchor = 0.5;
      title.position.set(container.width >> 1, margin);
      title.visible = this.selected === i;
      container.addChild(title);

      const sprite = this.controller.resources.animated(heroName + "_idle");
      sprite.animationSpeed = 0.2;
      sprite.width = sprite_w;
      sprite.height = sprite_h;
      sprite.position.set(margin, margin + margin + title_h);
      container.addChild(sprite);

      this.heroes.push(new SelectHeroView(selected, notSelected, title, sprite));

      this.controller.stage.addChild(container);
    }
  }

  updateHeroes() {
    this.heroes.forEach((h, i) => {
      h.setSelected(i == this.selected);
    });
  }

  handleInput() {
    const joystick = this.controller.joystick;
    if (!joystick.moveLeft.processed) {
      joystick.moveLeft.processed = true;
      if (this.selected === 0) this.selected = heroMonsterNames.length - 1;
      else this.selected--;
    }
    if (!joystick.moveRight.processed) {
      joystick.moveRight.processed = true;
      this.selected = (this.selected + 1) % heroMonsterNames.length;
    }
    if (!joystick.hit.processed) {
      joystick.hit.reset();
      const name = heroMonsterNames[this.selected];
      const weapon = WeaponConfig.configs[0].create(this.controller.resources);
      const hero = new HeroState(name);
      hero.inventory.equipment.weapon.set(weapon);
      this.controller.updateHero({
        level: 1,
        hero: hero
      });
    }
  }
}

class SelectHeroView {
  private readonly selected: PIXI.Graphics;
  private readonly notSelected: PIXI.Graphics;
  private readonly title: PIXI.BitmapText;
  private readonly sprite: PIXI.AnimatedSprite;
  private isSelected = false;

  constructor(
    selected: PIXI.Graphics,
    notSelected: PIXI.Graphics,
    title: PIXI.BitmapText,
    sprite: PIXI.AnimatedSprite
  ) {
    this.selected = selected;
    this.notSelected = notSelected;
    this.title = title;
    this.sprite = sprite;
  }

  setSelected(isSelected: boolean): void {
    if (this.isSelected !== isSelected) {
      this.isSelected = isSelected;
      if (isSelected) {
        this.selected.visible = true;
        this.notSelected.visible = false;
        this.title.visible = true;
        this.sprite.gotoAndPlay(0);
      } else {
        this.selected.visible = false;
        this.notSelected.visible = true;
        this.title.visible = false;
        this.sprite.gotoAndStop(0);
      }
    } else {
      if (this.isSelected) {
        this.sprite.play();
      } else {
        this.sprite.stop();
      }
    }
  }

  destroy() {
    this.selected.destroy();
    this.notSelected.destroy();
    this.title.destroy();
    this.sprite.destroy();
  }
}