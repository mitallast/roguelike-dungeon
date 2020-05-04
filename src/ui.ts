import {Joystick} from "./input";
import * as PIXI from "pixi.js";

export interface ColorScheme {
  readonly background: number
  readonly uiBackground: number
  readonly uiSelected: number
  readonly uiNotSelected: number
  readonly uiRed: number
  readonly uiYellow: number
}

export const Colors: ColorScheme = {
  background: 0x101010,
  uiBackground: 0x202020,
  uiSelected: 0x505050,
  uiNotSelected: 0x404040,
  uiRed: 0xFF0000,
  uiYellow: 0xBF9E00,
};

export interface SizeScheme {
  readonly uiBorder: number;
  readonly uiMargin: number;
}

export const Sizes: SizeScheme = {
  uiBorder: 4,
  uiMargin: 16,
};

export class Button extends PIXI.Container implements Selectable {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _textSize: number;
  private readonly _text: PIXI.BitmapText;
  private readonly _bg: PIXI.Graphics;
  private _selected: boolean = false;

  constructor(options: {
    label: string,
    selected?: boolean,
    width?: number
    height?: number
    textSize?: number
  }) {
    super();
    this._width = options.width || 200;
    this._height = options.height || 24;
    this._textSize = options.textSize || 16;
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
    this._bg
      .clear()
      .beginFill(Colors.uiBackground)
      .drawRect(0, 0, this._width, this._height)
      .endFill()
      .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
      .drawRect(Sizes.uiBorder, Sizes.uiBorder, this._width - Sizes.uiBorder * 2, this._height - Sizes.uiBorder * 2)
      .endFill();
  }
}

export class Layout {
  private _commitX: number = 0;
  private _commitY: number = 0;

  private _offsetX: number = 0;
  private _offsetY: number = 0;

  commit(): void {
    this._commitX = this._offsetX;
    this._commitY = this._offsetY;
  }

  reset(): void {
    this._offsetX = this._commitX;
    this._offsetY = this._commitY;
  }

  offset(x: number, y: number) {
    this._offsetX += x;
    this._offsetY += y;
  }

  get x(): number {
    return this._offsetX;
  }

  get y(): number {
    return this._offsetY;
  }
}

export interface Selectable {
  selected: boolean;
}

function nextNonEmptyCount(counts: number[], from: number): number | null {
  for (let i = from + 1; i < counts.length; i++) {
    if (counts[i] > 0) {
      return i;
    }
  }
  return null;
}

function prevNonEmptyCount(counts: number[], from: number): number | null {
  for (let i = from - 1; i >= 0; i--) {
    if (counts[i] > 0) {
      return i;
    }
  }
  return null;
}

function nonEmptyCount(counts: number[], curr: number | null): number | null {
  const i = curr || 0;
  if (counts[i] > 0) return i;
  const p = prevNonEmptyCount(counts, i);
  if (p !== null) return p;
  const n = nextNonEmptyCount(counts, i);
  if (n !== null) return n;
  return null;
}

export class SelectableGrid {
  private readonly _joystick: Joystick;
  private readonly _cells: SelectableCell[][] = []; // y => x => cell
  private readonly _counts_x: number[] = [];
  private readonly _counts_y: number[] = [];
  private _limit_x: number = -1;
  private _limit_y: number = -1;

  private _selected_x: number | null = null;
  private _selected_y: number | null = null;

  constructor(joystick: Joystick) {
    this._joystick = joystick;
  }

