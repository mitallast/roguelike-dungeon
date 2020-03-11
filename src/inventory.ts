import {DropCardView, UsableDrop, Weapon} from "./drop";
import {HeroCharacter} from "./hero";
import {Observable, Publisher, Subscription} from "./observable";
import {Colors, Sizes, Selectable, Layout, SelectableMap, Button} from "./ui";
import * as PIXI from "pixi.js";

const CELL_SIZE = 32;

const BUTTON_WIDTH = 110;
const BUTTON_HEIGHT = 32;

export class Inventory {
  readonly equipment: EquipmentInventory;
  readonly belt: BeltInventory;
  readonly backpack: BackpackInventory;

  constructor(hero: HeroCharacter) {
    this.equipment = new EquipmentInventory();
    this.belt = new BeltInventory(hero);
    this.backpack = new BackpackInventory(hero);
  }

  stack(item: UsableDrop): boolean {
    return this.belt.stack(item) || this.backpack.stack(item);
  }

  set(item: UsableDrop): boolean {
    return this.belt.set(item) || this.backpack.set(item);
  }

  add(item: UsableDrop) {
    return this.stack(item) || this.set(item);
  }
}

export class EquipmentInventory {
  readonly weapon: Observable<Weapon | null> = new Observable<Weapon | null>(null);

