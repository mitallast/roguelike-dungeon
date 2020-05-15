import {UIContainer} from "./UIContainer";

export class UIFixedSizeContainer extends UIContainer {
  private readonly _fixedWidth: number;
  private readonly _fixedHeight: number;

  constructor(options: {
    readonly width?: number;
    readonly height?: number;
    readonly backgroundColor?: number;
  } = {}) {
    super(options);
    this._fixedWidth = options.width || 0;
    this._fixedHeight = options.height || 0;
  }

  protected _updateLayout(): void {
    this._width = this._fixedWidth;
    this._height = this._fixedHeight;
    this._calculateBounds();
    this._dirtyLayout = false;
  }
}