  reset(): void {
    this.unmark();
    this._selected_x = nonEmptyCount(this._counts_x, this._selected_x);
    this._selected_y = nonEmptyCount(this._counts_y, this._selected_y);

    if (this._selected_x === null || this._selected_y === null) {
      this._selected_x = null;
      this._selected_y = null;
    } else {
      if (!this.cell(this._selected_x, this._selected_y).isSelectable) {
        const y = this._selected_y;
        const prev = (from: number): number | null => {
          for (let x = from - 1; x >= 0; x--) {
            if (this.cell(x, y).isSelectable) {
              return x;
            }
          }
          return null;
        };
        const p = prev(this._selected_x);
        if (p !== null) {
          this._selected_x = p;
        } else {
          const next = (from: number): number | null => {
            for (let x = from + 1; x <= this._limit_x; x++) {
              if (this.cell(x, y).isSelectable) {
                return x;
              }
            }
            return null;
          };
          const n = next(this._selected_x);
          if (n !== null) {
            this._selected_x = n;
          } else {
            throw "illegal state";
          }
        }
      }
    }
    this.mark();
  }

  moveLeft(): void {
    this.unmark();
    if (this._selected_x !== null && this._selected_y !== null) {
      const y = this._selected_y;
      if (this._counts_y[y] === 0) throw `illegal state: empty column ${y}`;
      const merged = this.selectedCell?.merged;
      const start_x = this._selected_x;
      const prev = (x: number): number => x > 0 ? x - 1 : this._limit_x;
      for (let x = prev(start_x); x != start_x; x = prev(x)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this._selected_x = x;
          break;
        }
      }
    }
    this.mark();
  }

  moveRight(): void {
    this.unmark();
    if (this._selected_x !== null && this._selected_y !== null) {
      const y = this._selected_y;
      if (this._counts_y[y] === 0) throw `illegal state: empty column ${y}`;
      const merged = this.selectedCell?.merged;
      const start_x = this._selected_x;
      const next = (x: number): number => (x + 1) % (this._limit_x + 1);
      for (let x = next(start_x); x != start_x; x = next(x)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this._selected_x = x;
          break;
        }
      }
    }
    this.mark();
  }

  moveUp(): void {
    this.unmark();
    if (this._selected_x !== null && this._selected_y !== null) {
      const x = this._selected_x;
      if (this._counts_x[x] === 0) throw `illegal state: empty row ${x}`;
      const merged = this.selectedCell?.merged;
      const start_y = this._selected_y;
      const prev = (y: number): number => y > 0 ? y - 1 : this._limit_y;
      for (let y = prev(start_y); y != start_y; y = prev(y)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this._selected_y = y;
          break;
        }
      }
    }
    this.mark();
  }

  moveDown(): void {
    this.unmark();
    if (this._selected_x !== null && this._selected_y !== null) {
      const x = this._selected_x;
      if (this._counts_x[x] === 0) throw `illegal state: empty row ${x}`;
      const merged = this.selectedCell?.merged;
      const start_y = this._selected_y;
      const next = (y: number): number => (y + 1) % (this._limit_y + 1);
      for (let y = next(start_y); y != start_y; y = next(y)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this._selected_y = y;
          break;
        }
      }
    }
    this.mark();
  }

  private unmark(): void {
    this.selectedCell?.unmark();
  }

  private mark(): void {
    this.selectedCell?.mark();
  }

  get selected(): [Selectable, () => void] | null {
    return this.selectedCell?.value || null;
  }

  private get selectedCell(): SelectableCell | null {
    if (this._selected_x !== null && this._selected_y !== null) {
      const cell = this.cell(this._selected_x, this._selected_y);
      if (cell.merged && cell.isRef) {
        return this.cell(cell.merged.from_x, cell.merged.from_y);
      } else {
        return cell;
      }
    }
    return null;
  }

  set(x: number, y: number, selectable: Selectable, action: () => void): void {
    if (x < 0 || y < 0) throw `illegal coordinate: ${x}:${y}`;
    const cell = this.cell(x, y);
    if (cell.isRef) throw `cell is ref: ${x}:${y}`;
    const has_prev = cell.value !== null;
    cell.value = [selectable, action];

    if (!has_prev) {
      if (cell.merged) {
        const merged = cell.merged;
        for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
          for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
            this._counts_x[sx]++;
            this._counts_y[sy]++;
          }
        }
      } else {
        this._counts_x[x]++;
        this._counts_y[y]++;
      }
    }

    this.reset();
  }

  merge(x: number, y: number, width: number, height: number): void {
    if (x < 0 || y < 0) throw `illegal coordinate: ${x}:${y}`;
    if (width < 1 || height < 1) throw `illegal size: ${width}:${height}`;
    const merged = new MergedRegion(x, y, x + width - 1, y + height - 1);
    const origin = this.cell(x, y);
    if (origin.isRef) throw `cell is ref: ${x}:${y}`;
    if (origin.merged) throw `cell is merged: ${JSON.stringify(origin.merged)}`;
    origin.merged = merged;
    const has_value = origin.value !== null;
    for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
      for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
        if (!(sx === x && sy === y)) {
          const cell = this.cell(sx, sy);
          if (cell.value) throw `merging cell already has value: ${sx}:${sy}`;
          if (cell.isRef) throw `merging cell is ref: ${sx}:${sy}`;
          cell.merged = merged;
          if (has_value) {
            this._counts_x[sx]++;
            this._counts_y[sy]++;
          }
        }
      }
    }
  }

  remove(x: number, y: number): void {
    if (x < 0 || y < 0) throw `illegal coordinate: ${x}:${y}`;
    const cell = this.cell(x, y);
    if (cell.isRef) throw `cell is ref: ${x}:${y}`;
    if (cell.value) {
      cell.value = null;
      if (cell.merged) {
        const merged = cell.merged;
        for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
          for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
            this._counts_x[sx]--;
            this._counts_y[sy]--;
          }
        }
      } else {
        this._counts_x[x]--;
        this._counts_y[y]--;
      }
    }
  }

  unmerge(x: number, y: number): void {
    if (x < 0 || y < 0) throw `illegal coordinate: ${x}:${y}`;
    const origin = this.cell(x, y);
    if (origin.isRef) throw `cell is ref: ${x}:${y}`;
    if (origin.merged) {
      const has_value = origin.value !== null;
      const merged = origin.merged;
      origin.merged = null;
      for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
        for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
          if (!(sx === x && sy === y)) {
            this.cell(sx, sy).merged = null;
            if (has_value) {
              this._counts_x[sx]--;
              this._counts_y[sy]--;
            }
          }
        }
      }
    }
  }

  private cell(x: number, y: number): SelectableCell {
    if (x < 0 || y < 0) throw "illegal coordinate";
    this.expand(x, y);
    return this._cells[y][x];
  }

  private expand(to_x: number, to_y: number): void {
    while (this._limit_y < to_y) {
      this._limit_y++;
      this._counts_y[this._limit_y] = 0;
      this._cells[this._limit_y] = [];
      for (let x = 0; x <= this._limit_x; x++) {
        this._cells[this._limit_y][x] = new SelectableCell(x, this._limit_y);
      }
    }
    while (this._limit_x < to_x) {
      this._limit_x++;
      this._counts_x[this._limit_x] = 0;
      for (let y = 0; y <= this._limit_y; y++) {
        this._cells[y][this._limit_x] = new SelectableCell(this._limit_x, y);
      }
    }
  }

  handleInput(): void {
    const joystick = this._joystick;
    if (joystick.moveUp.once()) {
      this.moveUp();
    }
    if (joystick.moveDown.once()) {
      this.moveDown();
    }
    if (joystick.moveLeft.once()) {
      this.moveLeft();
    }
    if (joystick.moveRight.once()) {
      this.moveRight();
    }
    if (joystick.hit.once()) {
      const selected = this.selected;
      if (selected) {
        let [, callback] = selected;
        PIXI.sound.play('confirm');
        callback();
      } else {
        PIXI.sound.play('cancel');
        console.warn("selected not found");
      }
    }
  }
}

