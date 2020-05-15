import {Sizes} from "./UISizeScheme";
import {UIContainer} from "./UIContainer";

export class UIVerticalStack extends UIContainer {
  private readonly _padding: number;
  private readonly _spacing: number;

  constructor(options: {
    spacing?: number;
    padding?: number;
    backgroundColor?: number;
  } = {}) {
    super(options);
    this._spacing = options.spacing !== undefined ? options.spacing : Sizes.uiMargin;
    this._padding = options.padding !== undefined ? options.padding : Sizes.uiMargin;
  }

  protected _updateLayout(): void {
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