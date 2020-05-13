import {EventPublisher, Observable} from "../observable";
import {UsableDrop} from "../drop";
import {BackpackInventory, BeltInventory, EquipmentInventory} from "./Inventory";
import {InventoryCellState} from "./InventoryCellState";
import {CharacterState} from "../characters/CharacterState";

export class InventoryCell {
  private readonly _state: InventoryCellState;
  private readonly _maxInStack: number;
  private readonly _predicate: (item: UsableDrop) => boolean;
  private readonly _drop: EventPublisher<[UsableDrop, number]>;

  readonly parent: EquipmentInventory | BeltInventory | BackpackInventory;

  get item(): Observable<UsableDrop | null> {
    return this._state.item;
  }

  get count(): Observable<number> {
    return this._state.count;
  }

  constructor(
    state: InventoryCellState,
    maxInStack: number,
    predicate: (item: UsableDrop) => boolean,
    drop: EventPublisher<[UsableDrop, number]>,
    parent: EquipmentInventory | BeltInventory | BackpackInventory,
  ) {
    this._state = state;
    this._maxInStack = maxInStack;
    this._predicate = predicate;
    this._drop = drop;
    this.parent = parent;
  }

  hasSpace(item: UsableDrop): boolean {
    return this.supports(item) && (
      this.isEmpty || (this._state.item.get()!.same(item) && this._state.count.get() < this._maxInStack)
    );
  }

  supports(item: UsableDrop): boolean {
    return this._predicate(item);
  }

  stack(item: UsableDrop): boolean {
    if (this._state.item.get()?.same(item) && this._state.count.get() < this._maxInStack) {
      this._state.count.update(c => c + 1);
      return true;
    }
    return false;
  }

  clear(): void {
    if (this._state.item.get()) {
      this._state.item.set(null);
      this._state.count.set(0);
    }
  }

  set(item: UsableDrop, count: number = 1): boolean {
    if (!this._state.item.get() && this._predicate(item)) {
      this._state.item.set(item);
      this._state.count.set(count);
      return true;
    }
    return false;
  }

  decrease(): void {
    this._state.count.update(c => Math.max(0, c - 1));
    if (this._state.count.get() <= 0) {
      this._state.item.set(null);
      this._state.count.set(0);
    }
  }

  get isEmpty(): boolean {
    return this._state.item.get() == null;
  }

  use(character: CharacterState): boolean {
    const item = this._state.item.get();
    if (item) {
      item.use(this, character);
      return true;
    }
    return false;
  }

  equip(): void {
    const item = this._state.item.get();
    const weapon = this.parent.inventory.equipment.weapon;
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
    const item = this._state.item.get();
    while (item && !this.isEmpty) {
      if (this.parent.inventory.belt.add(item)) {
        this.decrease();
      } else {
        break;
      }
    }
  }

  toBackpack(): void {
    const item = this._state.item.get();
    while (item && !this.isEmpty) {
      if (this.parent.inventory.backpack.add(item)) {
        this.decrease();
      } else {
        break;
      }
    }
  }

  drop(): void {
    const drop = this._state.item.get();
    const count = this._state.count.get();
    if (drop) {
      this._state.item.set(null);
      this._state.count.set(0);
      this._drop.send([drop, count]);
    }
  }
}