import {Level} from "./level";

export class Scene {
  level: Level;

  setLevel(level: Level) {
    this.level = level;
  }
}