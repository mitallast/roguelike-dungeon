import * as PIXI from 'pixi.js';
import {SceneController} from "./index";

export interface BannerOptions {
  readonly text: string;
  readonly color: number;
}

export class Banner extends PIXI.Container {
  private readonly _controller: SceneController;
  private readonly _text: PIXI.BitmapText;
  private readonly _textShadow: PIXI.BitmapText;
  private readonly _background: PIXI.TilingSprite;
  private readonly _texture: PIXI.Texture;

  private _show: number = 120;
  private _fadeOut: number = 60;

  constructor(controller: SceneController, options: BannerOptions) {
    super();

    this._controller = controller;

    const size = 64;
    const height = size << 1;
    const screen = controller.screen;
    const y = Math.floor(screen.height * 0.7);

    this._text = new PIXI.BitmapText(options.text, {
      font: {name: "alagard", size: size},
      align: "center",
      tint: options.color
    });
    this._text.anchor = new PIXI.Point(0.5, 0.5);
    this._text.position.set(screen.width >> 1, y);

    const blur = new PIXI.filters.BlurFilter();
    blur.blurY = 1;
    blur.blurX = 10;
    blur.quality = 4;

    this._textShadow = new PIXI.BitmapText(options.text, {
      font: {name: "alagard", size: size},
      align: "center",
      tint: options.color
    });
    this._textShadow.anchor = new PIXI.Point(0.5, 0.5);
    this._textShadow.position.set(screen.width >> 1, y);
    this._textShadow.width += size * 0.7;
    this._textShadow.alpha = 0.5;
    this._textShadow.filters = [blur];
    this._textShadow.filterArea = this._textShadow.getBounds().clone().pad(50, 0);

    this._texture = Banner.gradient(1, height);
    this._background = new PIXI.TilingSprite(this._texture, screen.width, height);
    this._background.position.set(0, y - (height >> 1));
    this.addChild(this._background, this._textShadow, this._text);
    this._controller.ticker.add(this.update, this);
  }

  private update(deltaTime: number): void {
    if (this._show > 0) {
      this._show -= deltaTime;
    } else if (this._fadeOut > 0) {
      this._fadeOut -= deltaTime;
      this.alpha = this._fadeOut / 60;
    } else {
      this._controller.closeBanner();
    }
  }

  destroy(): void {
    super.destroy();
    this._controller.ticker.remove(this.update, this);
    this._text.destroy();
    this._background.destroy();
    this._texture.destroy(true);
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