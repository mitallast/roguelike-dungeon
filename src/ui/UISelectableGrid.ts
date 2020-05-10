import * as PIXI from "pixi.js";
import {Joystick} from "../input";

export interface UISelectable {
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

export class UISelectableGrid {
  private readonly _joystick: Joystick;
  private readonly _cells: UISelectableCell[][] = []; // y => x => cell
  private readonly _countsX: number[] = [];
  private readonly _countsY: number[] = [];
  private _limitX: number = -1;
  private _limitY: number = -1;

  private _selectedX: number | null = null;
  private _selectedY: number | null = null;

  constructor(joystick: Joystick) {
    this._joystick = joystick;
  }

  reset(): void {
    this.unmark();
    this._selectedX = nonEmptyCount(this._countsX, this._selectedX);
    this._selectedY = nonEmptyCount(this._countsY, this._selectedY);

    if (this._selectedX === null || this._selectedY === null) {
      this._selectedX = null;
      this._selectedY = null;
    } else {
      if (!this.cell(this._selectedX, this._selectedY).isSelectable) {
        const y = this._selectedY;
        const prev = (from: number): number | null => {
          for (let x = from - 1; x >= 0; x--) {
            if (this.cell(x, y).isSelectable) {
              return x;
            }
          }
          return null;
        };
        const p = prev(this._selectedX);
        if (p !== null) {
          this._selectedX = p;
        } else {
          const next = (from: number): number | null => {
            for (let x = from + 1; x <= this._limitX; x++) {
              if (this.cell(x, y).isSelectable) {
                return x;
              }
            }
            return null;
          };
          const n = next(this._selectedX);
          if (n !== null) {
            this._selectedX = n;
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
    if (this._selectedX !== null && this._selectedY !== null) {
      const y = this._selectedY;
      if (this._countsY[y] === 0) throw `illegal state: empty column ${y}`;
      const merged = this.selectedCell?.merged;
      const startX = this._selectedX;
      const prev = (x: number): number => x > 0 ? x - 1 : this._limitX;
      for (let x = prev(startX); x != startX; x = prev(x)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this._selectedX = x;
          break;
        }
      }
    }
    this.mark();
  }

  moveRight(): void {
    this.unmark();
    if (this._selectedX !== null && this._selectedY !== null) {
      const y = this._selectedY;
      if (this._countsY[y] === 0) throw `illegal state: empty column ${y}`;
      const merged = this.selectedCell?.merged;
      const startX = this._selectedX;
      const next = (x: number): number => (x + 1) % (this._limitX + 1);
      for (let x = next(startX); x != startX; x = next(x)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this._selectedX = x;
          break;
        }
      }
    }
    this.mark();
  }

  moveUp(): void {
    this.unmark();
    if (this._selectedX !== null && this._selectedY !== null) {
      const x = this._selectedX;
      if (this._countsX[x] === 0) throw `illegal state: empty row ${x}`;
      const merged = this.selectedCell?.merged;
      const startY = this._selectedY;
      const prev = (y: number): number => y > 0 ? y - 1 : this._limitY;
      for (let y = prev(startY); y != startY; y = prev(y)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this._selectedY = y;
          break;
        }
      }
    }
    this.mark();
  }

  moveDown(): void {
    this.unmark();
    if (this._selectedX !== null && this._selectedY !== null) {
      const x = this._selectedX;
      if (this._countsX[x] === 0) throw `illegal state: empty row ${x}`;
      const merged = this.selectedCell?.merged;
      const startY = this._selectedY;
      const next = (y: number): number => (y + 1) % (this._limitY + 1);
      for (let y = next(startY); y != startY; y = next(y)) {
        if (merged?.contains(x, y)) continue;
        if (this.cell(x, y).isSelectable) {
          this._selectedY = y;
          break;
        }
      }
    }
    this.mark();
  }

  select(x: number, y: number): void {
    if (this.cell(x, y).isSelectable) {
      this.unmark();
      this._selectedX = x;
      this._selectedY = y;
      this.mark();
    }
  }

  private unmark(): void {
    this.selectedCell?.unmark();
  }

  private mark(): void {
    this.selectedCell?.mark();
  }

  get selected(): [UISelectable, () => void] | null {
    return this.selectedCell?.value || null;
  }

  private get selectedCell(): UISelectableCell | null {
    if (this._selectedX !== null && this._selectedY !== null) {
      const cell = this.cell(this._selectedX, this._selectedY);
      if (cell.merged && cell.isRef) {
        return this.cell(cell.merged.from_x, cell.merged.from_y);
      } else {
        return cell;
      }
    }
    return null;
  }

  set(x: number, y: number, selectable: UISelectable, action: () => void): void {
    if (x < 0 || y < 0) throw `illegal coordinate: ${x}:${y}`;
    const cell = this.cell(x, y);
    if (cell.isRef) throw `cell is ref: ${x}:${y}`;
    const hasPrev = cell.value !== null;
    cell.value = [selectable, action];

    if (!hasPrev) {
      if (cell.merged) {
        const merged = cell.merged;
        for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
          for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
            this._countsX[sx]++;
            this._countsY[sy]++;
          }
        }
      } else {
        this._countsX[x]++;
        this._countsY[y]++;
      }
    }

