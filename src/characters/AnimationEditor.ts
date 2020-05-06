import {Resources} from "../resources";
import {CharacterView} from "./CharacterView";
import {Animator} from "./Animator";
import {Weapon, WeaponAnimation, weapons} from "../drop";

export class AnimationEditor {
  private readonly app: PIXI.Application;
  private readonly resources: Resources;
  private readonly view: CharacterView;
  private readonly animator: Animator;

  private readonly weaponEditor: HTMLTextAreaElement;
  private weaponAnimationQueue: WeaponAnimation[] = [];

  constructor(resources: Resources) {
    this.app = new PIXI.Application({
      width: 400,
      height: 400,
      resolution: 1,
      sharedTicker: false,
      sharedLoader: false
    });
    this.app.renderer.backgroundColor = 0xFFFFFF;
    const screen = this.app.screen;
    this.app.stage.position.set(screen.width >> 1, screen.height >> 1);
    this.app.stage.scale.set(4, 4);
    this.app.ticker.start();

    this.resources = resources;

    this.view = new CharacterView(this.app.stage, this.resources, 1, 1, () => null);
    this.view.setPosition(0, 0);
    this.view.setSprite("knight_f_idle");
    this.view.setFrame(0);
    this.view.isLeft = false;
    this.view.weapon.setWeapon(new Weapon(weapons.rusty_sword));

    this.animator = new Animator(this.view);

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.classList.add("container");
    document.body.appendChild(container);

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
    this.weaponEditor.value = JSON.stringify(weapons.rusty_sword.animations.combo, undefined, 4);
    this.weaponEditor.addEventListener("keydown", e => e.stopPropagation());
    this.weaponEditor.addEventListener("keyup", e => e.stopPropagation());
    right.append(this.weaponEditor);

    const play = document.createElement("button");
    play.style.margin = "16px";
    play.append("Play animation");
    play.addEventListener("click", () => this.play());
    right.append(play);

    this.app.ticker.add(this.update, this);
  }

  private play(): void {
    const combo: WeaponAnimation[] | undefined = JSON.parse(this.weaponEditor.value);
    if (combo) {
      console.log(combo);
      this.animator.stop();
      this.weaponAnimationQueue = combo;
    }
  }

  private update(deltaTime: number): void {
    const animationSpeed = weapons.rusty_sword.speed;
    this.animator.update(deltaTime);
    if (!this.animator.isPlaying) {
      if (this.weaponAnimationQueue.length > 0) {
        const animation = this.weaponAnimationQueue.shift()!;
        console.log("animation", animation);
        this.animator.clear();
        this.animator.animateCharacter(animationSpeed * 0.2, "knight_f_idle", 4);
        this.animator.animateWeapon(animationSpeed * 0.2, animation);
        this.animator.start();
      } else {
        // default animation
        this.animator.clear();
        this.animator.animateCharacter(animationSpeed * 0.2, "knight_f_idle", 4);
        this.animator.animateWeapon(animationSpeed * 0.2, weapons.rusty_sword.animations.idle);
        this.animator.start();
      }
    }
  }
}