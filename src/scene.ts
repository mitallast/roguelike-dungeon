import {RNG} from "./rng";
import {Joystick} from "./input";
import {Resources} from "./resources";
import {YouDeadScene} from "./dead.scene";
import {GenerateOptions} from "./dungeon.generator";
import {GenerateDungeonScene} from "./generate.scene";
import {DungeonScene} from "./dungeon.scene";
import {DungeonMap} from "./dungeon.map";
import {KeyBindScene} from "./keybind.scene";
import {SelectHeroScene} from "./select.hero.scene";
import {UpdateHeroScene} from "./update.hero.scene";
import {InventoryModalScene} from "./inventory.modal";
import {Hero} from "./hero";
import {PersistentState, SessionPersistentState} from "./persistent.state";
import {DialogManager, DialogModalScene} from "./dialog";
import {NpcCharacter} from "./npc";
import * as PIXI from "pixi.js";

export interface Scene {
  init(): void;
  destroy(): void

  pause(): void;
  resume(): void;
}

export interface ModalScene {
  init(): void;
  destroy(): void
}

export class SceneController {
  readonly persistent: PersistentState;
  readonly rng: RNG;
  readonly joystick: Joystick;
  readonly dialogs: DialogManager;
  readonly resources: Resources;
  readonly app: PIXI.Application;
  readonly stage: PIXI.display.Stage;

  private mainScene: Scene | null = null;
  private modalScene: ModalScene | null = null;

  constructor(
    resources: Resources,
    app: PIXI.Application,
    stage: PIXI.display.Stage,
  ) {
    this.persistent = new SessionPersistentState();
    this.rng = new RNG();
    this.joystick = new Joystick();
    this.resources = resources;
    this.app = app;
    this.stage = stage;
    this.dialogs = new DialogManager(this);

    this.app.ticker.add(this.persistent.global.commit, this.persistent.global, PIXI.UPDATE_PRIORITY.LOW);
    this.app.ticker.add(this.persistent.session.commit, this.persistent.session, PIXI.UPDATE_PRIORITY.LOW);
  }

  private set scene(scene: Scene) {
    this.mainScene?.destroy();
    this.joystick.reset();
    this.mainScene = scene;
    this.mainScene.init();
  }

  keyBind(): void {
    this.scene = new KeyBindScene(this);
  }

  selectHero(): void {
    this.scene = new SelectHeroScene(this);
  }

  updateHero(options: GenerateOptions): void {
    this.scene = new UpdateHeroScene(this, options);
  }

  dead(): void {
    this.scene = new YouDeadScene(this);
  }

  generateDungeon(options: GenerateOptions): void {
    this.scene = new GenerateDungeonScene(this, options);
  }

  dungeon(hero: Hero, dungeon: DungeonMap): void {
    this.scene = new DungeonScene(this, hero, dungeon);
  }

  private modal(scene: ModalScene): void {
    PIXI.sound.play('text');

    this.mainScene?.pause();
    this.joystick.reset();
    this.modalScene = scene;
    this.modalScene.init();
  }

  closeModal(): void {
    this.modalScene?.destroy();
    this.joystick.reset();
    this.mainScene?.resume();
  }

  showInventory(hero: Hero, npc?: NpcCharacter): void {
    this.modal(new InventoryModalScene(this, hero, npc || null));
  }

  showDialog(hero: Hero, npc: NpcCharacter): void {
    const dialog = this.dialogs.dialog(hero, npc);
    this.modal(new DialogModalScene(this, dialog));
  }
}