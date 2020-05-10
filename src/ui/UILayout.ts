export class UILayout {
  private _commitX: number = 0;
  private _commitY: number = 0;

  private _offsetX: number = 0;
  private _offsetY: number = 0;

  commit(): void {
    this._commitX = this._offsetX;
    this._commitY = this._offsetY;
  }

  reset(): void {
    this._offsetX = this._commitX;
    this._offsetY = this._commitY;
  }

  offset(x: number, y: number): void {
    this._offsetX += x;
    this._offsetY += y;
  }

  get x(): number {
    return this._offsetX;
  }

  get y(): number {
    return this._offsetY;
  }
}