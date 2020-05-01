import {Config} from "./config";
import {DungeonCrawler} from "./dungeon.crawler";
import {TunnelerCellType} from "./model";
import {RNG} from "../rng";
import {DungeonCrawlerConstraint, EvenSimpleTiledModel, TilesetRules} from "../wfc/even.simple.tiled";
import {Resolution} from "../wfc/model";
import {RulesEditor} from "../wfc/rules.editor";
import {Resources} from "../resources";
import * as PIXI from "pixi.js";

export class DungeonDesignEditor {
  private readonly resources: Resources;
  private readonly rulesEditor: RulesEditor;
  private readonly canvas: HTMLCanvasElement;
  private readonly text: HTMLTextAreaElement;

  constructor(
    resources: Resources,
    rulesEditor: RulesEditor,
    config: Config,
  ) {
    this.resources = resources;
    this.rulesEditor = rulesEditor;

    const text = this.text = document.createElement("textarea");
    text.addEventListener("keydown", e => e.stopPropagation());
    text.addEventListener("keyup", e => e.stopPropagation());
    text.value = JSON.stringify(config, undefined, 4);
    text.cols = 100;
    text.rows = 50;

    const button1 = document.createElement("button");
    button1.addEventListener("click", this.evaluate.bind(this));
    button1.append("Evaluate");

    const button2 = document.createElement("button");
    button2.addEventListener("click", this.evaluateWfc.bind(this));
    button2.append("Evaluate WFC");

    const button3 = document.createElement("button");
    button3.addEventListener("click", this.sampleWfc.bind(this));
    button3.append("Sample WFC");

    const button4 = document.createElement("button");
    button4.addEventListener("click", this.measureWfc.bind(this));
    button4.append("Measure WFC");

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.flexDirection = "row";
    buttons.append(button1, button2, button3, button4);

    this.canvas = document.createElement("canvas");

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.append(buttons, text);
    const right = document.createElement("div");
    left.style.display = "flex";
    right.append(this.canvas);

    const container = document.createElement("div");
    container.classList.add("container");
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.append(left, right);
    document.body.append(container);
  }

  private evaluate(): void {
    const config = JSON.parse(this.text.value);
    console.log("config", config);

    console.time("crawler");
    const crawler = new DungeonCrawler(config, RNG.create());
    crawler.generate();
    console.timeEnd("crawler");

    this.render(crawler);
  }

  private async evaluateWfc(): Promise<void> {
    const config: Config = JSON.parse(this.text.value);
    console.log("config", config);

    const tileset: TilesetRules = this.rulesEditor.buildRules();

    const model = new EvenSimpleTiledModel(this.resources, tileset, RNG.create(),
      config.width,
      config.height,
      [
        new DungeonCrawlerConstraint(config),
      ]
    );

    console.time("model loop run");
    let state;
    while (true) {
      console.time("model run");
      state = await model.run();
      console.timeEnd("model run");
      if (state !== Resolution.Decided) {
        console.error("failed run model");
      } else {
        console.info("success run model");
        break;
      }
    }
    console.timeEnd("model loop run");

    model.graphics([]);

    // model.graphics([]);

    // this.sample(model);
  }

  private async sampleWfc(): Promise<void> {
    const config: Config = JSON.parse(this.text.value);
    console.log("config", config);

    const tileset: TilesetRules = this.rulesEditor.buildRules();

    const model = new EvenSimpleTiledModel(this.resources, tileset, RNG.create(),
      config.width,
      config.height,
      [
        new DungeonCrawlerConstraint(config),
      ]
    );

    model.init();
    model.clear();
    model.graphics([]);
  }

  private async measureWfc(): Promise<void> {
    const config: Config = JSON.parse(this.text.value);
    console.log("config", config);

    const tileset: TilesetRules = this.rulesEditor.buildRules();

    const model = new EvenSimpleTiledModel(this.resources, tileset, RNG.create(),
      config.width,
      config.height,
      [
        new DungeonCrawlerConstraint(config),
      ]
    );

    let success = 0;
    let failed = 0;
    for (let i = 0; i < 1000; i++) {
      console.time("run tunneler+wfc");
      const status = await model.run();
      if (status === Resolution.Decided) {
        success++
      } else {
        failed++
      }
      console.timeEnd("run tunneler+wfc");
      console.log(`success: ${success} failed: ${failed} total: ${success + failed}`);
    }

    console.log(`complete! success: ${success} failed: ${failed} total: ${success + failed}`);
  }

  render(crawler: DungeonCrawler): void {
    const scale = 4;
    const canvas = this.canvas;
    canvas.width = crawler.config.width * scale;
    canvas.height = crawler.config.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < crawler.config.height; y++) {
      for (let x = 0; x < crawler.config.width; x++) {
        let color: string;
        switch (crawler.getMap({x: x, y: y})) {
          case TunnelerCellType.OPEN:
            color = 'rgb(0,255,255)';
            break;
          case TunnelerCellType.GUARANTEED_OPEN:
            color = 'rgb(0,255,200)';
            break;
          case TunnelerCellType.NON_JOIN_OPEN:
            color = 'rgb(0,255,100)';
            break;
          case TunnelerCellType.NON_JOIN_GUARANTEED_OPEN:
            color = 'rgb(0,255,0)';
            break;
          case TunnelerCellType.INSIDE_ROOM_OPEN:
            color = 'rgb(100,255,0)';
            break;
          case TunnelerCellType.INSIDE_TUNNEL_OPEN:
            color = 'rgb(200,255,0)';
            break;
          case TunnelerCellType.INSIDE_ANTEROOM_OPEN:
            color = 'rgb(255,255,0)';
            break;
          case TunnelerCellType.CLOSED:
            color = 'rgb(100,0,255)';
            break;
          case TunnelerCellType.GUARANTEED_CLOSED:
            color = 'rgb(50,0,255)';
            break;
          case TunnelerCellType.NON_JOIN_CLOSED:
            color = 'rgb(0,0,255)';
            break;
          case TunnelerCellType.NON_JOIN_GUARANTEED_CLOSED:
            color = 'rgb(0,100,255)';
            break;
          case TunnelerCellType.H_DOOR:
            color = 'rgb(255,0,200)';
            break;
          case TunnelerCellType.V_DOOR:
            color = 'rgb(255,0,255)';
            break;
          case TunnelerCellType.COLUMN:
            color = 'rgb(117,138,126)';
            break;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  static async run(resources: Resources, rulesEditor: RulesEditor): Promise<void> {
    const loader = new PIXI.Loader();
    loader.add("designs/1.json");
    await new Promise((resolve) => loader.load(() => resolve()));

    new DungeonDesignEditor(
      resources,
      rulesEditor,
      loader.resources['designs/1.json'].data
    );
  }
}