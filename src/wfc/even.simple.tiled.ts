import {buffer, Model, Resolution} from "./model";
import {RNG} from "../rng";
import {Resources} from "../resources";
import {TunnelingAlgorithm, TunnelingOptions} from "../tunneling";
import {Indexer} from "../indexer";
import * as PIXI from "pixi.js";

export interface TilesetRules {
  readonly size: number;
  readonly tiles: string[];
  readonly cells: [number, number, number][];
  readonly rules: [number, number, number][];
}

export class TilesetRulesBuilder {
  private readonly tilesIndex: Indexer<string> = Indexer.identity();
  private readonly cellsIndex: Indexer<[number, number, number]> = Indexer.array();
  private readonly rulesIndex: Indexer<[number, number, number]> = Indexer.array();

  addCell(floor: string | undefined, wall: string | undefined, zIndex: number | undefined): number {
    const floorId = floor ? this.tilesIndex.index(floor) : -1;
    const wallId = wall ? this.tilesIndex.index(wall) : -1;
    return this.cellsIndex.index([floorId, wallId, zIndex || 0]);
  }

  addRule(first: number, next: number, direction: number): number {
    return this.rulesIndex.index([first, next, direction]);
  }

  build(): TilesetRules {
    return {
      size: 16,
      tiles: this.tilesIndex.values,
      cells: this.cellsIndex.values,
      rules: this.rulesIndex.values,
    };
  }
}

export class EvenSimpleTiledModel extends Model {
  private readonly resources: Resources;
  readonly tileset: TilesetRules;

  private readonly constraints: Constraint[];

