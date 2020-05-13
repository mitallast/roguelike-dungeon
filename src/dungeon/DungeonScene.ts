import {Scene, SceneController} from "../scene";
import {DungeonMap} from "./DungeonMap";
import {DungeonTitle} from "./DungeonTitle";
import {BossMonster, Hero, HeroStateView, MonsterHealthView} from "../characters";
import {BeltInventoryView} from "../inventory";

export class DungeonScene extends Scene {
  private readonly _dungeon: DungeonMap;

  constructor(controller: SceneController, dungeon: DungeonMap) {
    super(controller);
    this._dungeon = dungeon;
  }

  init(): void {
    const screen = this._controller.screen;

    const titleView = new DungeonTitle(this._dungeon.level);
    titleView.position.set(screen.width >> 1, 16);
    titleView.zIndex = 10;
    this.addChild(titleView);

    this._dungeon.layer.zIndex = 0;
    this.addChild(this._dungeon.layer);

    this._dungeon.light.layer.zIndex = 1;
    this.addChild(this._dungeon.light.layer);

    this._dungeon.light.shadow.zIndex = 2;
    this._dungeon.light.shadow.alpha = 0.8;
    this.addChild(this._dungeon.light.shadow);

    const [hero] = this._dungeon.registry.query({type: Hero.type});

    const inventoryView = new BeltInventoryView(this._controller.resources, hero.state.inventory.belt);
    const invWidth = inventoryView.width;
    inventoryView.position.set((screen.width >> 1) - (invWidth >> 1), screen.height - (32 + 4 + 16));
    inventoryView.zIndex = 11;
    this.addChild(inventoryView);

    const healthView = new HeroStateView(hero, {fixedHPSize: false});
    healthView.position.set(16, 16);
    healthView.zIndex = 12;
    this.addChild(healthView);

    const [boss] = this._dungeon.registry.query({type: BossMonster.type});
    if (boss) {
      const healthView = new MonsterHealthView(boss);
      healthView.zIndex = 13;
      healthView.position.set((screen.width >> 1), 64);
      this.addChild(healthView);
    }

    this.sortChildren();

    this._dungeon.ticker.start();
  }

  destroy(): void {
    this._dungeon.destroy();
    super.destroy({children: true});
  }

  pause(): void {
    this._dungeon.ticker.stop();
  }

  resume(): void {
    this._dungeon.ticker.start();
  }
}