import {RNG} from "./rng";
import {Joystick} from "./input";
import {TileRegistry} from "./tilemap";
import {YouDeadScene} from "./dead.scene";
import {GenerateOptions} from "./dungeon.generator";
import {GenerateDungeonScreen} from "./generate.scene";
import {DungeonScene} from "./dungeon.scene";
import {DungeonLevel} from "./dungeon.level";
import {KeyBindScene} from "./keybind.scene";
import {SelectHeroScene} from "./create.hero";
// @ts-ignore
import * as PIXI from "pixi.js";

export interface Scene {
  init(): void;
  update(delta: number): void;
  destroy(): void
}

export class SceneController {
  readonly rng: RNG;
  readonly joystick: Joystick;
  readonly registry: TileRegistry;
  readonly app: PIXI.Application;
  readonly stage: PIXI.display.Stage;
  private sceneView: Scene;

  constructor(
    rng: RNG,
    joystick: Joystick,
    registry: TileRegistry,
    app: PIXI.Application,
    stage: PIXI.display.Stage,
  ) {
    this.rng = rng;
    this.joystick = joystick;
    this.registry = registry;
    this.app = app;
    this.stage = stage;
  }

  private set scene(scene: Scene) {
    this.sceneView?.destroy();
    this.sceneView = scene;
    this.sceneView.init();
  }

  keyBind(): void {
    this.scene = new KeyBindScene(this);
  }

  selectHero(): void {
    this.scene = new SelectHeroScene(this);
  }

  dead(): void {
    this.scene = new YouDeadScene(this);
  }

  generateDungeon(options: GenerateOptions): void {
    this.scene = new GenerateDungeonScreen(this, options);
  }

  dungeon(dungeon: DungeonLevel): void {
    this.scene = new DungeonScene(this, dungeon);
  }

  tick(delta: number): void {
    this.sceneView?.update(delta);
  }
}