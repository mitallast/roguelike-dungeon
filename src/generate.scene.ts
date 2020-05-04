import {Scene, SceneController} from "./scene";
import {DungeonGenerator, GenerateOptions} from "./dungeon.generator";
import {HybridDungeonGenerator} from "./wfc/dungeon.generator";
import {DungeonMap} from "./dungeon.map";
import {Colors} from "./ui";
import * as PIXI from "pixi.js";

export class GenerateDungeonScene implements Scene {
  private readonly _controller: SceneController;
  private readonly _generator: DungeonGenerator;
  private _promise: Promise<DungeonMap>;

  private _title: PIXI.BitmapText | null = null;
  private _progressBar: PIXI.Graphics;

  constructor(controller: SceneController, options: GenerateOptions) {
    this._controller = controller;
    this._generator = new HybridDungeonGenerator(this._controller);

    this._promise = this._generator.generate(options);
    this._promise.then((dungeon) => this._controller.dungeon(options.hero, dungeon));
    this._progressBar = new PIXI.Graphics();
  }

  init(): void {
    this.renderTitle();
    this.renderProgressBar();
    this._controller.app.ticker.add(this.update, this);
  }

  destroy(): void {
    this._controller.app.ticker.remove(this.update, this);
    this._title?.destroy();
    this._progressBar?.destroy();
  }

  pause(): void {
  }

  resume(): void {
  }

  private renderTitle(): void {
    this._title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    this._title.anchor = new PIXI.Point(0.5, 0);
    this._title.position.set(this._controller.app.screen.width >> 1, 64);
    this._controller.stage.addChild(this._title);
  }

  private renderProgressBar(): void {
    this._progressBar = new PIXI.Graphics();
    this._controller.stage.addChild(this._progressBar);
  }

  private update(): void {
    const screen = this._controller.app.screen;

    const margin = 40;
    const h = 60;
    const border = 4;
    const width = screen.width - margin - margin;
    const progressWidth = Math.floor((width - border - border) * this._generator.percent / 100);

    this._progressBar.clear();
    this._progressBar.beginFill(Colors.uiBackground);
    this._progressBar.drawRect(margin, screen.height - margin - h - border - border, width, h);
    this._progressBar.endFill();

    this._progressBar.beginFill(Colors.uiSelected);
    this._progressBar.drawRect(margin + border, screen.height - margin - h - border, progressWidth, h - border - border);
    this._progressBar.endFill();
  }
}