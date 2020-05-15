import * as PIXI from "pixi.js";
import {RNG} from "../rng";
import {Joystick} from "../input";
import {Resources} from "../resources";
import {YouDeadScene} from "../dead.scene";
import {GenerateOptions, GenerateDungeonScene, DungeonScene, DungeonMap, DungeonBonfireModal} from "../dungeon";
import {KeyBindScene} from "../keybind.scene";
import {SelectHeroScene} from "../select.hero.scene";
import {InventoryModalScene} from "../inventory";
import {HeroState, HeroStateManager, HeroStatsModalScene} from "../characters/hero";
import {NpcManager, NpcState} from "../characters/npc";
import {MonsterManager} from "../characters/monsters";
import {DialogManager, DialogModalScene} from "../dialog";
import {Banner, BannerOptions} from "./Banner";
import {
  BuyingInventoryController,
  HeroInventoryController,
  SellingInventoryController
} from "../inventory";
import {Scene} from "./Scene";
import {ModalScene} from "./ModalScene";
import {PersistentStore} from "../persistent";
import {WeaponManager} from "../weapon";

export class SceneController {
  private readonly _app: PIXI.Application;
  private _scene: Scene | null = null;
  private _modalScene: ModalScene | null = null;
  private _banner: Banner | null = null;

  readonly rng: RNG;
  readonly joystick: Joystick;
  readonly resources: Resources;
  readonly ticker: PIXI.Ticker;
  readonly loader: PIXI.Loader;
  readonly screen: PIXI.Rectangle;
  readonly store: PersistentStore;

  readonly dialogManager: DialogManager;
  readonly heroManager: HeroStateManager;
  readonly npcManager: NpcManager;
  readonly monsterManager: MonsterManager;
  readonly weaponManager: WeaponManager;

  constructor(app: PIXI.Application) {
    this.rng = RNG.create();
    this.joystick = new Joystick();
    this.resources = new Resources(app.loader);
    this._app = app;
    this.ticker = app.ticker;
    this.loader = app.loader;
    this.screen = app.screen;
    this.store = PersistentStore.init("#");
    this.dialogManager = new DialogManager(this);
    this.heroManager = new HeroStateManager(this);
    this.npcManager = new NpcManager(this);
    this.monsterManager = new MonsterManager(this);
    this.weaponManager = new WeaponManager(this);
  }

  async init(): Promise<void> {
    await this.resources.load();
    this.weaponManager.init();
    this.npcManager.init();
    this.monsterManager.init();
    this.dialogManager.init();
  }

  destroy(): void {
    this._app.destroy();
  }

  get scene(): Scene | null {
    return this._scene;
  }

  private setScene(scene: Scene): void {
    this._scene?.destroy();
    this.joystick.reset();
    this._scene = scene;
    this._app.stage = this._scene;
    this._scene.init();
  }

  keyBind(): void {
    this.setScene(new KeyBindScene(this));
  }

  selectHero(): void {
    this.setScene(new SelectHeroScene(this));
  }

  dead(): void {
    this.setScene(new YouDeadScene(this));
  }

  generateDungeon(options: GenerateOptions): void {
    this.setScene(new GenerateDungeonScene(this, options));
  }

  dungeon(dungeon: DungeonMap): void {
    this.setScene(new DungeonScene(this, dungeon));
  }

  private modal(scene: ModalScene): void {
    PIXI.sound.play('text');

    this._scene?.pause();
    this.joystick.reset();
    this._modalScene = scene;
    this._scene?.addChild(scene);
    this._modalScene.init();
    this._modalScene.position.set(
      (this.screen.width >> 1) - (this._modalScene.width >> 1),
      (this.screen.height >> 1) - (this._modalScene.height >> 1),
    );
  }

  closeModal(): void {
    this._modalScene?.destroy();
    this.joystick.reset();
    this._scene?.resume();
  }

  showStats(hero: HeroState): void {
    this.modal(new HeroStatsModalScene(this, hero));
  }

  showInventory(hero: HeroState): void {
    const actions = new HeroInventoryController(hero);
    this.modal(new InventoryModalScene(this, actions));
  }

  sellInventory(hero: HeroState, npc: NpcState): void {
    const actions = new SellingInventoryController(hero, npc);
    this.modal(new InventoryModalScene(this, actions));
  }

  buyInventory(hero: HeroState, npc: NpcState): void {
    const actions = new BuyingInventoryController(hero, npc);
    this.modal(new InventoryModalScene(this, actions));
  }

  showDialog(hero: HeroState, npc: NpcState): void {
    const dialog = this.dialogManager.dialog(hero, npc);
    this.modal(new DialogModalScene(this, dialog));
  }

  showBonfire(hero: HeroState): void {
    this.modal(new DungeonBonfireModal(this, hero));
  }

  showBanner(options: BannerOptions): void {
    this.closeBanner();
    this._banner = new Banner(this, options);
    this._scene?.addChild(this._banner);
  }

  closeBanner(): void {
    this._banner?.destroy();
    this._banner = null;
  }
}