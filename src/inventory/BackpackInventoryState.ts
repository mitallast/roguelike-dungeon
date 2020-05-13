import {PersistentStore} from "../persistent";
import {DefaultInventoryCellState, InventoryCellState, PersistentInventoryCellState} from "./InventoryCellState";
import {UsableDropSerializer} from "../drop";

export interface BackpackInventoryState {
  cell(x: number, y: number): InventoryCellState;
}

export class DefaultBackpackInventoryState implements BackpackInventoryState {
  cell(_x: number, _y: number): InventoryCellState {
    return new DefaultInventoryCellState();
  }
}

export class PersistentBackpackInventoryState implements BackpackInventoryState {
  private readonly _store: PersistentStore;
  private readonly _serializer: UsableDropSerializer

  constructor(store: PersistentStore, serializer: UsableDropSerializer) {
    this._store = store.prefix("backpack");
    this._serializer = serializer;
  }

  cell(x: number, y: number): InventoryCellState {
    return new PersistentInventoryCellState(this._store.prefix(`${x}:${y}`), this._serializer);
  }
}