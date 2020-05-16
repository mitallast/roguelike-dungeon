import * as PIXI from 'pixi.js';
import {Scene, SceneController} from "./scene";

export class KeyBindScene extends Scene {
  constructor(controller: SceneController) {
    super(controller);
  }

  init(): void {
    this._controller.ticker.add(this.handleInput, this);
    const title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this._controller.screen.width >> 1, 64);
    this.addChild(title);

    const bindings = [
      "WASD - top, left, bottom, right",
      "WASD + SPACE - dodge",
      "F - action, hold for charged attack",
      "Q - drop weapon",
      "I - inventory",
      "P - show stats",
      "1 ... 0 - belt",
      "",
      "PRESS F TO CONTINUE",
    ];
    for (let i = 0; i < bindings.length; i++) {
      const text = bindings[i];
      if (text.length > 0) {
        const line = new PIXI.BitmapText(text, {font: {name: 'alagard', size: 32}});
        line.position.set(40, 200 + i * 30);
        this.addChild(line);
      }
    }
  }

  destroy(): void {
    this._controller.ticker.remove(this.handleInput, this);
    super.destroy({children: true});
  }

  pause(): void {
  }

  resume(): void {
  }

  private handleInput(): void {
    if (this._controller.joystick.hit.once()) {
      this._controller.selectHero();
    }
  }
}