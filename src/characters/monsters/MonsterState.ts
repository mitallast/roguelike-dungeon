import {DefaultCharacterState} from "../DefaultCharacterState";
import {MonsterRace, MonsterType} from "./Monster";
import {Hero} from "../hero";

export class MonsterState extends DefaultCharacterState {
  readonly level: number;
  readonly luck: number;
  readonly xp: number;
  readonly race: MonsterRace;
  readonly type: MonsterType;

  readonly viewRange: number;
  readonly width: number;
  readonly height: number;

  constructor(options: {
    name: string;
    healthMax: number;
    health: number;
    staminaMax: number;
    stamina: number;
    baseDamage: number;
    speed: number;
    coins: number;

    level: number;
    luck: number;
    xp: number;
    race: MonsterRace;
    type: MonsterType;

    viewRange: number;
    width: number;
    height: number;
  }) {
    super(options);
    this.level = options.level;
    this.luck = options.luck;
    this.xp = options.xp;
    this.race = options.race;
    this.type = options.type;

    this.viewRange = options.viewRange;
    this.width = options.width;
    this.height = options.height;

    this.killedBy.unsubscribe(ch => {
      if (ch instanceof Hero) {
        ch.state.addXp(this.xp);
      }
    }, this);
  }
}