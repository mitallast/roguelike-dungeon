import {HeroStateView} from "./hero";
import {DungeonLevel, DungeonTitle} from "./dungeon.level";
import {Scene, SceneController} from "./scene";
import {BeltInventoryView} from "./inventory";
import {BossHealthView} from "./boss.monster";

export class DungeonScene implements Scene {
  private readonly controller: SceneController;
  private readonly dungeon: DungeonLevel;
  private readonly titleView: DungeonTitle;
  private readonly inventoryView: BeltInventoryView;
  private readonly healthView: HeroStateView;
  private bossHealthView?: BossHealthView;

  constructor(controller: SceneController, dungeon: DungeonLevel) {
    this.controller = controller;
    this.dungeon = dungeon;

    this.titleView = new DungeonTitle();
    this.inventoryView = new BeltInventoryView(dungeon.hero.character.inventory.belt);
    this.healthView = new HeroStateView(dungeon.hero.character, {fixedHPSize: false});
  }

  init(): void {
    const c_w = this.controller.app.screen.width;
    const c_h = this.controller.app.screen.height;

    this.titleView.position.set(c_w >> 1, 16);
    this.titleView.zIndex = 10;
    this.controller.stage.addChild(this.titleView);

    const i_w = this.inventoryView.width;
    this.inventoryView.position.set((c_w >> 1) - (i_w >> 1), c_h - (32 + 4 + 16));
    this.inventoryView.zIndex = 11;
    this.controller.stage.addChild(this.inventoryView);

    this.healthView.position.set(16, 16);
    this.healthView.zIndex = 12;
    this.controller.stage.addChild(this.healthView);

    this.titleView.level = this.dungeon.level;

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
      this.bossHealthView.zIndex = 13;
      this.bossHealthView.position.set((c_w >> 1), 64);
      this.controller.stage.addChild(this.bossHealthView);
    }

    this.controller.stage.sortChildren();

    this.dungeon.ticker.start();
  }

  destroy(): void {
    this.bossHealthView?.destroy();
    this.titleView.destroy();
    this.healthView.destroy();
    this.inventoryView.destroy();
    this.dungeon.destroy();
    this.controller.stage.removeChildren();
  }

  pause(): void {
    this.dungeon.ticker.stop();
  }

  resume(): void {
    this.dungeon.ticker.start();
  }
}