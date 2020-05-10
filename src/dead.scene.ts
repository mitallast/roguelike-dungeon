import * as PIXI from 'pixi.js';
import {Scene, SceneController} from "./scene";

export class YouDeadScene extends Scene {
  constructor(controller: SceneController) {
    super(controller);
  }

  init(): void {
    const title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this._controller.screen.width >> 1, 64);
    this.addChild(title);

    const youDead = new PIXI.BitmapText("YOU DEAD", {font: {name: "alagard", size: 128}, tint: 0xFF0000});
    youDead.anchor = 0.5;
    youDead.position.set(this._controller.screen.width >> 1, 256);
    this.addChild(youDead);

    const line = new PIXI.BitmapText("PRESS F TO RESTART", {font: {name: "alagard", size: 32}});
    line.anchor = 0.5;
    line.position.set(
      this._controller.screen.width >> 1,
      this._controller.screen.height - 64
    );
    this.addChild(line);

    this._controller.ticker.add(this.handleInput, this);
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