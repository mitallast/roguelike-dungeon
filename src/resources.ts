import * as PIXI from 'pixi.js';

export class Resources {
  readonly loader: PIXI.Loader;

  private readonly _textures: Partial<Record<string, PIXI.Texture>> = {};
  private readonly _animations: Partial<Record<string, any>> = {};

  constructor(loader: PIXI.Loader) {
    this.loader = loader;
  }

  async load(): Promise<void> {
    return await new Promise<void>((resolve => {
      this.loader
        .add('npc.json')
        .add('dungeon.json')
        .add('dungeon.rules.json')
        .add('dungeon.rules.4.json')
        .add('dungeon.design.json')
        .add('dialogs.json')
        .add('village.json')
        .add('village.rules.json')
        .add('alagard', 'fonts/alagard.fnt')
        .load((_loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
          resources['fonts/alagard.png']!.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
          this.add(resources['npc.json']!.spritesheet!);
          this.add(resources['dungeon.json']!.spritesheet!);
          this.add(resources['village.json']!.spritesheet!);
          resolve();
        });
    }));
  }

  private add(spritesheet: PIXI.Spritesheet): void {
    spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    for (let name of Object.keys(spritesheet.textures)) {
      this._textures[name] = spritesheet.textures[name];
    }
    for (let name of Object.keys(spritesheet.animations)) {
      this._animations[name] = spritesheet.animations[name];
    }
  }

  get textures(): string[] {
    return Object.keys(this._textures);
  }

  get animations(): string[] {
    return Object.keys(this._animations);
  }

  sprite(name: string): PIXI.Sprite {
    if (!this._textures[name]) {
      throw `sprite not found: ${name}`;
    }
    const sprite = new PIXI.Sprite(this._textures[name]);
    sprite.name = name;
    return sprite;
  }

  animated(name: string, autoUpdate: boolean = true): PIXI.AnimatedSprite {
    if (!this._animations[name]) {
      throw `animation not found: ${name}`;
    }
    const sprite = new PIXI.AnimatedSprite(this._animations[name], autoUpdate);
    sprite.name = name;
    return sprite;
  }
}