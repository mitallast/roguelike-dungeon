import {Character} from "../character";
import {EventPublisher, Observable, ObservableVar} from "../observable";
import {UsableDrop} from "../drop";
import {BackpackInventory, BeltInventory, EquipmentInventory} from "./Inventory";

export class InventoryCell {
  private readonly _character: Character;
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
    character: Character,
    maxInStack: number,
    predicate: (item: UsableDrop) => boolean,
    drop: EventPublisher<[UsableDrop, number]>,
    parent: EquipmentInventory | BeltInventory | BackpackInventory,
  ) {
    this._character = character;
    this._maxInStack = maxInStack;
    this._predicate = predicate;
    this._drop = drop;
    this.parent = parent;
  }

  hasSpace(item: UsableDrop): boolean {
    return this.supports(item) && (
      this.isEmpty || (this._item.get()!.same(item) && this._count.get() < this._maxInStack)
    );
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
  }

  clear(): void {
    if (this._item.get()) {
      this._item.set(null);
      this._count.set(0);
    }
  }

  set(item: UsableDrop, count: number = 1): boolean {
    if (!this._item.get() && this._predicate(item)) {
      this._item.set(item);
      this._count.set(count);
      return true;
    }
    return false;
  }

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
      item.use(this, this._character);
      return true;
    }
    return false;
  }

  equip(): void {
    const item = this._item.get();
    const weapon = this._character.inventory.equipment.weapon;
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
      if (this._character.inventory.belt.add(item)) {
        this.decrease();
      } else {
        break;
      }
    }
  }

  toBackpack(): void {
    const item = this._item.get();
    while (item && !this.isEmpty) {
      if (this._character.inventory.backpack.add(item)) {
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