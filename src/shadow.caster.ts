import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;

export class EndPoint {
  readonly point: PIXI.Point;
  readonly segment: Segment;
  begin: boolean = false;
  angle: number = 0.0;

  constructor(point: PIXI.Point, segment: Segment) {
    this.point = point;
    this.segment = segment;
  }
}

export enum SegmentType {
  NORMAL = 0,
  TOP = 1,
}

export class Segment {
  readonly p1: EndPoint;
  readonly p2: EndPoint;
  readonly type: SegmentType;
  distance: number = 0;

  constructor(p1: PIXI.Point, p2: PIXI.Point, type: SegmentType) {
    this.p1 = new EndPoint(p1, this);
    this.p2 = new EndPoint(p2, this);
    this.type = type;
  }

  toString(): string {
    const p1 = this.p1.point;
    const p2 = this.p2.point;
    return `[${p1.x}:${p1.y} - ${p2.x}:${p2.y}]`;
  }
}

export class ShadowCaster {
  private _segments: Segment[] = [];
  private _endpoints: EndPoint[] = [];

  private _light: PIXI.Point = new PIXI.Point(0, 0);
  private _maxDistance: number = 500;

  init() {
    this._segments = [];
    this._endpoints = [];
    this._light = new PIXI.Point(0.0, 0.0);
  }

  // Add a segment, where the first point shows up in the
  // visualization but the second one does not. (Every endpoint is
  // part of two segments, but we want to only show them once.)
  addSegment(x1: number, y1: number, x2: number, y2: number, type: SegmentType): void {
    const p1 = new PIXI.Point(x1, y1);
    const p2 = new PIXI.Point(x2, y2);
    const segment = new Segment(p1, p2, type);
    this._segments.push(segment);
    this._endpoints.push(segment.p1);
    this._endpoints.push(segment.p2);
  }

  private static deduplicated(queue: Segment[]): Segment[] {
    const deduplicated: Segment[] = [];
    while (queue.length > 0) {
      const segment = queue.pop()!;
      const duplicates: number[] = [];
      for (let i = 0; i < queue.length; i++) {
        let next = queue[i];
        let sameType = segment.type === next.type;
        let equal = segment.p1.point.equals(next.p1.point) && segment.p2.point.equals(next.p2.point);
        if (sameType && equal) {
          duplicates.push(i);
        }
      }
      for (let i of duplicates) {
        queue.splice(i, 1);
      }
      deduplicated.push(segment);
    }
    return deduplicated;
  }

  private static connected(segments: Segment[]): Segment[] {
    const connected: Segment[] = [];
    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i];
      let has_p1 = false;
      let has_p2 = false;

