import {Hero, HeroStateView} from "./hero";
import {DungeonMap, DungeonTitle} from "./dungeon.map";
import {Scene, SceneController} from "./scene";
import {BeltInventoryView} from "./inventory";

export class DungeonScene implements Scene {
  private readonly _controller: SceneController;
  private readonly _dungeon: DungeonMap;
  private readonly _titleView: DungeonTitle;
  private readonly _inventoryView: BeltInventoryView;
  private readonly _healthView: HeroStateView;

  constructor(controller: SceneController, hero: Hero, dungeon: DungeonMap) {
    this._controller = controller;
    this._dungeon = dungeon;

    this._titleView = new DungeonTitle();
    this._inventoryView = new BeltInventoryView(this._controller.resources, hero.inventory.belt);
    this._healthView = new HeroStateView(hero, {fixedHPSize: false});
  }

  init(): void {
    const screen = this._controller.app.screen;

    this._titleView.position.set(screen.width >> 1, 16);
    this._titleView.zIndex = 10;
    this._controller.stage.addChild(this._titleView);

    const invWidth = this._inventoryView.width;
    this._inventoryView.position.set((screen.width  >> 1) - (invWidth >> 1), screen.height - (32 + 4 + 16));
    this._inventoryView.zIndex = 11;
    this._controller.stage.addChild(this._inventoryView);

    this._healthView.position.set(16, 16);
    this._healthView.zIndex = 12;
    this._controller.stage.addChild(this._healthView);

    this._titleView.level = this._dungeon.level;

    this._dungeon.container.zIndex = 0;
    this._controller.stage.addChild(this._dungeon.container);

    this._dungeon.light.layer.zIndex = 1;
    this._controller.stage.addChild(this._dungeon.light.layer);

    this._dungeon.lighting.zIndex = 2;
    this._dungeon.lighting.alpha = 0.8;
    this._controller.stage.addChild(this._dungeon.lighting);

    this._controller.stage.sortChildren();

    this._dungeon.ticker.start();
  }

  destroy(): void {
    this._titleView.destroy();
    this._healthView.destroy();
    this._inventoryView.destroy();
    this._dungeon.destroy();
    this._controller.stage.removeChildren();
  }

  pause(): void {
    this._dungeon.ticker.stop();
  }

  resume(): void {
    this._dungeon.ticker.start();
  }
}