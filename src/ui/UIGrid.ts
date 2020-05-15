import * as PIXI from "pixi.js";
import {Sizes} from "./UISizeScheme";
import {UIContainer} from "./UIContainer";

export class UIGrid extends UIContainer {
  private readonly _padding: number;
  private readonly _spacing: number;

  private readonly _grid: (PIXI.DisplayObject | null)[][] = []; // row >> cell
  private _rows: number = 0;
  private _cols: number = 0;

  constructor(options: {
    spacing?: number;
    padding?: number;
    backgroundColor?: number;
  } = {}) {
    super(options);
    this._spacing = options.spacing !== undefined ? options.spacing : Sizes.uiMargin;
    this._padding = options.padding !== undefined ? options.padding : Sizes.uiMargin;
  }

  setGrid(row: number, col: number, cell: PIXI.DisplayObject | null): void {
    while (this._rows <= row) {
      this._grid[this._rows] = [];
      for (let c = 0; c < this._cols; c++) {
        this._grid[this._rows][c] = null;
      }
      this._rows++;
    }
    while (this._cols <= col) {
      for (let r = 0; r < this._rows; r++) {
        this._grid[r][this._cols] = null;
      }
      this._cols++;
    }

    this._dirtyLayout = true;
    const prev = this._grid[row][col];
    if (prev) {
      this.removeChild(prev);
    }
    this._grid[row][col] = cell;
    if (cell) {
      this.addChild(cell);
    }
  }

  protected _updateLayout(): void {
    const sizes: [number, number][][] = []; // [width, height]
    for (let row = 0; row < this._rows; row++) {
      sizes[row] = [];
      for (let col = 0; col < this._cols; col++) {
        const child = this._grid[row][col];
        if (child) {
          const bounds = child.getBounds();
          sizes[row][col] = [bounds.width, bounds.height];
        } else {
          sizes[row][col] = [0, 0];
        }
      }
    }

    this._height = this._padding;
    const rowHeights: number[] = [];
    for (let row = 0; row < this._rows; row++) {
      rowHeights[row] = 0;
      for (let col = 0; col < this._cols; col++) {
        rowHeights[row] = Math.max(rowHeights[row], sizes[row][col][1]);
      }
      if (row > 0) this._height += this._spacing;
      this._height += rowHeights[row]
    }
    this._height += this._padding;

    this._width = this._padding;
    const colWidths: number[] = [];
    for (let col = 0; col < this._cols; col++) {
      colWidths[col] = 0;
      for (let row = 0; row < this._rows; row++) {
        colWidths[col] = Math.max(colWidths[col], sizes[row][col][0]);
      }
      if (col > 0) this._width += this._spacing;
      this._width += colWidths[col];
    }
    this._width += this._padding;

    console.log("rowHeights", rowHeights);
    console.log("colWidths", colWidths);

    let y = this._padding;
    for (let row = 0; row < this._rows; row++) {
      let x = this._padding;
      for (let col = 0; col < this._cols; col++) {
        this._grid[row][col]?.position.set(x, y);
        x += colWidths[col] + this._spacing;
      }
      y += rowHeights[row] + this._spacing;
    }

    this._background.width = this._width;
    this._background.height = this._height;
    this._calculateBounds();
    this._dirtyLayout = false;
  }
}