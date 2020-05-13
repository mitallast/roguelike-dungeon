import {AnimationEvent} from "../animation";

export interface WeaponAnimation {
  readonly smoothly: boolean;
  readonly angle: readonly AnimationEvent<[number]>[];
  readonly pos: readonly AnimationEvent<[number, number]>[];
}

export interface WeaponAnimationSet {
  readonly idle: WeaponAnimation;
  readonly run: WeaponAnimation;
  readonly hit: WeaponAnimation[];
}