import {RNG} from "./rng";
import {Joystick} from "./input";
import {Resources} from "./resources";
import {YouDeadScene} from "./dead.scene";
import {GenerateOptions} from "./dungeon.generator";
import {GenerateDungeonScene} from "./generate.scene";
import {DungeonScene} from "./dungeon.scene";
import {DungeonLevel} from "./dungeon.level";
import {KeyBindScene} from "./keybind.scene";
import {SelectHeroScene} from "./select.hero.scene";
import {UpdateHeroScene} from "./update.hero.scene";
import * as PIXI from "pixi.js";
import {InventoryModalScene} from "./inventory.modal";
import {HeroCharacter} from "./hero";
import {PersistentState} from "./persistent.state";

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
  readonly resources: Resources;
  readonly app: PIXI.Application;
  readonly stage: PIXI.display.Stage;

  private mainScene: Scene | null = null;
  private modalScene: ModalScene | null = null;

  constructor(
    persistent: PersistentState,
    rng: RNG,
    joystick: Joystick,
    resources: Resources,
    app: PIXI.Application,
    stage: PIXI.display.Stage,
  ) {
    this.persistent = persistent;
    this.rng = rng;
    this.joystick = joystick;
    this.resources = resources;
    this.app = app;
    this.stage = stage;

    this.app.ticker.add(this.persistent.global.commit, this.persistent.global, PIXI.UPDATE_PRIORITY.LOW);
    this.app.ticker.add(this.persistent.session.commit, this.persistent.session, PIXI.UPDATE_PRIORITY.LOW);
  }

  private set scene(scene: Scene) {
    this.mainScene?.destroy();
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

  dungeon(dungeon: DungeonLevel): void {
    this.scene = new DungeonScene(this, dungeon);
  }

  modal(scene: ModalScene): void {
    this.mainScene?.pause();
    this.modalScene = scene;
    this.modalScene.init();
  }

  closeModal(): void {
    this.modalScene?.destroy();
    this.mainScene?.resume();
  }

  showInventory(hero: HeroCharacter): void {
    this.modal(new InventoryModalScene(this, hero));
  }
}