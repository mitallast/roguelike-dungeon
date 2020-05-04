import * as PIXI from 'pixi.js';

export interface AnimatedSpriteOptions {
  readonly autoUpdate?: boolean; // default true
  readonly animationSpeed?: number; // default 0.2
  readonly loop?: boolean; // default true
  readonly play?: boolean; // default true
}

export class Resources {
  readonly loader: PIXI.Loader;

  private readonly _sprites: Partial<Record<string, PIXI.Texture>> = {};
  private readonly _animations: Partial<Record<string, any>> = {};

  constructor(loader: PIXI.Loader) {
    this.loader = loader;
  }

  async load(): Promise<void> {
    return await new Promise<void>((resolve => {
      this.loader
        // configs
        .add('npc.json')
        .add('dungeon.json')
        .add('bonfire.json')
        .add('dungeon.rules.json')
        .add('dungeon.rules.4.json')
        .add('dungeon.design.json')
        .add('dialogs.json')
        // fonts
        .add('alagard', 'fonts/alagard.fnt')
        // sounds
        .add('big_egg_collect', 'sounds/big_egg_collect.{ogg,mp3}')
        .add('fruit_collect', 'sounds/fruit_collect.{ogg,mp3}')
        .add('select', 'sounds/select.{ogg,mp3}')
        .add('confirm', 'sounds/confirm.{ogg,mp3}')
        .add('cancel', 'sounds/cancel.{ogg,mp3}')
        .add('text', 'sounds/text.{ogg,mp3}')
        .add('boss_hit', 'sounds/boss_hit.{ogg,mp3}')
        .add('hit_damage', 'sounds/hit_damage.{ogg,mp3}')
        .load((_loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
          resources['fonts/alagard.png']!.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
          this.add(resources['npc.json']!.spritesheet!);
          this.add(resources['dungeon.json']!.spritesheet!);
          this.add(resources['bonfire.json']!.spritesheet!);
          resolve();
        });
    }));
  }

  private add(spritesheet: PIXI.Spritesheet): void {
    spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    for (const name of Object.keys(spritesheet.textures)) {
      this._sprites[name] = spritesheet.textures[name];
    }
    for (const name of Object.keys(spritesheet.animations)) {
      this._animations[name] = spritesheet.animations[name];
    }
  }

  sprite(name: string, options: AnimatedSpriteOptions = {}): PIXI.Sprite | PIXI.AnimatedSprite {
    if (this._sprites[name]) {
      return this.fixed(name);
    } else if (this._animations[name]) {
      return this.animated(name, options);
    } else {
      throw `sprite or animation not found: ${name}`;
    }
  }

  fixed(name: string): PIXI.Sprite {
    if (!this._sprites[name]) {
      throw `sprite not found: ${name}`;
    }
    const sprite = new PIXI.Sprite(this._sprites[name]);
    sprite.name = name;
    return sprite;
  }

  animated(name: string, options: AnimatedSpriteOptions = {}): PIXI.AnimatedSprite {
    if (!this._animations[name]) {
      throw `animation not found: ${name}`;
    }
    const sprite = new PIXI.AnimatedSprite(this._animations[name]);
    sprite.name = name;
    sprite.autoUpdate = options.autoUpdate !== undefined ? options.autoUpdate : true;
    sprite.animationSpeed = options.animationSpeed !== undefined ? options.animationSpeed : 0.2;
    sprite.loop = options.loop !== undefined ? options.loop : true;
    if (options.play !== undefined ? options.play : true) {
      sprite.play();
    }
    return sprite;
  }
}