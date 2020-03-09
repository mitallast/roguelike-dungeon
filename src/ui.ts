import {Selectable} from "./selectable";
import {Colors} from "./colors";
// @ts-ignore
import * as PIXI from "pixi.js";

export class Button extends PIXI.Container implements Selectable {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _text: PIXI.BitmapText;
  private readonly _bg: PIXI.Graphics;
  private _selected: boolean;

  constructor(options: {
    label: string,
    selected?: boolean,
    width?: number
    height?: number
  }) {
    super();
    this._width = options.width || 200;
    this._height = options.height || 24;
    this._bg = new PIXI.Graphics();
    this._text = new PIXI.BitmapText(options.label, {font: {name: "alagard", size: 16}});
    this._text.anchor = new PIXI.Point(0.5, 0.5);
    this._text.position.set(this._width >> 1, this._height >> 1);
    this.selected = options.selected || false;
    super.addChild(this._bg, this._text);
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(selected: boolean) {
    this._selected = selected;
    this._bg
      .clear()
      .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
      .drawRect(0, 0, this._width, this._height)
      .endFill();
  }
}