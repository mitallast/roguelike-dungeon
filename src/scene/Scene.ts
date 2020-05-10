import * as PIXI from "pixi.js";
import {SceneController} from "./SceneController";

export abstract class Scene extends PIXI.display.Stage {
  protected readonly _controller: SceneController;

  protected constructor(controller: SceneController) {
    super();
    this._controller = controller;
  }

  abstract init(): void;

  abstract pause(): void;

  abstract resume(): void;
}