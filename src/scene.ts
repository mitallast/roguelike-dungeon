import {Render} from "./render";

export interface Scene {
  render(render: Render): void;
}

export class SceneController {
  private scene: Scene;

  setScene(scene: Scene) {
    this.scene = scene;
  }

  render(render: Render) {
    this.scene.render(render);
  }
}