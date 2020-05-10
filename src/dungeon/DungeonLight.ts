import * as PIXI from 'pixi.js';
import {DungeonMap} from "./DungeonMap";
import {SegmentType, ShadowCaster} from "./ShadowCaster";

const TILE_SIZE = 16;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export class DungeonLight {
  readonly layer: PIXI.display.Layer;
  readonly shadow: PIXI.Sprite;

  private readonly _dungeon: DungeonMap;

  private readonly _heroLightTexture: PIXI.Texture;
  private readonly _fountainRedTexture: PIXI.Texture;
  private readonly _fountainBlueTexture: PIXI.Texture;
  private readonly _bonfireTexture: PIXI.Texture;
  private readonly _shadowCaster: ShadowCaster;

  private readonly _lights: DungeonLightSource[] = [];

  constructor(dungeon: DungeonMap) {
    this._dungeon = dungeon;
    this.layer = new PIXI.display.Layer();
    this.layer.useRenderTexture = true;
    this.layer.on('display', (element: any) => {
      element.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    });
    this.layer.clearColor = [0, 0, 0, 1];

    this.shadow = new PIXI.Sprite(this.layer.getRenderTexture());
    this.shadow.blendMode = PIXI.BLEND_MODES.MULTIPLY;

    this._heroLightTexture = DungeonLight.gradient("white", 150);
    this._fountainRedTexture = DungeonLight.gradient("rgb(211,78,56)", 50);
    this._fountainBlueTexture = DungeonLight.gradient("rgb(86,152,204)", 50);
    this._bonfireTexture = DungeonLight.gradient("rgb(255,239,204)", 100);

    this._shadowCaster = new ShadowCaster();

    this._dungeon.ticker.add(this.update, this);
  }

  destroy(): void {
    this._dungeon.ticker.remove(this.update, this);
    this._lights.forEach(l => l.destroy());
    this._heroLightTexture.destroy();
    this._fountainBlueTexture.destroy();
    this._fountainRedTexture.destroy();
    this._bonfireTexture.destroy();
    this.layer.destroy();
    this.shadow.destroy();
  }

  loadMap(): void {
    this._shadowCaster.init();
    const dungeon = this._dungeon;

    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor) {
          const position = new PIXI.Point(x * TILE_SIZE, y * TILE_SIZE);
          switch (cell.floorName) {
            case 'wall_fountain_basin_red':
              this.addLight(position, DungeonLightType.RED_BASIN);
              break;
            case 'wall_fountain_basin_blue':
              this.addLight(position, DungeonLightType.BLUE_BASIN);
              break;
            default:
              break;
          }

          // find wall segments
          const hasTop = y > 0 && dungeon.cell(x, y - 1).hasFloor;
          const hasBottom = y + 1 < dungeon.height && dungeon.cell(x, y + 1).hasFloor;
          const hasLeft = x > 0 && dungeon.cell(x - 1, y).hasFloor;
          const hasRight = x + 1 < dungeon.width && dungeon.cell(x + 1, y).hasFloor;

          let config: DungeonWallConfig;
          const cellWall = cell.wallName;
          if (cellWall && this._config[cellWall]) {
            config = this._config[cellWall] || this._wall_default;
          } else {
            config = this._wall_default;
          }
          this.add(x, y, config.default);
          if (!hasTop) this.add(x, y, config.top);
          if (!hasBottom) this.add(x, y, config.bottom);
          if (!hasLeft) this.add(x, y, config.left);
          if (!hasRight) this.add(x, y, config.right);
        }
      }
    }

    this._shadowCaster.optimize();
    this.update();
  }

  addLight(position: Point, type: DungeonLightType): void {
    let texture: PIXI.Texture;
    let maxDistance: number;
    switch (type) {
      case DungeonLightType.HERO:
        texture = this._heroLightTexture;
        maxDistance = 350;
        break;
      case DungeonLightType.RED_BASIN:
        texture = this._fountainRedTexture;
        maxDistance = 150;
        break;
      case DungeonLightType.BLUE_BASIN:
        texture = this._fountainBlueTexture;
        maxDistance = 150;
        break;
      case DungeonLightType.BONFIRE:
        texture = this._bonfireTexture;
        maxDistance = 250;
        break;
    }

    const light = new DungeonLightSource(position, maxDistance, texture);
    this.layer.addChild(light.mask);
    this.layer.addChild(light.sprite);
    this._lights.push(light);
    this.renderLight(light);
  }

  private add(x: number, y: number, segments: DungeonWallSegment[]): void {
    for (const segment of segments) {
      this._shadowCaster.addSegment(
        x * TILE_SIZE + segment.x1,
        y * TILE_SIZE + segment.y1,
        x * TILE_SIZE + segment.x2,
        y * TILE_SIZE + segment.y2,
        segment.type
      );
    }
  }

  private update(): void {
    for (const light of this._lights) {
      if (light.dirty) {
        this.renderLight(light);
        light.rendered();
      }
    }
  }

  private renderLight(light: DungeonLightSource): void {
    const start = new PIXI.Point(light.position.x + 8, light.position.y + 8);
    this._shadowCaster.setLightLocation(start.x, start.y, light.maxDistance);
    const output = this._shadowCaster.sweep();

    light.sprite.position.set(start.x, start.y);
    light.mask.clear()
      .beginFill(0xFFFFFF)
      .drawPolygon(output)
      .endFill();
  }

  private static gradient(color: string, radius: number): PIXI.Texture {
    const diameter = radius << 1;
    const c = document.createElement("canvas");
    c.width = diameter;
    c.height = diameter;
    const ctx = c.getContext("2d");
    if (ctx) {
      const grd = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      grd.addColorStop(0.1, color);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, diameter, diameter);
    }
    return PIXI.Texture.from(c);
  }

  private readonly _wall_top: DungeonWallConfig = {
    default: [
      {x1: 0, y1: 12, x2: 16, y2: 12, type: SegmentType.NORMAL},
      {x1: 0, y1: 12, x2: 0, y2: 16, type: SegmentType.NORMAL},
      {x1: 16, y1: 12, x2: 16, y2: 16, type: SegmentType.NORMAL},
    ],
    top: [
      {x1: 0, y1: 0, x2: 16, y2: 0, type: SegmentType.TOP},
    ],
    left: [
      {x1: 0, y1: 0, x2: 0, y2: 12, type: SegmentType.NORMAL},
    ],
    right: [
      {x1: 16, y1: 0, x2: 16, y2: 12, type: SegmentType.NORMAL},
    ],
    bottom: []
  };
  private readonly _wall_side_left: DungeonWallConfig = {
    default: [
      {x1: 11, y1: 0, x2: 11, y2: 16, type: SegmentType.NORMAL},
      {x1: 11, y1: 0, x2: 16, y2: 0, type: SegmentType.NORMAL},
      {x1: 11, y1: 16, x2: 16, y2: 16, type: SegmentType.TOP},
    ],
    top: [
      {x1: 0, y1: 0, x2: 11, y2: 0, type: SegmentType.TOP},
    ],
    left: [
      {x1: 0, y1: 0, x2: 0, y2: 16, type: SegmentType.NORMAL},
    ],
    right: [],
    bottom: [
      {x1: 0, y1: 16, x2: 11, y2: 16, type: SegmentType.NORMAL},
    ],
  };
  private readonly _wall_side_right: DungeonWallConfig = {
    default: [
      {x1: 5, y1: 0, x2: 5, y2: 16, type: SegmentType.NORMAL},
      {x1: 0, y1: 0, x2: 5, y2: 0, type: SegmentType.NORMAL},
      {x1: 0, y1: 16, x2: 5, y2: 16, type: SegmentType.TOP},
    ],
    top: [
      {x1: 5, y1: 0, x2: 16, y2: 0, type: SegmentType.TOP},
    ],
    left: [],
    right: [
      {x1: 16, y1: 0, x2: 16, y2: 16, type: SegmentType.NORMAL},
    ],
    bottom: [
      {x1: 5, y1: 16, x2: 16, y2: 16, type: SegmentType.NORMAL},
    ],
  };
  private readonly _wall_corner_left: DungeonWallConfig = {
    default: [
      {x1: 5, y1: 0, x2: 5, y2: 12, type: SegmentType.NORMAL},
      {x1: 5, y1: 12, x2: 16, y2: 12, type: SegmentType.NORMAL},
      {x1: 16, y1: 12, x2: 16, y2: 16, type: SegmentType.NORMAL}
    ],
    top: [
      {x1: 5, y1: 0, x2: 16, y2: 0, type: SegmentType.TOP},
    ],
    left: [],
    right: [
      {x1: 16, y1: 0, x2: 16, y2: 12, type: SegmentType.NORMAL},
    ],
    bottom: [],
  };
  private readonly _wall_corner_right: DungeonWallConfig = {
    default: [
      {x1: 11, y1: 0, x2: 11, y2: 12, type: SegmentType.NORMAL},
      {x1: 0, y1: 12, x2: 11, y2: 12, type: SegmentType.NORMAL},
      {x1: 0, y1: 12, x2: 0, y2: 16, type: SegmentType.NORMAL}
    ],
    top: [
      {x1: 0, y1: 0, x2: 11, y2: 0, type: SegmentType.TOP},
    ],
    left: [
      {x1: 0, y1: 0, x2: 0, y2: 12, type: SegmentType.NORMAL},
    ],
    right: [],
    bottom: [],
  };
  private readonly _wall_default: DungeonWallConfig = {
    default: [],
    top: [
      {x1: 0, y1: 0, x2: 16, y2: 0, type: SegmentType.TOP},
    ],
    left: [
      {x1: 0, y1: 0, x2: 0, y2: 16, type: SegmentType.NORMAL},
    ],
    right: [
      {x1: 16, y1: 0, x2: 16, y2: 16, type: SegmentType.NORMAL},
    ],
    bottom: [
      {x1: 0, y1: 16, x2: 16, y2: 16, type: SegmentType.NORMAL},
    ],
  };

  private readonly _config: Partial<Record<string, DungeonWallConfig>> = {
    "wall_top_mid.png": this._wall_top,
    "wall_side_front_left.png": this._wall_side_left,
    "wall_side_front_right.png": this._wall_side_right,
    "wall_side_mid_left.png": this._wall_side_left,
    "wall_side_mid_right.png": this._wall_side_right,
    "wall_side_top_left.png": {
      default: [
        {x1: 11, y1: 12, x2: 16, y2: 12, type: SegmentType.NORMAL},
        {x1: 11, y1: 12, x2: 11, y2: 16, type: SegmentType.NORMAL},
      ],
      top: [
        {x1: 0, y1: 0, x2: 16, y2: 0, type: SegmentType.TOP},
      ],
      left: [
        {x1: 0, y1: 0, x2: 0, y2: 16, type: SegmentType.NORMAL},
      ],
      right: [
        {x1: 16, y1: 0, x2: 16, y2: 12, type: SegmentType.NORMAL},
      ],
      bottom: [
        {x1: 0, y1: 16, x2: 11, y2: 16, type: SegmentType.NORMAL},
      ],
    },
    "wall_side_top_right.png": {
      default: [
        {x1: 0, y1: 12, x2: 5, y2: 12, type: SegmentType.NORMAL},
        {x1: 5, y1: 12, x2: 5, y2: 16, type: SegmentType.NORMAL},
      ],
      top: [
        {x1: 0, y1: 0, x2: 16, y2: 0, type: SegmentType.TOP},
      ],
      left: [
        {x1: 0, y1: 12, x2: 0, y2: 16, type: SegmentType.NORMAL},
      ],
      right: [
        {x1: 16, y1: 0, x2: 16, y2: 16, type: SegmentType.NORMAL},
      ],
      bottom: [
        {x1: 5, y1: 16, x2: 16, y2: 16, type: SegmentType.NORMAL},
      ],
    },
    "wall_inner_corner_t_top_left.png": this._wall_top,
    "wall_inner_corner_t_top_right.png": this._wall_top,
    "wall_inner_corner_l_top_left.png": this._wall_corner_left,
    "wall_inner_corner_l_top_right.png": this._wall_corner_right,
    "wall_corner_bottom_left.png": this._wall_corner_left,
    "wall_corner_bottom_right.png": this._wall_corner_right,
    "wall_corner_top_left.png": this._wall_top,
    "wall_corner_top_right.png": this._wall_top,
    "wall_fountain_top.png": {
      default: [
        {x1: 0, y1: 12, x2: 0, y2: 16, type: SegmentType.NORMAL},
        {x1: 0, y1: 12, x2: 2, y2: 12, type: SegmentType.NORMAL},
        {x1: 2, y1: 9, x2: 2, y2: 12, type: SegmentType.NORMAL},
        {x1: 2, y1: 9, x2: 14, y2: 9, type: SegmentType.NORMAL},
        {x1: 14, y1: 9, x2: 14, y2: 12, type: SegmentType.NORMAL},
        {x1: 14, y1: 12, x2: 16, y2: 12, type: SegmentType.NORMAL},
        {x1: 16, y1: 12, x2: 16, y2: 16, type: SegmentType.NORMAL},
      ],
      top: [
        {x1: 0, y1: 0, x2: 16, y2: 0, type: SegmentType.TOP},
      ],
      left: [
        {x1: 0, y1: 0, x2: 0, y2: 12, type: SegmentType.NORMAL},
      ],
      right: [
        {x1: 16, y1: 0, x2: 16, y2: 12, type: SegmentType.NORMAL},
      ],
      bottom: []
    },
    "wall_one_top.png": this._wall_top,
    "wall_one_corner_left.png": this._wall_corner_left,
    "wall_one_corner_right.png": this._wall_corner_right,
  };
}

