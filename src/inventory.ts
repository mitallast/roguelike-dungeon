import {UsableDrop, Weapon} from "./drop";
import {Hero} from "./hero";
import {ObservableVar, Observable, EventPublisher, Publisher} from "./observable";
import {Colors, Sizes, Selectable, Layout, SelectableMap, Button} from "./ui";
import * as PIXI from "pixi.js";
import {NpcCharacter} from "./npc";

const CELL_SIZE = 32;

const BUTTON_WIDTH = 170;
const BUTTON_HEIGHT = 32;

export class Inventory {
  readonly equipment: EquipmentInventory;
  readonly belt: BeltInventory;
  readonly backpack: BackpackInventory;

  private readonly _drop = new EventPublisher<[UsableDrop, number]>();

  get drop(): Publisher<[UsableDrop, number]> {
    return this._drop;
  }

  constructor(hero: Hero) {
    this.equipment = new EquipmentInventory(hero, this._drop);
    this.belt = new BeltInventory(hero, this._drop);
    this.backpack = new BackpackInventory(hero, this._drop);
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
  readonly weapon: InventoryCell;

  constructor(hero: Hero, drop: EventPublisher<[UsableDrop, number]>) {
    this.weapon = new InventoryCell(hero, 1, (item) => item instanceof Weapon, drop, this);
  }
}

export class BeltInventory {
  readonly length: number = 10;
  private readonly cells: InventoryCell[];

