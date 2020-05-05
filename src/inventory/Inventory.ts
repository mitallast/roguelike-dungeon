import {UsableDrop, Weapon} from "../drop";
import {EventPublisher, Publisher} from "../observable";
import {Character} from "../character";
import {InventoryCell} from "./InventoryCell";

export class Inventory {
  readonly equipment: EquipmentInventory;
  readonly belt: BeltInventory;
  readonly backpack: BackpackInventory;

  private readonly _drop = new EventPublisher<[UsableDrop, number]>();

  get drop(): Publisher<[UsableDrop, number]> {
    return this._drop;
  }

  constructor(character: Character) {
    this.equipment = new EquipmentInventory(character, this._drop);
    this.belt = new BeltInventory(character, this._drop);
    this.backpack = new BackpackInventory(character, this._drop);
  }

  stack(item: UsableDrop): boolean {
    return this.belt.stack(item) || this.backpack.stack(item);
  }

  set(item: UsableDrop): boolean {
    return this.belt.set(item) || this.backpack.set(item);
  }

  add(item: UsableDrop): boolean {
    return this.stack(item) || this.set(item);
  }

  hasSpace(item: UsableDrop): boolean {
    return this.belt.hasSpace(item) || this.backpack.hasSpace(item);
  }
}

export class EquipmentInventory {
  readonly weapon: InventoryCell;

  constructor(character: Character, drop: EventPublisher<[UsableDrop, number]>) {
    this.weapon = new InventoryCell(character, 1, (item) => item instanceof Weapon, drop, this);
  }
}

export class BeltInventory {
  readonly length: number = 10;
  private readonly _cells: InventoryCell[];

  constructor(character: Character, drop: EventPublisher<[UsableDrop, number]>) {
    this._cells = [];
    for (let i = 0; i < 10; i++) {
      this._cells[i] = new InventoryCell(character, 3, () => true, drop, this);
    }
  }

  cell(index: number): InventoryCell {
    return this._cells[index];
  }

  stack(item: UsableDrop): boolean {
    for (let i = 0; i < this._cells.length; i++) {
      if (this._cells[i].stack(item)) {
        return true;
      }
    }
    return false;
  }

  set(item: UsableDrop): boolean {
    for (let i = 0; i < this._cells.length; i++) {
      if (this._cells[i].set(item)) {
        return true;
      }
    }
    return false;
  }

  add(item: UsableDrop): boolean {
    return this.stack(item) || this.set(item);
  }

  hasSpace(item: UsableDrop): boolean {
    for (let i = 0; i < this._cells.length; i++) {
      if (this._cells[i].hasSpace(item)) {
        return true;
      }
    }
    return false;
  }
}

export class BackpackInventory {
  readonly width: number = 10;
  readonly height: number = 5;
  private readonly _cells: InventoryCell[][];

  constructor(character: Character, drop: EventPublisher<[UsableDrop, number]>) {
    this._cells = [];
    for (let y = 0; y < this.height; y++) {
      this._cells.push([]);
      for (let x = 0; x < this.width; x++) {
        this._cells[y][x] = new InventoryCell(character, 3, () => true, drop, this);
      }
    }
  }

  cell(x: number, y: number): InventoryCell {
    return this._cells[y][x];
  }

  stack(item: UsableDrop): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this._cells[y][x].stack(item)) {
          return true;
        }
      }
    }
    return false;
  }

  set(item: UsableDrop): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this._cells[y][x].set(item)) {
          return true;
        }
      }
    }
    return false;
  }

  add(item: UsableDrop): boolean {
    return this.stack(item) || this.set(item);
  }

  hasSpace(item: UsableDrop): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this._cells[y][x].hasSpace(item)) {
          return true;
        }
      }
    }
    return false;
  }
}
