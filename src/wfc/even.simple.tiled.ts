import * as PIXI from "pixi.js";
import {RNG} from "../rng";
import {Indexer} from "../indexer";
import {Resources} from "../resources";
import {buffer, Model, Resolution} from "./model";
import {Config, DungeonCrawler} from "../tunneler";

export enum Direction {
  RIGHT = 2,
  DOWN = 1
}

export enum CellType {
  EMPTY = 0,
  FLOOR = 1,
  FLOOR_WALL_TOP = 2,
  WALL_MID = 3,
  WALL_TOP = 4,
  WALL_SIDE = 5,
}

export interface TilesetRules {
  readonly size: number;
  readonly tiles: readonly string[];
  readonly cells: readonly (readonly [number, number, CellType])[];

  readonly right: readonly (readonly [number, number])[];
  readonly down: readonly (readonly [number, number])[];
}

export class TilesetRulesBuilder {
  private readonly _tilesIndex: Indexer<string> = Indexer.identity();
  private readonly _cellsIndex: Indexer<[number, number, CellType]> = Indexer.array();

  private readonly _rightIndex: Indexer<[number, number]> = Indexer.array();
  private readonly _downIndex: Indexer<[number, number]> = Indexer.array();

  addCell(floor: string | undefined, wall: string | undefined, type: CellType): number {
    const floorId = floor ? this._tilesIndex.index(floor) : -1;
    const wallId = wall ? this._tilesIndex.index(wall) : -1;
    return this._cellsIndex.index([floorId, wallId, type]);
  }

  addRuleRight(first: number, next: number,): void {
    this._rightIndex.index([first, next]);
  }

  addRuleDown(first: number, next: number,): void {
    this._downIndex.index([first, next]);
  }

  build(): TilesetRules {
    return {
      size: 16,
      tiles: this._tilesIndex.values,
      cells: this._cellsIndex.values,
      right: this._rightIndex.values,
      down: this._downIndex.values,
    };
  }
}

export class EvenSimpleTiledModel extends Model {
  private readonly _resources: Resources;
  readonly tileset: TilesetRules;

  private readonly _constraints: Constraint[];

  constructor(resources: Resources, tileset: TilesetRules, rng: RNG, width: number, height: number, constraints: Constraint[]) {
    super(rng, width, height);
    this._resources = resources;
    this.weights = [];
    this.tileset = tileset;
    this._constraints = constraints;

    this.T = tileset.cells.length;
    for (let i = 0; i < this.T; i++) {
      this.weights[i] = 1;
    }

    const tmpPropagator: boolean[][][] = [];
    for (let direction = 0; direction < 4; direction++) {
      tmpPropagator[direction] = [];
      for (let cell1 = 0; cell1 < this.T; cell1++) {
        tmpPropagator[direction][cell1] = [];
        for (let cell2 = 0; cell2 < this.T; cell2++) {
          tmpPropagator[direction][cell1][cell2] = false;
        }
      }
    }

    for (const [first, next] of tileset.right) {
      const opposite = Model.opposite[Direction.RIGHT];
      tmpPropagator[Direction.RIGHT][first][next] = true;
      tmpPropagator[opposite][next][first] = true;
    }

    for (const [first, next] of tileset.down) {
      const opposite = Model.opposite[Direction.DOWN];
      tmpPropagator[Direction.DOWN][first][next] = true;
      tmpPropagator[opposite][next][first] = true;
    }

    this.propagator = [];
    for (let direction = 0; direction < 4; direction++) {
      this.propagator[direction] = [];
      for (let cell1 = 0; cell1 < this.T; cell1++) {
        this.propagator[direction][cell1] = [];
        for (let cell2 = 0; cell2 < this.T; cell2++) {
          if (tmpPropagator[direction][cell1][cell2]) {
            this.propagator[direction][cell1].push(cell2);
          }
        }
      }
    }
  }

  onBoundary(x: number, y: number): boolean {
    return !this.periodic && (x < 0 || y < 0 || x >= this.FMX || y >= this.FMY);
  }

  clear(): void {
    super.clear();
    for (const constraint of this._constraints) {
      constraint.onClear();
      this.propagate();
    }
  }

