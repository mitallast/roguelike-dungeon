import {Scene, SceneController} from "./scene";
// @ts-ignore
import * as PIXI from 'pixi.js';

export class YouDeadScene implements Scene {
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
      fontSize: 200,
      fill: "red"
    });
    let title = new PIXI.Text("YOU DEAD", style);
    title.anchor.set(0.5, 0.5);
    title.position.set(
      this.controller.app.screen.width >> 1,
      this.controller.app.screen.height >> 1
    );
    this.controller.stage.addChild(title);
  }

  renderHelp() {
    let style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 20,
      fill: "white"
    });
    const line = new PIXI.Text("PRESS F TO RESTART", style);
    line.anchor.set(0.5, 1);
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