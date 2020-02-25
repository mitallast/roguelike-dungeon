const x_dist = 2;
const y_dist = 3;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;

  isOverlap(b: Rect): boolean;
}

export class ImmutableRect implements Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  mutable(): MutableRect {
    return new MutableRect(this.x, this.y, this.w, this.h);
  }

  expand(): ImmutableRect {
    const a = this;
    return new ImmutableRect(
      a.x - x_dist,
      a.y - y_dist,
      a.w + x_dist + x_dist,
      a.h + y_dist + y_dist
    );
  }

  expandV(): ImmutableRect {
    const a = this;
    return new ImmutableRect(
      a.x - x_dist,
      a.y,
      a.w + x_dist + x_dist,
      a.h
    );
  }

  expandH(): ImmutableRect {
    const a = this;
    return new ImmutableRect(
      a.x,
      a.y - y_dist,
      a.w,
      a.h + y_dist + y_dist
    );
  }

  isOverlap(b: Rect) {
    const a = this;
    return a.x < b.x + b.w
      && a.x + a.w > b.x
      && a.y < b.y + b.h
      && a.y + a.h > b.y;
  }
}

export class MutableRect implements Rect {
  x: number;
  y: number;
  w: number;
  h: number;

  static from(rect: Rect): MutableRect {
    return new MutableRect(rect.x, rect.y, rect.w, rect.h);
  }

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  immutable(): ImmutableRect {
    return new ImmutableRect(this.x, this.y, this.w, this.h);
  }

  isOverlap(b: Rect): boolean {
    const a = this;
    return a.x < b.x + b.w
      && a.x + a.w > b.x
      && a.y < b.y + b.h
      && a.y + a.h > b.y;
  }
}