  backtrackConstraint(index: number, pattern: number): void {
    for (const constraint of this._constraints) {
      constraint.onBacktrack(index, pattern);
    }
  }

  banConstraint(index: number, pattern: number): void {
    for (const constraint of this._constraints) {
      constraint.onBan(index, pattern);
    }
  }

  initConstraint(): void {
    for (const constraint of this._constraints) {
      constraint.init(this);
      if (this.status != Resolution.Undecided) {
        if (this.debug) console.warn("failed init constraint", this.status);
        return;
      }
    }
  }

  stepConstraint(): void {
    for (const constraint of this._constraints) {
      constraint.check();
      if (this.status != Resolution.Undecided) {
        if (this.debug) console.warn("failed step constraint check");
        return;
      }
      this.propagate();
      if (this.status != Resolution.Undecided) {
        if (this.debug) console.warn("failed step constraint propagate");
        return;
      }
    }
    this.deferredConstraintsStep = false;
  }

  protected testObserved(i: number): void {
    const x = i % this.FMX, y = Math.floor(i / this.FMX);

    // test 1
    if (!this.onBoundary(x, y)) {
      const patterns = this.wave[i].filter(v => v).length;
      console.assert(patterns === 1, `wave ${i} pattern count ${patterns}`);
    }
  }

  private _app: PIXI.Application | null = null;

  graphics(markup: number[]): void {
    const scale = 1;
    const tilesize = this.tileset.size;
    console.log("tilesize", tilesize, this.tileset, this.tileset.size);
    if (this._app == null) {
      this._app = new PIXI.Application({
        width: this.FMX * tilesize * scale,
        height: this.FMY * tilesize * scale,
        resolution: 1,
        antialias: false,
        autoStart: false,
        sharedTicker: false,
        sharedLoader: false
      });
      document.body.appendChild(this._app.view);
    }
    const app = this._app;
    this._app.stage.removeChildren();
    const container = new PIXI.Container();
    container.scale.set(scale, scale);
    app.stage.addChild(container);
    if (this.observed != null) {
      for (let x = 0; x < this.FMX; x++) {
        for (let y = 0; y < this.FMY; y++) {
          const [floor, wall] = this.tileset.cells[this.observed[x + y * this.FMX]];
          if (floor >= 0) {
            const sprite = this._resources.sprite(this.tileset.tiles[floor]);
            sprite.position.set(x * tilesize, y * tilesize);
            sprite.zIndex = 1;
            container.addChild(sprite);
          }
          if (wall >= 0) {
            const sprite = this._resources.sprite(this.tileset.tiles[wall]);
            sprite.position.set(x * tilesize, y * tilesize);
            sprite.zIndex = 2;
            container.addChild(sprite);
          }
        }
      }
    } else {
      for (let x = 0; x < this.FMX; x++) {
        for (let y = 0; y < this.FMY; y++) {
          const a = this.wave![x + y * this.FMX];
          let weightsSum = 0;
          for (let t = 0; t < this.T; t++) {
            if (a[t]) {
              weightsSum += this.weights[t];
            }
          }
          const alpha = 1 / weightsSum;
          for (let t = 0; t < this.T; t++) {
            if (a[t]) {
              const [floor, wall] = this.tileset.cells[t];
              const tiles = (floor >= 0 ? 1 : 0) + (wall >= 0 ? 1 : 0);
              if (floor >= 0) {
                const sprite = this._resources.sprite(this.tileset.tiles[floor]);
                sprite.position.set(x * tilesize, y * tilesize);
                sprite.zIndex = 1;
                sprite.alpha = alpha * (1 / tiles) * this.weights[t];
                container.addChild(sprite);
              }
              if (wall >= 0) {
                const sprite = this._resources.sprite(this.tileset.tiles[wall]);
                sprite.position.set(x * tilesize, y * tilesize);
                sprite.zIndex = 2;
                sprite.alpha = alpha * (1 / tiles) * this.weights[t];
                container.addChild(sprite);
              }
            }
          }
        }
      }
    }

    const graphics = new PIXI.Graphics();
    container.addChild(graphics);
    graphics.lineStyle(1, 0xFF0000);
    for (const i of markup) {
      const x = i % this.FMX, y = Math.floor(i / this.FMX);
      graphics.drawRect(x * tilesize, y * tilesize, tilesize, tilesize);
    }

    app.render();

    const canvas = app.view;

    console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
  }
}

