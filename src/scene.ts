import {RNG} from "./rng";
import {Joystick} from "./input";
import {TileRegistry} from "./tilemap";
// @ts-ignore
import * as PIXI from "pixi.js";

export interface Scene {
  init(): void;
  tick(delta: number): void;
  destroy(): void
}

export class SceneController {
  readonly rng: RNG;
  readonly joystick: Joystick;
  readonly registry: TileRegistry;
  readonly app: PIXI.Application;
  readonly stage: PIXI.display.Stage;
  private scene: Scene;

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

  setScene(scene: Scene): void {
    if (this.scene) {
      this.scene.destroy();
    }
    this.scene = scene;
    this.scene.init();
  }

  tick(delta: number): void {
    this.scene.tick(delta);
  }
}