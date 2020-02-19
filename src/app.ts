import {Joystick} from "./input";
import {TileRegistry} from "./tilemap";
import {Scene, SceneController} from "./scene";
import {RNG} from "./rng";
import {Render} from "./render";
import {DungeonScene} from "./dungeon";


(async function () {
  const registry = new TileRegistry();
  await registry.load();

  const render = new Render();

  const rng = new RNG();
  const joystick = new Joystick();
  const controller = new SceneController();
  controller.setScene(new DungeonScene(rng, joystick, registry, controller));

  function renderFrame() {
    controller.render(render);
    window.requestAnimationFrame(renderFrame);
  }
  renderFrame();
})();