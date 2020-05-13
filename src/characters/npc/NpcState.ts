import {DefaultCharacterState} from "../DefaultCharacterState";
import {NpcSkill} from "./NpcSkill";

export class NpcState extends DefaultCharacterState {
  private _context: Map<string, any> = new Map<string, any>();
  private _skill: Map<string, NpcSkill> = new Map<string, NpcSkill>();

  readonly level: number;
  readonly width: number;
  readonly height: number;

  setContext(key: string, value: any): void {
    this._context.set(key, value);
  }

  getContext(key: string): any {
    return this._context.get(key);
  }

  hasSkill(id: string): boolean {
    return this._skill.has(id);
  }

  getSkill(id: string): NpcSkill | null {
    return this._skill.get(id) || null;
  }

  addSkill(id: string, skill: NpcSkill): void {
    this._skill.set(id, skill);
  }

  constructor(options: {
    name: string;

    healthMax: number;
    health: number;
    baseDamage: number;
    speed: number;
    coins: number;

    level: number;
    width: number;
    height: number;
  }) {
    super(options);
    this.level = options.level;
    this.width = options.width;
    this.height = options.height;
  }
}