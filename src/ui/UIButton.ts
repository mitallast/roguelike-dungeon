import * as PIXI from "pixi.js";
import {UISelectable} from "./UISelectableGrid";
import {Colors, Sizes} from "./index";

export class UIButton extends PIXI.Container implements UISelectable {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _textSize: number;
  private readonly _border: boolean;
  private readonly _text: PIXI.BitmapText;
  private readonly _bg: PIXI.Graphics;
  private _selected: boolean = false;

  constructor(options: {
    readonly label: string;
    readonly selected?: boolean;
    readonly width?: number;
    readonly height?: number;
    readonly textSize?: number;
    readonly border?: boolean;
  }) {
    super();
    this._width = options.width || 200;
    this._height = options.height || 24;
    this._textSize = options.textSize || 16;
    this._border = options.border || false;
    this._bg = new PIXI.Graphics();
    this._text = new PIXI.BitmapText(options.label, {font: {name: "alagard", size: this._textSize}});
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
    if (this._border) {
      this._bg
        .clear()
        .beginFill(Colors.uiBackground)
        .drawRect(0, 0, this._width, this._height)
        .endFill()
        .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
        .drawRect(Sizes.uiBorder, Sizes.uiBorder, this._width - Sizes.uiBorder * 2, this._height - Sizes.uiBorder * 2)
        .endFill();
    } else {
      this._bg
        .clear()
        .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
        .drawRect(0, 0, this._width, this._height)
        .endFill();
    }
  }
}