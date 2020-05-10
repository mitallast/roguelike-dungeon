import * as PIXI from "pixi.js";
import {RNG} from "../rng";
import {Joystick} from "../input";
import {Resources} from "../resources";
import {YouDeadScene} from "../dead.scene";
import {GenerateOptions, GenerateDungeonScene, DungeonScene, DungeonMap, DungeonBonfireModal} from "../dungeon";
import {KeyBindScene} from "../keybind.scene";
import {SelectHeroScene} from "../select.hero.scene";
import {UpdateHeroScene} from "../update.hero.scene";
import {InventoryModalScene} from "../inventory";
import {Hero, Npc} from "../characters";
import {PersistentState, SessionPersistentState} from "../persistent.state";
import {DialogManager, DialogModalScene} from "../dialog";
import {Banner, BannerOptions} from "./Banner";
import {
  BuyingInventoryController,
  HeroInventoryController,
  SellingInventoryController
} from "../inventory";
import {Scene} from "./Scene";
import {ModalScene} from "./ModalScene";

export class SceneController {
  private readonly _app: PIXI.Application;
  private _scene: Scene | null = null;
  private _modalScene: ModalScene | null = null;
  private _banner: Banner | null = null;

  readonly persistent: PersistentState;
  readonly rng: RNG;
  readonly joystick: Joystick;
  readonly resources: Resources;
  readonly ticker: PIXI.Ticker;
  readonly loader: PIXI.Loader;
  readonly screen: PIXI.Rectangle;
  readonly dialogs: DialogManager;

  constructor(app: PIXI.Application) {
    this.persistent = new SessionPersistentState();
    this.rng = RNG.create();
    this.joystick = new Joystick();
    this.resources = new Resources(app.loader);
    this._app = app;
    this.ticker = app.ticker;
    this.loader = app.loader;
    this.screen = app.screen;
    this.dialogs = new DialogManager(this);

    this.ticker.add(this.persistent.global.commit, this.persistent.global, PIXI.UPDATE_PRIORITY.LOW);
    this.ticker.add(this.persistent.session.commit, this.persistent.session, PIXI.UPDATE_PRIORITY.LOW);
  }

  async init(): Promise<void> {
    await this.resources.load();
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

  updateHero(hero: Hero, level: number): void {
    this.setScene(new UpdateHeroScene(this, {level: level, hero: hero}));
  }

  dead(): void {
    this.setScene(new YouDeadScene(this));
  }

  generateDungeon(options: GenerateOptions): void {
    this.setScene(new GenerateDungeonScene(this, options));
  }

  dungeon(hero: Hero, dungeon: DungeonMap): void {
    this.setScene(new DungeonScene(this, hero, dungeon));
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

  showInventory(hero: Hero): void {
    const actions = new HeroInventoryController(hero.inventory);
    this.modal(new InventoryModalScene(this, actions));
  }

  sellInventory(hero: Hero, npc: Npc): void {
    const actions = new SellingInventoryController(hero, npc);
    this.modal(new InventoryModalScene(this, actions));
  }

  buyInventory(hero: Hero, npc: Npc): void {
    const actions = new BuyingInventoryController(hero, npc);
    this.modal(new InventoryModalScene(this, actions));
  }

  showDialog(hero: Hero, npc: Npc): void {
    const dialog = this.dialogs.dialog(hero, npc);
    this.modal(new DialogModalScene(this, dialog));
  }

  showBonfire(hero: Hero): void {
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