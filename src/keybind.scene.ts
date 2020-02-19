import {Scene, SceneController} from "./scene";
import {RNG} from "./rng";
import {Joystick} from "./input";
import {TileRegistry} from "./tilemap";
import {Render} from "./render";
import {SelectHeroScene} from "./create.hero";

export class KeyBindScene implements Scene {
  private readonly rng: RNG;
  private readonly joystick: Joystick;
  private readonly registry: TileRegistry;
  private readonly controller: SceneController;

  constructor(rng: RNG, joystick: Joystick, registry: TileRegistry, controller: SceneController) {
    this.rng = rng;
    this.joystick = joystick;
    this.registry = registry;
    this.controller = controller;
  }

  render(render: Render): void {
    this.handleInput();

    const c_w = render.canvas.width;
    const c_h = render.canvas.height;

    render.ctx.save();
    render.ctx.fillStyle = "rgb(34,34,34)";
    render.ctx.fillRect(0, 0, c_w, c_h);

    this.renderTitle(render);
    this.renderText(render);

    render.ctx.restore();
  }

  renderTitle(render: Render) {
    render.ctx.textAlign = "center";
    render.ctx.textBaseline = "top";
    render.ctx.font = "100px silkscreennormal";
    render.ctx.fillStyle = "rgb(255,255,255)";
    render.ctx.fillText("ROGUELIKE DUNGEON", render.canvas.width >> 1, 100);
  }

  renderText(render: Render) {
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
        render.ctx.textAlign = "start";
        render.ctx.textBaseline = "top";
        render.ctx.font = "20px silkscreennormal";
        render.ctx.fillStyle = "rgb(255,255,255)";
        render.ctx.fillText(text, 40, 200 + i * 30);
      }
    }
  }

  handleInput() {
    if (!this.joystick.hit.processed) {
      this.joystick.hit.processed = true;
      this.controller.setScene(new SelectHeroScene(this.rng, this.joystick, this.registry, this.controller))
    }
  }
}