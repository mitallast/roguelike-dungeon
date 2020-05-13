import * as PIXI from "pixi.js";
import {Resources} from "../resources";
import {CharacterView} from "./CharacterView";
import {Animator} from "./Animator";
import {Weapon, WeaponAnimation, WeaponManager} from "../weapon";
import {AnimationEventFrame} from "../animation";

export class AnimationEditor {
  private readonly app: PIXI.Application;
  private readonly resources: Resources;
  private readonly weaponManager: WeaponManager;
  private readonly view: CharacterView;
  private readonly animator: Animator;

  private readonly angleEditor: AnimationClipEditor;
  private readonly xEditor: AnimationClipEditor;
  private readonly yEditor: AnimationClipEditor;
  private readonly weaponEditor: HTMLTextAreaElement;

  private weaponAnimationQueue: WeaponAnimation[] = [];
  private weapon: Weapon;

  constructor(resources: Resources, weaponManager: WeaponManager) {
    this.app = new PIXI.Application({
      width: 1100,
      height: 800,
      resolution: 1,
      sharedTicker: false,
      sharedLoader: false
    });
    this.app.renderer.backgroundColor = 0xFFFFFF;
    this.app.ticker.start();

    this.resources = resources;
    this.weaponManager = weaponManager;

    const viewContainer = new PIXI.Container();
    viewContainer.position.set(16, 16);
    viewContainer.scale.set(4, 4);
    this.app.stage.addChild(viewContainer);

    const viewBg = new PIXI.Graphics()
      .beginFill(0x707070)
      .drawRect(0, 0, 64, 64)
      .endFill();
    viewContainer.addChild(viewBg);

    this.weapon = this.weaponManager.heroWeapon("rusty_sword");

    this.view = new CharacterView(viewContainer, this.resources, 'knight_f_idle', 1, 1, () => null);
    this.view.setPosition(1, 2);
    this.view.setFrame(0);
    this.view.isLeft = false;
    this.view.weapon.setWeapon(this.weapon);

    this.animator = new Animator(this.view);

    this.angleEditor = new AnimationClipEditor({
      width: 768,
      height: 200,
      duration: 6,
      durationPrecision: 10,
      minValue: -180,
      maxValue: 180,
      valuePrecision: 1,
    });
    this.angleEditor.position.set(288, 16);
    this.app.stage.addChild(this.angleEditor);

    this.xEditor = new AnimationClipEditor({
      width: 768,
      height: 200,
      duration: 6,
      durationPrecision: 10,
      minValue: -16,
      maxValue: 16,
      valuePrecision: 1,
    });
    this.xEditor.position.set(288, 16 + 200 + 16);
    this.app.stage.addChild(this.xEditor);

    this.yEditor = new AnimationClipEditor({
      width: 768,
      height: 200,
      duration: 6,
      durationPrecision: 10,
      minValue: -16,
      maxValue: 16,
      valuePrecision: 1,
    });
    this.yEditor.position.set(288, 16 + 200 + 16 + 200 + 16);
    this.app.stage.addChild(this.yEditor);

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.classList.add("container");
    document.body.prepend(container);

    const left = document.createElement("div");
    left.append(this.app.view);
    this.app.view.style.margin = "16px";
    container.append(left);

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.flexDirection = "column";
    container.append(right);

    this.weaponEditor = document.createElement("textarea");
    this.weaponEditor.style.margin = "16px";
    this.weaponEditor.rows = 20;
    this.weaponEditor.cols = 80;
    this.weaponEditor.value = JSON.stringify(this.weapon.animations.hit, undefined, 4);
    this.weaponEditor.addEventListener("keydown", e => e.stopPropagation());
    this.weaponEditor.addEventListener("keyup", e => e.stopPropagation());
    right.append(this.weaponEditor);

    let currentAnimation = 0;
    const next = document.createElement("button");
    next.style.margin = "16px";
    next.append("Next animation");
    next.addEventListener("click", () => {
      const combo: WeaponAnimation[] | undefined = JSON.parse(this.weaponEditor.value);
      if (combo) {
        currentAnimation = (currentAnimation + 1) % combo.length;
        this.loadAnimation(combo[currentAnimation]);
      }
    });
    right.append(next);

    const play = document.createElement("button");
    play.style.margin = "16px";
    play.append("Play animation");
    play.addEventListener("click", () => {
      const animation = this.getAnimation();
      this.animator.stop();
      this.weaponAnimationQueue.push(animation);
    });
    right.append(play);

    const stop = document.createElement("button");
    stop.style.margin = "16px";
    stop.append("Stop animation");
    stop.addEventListener("click", () => this.stop());
    right.append(stop);

    this.app.ticker.add(this.update, this);
  }

