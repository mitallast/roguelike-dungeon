export class Render {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  readonly buffer: HTMLCanvasElement;
  readonly b_ctx: CanvasRenderingContext2D;

  constructor(id: string = "dungeon") {
    this.canvas = document.getElementById(id) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.buffer = document.createElement("canvas");
    this.b_ctx = this.buffer.getContext("2d");
    this.b_ctx.imageSmoothingEnabled = false;
  }
}