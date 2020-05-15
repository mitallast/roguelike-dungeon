import {Resources} from "../resources";
import {UIButton, Colors, HStack, UISelectable, UISelectableGrid, Sizes, VStack} from "../ui";
import {Observable, ObservableVar, Publisher} from "../observable";
import {UsableDrop} from "../drop";
import {InventoryController} from "./InventoryController";
import {InventoryCell} from "./InventoryCell";
import {BackpackInventory, BeltInventory, EquipmentInventory} from "./Inventory";
import * as PIXI from "pixi.js";

const CELL_SIZE = 32;

const BUTTON_WIDTH = 170;
const BUTTON_HEIGHT = 32;

export class InventoryView extends PIXI.Container {
  private readonly _selectable: UISelectableGrid;
  private readonly _selectableOffsetX: number;
  private readonly _selectableOffsetY: number;

  private readonly _equipment: EquipmentInventoryView;
  private readonly _belt: BeltInventoryView;
  private readonly _backpack: BackpackInventoryView;
  private readonly _card: InventoryCellCardView;
  private readonly _actions: InventoryCellActionsView;

  constructor(
    resources: Resources,
    controller: InventoryController,
    selectable: UISelectableGrid,
    selectableOffsetX: number,
    selectableOffsetY: number,
  ) {
    super();
    this._selectable = selectable;
    this._selectableOffsetX = selectableOffsetX;
    this._selectableOffsetY = selectableOffsetY;

    const inventory = controller.inventory;

    const viewStack = new HStack({padding: 0});
    this.addChild(viewStack);
    const inventoryStack = new VStack({padding: 0});
    viewStack.addChild(inventoryStack);

    this._equipment = new EquipmentInventoryView(resources, inventory.equipment);
    inventoryStack.addChild(this._equipment);
    selectable.set(selectableOffsetX, selectableOffsetY, this._equipment.weapon, () => this.show(inventory.equipment.weapon));
    selectable.merge(selectableOffsetX, selectableOffsetY, 10, 1);

    this._belt = new BeltInventoryView(resources, inventory.belt);
    inventoryStack.addChild(this._belt);
    for (let i = 0; i < this._belt.length; i++) {
      const cell = inventory.belt.cell(i);
      this._selectable.set(selectableOffsetX + i, selectableOffsetY + 1, this._belt.cell(i), () => this.show(cell));
    }

    this._backpack = new BackpackInventoryView(resources, inventory.backpack);
    inventoryStack.addChild(this._backpack);

    for (let x = 0; x < inventory.backpack.width; x++) {
      for (let y = 0; y < inventory.backpack.height; y++) {
        const cell = inventory.backpack.cell(x, y);
        this._selectable.set(selectableOffsetX + x, selectableOffsetY + y + 2, this._backpack.cell(x, y), () => this.show(cell));
      }
    }

    this._actions = new InventoryCellActionsView(this._selectable, this._selectableOffsetX, this._selectableOffsetY, controller);
    inventoryStack.addChild(this._actions);

    this._card = new InventoryCellCardView(resources, controller, {
      width: 400,
      height: 400,
    });
    viewStack.addChild(this._card);
  }

  destroy(): void {
    super.destroy();

    this._equipment.destroy();
    this._belt.destroy();
    this._backpack.destroy();
    this._card.destroy();
  }

  private show(cell: InventoryCell): void {
    this._card.publisher = cell.item;
    this._actions.cell = cell;
  }
}

export class EquipmentInventoryView extends PIXI.Container {
  private readonly _equipment: EquipmentInventory;

  readonly weapon: InventoryCellView;

  constructor(resources: Resources, equipment: EquipmentInventory) {
    super();

    this._equipment = equipment;

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground)
      .drawRect(
        0, 0,
        CELL_SIZE + (Sizes.uiBorder << 1),
        CELL_SIZE + (Sizes.uiBorder << 1)
      )
      .endFill();
    this.addChild(background);

    this.weapon = new InventoryCellView(resources, {
      item: this._equipment.weapon.item,
      count: new ObservableVar(null)
    });
    this.weapon.position.set(Sizes.uiBorder, Sizes.uiBorder);
    this.addChild(this.weapon);
  }
}

