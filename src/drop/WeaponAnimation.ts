/* eslint-disable @typescript-eslint/camelcase */

import {AnimationEvent, AnimationKeyFrame} from "../animation";

export interface WeaponAnimation {
  readonly angle: AnimationKeyFrame<[number]>[];
  readonly pos: AnimationEvent<[number, number]>[];
}

export interface WeaponAnimationSet {
  readonly idle: WeaponAnimation;
  readonly run: WeaponAnimation;
  readonly hit: WeaponAnimation;
}

export interface WeaponAnimations {
  readonly knife: WeaponAnimationSet;
  readonly rusty_sword: WeaponAnimationSet;
  readonly regular_sword: WeaponAnimationSet;
  readonly red_gem_sword: WeaponAnimationSet;
  readonly hammer: WeaponAnimationSet;
  readonly big_hammer: WeaponAnimationSet;
  readonly baton_with_spikes: WeaponAnimationSet;
  readonly mace: WeaponAnimationSet;
  readonly katana: WeaponAnimationSet;
  readonly saw_sword: WeaponAnimationSet;
  readonly anime_sword: WeaponAnimationSet;
  readonly axe: WeaponAnimationSet;
  readonly machete: WeaponAnimationSet;
  readonly cleaver: WeaponAnimationSet;
  readonly duel_sword: WeaponAnimationSet;
  readonly knight_sword: WeaponAnimationSet;
  readonly golden_sword: WeaponAnimationSet;
  readonly lavish_sword: WeaponAnimationSet;
}

export const basic: WeaponAnimationSet = {
  idle: {
    angle: [
      {time: 0, args: [0]},
    ],
    pos: [
      {time: 0, args: [-1, 0]},
      {time: 1, args: [-1, 1]},
      {time: 2, args: [-1, 2]},
      {time: 3, args: [-1, 1]},
    ]
  },
  run: {
    angle: [
      {time: 0, args: [0]}
    ],
    pos: [
      {time: 0, args: [-1, -1]},
      {time: 1, args: [-1, -2]},
      {time: 2, args: [-1, -1]},
      {time: 3, args: [-1, 0]},
    ]
  },
  hit: {
    angle: [
      {time: 0, args: [0]},
      {time: 1.5, args: [-30]},
      {time: 2, args: [120]},
      {time: 3, args: [90]},
      {time: 4, args: [0]},
    ],
    pos: [
      {time: 0, args: [-1, 0]},
      {time: 1, args: [-1, 0]},
      {time: 2, args: [-1, 0]},
      {time: 3, args: [-1, 0]},
    ]
  },
};

export const weaponAnimations: WeaponAnimations = {
  knife: {
    idle: basic.idle,
    run: basic.run,
    hit: {
      angle: [
        {time: 0, args: [90]},
      ],
      pos: [
        {time: 0, args: [-8, -4]},
        {time: 1, args: [-4, -4]},
        {time: 2, args: [4, -4]},
        {time: 3, args: [-2, -4]},
      ]
    },
  },
  rusty_sword: basic,
  regular_sword: basic,
  red_gem_sword: basic,
  hammer: basic,
  big_hammer: basic,
  baton_with_spikes: basic,
  mace: basic,
  katana: basic,
  saw_sword: basic,
  anime_sword: basic,
  axe: basic,
  machete: basic,
  cleaver: basic,
  duel_sword: basic,
  knight_sword: basic,
  golden_sword: basic,
  lavish_sword: basic,
};