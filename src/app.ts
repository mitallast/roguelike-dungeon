import "pixi.js";
import "pixi-layers";
import "pixi-sound";

import {SceneController} from "./scene";

(async function (): Promise<void> {
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;
  PIXI.sound.volumeAll = 0.5;

  const app = new PIXI.Application({
    width: 1200,
    height: 700,
    resolution: 1,
    antialias: false,
  });

  // create the stage instead of container
  const stage = new PIXI.display.Stage();
  app.stage = stage;
  app.renderer.backgroundColor = 0x000000;

  document.getElementById("container")!.appendChild(app.view);

  const controller = new SceneController(app, stage);
  await controller.init();
  controller.keyBind();
})();