  private loadAnimation(weaponAnimation: WeaponAnimation): void {
    this.angleEditor.removeAll();
    this.xEditor.removeAll();
    this.yEditor.removeAll();

    for (const frame of weaponAnimation.angle) {
      this.angleEditor.addFrame(frame.time, frame.args[0]);
    }
    for (const frame of weaponAnimation.pos) {
      this.xEditor.addFrame(frame.time, frame.args[0]);
      this.yEditor.addFrame(frame.time, frame.args[1]);
    }
  }

  private getAnimation(): WeaponAnimation {
    const angle: AnimationEventFrame<[number]>[] = []
    const pos: AnimationEventFrame<[number, number]>[] = []

    for (const frame of this.angleEditor.frames) {
      angle.push({time: frame.time, args: [frame.value]});
    }
    const xFrames = this.xEditor.frames;
    const yFrames = this.yEditor.frames;
    for (let i = 0; i < xFrames.length; i++) {
      const x = xFrames[i];
      const y = yFrames[i];
      pos.push({
        time: x.time,
        args: [x.value, y.value]
      })
    }

    return {
      smoothly: true,
      angle: angle,
      pos: pos
    };
  }

  private stop(): void {
    this.animator.stop();
    this.weaponAnimationQueue = [];
  }

  private update(deltaTime: number): void {
    const animationSpeed = 0.01;
    this.animator.update(deltaTime);
    if (!this.animator.isPlaying) {
      if (this.weaponAnimationQueue.length > 0) {
        const animation = this.weaponAnimationQueue.shift()!;
        this.animator.clear();
        this.animator.animateCharacter(animationSpeed, "knight_f_idle", 4);
        this.animator.animateWeapon(animationSpeed, animation);

        const lastAngle = animation.angle[animation.angle.length - 1];
        this.animator.animation.addCurveClip((t) => [t * lastAngle.time], lastAngle.time, animationSpeed, this.angleEditor.setCursor, this.angleEditor);
        const lastPos = animation.pos[animation.pos.length - 1];
        this.animator.animation.addCurveClip((t) => [t * lastPos.time], lastPos.time, animationSpeed, this.xEditor.setCursor, this.xEditor);
        this.animator.animation.addCurveClip((t) => [t * lastPos.time], lastPos.time, animationSpeed, this.yEditor.setCursor, this.yEditor);

        this.animator.start();

        // this.angleEditor.removeAll();
        // this.xEditor.removeAll();
        // this.yEditor.removeAll();
        // for (const frame of animation.angle) {
        //   this.angleEditor.addFrame(frame.time, frame.args[0]);
        // }
        // for (const frame of animation.pos) {
        //   this.xEditor.addFrame(frame.time, frame.args[0]);
        //   this.yEditor.addFrame(frame.time, frame.args[1]);
        // }
        this.angleEditor.startCursor();
        this.xEditor.startCursor();
        this.yEditor.startCursor();
      } else {
        this.angleEditor.stopCursor();
        this.xEditor.stopCursor();
        this.yEditor.stopCursor();
        // default animation
        this.animator.clear();
        this.animator.animateCharacter(animationSpeed, "knight_f_idle", 4);
        this.animator.animateWeapon(animationSpeed, this.weapon.animations.idle);
        this.animator.start();
      }
    }
  }
}

class AnimationClipEditor extends PIXI.Container {
  private readonly _width: number;
  private readonly _height: number;

  private readonly _bg: PIXI.Graphics;
  private readonly _curve: PIXI.Graphics;
  private readonly _cursor: PIXI.Graphics;

  private readonly _duration: number;
  private readonly _durationPrecision: number;
  private readonly _minValue: number;
  private readonly _maxValue: number;
  private readonly _valuePrecision: number;

  private readonly _frames: AnimationClipEditorFrame[] = [];

  get frames(): readonly AnimationClipEditorFrame[] {
    return this._frames;
  }

  constructor(options: {
    width: number;
    height: number;

    duration: number;
    durationPrecision: number;

    minValue: number;
    maxValue: number;
    valuePrecision: number;
  }) {
    super();
    this._width = options.width;
    this._height = options.height;

    this._duration = options.duration;
    this._durationPrecision = options.durationPrecision;

    this._minValue = options.minValue;
    this._maxValue = options.maxValue;
    this._valuePrecision = options.valuePrecision;

    this._bg = new PIXI.Graphics();
    this.renderGrid();
    this.addChild(this._bg);

    this._curve = new PIXI.Graphics();
    this.addChild(this._curve);

    this._cursor = new PIXI.Graphics();
    this.renderCursor();
    this.addChild(this._cursor);
  }

  removeAll(): void {
    for (const frame of this._frames) frame.destroy();
    this._frames.splice(0, this._frames.length);
    this.renderCurve();
  }

  normalizeTime(time: number): number {
    return Math.max(0, Math.min(this._duration,
      Math.round(time * this._durationPrecision) / this._durationPrecision
    ));
  }