// origin https://github.com/BorisTheBrave/DeBroglie/

export interface Constraint {
  init(model: EvenSimpleTiledModel): void;
  onClear(): void;
  onBan(index: number, pattern: number): void;
  onBacktrack(index: number, pattern: number): void;
  check(): void;
}

export class BorderConstraint implements Constraint {
  private readonly _isBorderCell: boolean[];

  private _model: EvenSimpleTiledModel | null = null;

  constructor(isBorderCell: boolean[]) {
    this._isBorderCell = isBorderCell;
  }

  init(model: EvenSimpleTiledModel): void {
    this._model = model;
  }

  onClear(): void {
    console.log("on clear");
    const model = this._model!;
    const indices = model.FMX * model.FMY;

    for (let i = 0; i < indices; i++) {
      const x = i % model.FMX, y = Math.floor(i / model.FMX);
      if (x === 0 || x === model.FMX - 1 || y === 0 || y === model.FMY - 1) {
        for (let t = 0; t < model.T; t++) {
          if (model.wave[i][t] && !this._isBorderCell[t]) {
            model.ban(i, t);
          }
        }
      }
    }
  }

  onBan(_index: number, _pattern: number): void {
  }

  onBacktrack(_index: number, _pattern: number): void {
  }

  check(): boolean {
    return true;
  }
}

export class PathConstraint implements Constraint {
  private readonly _isPathCell: boolean[];

  private _model: EvenSimpleTiledModel | null = null;
  private _graph: SimpleGraph | null = null;
  private _couldBePath: boolean[] = [];
  private _mustBePath: boolean[] = [];

  private _refresh: boolean[] = [];
  private _refreshQueue: number[] = [];

  constructor(isPathCell: boolean[]) {
    this._isPathCell = isPathCell;
  }

  init(model: EvenSimpleTiledModel): void {
    this._model = model;
    const indices = model.FMX * model.FMY;
    this._couldBePath = buffer(indices, false);
    this._mustBePath = buffer(indices, false);
    this._refresh = buffer(indices, true);
    this._refreshQueue = [];
  }

  onClear(): void {
    const indices = this._model!.FMX * this._model!.FMY;
    this._couldBePath = buffer(indices, false);
    this._mustBePath = buffer(indices, false);
    this._refresh = buffer(indices, true);
    this._refreshQueue = [];
    for (let i = 0; i < indices; i++) {
      this._refreshQueue.push(i);
    }
    this.refreshAll();

    this._graph = this.createGraph();
  }

  onBacktrack(index: number, _pattern: number): void {
    this.addRefresh(index);
  }

  onBan(index: number, _pattern: number): void {
    this.addRefresh(index);
  }

  private addRefresh(index: number): void {
    if (!this._refresh[index]) {

      const FMX = this._model!.FMX;
      const FMY = this._model!.FMY;
      const x = index % FMX, y = Math.floor(index / FMX);

      this._refresh[index] = true;
      this._refreshQueue.push(index);

      for (let direction = 0; direction < 4; direction++) {
        const dx = Model.DX[direction], dy = Model.DY[direction];
        let sx = x + dx, sy = y + dy;
        if (this._model!.onBoundary(sx, sy)) {
          continue;
        }

        if (sx < 0) sx += FMX;
        else if (sx >= FMX) sx -= FMX;
        if (sy < 0) sy += FMY;
        else if (sy >= FMY) sy -= FMY;

        const s = sx + sy * FMX;

        if (!this._refresh[s]) {
          this._refresh[s] = true;
          this._refreshQueue.push(s);
        }
      }
    }
  }

