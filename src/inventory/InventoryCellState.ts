import {ObservableVar} from "../observable";
import {UsableDrop, UsableDropSerializer} from "../drop";
import {PersistentStore} from "../persistent";

export interface InventoryCellState {
  readonly item: ObservableVar<UsableDrop | null>;
  readonly count: ObservableVar<number>;
}

export class DefaultInventoryCellState implements InventoryCellState {
  readonly item: ObservableVar<UsableDrop | null>;
  readonly count: ObservableVar<number>;

  constructor() {
    this.item = new ObservableVar<UsableDrop | null>(null);
    this.count = new ObservableVar<number>(0);
  }
}

export class PersistentInventoryCellState implements InventoryCellState {
  readonly item: ObservableVar<UsableDrop | null>;
  readonly count: ObservableVar<number>;

  constructor(store: PersistentStore, serializer: UsableDropSerializer) {
    this.item = store.optionalVar<UsableDrop | null>("item", null, serializer);
    this.count = store.integerVar("count", 0);
  }
}