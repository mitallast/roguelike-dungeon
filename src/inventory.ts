import {UsableDrop, Weapon} from "./drop";
import {HeroCharacter} from "./hero";
import {Observable, Publisher, Subscription} from "./observable";
import {Colors, Sizes} from "./ui";
import {Selectable} from "./selectable";
// @ts-ignore
import * as PIXI from "pixi.js";

const CELL_SIZE = 32;

export class Inventory {
  readonly equipment: EquipmentInventory;
  readonly belt: BeltInventory;
  readonly bagpack: BagpackInventory;

  constructor(hero: HeroCharacter) {
    this.equipment = new EquipmentInventory(hero);
    this.belt = new BeltInventory(hero);
    this.bagpack = new BagpackInventory(hero);
  }

  stack(item: UsableDrop): boolean {
    return this.belt.stack(item) || this.bagpack.stack(item);
  }

  set(item: UsableDrop): boolean {
    return this.belt.set(item) || this.bagpack.set(item);
  }

  add(item: UsableDrop) {
    return this.stack(item) || this.set(item);
  }
}

export class EquipmentInventory {
  private readonly hero: HeroCharacter;
  readonly weapon: Observable<Weapon> = new Observable<Weapon>(null);

  constructor(hero: HeroCharacter) {
    this.hero = hero;
  }
}

export class BeltInventory {
  readonly length: number = 10;
  private readonly cells: InventoryCell[];

  constructor(hero: HeroCharacter) {
    this.cells = [];
    for (let i = 0; i < 10; i++) {
      this.cells[i] = new InventoryCell(hero);
    }
  }

  cell(index: number): InventoryCell {
    return this.cells[index];
  }

  stack(item: UsableDrop): boolean {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i].stack(item)) {
        return true;
      }
    }
    return false;
  }

  set(item: UsableDrop): boolean {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i].set(item)) {
        return true;
      }
    }
    return false;
  }

  add(item: UsableDrop): boolean {
    return this.stack(item) || this.set(item);
  }
}

export class BagpackInventory {
  readonly width: number = 10;
  readonly height: number = 5;
  private readonly cells: InventoryCell[][];

  constructor(hero: HeroCharacter) {
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      this.cells.push([]);
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x] = new InventoryCell(hero);
      }
    }
  }

  cell(x: number, y: number): InventoryCell {
    return this.cells[y][x];
  }

  stack(item: UsableDrop): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x].stack(item)) {
          return true;
        }
      }
    }
    return false;
  }

  set(item: UsableDrop): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x].set(item)) {
          return true;
        }
      }
    }
    return false;
  }

  add(item: UsableDrop): boolean {
    return this.stack(item) || this.set(item);
  }
}

export class InventoryCell {
  private readonly hero: HeroCharacter;
  private readonly maxInStack: number;
  readonly item = new Observable<UsableDrop>(null);
  readonly count = new Observable<number>(0);

  constructor(hero: HeroCharacter, maxInStack: number = 3) {
    this.maxInStack = maxInStack;
    this.hero = hero;
  }

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

  use(): boolean {
    if (this.item.get() && this.count.get() > 0) {
      this.item.get().use(this, this.hero);
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

  get isEmpty(): boolean {
    return this.item.get() == null;
  }
}

export class EquipmentInventoryView extends PIXI.Container {
  private readonly equipment: EquipmentInventory;

  readonly weapon: InventoryCellView;

  constructor(equipment: EquipmentInventory) {
    super();

    this.equipment = equipment;

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground, 0.3)
      .drawRect(
        0, 0,
        CELL_SIZE + (Sizes.uiBorder << 1),
        CELL_SIZE + (Sizes.uiBorder << 1)
      )
      .endFill();
    super.addChild(background);

    this.weapon = new InventoryCellView({
      item: this.equipment.weapon,
      count: new Observable(null)
    });
    (this.weapon as PIXI.Container).position.set(Sizes.uiBorder, Sizes.uiBorder);
    super.addChild(this.weapon);
  }
}

export class BeltInventoryView extends PIXI.Container {
  private readonly inventory: BeltInventory;
  private readonly cells: InventoryCellView[];

