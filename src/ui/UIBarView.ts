import * as PIXI from "pixi.js";
import {Colors} from "./UIColorScheme";
import {Sizes} from "./UISizeScheme";

export class UIBarView extends PIXI.Container {
  private readonly _rect: PIXI.Graphics;
  private readonly _label: PIXI.BitmapText;

  private _backgroundColor: number;
  private _rectColor: number;
  private _width: number;
  private _height: number;
  private _value: number;
  private _valueMax: number;
  private _center: boolean;

  private _dirty: boolean;

  set backgroundColor(color: number) {
    this._backgroundColor = color;
  }

  set rectColor(color: number) {
    this._rectColor = color;
    this._dirty = true;
  }

  set rectWidth(width: number) {
    this._width = width;
    this._dirty = true;
  }

  set rectHeight(height: number) {
    this._height = height;
    this._dirty = true;
  }

  set value(value: number) {
    this._value = value;
    this._dirty = true;
  }

  set valueMax(valueMax: number) {
    this._valueMax = valueMax;
    this._dirty = true;
  }

  set center(center: boolean) {
    this._center = center;
    this._dirty = true;
  }

  set label(text: string) {
    this._label.text = text;
  }

  constructor(options: {
    valueMax: number;
    width: number;
    height?: number;
    color: number;
    backgroundColor?: number;
    center?: boolean;
    label?: string;
  }) {
    super();
    this._backgroundColor = options.backgroundColor || Colors.uiBackground
    this._rectColor = options.color;
    this._width = options.width;
    this._height = options.height || 16 + (Sizes.uiBorder << 1);
    this._value = 0;
    this._valueMax = options.valueMax;
    this._center = options.center || false;
    this._dirty = true;

    this._rect = new PIXI.Graphics();
    this._label = new PIXI.BitmapText(options.label || "", {font: {name: "alagard", size: 16}});
    this.addChild(this._rect, this._label);

    this.update();
    PIXI.Ticker.shared.add(this.update, this, PIXI.UPDATE_PRIORITY.LOW);
  }

  destroy(): void {
    PIXI.Ticker.shared.remove(this.update, this);
    super.destroy({children: true});
  }

  private update(): void {
    if (!this._dirty) return;
    const width = this._width;
    const height = this._height;
    const border = Sizes.uiBorder;
    this._label.anchor = new PIXI.Point(this._center ? 0.5 : 0, 0.5);
    this._label.position.set(
      this._center ? width >> 1 : (border << 1),
      height >> 1
    );
    const valueWidth = Math.round((width - (border << 1)) * Math.min(this._value, this._valueMax) / this._valueMax);
    this._rect.clear()
      .beginFill(this._backgroundColor)
      .drawRect(0, 0, width, height)
      .endFill()
      .beginFill(this._rectColor)
      .drawRect(border, border, valueWidth, height - (border << 1))
      .endFill();
    this._dirty = true;
  }
}