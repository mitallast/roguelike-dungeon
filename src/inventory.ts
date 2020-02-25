import {UsableDrop} from "./drop";
import {HeroView} from "./hero";
import {View} from "./view";
import {Observable} from "./observable";
// @ts-ignore
import * as PIXI from "pixi.js";

const CELL_SIZE = 32;
const BORDER = 4;

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
  private readonly maxInStack: number = 3;
  readonly item = new Observable<UsableDrop>(null);
  readonly count = new Observable<number>(0);

  stack(item: UsableDrop): boolean {
    if (this.item.get()?.same(item) && this.count.get() < this.maxInStack) {
      this.count.update(c => c + 1);
      return true;
    }
    return false;
  };

  clear(): void {
    if (this.item.get()) {
      this.item.set(null);
      this.count.set(0);
    }
  }

  set(item: UsableDrop): boolean {
    if (!this.item.get()) {
      this.item.set(item);
      this.count.set(1);
      return true;
    }
    return false;
  };

  use(hero: HeroView): boolean {
    if (this.item.get() && this.count.get() > 0) {
      this.item.get().use(this, hero);
      return true;
    }
    return false;
  };

  decrease(): void {
    this.count.update(c => c - 1);
    if (this.count.get() <= 0) {
      this.item.set(null);
      this.count.set(0);
    }
  }
}

export class InventoryView implements View {
  readonly container: PIXI.Container;
  private readonly background: PIXI.Graphics;
  private readonly cells: InventoryCellView[] = [];

  constructor(inventory: Inventory) {
    this.container = new PIXI.Container();

    this.background = new PIXI.Graphics();
    this.background.beginFill(0x505050, 0.3);
    this.background.drawRect(
      0, 0,
      BORDER + (CELL_SIZE + BORDER) * inventory.cells.length,
      CELL_SIZE + (BORDER << 1)
    );
    this.background.endFill();
    this.container.addChild(this.background);

    inventory.cells.forEach((c, i) => {
      const view = new InventoryCellView(c);
      view.container.position.set(
        BORDER + (CELL_SIZE + BORDER) * i,
        BORDER
      );
      this.container.addChild(view.container);
      this.cells.push(view);
    });
  }

  destroy(): void {
    this.cells.forEach(c => c.destroy());
    this.container.destroy();
  }

  update(delta: number): void {
    this.cells.forEach(c => c.update(delta));
  }
}

export class InventoryCellView implements View {
  private readonly cell: InventoryCell;
  readonly container: PIXI.Container;
  private readonly background: PIXI.Graphics;
  private readonly counter: PIXI.Text;
  private sprite: PIXI.Sprite;

  constructor(cell: InventoryCell) {
    this.cell = cell;
    this.container = new PIXI.Container();

    this.background = new PIXI.Graphics();
    this.background.beginFill(0x909090, 0.3);
    this.background.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
    this.background.endFill();
    this.container.addChild(this.background);

    let style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 10,
      fill: "white"
    });
    this.counter = new PIXI.Text("0", style);
    this.counter.anchor.set(1, 0);
    this.counter.position.set(CELL_SIZE - BORDER, 0);
    this.container.addChild(this.counter);

    this.cell.item.subscribe(this.updateItem.bind(this));
    this.cell.count.subscribe(this.updateCounter.bind(this));
  }

  destroy(): void {
    this.cell.item.unsubscribe(this.updateItem);
    this.cell.count.unsubscribe(this.updateCounter);
    this.counter.destroy();
    this.container.destroy();
  }

  updateCounter(counter: number): void {
    this.counter.text = counter.toString();
  }

  updateItem(item: UsableDrop): void {
    this.sprite?.destroy();
    this.sprite = null;
    if (item) {
      this.sprite = item.sprite();
      const max = CELL_SIZE - (BORDER << 1);
      const scale = max / Math.max(this.sprite.width, this.sprite.height);
      this.sprite.scale.set(scale, scale);
      this.sprite.anchor.set(0.5, 0);
      this.sprite.position.set(CELL_SIZE >> 1, BORDER);
      this.container.addChild(this.sprite);
    }
  }

  update(delta: number): void {
  }
}