class SelectableCell {
  merged: MergedRegion | null = null;

  value: [Selectable, () => void] | null = null;

  unmark(): void {
    if (this.value) {
      this.value[0].selected = false;
    }
  }

  mark(): void {
    if (this.value) {
      this.value[0].selected = true;
    }
  }

  get isRef(): boolean {
    return this.merged !== null && !(this.merged.from_x === this.x && this.merged.from_y === this.y);
  }

  get isSelectable(): boolean {
    return this.value !== null || this.isRef;
  }

  constructor(readonly x: number, readonly y: number) {
  }
}

class MergedRegion {
  constructor(readonly from_x: number, readonly from_y: number, readonly to_x: number, readonly to_y: number) {
  }

  contains(x: number, y: number): boolean {
    return x >= this.from_x && x <= this.to_x && y >= this.from_y && y <= this.to_y;
  }
}

export class VStack extends PIXI.Container {
  private _width: number = 0;
  private _height: number = 0;

  private _dirtyLayout: boolean = false;
  private readonly _padding: number;
  private readonly _spacing: number;
  private readonly _background: PIXI.Container;

  constructor(options: {
    spacing?: number;
    padding?: number;
    background?: {
      color: number;
    }
  } = {}) {
    super();
    this._spacing = options.spacing !== undefined ? options.spacing : Sizes.uiMargin;
    this._padding = options.padding !== undefined ? options.padding : Sizes.uiMargin;
    if (options.background) {
      this._background = new PIXI.Graphics()
        .beginFill(options.background.color)
        .drawRect(0, 0, 1, 1)
        .endFill()
    } else {
      this._background = new PIXI.Container();
    }
    this.addChild(this._background);
  }

  destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }) {
    super.destroy(options);
    this._background?.destroy();
  }

  protected onChildrenChange() {
    this._dirtyLayout = true;
  }

  protected _calculateBounds() {
    this._bounds.addFrame(this.transform, 0, 0, this._width, this._height);
  }

  updateTransform() {
    if (this._dirtyLayout) {
      this.updateLayout();
    }
    super.updateTransform();
  }

  private updateLayout(): void {
    let max_width = 0;
    let y = this._padding;
    let x = this._padding;
    let first = true;
    for (let child of this.children) {
      if (child === this._background) continue;
      if (!first) y += this._spacing;
      first = false;
      child.position.set(x, y);
      const bounds = child.getBounds();
      y += bounds.height;
      max_width = Math.max(max_width, bounds.width);
    }
    this._height = y + this._padding;
    this._width = max_width + this._padding * 2;
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

  constructor(options: {
    spacing?: number;
    padding?: number;
    background?: {
      color: number;
      alpha?: number;
    }
  } = {}) {
    super();
    this._spacing = options.spacing !== undefined ? options.spacing : Sizes.uiMargin;
    this._padding = options.padding !== undefined ? options.padding : Sizes.uiMargin;
    if (options.background) {
      this._background = new PIXI.Graphics()
        .beginFill(options.background.color, options.background.alpha || 1)
        .drawRect(0, 0, 1, 1)
        .endFill();
    } else {
      this._background = new PIXI.Container();
    }
    this.addChild(this._background);
  }

  destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }) {
    super.destroy(options);
    this._background?.destroy();
  }

  protected onChildrenChange() {
    this._dirtyLayout = true;
  }

  protected _calculateBounds() {
    this._bounds.addFrame(this.transform, 0, 0, this._width, this._height);
  }

  updateTransform() {
    if (this._dirtyLayout) {
      this.updateLayout();
    }
    super.updateTransform();
  }

  private updateLayout(): void {
    let max_height = 0;
    let y = this._padding;
    let x = this._padding;
    let first = true;
    for (let child of this.children) {
      if (child === this._background) continue;
      if (!first) x += this._spacing;
      first = false;
      child.position.set(x, y);
      const bounds = child.getBounds();
      x += bounds.width;
      max_height = Math.max(max_height, bounds.height);
    }
    this._width = x + this._padding;
    this._height = max_height + this._padding * 2;
    this._background.width = this._width;
    this._background.height = this._height;
    this._calculateBounds();
    this._dirtyLayout = false;
  }
}