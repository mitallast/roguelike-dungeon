import {Joystick} from "./input";
import {TileRegistry} from "./tilemap";
import {SceneController} from "./scene";
import {RNG} from "./rng";
import {KeyBindScene} from "./keybind.scene";
import {Colors} from "./colors";
// @ts-ignore
import * as PIXI from 'pixi.js';
// @ts-ignore
window.PIXI = PIXI;
import "pixi-layers";

(async function () {

  const app = new PIXI.Application({
    width: 1200,
    height: 700,
  });

  // create the stage instead of container
  const stage = new PIXI.display.Stage();
  app.stage = stage;

  const registry = new TileRegistry(app.loader);
  await registry.load();

  document.getElementById("container").appendChild(app.view);

  const rng = new RNG();
  const joystick = new Joystick();
  const controller = new SceneController(rng, joystick, registry, app, stage);
  controller.setScene(new KeyBindScene(controller));

  app.renderer.backgroundColor = Colors.background;
  app.ticker.add((delta: number) => controller.tick(delta));
})();