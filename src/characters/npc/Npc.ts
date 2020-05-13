import {Character, IdleState} from "../Character";
import {DungeonMap, DungeonZIndexes} from "../../dungeon";
import {Hero} from "../hero";
import {FiniteStateMachine} from "../../fsm";
import {NpcState} from "./NpcState";

export class Npc extends Character {
  readonly state: NpcState;

  constructor(state: NpcState, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      x: x,
      y: y,
      width: state.width,
      height: state.height,
      static: false,
      interacting: true,
      animation: state.name + "_idle",
      zIndex: DungeonZIndexes.character
    });

    this.state = state;

    this.init();
  }

  protected onDead(): void {
    this.destroy();
  }

  protected onKilledBy(_: Character): void {
  }

  interact(hero: Hero): void {
    this.lookAt(hero);
    this._dungeon.controller.showDialog(hero.state, this.state);
  }

  protected fsm(): FiniteStateMachine<any> {
    const fsm = this.idle();
    fsm.state(IdleState.COMPLETE)
      .transitionTo(IdleState.PLAY)
      .action(() => "npc idle complete");
    return fsm;
  }
}