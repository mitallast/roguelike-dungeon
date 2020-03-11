// https://0x72.itch.io/dungeontileset-ii

import * as PIXI from 'pixi.js';

export class Resources {
  private readonly loader: PIXI.Loader;
  // @ts-ignore
  private sheet: PIXI.Spritesheet;

  constructor(loader: PIXI.Loader) {
    this.loader = loader;
  }

  async load(): Promise<void> {
    return await new Promise<void>((resolve => {
      this.loader
        .add('tiles.json')
        .add('sample.json')
        .add('alagard', 'fonts/alagard.fnt')
        .load((_loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
          console.log(resources);
          // @ts-ignore
          this.sheet = resources['tiles.json'].spritesheet;
          // @ts-ignore
          this.sheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
          // @ts-ignore
          resources['fonts/alagard.png'].texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
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

  animated(name: string, autoUpdate: boolean = true): PIXI.AnimatedSprite {
    if (!this.sheet.animations[name]) {
      throw `animation not found: ${name}`;
    }
    const sprite = new PIXI.AnimatedSprite(this.sheet.animations[name], autoUpdate);
    sprite.name = name;
    return sprite;
  }
}