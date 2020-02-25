import {View} from "./view";
import {DungeonLevel} from "./dungeon.level";
// @ts-ignore
import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;
const WALL_SIZE_X = 5;
const WALL_SIZE_Y = 4;

export class DungeonLightView implements View {
  readonly layer: PIXI.display.Layer;
  readonly container: PIXI.Container;
  private readonly level: DungeonLevel;

  private readonly heroLightTexture: PIXI.Texture;
  private readonly fountainRedTexture: PIXI.Texture;
  private readonly fountainBlueTexture: PIXI.Texture;
  private readonly visibility: Visibility;

  private readonly lights: LightSource[] = [];

  constructor(level: DungeonLevel) {
    this.level = level;
    this.layer = new PIXI.display.Layer();
    this.layer.useRenderTexture = true;
    this.layer.on('display', (element: any) => {
      element.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    });
    this.layer.clearColor = [0, 0, 0, 1];

    this.container = new PIXI.Container();
    this.layer.addChild(this.container);

    this.heroLightTexture = DungeonLightView.gradient("white", 150);
    this.fountainRedTexture = DungeonLightView.gradient("rgb(211,78,56)", 50);
    this.fountainBlueTexture = DungeonLightView.gradient("rgb(86,152,204)", 50);

    this.visibility = new Visibility();
  }

  destroy(): void {
    this.lights.forEach(l => l.destroy());
    this.heroLightTexture.destroy();
    this.fountainBlueTexture.destroy();
    this.fountainRedTexture.destroy();
    this.container.destroy();
    this.layer.destroy();
  }