export interface DungeonWallConfig {
  default: DungeonWallSegment[];
  top: DungeonWallSegment[];
  bottom: DungeonWallSegment[];
  left: DungeonWallSegment[];
  right: DungeonWallSegment[];
}

export interface DungeonWallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: SegmentType;
}

export enum DungeonLightType {
  HERO = 0,
  RED_BASIN = 1,
  BLUE_BASIN = 2,
  BONFIRE = 3,
}

export class DungeonLightSource {
  readonly position: Point;
  readonly maxDistance: number;
  readonly sprite: PIXI.Sprite;
  readonly mask: PIXI.Graphics;

  private _rendered: Point | null = null;

  constructor(position: Point, maxDistance: number, texture: PIXI.Texture) {
    this.position = position;
    this.maxDistance = maxDistance;

    this.mask = new PIXI.Graphics();
    this.mask.isMask = true;

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.mask = this.mask;
    this.sprite.blendMode = PIXI.BLEND_MODES.ADD;
  }

  get dirty(): boolean {
    return this._rendered === null || this.position.x !== this._rendered.x || this.position.y !== this._rendered.y;
  }

  rendered(): void {
    this._rendered = {x: this.position.x, y: this.position.y};
  }

  destroy(): void {
    this.sprite.destroy();
    this.mask.destroy();
  }
}