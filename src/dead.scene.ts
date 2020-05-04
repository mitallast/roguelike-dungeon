import {Scene, SceneController} from "./scene";
import * as PIXI from 'pixi.js';

export class YouDeadScene implements Scene {
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

    const youDead = new PIXI.BitmapText("YOU DEAD", {font: {name: "alagard", size: 128}, tint: 0xFF0000});
    youDead.anchor = 0.5;
    youDead.position.set(this._controller.app.screen.width >> 1, 256);
    this._controller.stage.addChild(youDead);
  }

  private renderHelp(): void {
    const line = new PIXI.BitmapText("PRESS F TO RESTART", {font: {name: "alagard", size: 32}});
    line.anchor = 0.5;
    line.position.set(
      this._controller.app.screen.width >> 1,
      this._controller.app.screen.height - 64
    );
    this._controller.stage.addChild(line);
  }

  private handleInput(): void {
    if (this._controller.joystick.hit.once()) {
      this._controller.selectHero();
    }
  }
}