  loadMap() {
    const windowsH: Edge[] = []; // same Y
    const windowsV: Edge[] = []; // same X

    // clear
    this.lights.forEach(l => l.destroy());
    this.lights.splice(0, this.lights.length);
    this.visibility.init();

    // fill wall segments
    this.level.corridorsH.forEach((rect) => {
      const x = rect.x * TILE_SIZE - WALL_SIZE_X;
      const y = rect.y * TILE_SIZE;
      const w = rect.w * TILE_SIZE + (WALL_SIZE_X << 1);
      const h = rect.h * TILE_SIZE - WALL_SIZE_Y;

      const t_l = new PIXI.Point(x, y);
      const t_r = new PIXI.Point(x + w, y);
      const b_l = new PIXI.Point(x, y + h);
      const b_r = new PIXI.Point(x + w, y + h);

      this.visibility.addSegment(x, y, x + w, y, SegmentType.CORRIDOR_H_TOP);
      this.visibility.addSegment(x, y + h, x + w, y + h, SegmentType.NORMAL);

      windowsV.push(
        new Edge(t_r, b_r, SegmentType.NORMAL),
        new Edge(t_l, b_l, SegmentType.NORMAL),
      );
    });
    this.level.corridorsV.forEach((rect) => {
      const x = rect.x * TILE_SIZE;
      const y = rect.y * TILE_SIZE - WALL_SIZE_Y;
      const w = rect.w * TILE_SIZE;
      const h = rect.h * TILE_SIZE + WALL_SIZE_Y;

      const t_l = new PIXI.Point(x, y);
      const t_r = new PIXI.Point(x + w, y);
      const b_l = new PIXI.Point(x, y + h);
      const b_r = new PIXI.Point(x + w, y + h);

      this.visibility.addSegment(x, y, x, y + h, SegmentType.NORMAL);
      this.visibility.addSegment(x + w, y, x + w, y + h, SegmentType.NORMAL);

      windowsH.push(
        new Edge(t_l, t_r, SegmentType.NORMAL),
        new Edge(b_l, b_r, SegmentType.NORMAL),
      );
    });
    this.level.rooms.forEach((rect) => {
      const x = rect.x * TILE_SIZE + WALL_SIZE_X;
      const y = rect.y * TILE_SIZE;
      const w = rect.w * TILE_SIZE - (WALL_SIZE_X << 1);
      const h = rect.h * TILE_SIZE - WALL_SIZE_Y;

      const t_l = new PIXI.Point(x, y);
      const t_r = new PIXI.Point(x + w, y);
      const b_l = new PIXI.Point(x, y + h);
      const b_r = new PIXI.Point(x + w, y + h);

      const walls = [
        new Edge(t_l, t_r, SegmentType.ROOM_TOP),
        new Edge(t_l, b_l, SegmentType.NORMAL),
        new Edge(b_l, b_r, SegmentType.NORMAL),
        new Edge(t_r, b_r, SegmentType.NORMAL),
      ];

      walls.forEach(wall => {
        if (wall.start.x === wall.end.x) {
          const window = windowsV
            .find(v => v.start.x === wall.start.x &&
              v.start.y > wall.start.y &&
              v.end.y < wall.end.y);
          if (window) {
            const x = wall.start.x;
            this.visibility.addSegment(x, wall.start.y, x, window.start.y, wall.type);
            this.visibility.addSegment(x, window.end.y, x, wall.end.y, wall.type);
          } else {
            this.visibility.addSegment(wall.start.x, wall.start.y, wall.end.x, wall.end.y, wall.type);
          }
        } else {
          const window = windowsH
            .find(v => v.start.y === wall.start.y &&
              v.start.x > wall.start.x &&
              v.end.x < wall.end.x);
          if (window) {
            const y = wall.start.y;
            this.visibility.addSegment(wall.start.x, y, window.start.x, y, wall.type);
            this.visibility.addSegment(window.end.x, y, wall.end.x, y, wall.type);
          } else {
            this.visibility.addSegment(wall.start.x, wall.start.y, wall.end.x, wall.end.y, wall.type);
          }
        }
      });
    });

    // fill hero light source
    this.lights.push(new LightSource(
      this.level.hero.container.position,
      this.heroLightTexture,
      this.container
    ));

    // fill static light sources
    for (let y = 0; y < this.level.width; y++) {
      for (let x = 0; x < this.level.height; x++) {
        const view = this.level.floorMap[y][x];
        if (view) {
          switch (view.name) {
            case 'wall_fountain_basin_red':
              this.lights.push(new LightSource(
                new PIXI.Point(x * TILE_SIZE, y * TILE_SIZE),
                this.fountainRedTexture,
                this.container
              ));
              break;
            case 'wall_fountain_basin_blue':
              this.lights.push(new LightSource(
                new PIXI.Point(x * TILE_SIZE, y * TILE_SIZE),
                this.fountainBlueTexture,
                this.container
              ));
              break;
            default:
              break;
          }
        }
      }
    }
  }

  update(delta: number): void {
    this.lights.forEach((light) => {
      const start = new PIXI.Point(light.position.x + 8, light.position.y + 8);
      this.visibility.setLightLocation(start.x, start.y);
      this.visibility.sweep();
      light.sprite.position.set(start.x, start.y);
      light.mask.clear()
        .beginFill(0xFFFFFF, 1)
        .drawPolygon(this.visibility.output)
        .endFill();
    });
  }

  private static gradient(color: string, radius: number): PIXI.Texture {
    const diameter = radius << 1;

    const c = document.createElement("canvas");
    c.width = diameter;
    c.height = diameter;
    const ctx = c.getContext("2d");
    const grd = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    grd.addColorStop(0.1, color);
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, diameter, diameter);

    return PIXI.Texture.from(c);
  }
}

class LightSource {
  readonly position: PIXI.IPoint;
  readonly sprite: PIXI.Sprite;
  readonly mask: PIXI.Graphics;

