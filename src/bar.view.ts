// @ts-ignore
import * as PIXI from "pixi.js";
import {Colors} from "./colors";

const BAR_BORDER = 4;
const BAR_HEIGHT = 18;

export class BarView extends PIXI.Container {
  private readonly _rect: PIXI.Graphics;
  private readonly _label: PIXI.BitmapText;

  private _color: number;
  private _width: number;
  private _widthMax: number;
  private readonly _labelCenter: boolean;

  constructor(options: {
    color: number,
    width?: number,
    widthMax: number,
    labelCenter?: boolean
  }) {
    super();
    this._color = options.color;
    this._width = options.width || 0;
    this._widthMax = options.widthMax;
    this._rect = new PIXI.Graphics();
    this._labelCenter = options.labelCenter || false;
    this._label = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this._label.anchor = new PIXI.Point(this._labelCenter ? 0.5 : 0, 0.5);
    this._label.position.set((BAR_BORDER << 1) + (this._labelCenter ? this._widthMax >> 1 : 0), BAR_BORDER + (BAR_HEIGHT >> 1));
    super.addChild(this._rect, this._label);
  }

  set color(color: number) {
    this._color = color;
    this.updateRect();
  }

  set width(width: number) {
    this._width = width;
    this.updateRect();
  }

  set label(text: string) {
    this._label.text = text;
  }

  set widthMax(widthMax: number) {
    this._widthMax = widthMax;
    this._label.position.set((BAR_BORDER << 1) + (this._labelCenter ? this._widthMax >> 1 : 0), BAR_BORDER + (BAR_HEIGHT >> 1));
    this.updateRect();
  }

  private updateRect() {
    this._rect.clear()
      .beginFill(Colors.uiBackground, 0.3)
      .drawRect(
        0, 0,
        this._widthMax + (BAR_BORDER << 1),
        BAR_HEIGHT + (BAR_BORDER << 1)
      )
      .endFill()
      .beginFill(this._color, 0.3)
      .drawRect(
        BAR_BORDER,
        BAR_BORDER,
        this._width,
        BAR_HEIGHT
      )
      .endFill();
  }
}