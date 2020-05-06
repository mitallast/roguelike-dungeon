import {HeroController} from "./Hero";
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

export class MonsterAlarmEvent {
  constructor(readonly hero: HeroController) {
  }
}

export class CharacterIdleState implements CharacterState {
  private readonly _fsm: CharacterStateMachine;
  private readonly _controller: CharacterController;
  private readonly _animator: Animator;

  constructor(fsm: CharacterStateMachine, controller: CharacterController) {
    this._fsm = fsm;
    this._controller = controller;
    this._animator = new Animator(this._controller.view);
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
  private _startX: number = 0;
  private _startY: number = 0;
  private _finishX: number = 0;
  private _finishY: number = 0;

  constructor(fsm: CharacterStateMachine, controller: CharacterController) {
    this._fsm = fsm;
    this._controller = controller;
    this._animator = new Animator(this._controller.view);
  }

  setDestination(x: number, y: number): void {
    this._finishX = x;
    this._finishY = y;
  }

  onEnter(): void {
    this._startX = this._controller.x;
    this._startY = this._controller.y;

    const character = this._controller.character;
    const speed = character.speed * 0.2;
    this._animator.clear();
    this._animator.animateCharacter(speed, character.name + "_run", 4);
    this._animator.animateMove(speed, this._startX, this._startY, this._finishX, this._finishY);
    const weapon = character.weapon;
    if (weapon) {
      this._animator.animateWeapon(speed, weapon.animations.run);
    }
    this._animator.start();
    this._controller.dungeon.set(this._finishX, this._finishY, this._controller);
  }

  onUpdate(deltaTime: number): void {
    this._animator.update(deltaTime);
    if (!this._animator.isPlaying) {
      this._controller.dungeon.remove(this._startX, this._startY, this._controller);
      this._controller.dungeon.remove(this._finishX, this._finishY, this._controller);
      this._controller.setPosition(this._finishX, this._finishY);
      this._fsm.onFinished();
    }
  }

  onExit(): void {
    if (this._animator.isPlaying) {
      console.log("clear map on exit");
      this._animator.stop();
      this._controller.dungeon.remove(this._startX, this._startY, this._controller);
      this._controller.dungeon.remove(this._finishX, this._finishY, this._controller);
      this._controller.setPosition(this._startX, this._startY);
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

export class CharacterHitState implements CharacterState {
  private readonly _fsm: CharacterStateMachine;
  private readonly _controller: CharacterController;
  private readonly _hitController: CharacterHitController;
  private readonly _animator: Animator;
  private _combo: readonly WeaponAnimation[] | null = null;
  private _comboHits: number = 0;
  private _comboSpeed: number = 0;

  constructor(fsm: CharacterStateMachine, controller: CharacterController, hitController: CharacterHitController) {
    this._fsm = fsm;
    this._controller = controller;
    this._hitController = hitController;
    this._animator = new Animator(this._controller.view);
  }

  onEnter(): void {
    const character = this._controller.character;
    const speed = character.speed * 0.2;
    this._animator.clear();
    this._animator.animateCharacter(speed, character.name + "_idle", 4);
    const weapon = character.weapon;
    if (weapon) {
      const combo = weapon.animations.combo;
      if (combo) {
        this._combo = combo;
        this._comboHits = 0;
        this._comboSpeed = speed;
        this._animator.animateWeapon(speed, combo[0]);
        this._hitController.onComboStarted();
      } else {
        this._animator.animateWeapon(speed, weapon.animations.hit);
      }
    }
    this._animator.start();
  }

  private nextCombo(): void {
    const speed = this._comboSpeed;
    const character = this._controller.character;
    this._animator.clear();
    this._animator.animateCharacter(speed, character.name + "_idle", 4);
    this._animator.animateWeapon(speed, this._combo![this._comboHits]);
    this._animator.start();
  }

  onUpdate(deltaTime: number): void {
    this._animator.update(deltaTime);

    if (!this._animator.isPlaying) {
      if (this._combo) {
        this._comboHits++;
        this._hitController.onComboHit(this._comboHits);

        if (this._comboHits < this._combo.length && this._hitController.continueCombo()) {
          console.log("next combo!");
          this.nextCombo();
        } else {
          this._hitController.onComboFinished();
          this._combo = [];
          this._comboHits = 0;
          this._comboSpeed = 0;
          this._fsm.onFinished();
        }
      } else {
        this._hitController.onHit();
        this._fsm.onFinished();
      }
    }
  }

  onExit(): void {
    this._animator.stop();
  }
}