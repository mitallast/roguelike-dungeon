export interface NpcConfig {
  readonly name: string;
  readonly width: number;
  readonly height: number;

  readonly healthMax: number;
  readonly health: number;
  readonly baseDamage: number;
  readonly speed: number;
  readonly coins: number;

  readonly skills: readonly string[];
  readonly weapons: readonly string[];
  readonly trading: readonly string[];
}

export interface NpcConfiguration {
  readonly npc: Partial<Record<string, NpcConfig>>;
}