  private refreshAll(): void {
    const model = this._model!;
    const T = model.T;

    while (this._refreshQueue.length > 0) {
      const i = this._refreshQueue.pop()!;
      this._refresh[i] = false;

      let pathCount = 0;
      let totalCount = 0;

      for (let t = 0; t < T; t++) {
        if (model.wave[i][t]) {
          totalCount++;
          if (this._isPathCell[t]) {
            pathCount++;
          }
        }
      }

      this._couldBePath[i] = pathCount > 0;
      this._mustBePath[i] = pathCount > 0 && totalCount === pathCount;
    }
  }

  check(): void {
    for (; ;) {
      this.refreshAll();

      const isArticulation = this.getArticulationPoints();
      if (isArticulation == null) {
        if (this._model!.debug) console.error("no articulation");
        this._model!.status = Resolution.Contradiction;
        return;
      }

      if (this.applyArticulationPoints(isArticulation)) {
        if (this._model!.debug) {
          console.log("articulation");
          const markup: number[] = isArticulation
            .map<[boolean, number]>((v, i) => [v, i])
            .filter(a => a[0])
            .map(a => a[1]);
          this._model!.graphics(markup);
          console.log("continue articulation loop");
        }
      } else {
        break;
      }
    }
  }

  private applyArticulationPoints(isArticulation: boolean[]): boolean {
    const model = this._model!;
    const FMX = model.FMX;
    const FMY = model.FMY;
    const indices = FMX * FMY;
    // All articulation points must be paths,
    // So ban any other possibilities
    let changed = false;
    for (let i = 0; i < indices; i++) {
      if (isArticulation[i] && !this._mustBePath[i]) {
        if (model.debug) console.log("articulation", i);
        const x = i % model.FMX, y = Math.floor(i / model.FMX);
        if (model.debug) console.log("x, y, i", x, y, i);

        for (let t = 0; t < model.T; t++) {
          if (model.wave[i][t]) {
            if (this._isPathCell[t]) {
              if (model.debug) console.log("ban not path", i, t);
              model.ban(i, t);
              changed = true;
            }
          }
        }
      }
    }
    return changed;
  }

