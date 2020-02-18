import {UsableDrop} from "./drop";
import {HeroMonster} from "./hero";

export class Inventory {
  readonly cells: InventoryCell[];

  constructor() {
    this.cells = [];
    for (let i = 0; i < 10; i++) {
      this.cells[i] = new InventoryCell();
    }
  }

  add(item: UsableDrop) {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i].stack(item)) {
        return true;
      }
    }
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i].set(item)) {
        return true;
      }
    }
    return false;
  };
}

export class InventoryCell {
  private readonly maxInStack: number;
  item: UsableDrop;
  count: number;

  constructor() {
    this.maxInStack = 3;
    this.item = null;
    this.count = 0;
  }

  stack(item: UsableDrop) {
    if (this.item && this.item.same(item) && this.count < this.maxInStack) {
      this.count++;
      return true;
    }
    return false;
  };

  set(item: UsableDrop) {
    if (!this.item) {
      this.item = item;
      this.count = 1;
      return true;
    }
    return false;
  };

  use(hero: HeroMonster) {
    if (this.item && this.count > 0) {
      this.item.use(this, hero);
      return true;
    }
    return false;
  };
}