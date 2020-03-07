import {Scene, SceneController} from "./scene";
// @ts-ignore
import * as PIXI from 'pixi.js';

export class KeyBindScene implements Scene {
  private readonly controller: SceneController;

  constructor(controller: SceneController) {
    this.controller = controller;
  }

  init(): void {
    this.renderTitle();
    this.renderHelp();
  }

  update(delta: number): void {
    this.handleInput();
  }

  destroy(): void {
    this.controller.stage.removeChildren();
  }

  renderTitle() {
    let style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 100,
      fill: "white"
    });
    let title = new PIXI.Text("ROGUELIKE DUNGEON", style);
    title.anchor.set(0.5, 0);
    title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(title);
  }

  renderHelp() {
    let style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 20,
      fill: "white"
    });

    const bindings = [
      "WASD - top, left, bottom, right",
      "F - action",
      "Q - drop weapon",
      "1 ... 0 - inventory",
      "",
      "PRESS F TO CONTINUE",
    ];
    for (let i = 0; i < bindings.length; i++) {
      const text = bindings[i];
      if (text.length > 0) {
        const line = new PIXI.Text(text, style);
        line.position.set(40, 200 + i * 30);
        this.controller.stage.addChild(line);
      }
    }
  }

  handleInput() {
    if (!this.controller.joystick.hit.processed) {
      this.controller.joystick.hit.reset();
      this.controller.selectHero();
    }
  }
}