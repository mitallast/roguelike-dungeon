import {Joystick} from "./input";
import {TileRegistry} from "./tilemap";
import {SceneController} from "./scene";
import {RNG} from "./rng";
import {Render} from "./render";
import {KeyBindScene} from "./keybind.scene";


(async function () {
  const registry = new TileRegistry();
  await registry.load();

  const render = new Render();

  const rng = new RNG();
  const joystick = new Joystick();
  const controller = new SceneController();
  controller.setScene(new KeyBindScene(rng, joystick, registry, controller));

  function renderFrame() {
    controller.render(render);
    window.requestAnimationFrame(renderFrame);
  }
  renderFrame();
})();