  constructor(position: PIXI.IPoint, texture: PIXI.Texture, container: PIXI.Container) {
    this.position = position;

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

class Edge {
  readonly start: PIXI.Point;
  readonly end: PIXI.Point;
  readonly type: SegmentType;

  constructor(start: PIXI.Point, end: PIXI.Point, type: SegmentType) {
    this.start = start;
    this.end = end;
    this.type = type;
  }
}

class EndPoint {
  point: PIXI.Point;
  begin: boolean = false;
  segment: Segment;
  angle: number = 0.0;

  constructor(x: number, y: number) {
    this.point = new PIXI.Point(x, y);
  }
}

enum SegmentType {
  NORMAL = 0,
  ROOM_TOP = 1,
  CORRIDOR_H_TOP = 2,
}

class Segment {
  p1: EndPoint;
  p2: EndPoint;
  d: number;
  type: SegmentType;
}

class Visibility {
  segments: Segment[] = [];
  endpoints: EndPoint[] = [];
  center: PIXI.Point;

  open: Segment[] = [];

  // The output is a series of points that forms a visible area polygon
  output: PIXI.Point[] = [];

  constructor() {
  }

  init() {
    this.segments = [];
    this.endpoints = [];
    this.open = [];
    this.center = new PIXI.Point(0.0, 0.0);
    this.output = [];
  }

  // Add a segment, where the first point shows up in the
  // visualization but the second one does not. (Every endpoint is
  // part of two segments, but we want to only show them once.)
  addSegment(x1: number, y1: number, x2: number, y2: number, type: SegmentType) {
    let p1: EndPoint = new EndPoint(0, 0);
    let p2: EndPoint = new EndPoint(0, 0);

    const segment = new Segment();
    p1.point.x = x1;
    p1.point.y = y1;
    p2.point.x = x2;
    p2.point.y = y2;
    p1.segment = segment;
    p2.segment = segment;

    segment.p1 = p1;
    segment.p2 = p2;
    segment.d = 0.0;
    segment.type = type;

    this.segments.push(segment);
    this.endpoints.push(p1);
    this.endpoints.push(p2);
  }

  setLightLocation(x: number, y: number) {
    this.center.x = x;
    this.center.y = y;

    this.segments.forEach((segment) => {

      let dx = 0.5 * (segment.p1.point.x + segment.p2.point.x) - x;
      let dy = 0.5 * (segment.p1.point.y + segment.p2.point.y) - y;
      // NOTE: we only use this for comparison so we can use
      // distance squared instead of distance. However in
      // practice the sqrt is plenty fast and this doesn't
      // really help in this situation.
      segment.d = dx * dx + dy * dy;

      // NOTE: future optimization: we could record the quadrant
      // and the y/x or x/y ratio, and sort by (quadrant,
      // ratio), instead of calling atan2. See
      // <https://github.com/mikolalysenko/compare-slope> for a
      // library that does this. Alternatively, calculate the
      // angles and use bucket sort to get an O(N) sort.
      segment.p1.angle = Math.atan2(segment.p1.point.y - y, segment.p1.point.x - x);
      segment.p2.angle = Math.atan2(segment.p2.point.y - y, segment.p2.point.x - x);

      let dAngle = segment.p2.angle - segment.p1.angle;
      if (dAngle <= -Math.PI) {
        dAngle += 2 * Math.PI;
      }
      if (dAngle > Math.PI) {
        dAngle -= 2 * Math.PI;
      }
      segment.p1.begin = (dAngle > 0.0);
      segment.p2.begin = !segment.p1.begin;
    });
  }

  private static compare(a: EndPoint, b: EndPoint): number {
    // Traverse in angle order
    if (a.angle > b.angle) return 1;
    if (a.angle < b.angle) return -1;
    // But for ties (common), we want Begin nodes before End nodes
    if (!a.begin && b.begin) return 1;
    if (a.begin && !b.begin) return -1;
    return 0;
  }

  // Helper: leftOf(segment, point) returns true if point is "left"
  // of segment treated as a vector. Note that this assumes a 2D
  // coordinate system in which the Y axis grows downwards, which
  // matches common 2D graphics libraries, but is the opposite of
  // the usual convention from mathematics and in 3D graphics
  // libraries.
  private static leftOf(s: Segment, p: PIXI.Point): boolean {
    // This is based on a 3d cross product, but we don't need to
    // use z coordinate inputs (they're 0), and we only need the
    // sign. If you're annoyed that cross product is only defined
    // in 3d, see "outer product" in Geometric Algebra.
    // <http://en.wikipedia.org/wiki/Geometric_algebra>
    const cross = (s.p2.point.x - s.p1.point.x) * (p.y - s.p1.point.y)
      - (s.p2.point.y - s.p1.point.y) * (p.x - s.p1.point.x);
    return cross < 0;
    // Also note that this is the naive version of the test and
    // isn't numerically robust. See
    // <https://github.com/mikolalysenko/robust-arithmetic> for a
    // demo of how this fails when a point is very close to the
    // line.
  }

  // Return p*(1-f) + q*f
  private static interpolate(p: PIXI.Point, q: PIXI.Point, f: number): PIXI.Point {
    return new PIXI.Point(p.x * (1 - f) + q.x * f, p.y * (1 - f) + q.y * f);
  }

  // Helper: do we know that segment a is in front of b?
  // Implementation not anti-symmetric (that is to say,
  // _segment_in_front_of(a, b) != (!_segment_in_front_of(b, a)).
  // Also note that it only has to work in a restricted set of cases
  // in the visibility algorithm; I don't think it handles all
  // cases. See http://www.redblobgames.com/articles/visibility/segment-sorting.html
  private static segmentInFrontOf(a: Segment, b: Segment, relativeTo: PIXI.Point): boolean {
    // NOTE: we slightly shorten the segments so that
    // intersections of the endpoints (common) don't count as
    // intersections in this algorithm
    const A1 = Visibility.leftOf(a, Visibility.interpolate(b.p1.point, b.p2.point, 0.01));
    const A2 = Visibility.leftOf(a, Visibility.interpolate(b.p2.point, b.p1.point, 0.01));
    const A3 = Visibility.leftOf(a, relativeTo);
    const B1 = Visibility.leftOf(b, Visibility.interpolate(a.p1.point, a.p2.point, 0.01));
    const B2 = Visibility.leftOf(b, Visibility.interpolate(a.p2.point, a.p1.point, 0.01));
    const B3 = Visibility.leftOf(b, relativeTo);

    // NOTE: this algorithm is probably worthy of a short article
    // but for now, draw it on paper to see how it works. Consider
    // the line A1-A2. If both B1 and B2 are on one side and
    // relativeTo is on the other side, then A is in between the
    // viewer and B. We can do the same with B1-B2: if A1 and A2
    // are on one side, and relativeTo is on the other side, then
    // B is in between the viewer and A.
    if (B1 == B2 && B2 != B3) return true;
    if (A1 == A2 && A2 == A3) return true;
    if (A1 == A2 && A2 != A3) return false;
    if (B1 == B2 && B2 == B3) return false;

    // If A1 != A2 and B1 != B2 then we have an intersection.
    // Expose it for the GUI to show a message. A more robust
    // implementation would split segments at intersections so
    // that part of the segment is in front and part is behind.
    // this.demo_intersectionsDetected.push([a.p1, a.p2, b.p1, b.p2]);
    return false;

    // NOTE: previous implementation was a.d < b.d. That's simpler
    // but trouble when the segments are of dissimilar sizes. If
    // you're on a grid and the segments are similarly sized, then
    // using distance will be a simpler and faster implementation.
  }


  // Run the algorithm, sweeping over all or part of the circle to find
  // the visible area, represented as a set of triangles
  sweep(maxAngle: number = 999.0) {
    this.output = [];  // output set of triangles
    // this.demo_intersectionsDetected = [];
    this.endpoints.sort(Visibility.compare);

    this.open = [];
    let beginAngle = 0.0;

    // At the beginning of the sweep we want to know which
    // segments are active. The simplest way to do this is to make
    // a pass collecting the segments, and make another pass to
    // both collect and process them. However it would be more
    // efficient to go through all the segments, figure out which
    // ones intersect the initial sweep line, and then sort them.
    for (let pass = 0; pass <= 2; pass++) {
      for (let p_i = 0; p_i < this.endpoints.length; p_i++) {
        const p = this.endpoints[p_i];

        if (pass == 1 && p.angle > maxAngle) {
          // Early exit for the visualization to show the sweep process
          break;
        }

        let current_old = this.open.length === 0 ? null : this.open[0];

        if (p.begin) {
          // Insert into the right place in the list
          let i = 0;
          let node = this.open[i];
          while (node != null && Visibility.segmentInFrontOf(p.segment, node, this.center)) {
            i++;
            node = this.open[i];
          }
          if (node == null) {
            this.open.push(p.segment);
          } else {
            // this.open.insertBefore(node, p.segment);
            this.open.splice(i, 0, p.segment)
          }
        } else {
          this.open = this.open.filter(o => o !== p.segment);
        }

        let current_new = this.open.length === 0 ? null : this.open[0];
        if (current_old !== current_new) {
          if (pass == 1) {
            this.addTriangle(beginAngle, p.angle, current_old);
          }
          beginAngle = p.angle;
        }
      }
    }
  }

  private static lineIntersection(p1: PIXI.Point, p2: PIXI.Point, p3: PIXI.Point, p4: PIXI.Point): PIXI.Point {
    // From http://paulbourke.net/geometry/lineline2d/
    const s = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x))
      / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
    return new PIXI.Point(p1.x + s * (p2.x - p1.x), p1.y + s * (p2.y - p1.y));
  }

