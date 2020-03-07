import {Scene, SceneController} from "./scene";
import {HeroState} from "./hero";
import {DungeonGenerator} from "./dungeon.generator";
import {TunnelingDungeonGenerator} from "./tunneling.generator";
import {WfcDungeonGenerator} from "./wfc.generator";
import {DungeonLevel} from "./dungeon.level";
// @ts-ignore
import * as PIXI from "pixi.js";
import {Colors} from "./colors";

export class GenerateDungeonScreen implements Scene {
  private readonly controller: SceneController;
  private readonly hero: HeroState;
  private readonly level: number;
  private readonly generator: DungeonGenerator;
  private promise: Promise<DungeonLevel>;

  private title: PIXI.Text;
  private progressBar: PIXI.Graphics;

  constructor(controller: SceneController, hero: HeroState, level: number) {
    this.controller = controller;
    this.hero = hero;
    this.level = level;

    if (this.level <= 5) {
      this.generator = new TunnelingDungeonGenerator(this.controller, this.hero);
    } else {
      this.generator = new WfcDungeonGenerator(this.controller, this.hero);
    }

    this.promise = this.generator.generate(this.level);
    this.promise.then((dungeon) => this.controller.dungeon(dungeon));
    this.progressBar = new PIXI.Graphics();
  }

  destroy(): void {
    this.title?.destroy();
    this.progressBar?.destroy();
  }

  init(): void {
    this.renderTitle();
    this.renderProgressBar();
  }

  renderTitle(): void {
    let style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 100,
      fill: "white"
    });
    this.title = new PIXI.Text("ROGUELIKE DUNGEON", style);
    this.title.anchor.set(0.5, 0);
    this.title.position.set(this.controller.app.screen.width >> 1, 64);
    this.controller.stage.addChild(this.title);
  }

  renderProgressBar(): void {
    this.progressBar = new PIXI.Graphics();
    this.controller.stage.addChild(this.progressBar);
  }

  update(delta: number): void {
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