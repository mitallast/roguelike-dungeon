import {Resources} from "./resources";
import {SceneController} from "./scene";
import {Colors} from "./ui";

import * as PIXI from 'pixi.js';

window.PIXI = PIXI;
import "pixi-layers";

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

  const controller = new SceneController(resources, app, stage);
  controller.keyBind();
})();