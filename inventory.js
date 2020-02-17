
export class Inventory{
  constructor() {
    this.maxCells = 10;
    this.cells = [];
    this.init();
  }

  init() {
    for(let i=0; i<this.maxCells; i++) {
      this.cells[i] = new InventoryCell();
    }
  };
  add(item) {
    for(let i=0; i<this.cells.length; i++) {
      if(this.cells[i].stack(item)) {
        return true;
      }
    }
    for(let i=0; i<this.cells.length; i++) {
      if(this.cells[i].set(item)) {
        return true;
      }
    }
    return false;
  };
}

export class InventoryCell {
  constructor() {
    this.maxInStack = 3;
    this.item = false;
    this.count = 0;
  }

  stack(item) {
    if(this.item && this.item.same(item) && this.count < this.maxInStack) {
      this.count++;
      return true;
    }
    return false;
  };
  set(item) {
    if(!this.item) {
      this.item = item;
      this.count = 1;
      return true;
    }
    return false;
  };
  use(hero) {
    if(this.item && this.count > 0) {
      this.item.use(hero);
      this.count--;
      if(this.count <= 0) {
        this.item = false;
        this.count = 0;
      }
      return true;
    }
    return false;
  };
}