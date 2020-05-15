import {ObservableVar} from "../../observable";
import {PersistentStore} from "../../persistent";
import {Inventory, PersistentInventoryState} from "../../inventory";
import {CharacterState} from "../CharacterState";
import {SceneController} from "../../scene";
import {WeaponManager} from "../../weapon";

export class HeroState extends CharacterState {
  private readonly _global: PersistentStore;
  private readonly _session: PersistentStore;

  readonly name: string;

  readonly healthMax: ObservableVar<number>;
  readonly health: ObservableVar<number>;
  readonly staminaMax: ObservableVar<number>;
  readonly stamina: ObservableVar<number>;
  readonly baseDamage: ObservableVar<number>;
  readonly speed: ObservableVar<number>;
  readonly coins: ObservableVar<number>;

  readonly inventory: Inventory;

  readonly level: ObservableVar<number>;
  readonly levelXp: ObservableVar<number>;
  readonly skillPoints: ObservableVar<number>;
  readonly xp: ObservableVar<number>;

  readonly dungeons: DungeonsState;

  constructor(
    name: string,
    global: PersistentStore,
    session: PersistentStore,
    weaponManager: WeaponManager
  ) {
    super();
    this._global = global; // store.prefix(`global`);
    this._session = session; // store.prefix(`session`);

    this.name = name;

    this.healthMax = this._global.floatVar("healthMax", 30);
    this.health = this._session.floatVar("health", 30);

    this.staminaMax = this._global.floatVar("staminaMax", 70);
    this.stamina = this._session.floatVar("stamina", 70);

    this.baseDamage = this._global.integerVar("baseDamage", 3);
    this.speed = this._global.floatVar("speed", 1);
    this.coins = this._global.integerVar("coins", 0);

    this.inventory = new Inventory(new PersistentInventoryState(this._session, weaponManager));

    this.level = this._global.integerVar("level", 1);
    this.levelXp = this._global.integerVar("levelXp", 0);
    this.skillPoints = this._global.integerVar("skillPoints", 0);
    this.xp = this._global.integerVar("xp", 0);

    this.dungeons = new DungeonsState(this._session);
  }

  destroySession(): void {
    this._session.clear();
    this._session.destroy(); // to prevent override
  }

  addXp(value: number): void {
    this.xp.update((v) => {
      let newXp = v + value;
      for (; ;) {
        const levelXp = this.levelXp.get();
        if (newXp >= levelXp) {
          newXp = newXp - levelXp;
          this.level.update((v) => v + 1);
          this.levelXp.update((v) => v + 1000);
          this.skillPoints.update((v) => v + 1);
        } else {
          break;
        }
      }
      return newXp;
    });
  }
}

export class DungeonsState {
  private readonly _dungeon: PersistentStore;
  private readonly _bonfire: PersistentStore;

  constructor(store: PersistentStore) {
    this._dungeon = store.prefix("dungeon");
    this._bonfire = store.prefix("bonfire");
  }

  private assertNaN(value: number): void {
    if (isNaN(value)) {
      console.trace("value is NaN");
      throw "NaN";
    }
  }

  hasSeed(level: number): boolean {
    this.assertNaN(level);
    return this._dungeon.get(`${level}`) !== null;
  }

  setSeed(level: number, seed: number): void {
    this.assertNaN(level);
    this.assertNaN(seed);
    this._dungeon.set(`${level}`, `${seed}`);
  }

  getSeed(level: number): number {
    this.assertNaN(level);
    return parseInt(this._dungeon.get(`${level}`)!);
  }

  hasBonfire(level: number): boolean {
    this.assertNaN(level);
    return this._bonfire.get(`${level}`) !== null;
  }

  litBonfire(level: number): boolean {
    this.assertNaN(level);
    return this._bonfire.set(`${level}`, "true") !== null;
  }

  bonfires(): number[] {
    return this._bonfire.keys().map(key => parseInt(key)).sort((a: number, b: number) => a - b);
  }
}

export class HeroStateManager {
  private readonly _controller: SceneController;
  private readonly _store: PersistentStore;

  constructor(controller: SceneController) {
    this._controller = controller;
    this._store = controller.store;
  }

  state(name: string): HeroState {
    const store = this._store.prefix(name);
    const global = store.prefix(`global`);
    const session = store.prefix(`session`);

    const newSession = session.isEmpty();

    const state = new HeroState(name, global, session, this._controller.weaponManager);
    if (newSession) {
      const weapon = this._controller.weaponManager.heroWeapon("knife");
      state.inventory.equipment.weapon.set(weapon);
    }
    return state;
  }
}