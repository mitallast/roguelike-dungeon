import {HeroState} from "../characters/hero";
import {NpcState} from "../characters/npc";
import {DropInfo, UsableDrop} from "../drop";
import {BackpackInventory, BeltInventory, Inventory} from "./Inventory";
import {InventoryCellActionsView} from "./InventoryView";

export interface InventoryController {
  readonly title: string;
  readonly inventory: Inventory;

  handleActions(view: InventoryCellActionsView, drop: UsableDrop | null): void;

  handleInfo(drop: UsableDrop): DropInfo;
}

export abstract class BaseInventoryController implements InventoryController {
  readonly title: string;
  readonly inventory: Inventory;

  protected constructor(inventory: Inventory, title: string) {
    this.inventory = inventory;
    this.title = title;
  }

  handleActions(view: InventoryCellActionsView, drop: UsableDrop | null): void {
    view.removeButtons();
    if (drop) {
      this.buttons(view, drop);
    }
  }

  abstract handleInfo(drop: UsableDrop): DropInfo;

  protected abstract buttons(view: InventoryCellActionsView, drop: UsableDrop): void;
}

export abstract class BaseHeroInventoryController extends BaseInventoryController {
  protected readonly _hero: HeroState

  protected constructor(hero: HeroState, title: string) {
    super(hero.inventory, title);
    this._hero = hero;
  }

  protected basicButtons(view: InventoryCellActionsView, item: UsableDrop): void {
    const cell = view.cell;
    if (cell.parent instanceof BeltInventory || cell.parent instanceof BackpackInventory) {
      if (this.inventory.equipment.weapon.supports(item)) {
        view.addButton("Equip", () => cell.equip());
      } else {
        view.addButton("Use item", () => cell.use(this._hero));
      }
    }
    if (!(cell.parent instanceof BeltInventory)) view.addButton("To belt", () => cell.toBelt());
    if (!(cell.parent instanceof BackpackInventory)) view.addButton("To backpack", () => cell.toBackpack());
    view.addButton("Drop", () => cell.drop());
  }
}

export class HeroInventoryController extends BaseHeroInventoryController {
  constructor(hero: HeroState) {
    super(hero, "Inventory");
  }

  protected buttons(view: InventoryCellActionsView, item: UsableDrop): void {
    this.basicButtons(view, item);
  }

  handleInfo(drop: UsableDrop): DropInfo {
    const info = drop.info();
    info.price = info.sellPrice;
    return info;
  }
}

export class SellingInventoryController extends BaseHeroInventoryController {
  private readonly _npc: NpcState;

  constructor(hero: HeroState, npc: NpcState) {
    super(hero, "Selling");
    this._npc = npc;
  }

  protected buttons(view: InventoryCellActionsView, item: UsableDrop): void {
    this.basicButtons(view, item);
    this.sellingButtons(view, item);
  }

  protected sellingButtons(view: InventoryCellActionsView, item: UsableDrop): void {
    const price = item.info().sellPrice;
    if (price !== undefined && this._npc.coins.get() >= price && this._npc.inventory.backpack.hasSpace(item)) {
      view.addButton('Sell', () => {
        if (this._npc.coins.get() >= price && this._npc.inventory.backpack.hasSpace(item)) {
          this._npc.decreaseCoins(price);
          this._npc.inventory.backpack.add(item);
          this._hero.coins.update(c => c + price);
          view.cell.decrease();
        } else {
          console.warn("failed sell item");
        }
      });
    } else {
      console.warn(`price: ${price} npc coins: ${this._npc.coins.get()}`);
    }
  }

  handleInfo(drop: UsableDrop): DropInfo {
    const info = drop.info();
    info.price = info.sellPrice;
    return info;
  }
}

export class BuyingInventoryController extends BaseInventoryController {
  private readonly _hero: HeroState;
  private readonly _npc: NpcState;

  constructor(hero: HeroState, npc: NpcState) {
    super(npc.inventory, "Buying");
    this._hero = hero;
    this._npc = npc;
  }

  protected buttons(view: InventoryCellActionsView, drop: UsableDrop): void {
    if (view.cell.parent instanceof BackpackInventory) {
      this.buyingButtons(view, drop);
    }
  }

  protected buyingButtons(view: InventoryCellActionsView, drop: UsableDrop): void {
    const price = drop.info().buyPrice;
    if (price !== undefined && this._hero.coins.get() >= price && this._hero.inventory.hasSpace(drop)) {
      view.addButton('Buy', () => {
        if (this._npc.coins.get() >= price && this._hero.inventory.hasSpace(drop)) {
          this._hero.coins.update(c => Math.max(0, c - price));
          this._hero.inventory.backpack.add(drop);
          this._npc.addCoins(price);
          view.cell.decrease();
        } else {
          console.warn("failed buy item");
        }
      });
    } else {
      console.warn(`price: ${price} hero coins: ${this._hero.coins.get()}`);
    }
  }

  handleInfo(drop: UsableDrop): DropInfo {
    const info = drop.info();
    info.price = info.buyPrice;
    return info;
  }
}