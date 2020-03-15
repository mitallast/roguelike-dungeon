import {Scene, SceneController} from "./scene";
import {DungeonGenerator, GenerateOptions} from "./dungeon.generator";
import {TunnelingDungeonGenerator} from "./tunneling.generator";
import {WfcDungeonGenerator} from "./wfc.generator";
import {DungeonMap} from "./dungeon.map";
import {Colors} from "./ui";
import * as PIXI from "pixi.js";

export class GenerateDungeonScene implements Scene {
  private readonly controller: SceneController;
  private readonly generator: DungeonGenerator;
  private promise: Promise<DungeonMap>;

  private title: PIXI.BitmapText | null = null;
  private progressBar: PIXI.Graphics;

  constructor(controller: SceneController, options: GenerateOptions) {
    this.controller = controller;
    if (options.level <= 5) {
      this.generator = new TunnelingDungeonGenerator(this.controller);
    } else {
      this.generator = new WfcDungeonGenerator(this.controller);
    }

    this.promise = this.generator.generate(options);
    this.promise.then((dungeon) => this.controller.dungeon(options.hero, dungeon));
    this.progressBar = new PIXI.Graphics();
  }

  init(): void {
    this.renderTitle();
    this.renderProgressBar();
    this.controller.app.ticker.add(this.update, this);
  }

  destroy(): void {
    this.controller.app.ticker.remove(this.update, this);
    this.title?.destroy();
    this.progressBar?.destroy();
  }

  pause(): void {
  }

  resume(): void {
  }

  private renderTitle(): void {
    this.title = new PIXI.BitmapText("ROGUELIKE DUNGEON", {font: {name: 'alagard', size: 64}});
    this.title.anchor = new PIXI.Point(0.5, 0);
    this.title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(this.title);
  }

  private renderProgressBar(): void {
    this.progressBar = new PIXI.Graphics();
    this.controller.stage.addChild(this.progressBar);
  }

  private update(): void {
    const c_w = this.controller.app.screen.width;
    const c_h = this.controller.app.screen.height;

    const margin = 40;
    const h = 60;
    const border = 4;
    const w = c_w - margin - margin;
    const w_p = Math.floor((w - border - border) * this.generator.percent / 100);

    this.progressBar.clear();
    this.progressBar.beginFill(Colors.uiBackground, 0.3);
    this.progressBar.drawRect(margin, c_h - margin - h - border - border, w, h);
    this.progressBar.endFill();

    this.progressBar.beginFill(Colors.uiSelected, 0.3);
    this.progressBar.drawRect(margin + border, c_h - margin - h - border, w_p, h - border - border);
    this.progressBar.endFill();
  }
}