  constructor(resources: Resources, tileset: TilesetRules, rng: RNG, width: number, height: number, constraints: Constraint[]) {
    super(rng, width, height);
    this.resources = resources;
    this.weights = [];
    this.tileset = tileset;
    this.constraints = constraints;

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

    for (let [first, next, direction] of tileset.rules) {
      const opposite = Model.opposite[direction];
      tmpPropagator[direction][first][next] = true;
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
    for (let constraint of this.constraints) {
      constraint.onClear();
      this.propagate();
    }
  }

  backtrackConstraint(index: number, pattern: number): void {
    for (let constraint of this.constraints) {
      constraint.onBacktrack(index, pattern);
    }
  }

  banConstraint(index: number, pattern: number): void {
    for (let constraint of this.constraints) {
      constraint.onBan(index, pattern);
    }
  }

  initConstraint(): void {
    for (let constraint of this.constraints) {
      constraint.init(this);
      if (this.status != Resolution.Undecided) {
        if (this.debug) console.warn("failed init constraint", this.status);
        return;
      }
    }
  }

  stepConstraint(): void {
    for (let constraint of this.constraints) {
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
    let x = i % this.FMX, y = Math.floor(i / this.FMX);

    // test 1
    if (!this.onBoundary(x, y)) {
      const patterns = this.wave[i].filter(v => v).length;
      console.assert(patterns === 1, `wave ${i} pattern count ${patterns}`);
    }
  }

  private app: PIXI.Application | null = null;

  graphics(markup: number[]): void {
    const scale = 1;
    const tilesize = this.tileset.size;
    console.log("tilesize", tilesize, this.tileset, this.tileset.size);
    if (this.app == null) {
      this.app = new PIXI.Application({
        width: this.FMX * tilesize * scale,
        height: this.FMY * tilesize * scale,
        resolution: 1,
        antialias: false,
        autoStart: false,
        sharedTicker: false,
        sharedLoader: false
      });
      document.body.appendChild(this.app.view);
    }
    const app = this.app;
    this.app.stage.removeChildren();
    const container = new PIXI.Container();
    container.scale.set(scale, scale);
    app.stage.addChild(container);
    if (this.observed != null) {
      for (let x = 0; x < this.FMX; x++) {
        for (let y = 0; y < this.FMY; y++) {
          let [floor, wall] = this.tileset.cells[this.observed[x + y * this.FMX]];
          if (floor >= 0) {
            const sprite = this.resources.sprite(this.tileset.tiles[floor]);
            sprite.position.set(x * tilesize, y * tilesize);
            sprite.zIndex = 1;
            container.addChild(sprite);
          }
          if (wall >= 0) {
            const sprite = this.resources.sprite(this.tileset.tiles[wall]);
            sprite.position.set(x * tilesize, y * tilesize);
            sprite.zIndex = 2;
            container.addChild(sprite);
          }
        }
      }
    } else {
      for (let x = 0; x < this.FMX; x++) {
        for (let y = 0; y < this.FMY; y++) {
          let a = this.wave![x + y * this.FMX];
          let weights_sum = 0;
          for (let t = 0; t < this.T; t++) {
            if (a[t]) {
              weights_sum += this.weights[t];
            }
          }
          const alpha = 1 / weights_sum;
          for (let t = 0; t < this.T; t++) {
            if (a[t]) {
              const [floor, wall] = this.tileset.cells[t];
              const tiles = (floor >= 0 ? 1 : 0) + (wall >= 0 ? 1 : 0);
              if (floor >= 0) {
                const sprite = this.resources.sprite(this.tileset.tiles[floor]);
                sprite.position.set(x * tilesize, y * tilesize);
                sprite.zIndex = 1;
                sprite.alpha = alpha * (1 / tiles) * this.weights[t];
                container.addChild(sprite);
              }
              if (wall >= 0) {
                const sprite = this.resources.sprite(this.tileset.tiles[wall]);
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
    for (let i of markup) {
      let x = i % this.FMX, y = Math.floor(i / this.FMX);
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
  onBan(index: number, pattern: number): void
  onBacktrack(index: number, pattern: number): void
  check(): void;
}

export class BorderConstraint implements Constraint {
  private readonly isBorderCell: boolean[];

  private model: EvenSimpleTiledModel | null = null;

  constructor(isBorderCell: boolean[]) {
    this.isBorderCell = isBorderCell;
  }

  init(model: EvenSimpleTiledModel): void {
    this.model = model;
  }

  onClear(): void {
    console.log("on clear");
    const model = this.model!;
    const indices = model.FMX * model.FMY;

    for (let i = 0; i < indices; i++) {
      let x = i % model.FMX, y = Math.floor(i / model.FMX);
      if (x === 0 || x === model.FMX - 1 || y === 0 || y === model.FMY - 1) {
        for (let t = 0; t < model.T; t++) {
          if (model.wave[i][t] && !this.isBorderCell[t]) {
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
  private readonly isPathCell: boolean[];

  private model: EvenSimpleTiledModel | null = null;
  private graph: SimpleGraph | null = null;
  private couldBePath: boolean[] = [];
  private mustBePath: boolean[] = [];

  private refresh: boolean[] = [];
  private refreshQueue: number[] = [];

  constructor(isPathCell: boolean[]) {
    this.isPathCell = isPathCell;
  }

  init(model: EvenSimpleTiledModel): void {
    this.model = model;
    const indices = model.FMX * model.FMY;
    this.couldBePath = buffer(indices, false);
    this.mustBePath = buffer(indices, false);
    this.refresh = buffer(indices, true);
    this.refreshQueue = [];
  }

  onClear(): void {
    let indices = this.model!.FMX * this.model!.FMY;
    this.couldBePath = buffer(indices, false);
    this.mustBePath = buffer(indices, false);
    this.refresh = buffer(indices, true);
    this.refreshQueue = [];
    for (let i = 0; i < indices; i++) {
      this.refreshQueue.push(i);
    }
    this.refreshAll();

    this.graph = this.createGraph();
  }

  onBacktrack(index: number, _pattern: number): void {
    this.addRefresh(index);
  }

  onBan(index: number, _pattern: number): void {
    this.addRefresh(index);
  }

  private addRefresh(index: number): void {
    if (!this.refresh[index]) {

      const FMX = this.model!.FMX;
      const FMY = this.model!.FMY;
      let x = index % FMX, y = Math.floor(index / FMX);

      this.refresh[index] = true;
      this.refreshQueue.push(index);

      for (let direction = 0; direction < 4; direction++) {
        let dx = Model.DX[direction], dy = Model.DY[direction];
        let sx = x + dx, sy = y + dy;
        if (this.model!.onBoundary(sx, sy)) {
          continue;
        }

        if (sx < 0) sx += FMX;
        else if (sx >= FMX) sx -= FMX;
        if (sy < 0) sy += FMY;
        else if (sy >= FMY) sy -= FMY;

        let s = sx + sy * FMX;

        if (!this.refresh[s]) {
          this.refresh[s] = true;
          this.refreshQueue.push(s);
        }
      }
    }
  }

  private refreshAll(): void {
    const model = this.model!;
    const T = model.T;

    while (this.refreshQueue.length > 0) {
      const i = this.refreshQueue.pop()!;
      this.refresh[i] = false;

      let pathCount = 0;
      let totalCount = 0;

      for (let t = 0; t < T; t++) {
        if (model.wave[i][t]) {
          totalCount++;
          if (this.isPathCell[t]) {
            pathCount++;
          }
        }
      }

      this.couldBePath[i] = pathCount > 0;
      this.mustBePath[i] = pathCount > 0 && totalCount === pathCount;
    }
  }

  check(): void {
    while (true) {
      this.refreshAll();

      let isArticulation = this.getArticulationPoints();
      if (isArticulation == null) {
        if (this.model!.debug) console.error("no articulation");
        this.model!.status = Resolution.Contradiction;
        return;
      }

      if (this.applyArticulationPoints(isArticulation)) {
        if (this.model!.debug) {
          console.log("articulation");
          let markup: number[] = isArticulation
            .map<[boolean, number]>((v, i) => [v, i])
            .filter(a => a[0])
            .map(a => a[1]);
          this.model!.graphics(markup);
          console.log("continue articulation loop");
        }
      } else {
        break;
      }
    }
  }

  private applyArticulationPoints(isArticulation: boolean[]): boolean {
    const model = this.model!;
    const FMX = model.FMX;
    const FMY = model.FMY;
    let indices = FMX * FMY;
    // All articulation points must be paths,
    // So ban any other possibilities
    let changed = false;
    for (let i = 0; i < indices; i++) {
      if (isArticulation[i] && !this.mustBePath[i]) {
        if (model.debug) console.log("articulation", i);
        let x = i % model.FMX, y = Math.floor(i / model.FMX);
        if (model.debug) console.log("x, y, i", x, y, i);

        for (let t = 0; t < model.T; t++) {
          if (model.wave[i][t]) {
            if (this.isPathCell[t]) {
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
    const walkable = this.couldBePath;
    const relevant = this.mustBePath;

    const model = this.model!;
    const graph = this.graph!;
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

      while (true) {
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
              let isRelevant = relevant != null && relevant[u];
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
              let neighbours = graph.neighbours[u];
              let neighbourIndex = frame.neighbourIndex;
              if (neighbourIndex >= neighbours.length) {
                // Exit loop
                switchState = 3;
                loop = true;
                break;
              }
              let v = neighbours[neighbourIndex];
              if (!walkable[v]) {
                // continue to next iteration of loop
                frame.neighbourIndex = neighbourIndex + 1;
                switchState = 1;
                loop = true;
                break;
              }

              // v is a neighbour of u
              let unvisited = dfsNum[v] === 0;
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
              let neighbours = graph.neighbours[u];
              let neighbourIndex = frame.neighbourIndex;
              let v = neighbours[neighbourIndex];

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
          let markupW: number[] = walkable
            .map<[boolean, number]>((v, i) => [v, i])
            .filter(a => a[0])
            .map(a => a[1]);
          model.graphics(markupW);
          console.warn("visited");
          model.graphics(markup);

          const w = model.FMX;
          let x = i % w, y = Math.floor(i / w);
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

      let childCount = cutVertex(i);
      // The root of the tree is an exception to CutVertex's calculations
      // It's an articulation point if it has multiple children
      // as removing it would give multiple subtrees.
      isArticulation[i] = childCount > 1;
    }

    return isArticulation;
  }

  private createGraph(): SimpleGraph {
    const model = this.model!;
    let nodeCount = model.FMX * model.FMY;
    let neighbours: number[][] = [];
    for (let i = 0; i < nodeCount; i++) {
      neighbours[i] = [];

      let x = i % model.FMX, y = Math.floor(i / model.FMX);

      for (let direction = 0; direction < 4; direction++) {
        let dx = Model.DX[direction], dy = Model.DY[direction];
        let sx = x + dx, sy = y + dy;
        if (!model.periodic && (sx >= model.FMX || sy >= model.FMY || sx < 0 || sy < 0)) {
          continue;
        }

        if (sx < 0) sx += model.FMX;
        else if (sx >= model.FMX) sx -= model.FMX;
        if (sy < 0) sy += model.FMY;
        else if (sy >= model.FMY) sy -= model.FMY;

        let s = sx + sy * model.FMX;

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

export class RoomConstraint implements Constraint {
  private readonly tunnelingOptions: TunnelingOptions;
  private readonly isRoomCell: boolean[] = [];
  private readonly denyOther: boolean;

  private model: EvenSimpleTiledModel | null = null;

  constructor(isRoomCell: boolean[], denyOther: boolean, tunneling: TunnelingOptions) {
    this.isRoomCell = isRoomCell;
    this.denyOther = denyOther;
    this.tunnelingOptions = tunneling;
  }

  init(model: EvenSimpleTiledModel): void {
    this.model = model;
  }

  onClear(): void {
    const model = this.model!;
    const tunneling = new TunnelingAlgorithm(model.rng, model.FMX, model.FMY, this.tunnelingOptions);
    tunneling.generate();

    const isRoom = buffer(model.FMX * model.FMY, false);

    for (const room of tunneling.rooms) {
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          isRoom[x + y * model.FMX] = true;
        }
      }
    }

    for (let i = 0; i < isRoom.length; i++) {
      for (let t = 0; t < model.T; t++) {
        if (isRoom[i]) {
          if (!this.isRoomCell[t]) {
            model.ban(i, t);
          }
        } else if (this.denyOther) {
          if (this.isRoomCell[t]) {
            model.ban(i, t);
          }
        }
      }
    }
  }

  check(): void {
  }

  onBacktrack(_index: number, _pattern: number): void {
  }

  onBan(_index: number, _pattern: number): void {
  }
}

export class EvenSimpleTiledModelTest {
  static async test(resources: Resources): Promise<void> {
    const loader = new PIXI.Loader();
    loader.add("village.rules.json");
    await new Promise((resolve) => loader.load(() => resolve()));

    const tileset: TilesetRules = loader.resources["village.rules.json"].data!;

    console.log("tileset", tileset);

    const filter = (regex: RegExp) => {
      const tiles: boolean[] = tileset.tiles.map(t => !!t.match(regex));
      return tileset.cells.map(cell => {
        const [f, w] = cell;
        return f >= 0 && tiles[f]! && w === -1;
      });
    };

    const borderCells = filter(/^grass_\d+\.png$/);
    const pathCells = filter(/^road_\d+\.png$/);
    const roomCells = filter(/^wood_floor_\d+\.png$/);

    console.log("borderCells", borderCells);
    console.log("pathCells", pathCells);
    console.log("roomCells", roomCells);

    const model = new EvenSimpleTiledModel(resources, tileset, new RNG(), 50, 50, [
      new BorderConstraint(borderCells),
      new RoomConstraint(roomCells, true, {
        room_max_w: 7,
        room_max_h: 5,
        max_corr_dist: 20,
        min_corr_dist_x: 5,
        min_corr_dist_y: 10,
      }),
      new PathConstraint(pathCells),
    ]);
    console.time("model loop run");
    let state;
    while (true) {
      console.time("model run");
      state = await model.run(10000);
      console.timeEnd("model run");
      if (state !== Resolution.Decided) {
        console.error("failed run model");
      } else {
        console.log("success run model");
        break;
      }
    }
    console.timeEnd("model loop run");
    console.log("model", model);
    model.graphics([]);
  }
}