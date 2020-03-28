import {Config} from "./config";
import {DungeonCrawler} from "./dungeon.crawler";
import {RNG} from "../rng";
import * as PIXI from "pixi.js";

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

  static testDesign(config: Config): void {
    console.log("config", config);

    console.time("crawler");
    const dungeonCrawler = new DungeonCrawler(config, new RNG());
    dungeonCrawler.generate();
    console.timeEnd("crawler");

    dungeonCrawler.debug();
  }
}