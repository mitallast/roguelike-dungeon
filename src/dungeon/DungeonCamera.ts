import {SceneController} from "../scene";

export class DungeonCamera {
  private readonly _controller: SceneController;
  private readonly _containers: PIXI.Container[] = [];

  private _x: number = 0;
  private _y: number = 0;
  private _scale: number = 2;

  constructor(controller: SceneController) {
    this._controller = controller;
  }

  add(container: PIXI.Container): void {
    this._containers.push(container);
    const screen = this._controller.screen;
    const x = (screen.width >> 1) - this._x * this._scale;
    const y = (screen.height >> 1) - this._y * this._scale;
    container.position.set(x, y);
    container.scale.set(this._scale, this._scale);
  }

  set scale(scale: number) {
    this._scale = scale;
    for (const container of this._containers) {
      container.scale.set(scale, scale);
    }
  }

  setPosition(x: number, y: number): void {
    this._x = x;
    this._y = y;
    const screen = this._controller.screen;
    const posX = (screen.width >> 1) - this._x * this._scale;
    const posY = (screen.height >> 1) - this._y * this._scale;
    for (const container of this._containers) {
      container.position.set(posX, posY);
    }
  }
}