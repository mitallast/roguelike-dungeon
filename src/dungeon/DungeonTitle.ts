import * as PIXI from "pixi.js";

export class DungeonTitle extends PIXI.Container {
  private readonly _title: PIXI.BitmapText;

  constructor(level: number) {
    super();
    this._title = new PIXI.BitmapText(`LEVEL ${level}`, {font: {name: 'alagard', size: 32}});
    this._title.anchor = 0.5;
    this._title.position.set(0, 16);
    this.addChild(this._title);
  }
}