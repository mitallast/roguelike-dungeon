import {HeroStateView} from "./hero";
import {DungeonLevel, DungeonTitleView} from "./dungeon.level";
import {Scene, SceneController} from "./scene";
import {BeltInventoryView} from "./inventory";
import {BossHealthView} from "./boss.monster";
// @ts-ignore
import * as PIXI from 'pixi.js';

export class DungeonScene implements Scene {
  private readonly controller: SceneController;
  private readonly dungeon: DungeonLevel;
  private readonly titleView: DungeonTitleView;
  private readonly inventoryView: BeltInventoryView;
  private readonly healthView: HeroStateView;
  private bossHealthView?: BossHealthView;

  constructor(controller: SceneController, dungeon: DungeonLevel) {
    this.controller = controller;
    this.dungeon = dungeon;

    this.titleView = new DungeonTitleView();
    this.inventoryView = new BeltInventoryView(dungeon.hero.character.inventory.belt);
    this.healthView = new HeroStateView(dungeon.hero.character, {fixedHPSize: false});
  }

  init(): void {
    const c_w = this.controller.app.screen.width;
    const c_h = this.controller.app.screen.height;

    this.titleView.container.position.set(c_w >> 1, 16);
    this.titleView.container.zIndex = 10;
    this.controller.stage.addChild(this.titleView.container);

    const i_w = (this.inventoryView as PIXI.Container).width;
    (this.inventoryView as PIXI.Container).position.set((c_w >> 1) - (i_w >> 1), c_h - (32 + 4 + 16));
    (this.inventoryView as PIXI.Container).zIndex = 11;
    this.controller.stage.addChild(this.inventoryView);

    (this.healthView as PIXI.Container).position.set(16, 16);
    (this.healthView as PIXI.Container).zIndex = 12;
    this.controller.stage.addChild(this.healthView);

    this.titleView.setLevel(this.dungeon.level);

    this.dungeon.container.zIndex = 0;
    this.controller.stage.addChild(this.dungeon.container);

    this.dungeon.light.layer.zIndex = 1;
    this.controller.stage.addChild(this.dungeon.light.layer);

    this.dungeon.lighting.zIndex = 2;
    this.dungeon.lighting.alpha = 0.8;
    this.controller.stage.addChild(this.dungeon.lighting);

    if (this.dungeon.boss) {
      const c_w = this.controller.app.screen.width;
      this.bossHealthView = new BossHealthView(this.dungeon.boss.character);
      this.bossHealthView.container.zIndex = 13;
      this.bossHealthView.container.position.set((c_w >> 1), 64);
      this.controller.stage.addChild(this.bossHealthView.container);
    }

    this.controller.stage.sortChildren();
  }

  update(delta: number): void {
    this.dungeon.update(delta);
    this.titleView.update(delta);
    this.bossHealthView?.update(delta);
  }

  destroy(): void {
    console.log("destroy");
    this.bossHealthView?.destroy();
    this.titleView.destroy();
    this.healthView.destroy();
    (this.inventoryView as PIXI.Container).destroy();
    this.dungeon.destroy();
    this.controller.stage.removeChildren();
  }
}