  constructor() {
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

export class BackpackInventory {
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
  readonly item = new Observable<UsableDrop | null>(null);
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
    const item = this.item.get();
    if (item) {
      item.use(this, this.hero);
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

export class InventoryView extends PIXI.Container {
  private readonly inventory: Inventory;
  private readonly selectable: SelectableMap;
  private readonly selectableOffset: number;

  readonly equipment: EquipmentInventoryView;
  readonly belt: BeltInventoryView;
  readonly backpack: BackpackInventoryView;
  readonly dropCard: DropCardView;

  private readonly layout: Layout;
  private readonly buttons: [Button, number, number][] = [];

  constructor(inventory: Inventory, selectable: SelectableMap, selectableOffset: number) {
    super();
    this.inventory = inventory;
    this.selectable = selectable;
    this.selectableOffset = selectableOffset;

    const layout = this.layout = new Layout();
    this.equipment = new EquipmentInventoryView(inventory.equipment);
    this.equipment.position.set(layout.x, layout.y);
    this.equipment.calculateBounds();
    layout.offset(0, this.equipment.height);
    layout.offset(0, Sizes.uiMargin);
    selectable.set(selectableOffset, 0, this.equipment.weapon, () => this.showWeaponInfo());

    this.belt = new BeltInventoryView(inventory.belt);
    this.belt.position.set(layout.x, layout.y);
    this.belt.calculateBounds();
    layout.offset(0, this.belt.height);
    layout.offset(0, Sizes.uiMargin);
    for (let i = 0; i < this.belt.length; i++) {
      const index = i;
      this.selectable.set(selectableOffset + i, 1, this.belt.cell(i), () => this.showBeltInfo(index));
    }

    this.backpack = new BackpackInventoryView(inventory.backpack);
    this.backpack.position.set(layout.x, layout.y);
    this.backpack.calculateBounds();
    layout.offset(0, this.backpack.height);
    layout.offset(0, Sizes.uiMargin);
    for (let x = 0; x < this.backpack.gridWidth; x++) {
      for (let y = 0; y < this.backpack.gridHeight; y++) {
        const cell_x = x;
        const cell_y = y;
        this.selectable.set(selectableOffset + x, y + 2, this.backpack.cell(x, y), () => this.showBackpackInfo(cell_x, cell_y));
      }
    }

    const buttonHeight = layout.y;

    layout.offset(0, BUTTON_HEIGHT);

    const totalHeight = layout.y;

    layout.reset();
    layout.offset(this.backpack.width, 0);
    layout.offset(Sizes.uiMargin, 0);

    this.dropCard = new DropCardView({
      width: 400,
      height: totalHeight
    });
    this.dropCard.position.set(layout.x, layout.y);
    this.dropCard.calculateBounds();
    layout.offset(0, this.dropCard.height);
    layout.offset(0, Sizes.uiMargin);

    layout.reset();
    layout.offset(0, buttonHeight);
    layout.commit();

    this.addChild(this.equipment, this.belt, this.backpack, this.dropCard);
  }

  private removeButtons(): void {
    for (let [button, x, y] of this.buttons) {
      this.selectable.remove(x, y);
      button.destroy();
    }
    this.layout.reset();
  }

  private addButton(label: string, action: () => void): void {
    const selectableX = this.selectableOffset + this.buttons.length;
    const selectableY = 100;
    const button = new Button({
      label: label,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
    });
    button.position.set(this.layout.x, this.layout.y);
    this.layout.offset(BUTTON_WIDTH, 0);
    this.layout.offset(Sizes.uiMargin, 0);
    this.buttons.push([button, selectableX, selectableY]);
    this.selectable.set(selectableX, selectableY, button, action);
    this.addChild(button);
  }

  private showWeaponInfo(): void {
    const drop = this.inventory.equipment.weapon.get();
    this.dropCard!.drop = drop;
    this.removeButtons();

    if (drop) {
      this.addButton("To belt", () => this.weaponToBelt());
      this.addButton("To backpack", () => this.weaponToBackpack());
      this.addButton("Drop", () => this.weaponDrop());
    }
  }

  private weaponToBelt(): void {
    const weapon = this.inventory.equipment.weapon.get();
    if (weapon) {
      if (this.inventory.belt.add(weapon)) {
        this.inventory.equipment.weapon.set(null);
        this.dropCard!.drop = null;
        this.removeButtons();
      }
    }
  }

  private weaponToBackpack(): void {
    const weapon = this.inventory.equipment.weapon.get();
    if (weapon) {
      if (this.inventory.backpack.set(weapon)) {
        this.inventory.equipment.weapon.set(null);

        this.dropCard!.drop = null;
        this.removeButtons();
      }
    }
  }

  private weaponDrop(): void {
    this.inventory.equipment.weapon.set(null);
    this.dropCard!.drop = null;
    this.removeButtons();
  }

  private showBeltInfo(index: number): void {
    const drop = this.inventory.belt.cell(index).item.get();
    this.dropCard!.drop = drop;
    this.removeButtons();

    if (drop) {
      if (drop instanceof Weapon) {
        this.addButton("Equip", () => this.beltEquip(index));
      } else {
        this.addButton("Use item", () => this.beltUseItem(index));
      }
      this.addButton("To backpack", () => this.beltToBackpack(index));
      this.addButton("Drop", () => this.beltDrop(index));
    }
  }

  private beltEquip(index: number): void {
    const cell = this.inventory.belt.cell(index);
    const drop = cell.item.get();
    if (drop && drop instanceof Weapon) {
      const prev = this.inventory.equipment.weapon.get();
      this.inventory.equipment.weapon.set(drop);
      cell.clear();
      if (prev) {
        cell.set(prev);
      }
      this.dropCard!.drop = null;
      this.removeButtons();
    }
  }

  private beltUseItem(index: number): void {
    const cell = this.inventory.belt.cell(index);
    const drop = cell.item.get();
    if (drop) {
      if (cell.use() && cell.isEmpty) {
        this.dropCard!.drop = null;
        this.removeButtons();
      }
    }
  }

  private beltToBackpack(index: number): void {
    const cell = this.inventory.belt.cell(index);
    if (!cell.isEmpty) {
      const drop = cell.item.get();
      while (drop && !cell.isEmpty) {
        if (this.inventory.backpack.add(drop)) {
          cell.decrease();
        } else {
          break;
        }
      }
      if (cell.isEmpty) {
        this.dropCard!.drop = null;
        this.removeButtons();
      }
    }
  }

  private beltDrop(index: number): void {
    this.inventory.belt.cell(index).clear();

    this.dropCard!.drop = null;
    this.removeButtons();
  }

  private showBackpackInfo(x: number, y: number): void {
    const drop = this.inventory.backpack.cell(x, y).item.get();
    this.dropCard!.drop = drop;
    this.removeButtons();
    if (drop) {
      if (drop instanceof Weapon) {
        this.addButton("Equip", () => this.backpackEquip(x, y));
      } else {
        this.addButton("Use item", () => this.backpackUseItem(x, y));
      }
      this.addButton("To belt", () => this.backpackToBelt(x, y));
      this.addButton("Drop", () => this.backpackDrop(x, y));
    }
  }

  private backpackEquip(x: number, y: number): void {
    const cell = this.inventory.backpack.cell(x, y);
    const drop = cell.item.get();
    if (drop && drop instanceof Weapon) {
      const prev = this.inventory.equipment.weapon.get();
      this.inventory.equipment.weapon.set(drop);
      cell.clear();
      if (prev) {
        cell.set(prev);
      }
      this.dropCard!.drop = null;
      this.removeButtons();
    }
  }

  private backpackUseItem(x: number, y: number): void {
    const cell = this.inventory.backpack.cell(x, y);
    const drop = cell.item.get();
    if (drop) {
      if (cell.use() && cell.isEmpty) {
        this.dropCard!.drop = null;
        this.removeButtons();
      }
    }
  }

  private backpackToBelt(x: number, y: number): void {
    const cell = this.inventory.backpack.cell(x, y);
    if (!cell.isEmpty) {
      const drop = cell.item.get();
      while (drop && !cell.isEmpty) {
        if (this.inventory.belt.add(drop)) {
          cell.decrease();
        } else {
          break;
        }
      }
      if (cell.isEmpty) {
        this.dropCard!.drop = null;
        this.removeButtons();
      }
    }
  }

  private backpackDrop(x: number, y: number): void {
    this.inventory.backpack.cell(x, y).clear();

    this.dropCard!.drop = null;
    this.removeButtons();
  }

  destroy(): void {
    super.destroy();

    this.equipment.destroy();
    this.belt.destroy();
    this.backpack.destroy();
    this.dropCard.destroy();
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
    this.weapon.position.set(Sizes.uiBorder, Sizes.uiBorder);
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
      view.position.set(
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

export class BackpackInventoryView extends PIXI.Container {
  private readonly inventory: BackpackInventory;
  private readonly cells: InventoryCellView[][];

  constructor(inventory: BackpackInventory) {
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
        view.position.set(
          Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * x,
          Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * y
        );
        this.cells[y][x] = view;
        super.addChild(view);
      }
    }
  }

  get gridWidth(): number {
    return this.inventory.width;
  }

  get gridHeight(): number {
    return this.inventory.height;
  }

  cell(x: number, y: number): InventoryCellView {
    return this.cells[y][x];
  }
}

export class InventoryCellView extends PIXI.Container implements Selectable {
  private readonly background: PIXI.Graphics;
  private readonly counter: PIXI.BitmapText;
  private sprite: PIXI.Sprite | null = null;

  private readonly itemSub: Subscription;
  private readonly countSub: Subscription;

  private readonly _alpha: number;
  private _selected: boolean = false;

  constructor(options: {
    item: Publisher<UsableDrop | null>,
    count: Publisher<number | null>,
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

  private updateCounter(counter: number | null): void {
    if (counter === null || counter === 0) {
      this.counter.text = "";
    } else {
      this.counter.text = counter.toString();
    }
  }

  private updateItem(item: UsableDrop | null): void {
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