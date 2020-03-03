// @ts-ignore
import * as PIXI from 'pixi.js';

export enum Heuristic {Manhattan = 0, Euclidean = 1, Chebyshev = 2, Octile = 3}

class Node {
  parent: Node;
  position: PIXI.Point;

  g: number = 0;
  h: number = 0;
  f: number = 0;

  constructor(parent: Node, position: PIXI.Point) {
    this.parent = parent;
    this.position = position;
  }

  equal(other: Node): boolean {
    return this.position.equals(other.position);
  }
}

// classic A* path finding
export class PathFinding {
  private readonly width: number;
  private readonly height: number;
  private readonly map: number[][] = []; // x => y

  private readonly heuristic: Heuristic;
  private readonly weight: number = 1;

  private readonly includeStart: boolean;
  private readonly includeEnd: boolean;
  private readonly diagonalAllowed: boolean;

  constructor(width: number,
              height: number,
              diagonalAllowed: boolean = true,
              includeStart: boolean = false,
              includeEnd: boolean = false,
              heuristic: Heuristic = Heuristic.Chebyshev,
              weight: number = 1) {
    this.width = width;
    this.height = height;
    this.diagonalAllowed = diagonalAllowed;
    this.includeStart = includeStart;
    this.includeEnd = includeEnd;
    this.heuristic = heuristic;
    this.weight = weight;
    for (let x = 0; x < width; x++) {
      const row: number[] = [];
      this.map.push(row);
      for (let y = 0; y < height; y++) {
        row.push(1);
      }
    }
  }

  clear(x: number, y: number): void {
    this.map[x][y] = 0;
  }

  mark(x: number, y: number): void {
    this.map[x][y] = 1;
  }

  find(start: PIXI.Point, end: PIXI.Point): PIXI.Point[] {

    // Create start and end node
    let start_node = new Node(null, start);
    let end_node = new Node(null, end);

    // Initialize both open and closed list
    let open_list: Node[] = [];
    let closed_list: Node[] = [];

    // Add the start node
    open_list.push(start_node);

    // Loop until you find the end
    while (open_list.length > 0) {
      // Get the current node
      let current_node = open_list[0];
      let current_index = 0;
      for (let i = 1; i < open_list.length; i++) {
        let item = open_list[i];
        if (item.f < current_node.f) {
          current_node = item;
          current_index = i;
        }
      }

      // Pop current off open list, add to closed list
      open_list.splice(current_index, 1);
      closed_list.push(current_node);

      // Found the goal
      if (current_node.equal(end_node)) {
        const path: PIXI.Point[] = [];
        let current: Node;
        if (this.includeEnd) {
          current = current_node;
        } else {
          current = current_node.parent;
        }
        while (current.parent !== null) {
          path.push(current.position);
          current = current.parent;
        }
        if (this.includeStart) {
          path.push(current.position);
        }
        return path.reverse();
      }

      // Generate children
      const children: Node[] = [];
      const squares = this.diagonalAllowed ? PathFinding.adjacentSquaresDiagonal : PathFinding.adjacentSquares;

      for (let i = 0; i < squares.length; i++) {
        let new_position = squares[i];
        // Get node position
        let node_position = new PIXI.Point(current_node.position.x + new_position.x, current_node.position.y + new_position.y);

        // Make sure within range
        if (node_position.x >= this.width || node_position.x < 0 ||
          node_position.y >= this.height || node_position.y < 0) {
          continue;
        }

        // Make sure walkable terrain
        if (this.map[node_position.x][node_position.y] != 0) {
          continue;
        }

        // Create new node
        let new_node = new Node(current_node, node_position);

        // Append
        children.push(new_node);
      }

      // Loop through children
      for (let i = 0; i < children.length; i++) {
        let child = children[i];

        // Child is on the closed list
        if (closed_list.find(c => c.equal(child)) != null) {
          continue;
        }

        // Create the f, g, and h values
        child.g = current_node.g + 1;
        child.h = this.heuristicFunction(child.position, end_node.position);
        child.f = child.g + child.h;

        // Child is already in the open list
        if (open_list.find(c => c.equal(child)) != null) {
          continue;
        }

        open_list.push(child);
      }
    }

    return [];
  }

  private heuristicFunction(
    pos0: PIXI.Point,
    pos1: PIXI.Point,
  ): number {
    let dx = Math.abs(pos1.x - pos0.x);
    let dy = Math.abs(pos1.y - pos0.y);

    switch (this.heuristic) {
      case Heuristic.Manhattan:
        /**
         * Calculate the Manhatten distance.
         * Generally: Overestimates distances because diagonal movement not taken into accout.
         * Good for a 4-connected grid (diagonal movement not allowed)
         */
        return (dx + dy) * this.weight;
      case Heuristic.Euclidean:
        /**
         * Calculate the Euclidean distance.
         * Generally: Underestimates distances, assuming paths can have any angle.
         * Can be used f.e. when units can move at any angle.
         */
        return Math.sqrt(dx * dx + dy * dy) * this.weight;
      case Heuristic.Chebyshev:
        /**
         * Calculate the Chebyshev distance.
         * Should be used when diagonal movement is allowed.
         * D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy)
         * D = 1 and D2 = 1
         * => (dx + dy) - Math.min(dx, dy)
         * This is equivalent to Math.max(dx, dy)
         */
        return Math.max(dx, dy) * this.weight;
      case Heuristic.Octile:
        /**
         * Calculate the Octile distance.
         * Should be used on an 8-connected grid (diagonal movement allowed).
         * D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy)
         * D = 1 and D2 = sqrt(2)
         * => (dx + dy) - 0.58 * Math.min(dx, dy)
         */
        return (dx + dy - 0.58 * Math.min(dx, dy)) * this.weight;
    }
  }

  private static adjacentSquares: PIXI.Point[] = [
    new PIXI.Point(0, -1),
    new PIXI.Point(0, 1),
    new PIXI.Point(-1, 0),
    new PIXI.Point(1, 0),
  ];

  private static adjacentSquaresDiagonal: PIXI.Point[] = [
    new PIXI.Point(0, -1),
    new PIXI.Point(0, 1),
    new PIXI.Point(-1, 0),
    new PIXI.Point(1, 0),
    new PIXI.Point(-1, -1),
    new PIXI.Point(-1, 1),
    new PIXI.Point(1, -1),
    new PIXI.Point(1, 1)
  ];
}