    this.reset();
  }

  merge(x: number, y: number, width: number, height: number): void {
    if (x < 0 || y < 0) throw `illegal coordinate: ${x}:${y}`;
    if (width < 1 || height < 1) throw `illegal size: ${width}:${height}`;
    const merged = new UIMergedRegion(x, y, x + width - 1, y + height - 1);
    const origin = this.cell(x, y);
    if (origin.isRef) throw `cell is ref: ${x}:${y}`;
    if (origin.merged) throw `cell is merged: ${JSON.stringify(origin.merged)}`;
    origin.merged = merged;
    const hasValue = origin.value !== null;
    for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
      for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
        if (!(sx === x && sy === y)) {
          const cell = this.cell(sx, sy);
          if (cell.value) throw `merging cell already has value: ${sx}:${sy}`;
          if (cell.isRef) throw `merging cell is ref: ${sx}:${sy}`;
          cell.merged = merged;
          if (hasValue) {
            this._countsX[sx]++;
            this._countsY[sy]++;
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
            this._countsX[sx]--;
            this._countsY[sy]--;
          }
        }
      } else {
        this._countsX[x]--;
        this._countsY[y]--;
      }
    }
  }

  unmerge(x: number, y: number): void {
    if (x < 0 || y < 0) throw `illegal coordinate: ${x}:${y}`;
    const origin = this.cell(x, y);
    if (origin.isRef) throw `cell is ref: ${x}:${y}`;
    if (origin.merged) {
      const hasValue = origin.value !== null;
      const merged = origin.merged;
      origin.merged = null;
      for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
        for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
          if (!(sx === x && sy === y)) {
            this.cell(sx, sy).merged = null;
            if (hasValue) {
              this._countsX[sx]--;
              this._countsY[sy]--;
            }
          }
        }
      }
    }
  }

  private cell(x: number, y: number): UISelectableCell {
    if (x < 0 || y < 0) throw "illegal coordinate";
    this.expand(x, y);
    return this._cells[y][x];
  }

  private expand(toX: number, toY: number): void {
    while (this._limitY < toY) {
      this._limitY++;
      this._countsY[this._limitY] = 0;
      this._cells[this._limitY] = [];
      for (let x = 0; x <= this._limitX; x++) {
        this._cells[this._limitY][x] = new UISelectableCell(x, this._limitY);
      }
    }
    while (this._limitX < toX) {
      this._limitX++;
      this._countsX[this._limitX] = 0;
      for (let y = 0; y <= this._limitY; y++) {
        this._cells[y][this._limitX] = new UISelectableCell(this._limitX, y);
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
        const [, callback] = selected;
        PIXI.sound.play('confirm');
        callback();
      } else {
        PIXI.sound.play('cancel');
        console.warn("selected not found");
      }
    }
  }
}

class UISelectableCell {
  merged: UIMergedRegion | null = null;

  value: [UISelectable, () => void] | null = null;

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

class UIMergedRegion {
  constructor(readonly from_x: number, readonly from_y: number, readonly to_x: number, readonly to_y: number) {
  }

  contains(x: number, y: number): boolean {
    return x >= this.from_x && x <= this.to_x && y >= this.from_y && y <= this.to_y;
  }
}