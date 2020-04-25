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
  background: 0x202020,
  uiBackground: 0x505050,
  uiSelected: 0x909090,
  uiNotSelected: 0x505050,
  uiRed: 0xFF0000,
  uiYellow: 0xFFD300,
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
  private readonly _text: PIXI.BitmapText;
  private readonly _bg: PIXI.Graphics;
  private _selected: boolean = false;

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

export class Layout {
  private commitX: number = 0;
  private commitY: number = 0;

  private offsetX: number = 0;
  private offsetY: number = 0;

  commit(): void {
    this.commitX = this.offsetX;
    this.commitY = this.offsetY;
  }

  reset(): void {
    this.offsetX = this.commitX;
    this.offsetY = this.commitY;
  }

  offset(x: number, y: number) {
    this.offsetX += x;
    this.offsetY += y;
  }

  get x(): number {
    return this.offsetX;
  }

  get y(): number {
    return this.offsetY;
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
  private readonly joystick: Joystick;
  private readonly cells: SelectableCell[][] = []; // y => x => cell
  private readonly counts_x: number[] = [];
  private readonly counts_y: number[] = [];
  private limit_x: number = -1;
  private limit_y: number = -1;

  private selected_x: number | null = null;
  private selected_y: number | null = null;

  constructor(joystick: Joystick) {
    this.joystick = joystick;
  }

  reset(): void {
    this.unmark();
    this.selected_x = nonEmptyCount(this.counts_x, this.selected_x);
    this.selected_y = nonEmptyCount(this.counts_y, this.selected_y);

    if (this.selected_x === null || this.selected_y === null) {
      this.selected_x = null;
      this.selected_y = null;
    } else {
      if (!this.cell(this.selected_x, this.selected_y).isSelectable) {
        const y = this.selected_y;
        const prev = (from: number): number | null => {
          for (let x = from - 1; x >= 0; x--) {
            if (this.cell(x, y).isSelectable) {
              return x;
            }
          }
          return null;
        };
        const p = prev(this.selected_x);
        if (p !== null) {
          this.selected_x = p;
        } else {
          const next = (from: number): number | null => {
            for (let x = from + 1; x <= this.limit_x; x++) {
              if (this.cell(x, y).isSelectable) {
                return x;
              }
            }
            return null;
          };
          const n = next(this.selected_x);
          if (n !== null) {
            this.selected_x = n;
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
    if (this.selected_x !== null && this.selected_y !== null) {
      const y = this.selected_y;
      if (this.counts_y[y] === 0) throw `illegal state: empty column ${y}`;
      const merged = this.selectedCell?.merged;
      const start_x = this.selected_x;
      const prev = (x: number): number => x > 0 ? x - 1 : this.limit_x;
      for (let x = prev(start_x); x != start_x; x = prev(x)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this.selected_x = x;
          break;
        }
      }
    }
    this.mark();
  }

  moveRight(): void {
    this.unmark();
    if (this.selected_x !== null && this.selected_y !== null) {
      const y = this.selected_y;
      if (this.counts_y[y] === 0) throw `illegal state: empty column ${y}`;
      const merged = this.selectedCell?.merged;
      const start_x = this.selected_x;
      const next = (x: number): number => (x + 1) % (this.limit_x + 1);
      for (let x = next(start_x); x != start_x; x = next(x)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this.selected_x = x;
          break;
        }
      }
    }
    this.mark();
  }

  moveUp(): void {
    this.unmark();
    if (this.selected_x !== null && this.selected_y !== null) {
      const x = this.selected_x;
      if (this.counts_x[x] === 0) throw `illegal state: empty row ${x}`;
      const merged = this.selectedCell?.merged;
      const start_y = this.selected_y;
      const prev = (y: number): number => y > 0 ? y - 1 : this.limit_y;
      for (let y = prev(start_y); y != start_y; y = prev(y)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this.selected_y = y;
          break;
        }
      }
    }
    this.mark();
  }

  moveDown(): void {
    this.unmark();
    if (this.selected_x !== null && this.selected_y !== null) {
      const x = this.selected_x;
      if (this.counts_x[x] === 0) throw `illegal state: empty row ${x}`;
      const merged = this.selectedCell?.merged;
      const start_y = this.selected_y;
      const next = (y: number): number => (y + 1) % (this.limit_y + 1);
      for (let y = next(start_y); y != start_y; y = next(y)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this.selected_y = y;
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
    if (this.selected_x !== null && this.selected_y !== null) {
      const cell = this.cell(this.selected_x, this.selected_y);
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
            this.counts_x[sx]++;
            this.counts_y[sy]++;
          }
        }
      } else {
        this.counts_x[x]++;
        this.counts_y[y]++;
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
            this.counts_x[sx]++;
            this.counts_y[sy]++;
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
            this.counts_x[sx]--;
            this.counts_y[sy]--;
          }
        }
      } else {
        this.counts_x[x]--;
        this.counts_y[y]--;
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
              this.counts_x[sx]--;
              this.counts_y[sy]--;
            }
          }
        }
      }
    }
  }

  private cell(x: number, y: number): SelectableCell {
    if (x < 0 || y < 0) throw "illegal coordinate";
    this.expand(x, y);
    return this.cells[y][x];
  }

  private expand(to_x: number, to_y: number): void {
    while (this.limit_y < to_y) {
      this.limit_y++;
      this.counts_y[this.limit_y] = 0;
      this.cells[this.limit_y] = [];
      for (let x = 0; x <= this.limit_x; x++) {
        this.cells[this.limit_y][x] = new SelectableCell(x, this.limit_y);
      }
    }
    while (this.limit_x < to_x) {
      this.limit_x++;
      this.counts_x[this.limit_x] = 0;
      for (let y = 0; y <= this.limit_y; y++) {
        this.cells[y][this.limit_x] = new SelectableCell(this.limit_x, y);
      }
    }
  }

  handleInput(): void {
    const joystick = this.joystick;
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