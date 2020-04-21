import * as PIXI from "pixi.js";
import {Joystick} from "./input";

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

export class SelectableMap {
  private selectedX: number | null = null;
  private selectedY: number | null = null;

  private minX: number | null = null;
  private maxX: number | null = null;
  private readonly columns: SelectableColumn[] = [];

  private readonly joystick: Joystick;

  constructor(joystick: Joystick) {
    this.joystick = joystick;
  }

  reset() {
    this.clean();
    this.fixSelection();
    this.mark();
  }

  moveLeft(): void {
    this.clean();
    if (this.selectedX !== null && this.minX !== null && this.maxX !== null) {
      if (this.selectedX > this.minX) {
        while (this.selectedX > this.minX) {
          this.selectedX--;
          if (!this.columns[this.selectedX].isEmpty) {
            break;
          }
        }
      } else {
        this.selectedX = this.maxX;
      }
      this.selectedY = this.columns[this.selectedX].inRange(this.selectedY || 0);
    } else {
      this.selectedX = null;
      this.selectedY = null;
    }
    this.mark();
  }

  moveRight(): void {
    this.clean();
    if (this.selectedX !== null && this.minX !== null && this.maxX !== null) {
      if (this.selectedX < this.maxX) {
        while (this.selectedX < this.maxX) {
          this.selectedX++;
          if (!this.columns[this.selectedX].isEmpty) {
            break;
          }
        }
      } else {
        this.selectedX = this.minX;
      }
      this.selectedY = this.columns[this.selectedX].inRange(this.selectedY || 0);
    } else {
      this.selectedX = null;
      this.selectedY = null;
    }
    this.mark();
  }

  moveUp(): void {
    this.clean();
    if (this.selectedX !== null && this.minX !== null && this.maxX !== null) {
      this.selectedY = this.columns[this.selectedX].moveUp(this.selectedY || 0);
    } else {
      this.selectedX = null;
      this.selectedY = null;
    }
    this.mark();
  }

  moveDown(): void {
    this.clean();
    if (this.selectedX !== null && this.minX !== null && this.maxX !== null) {
      this.selectedY = this.columns[this.selectedX].moveDown(this.selectedY || 0);
    } else {
      this.selectedX = null;
      this.selectedY = null;
    }
    this.mark();
  }

  private clean(): void {
    if (this.selectedX !== null && this.selectedY !== null) {
      this.columns[this.selectedX].clean(this.selectedY);
    }
  }

  private mark(): void {
    if (this.selectedX !== null && this.selectedY !== null) {
      this.columns[this.selectedX].mark(this.selectedY);
    }
  }

  get selected(): [Selectable, () => void] | null {
    if (this.selectedX !== null && this.selectedY !== null) {
      return this.columns[this.selectedX].get(this.selectedY);
    } else {
      return null;
    }
  }

  set(x: number, y: number, selectable: Selectable, action: () => void): void {
    while (x > this.columns.length - 1) {
      this.columns.push(new SelectableColumn());
    }
    this.minX = this.minX === null ? x : Math.min(this.minX, x);
    this.maxX = this.maxX === null ? x : Math.max(this.maxX, x);
    this.columns[x].set(y, selectable, action);
    this.fixSelection();
  }

  remove(x: number, y: number): void {
    while (x > this.columns.length - 1) {
      this.columns.push(new SelectableColumn());
    }
    this.columns[x].remove(y);
    this.minX = null;
    for (let i = 0; i < this.columns.length; i++) {
      if (!this.columns[i].isEmpty) {
        this.minX = i;
        break;
      }
    }
    this.maxX = null;
    for (let i = this.columns.length - 1; i >= 0; i--) {
      if (!this.columns[i].isEmpty) {
        this.maxX = i;
        break;
      }
    }
    this.fixSelection();
  }

  private fixSelection(): void {
    if (this.minX !== null && this.maxX !== null) {
      if (this.selectedX === null) {
        this.selectedX = this.minX;
      }
      this.selectedY = this.columns[this.selectedX].inRange(this.selectedY || 0);
      if (this.selectedY === null) {
        if (this.selectedX < this.maxX) {
          this.moveRight();
        } else {
          this.moveLeft();
        }
      }
    } else {
      this.selectedX = null;
      this.selectedY = null;
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
        callback();
      } else {
        console.warn("selected not found");
      }
    }
  }
}

class SelectableColumn {
  private minY: number | null = null;
  private maxY: number | null = null;
  private readonly cells: ([Selectable, () => void] | null)[] = [];

  inRange(selectedY: number): number | null {
    if (this.minY !== null && this.maxY !== null) {
      if (selectedY < this.minY) return this.minY;
      else if (selectedY > this.maxY) return this.maxY;
      else return selectedY;
    } else {
      return null;
    }
  }

  moveUp(selectedY: number): number | null {
    if (this.minY !== null && this.maxY !== null) {
      if (selectedY > this.minY) {
        while (selectedY > this.minY) {
          selectedY--;
          if (this.cells[selectedY]) {
            return selectedY;
          }
        }
        return this.minY;
      } else {
        return this.maxY;
      }
    } else {
      return null;
    }
  }

  moveDown(selectedY: number): number | null {
    if (this.minY !== null && this.maxY !== null) {
      if (selectedY < this.maxY) {
        while (selectedY < this.maxY) {
          selectedY++;
          if (this.cells[selectedY]) {
            return selectedY;
          }
        }
        return this.maxY;
      } else {
        return this.minY;
      }
    } else {
      return null;
    }
  }

  clean(selectedY: number): void {
    const cell = this.cells[selectedY];
    if (cell) {
      const [selectable] = cell;
      if (selectable.selected) {
        selectable.selected = false;
      }
    }
  }

  mark(selectedY: number): void {
    const cell = this.cells[selectedY];
    if (cell !== null) {
      const [selectable] = cell;
      if (!selectable.selected) {
        selectable.selected = true;
      }
    }
  }

  remove(y: number): void {
    while (y > this.cells.length - 1) {
      this.cells.push(null);
    }
    this.cells[y] = null;
    this.minY = null;
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i]) {
        this.minY = i;
        break;
      }
    }
    this.maxY = null;
    for (let i = this.cells.length - 1; i >= 0; i--) {
      if (this.cells[i]) {
        this.maxY = i;
        break;
      }
    }
  }

  set(y: number, selectable: Selectable, action: () => void): void {
    while (y > this.cells.length - 1) {
      this.cells.push(null);
    }
    this.minY = this.minY === null ? y : Math.min(this.minY, y);
    this.maxY = this.maxY === null ? y : Math.max(this.maxY, y);
    this.cells[y] = [selectable, action];
  }

  get(y: number): [Selectable, () => void] | null {
    return this.cells[y];
  }

  get isEmpty(): boolean {
    return this.minY === null;
  }
}