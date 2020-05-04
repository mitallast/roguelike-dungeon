import {Scene, SceneController} from "./scene";
import * as PIXI from 'pixi.js';

export class KeyBindScene implements Scene {
  private readonly _controller: SceneController;

  constructor(controller: SceneController) {
    this._controller = controller;
  }

  init(): void {
    this.renderTitle();
    this.renderHelp();
    this._controller.app.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this._controller.app.ticker.remove(this.handleInput, this);
    this._controller.stage.removeChildren();
  }

  pause(): void {
  }

  resume(): void {
  }

  private renderTitle(): void {
    const title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this._controller.app.screen.width >> 1, 64);
    this._controller.stage.addChild(title);
  }

  private renderHelp(): void {
    const bindings = [
      "WASD - top, left, bottom, right",
      "F - action",
      "Q - drop weapon",
      "I - inventory",
      "1 ... 0 - belt",
      "",
      "PRESS F TO CONTINUE",
    ];
    for (let i = 0; i < bindings.length; i++) {
      const text = bindings[i];
      if (text.length > 0) {
        const line = new PIXI.BitmapText(text, {font: {name: 'alagard', size: 32}});
        line.position.set(40, 200 + i * 30);
        this._controller.stage.addChild(line);
      }
    }
  }

  private handleInput(): void {
    if (this._controller.joystick.hit.once()) {
      this._controller.selectHero();
    }
  }
}