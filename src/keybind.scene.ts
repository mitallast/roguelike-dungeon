import {Scene, SceneController} from "./scene";
import * as PIXI from 'pixi.js';

export class KeyBindScene implements Scene {
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

  private renderTitle() {
    let title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    title.anchor = new PIXI.Point(0.5, 0);
    title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(title);
  }

  private renderHelp() {
    const bindings = [
      "WASD - top, left, bottom, right",
      "F - action",
      "Q - drop weapon",
      "I - inventory",
      "1 ... 0 - inventory",
      "",
      "PRESS F TO CONTINUE",
    ];
    for (let i = 0; i < bindings.length; i++) {
      const text = bindings[i];
      if (text.length > 0) {
        const line = new PIXI.BitmapText(text, {font: {name: 'alagard', size: 32}});
        line.position.set(40, 200 + i * 30);
        this.controller.stage.addChild(line);
      }
    }
  }

  private handleInput() {
    if (!this.controller.joystick.hit.processed) {
      this.controller.joystick.hit.reset();
      this.controller.selectHero();
    }
  }
}