  private addTriangle(angle1: number, angle2: number, segment: Segment) {
    let p1 = this.center;
    let p2 = new PIXI.Point(this.center.x + Math.cos(angle1), this.center.y + Math.sin(angle1));
    let p3 = new PIXI.Point(0.0, 0.0);
    let p4 = new PIXI.Point(0.0, 0.0);

    if (segment != null) {
      // Stop the triangle at the intersecting segment
      p3.x = segment.p1.point.x;
      p3.y = segment.p1.point.y;
      p4.x = segment.p2.point.x;
      p4.y = segment.p2.point.y;
    } else {
      // Stop the triangle at a fixed distance; this probably is
      // not what we want, but it never gets used in the demo
      p3.x = this.center.x + Math.cos(angle1) * 500;
      p3.y = this.center.y + Math.sin(angle1) * 500;
      p4.x = this.center.x + Math.cos(angle2) * 500;
      p4.y = this.center.y + Math.sin(angle2) * 500;
    }

    let pBegin = Visibility.lineIntersection(p3, p4, p1, p2);
    pBegin.x = Math.round(pBegin.x); // round for pixel perfect
    pBegin.y = Math.round(pBegin.y); // round for pixel perfect

    p2.x = this.center.x + Math.cos(angle2);
    p2.y = this.center.y + Math.sin(angle2);
    let pEnd = Visibility.lineIntersection(p3, p4, p1, p2);
    pEnd.x = Math.round(pEnd.x); // round for pixel perfect
    pEnd.y = Math.round(pEnd.y); // round for pixel perfect

    if (segment != null) {
      // extend segment to light walls
      switch (segment.type) {
        case SegmentType.ROOM_TOP:
          this.output.push(pBegin);
          this.output.push(new PIXI.Point(pBegin.x, pBegin.y - TILE_SIZE));
          this.output.push(new PIXI.Point(pEnd.x, pEnd.y - TILE_SIZE));
          this.output.push(pEnd);
          break;
        case SegmentType.CORRIDOR_H_TOP:
          this.output.push(pBegin);
          this.output.push(new PIXI.Point(pBegin.x, pBegin.y - TILE_SIZE));
          this.output.push(new PIXI.Point(pEnd.x, pEnd.y - TILE_SIZE));
          this.output.push(pEnd);
          break;
        case SegmentType.NORMAL:
        default:
          this.output.push(pBegin);
          this.output.push(pEnd);
          break;
      }
    } else {
      this.output.push(pBegin);
      this.output.push(pEnd);
    }
  }
}