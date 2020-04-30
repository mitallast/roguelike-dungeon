import {SceneController} from "./scene";
import * as PIXI from 'pixi.js';

export interface DungeonBannerOptions {
  readonly text: string;
  readonly tint: number;
}

export class SceneBanner extends PIXI.Container {
  private readonly controller: SceneController;
  private readonly text: PIXI.BitmapText;
  private readonly background: PIXI.TilingSprite;
  private readonly texture: PIXI.Texture;

  private show: number = 120;
  private fadeOut: number = 60;

  constructor(controller: SceneController, options: DungeonBannerOptions) {
    super();

    this.controller = controller;

    const size = 64;
    const height = size + 24;
    const screen = this.controller.app.screen;
    const y = Math.floor(screen.height * 0.7);

    this.text = new PIXI.BitmapText(options.text, {
      font: {name: "alagard", size: size},
      align: "center",
      tint: options.tint
    });
    this.text.anchor = new PIXI.Point(0.5, 0.5);
    this.text.position.set(screen.width >> 1, y);
    this.texture = SceneBanner.gradient(1, height);
    this.background = new PIXI.TilingSprite(this.texture, screen.width, height);
    this.background.position.set(0, y - (height >> 1));
    this.addChild(this.background, this.text);
    this.controller.stage.addChild(this);
    this.controller.app.ticker.add(this.update, this);
  }

  private update(deltaTime: number): void {
    if (this.show > 0) {
      this.show -= deltaTime;
    } else if (this.fadeOut > 0) {
      this.fadeOut -= deltaTime;
      this.alpha = this.fadeOut / 60;
    } else {
      this.controller.closeBanner();
    }
  }

  destroy(): void {
    super.destroy();
    this.controller.app.ticker.remove(this.update, this);
    this.text.destroy();
    this.background.destroy();
    this.texture.destroy(true);
  }

  private static gradient(width: number, height: number): PIXI.Texture {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d")!;
    const grd = ctx.createLinearGradient(0, 0, 0, height);
    grd.addColorStop(0, "rgba(0, 0, 0, 0)");
    grd.addColorStop(0.3, "rgba(0, 0, 0, 1)");
    grd.addColorStop(0.7, "rgba(0, 0, 0, 1)");
    grd.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);
    return PIXI.Texture.from(c);
  }
}