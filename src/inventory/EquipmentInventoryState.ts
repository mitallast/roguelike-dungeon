import {PersistentStore} from "../persistent";
import {DefaultInventoryCellState, InventoryCellState, PersistentInventoryCellState} from "./InventoryCellState";
import {UsableDropSerializer} from "../drop";

export interface EquipmentInventoryState {
  cell(key: string): InventoryCellState;
}

export class DefaultEquipmentInventoryState implements EquipmentInventoryState {
  cell(_key: string): InventoryCellState {
    return new DefaultInventoryCellState();
  }
}

export class PersistentEquipmentInventoryState implements EquipmentInventoryState {
  private readonly _store: PersistentStore;
  private readonly _serializer: UsableDropSerializer;

  constructor(store: PersistentStore, serializer: UsableDropSerializer) {
    this._store = store.prefix("equipment");
    this._serializer = serializer;
  }

  cell(key: string): InventoryCellState {
    return new PersistentInventoryCellState(this._store.prefix(`${key}`), this._serializer);
  }
}