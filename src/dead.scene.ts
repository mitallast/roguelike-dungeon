import {Scene, SceneController} from "./scene";
import * as PIXI from 'pixi.js';

export class YouDeadScene implements Scene {
  private readonly controller: SceneController;

  constructor(controller: SceneController) {
    this.controller = controller;
  }

  init(): void {
    this.renderTitle();
    this.renderHelp();
    this.controller.app.ticker.add(this.handleInput, this);
  }

  destroy(): void {
    this.controller.app.ticker.remove(this.handleInput, this);
    this.controller.stage.removeChildren();
  }

  pause(): void {
  }

  resume(): void {
  }

  renderTitle() {
    let title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(title);

    let youDead = new PIXI.BitmapText("YOU DEAD", {font: {name: "alagard", size: 128}, tint: 0xFF0000});
    youDead.anchor = 0.5;
    youDead.position.set(this.controller.app.screen.width >> 1, 256);
    this.controller.stage.addChild(youDead);
  }

  renderHelp() {
    const line = new PIXI.BitmapText("PRESS F TO RESTART", {font: {name: "alagard", size: 32}});
    line.anchor = 0.5;
    line.position.set(
      this.controller.app.screen.width >> 1,
      this.controller.app.screen.height - 64
    );
    this.controller.stage.addChild(line);
  }

  handleInput() {
    if (!this.controller.joystick.hit.processed) {
      this.controller.joystick.hit.reset();
      this.controller.selectHero();
    }
  }
}