  private getArticulationPoints(): boolean[] | null {
    const walkable = this._couldBePath;
    const relevant = this._mustBePath;

    const model = this._model!;
    const graph = this._graph!;
    const indices = walkable.length;

    const low: number[] = buffer(indices, 0);
    let num = 1;
    const dfsNum: number[] = buffer(indices, 0);
    const markup: number[] = [];
    const isArticulation: boolean[] = buffer(indices, false);

    // This hideous function is a iterative version
    // of the much more elegant recursive version below.
    // Unfortunately, the recursive version tends to blow the stack for large graphs
    function cutVertex(initialU: number): number {
      const stack: CutVertexFrame[] = [];
      stack.push(new CutVertexFrame(initialU));

      // This is the "returned" value from recursion
      let childRelevantSubtree: boolean = false;
      let childCount = 0;

      for (; ;) {
        const frameIndex = stack.length - 1;
        const frame = stack[frameIndex];
        const u = frame.u;

        let switchState = frame.state;
        let loop: boolean;
        do {
          loop = false;
          // console.log("switchState", switchState);
          switch (switchState) {
            // Initialization
            case 0: {
              // console.log("switch 0");
              const isRelevant = relevant != null && relevant[u];
              if (isRelevant) {
                isArticulation[u] = true;
              }
              frame.isRelevantSubtree = isRelevant;
              low[u] = dfsNum[u] = num++;
              markup.push(u);
              // Enter loop
              switchState = 1;
              loop = true;
              break;
            }
            // Loop over neighbours
            case 1: {
              // console.log("switch 1");
              // Check loop condition
              const neighbours = graph.neighbours[u];
              const neighbourIndex = frame.neighbourIndex;
              if (neighbourIndex >= neighbours.length) {
                // Exit loop
                switchState = 3;
                loop = true;
                break;
              }
              const v = neighbours[neighbourIndex];
              if (!walkable[v]) {
                // continue to next iteration of loop
                frame.neighbourIndex = neighbourIndex + 1;
                switchState = 1;
                loop = true;
                break;
              }

              // v is a neighbour of u
              const unvisited = dfsNum[v] === 0;
              if (unvisited) {
                // Recurse into v
                stack.push(new CutVertexFrame(v));
                frame.state = 2;
                switchState = 2;
                stack[frameIndex] = frame;
                break;
              } else {
                low[u] = Math.min(low[u], dfsNum[v]);
              }

              // continue to next iteration of loop
              frame.neighbourIndex = neighbourIndex + 1;
              switchState = 1;
              loop = true;
              break;
            }
            // Return from recursion (still in loop)
            case 2: {
              // console.log("switch 2");
              // At this point, childRelevantSubtree
              // has been set to the by the recursion call we've just returned from
              const neighbours = graph.neighbours[u];
              const neighbourIndex = frame.neighbourIndex;
              const v = neighbours[neighbourIndex];

              if (frameIndex == 0) {
                // Root frame
                childCount++;
              }

              if (childRelevantSubtree) {
                frame.isRelevantSubtree = true;
              }
              if (low[v] >= dfsNum[u]) {
                if (relevant == null || childRelevantSubtree) {
                  isArticulation[u] = true;
                }
              }
              low[u] = Math.min(low[u], low[v]);

              // continue to next iteration of loop
              frame.neighbourIndex = neighbourIndex + 1;
              switchState = 1;
              loop = true;
              break;
            }
            // Cleanup
            case 3: {
              // console.log("switch 3");
              if (frameIndex == 0) {
                // Root frame
                return childCount;
              } else {
                // Set childRelevantSubtree with the return value from this recursion call
                childRelevantSubtree = frame.isRelevantSubtree;
                // Pop the frame
                stack.splice(frameIndex, 1);
                // Resume the caller (which will be in state 2)
                break;
              }
            }
          }
        } while (loop);
      }
    }

    // Check we've visited every relevant point.
    // If not, there's no way to satisfy the constraint.
    // UPD relevant always not null
    // Find starting point
    for (let i = 0; i < indices; i++) {
      if (!walkable[i]) continue;
      if (!relevant[i]) continue;
      // Already visited
      if (dfsNum[i] != 0) continue;

      cutVertex(i);
      // Relevant points are always articulation points
      // UPD: relevant == must be path, already articulated
      // isArticulation[i] = true;
      break;
    }

    // Check connectivity
    for (let i = 0; i < indices; i++) {
      if (relevant[i] && dfsNum[i] == 0) {
        if (model.debug) {
          console.warn("walkable:");
          const markupW: number[] = walkable
            .map<[boolean, number]>((v, i) => [v, i])
            .filter(a => a[0])
            .map(a => a[1]);
          model.graphics(markupW);
          console.warn("visited");
          model.graphics(markup);

          const w = model.FMX;
          const x = i % w, y = Math.floor(i / w);
          console.error(`not visited relevant point i=${i} x=${x} y=${y}`);
          console.warn('graph neighbours', graph.neighbours[i]);
          model.graphics([i]);
        }
        return null;
      }
    }

    // compute articulation points
    for (let i = 0; i < indices; i++) {
      if (!walkable[i]) continue;
      if (relevant[i]) continue; // graph is already connected with all relevant points
      if (dfsNum[i] != 0) continue; // Already visited
      if (isArticulation[i]) continue; // if point is already articulation point, it visited

      // console.warn("compute articulation point for ", i);

      const childCount = cutVertex(i);
      // The root of the tree is an exception to CutVertex's calculations
      // It's an articulation point if it has multiple children
      // as removing it would give multiple subtrees.
      isArticulation[i] = childCount > 1;
    }

    return isArticulation;
  }

  private createGraph(): SimpleGraph {
    const model = this._model!;
    const nodeCount = model.FMX * model.FMY;
    const neighbours: number[][] = [];
    for (let i = 0; i < nodeCount; i++) {
      neighbours[i] = [];

      const x = i % model.FMX, y = Math.floor(i / model.FMX);

      for (let direction = 0; direction < 4; direction++) {
        const dx = Model.DX[direction], dy = Model.DY[direction];
        let sx = x + dx, sy = y + dy;
        if (!model.periodic && (sx >= model.FMX || sy >= model.FMY || sx < 0 || sy < 0)) {
          continue;
        }

        if (sx < 0) sx += model.FMX;
        else if (sx >= model.FMX) sx -= model.FMX;
        if (sy < 0) sy += model.FMY;
        else if (sy >= model.FMY) sy -= model.FMY;

        const s = sx + sy * model.FMX;

        neighbours[i].push(s);
      }
    }

    return {
      nodeCount: nodeCount,
      neighbours: neighbours,
    };
  }
}

