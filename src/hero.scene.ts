import {Scene, SceneController} from "./scene";
import {GenerateOptions} from "./dungeon.generator";

export class HeroScene implements Scene {
  private readonly controller: SceneController;
  private readonly options: GenerateOptions;

  constructor(controller: SceneController, options: GenerateOptions) {
    this.controller = controller;
    this.options = options;
  }

  destroy(): void {
  }

  init(): void {
  }

  update(delta: number): void {
  }
}