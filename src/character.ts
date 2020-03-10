export enum CharacterState {
  Idle = 0, Run = 1, Hit = 2
}

export interface Character {
  name: string
  x: number
  y: number
  hitDamage(character: Character, damage: number): void;
}

export class CharacterWrapper implements Character {
  private readonly character: Character;

  constructor(character: Character) {
    this.character = character;
  }

  get name(): string {
    return this.character.name;
  }

  get x(): number {
    return this.character.x;
  }

  get y(): number {
    return this.character.y;
  }

  hitDamage(character: Character, damage: number) {
    // @todo what if is character has 2 tiles?!
    this.character.hitDamage(character, damage);
  }
}