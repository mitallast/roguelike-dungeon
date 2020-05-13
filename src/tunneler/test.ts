import * as PIXI from "pixi.js";
import {RNG} from "../rng";
import {DungeonCrawler} from "./dungeon.crawler";
import {TunnelerCellType, DungeonCrawlerConfig} from "./model";

export class DungeonMakerTest {
  static async test(): Promise<void> {
    const loader = new PIXI.Loader();
    loader.add("designs/1.json");
    loader.add("designs/2.json");
    loader.add("designs/3.json");
    loader.add("designs/4.json");
    loader.add("designs/5.json");
    loader.add("designs/6.json");
    loader.add("designs/7.json");
    loader.add("designs/empty.1.json");
    loader.add("designs/empty.2.json");
    await new Promise((resolve) => loader.load(() => resolve()));

    this.testDesign(loader.resources['designs/1.json'].data);
    this.testDesign(loader.resources['designs/2.json'].data);
    this.testDesign(loader.resources['designs/3.json'].data);
    this.testDesign(loader.resources['designs/4.json'].data);
    this.testDesign(loader.resources['designs/5.json'].data);
    this.testDesign(loader.resources['designs/6.json'].data);
    this.testDesign(loader.resources['designs/7.json'].data);
    this.testDesign(loader.resources['designs/empty.1.json'].data);
    this.testDesign(loader.resources['designs/empty.2.json'].data);
  }

  static testDesign(config: DungeonCrawlerConfig): void {
    console.log("config", config);

    console.time("crawler");
    const dungeonCrawler = new DungeonCrawler(config, RNG.create());
    dungeonCrawler.generate();
    console.timeEnd("crawler");

    this.debug(dungeonCrawler);
  }

  static debug(crawler: DungeonCrawler): void {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = crawler.config.width * scale;
    canvas.height = crawler.config.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < crawler.config.height; y++) {
      for (let x = 0; x < crawler.config.width; x++) {
        let color = 'rgb(0,0,0)';
        switch (crawler.getMap({x: x, y: y})) {
          case TunnelerCellType.OPEN:
            color = 'rgb(26,255,0)';
            break;
          case TunnelerCellType.CLOSED:
            color = 'rgb(255,248,0)';
            break;
          case TunnelerCellType.GUARANTEED_OPEN:
            color = 'rgb(255,157,0)';
            break;
          case TunnelerCellType.GUARANTEED_CLOSED:
            color = 'rgb(255,50,0)';
            break;
          case TunnelerCellType.NON_JOIN_OPEN:
            color = 'rgb(255,0,62)';
            break;
          case TunnelerCellType.NON_JOIN_CLOSED:
            color = 'rgb(255,0,134)';
            break;
          case TunnelerCellType.NON_JOIN_GUARANTEED_OPEN:
            color = 'rgb(224,0,255)';
            break;
          case TunnelerCellType.NON_JOIN_GUARANTEED_CLOSED:
            color = 'rgb(126,0,255)';
            break;
          case TunnelerCellType.INSIDE_ROOM_OPEN:
            color = 'rgb(60,0,255)';
            break;
          case TunnelerCellType.INSIDE_TUNNEL_OPEN:
            color = 'rgb(0,0,255)';
            break;
          case TunnelerCellType.INSIDE_ANTEROOM_OPEN:
            color = 'rgb(0,78,255)';
            break;
          case TunnelerCellType.H_DOOR:
            color = 'rgb(0,145,255)';
            break;
          case TunnelerCellType.V_DOOR:
            color = 'rgb(0,204,255)';
            break;
          case TunnelerCellType.COLUMN:
            color = 'rgb(138,108,46)';
            break;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
  }
}