import {Joystick} from "./input";
import {TileRegistry} from "./tilemap";
import {HeroState, HeroStateView} from "./hero";
import {DungeonGenerator} from "./dungeon.generator";
import {TunnelingDungeonGenerator} from "./tunneling.generator";
import {DungeonLevel, DungeonTitleView} from "./dungeon.level";
import {YouDeadScene} from "./dead.scene";
import {RNG} from "./rng";
import {Scene, SceneController} from "./scene";
import {InventoryView} from "./inventory";
import {BossHealthView} from "./boss.monster";
import {WfcDungeonGenerator} from "./wfc.generator";

export class DungeonScene implements Scene {
  readonly rng: RNG;
  readonly joystick: Joystick;
  readonly registry: TileRegistry;
  readonly controller: SceneController;
  private readonly hero: HeroState;

  private level = 1;
  private dungeon: DungeonLevel;
  private readonly titleView: DungeonTitleView;
  private readonly inventoryView: InventoryView;
  private readonly healthView: HeroStateView;
  private bossHealthView: BossHealthView;

  constructor(controller: SceneController, hero: HeroState) {
    this.rng = controller.rng;
    this.joystick = controller.joystick;
    this.registry = controller.registry;
    this.controller = controller;
    this.hero = hero;

    this.titleView = new DungeonTitleView();
    this.inventoryView = new InventoryView(hero.inventory);
    this.healthView = new HeroStateView(hero);
  }

  init(): void {
    const c_w = this.controller.app.screen.width;
    const c_h = this.controller.app.screen.height;

    this.titleView.container.position.set(c_w >> 1, 16);
    this.titleView.container.zIndex = 10;
    this.controller.stage.addChild(this.titleView.container);

    const i_w = this.inventoryView.container.width;
    this.inventoryView.container.position.set((c_w >> 1) - (i_w >> 1), c_h - (32 + 4 + 16));
    this.inventoryView.container.zIndex = 11;
    this.controller.stage.addChild(this.inventoryView.container);

    this.healthView.container.position.set(16, 16);
    this.healthView.container.zIndex = 12;
    this.controller.stage.addChild(this.healthView.container);

    this.nextLevel();
  }

  tick(delta: number): void {
    this.dungeon.update(delta);
    this.inventoryView.update(delta);
    this.healthView.update(delta);
  }

  destroy(): void {
    this.bossHealthView?.destroy();
    this.titleView.destroy();
    this.healthView.destroy();
    this.inventoryView.destroy();
    this.dungeon.destroy();
    this.controller.stage.removeChildren();
  }

  nextLevel() {
    this.bossHealthView?.destroy();
    this.bossHealthView = null;
    this.dungeon?.destroy();

    let generator: DungeonGenerator;
    if (this.level === 1) {
      generator = new TunnelingDungeonGenerator(this, this.hero);
    } else {
      generator = new WfcDungeonGenerator(this, this.hero);
    }

    this.dungeon = generator.generate(this.level);
    this.titleView.setLevel(this.level);
    this.level++;

    this.dungeon.container.zIndex = 0;
    this.controller.stage.addChild(this.dungeon.container);

    this.dungeon.light.layer.zIndex = 1;
    this.controller.stage.addChild(this.dungeon.light.layer);

    this.dungeon.lighting.zIndex = 2;
    this.dungeon.lighting.alpha = 0.8;
    this.controller.stage.addChild(this.dungeon.lighting);

    if (this.dungeon.boss) {
      const c_w = this.controller.app.screen.width;
      this.bossHealthView = new BossHealthView(this.dungeon.boss.bossState);
      this.bossHealthView.container.zIndex = 13;
      this.bossHealthView.container.position.set((c_w >> 1), 64);
      this.controller.stage.addChild(this.bossHealthView.container);
    }

    this.controller.stage.sortChildren();
  }

  dead() {
    this.controller.setScene(new YouDeadScene(this.controller));
  }
}