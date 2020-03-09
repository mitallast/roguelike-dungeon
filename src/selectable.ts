export interface Selectable {
  selected: boolean;
}

export class SelectableMap {
  private selectedX: number = 0;
  private selectedY: number = 0;

  private minX: number = null;
  private maxX: number = null;
  private readonly columns: SelectableColumn[] = [];

  reset() {
    this.clean();
    this.selectedX = 0;
    this.selectedY = this.columns[this.selectedX].inRange(0);
    this.mark();
  }

  moveLeft(): void {
    this.clean();
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
    this.selectedY = this.columns[this.selectedX].inRange(this.selectedY);
    this.mark();
  }

  moveRight(): void {
    this.clean();
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
    this.selectedY = this.columns[this.selectedX].inRange(this.selectedY);
    this.mark();
  }

  moveUp(): void {
    this.clean();
    this.selectedY = this.columns[this.selectedX].moveUp(this.selectedY);
    this.mark();
  }

  moveDown(): void {
    this.clean();
    this.selectedY = this.columns[this.selectedX].moveDown(this.selectedY);
    this.mark();
  }

  private clean(): void {
    this.columns[this.selectedX].clean(this.selectedY);
  }

  private mark(): void {
    this.columns[this.selectedX].mark(this.selectedY);
  }

  get selected(): [Selectable, () => void] {
    return this.columns[this.selectedX].get(this.selectedY);
  }

  set(x: number, y: number, selectable: Selectable, action: () => void): void {
    while (x > this.columns.length - 1) {
      this.columns.push(new SelectableColumn());
    }
    this.minX = this.minX === null ? x : Math.min(this.minX, x);
    this.maxX = this.maxX === null ? x : Math.max(this.maxX, x);
    this.columns[x].set(y, selectable, action);
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
  }
}

class SelectableColumn {
  private minY: number = null;
  private maxY: number = null;
  private readonly cells: [Selectable, () => void][] = [];

  inRange(selectedY: number): number {
    if (selectedY < this.minY) return this.minY;
    else if (selectedY > this.maxY) return this.maxY;
    else return selectedY;
  }

  moveUp(selectedY: number): number {
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
  }

  moveDown(selectedY: number): number {
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
  }

  clean(selectedY: number): void {
    if (this.cells[selectedY]) {
      const [selectable] = this.cells[selectedY];
      if (selectable.selected) {
        selectable.selected = false;
      }
    }
  }

  mark(selectedY: number): void {
    if (this.cells[selectedY]) {
      const [selectable] = this.cells[selectedY];
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

  get(y: number): [Selectable, () => void] {
    return this.cells[y];
  }

  get isEmpty(): boolean {
    return this.minY === null;
  }
}