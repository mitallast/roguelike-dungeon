export class FiniteStateMachine<StateType extends keyof any> {
  private readonly _states: Record<StateType, FiniteState<StateType>>;
  private readonly _initial: StateType;
  private _current: StateType;

  constructor(initial: StateType, states: StateType[]) {
    const builder: Partial<Record<StateType, FiniteState<StateType>>> = {};
    for (const state of states) {
      builder[state] = new FiniteState();
    }
    this._states = builder as Record<StateType, FiniteState<StateType>>;
    this._initial = initial;
    this._current = this._initial;
  }

  get isFinal(): boolean {
    return this._states[this._current].isFinal;
  }

  get current(): StateType {
    return this._current;
  }

  state(state: StateType): FiniteState<StateType> {
    return this._states[state];
  }

  start(): void {
    this._current = this._initial;
    this._states[this._current].enter();
    this.transition();
  }

  update(deltaTime: number): void {
    this._states[this._current].update(deltaTime);
    this.transition();
  }

  handle(event: any): void {
    this._states[this._current].handle(event);
    this.transition();
  }

  private transition(): void {
    for (; ;) {
      const next = this._states[this._current].transition();
      if (next !== null) {
        this._states[this._current].exit();
        this._current = next;
        this._states[this._current].enter();
      } else {
        break;
      }
    }
  }
}

export class FiniteState<StateType extends keyof any> {
  private readonly _onEnter: (() => void)[] = [];
  private readonly _onUpdate: ((deltaTime: number) => void)[] = [];
  private readonly _onEvent: ((event: any) => void)[] = [];
  private readonly _onExit: (() => void)[] = [];
  private readonly _transitions: FiniteStateTransition<StateType>[] = [];

  get isFinal(): boolean {
    return this._transitions.length === 0;
  }

  onEnter(listener: () => void): FiniteState<StateType> {
    this._onEnter.push(listener);
    return this;
  }

  onUpdate(listener: (deltaTime: number) => void): FiniteState<StateType> {
    this._onUpdate.push(listener);
    return this;
  }

  onEvent(listener: (event: any) => void): FiniteState<StateType> {
    this._onEvent.push(listener);
    return this;
  }

  onExit(listener: () => void): FiniteState<StateType> {
    this._onExit.push(listener);
    return this;
  }

  transitionTo(state: StateType): FiniteStateTransition<StateType> {
    const transition = new FiniteStateTransition<StateType>(state);
    this._transitions.push(transition);
    return transition;
  }

  enter(): void {
    for (const action of this._onEnter) {
      action();
    }
  }

  update(deltaTime: number): void {
    for (const action of this._onUpdate) {
      action(deltaTime);
    }
  }

  exit(): void {
    for (const action of this._onExit) {
      action();
    }
  }

  handle(event: any): void {
    for (const action of this._onEvent) {
      action(event);
    }
  }

  transition(): StateType | null {
    for (const transition of this._transitions) {
      if (transition.check()) {
        transition.perform();
        return transition.to;
      }
    }
    return null;
  }
}

export class FiniteStateTransition<StateType extends keyof any> {
  private readonly _conditions: (() => boolean)[] = [];
  private readonly _actions: (() => void)[] = [];

  readonly to: StateType;

  constructor(to: StateType) {
    this.to = to;
  }

  condition(condition: () => boolean): FiniteStateTransition<StateType> {
    this._conditions.push(condition);
    return this;
  }

  action(action: () => void): FiniteStateTransition<StateType> {
    this._actions.push(action);
    return this;
  }

  check(): boolean {
    for (const condition of this._conditions) {
      if (!condition()) {
        return false;
      }
    }
    return true;
  }

  perform(): void {
    for (const action of this._actions) {
      action();
    }
  }
}
