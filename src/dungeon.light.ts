import {DungeonMap} from "./dungeon.map";
import {SegmentType, ShadowCaster} from "./shadow.caster";
import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;

export interface LightPoint {
  readonly x: number;
  readonly y: number;
}

export class DungeonLight {
  readonly layer: PIXI.display.Layer;
  readonly container: PIXI.Container;
  private readonly dungeon: DungeonMap;

  private readonly heroLightTexture: PIXI.Texture;
  private readonly fountainRedTexture: PIXI.Texture;
  private readonly fountainBlueTexture: PIXI.Texture;
  private readonly bonfireTexture: PIXI.Texture;
  private readonly shadowCaster: ShadowCaster;

  private readonly lights: LightSource[] = [];

  constructor(dungeon: DungeonMap) {
    this.dungeon = dungeon;
    this.layer = new PIXI.display.Layer();
    this.layer.useRenderTexture = true;
    this.layer.on('display', (element: any) => {
      element.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    });
    this.layer.clearColor = [0, 0, 0, 1];

    this.container = new PIXI.Container();
    this.layer.addChild(this.container);

    this.heroLightTexture = DungeonLight.gradient("white", 150);
    this.fountainRedTexture = DungeonLight.gradient("rgb(211,78,56)", 50);
    this.fountainBlueTexture = DungeonLight.gradient("rgb(86,152,204)", 50);
    this.bonfireTexture = DungeonLight.gradient("rgb(255,239,204)", 100);

    this.shadowCaster = new ShadowCaster();

    this.dungeon.ticker.add(this.update, this);
  }

  destroy(): void {
    this.dungeon.ticker.remove(this.update, this);
    this.lights.forEach(l => l.destroy());
    this.heroLightTexture.destroy();
    this.fountainBlueTexture.destroy();
    this.fountainRedTexture.destroy();
    this.bonfireTexture.destroy();
    this.container.destroy();
    this.layer.destroy();
  }

  loadMap() {
    this.shadowCaster.init();
    const dungeon = this.dungeon;

    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor) {
          switch (cell.floorName) {
            case 'wall_fountain_basin_red':
              this.addLight(new PIXI.Point(x * TILE_SIZE, y * TILE_SIZE), LightType.RED_BASIN);
              break;
            case 'wall_fountain_basin_blue':
              this.addLight(new PIXI.Point(x * TILE_SIZE, y * TILE_SIZE), LightType.BLUE_BASIN);
              break;
            default:
              break;
          }

          // find wall segments
          const has_top = y > 0 && dungeon.cell(x, y - 1).hasFloor;
          const has_bottom = y + 1 < dungeon.height && dungeon.cell(x, y + 1).hasFloor;
          const has_left = x > 0 && dungeon.cell(x - 1, y).hasFloor;
          const has_right = x + 1 < dungeon.width && dungeon.cell(x + 1, y).hasFloor;

          let config: WallConfig;
          const cellWall = cell.wallName;
          if (cellWall && this.config[cellWall]) {
            config = this.config[cellWall] || this.wall_default;
          } else {
            config = this.wall_default;
          }
          this.add(x, y, config.default);
          if (!has_top) this.add(x, y, config.top);
          if (!has_bottom) this.add(x, y, config.bottom);
          if (!has_left) this.add(x, y, config.left);
          if (!has_right) this.add(x, y, config.right);
        }
      }
    }

    this.shadowCaster.optimize();
  }

  addLight(position: LightPoint, type: LightType): void {
    switch (type) {
      case LightType.HERO:
        this.lights.push(new LightSource(
          position,
          350,
          this.heroLightTexture,
          this.container
        ));
        break;
      case LightType.RED_BASIN:
        this.lights.push(new LightSource(
          position,
          150,
          this.fountainRedTexture,
          this.container
        ));
        break;
      case LightType.BLUE_BASIN:
        this.lights.push(new LightSource(
          position,
          150,
          this.fountainBlueTexture,
          this.container
        ));
        break;
      case LightType.BONFIRE:
        this.lights.push(new LightSource(
          position,
          250,
          this.bonfireTexture,
          this.container
        ));
        break;
    }
  }

  private add(x: number, y: number, segments: WallSegment[]): void {
    for (let segment of segments) {
      this.shadowCaster.addSegment(
        x * TILE_SIZE + segment.x1,
        y * TILE_SIZE + segment.y1,
        x * TILE_SIZE + segment.x2,
        y * TILE_SIZE + segment.y2,
        segment.type
      );
    }
  }

  private update(): void {
    this.lights.forEach((light) => {
      const start = new PIXI.Point(light.position.x + 8, light.position.y + 8);
      this.shadowCaster.setLightLocation(start.x, start.y, light.maxDistance);
      const output = this.shadowCaster.sweep();
      light.sprite.position.set(start.x, start.y);
      light.mask.clear()
        .beginFill(0xFFFFFF, 1)
        .drawPolygon(output)
        .endFill()
    });
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

  private readonly wall_top: WallConfig = {
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
  private readonly wall_side_left: WallConfig = {
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
  private readonly wall_side_right: WallConfig = {
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
  private readonly wall_corner_left: WallConfig = {
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
  private readonly wall_corner_right: WallConfig = {
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
  private readonly wall_default: WallConfig = {
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

  private config: Partial<Record<string, WallConfig>> = {
    "wall_top_mid.png": this.wall_top,
    "wall_side_front_left.png": this.wall_side_left,
    "wall_side_front_right.png": this.wall_side_right,
    "wall_side_mid_left.png": this.wall_side_left,
    "wall_side_mid_right.png": this.wall_side_right,
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
    "wall_inner_corner_t_top_left.png": this.wall_top,
    "wall_inner_corner_t_top_right.png": this.wall_top,
    "wall_inner_corner_l_top_left.png": this.wall_corner_left,
    "wall_inner_corner_l_top_right.png": this.wall_corner_right,
    "wall_corner_bottom_left.png": this.wall_corner_left,
    "wall_corner_bottom_right.png": this.wall_corner_right,
    "wall_corner_top_left.png": this.wall_top,
    "wall_corner_top_right.png": this.wall_top,
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
    "wall_one_top.png": this.wall_top,
    "wall_one_corner_left.png": this.wall_corner_left,
    "wall_one_corner_right.png": this.wall_corner_right,
  };
}

interface WallConfig {
  default: WallSegment[]
  top: WallSegment[]
  bottom: WallSegment[]
  left: WallSegment[]
  right: WallSegment[]
}

interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: SegmentType;
}

export enum LightType {
  HERO = 0,
  RED_BASIN = 1,
  BLUE_BASIN = 2,
  BONFIRE = 3,
}

class LightSource {
  readonly position: LightPoint;
  readonly maxDistance: number;
  readonly sprite: PIXI.Sprite;
  readonly mask: PIXI.Graphics;

  constructor(position: LightPoint, maxDistance: number, texture: PIXI.Texture, container: PIXI.Container) {
    this.position = position;
    this.maxDistance = maxDistance;

    this.mask = new PIXI.Graphics();
    this.mask.isMask = true;

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.mask = this.mask;
    this.sprite.blendMode = PIXI.BLEND_MODES.ADD;

    container.addChild(this.mask);
    container.addChild(this.sprite);
  }

  destroy() {
    this.sprite.destroy();
    this.mask.destroy();
  }
}