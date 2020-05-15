import * as PIXI from "pixi.js";

export abstract class UIContainer extends PIXI.Container {
  protected _width: number = 0;
  protected _height: number = 0;

  protected _dirtyLayout: boolean = false;
  protected readonly _background: PIXI.Container;

  protected constructor(options: {
    backgroundColor?: number;
  }) {
    super();
    if (options.backgroundColor !== undefined) {
      this._background = new PIXI.Graphics()
        .beginFill(options.backgroundColor)
        .drawRect(0, 0, 1, 1)
        .endFill()
    } else {
      this._background = new PIXI.Container();
    }
    this.addChild(this._background);
  }

  protected onChildrenChange(): void {
    this._dirtyLayout = true;
  }

  protected _calculateBounds(): void {
    this._bounds.addFrame(this.transform, 0, 0, this._width, this._height);
  }

  updateTransform(): void {
    if (this._dirtyLayout) {
      this._updateLayout();
    }
    super.updateTransform();
  }

  updateLayout(): void {
    this._dirtyLayout = true;
  }

  protected abstract _updateLayout(): void;
}

