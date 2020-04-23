import {Resources} from "./resources";
import {SceneController} from "./scene";
import {Colors} from "./ui";
import * as PIXI from 'pixi.js';
import * as sound from "pixi-sound";

// @ts-ignore
PIXI.sound = sound;

window.PIXI = PIXI;
import "pixi-layers";

// import {DungeonDesignEditor} from "./tunneler/editor";
// import {Editor} from "./editor";
// import {RulesEditor} from "./wfc/rules.editor";

(async function () {

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
  app.renderer.backgroundColor = Colors.background;

  const resources = new Resources(app.loader);
  await resources.load();

  document.getElementById("container")!.appendChild(app.view);

  const controller = new SceneController(resources, app, stage);
  controller.keyBind();

  // RulesEditor.dungeon(resources);

  // const rulesEditor = RulesEditor.dungeon(resources);
  // new Editor(80, 200, resources, rulesEditor);
  // await DungeonDesignEditor.run(resources, rulesEditor);

  const div = document.createElement("div");
  div.classList.add("container");
  document.body.append(div);
  const p = document.createElement('p');
  div.append(p);

  for (const name of Object.keys((PIXI.sound as any)._sounds)) {
    const button = document.createElement("button");
    p.append(button);
    button.append(name);
    button.addEventListener("click", () => PIXI.sound.play(name));
  }
})();