class CutVertexFrame {
  u: number;
  state: number = 0;
  neighbourIndex: number = 0;
  isRelevantSubtree: boolean = false;

  constructor(u: number) {
    this.u = u;
  }
}

interface SimpleGraph {
  readonly nodeCount: number;
  readonly neighbours: number[][];
}

export class DungeonCrawlerConstraint implements Constraint {
  private readonly _config: Config;

  private _model: EvenSimpleTiledModel | null = null;
  private _crawler: DungeonCrawler | null = null;

  get crawler(): DungeonCrawler | null {
    return this._crawler;
  }

  constructor(config: Config) {
    this._config = config;
  }

  init(model: EvenSimpleTiledModel): void {
    this._model = model;
  }

  onClear(): void {
    const model = this._model!;
    console.time("crawler");
    const crawler = this._crawler = new DungeonCrawler(this._config, model.rng);
    crawler.generate();
    console.timeEnd("crawler");

    console.time("crawler constraint");

    const isOpen = buffer(model.FMX * model.FMY, false);

    for (let y = 0; y < crawler.config.height; y++) {
      for (let x = 0; x < crawler.config.width; x++) {
        const i = x + y * model.FMX;
        isOpen[i] = crawler.isMapOpen({x: x, y: y});
      }
    }

    function onlyFloorAround(i: number): boolean {
      const x = i % model.FMX, y = Math.floor(i / model.FMX);
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            const sx = x + dx;
            const sy = y + dy;
            if (model.onBoundary(sx, sy)) continue;
            if (!isOpen[sx + sy * model.FMX]) {
              return false;
            }
          }
        }
      }
      return true;
    }

    function hasFloorAround(i: number, h: number = 2): boolean {
      const x = i % model.FMX, y = Math.floor(i / model.FMX);
      for (let dy = -1; dy <= h; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            const sx = x + dx;
            const sy = y + dy;
            if (model.onBoundary(sx, sy)) continue;
            if (isOpen[sx + sy * model.FMX]) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function checkOpen(i: number, dx: number, dy: number): boolean | null {
      const x = i % model.FMX, y = Math.floor(i / model.FMX);
      const sx = x + dx;
      const sy = y + dy;
      if (model.onBoundary(sx, sy)) return null;
      return isOpen[sx + sy * model.FMX];
    }

    for (let i = 0; i < isOpen.length; i++) {
      const possibleTypes = buffer(6, false);

      const bottom = checkOpen(i, 0, 1);

      if (isOpen[i]) {
        possibleTypes[CellType.EMPTY] = false;
        possibleTypes[CellType.FLOOR] = true;
        if (!onlyFloorAround(i)) {
          possibleTypes[CellType.FLOOR_WALL_TOP] = true
        }
      } else {
        if (hasFloorAround(i)) {
          const top = checkOpen(i, 0, -1);

          possibleTypes[CellType.EMPTY] = !(top === true || bottom === true);
          possibleTypes[CellType.WALL_MID] = top === true || bottom === true;
          possibleTypes[CellType.WALL_TOP] = true;
          possibleTypes[CellType.WALL_SIDE] = true
        } else {
          possibleTypes[CellType.EMPTY] = true;
        }
      }

      // console.log(`possibleTypes, {x:${i % model.FMX},y:${Math.floor(i / model.FMX)}}`, possibleTypes);

      for (let t = 0; t < model.T; t++) {
        const type = model.tileset.cells[t][2];
        if (!possibleTypes[type]) {
          model.ban(i, t);
        }
      }
    }

    console.timeEnd("crawler constraint");
  }

  check(): void {
  }

  onBacktrack(_index: number, _pattern: number): void {
  }

  onBan(_index: number, _pattern: number): void {
  }
}