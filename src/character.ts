export enum CharacterState {
  Idle = 0, Run = 1, Hit = 2
}

export interface Character {
  name: string
  x: number
  y: number
  hitDamage(character: Character, damage: number): void;
}