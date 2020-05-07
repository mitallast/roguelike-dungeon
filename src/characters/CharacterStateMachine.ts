import {CharacterController} from "./Character";
import {Animator} from "./Animator";
import {WeaponAnimation} from "../drop";

export interface CharacterStateMachine {
  start(): void;
  stop(): void;
  onFinished(): void;
  onEvent(event: any): void;
  onUpdate(deltaTime: number): void;
}

export interface CharacterState {
  onEnter(): void;
  onExit(): void;
  onUpdate(deltaTime: number): void;
}

export class CharacterIdleState implements CharacterState {
  private readonly _fsm: CharacterStateMachine;
  private readonly _controller: CharacterController;
  private readonly _animator: Animator;

  constructor(fsm: CharacterStateMachine, controller: CharacterController) {
    this._fsm = fsm;
    this._controller = controller;
    this._animator = controller.animator;
  }

  onEnter(): void {
    const character = this._controller.character;
    const speed = character.speed * 0.2;
    this._animator.clear();
    this._animator.animateCharacter(speed, character.name + "_idle", 4);
    const weapon = character.weapon;
    if (weapon) {
      this._animator.animateWeapon(speed, weapon.animations.idle);
    }
    this._animator.start();
  }

  onUpdate(deltaTime: number): void {
    this._animator.update(deltaTime);
    if (!this._animator.isPlaying) {
      this._fsm.onFinished();
    }
  }

  onExit(): void {
    this._animator.stop();
  }
}

export class CharacterRunState implements CharacterState {
  private readonly _fsm: CharacterStateMachine;
  private readonly _controller: CharacterController;
  private readonly _animator: Animator;

  constructor(fsm: CharacterStateMachine, controller: CharacterController) {
    this._fsm = fsm;
    this._controller = controller;
    this._animator = new Animator(this._controller.view);
  }

  onEnter(): void {
    if (!this._controller.hasDestination()) {
      this._fsm.onFinished();
    }

    const character = this._controller.character;
    const speed = character.speed * 0.2;
    this._animator.clear();
    this._animator.animateCharacter(speed, character.name + "_run", 4);
    this._animator.animateMove(speed, this._controller);
    const weapon = character.weapon;
    if (weapon) {
      this._animator.animateWeapon(speed, weapon.animations.run);
    }
    this._animator.start();
  }

  onUpdate(deltaTime: number): void {
    this._animator.update(deltaTime);
    if (!this._animator.isPlaying) {
      this._controller.moveToDestination();
      this._fsm.onFinished();
    }
  }

  onExit(): void {
    if (this._animator.isPlaying) {
      this._animator.stop();
      this._controller.resetDestination();
    }
  }
}

export interface CharacterHitController {
  onHit(): void;

  onComboStarted(): void;
  onComboHit(combo: number): void;
  onComboFinished(): void;

  continueCombo(): boolean;
}

export class CharacterHitState implements CharacterStateMachine, CharacterState {
  private readonly _fsm: CharacterStateMachine;
  private readonly _controller: CharacterController;
  private readonly _simple: CharacterSimpleHitState;
  private readonly _combo: CharacterComboHitState;

  private _currentState: CharacterSimpleHitState | CharacterComboHitState;

  constructor(fsm: CharacterStateMachine, controller: CharacterController, hitController: CharacterHitController) {
    this._fsm = fsm;
    this._controller = controller;
    this._simple = new CharacterSimpleHitState(this, controller, hitController);
    this._combo = new CharacterComboHitState(this, controller, hitController);
    this._currentState = this._simple;
  }

  // fsm

  start(): void {
  }

  stop(): void {
    this._currentState.onExit();
  }

  onFinished(): void {
    this._fsm.onFinished();
  }

  onUpdate(deltaTime: number): void {
    this._currentState.onUpdate(deltaTime);
  }

  onEvent(_: any): void {
  }

  // state

  onEnter(): void {
    const weapon = this._controller.character.weapon;
    if (weapon && weapon.animations.combo) {
      this._currentState = this._combo;
    } else {
      this._currentState = this._simple;
    }
    this._currentState.onEnter();
  }

  onExit(): void {
  }
}

export class CharacterSimpleHitState implements CharacterState {
  private readonly _fsm: CharacterHitState;
  private readonly _controller: CharacterController;
  private readonly _hitController: CharacterHitController;
  private readonly _animator: Animator;

  constructor(fsm: CharacterHitState, controller: CharacterController, hitController: CharacterHitController) {
    this._fsm = fsm;
    this._controller = controller;
    this._hitController = hitController;
    this._animator = new Animator(this._controller.view);
  }

  onEnter(): void {
    const character = this._controller.character;
    const weapon = character.weapon;
    this._animator.clear();
    if (weapon) {
      const speed = weapon.speed * 0.2;
      this._animator.animateCharacter(speed, character.name + "_idle", 4);
      this._animator.animateWeapon(speed, weapon.animations.hit);
    } else {
      const speed = character.speed * 0.2;
      this._animator.animateCharacter(speed, character.name + "_idle", 4);
    }
    this._animator.start();
  }

  onUpdate(deltaTime: number): void {
    this._animator.update(deltaTime);
    if (!this._animator.isPlaying) {
      this._hitController.onHit();
      this._fsm.onFinished();
    }
  }

  onExit(): void {
    this._animator.stop();
  }
}

export class CharacterComboHitState implements CharacterState {
  private readonly _fsm: CharacterHitState;
  private readonly _controller: CharacterController;
  private readonly _hitController: CharacterHitController;
  private readonly _animator: Animator;
  private _combo: readonly WeaponAnimation[] = [];
  private _hits: number = 0;
  private _speed: number = 0;

  constructor(fsm: CharacterHitState, controller: CharacterController, hitController: CharacterHitController) {
    this._fsm = fsm;
    this._controller = controller;
    this._hitController = hitController;
    this._animator = new Animator(this._controller.view);
  }

  onEnter(): void {
    const character = this._controller.character;
    const weapon = character.weapon!;
    this._hits = 0;
    this._speed = weapon.speed * 0.2;
    this._animator.clear();
    this._animator.animateCharacter(this._speed, character.name + "_idle", 4);
    this._combo = weapon.animations.combo!;
    this._animator.animateWeapon(this._speed, this._combo[0]);
    this._hitController.onComboStarted();
    this._animator.start();
  }

  onUpdate(deltaTime: number): void {
    this._animator.update(deltaTime);
    if (!this._animator.isPlaying) {
      this._hits++;
      this._hitController.onComboHit(this._hits);
      if (this._hits < this._combo.length && this._hitController.continueCombo()) {
        this._animator.clear();
        this._animator.animateCharacter(this._speed, this._controller.character.name + "_idle", 4);
        this._animator.animateWeapon(this._speed, this._combo![this._hits]);
        this._animator.start();
      } else {
        this._hitController.onComboFinished();
        this._fsm.onFinished();
      }
    }
  }

  onExit(): void {
    this._animator.stop();
  }
}