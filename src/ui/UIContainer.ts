import * as PIXI from "pixi.js";
import {Sizes} from "./index";

export interface UIContainerOptions {
  readonly spacing?: number;
  readonly padding?: number;
  readonly backgroundColor?: number;
}

export class VStack extends PIXI.Container {
  private _width: number = 0;
  private _height: number = 0;

  private _dirtyLayout: boolean = false;
  private readonly _padding: number;
  private readonly _spacing: number;
  private readonly _background: PIXI.Container;

  constructor(options: UIContainerOptions = {}) {
    super();
    this._spacing = options.spacing !== undefined ? options.spacing : Sizes.uiMargin;
    this._padding = options.padding !== undefined ? options.padding : Sizes.uiMargin;
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
      this.updateLayout();
    }
    super.updateTransform();
  }

  protected updateLayout(): void {
    let maxWidth = 0;
    let y = this._padding;
    const x = this._padding;
    let first = true;
    for (const child of this.children) {
      if (child === this._background) continue;
      if (!first) y += this._spacing;
      first = false;
      child.position.set(x, y);
      child.updateTransform();
      const bounds = child.getBounds();
      y += bounds.height;
      maxWidth = Math.max(maxWidth, bounds.width);
    }
    this._height = y + this._padding;
    this._width = maxWidth + this._padding * 2;
    this._background.width = this._width;
    this._background.height = this._height;
    this._calculateBounds();
    this._dirtyLayout = false;
  }
}

export class HStack extends PIXI.Container {
  private _width: number = 0;
  private _height: number = 0;

  private _dirtyLayout: boolean = false;
  private readonly _padding: number;
  private readonly _spacing: number;
  private readonly _background: PIXI.Container;

  constructor(options: UIContainerOptions = {}) {
    super();
    this._spacing = options.spacing !== undefined ? options.spacing : Sizes.uiMargin;
    this._padding = options.padding !== undefined ? options.padding : Sizes.uiMargin;
    if (options.backgroundColor !== undefined) {
      this._background = new PIXI.Graphics()
        .beginFill(options.backgroundColor)
        .drawRect(0, 0, 1, 1)
        .endFill();
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
      this.updateLayout();
    }
    super.updateTransform();
  }

  protected updateLayout(): void {
    let maxHeight = 0;
    const y = this._padding;
    let x = this._padding;
    let first = true;
    for (const child of this.children) {
      if (child === this._background) continue;
      if (!first) x += this._spacing;
      first = false;
      child.position.set(x, y);
      child.updateTransform();
      const bounds = child.getBounds();
      x += bounds.width;
      maxHeight = Math.max(maxHeight, bounds.height);
    }
    this._width = x + this._padding;
    this._height = maxHeight + this._padding * 2;
    this._background.width = this._width;
    this._background.height = this._height;
    this._calculateBounds();
    this._dirtyLayout = false;
  }
}