export class BeltInventoryView extends PIXI.Container {
  private readonly _inventory: BeltInventory;
  private readonly _cells: InventoryCellView[];

  constructor(resources: Resources, inventory: BeltInventory) {
    super();
    this._inventory = inventory;

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground)
      .drawRect(
        0, 0,
        Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * inventory.length,
        CELL_SIZE + (Sizes.uiBorder << 1)
      )
      .endFill();
    this.addChild(background);

    this._cells = [];
    for (let i = 0; i < inventory.length; i++) {
      const cell = inventory.cell(i);
      const view = new InventoryCellView(resources, {
        item: cell.item,
        count: cell.count,
      });
      view.position.set(
        Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * i,
        Sizes.uiBorder
      );
      this._cells.push(view);
      this.addChild(view);
    }
  }

  get length(): number {
    return this._inventory.length;
  }

  cell(index: number): InventoryCellView {
    return this._cells[index];
  }
}

export class BackpackInventoryView extends PIXI.Container {
  private readonly _cells: InventoryCellView[][];

  constructor(resources: Resources, inventory: BackpackInventory) {
    super();
    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground)
      .drawRect(
        0, 0,
        Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * inventory.width,
        Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * inventory.height,
      )
      .endFill();
    this.addChild(background);

    this._cells = [];
    for (let y = 0; y < inventory.height; y++) {
      this._cells.push([]);
      for (let x = 0; x < inventory.width; x++) {
        const cell = inventory.cell(x, y);
        const view = new InventoryCellView(resources, {
          item: cell.item,
          count: cell.count,
        });
        view.position.set(
          Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * x,
          Sizes.uiBorder + (CELL_SIZE + Sizes.uiBorder) * y
        );
        this._cells[y][x] = view;
        this.addChild(view);
      }
    }
  }

  cell(x: number, y: number): InventoryCellView {
    return this._cells[y][x];
  }
}

export class InventoryCellView extends PIXI.Container implements UISelectable {
  private readonly _item: Observable<UsableDrop | null>;
  private readonly _count: Observable<number | null>;

  private readonly _resources: Resources;
  private readonly _background: PIXI.Graphics;
  private readonly _counter: PIXI.BitmapText;
  private _sprite: PIXI.Sprite | null = null;

  private _selected: boolean = false;

  constructor(resources: Resources, options: {
    item: Observable<UsableDrop | null>;
    count: Observable<number | null>;
  }) {
    super();
    this._item = options.item;
    this._count = options.count;
    this._resources = resources;
    this._background = new PIXI.Graphics();
    this.selected = false;

    this._counter = new PIXI.BitmapText("0", {font: {name: "alagard", size: 16}});
    this._counter.anchor = new PIXI.Point(1, 0);
    this._counter.position.set(CELL_SIZE - Sizes.uiBorder, 0);

    this.addChild(this._background, this._counter);

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
    this._background
      .clear()
      .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
      .drawRect(0, 0, CELL_SIZE, CELL_SIZE)
      .endFill();
  }

  private updateCounter(counter: number | null): void {
    if (counter === null || counter === 0) {
      this._counter.text = "";
    } else {
      this._counter.text = counter.toString();
    }
  }

  private updateItem(item: UsableDrop | null): void {
    this._sprite?.destroy();
    this._sprite = null;
    if (item) {
      this._sprite = this._resources.spriteOrAnimation(item.spriteName);
      const max = CELL_SIZE - (Sizes.uiBorder << 1);
      const scale = max / Math.max(this._sprite.width, this._sprite.height);
      this._sprite.scale.set(scale, scale);
      this._sprite.anchor.set(0.5, 0);
      this._sprite.position.set(CELL_SIZE >> 1, Sizes.uiBorder);
      this.addChild(this._sprite);
    }
  }
}

export class InventoryCellCardView extends PIXI.Container {
  private readonly _resources: Resources;
  private readonly _controller: InventoryController;
  private readonly _width: number;
  private readonly _height: number;
  private readonly _spriteSize: number;

  private _sprite: PIXI.Sprite | PIXI.AnimatedSprite | null = null;
  private readonly _title: PIXI.BitmapText;
  private readonly _description: PIXI.BitmapText;

