import {Rect} from "./geometry";
// @ts-ignore
import * as PIXI from 'pixi.js';

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

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    for (let x = 0; x < width; x++) {
      const row: number[] = [];
      this.map.push(row);
      for (let y = 0; y < height; y++) {
        row.push(1);
      }
    }
  }

  clearRect(rect: Rect): void {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      for (let y = rect.y; y < rect.y + rect.h; y++) {
        this.map[x][y] = 0;
      }
    }
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
        let current = current_node;
        while (current != null) {
          path.push(current.position);
          current = current.parent;
        }
        return path.reverse();
      }

      // Generate children
      const children: Node[] = [];
      for (let i = 0; i < PathFinding.adjacentSquares.length; i++) {
        let new_position = PathFinding.adjacentSquares[i];
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
        child.h = ((child.position.x - end_node.position.x) ^ 2) + ((child.position.y - end_node.position.y) ^ 2);
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

  private static adjacentSquares: PIXI.Point[] = [
    new PIXI.Point(0, -1),
    new PIXI.Point(0, 1),
    new PIXI.Point(-1, 0),
    new PIXI.Point(1, 0),
    // uncomment if monsters can walk diagonally
    // new PIXI.Point(-1, -1),
    // new PIXI.Point(-1, 1),
    // new PIXI.Point(1, -1),
    // new PIXI.Point(1, 1)
  ];
}