      for (let j = 0; j < segments.length; j++) {
        // skip current segment
        if (j == i) continue;
        let test = segments[j];
        // skip duplicate
        if (segment.p1.point.equals(test.p1.point) && segment.p2.point.equals(test.p2.point)) continue;

        if (!has_p1 && (segment.p1.point.equals(test.p1.point) || segment.p1.point.equals(test.p2.point))) {
          has_p1 = true;
        }
        if (!has_p2 && (segment.p2.point.equals(test.p1.point) || segment.p2.point.equals(test.p2.point))) {
          has_p2 = true;
        }
        if (has_p1 && has_p2) {
          connected.push(segment);
          break;
        }
      }
    }
    return connected;
  }

  private static filtered(segments: Segment[]): Segment[] {
    const filtered: Segment[] = [];
    const queue: Segment[] = [];

    const parts: [number, number, number, number][] = [
      [0, 12, 0, 16],   // vertical    // both
      [5, 12, 5, 16],   // vertical    // left
      [0, 12, 5, 12],   // horizontal  // left
      [0, 0, 5, 0],     // horizontal  // both

      [11, 12, 11, 16], // vertical    // right
      [11, 12, 16, 12], // horizontal  // right
      [11, 0, 16, 0],   // horizontal  // right
    ];

    const isPart = (segment: Segment): boolean => {
      const s_x1 = segment.p1.point.x % 16;
      const s_y1 = segment.p1.point.y % 16;
      const s_x2 = segment.p2.point.x - segment.p1.point.x + s_x1;
      const s_y2 = segment.p2.point.y - segment.p1.point.y + s_y1;
      for (let [x1, y1, x2, y2] of parts) {
        if (x1 === s_x1 && y1 === s_y1 && x2 === s_x2 && y2 === s_y2) {
          return true;
        }
      }
      return false;
    }

    for (const segment of segments) {
      if (isPart(segment)) {
        queue.push(segment);
      } else {
        filtered.push(segment);
      }
    }

    // find small rects and remove outer segments

    while (queue.length > 0) {
      const segment = queue.pop()!;

      const rect = [segment];
      const points = [segment.p1.point, segment.p2.point];
      const counts = [1, 1];

      const joins: number[] = [];

      for (let t = 0; t < 2; t++) {
        for (let i = 0; i < queue.length; i++) {
          if (joins.indexOf(i) >= 0) continue;

          let next = queue[i];
          const p1 = next.p1.point;
          const p2 = next.p2.point;

          let has_p1 = false;
          let has_p2 = false;
          for (let j = 0; j < points.length; j++) {
            let p = points[j];
            if (p.equals(p1)) {
              has_p1 = true;
              counts[j]++;
            } else if (p.equals(p2)) {
              has_p2 = true;
              counts[j]++;
            }
          }

          if (has_p1 || has_p2) {
            joins.push(i);
            rect.push(next);
            if (!has_p1) {
              points.push(p1);
              counts.push(1);
            }
            if (!has_p2) {
              points.push(p2);
              counts.push(1);
            }
          }
        }
      }

      if (counts.length === 4 && counts.every(c => c === 2)) {
        let bottom = 0;
        let bottom_y = 0;
        for (let i = 0; i < 4; i++) {
          let s = rect[i];
          if (s.p1.point.y === s.p2.point.y && s.p1.point.y > bottom_y) { // only horizontal
            bottom = i;
            bottom_y = s.p1.point.y;
          }
        }

        for (let i of joins.reverse()) queue.splice(i, 1);

        rect.splice(bottom, 1);
        filtered.push(...rect);
      } else {
        filtered.push(segment);
      }
    }

    return filtered;
  }

  private static merge(queue: Segment[]): Segment[] {
    const merged: Segment[] = [];
    while (queue.length > 0) {
      const first = queue.pop()!;
      let pair: [Segment, Segment] | null = null;
      for (let i = 0; i < queue.length; i++) {
        let next = queue[i];
        if (first.type === next.type) {
          if (first.p2.point.equals(next.p1.point)) {
            queue.splice(i, 1);
            pair = [first, next];
            break;
          } else if (next.p2.point.equals(first.p1.point)) {
            queue.splice(i, 1);
            pair = [next, first];
            break;
          }
        }
      }
      if (pair) {
        const [a, b] = pair;
        queue.push(new Segment(a.p1.point, b.p2.point, a.type));
      } else {
        merged.push(first);
      }
    }
    return merged;
  }

  optimize(): void {
    console.log(`optimize: segments=${this._segments.length}`)

    const deduplicated = ShadowCaster.deduplicated([...this._segments]);
    console.log(`optimize: deduplicated=${deduplicated.length}`);

    const connected = ShadowCaster.connected(deduplicated);
    console.log(`optimize: connected=${connected.length}`);

    const filtered = ShadowCaster.filtered(connected);
    console.log(`optimize: filtered=${filtered.length}`);

    const connected2 = ShadowCaster.connected(filtered);
    console.log(`optimize: connected = ${connected2.length}`);

    const merged = [
      ...ShadowCaster.merge(connected2.filter(s => s.p1.point.x === s.p2.point.x)),
      ...ShadowCaster.merge(connected2.filter(s => s.p1.point.y === s.p2.point.y)),
    ];
    console.log(`optimize: merged=${merged.length}`);

    this._segments = [];
    this._endpoints = [];

    for (const segment of merged) {
      this._segments.push(segment);
      this._endpoints.push(segment.p1);
      this._endpoints.push(segment.p2);
    }
  }

  setLightLocation(x: number, y: number, maxDistance: number) {
    this._light.x = x;
    this._light.y = y;
    this._maxDistance = maxDistance;

    this._endpoints = [];
    for (const segment of this._segments) {

      let dx = 0.5 * (segment.p1.point.x + segment.p2.point.x) - x;
      let dy = 0.5 * (segment.p1.point.y + segment.p2.point.y) - y;
      // NOTE: we only use this for comparison so we can use
      // distance squared instead of distance. However in
      // practice the sqrt is plenty fast and this doesn't
      // really help in this situation.
      //
      // UPD. use distance to pre-filter by light max distance
      segment.distance = Math.sqrt(dx * dx + dy * dy);

      if (segment.distance < maxDistance) {
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

        this._endpoints.push(segment.p1, segment.p2);
      }
    }

    this._endpoints.sort(ShadowCaster.compare);
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
    const A1 = ShadowCaster.leftOf(a, ShadowCaster.interpolate(b.p1.point, b.p2.point, 0.01));
    const A2 = ShadowCaster.leftOf(a, ShadowCaster.interpolate(b.p2.point, b.p1.point, 0.01));
    const A3 = ShadowCaster.leftOf(a, relativeTo);
    const B1 = ShadowCaster.leftOf(b, ShadowCaster.interpolate(a.p1.point, a.p2.point, 0.01));
    const B2 = ShadowCaster.leftOf(b, ShadowCaster.interpolate(a.p2.point, a.p1.point, 0.01));
    const B3 = ShadowCaster.leftOf(b, relativeTo);

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
  sweep(): PIXI.Point[] {
    // The output is a series of points that forms a visible area polygon
    const output: PIXI.Point[] = [];
    const open: Segment[] = [];
    let beginAngle = 0.0;

    // At the beginning of the sweep we want to know which
    // segments are active. The simplest way to do this is to make
    // a pass collecting the segments, and make another pass to
    // both collect and process them. However it would be more
    // efficient to go through all the segments, figure out which
    // ones intersect the initial sweep line, and then sort them.
    for (let pass = 0; pass <= 2; pass++) {
      for (const p of this._endpoints) {
        let current_old = open.length === 0 ? null : open[0];

        if (p.begin) {
          // Insert into the right place in the list
          let i = 0;
          let node = open[i];
          while (node != null && ShadowCaster.segmentInFrontOf(p.segment, node, this._light)) {
            i++;
            node = open[i];
          }
          if (node == null) {
            open.push(p.segment);
          } else {
            // this.open.insertBefore(node, p.segment);
            open.splice(i, 0, p.segment)
          }
        } else {
          for (let i = 0; i < open.length; i++) {
            if (open[i] === p.segment) open.splice(i, 1);
          }
        }

        let current_new = open.length === 0 ? null : open[0];
        if (current_old !== current_new) {
          if (pass == 1) {
            this.addTriangle(beginAngle, p.angle, current_old, output);
          }
          beginAngle = p.angle;
        }
      }
    }

    // optimize
    const queue = [...output];
    const deduplicated: PIXI.Point[] = [];
    while (queue.length > 0) {
      if (queue.length >= 2) {
        const [a, b,] = queue;
        if (a.equals(b)) {
          queue.shift();
          continue;
        }
      }
      const point = queue.shift()!;
      deduplicated.push(point);
    }
    const optimized: PIXI.Point[] = [];
    while (deduplicated.length > 0) {
      if (deduplicated.length >= 3) {
        const [a, b, c,] = deduplicated;
        if (a.x === b.x && a.x === c.x) {
          deduplicated.splice(1, 1);
          continue;
        }
      }
      const point = deduplicated.shift()!;
      optimized.push(point);
    }
    return optimized;
  }

  private static lineIntersection(p1: PIXI.Point, p2: PIXI.Point, p3: PIXI.Point, p4: PIXI.Point): PIXI.Point | null {
    // From http://paulbourke.net/geometry/lineline2d/
    const numerator = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x));
    const denominator = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
    if (denominator === 0) {
      return null;
    }
    const s = numerator / denominator;
    return new PIXI.Point(p1.x + s * (p2.x - p1.x), p1.y + s * (p2.y - p1.y));
  }

  private addTriangle(angle1: number, angle2: number, segment: Segment | null, output: PIXI.Point[]) {
    const angle1cos = Math.cos(angle1);
    const angle1sin = Math.sin(angle1);
    const angle2cos = Math.cos(angle2);
    const angle2sin = Math.sin(angle2);

    let p1 = this._light;
    let p2 = new PIXI.Point(this._light.x + angle1cos, this._light.y + angle1sin);
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
      p3.x = this._light.x + angle1cos * this._maxDistance;
      p3.y = this._light.y + angle1sin * this._maxDistance;
      p4.x = this._light.x + angle2cos * this._maxDistance;
      p4.y = this._light.y + angle2sin * this._maxDistance;
    }

    let pBegin = ShadowCaster.lineIntersection(p3, p4, p1, p2);
    if (pBegin === null) return;
    pBegin.x = Math.round(pBegin.x); // round for pixel perfect
    pBegin.y = Math.round(pBegin.y); // round for pixel perfect

    p2.x = this._light.x + angle2cos;
    p2.y = this._light.y + angle2sin;
    let pEnd = ShadowCaster.lineIntersection(p3, p4, p1, p2);
    if (pEnd === null) return;
    pEnd.x = Math.round(pEnd.x); // round for pixel perfect
    pEnd.y = Math.round(pEnd.y); // round for pixel perfect

    if (segment != null) {
      // extend segment to light walls
      switch (segment.type) {
        case SegmentType.TOP:
          output.push(pBegin);
          output.push(new PIXI.Point(pBegin.x, pBegin.y - TILE_SIZE));
          output.push(new PIXI.Point(pEnd.x, pEnd.y - TILE_SIZE));
          output.push(pEnd);
          break;
        case SegmentType.NORMAL:
          output.push(pBegin);
          output.push(pEnd);
          break;
      }
    } else {
      output.push(pBegin);
      output.push(pEnd);
    }
  }

  debug(): void {
    const scale = 1;
    const width = (80 * 16) * scale;
    const height = (80 * 16) * scale;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d")!;
    ctx.fillRect(0, 0, width, height);
    ctx.scale(scale, scale);

    const segments = new Path2D();
    for (let segment of this._segments) {
      const start = segment.p1.point;
      const end = segment.p2.point;
      segments.moveTo(start.x, start.y);
      segments.lineTo(end.x, end.y);
    }
    ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    ctx.stroke(segments);

    console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
  }
}