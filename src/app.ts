import {Joystick} from "./input";
import {Resources} from "./resources";
import {SceneController} from "./scene";
import {RNG} from "./rng";
import {Colors} from "./ui";
import * as PIXI from 'pixi.js';

window.PIXI = PIXI;
import "pixi-layers";
import {SessionPersistentState} from "./persistent.state";

(async function () {

  PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;

  const app = new PIXI.Application({
    width: 1200,
    height: 700,
    resolution: 1,
    antialias: false,
  });

  // create the stage instead of container
  const stage = new PIXI.display.Stage();
  app.stage = stage;
  app.renderer.backgroundColor = Colors.background;

  const resources = new Resources(app.loader);
  await resources.load();

  document.getElementById("container")!.appendChild(app.view);

  const persistent = new SessionPersistentState();
  const rng = new RNG();
  const joystick = new Joystick();
  const controller = new SceneController(persistent, rng, joystick, resources, app, stage);
  controller.keyBind();
})();