  constructor(hero: Hero, drop: EventPublisher<[UsableDrop, number]>) {
    this.cells = [];
    for (let i = 0; i < 10; i++) {
      this.cells[i] = new InventoryCell(hero, 3, () => true, drop, this);
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

  constructor(hero: Hero, drop: EventPublisher<[UsableDrop, number]>) {
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      this.cells.push([]);
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x] = new InventoryCell(hero, 3, () => true, drop, this);
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
  private readonly _hero: Hero;
  private readonly _maxInStack: number;
  private readonly _item = new ObservableVar<UsableDrop | null>(null);
  private readonly _count = new ObservableVar<number>(0);
  private readonly _predicate: (item: UsableDrop) => boolean;
  private readonly _drop: EventPublisher<[UsableDrop, number]>;

  readonly parent: EquipmentInventory | BeltInventory | BackpackInventory;

  get item(): Observable<UsableDrop | null> {
    return this._item;
  }

  get count(): Observable<number> {
    return this._count;
  }

  constructor(
    hero: Hero,
    maxInStack: number,
    predicate: (item: UsableDrop) => boolean,
    drop: EventPublisher<[UsableDrop, number]>,
    parent: EquipmentInventory | BeltInventory | BackpackInventory,
  ) {
    this._hero = hero;
    this._maxInStack = maxInStack;
    this._predicate = predicate;
    this._drop = drop;
    this.parent = parent;
  }

  supports(item: UsableDrop): boolean {
    return this._predicate(item);
  }

  stack(item: UsableDrop): boolean {
    if (this._item.get()?.same(item) && this._count.get() < this._maxInStack) {
      this._count.update(c => c + 1);
      return true;
    }
    return false;
  };

  clear(): void {
    if (this._item.get()) {
      this._item.set(null);
      this._count.set(0);
    }
  }

  set(item: UsableDrop): boolean {
    if (!this._item.get() && this._predicate(item)) {
      this._item.set(item);
      this._count.set(1);
      return true;
    }
    return false;
  };

  decrease(): void {
    this._count.update(c => Math.max(0, c - 1));
    if (this._count.get() <= 0) {
      this._item.set(null);
      this._count.set(0);
    }
  }

  get isEmpty(): boolean {
    return this._item.get() == null;
  }

  use(): boolean {
    const item = this._item.get();
    if (item) {
      // @ts-ignore
      item.use((this as InventoryCell<UsableDrop>), this._hero);
      return true;
    }
    return false;
  };

  equip(): void {
    const item = this._item.get();
    const weapon = this._hero.inventory.equipment.weapon;
    if (item && weapon.supports(item)) {
      const prev = weapon.item.get();
      weapon.clear();
      weapon.set(item);
      this.clear();
      if (prev) {
        this.set(prev);
      }
    }
  }

  toBelt(): void {
    const item = this._item.get();
    while (item && !this.isEmpty) {
      if (this._hero.inventory.belt.add(item)) {
        this.decrease();
      } else {
        break;
      }
    }
  }

  toBackpack(): void {
    const item = this._item.get();
    while (item && !this.isEmpty) {
      if (this._hero.inventory.backpack.add(item)) {
        this.decrease();
      } else {
        break;
      }
    }
  }

  drop(): void {
    const drop = this._item.get();
    const count = this._count.get();
    if (drop) {
      this._item.set(null);
      this._count.set(0);
      this._drop.send([drop, count]);
    }
  }
}

export interface InventoryActionsController {
  handle(view: InventoryCellActionsView, item: UsableDrop | null): void;
}

export abstract class BaseInventoryActionsController implements InventoryActionsController {
  protected readonly inventory: Inventory;

  protected constructor(inventory: Inventory) {
    this.inventory = inventory;
  }

  handle(view: InventoryCellActionsView, item: UsableDrop | null): void {
    view.removeButtons();
    if (item) {
      this.basicButtons(view, item);
      this.additionalButtons(view, item);
    }
  }

  protected basicButtons(view: InventoryCellActionsView, item: UsableDrop): void {
    const cell = view.cell;
    if (cell.parent instanceof BeltInventory || cell.parent instanceof BackpackInventory) {
      if (this.inventory.equipment.weapon.supports(item)) {
        view.addButton("Equip", () => cell.equip());
      } else {
        view.addButton("Use item", () => cell.use());
      }
    }
    if (!(cell.parent instanceof BeltInventory)) view.addButton("To belt", () => cell.toBelt());
    if (!(cell.parent instanceof BackpackInventory)) view.addButton("To backpack", () => cell.toBackpack());
    view.addButton("Drop", () => cell.drop());
  }

  protected abstract additionalButtons(view: InventoryCellActionsView, item: UsableDrop): void;
}

export class DefaultInventoryActionsController extends BaseInventoryActionsController {
  constructor(inventory: Inventory) {
    super(inventory);
  }

  protected additionalButtons(_view: InventoryCellActionsView, _item: UsableDrop): void {
  }
}

export class SellingInventoryActionsController extends BaseInventoryActionsController {
  private readonly hero: Hero;
  // @ts-ignore
  private readonly npc: NpcCharacter;

  constructor(hero: Hero, npc: NpcCharacter) {
    super(hero.inventory);
    this.hero = hero;
    this.npc = npc;
  }

  protected additionalButtons(view: InventoryCellActionsView, item: UsableDrop): void {
    const price = item.info().price;
    if (price) {
      view.addButton('Sell', () => {
        view.cell.decrease();
        this.hero.addCoins(price);
      });
    }
  }
}

export class InventoryView extends PIXI.Container {
  private readonly selectable: SelectableMap;
  private readonly selectableOffset: number;

  readonly equipment: EquipmentInventoryView;
  readonly belt: BeltInventoryView;
  readonly backpack: BackpackInventoryView;
  readonly card: InventoryCellCardView;
  readonly actions: InventoryCellActionsView;

  constructor(inventory: Inventory, controller: InventoryActionsController, selectable: SelectableMap, selectableOffset: number) {
    super();
    this.selectable = selectable;
    this.selectableOffset = selectableOffset;

    const layout = new Layout();
    this.equipment = new EquipmentInventoryView(inventory.equipment);
    this.equipment.position.set(layout.x, layout.y);
    this.equipment.calculateBounds();
    layout.offset(0, this.equipment.height);
    layout.offset(0, Sizes.uiMargin);
    selectable.set(selectableOffset, 0, this.equipment.weapon, () => this.show(inventory.equipment.weapon));

    this.belt = new BeltInventoryView(inventory.belt);
    this.belt.position.set(layout.x, layout.y);
    this.belt.calculateBounds();
    layout.offset(0, this.belt.height);
    layout.offset(0, Sizes.uiMargin);
    for (let i = 0; i < this.belt.length; i++) {
      const cell = inventory.belt.cell(i);
      this.selectable.set(selectableOffset + i, 1, this.belt.cell(i), () => this.show(cell));
    }

    this.backpack = new BackpackInventoryView(inventory.backpack);
    this.backpack.position.set(layout.x, layout.y);
    this.backpack.calculateBounds();
    layout.offset(0, this.backpack.height);
    layout.offset(0, Sizes.uiMargin);

    for (let x = 0; x < inventory.backpack.width; x++) {
      for (let y = 0; y < inventory.backpack.height; y++) {
        const cell = inventory.backpack.cell(x, y);
        this.selectable.set(selectableOffset + x, y + 2, this.backpack.cell(x, y), () => this.show(cell));
      }
    }

    this.actions = new InventoryCellActionsView(this.selectable, this.selectableOffset, controller);
    this.actions.position.set(layout.x, layout.y);

    layout.offset(0, BUTTON_HEIGHT);
    layout.offset(0, Sizes.uiMargin); // two rows of buttons
    layout.offset(0, BUTTON_HEIGHT);
    const totalHeight = layout.y;

    layout.reset();
    layout.offset(this.backpack.width, 0);
    layout.offset(Sizes.uiMargin, 0);

    this.card = new InventoryCellCardView({
      width: 400,
      height: totalHeight
    });
    this.card.position.set(layout.x, layout.y);
    this.card.calculateBounds();

    this.addChild(this.equipment, this.belt, this.backpack, this.card, this.actions);
  }

  destroy(): void {
    super.destroy();

    this.equipment.destroy();
    this.belt.destroy();
    this.backpack.destroy();
    this.card.destroy();
  }

  private show(cell: InventoryCell) {
    this.card.publisher = cell.item;
    this.actions.cell = cell;
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
      item: this.equipment.weapon.item,
      count: new ObservableVar(null)
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
  private readonly cells: InventoryCellView[][];

  constructor(inventory: BackpackInventory) {
    super();
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

  cell(x: number, y: number): InventoryCellView {
    return this.cells[y][x];
  }
}

export class InventoryCellView extends PIXI.Container implements Selectable {
  private readonly _item: Observable<UsableDrop | null>;
  private readonly _count: Observable<number | null>;

  private readonly background: PIXI.Graphics;
  private readonly counter: PIXI.BitmapText;
  private sprite: PIXI.Sprite | null = null;

  private readonly _alpha: number;
  private _selected: boolean = false;

  constructor(options: {
    item: Observable<UsableDrop | null>,
    count: Observable<number | null>,
    alpha?: number
  }) {
    super();
    this._item = options.item;
    this._count = options.count;
    this._alpha = options.alpha || 0.3;
    this.background = new PIXI.Graphics();
    this.selected = false;

    this.counter = new PIXI.BitmapText("0", {font: {name: "alagard", size: 16}});
    this.counter.anchor = new PIXI.Point(1, 0);
    this.counter.position.set(CELL_SIZE - Sizes.uiBorder, 0);

    super.addChild(this.background, this.counter);

    this._item.subscribe(this.updateItem, this);
    this._count.subscribe(this.updateCounter, this);
  }

  destroy(): void {
    super.destroy();
    this._item.unsubscribe(this.updateItem, this);
    this._count.unsubscribe(this.updateCounter, this);
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

export class InventoryCellCardView extends PIXI.Container {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _sprite_size: number;

  private _sprite: PIXI.Sprite | PIXI.AnimatedSprite | null = null;
  private readonly _title: PIXI.BitmapText;
  private readonly _description: PIXI.BitmapText;

  private _publisher: Publisher<UsableDrop | null> | null = null;

  constructor(options: {
    width?: number,
    height?: number,
  }) {
    super();

    this._width = options.width || 400;
    this._height = options.height || 400;
    this._sprite_size = 128 + (Sizes.uiMargin << 1);

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground, 0.3)
      .drawRect(0, 0, this._width, this._height)
      .endFill()
      .beginFill(Colors.uiNotSelected, 0.3)
      .drawRect(Sizes.uiMargin, Sizes.uiMargin + 32 + Sizes.uiMargin, this._sprite_size, this._sprite_size)
      .endFill();

    this._title = new PIXI.BitmapText("", {font: {name: "alagard", size: 32}});
    this._title.anchor = new PIXI.Point(0.5, 0);
    this._title.position.set(this._width >> 1, Sizes.uiMargin);

    this._description = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this._description.position.set(
      Sizes.uiMargin + this._sprite_size + Sizes.uiMargin,
      Sizes.uiMargin + 32 + Sizes.uiMargin
    );

    super.addChild(background, this._title, this._description);
  }


  destroy(): void {
    super.destroy();
    this._publisher?.unsubscribe(this.handle, this);
    this._publisher = null;
  }

  set publisher(publisher: Publisher<UsableDrop | null>) {
    this._publisher?.unsubscribe(this.handle, this);
    this._publisher = null;

    this._publisher = publisher;
    this._publisher.subscribe(this.handle, this);
  }

  private handle(drop: UsableDrop | null): void {
    this._sprite?.destroy();
    this._sprite = null;
    this._title.text = "";
    this._description.text = "";

    if (drop) {
      const sprite = this._sprite = drop.sprite();
      super.addChild(sprite);
      sprite.anchor = new PIXI.Point(0.5, 0.5);
      sprite.position.set(
        Sizes.uiMargin + (this._sprite_size >> 1),
        Sizes.uiMargin + (this._sprite_size >> 1) + 32 + Sizes.uiMargin
      );
      const s_w = sprite.width;
      const s_h = sprite.height;
      const max_size = this._sprite_size - Sizes.uiMargin;
      if (s_w > s_h) {
        this._sprite.width = max_size;
        this._sprite.height = (max_size / s_w) * s_h;
      } else {
        this._sprite.height = max_size;
        this._sprite.width = (max_size / s_h) * s_w;
      }

      const info = drop.info();

      this._title.text = info.name;

      const text: string[] = [];
      if (info.health) text.push(`health: ${info.health}`);
      if (info.speed) text.push(`speed: ${info.speed}`);
      if (info.distance) text.push(`distance: ${info.distance}`);
      if (info.damage) text.push(`damage: ${info.damage}`);
      if (info.price) text.push(`price: ${info.price}$`);
      this._description.text = text.join("\n");
    }
  }
}

export class InventoryCellActionsView extends PIXI.Container {
  private readonly selectable: SelectableMap;
  private readonly selectableOffset: number;
  private readonly controller: InventoryActionsController;
  private readonly buttons: [Button, number, number][] = [];

  private _cell: InventoryCell | null = null;

  constructor(selectable: SelectableMap, selectableOffset: number, controller: InventoryActionsController) {
    super();
    this.selectable = selectable;
    this.selectableOffset = selectableOffset;
    this.controller = controller;
  }

  destroy(): void {
    super.destroy();
    this._cell?.item.unsubscribe(this.handle, this);
    this._cell = null;
    this.removeButtons();
  }

  set cell(cell: InventoryCell) {
    this._cell?.item.unsubscribe(this.handle, this);
    this.removeButtons();
    this._cell = cell;
    this._cell.item.subscribe(this.handle, this);
  }

  get cell(): InventoryCell {
    return this._cell!;
  }

  private handle(item: UsableDrop | null): void {
    this.controller.handle(this, item);
  }

  removeButtons(): void {
    for (let [button, x, y] of this.buttons) {
      this.selectable.remove(x, y);
      button.destroy();
    }
    this.buttons.splice(0, this.buttons.length);
  }

  addButton(label: string, action: () => void): void {
    const total = this.buttons.length;
    const row = total >> 1;
    const cell = total % 2;

    const selectableX = this.selectableOffset + cell;
    const selectableY = 100 + row;
    const button = new Button({
      label: label,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
    });
    button.position.set(
      cell * (BUTTON_WIDTH + Sizes.uiMargin),
      row * (BUTTON_HEIGHT + Sizes.uiMargin)
    );

    this.buttons.push([button, selectableX, selectableY]);
    this.selectable.set(selectableX, selectableY, button, action);
    this.addChild(button);
  }
}