  normalizeValue(value: number): number {
    return Math.max(this._minValue, Math.min(this._maxValue,
      Math.round(value * this._valuePrecision) / this._valuePrecision
    ));
  }

  timeToX(time: number): number {
    return Math.round(this._width / this._duration * time);
  }

  valueToY(value: number): number {
    const yRange = Math.max(Math.abs(this._minValue), Math.abs(this._maxValue));
    return Math.floor((this._height >> 1) - (this._height >> 1) / yRange * value);
  }

  xToTime(x: number): number {
    return x * this._duration / this._width;
  }

  yToValue(y: number): number {
    const yRange = Math.max(Math.abs(this._minValue), Math.abs(this._maxValue));
    return ((this._height >> 1) - y) * yRange / (this._height >> 1);
  }

  addFrame(time: number, value: number): void {
    const frame = new AnimationClipEditorFrame(this, time, value);
    this._frames.push(frame);
    this.updateFrames();
  }

  setCursor(time: number): void {
    const normalizedTime =
      Math.max(0, Math.min(this._duration,
        Math.round(time * this._durationPrecision) / this._durationPrecision
      ));
    this._cursor.x = Math.round(this._width / this._duration * normalizedTime);
  }

  startCursor(): void {
    this._cursor.x = 0;
    this._cursor.alpha = 1;
  }

  stopCursor(): void {
    this._cursor.x = 0;
    this._cursor.alpha = 1;
  }

  updateFrames(): void {
    this._frames.sort((a, b) => a.time - b.time);
    this.renderCurve();
  }

  private renderGrid(): void {
    const center = this._height >> 1;

    this._bg.clear()
      .lineStyle(0)
      .beginFill(0x707070)
      .drawRect(0, 0, this._width, this._height)
      .endFill()
      .lineStyle(1, 0x505050)
      .moveTo(0, center)
      .lineTo(this._width, center);

    for (let i = 1; i < this._duration * this._durationPrecision; i++) {
      const x = Math.round(this._width / this._duration / this._durationPrecision * i);
      this._bg.lineStyle(1, 0x505050)
        .moveTo(x, center - 10)
        .lineTo(x, center + 10);
    }

    for (let i = 1; i < this._duration * 2; i++) {
      const x = Math.round(this._width / this._duration / 2 * i);
      this._bg.lineStyle(1, 0x505050)
        .moveTo(x, center - 25)
        .lineTo(x, center + 25);
    }

    for (let i = 1; i < this._duration; i++) {
      const x = Math.round(this._width / this._duration * i);
      this._bg.lineStyle(1, 0x505050)
        .moveTo(x, center - 50)
        .lineTo(x, center + 50);
    }
  }

  private renderCurve(): void {
    this._curve
      .clear()
      .lineStyle(1, 0x101010);
    for (let i = 0; i < this._frames.length; i++) {
      const frame = this._frames[i];
      if (i == 0) {
        this._curve.moveTo(frame.x, frame.y);
      } else {
        this._curve.lineTo(frame.x, frame.y);
      }
    }
  }

  private renderCursor(): void {
    this._cursor
      .clear()
      .lineStyle(1, 0x700000)
      .moveTo(0, 0)
      .lineTo(0, this._height);
  }
}

class AnimationClipEditorFrame extends PIXI.Graphics {
  private readonly _editor: AnimationClipEditor;
  private _time: number = 0;
  private _value: number = 0;

  private _drag = false;

  get time(): number {
    return this._time;
  }

  get value(): number {
    return this._value;
  }

  update(time: number, value: number): void {
    this._time = this._editor.normalizeTime(time);
    this._value = this._editor.normalizeValue(value);
    this.position.x = this._editor.timeToX(this._time);
    this.position.y = this._editor.valueToY(this._value);
    this._editor.updateFrames();
  }

  constructor(editor: AnimationClipEditor, time: number, value: number) {
    super();
    this._editor = editor;
    this._editor.addChild(this);
    this.beginFill(0x404040)
      .drawCircle(0, 0, 10)
      .endFill();
    this.update(time, value);

    this.interactive = true;
    this.alpha = 0.5;
    this.on("mouseover", () => this.alpha = 0.7);
    this.on("mouseout", () => this.alpha = 0.5);

    this.on("mousedown", this.dragStart, this);
    this.on("mousemove", this.dragMove, this);
    this.on("mouseup", this.dragStop, this);
  }

  private dragStart(): void {
    this._drag = true;
  }

  private dragStop(): void {
    this._drag = false;
  }

  private dragMove(event: PIXI.interaction.InteractionEvent): void {
    if (this._drag) {
      const pos = event.data.getLocalPosition(this.parent);
      const time = this._editor.xToTime(pos.x);
      const value = this._editor.yToValue(pos.y);
      this.update(time, value);
    }
  }
}