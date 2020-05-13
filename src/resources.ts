import * as PIXI from 'pixi.js';

export interface AnimatedSpriteOptions {
  readonly autoUpdate?: boolean; // default true
  readonly animationSpeed?: number; // default 0.2
  readonly loop?: boolean; // default true
  readonly play?: boolean; // default true
}

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
        // tilemaps
        .add('spritesheets/npc.json')
        .add('spritesheets/dungeon.json')
        .add('spritesheets/bonfire.json')
        // configs
        .add('dungeon.rules.json')
        .add('dungeon.design.json')
        .add('dialogs.json')
        .add('npc.config.json')
        .add('weapon.config.json')
        .add('monster.config.json')
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
          this.add(resources['spritesheets/npc.json']!.spritesheet!);
          this.add(resources['spritesheets/dungeon.json']!.spritesheet!);
          this.add(resources['spritesheets/bonfire.json']!.spritesheet!);
          console.log('_animations', this._animations);
          console.log('_textures', this._textures);
          resolve();
        });
    }));
  }

  private add(spritesheet: PIXI.Spritesheet): void {
    spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    for (const name of Object.keys(spritesheet.textures)) {
      this._textures[name] = spritesheet.textures[name];
    }
    for (const name of Object.keys(spritesheet.animations)) {
      this._animations[name] = spritesheet.animations[name];
    }
  }

  texture(name: string): PIXI.Texture {
    const texture = this._textures[name];
    if (!texture) {
      throw `texture not found: ${name}`;
    }
    return texture;
  }

  sprite(name: string): PIXI.Sprite {
    const sprite = new PIXI.Sprite(this.texture(name));
    sprite.name = name;
    return sprite;
  }

  animation(name: string): PIXI.Texture[] {
    const animation = this._animations[name];
    if (!animation) {
      throw `animation not found: ${name}`;
    }
    return [...animation];
  }

  animatedSprite(name: string, options: AnimatedSpriteOptions = {}): PIXI.AnimatedSprite {
    const sprite = new PIXI.AnimatedSprite(this.animation(name));
    sprite.name = name;
    sprite.autoUpdate = options.autoUpdate !== undefined ? options.autoUpdate : true;
    sprite.animationSpeed = options.animationSpeed !== undefined ? options.animationSpeed : 0.2;
    sprite.loop = options.loop !== undefined ? options.loop : true;
    if (options.play !== undefined ? options.play : true) {
      sprite.play();
    }
    return sprite;
  }

  spriteOrAnimation(name: string, options: AnimatedSpriteOptions = {}): PIXI.Sprite | PIXI.AnimatedSprite {
    if (this._textures[name]) {
      return this.sprite(name);
    } else if (this._animations[name]) {
      return this.animatedSprite(name, options);
    } else {
      throw `sprite or animation not found: ${name}`;
    }
  }
}