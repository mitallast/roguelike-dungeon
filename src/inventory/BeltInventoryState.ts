import {PersistentStore} from "../persistent";
import {DefaultInventoryCellState, InventoryCellState, PersistentInventoryCellState} from "./InventoryCellState";
import {UsableDropSerializer} from "../drop";

export interface BeltInventoryState {
  cell(i: number): InventoryCellState;
}

export class DefaultBeltInventoryState implements BeltInventoryState {
  cell(_i: number): InventoryCellState {
    return new DefaultInventoryCellState();
  }
}

export class PersistentBeltInventoryState implements BeltInventoryState {
  private readonly _store: PersistentStore;
  private readonly _serializer: UsableDropSerializer;

  constructor(store: PersistentStore, serializer: UsableDropSerializer) {
    this._store = store.prefix("belt");
    this._serializer = serializer;
  }

  cell(i: number): InventoryCellState {
    return new PersistentInventoryCellState(this._store.prefix(`${i}`), this._serializer);
  }
}