  constructor(inventory: BeltInventory) {
    super();
    this.inventory = inventory;

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground, 0.3)
      .drawRect(
        0, 0,
        Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * inventory.length,
        CELL_SIZE + (Sizes.uiBorder << 1)
      )
      .endFill();
    super.addChild(background);

    this.cells = [];
    for (let i = 0; i < inventory.length; i++) {
      const cell = inventory.cell(i);
      const view = new InventoryCellView({
        item: cell.item,
        count: cell.count,
      });
      (view as PIXI.Container).position.set(
        Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * i,
        Sizes.uiBorder
      );
      this.cells.push(view);
      super.addChild(view);
    }
  }

  get length(): number {
    return this.inventory.length;
  }

  cell(index: number) {
    return this.cells[index];
  }
}

export class BagpackInventoryView extends PIXI.Container {
  private readonly inventory: BagpackInventory;
  private readonly cells: InventoryCellView[][];

  constructor(inventory: BagpackInventory) {
    super();

    this.inventory = inventory;

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground, 0.3)
      .drawRect(
        0, 0,
        Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * inventory.width,
        Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * inventory.height,
      )
      .endFill();
    super.addChild(background);

    this.cells = [];
    for (let y = 0; y < inventory.height; y++) {
      this.cells.push([]);
      for (let x = 0; x < inventory.width; x++) {
        const cell = inventory.cell(x, y);
        const view = new InventoryCellView({
          item: cell.item,
          count: cell.count,
        });
        (view as PIXI.Container).position.set(
          Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * x,
          Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * y
        );
        this.cells[y][x] = view;
        super.addChild(view);
      }
    }
  }

  get width(): number {
    return this.inventory.width;
  }

  get height(): number {
    return this.inventory.height;
  }

  cell(x: number, y: number): InventoryCellView {
    return this.cells[y][x];
  }
}

export class InventoryCellView extends PIXI.Container implements Selectable {
  private readonly background: PIXI.Graphics;
  private readonly counter: PIXI.BitmapText;
  private sprite: PIXI.Sprite;

  private readonly itemSub: Subscription;
  private readonly countSub: Subscription;

  private readonly _alpha: number;
  private _selected: boolean;

  constructor(options: {
    item: Publisher<UsableDrop>,
    count: Publisher<number>,
    alpha?: number
  }) {
    super();
    this._alpha = options.alpha || 0.3;
    this.background = new PIXI.Graphics();
    this.selected = false;

    this.counter = new PIXI.BitmapText("0", {font: {name: "alagard", size: 16}});
    this.counter.anchor = new PIXI.Point(1, 0);
    this.counter.position.set(CELL_SIZE - Sizes.uiBorder, 0);

    super.addChild(this.background, this.counter);

    this.itemSub = options.item.subscribe(this.updateItem.bind(this));
    this.countSub = options.count.subscribe(this.updateCounter.bind(this));
  }

  destroy(): void {
    super.destroy();
    this.itemSub.unsubscribe();
    this.countSub.unsubscribe();
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(selected: boolean) {
    this._selected = selected;
    this.background
      .clear()
      .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected, this._alpha)
      .drawRect(0, 0, CELL_SIZE, CELL_SIZE)
      .endFill();
  }

  private updateCounter(counter: number): void {
    if (counter === null || counter === 0) {
      this.counter.text = "";
    } else {
      this.counter.text = counter.toString();
    }
  }

  private updateItem(item: UsableDrop): void {
    this.sprite?.destroy();
    this.sprite = null;
    if (item) {
      this.sprite = item.sprite();
      const max = CELL_SIZE - (Sizes.uiBorder << 1);
      const scale = max / Math.max(this.sprite.width, this.sprite.height);
      this.sprite.scale.set(scale, scale);
      this.sprite.anchor.set(0.5, 0);
      this.sprite.position.set(CELL_SIZE >> 1, Sizes.uiBorder);
      super.addChild(this.sprite);
    }
  }
}