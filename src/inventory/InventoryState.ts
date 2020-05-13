import {PersistentStore} from "../persistent";
import {
  DefaultEquipmentInventoryState,
  EquipmentInventoryState,
  PersistentEquipmentInventoryState
} from "./EquipmentInventoryState";
import {BeltInventoryState, DefaultBeltInventoryState, PersistentBeltInventoryState} from "./BeltInventoryState";
import {
  BackpackInventoryState,
  DefaultBackpackInventoryState,
  PersistentBackpackInventoryState
} from "./BackpackInventoryState";
import {ObservableVar} from "../observable";
import {UsableDropSerializer} from "../drop";
import {WeaponManager} from "../weapon";

export interface InventoryState {
  readonly equipment: EquipmentInventoryState;
  readonly belt: BeltInventoryState;
  readonly backpack: BackpackInventoryState;

  readonly coins: ObservableVar<number>;
}

export class DefaultInventoryState implements InventoryState {
  readonly equipment: EquipmentInventoryState = new DefaultEquipmentInventoryState();
  readonly belt: BeltInventoryState = new DefaultBeltInventoryState();
  readonly backpack: BackpackInventoryState = new DefaultBackpackInventoryState();
  readonly coins: ObservableVar<number> = new ObservableVar<number>(0);
}

export class PersistentInventoryState implements InventoryState {
  readonly equipment: EquipmentInventoryState;
  readonly belt: BeltInventoryState;
  readonly backpack: BackpackInventoryState;
  readonly coins: ObservableVar<number>;

  constructor(store: PersistentStore, weaponManager: WeaponManager) {
    const serializer = new UsableDropSerializer(weaponManager);
    this.equipment = new PersistentEquipmentInventoryState(store, serializer);
    this.belt = new PersistentBeltInventoryState(store, serializer);
    this.backpack = new PersistentBackpackInventoryState(store, serializer);
    this.coins = store.integerVar("coins", 0);
  }
}