  private _publisher: Publisher<UsableDrop | null> | null = null;

  constructor(resources: Resources, controller: InventoryController, options: {
    width?: number;
    height?: number;
  }) {
    super();
    this._resources = resources;
    this._controller = controller;
    this._width = options.width || 400;
    this._height = options.height || 400;
    this._spriteSize = 128 + (Sizes.uiMargin << 1);

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground)
      .drawRect(0, 0, this._width, this._height)
      .endFill()
      .beginFill(Colors.uiNotSelected)
      .drawRect(Sizes.uiMargin, Sizes.uiMargin + 32 + Sizes.uiMargin, this._spriteSize, this._spriteSize)
      .endFill();

    this._title = new PIXI.BitmapText("", {font: {name: "alagard", size: 32}});
    this._title.anchor = new PIXI.Point(0.5, 0);
    this._title.position.set(this._width >> 1, Sizes.uiMargin);

    this._description = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this._description.position.set(
      Sizes.uiMargin + this._spriteSize + Sizes.uiMargin,
      Sizes.uiMargin + 32 + Sizes.uiMargin
    );

    this.addChild(background, this._title, this._description);
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
      const sprite = this._sprite = this._resources.spriteOrAnimation(drop.spriteName);
      sprite.anchor = new PIXI.Point(0.5, 0.5);
      sprite.position.set(
        Sizes.uiMargin + (this._spriteSize >> 1),
        Sizes.uiMargin + (this._spriteSize >> 1) + 32 + Sizes.uiMargin
      );
      const maxSize = this._spriteSize - Sizes.uiMargin;
      const w = sprite.width;
      const h = sprite.height;
      if (w > h) {
        this._sprite.width = maxSize;
        this._sprite.height = (maxSize / w) * h;
      } else {
        this._sprite.height = maxSize;
        this._sprite.width = (maxSize / h) * w;
      }
      this.addChild(this._sprite);

      const info = this._controller.handleInfo(drop);

      this._title.text = info.name;

      const text: string[] = [];
      if (info.health) text.push(`health: ${info.health}`);
      if (info.speed) text.push(`speed: ${info.speed * 100}%`);
      if (info.distance) text.push(`distance: ${info.distance}`);
      if (info.damage) text.push(`damage: ${info.damage}`);
      if (info.stamina) text.push(`stamina: ${info.stamina}`);
      if (info.price) text.push(`price: ${info.price}$`);
      this._description.text = text.join("\n");
    }
  }
}

export class InventoryCellActionsView extends PIXI.Container {
  private readonly _selectable: UISelectableGrid;
  private readonly _selectableOffsetX: number;
  private readonly _selectableOffsetY: number;
  private readonly _controller: InventoryController;
  private readonly _buttons: [UIButton, number, number][] = [];

  private _cell: InventoryCell | null = null;

  constructor(selectable: UISelectableGrid, selectableOffsetX: number, selectableOffsetY: number, controller: InventoryController) {
    super();
    this._selectable = selectable;
    this._selectableOffsetX = selectableOffsetX;
    this._selectableOffsetY = selectableOffsetY;
    this._controller = controller;
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
    this._controller.handleActions(this, item);
  }

  removeButtons(): void {
    for (const [button, x, y] of this._buttons) {
      this._selectable.unmerge(x, y);
      this._selectable.remove(x, y);
      button.destroy();
    }
    this._selectable!.reset();
    this._buttons.splice(0, this._buttons.length);
  }

  addButton(label: string, action: () => void): void {
    const total = this._buttons.length;
    const row = total >> 1;
    const cell = total % 2;

    const mergeWidth = 5;
    const selectableX = this._selectableOffsetX + (cell * mergeWidth);
    const selectableY = this._selectableOffsetY + 10 + row;
    const button = new UIButton({
      label: label,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
    });
    button.position.set(
      cell * (BUTTON_WIDTH + Sizes.uiMargin),
      row * (BUTTON_HEIGHT + Sizes.uiMargin)
    );

    this._buttons.push([button, selectableX, selectableY]);
    this._selectable.set(selectableX, selectableY, button, action);
    this._selectable.merge(selectableX, selectableY, mergeWidth, 1);
    this.addChild(button);
  }
}