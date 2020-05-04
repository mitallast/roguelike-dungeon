const X_DIST = 2;
const Y_DIST = 3;

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
    return new ImmutableRect(
      this.x - X_DIST,
      this.y - Y_DIST,
      this.w + X_DIST + X_DIST,
      this.h + Y_DIST + Y_DIST
    );
  }

  expandV(): ImmutableRect {
    return new ImmutableRect(
      this.x - X_DIST,
      this.y,
      this.w + X_DIST + X_DIST,
      this.h
    );
  }

  expandH(): ImmutableRect {
    return new ImmutableRect(
      this.x,
      this.y - Y_DIST,
      this.w,
      this.h + Y_DIST + Y_DIST
    );
  }

  isOverlap(b: Rect): boolean {
    return this.x < b.x + b.w
      && this.x + this.w > b.x
      && this.y < b.y + b.h
      && this.y + this.h > b.y;
  }

  toString(): string {
    return `{x=${this.x},y=${this.y},w=${this.w},h=${this.h}}`;
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
    return this.x < b.x + b.w
      && this.x + this.w > b.x
      && this.y < b.y + b.h
      && this.y + this.h > b.y;
  }

  toString(): string {
    return `{x=${this.x},y=${this.y},w=${this.w},h=${this.h}}`;
  }
}