// https://0x72.itch.io/dungeontileset-ii

// @ts-ignore
import * as PIXI from 'pixi.js';

export class TileRegistry {
  private readonly loader: PIXI.Loader;
  private sheet: PIXI.Spritesheet;

  constructor(loader: PIXI.Loader) {
    this.loader = loader;
  }

  async load(): Promise<void> {
    return await new Promise<void>((resolve => {
      this.loader
        .add("tiles.json")
        .add("sample.json")
        .load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
          this.sheet = resources["tiles.json"].spritesheet;
          this.sheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
          resolve();
        });
    }));
  }

  get textures(): string[] {
    return Object.keys(this.sheet.textures);
  }

  sprite(name: string): PIXI.Sprite {
    if (!this.sheet.textures[name]) {
      throw `sprite not found: ${name}`;
    }
    const sprite = new PIXI.Sprite(this.sheet.textures[name]);
    sprite.name = name;
    return sprite;
  }

  animated(name: string): PIXI.AnimatedSprite {
    if (!this.sheet.animations[name]) {
      throw `animation not found: ${name}`;
    }
    const sprite = new PIXI.AnimatedSprite(this.sheet.animations[name]);
    sprite.name = name;
    return sprite;
  }
}