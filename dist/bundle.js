/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/app.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/animation/Animation.ts":
/*!************************************!*\
  !*** ./src/animation/Animation.ts ***!
  \************************************/
/*! exports provided: Animation */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Animation", function() { return Animation; });
/* harmony import */ var _AnimationEventClip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AnimationEventClip */ "./src/animation/AnimationEventClip.ts");
/* harmony import */ var _AnimationKeyFrameClip__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./AnimationKeyFrameClip */ "./src/animation/AnimationKeyFrameClip.ts");
/* harmony import */ var _AnimationCurveClip__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./AnimationCurveClip */ "./src/animation/AnimationCurveClip.ts");



class Animation {
    constructor() {
        this._clips = [];
        this._playing = false;
    }
    get isPlaying() {
        return this._playing;
    }
    add(clip) {
        this._clips.push(clip);
    }
    addEventClip(animationSpeed, method, context) {
        const clip = new _AnimationEventClip__WEBPACK_IMPORTED_MODULE_0__["AnimationEventClip"](animationSpeed, method, context);
        this.add(clip);
        return clip;
    }
    addKeyFrameClip(animationSpeed, method, context) {
        const clip = new _AnimationKeyFrameClip__WEBPACK_IMPORTED_MODULE_1__["AnimationKeyFrameClip"](animationSpeed, method, context);
        this.add(clip);
        return clip;
    }
    addCurveClip(curve, duration, animationSpeed, method, context) {
        const clip = new _AnimationCurveClip__WEBPACK_IMPORTED_MODULE_2__["AnimationCurveClip"](curve, duration, animationSpeed, method, context);
        this.add(clip);
        return clip;
    }
    clear() {
        this.stop();
        this._clips.splice(0, this._clips.length);
    }
    start() {
        this._playing = true;
        for (const clip of this._clips) {
            clip.start();
        }
    }
    stop() {
        this._playing = false;
        for (const clip of this._clips) {
            clip.stop();
        }
    }
    update(deltaTime) {
        let hasPlaying = false;
        for (const clip of this._clips) {
            clip.update(deltaTime);
            if (clip.isPlaying) {
                hasPlaying = true;
            }
        }
        if (!hasPlaying) {
            this.stop();
        }
    }
}


/***/ }),

/***/ "./src/animation/AnimationClip.ts":
/*!****************************************!*\
  !*** ./src/animation/AnimationClip.ts ***!
  \****************************************/
/*! exports provided: AnimationClip */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AnimationClip", function() { return AnimationClip; });
class AnimationClip {
    constructor(animationSpeed) {
        this._time = 0;
        this._playing = false;
        this.animationSpeed = animationSpeed;
    }
    get isPlaying() {
        return this._playing;
    }
    start() {
        this._time = 0;
        this._playing = true;
        this.play();
    }
    stop() {
        this._playing = false;
    }
    update(deltaTime) {
        this._time += this.animationSpeed * deltaTime;
        if (this._playing) {
            this.play();
        }
    }
}


/***/ }),

/***/ "./src/animation/AnimationCurveClip.ts":
/*!*********************************************!*\
  !*** ./src/animation/AnimationCurveClip.ts ***!
  \*********************************************/
/*! exports provided: AnimationCurveClip */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AnimationCurveClip", function() { return AnimationCurveClip; });
/* harmony import */ var _AnimationClip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AnimationClip */ "./src/animation/AnimationClip.ts");

class AnimationCurveClip extends _AnimationClip__WEBPACK_IMPORTED_MODULE_0__["AnimationClip"] {
    constructor(curve, duration, animationSpeed, method, context) {
        super(animationSpeed);
        this._curve = curve;
        this._duration = duration;
        this._method = method;
        this._context = context;
    }
    get duration() {
        return this._duration;
    }
    play() {
        const t = this._time / this._duration;
        if (t >= 1) {
            this._playing = false;
            this._method.call(this._context, ...this._curve(1));
        }
        else {
            this._method.call(this._context, ...this._curve(t));
        }
    }
}


/***/ }),

/***/ "./src/animation/AnimationEventClip.ts":
/*!*********************************************!*\
  !*** ./src/animation/AnimationEventClip.ts ***!
  \*********************************************/
/*! exports provided: AnimationEventClip */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AnimationEventClip", function() { return AnimationEventClip; });
/* harmony import */ var _AnimationClip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AnimationClip */ "./src/animation/AnimationClip.ts");

class AnimationEventClip extends _AnimationClip__WEBPACK_IMPORTED_MODULE_0__["AnimationClip"] {
    constructor(animationSpeed, method, context) {
        super(animationSpeed);
        this._events = [];
        this._event = null;
        this._method = method;
        this._context = context;
    }
    get duration() {
        if (this._events.length > 0) {
            return this._events[this._events.length - 1].time;
        }
        else {
            return 0;
        }
    }
    play() {
        while (this._playing) {
            const next = this._event === null ? 0 : this._event + 1;
            if (next < this._events.length) {
                if (this._events[next].time <= this._time) {
                    this._event = next;
                    this._method.call(this._context, ...this._events[next].args);
                }
                else {
                    break;
                }
            }
            else {
                this._playing = false;
            }
        }
    }
    addEvent(event) {
        this._events.push(event);
        this._events.sort(this.compare);
        return this;
    }
    addEvents(event) {
        this._events.push(...event);
        this._events.sort(this.compare);
        return this;
    }
    add(time, ...args) {
        this.addEvent({ time, args });
        return this;
    }
    compare(a, b) {
        return a.time - b.time;
    }
}


/***/ }),

/***/ "./src/animation/AnimationKeyFrameClip.ts":
/*!************************************************!*\
  !*** ./src/animation/AnimationKeyFrameClip.ts ***!
  \************************************************/
/*! exports provided: AnimationKeyFrameClip */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AnimationKeyFrameClip", function() { return AnimationKeyFrameClip; });
/* harmony import */ var _AnimationClip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AnimationClip */ "./src/animation/AnimationClip.ts");

class AnimationKeyFrameClip extends _AnimationClip__WEBPACK_IMPORTED_MODULE_0__["AnimationClip"] {
    constructor(animationSpeed, method, context) {
        super(animationSpeed);
        this._frames = [];
        this._method = method;
        this._context = context;
    }
    get duration() {
        if (this._frames.length > 0) {
            return this._frames[this._frames.length - 1].time;
        }
        else {
            return 0;
        }
    }
    play() {
        let start = null;
        let end = null;
        for (let i = 0; i < this._frames.length; i++) {
            const frame = this._frames[i];
            if (frame.time <= this._time) {
                start = frame;
            }
            else {
                end = frame;
                break;
            }
        }
        if (start !== null && end !== null) {
            const args = [];
            const total = end.time - start.time;
            const duration = this._time - start.time;
            const base = duration / total;
            for (let i = 0; i < start.args.length; i++) {
                args[i] = start.args[i] * (1 - base) + end.args[i] * base;
            }
            this._method.call(this._context, ...args);
        }
        else if (start !== null) {
            this._method.call(this._context, ...start.args);
            this._playing = false;
        }
        else if (end !== null) {
            this._method.call(this._context, ...end.args);
        }
    }
    addEvent(event) {
        this._frames.push(event);
        this._frames.sort(this.compare);
        return this;
    }
    addEvents(event) {
        this._frames.push(...event);
        this._frames.sort(this.compare);
        return this;
    }
    add(time, ...args) {
        this.addEvent({ time, args });
        return this;
    }
    compare(a, b) {
        return a.time - b.time;
    }
}


/***/ }),

/***/ "./src/animation/SpriteAnimationClip.ts":
/*!**********************************************!*\
  !*** ./src/animation/SpriteAnimationClip.ts ***!
  \**********************************************/
/*! exports provided: SpriteAnimationClip */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SpriteAnimationClip", function() { return SpriteAnimationClip; });
/* harmony import */ var _AnimationClip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AnimationClip */ "./src/animation/AnimationClip.ts");

class SpriteAnimationClip extends _AnimationClip__WEBPACK_IMPORTED_MODULE_0__["AnimationClip"] {
    constructor(sprite) {
        super(sprite.animationSpeed);
        this._sprite = sprite;
    }
    get duration() {
        return this._sprite.totalFrames;
    }
    play() {
        const sprite = this._sprite;
        let currentFrame = Math.floor(this._time) % sprite.totalFrames;
        if (currentFrame < 0) {
            currentFrame += sprite.totalFrames;
        }
        const previousFrame = sprite.currentFrame;
        if (this._time < 0) {
            this.stop();
        }
        else if (this._time >= sprite.totalFrames) {
            this.stop();
        }
        else if (previousFrame !== currentFrame) {
            sprite.gotoAndStop(currentFrame);
        }
    }
}


/***/ }),

/***/ "./src/animation/index.ts":
/*!********************************!*\
  !*** ./src/animation/index.ts ***!
  \********************************/
/*! exports provided: Animation, AnimationClip, AnimationCurveClip, AnimationEventClip, AnimationKeyFrameClip, SpriteAnimationClip */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Animation__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Animation */ "./src/animation/Animation.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Animation", function() { return _Animation__WEBPACK_IMPORTED_MODULE_0__["Animation"]; });

/* harmony import */ var _AnimationClip__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./AnimationClip */ "./src/animation/AnimationClip.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AnimationClip", function() { return _AnimationClip__WEBPACK_IMPORTED_MODULE_1__["AnimationClip"]; });

/* harmony import */ var _AnimationCurveClip__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./AnimationCurveClip */ "./src/animation/AnimationCurveClip.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AnimationCurveClip", function() { return _AnimationCurveClip__WEBPACK_IMPORTED_MODULE_2__["AnimationCurveClip"]; });

/* harmony import */ var _AnimationEventClip__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./AnimationEventClip */ "./src/animation/AnimationEventClip.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AnimationEventClip", function() { return _AnimationEventClip__WEBPACK_IMPORTED_MODULE_3__["AnimationEventClip"]; });

/* harmony import */ var _AnimationKeyFrameClip__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./AnimationKeyFrameClip */ "./src/animation/AnimationKeyFrameClip.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AnimationKeyFrameClip", function() { return _AnimationKeyFrameClip__WEBPACK_IMPORTED_MODULE_4__["AnimationKeyFrameClip"]; });

/* harmony import */ var _SpriteAnimationClip__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./SpriteAnimationClip */ "./src/animation/SpriteAnimationClip.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SpriteAnimationClip", function() { return _SpriteAnimationClip__WEBPACK_IMPORTED_MODULE_5__["SpriteAnimationClip"]; });









/***/ }),

/***/ "./src/app.ts":
/*!********************!*\
  !*** ./src/app.ts ***!
  \********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var pixi_layers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! pixi-layers */ "pixi-layers");
/* harmony import */ var pixi_layers__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(pixi_layers__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var pixi_sound__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! pixi-sound */ "pixi-sound");
/* harmony import */ var pixi_sound__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(pixi_sound__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _scene__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./scene */ "./src/scene.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};




(function () {
    return __awaiter(this, void 0, void 0, function* () {
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;
        PIXI.sound.volumeAll = 0.5;
        const app = new PIXI.Application({
            width: 1200,
            height: 700,
            resolution: 1,
            antialias: false,
        });
        const stage = new PIXI.display.Stage();
        app.stage = stage;
        app.renderer.backgroundColor = 0x000000;
        document.getElementById("container").appendChild(app.view);
        const controller = new _scene__WEBPACK_IMPORTED_MODULE_3__["SceneController"](app, stage);
        yield controller.init();
        controller.keyBind();
    });
})();


/***/ }),

/***/ "./src/bar.view.ts":
/*!*************************!*\
  !*** ./src/bar.view.ts ***!
  \*************************/
/*! exports provided: BarView */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BarView", function() { return BarView; });
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ui */ "./src/ui.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_1__);


const BAR_HEIGHT = 18;
class BarView extends pixi_js__WEBPACK_IMPORTED_MODULE_1__["Container"] {
    constructor(options) {
        super();
        this._color = options.color;
        this._width = options.width || 0;
        this._widthMax = options.widthMax;
        this._rect = new pixi_js__WEBPACK_IMPORTED_MODULE_1__["Graphics"]();
        this._labelCenter = options.labelCenter || false;
        this._label = new pixi_js__WEBPACK_IMPORTED_MODULE_1__["BitmapText"]("", { font: { name: "alagard", size: 16 } });
        this._label.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_1__["Point"](this._labelCenter ? 0.5 : 0, 0.5);
        this._label.position.set((_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder << 1) + (this._labelCenter ? this._widthMax >> 1 : 0), _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder + (BAR_HEIGHT >> 1));
        super.addChild(this._rect, this._label);
    }
    set color(color) {
        this._color = color;
        this.updateRect();
    }
    set width(width) {
        this._width = width;
        this.updateRect();
    }
    set label(text) {
        this._label.text = text;
    }
    set widthMax(widthMax) {
        this._widthMax = widthMax;
        this._label.position.set((_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder << 1) + (this._labelCenter ? this._widthMax >> 1 : 0), _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder + (BAR_HEIGHT >> 1));
        this.updateRect();
    }
    updateRect() {
        this._rect.clear()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiBackground)
            .drawRect(0, 0, this._widthMax + (_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder << 1), BAR_HEIGHT + (_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder << 1))
            .endFill()
            .beginFill(this._color)
            .drawRect(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder, this._width, BAR_HEIGHT)
            .endFill();
    }
}


/***/ }),

/***/ "./src/characters/Animator.ts":
/*!************************************!*\
  !*** ./src/characters/Animator.ts ***!
  \************************************/
/*! exports provided: Animator */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Animator", function() { return Animator; });
/* harmony import */ var _animation__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../animation */ "./src/animation/index.ts");

class Animator {
    constructor(view) {
        this._view = view;
        this._animation = new _animation__WEBPACK_IMPORTED_MODULE_0__["Animation"]();
    }
    animateCharacter(animationSpeed, spriteName, totalFrames) {
        this._animation.addEventClip(animationSpeed, this._view.setSprite, this._view).add(0, spriteName);
        const frames = this._animation.addEventClip(animationSpeed, this._view.setFrame, this._view);
        for (let i = 0; i < totalFrames; i++) {
            frames.add(i, i);
        }
        frames.add(totalFrames, 0);
    }
    animateMove(animationSpeed, controller) {
        this._animation.addKeyFrameClip(animationSpeed, this._view.setPosition, this._view)
            .add(0, controller.x, controller.y)
            .add(4, controller.newX, controller.newY);
    }
    animateWeapon(animationSpeed, animation) {
        const weapon = this._view.weapon;
        this._animation.addKeyFrameClip(animationSpeed, weapon.setAngle, weapon).addEvents(animation.angle);
        if (animation.smoothly) {
            this._animation.addKeyFrameClip(animationSpeed, weapon.setPosition, weapon).addEvents(animation.pos);
        }
        else {
            this._animation.addEventClip(animationSpeed, weapon.setPosition, weapon).addEvents(animation.pos);
        }
    }
    get isPlaying() {
        return this._animation.isPlaying;
    }
    start() {
        this._animation.start();
    }
    update(deltaTime) {
        this._animation.update(deltaTime);
    }
    stop() {
        this._animation.stop();
    }
    clear() {
        this._animation.clear();
    }
}


/***/ }),

/***/ "./src/characters/BossHealthView.ts":
/*!******************************************!*\
  !*** ./src/characters/BossHealthView.ts ***!
  \******************************************/
/*! exports provided: BossHealthView */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BossHealthView", function() { return BossHealthView; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _bar_view__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../bar.view */ "./src/bar.view.ts");
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");



class BossHealthView extends pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"] {
    constructor(boss) {
        super();
        this._isDestroyed = false;
        this._boss = boss;
        const HEALTH_MAX_WIDTH = 550;
        const HEALTH_WIDTH = 4;
        this._pointWidth = Math.min(HEALTH_WIDTH, HEALTH_MAX_WIDTH / this._boss.healthMax.get());
        this._widthMax = Math.floor(this._pointWidth * this._boss.healthMax.get());
        this._health = new _bar_view__WEBPACK_IMPORTED_MODULE_1__["BarView"]({
            color: _ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiRed,
            widthMax: this._widthMax,
            labelCenter: true
        });
        this._health.position.set(-(this._widthMax >> 1), 0);
        this.addChild(this._health);
        this._boss.health.subscribe(this.updateHealth, this);
        this._boss.dead.subscribe(this.updateDead, this);
    }
    destroy() {
        if (!this._isDestroyed) {
            this._isDestroyed = true;
            this._boss.health.unsubscribe(this.updateHealth, this);
            this._boss.dead.unsubscribe(this.updateDead, this);
            this._health.destroy();
            super.destroy();
        }
    }
    updateHealth(health) {
        this._health.width = Math.floor(this._pointWidth * health);
        this._health.label = `${this._boss.name} - ${health}`;
    }
    updateDead(dead) {
        if (dead) {
            this.destroy();
        }
    }
}


/***/ }),

/***/ "./src/characters/BossMonster.ts":
/*!***************************************!*\
  !*** ./src/characters/BossMonster.ts ***!
  \***************************************/
/*! exports provided: bossMonsters, BossMonster, BossMonsterController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bossMonsters", function() { return bossMonsters; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BossMonster", function() { return BossMonster; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BossMonsterController", function() { return BossMonsterController; });
/* harmony import */ var _dungeon__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../dungeon */ "./src/dungeon/index.ts");
/* harmony import */ var _Monster__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Monster */ "./src/characters/Monster.ts");
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");
/* harmony import */ var _drop__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../drop */ "./src/drop/index.ts");
/* harmony import */ var _BossHealthView__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./BossHealthView */ "./src/characters/BossHealthView.ts");
/* harmony import */ var _SpawningMonster__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./SpawningMonster */ "./src/characters/SpawningMonster.ts");
/* harmony import */ var _fsm__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../fsm */ "./src/fsm.ts");







const bossMonsters = [
    {
        name: "big_zombie", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].ZOMBIE, weapons: [
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].anime_sword,
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].baton_with_spikes,
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].big_hammer,
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].cleaver,
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].mace,
        ]
    },
    {
        name: "ogre", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].ORC, weapons: [
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].anime_sword,
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].baton_with_spikes,
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].big_hammer,
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].cleaver,
            _drop__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"].mace,
        ]
    },
    { name: "big_demon", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].DEMON, weapons: [] },
];
class BossMonster extends _Monster__WEBPACK_IMPORTED_MODULE_1__["Monster"] {
    constructor(config, level) {
        super({
            name: config.name,
            category: config.category,
            type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].SUMMON,
            speed: 0.5,
            healthMax: 50 + Math.floor(level * 10),
            level: level,
            luck: 0.9,
            baseDamage: 5 + 0.5 * level,
            xp: 100 + 50 * level,
            spawn: 5,
        });
    }
}
class BossMonsterController extends _SpawningMonster__WEBPACK_IMPORTED_MODULE_5__["SpawningMonsterController"] {
    constructor(config, dungeon, x, y) {
        super(dungeon, {
            width: 2,
            height: 2,
            x: x,
            y: y,
            zIndex: _dungeon__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].character
        });
        this.maxDistance = 7;
        this.character = new BossMonster(config, dungeon.level);
        const weapon = _drop__WEBPACK_IMPORTED_MODULE_3__["Weapon"].select(this.dungeon.rng, config.weapons);
        if (weapon) {
            this.character.inventory.equipment.weapon.set(weapon);
        }
        this._fsm = this.fsm();
        this.init();
        const screen = dungeon.controller.app.screen;
        const healthView = new _BossHealthView__WEBPACK_IMPORTED_MODULE_4__["BossHealthView"](this.character);
        healthView.zIndex = 13;
        healthView.position.set((screen.width >> 1), 64);
        dungeon.controller.stage.addChild(healthView);
    }
    onDead() {
        var _a;
        this.dungeon.controller.showBanner({
            text: this.dungeon.rng.boolean() ? "VICTORY ACHIEVED" : "YOU DEFEATED",
            color: _ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiYellow
        });
        for (let i = 0; i < 9; i++) {
            (_a = this.findDropCell()) === null || _a === void 0 ? void 0 : _a.randomDrop();
        }
        this.destroy();
    }
    fsm() {
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](0, [
            0,
            1,
            2,
        ]);
        const patrolling = this.patrolling();
        const alarm = this.alarm();
        const attack = this.attack();
        fsm.state(0)
            .onEnter(() => patrolling.start())
            .onUpdate(deltaTime => patrolling.update(deltaTime))
            .onEvent(event => patrolling.handle(event));
        fsm.state(0)
            .transitionTo(2)
            .condition(() => patrolling.isFinal)
            .condition(() => patrolling.current === 3);
        fsm.state(0)
            .transitionTo(1)
            .condition(() => patrolling.isFinal)
            .condition(() => patrolling.current === 2);
        fsm.state(1)
            .onEnter(() => alarm.start())
            .onUpdate(deltaTime => alarm.update(deltaTime));
        fsm.state(1)
            .transitionTo(2)
            .condition(() => alarm.isFinal)
            .condition(() => alarm.current === 3);
        fsm.state(1)
            .transitionTo(0)
            .condition(() => alarm.isFinal)
            .condition(() => alarm.current === 4);
        fsm.state(2)
            .onEnter(() => attack.start())
            .onUpdate(deltaTime => attack.update(deltaTime));
        fsm.state(2)
            .transitionTo(1)
            .condition(() => attack.isFinal)
            .condition(() => attack.current === 4);
        return fsm;
    }
    patrolling() {
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](0, [
            0,
            1,
            2,
            3,
        ]);
        const idle = this.idle();
        const run = this.run();
        fsm.state(0)
            .nested(idle);
        fsm.state(0)
            .transitionTo(3)
            .condition(() => idle.isFinal)
            .condition(() => this.scanHero());
        fsm.state(0)
            .transitionTo(2)
            .condition(() => idle.isFinal)
            .condition(() => this.hasPath);
        fsm.state(0)
            .transitionTo(0)
            .condition(() => idle.isFinal)
            .condition(() => this.spawnMinions());
        fsm.state(0)
            .transitionTo(1)
            .condition(() => idle.isFinal)
            .condition(() => this.randomMove());
        fsm.state(0)
            .transitionTo(0)
            .condition(() => idle.isFinal);
        fsm.state(1)
            .nested(run);
        fsm.state(1)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => this.scanHero());
        fsm.state(1)
            .transitionTo(2)
            .condition(() => run.isFinal)
            .condition(() => this.hasPath);
        fsm.state(1)
            .transitionTo(0)
            .condition(() => run.isFinal);
        return fsm;
    }
    alarm() {
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](1, [
            0,
            1,
            2,
            3,
            4,
        ]);
        const idle = this.idle();
        const run = this.run();
        let alarmCountdown = 0;
        fsm.state(0)
            .onEnter(() => alarmCountdown = 10);
        fsm.state(0)
            .transitionTo(2)
            .condition(() => this.moveByPath());
        fsm.state(0)
            .transitionTo(1);
        fsm.state(1)
            .nested(idle);
        fsm.state(1)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => this.scanHero());
        fsm.state(1)
            .transitionTo(2)
            .condition(() => idle.isFinal)
            .condition(() => this.moveByPath());
        fsm.state(1)
            .transitionTo(1)
            .condition(() => idle.isFinal)
            .condition(() => --alarmCountdown > 0);
        fsm.state(1)
            .transitionTo(4)
            .condition(() => idle.isFinal);
        fsm.state(2)
            .nested(run);
        fsm.state(2)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => this.scanHero());
        fsm.state(2)
            .transitionTo(2)
            .condition(() => run.isFinal)
            .condition(() => this.moveByPath());
        fsm.state(2)
            .transitionTo(1)
            .condition(() => run.isFinal);
        return fsm;
    }
    attack() {
        const rng = this.dungeon.rng;
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](0, [
            0,
            1,
            2,
            3,
            4,
        ]);
        const idle = this.idle();
        const run = this.run();
        const hit = this.hit(new _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterHitController"](this));
        fsm.state(0)
            .transitionTo(3)
            .condition(() => this.heroOnAttack)
            .condition(() => rng.float() < this.character.luck);
        fsm.state(0)
            .transitionTo(2)
            .condition(() => this.heroIsNear)
            .condition(() => this.moveToHero());
        fsm.state(0)
            .transitionTo(1)
            .condition(() => this.heroIsNear);
        fsm.state(0)
            .transitionTo(4);
        fsm.state(1)
            .nested(idle)
            .onEnter(() => this.lookAtHero());
        fsm.state(1)
            .transitionTo(3)
            .condition(() => idle.isFinal)
            .condition(() => this.heroOnAttack)
            .condition(() => rng.float() < this.character.luck);
        fsm.state(1)
            .transitionTo(2)
            .condition(() => idle.isFinal)
            .condition(() => this.heroIsNear)
            .condition(() => this.moveToHero());
        fsm.state(1)
            .transitionTo(1)
            .condition(() => idle.isFinal)
            .condition(() => this.heroIsNear);
        fsm.state(1)
            .transitionTo(4)
            .condition(() => idle.isFinal);
        fsm.state(2)
            .nested(run);
        fsm.state(2)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => this.heroOnAttack)
            .condition(() => rng.float() < this.character.luck);
        fsm.state(2)
            .transitionTo(2)
            .condition(() => run.isFinal)
            .condition(() => this.heroIsNear)
            .condition(() => this.moveToHero());
        fsm.state(2)
            .transitionTo(1)
            .condition(() => run.isFinal);
        fsm.state(3)
            .nested(hit)
            .onEnter(() => this.lookAtHero());
        fsm.state(3)
            .transitionTo(2)
            .condition(() => hit.isFinal)
            .condition(() => this.heroIsNear)
            .condition(() => this.moveToHero());
        fsm.state(3)
            .transitionTo(1)
            .condition(() => hit.isFinal);
        return fsm;
    }
}
var BossState;
(function (BossState) {
    BossState[BossState["PATROLLING"] = 0] = "PATROLLING";
    BossState[BossState["ALARM"] = 1] = "ALARM";
    BossState[BossState["ATTACK"] = 2] = "ATTACK";
})(BossState || (BossState = {}));
var BossPatrollingState;
(function (BossPatrollingState) {
    BossPatrollingState[BossPatrollingState["IDLE"] = 0] = "IDLE";
    BossPatrollingState[BossPatrollingState["RANDOM_MOVE"] = 1] = "RANDOM_MOVE";
    BossPatrollingState[BossPatrollingState["GO_ALARM"] = 2] = "GO_ALARM";
    BossPatrollingState[BossPatrollingState["GO_ATTACK"] = 3] = "GO_ATTACK";
})(BossPatrollingState || (BossPatrollingState = {}));
var BossAlarmState;
(function (BossAlarmState) {
    BossAlarmState[BossAlarmState["INITIAL"] = 0] = "INITIAL";
    BossAlarmState[BossAlarmState["IDLE"] = 1] = "IDLE";
    BossAlarmState[BossAlarmState["RUN"] = 2] = "RUN";
    BossAlarmState[BossAlarmState["GO_ATTACK"] = 3] = "GO_ATTACK";
    BossAlarmState[BossAlarmState["GO_PATROLLING"] = 4] = "GO_PATROLLING";
})(BossAlarmState || (BossAlarmState = {}));
var BossAttackState;
(function (BossAttackState) {
    BossAttackState[BossAttackState["INITIAL"] = 0] = "INITIAL";
    BossAttackState[BossAttackState["IDLE"] = 1] = "IDLE";
    BossAttackState[BossAttackState["RUN"] = 2] = "RUN";
    BossAttackState[BossAttackState["HIT"] = 3] = "HIT";
    BossAttackState[BossAttackState["GO_ALARM"] = 4] = "GO_ALARM";
})(BossAttackState || (BossAttackState = {}));


/***/ }),

/***/ "./src/characters/Character.ts":
/*!*************************************!*\
  !*** ./src/characters/Character.ts ***!
  \*************************************/
/*! exports provided: Character, ScanDirection, BaseCharacterController, IdleState, RunState, HitState, SimpleHitState, ComboHitState */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Character", function() { return Character; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ScanDirection", function() { return ScanDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BaseCharacterController", function() { return BaseCharacterController; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "IdleState", function() { return IdleState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RunState", function() { return RunState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HitState", function() { return HitState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SimpleHitState", function() { return SimpleHitState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ComboHitState", function() { return ComboHitState; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../observable */ "./src/observable.ts");
/* harmony import */ var _pathfinding__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../pathfinding */ "./src/pathfinding.ts");
/* harmony import */ var _inventory__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../inventory */ "./src/inventory/index.ts");
/* harmony import */ var _CharacterView__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./CharacterView */ "./src/characters/CharacterView.ts");
/* harmony import */ var _Animator__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Animator */ "./src/characters/Animator.ts");
/* harmony import */ var _fsm__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../fsm */ "./src/fsm.ts");







class Character {
    constructor(options) {
        this.inventory = new _inventory__WEBPACK_IMPORTED_MODULE_3__["Inventory"](this);
        this.name = options.name;
        this._speed = new _observable__WEBPACK_IMPORTED_MODULE_1__["ObservableVar"](options.speed);
        this._healthMax = new _observable__WEBPACK_IMPORTED_MODULE_1__["ObservableVar"](options.healthMax);
        this._health = new _observable__WEBPACK_IMPORTED_MODULE_1__["ObservableVar"](options.healthMax);
        this._dead = new _observable__WEBPACK_IMPORTED_MODULE_1__["ObservableVar"](false);
        this._killedBy = new _observable__WEBPACK_IMPORTED_MODULE_1__["ObservableVar"](null);
        this._baseDamage = new _observable__WEBPACK_IMPORTED_MODULE_1__["ObservableVar"](options.baseDamage);
        this._coins = new _observable__WEBPACK_IMPORTED_MODULE_1__["ObservableVar"](options.coins);
    }
    get speed() {
        return this._speed.get();
    }
    get healthMax() {
        return this._healthMax;
    }
    get health() {
        return this._health;
    }
    get dead() {
        return this._dead;
    }
    get killedBy() {
        return this._killedBy;
    }
    get coins() {
        return this._coins;
    }
    addCoins(coins) {
        this._coins.update(c => c + coins);
    }
    decreaseCoins(coins) {
        const current = this._coins.get();
        if (current >= coins) {
            this._coins.set(current - coins);
            return true;
        }
        else {
            return false;
        }
    }
    get weapon() {
        return this.inventory.equipment.weapon.item.get() || null;
    }
    get damage() {
        var _a;
        return this._baseDamage.get() + (((_a = this.weapon) === null || _a === void 0 ? void 0 : _a.damage) || 0);
    }
    heal(health) {
        this._health.update(h => Math.min(this._healthMax.get(), h + health));
    }
    hitDamage(by, damage) {
        if (!this._dead.get()) {
            this._health.update((h) => Math.max(0, h - damage));
            if (this._health.get() === 0) {
                this._killedBy.set(by);
                this._dead.set(true);
            }
        }
    }
}
var ScanDirection;
(function (ScanDirection) {
    ScanDirection[ScanDirection["LEFT"] = 1] = "LEFT";
    ScanDirection[ScanDirection["RIGHT"] = 2] = "RIGHT";
    ScanDirection[ScanDirection["AROUND"] = 4] = "AROUND";
})(ScanDirection || (ScanDirection = {}));
class BaseCharacterController {
    constructor(dungeon, options) {
        this.static = false;
        this._newX = -1;
        this._newY = -1;
        this.dungeon = dungeon;
        this.width = options.width;
        this.height = options.height;
        this._x = options.x;
        this._y = options.y;
        this.view = new _CharacterView__WEBPACK_IMPORTED_MODULE_4__["CharacterView"](dungeon.container, dungeon.controller.resources, options.zIndex, options.width, options.onPosition);
        this.animator = new _Animator__WEBPACK_IMPORTED_MODULE_5__["Animator"](this.view);
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get newX() {
        return this._newX;
    }
    get newY() {
        return this._newY;
    }
    init() {
        this.setPosition(this._x, this._y);
        this.character.killedBy.subscribe(this.handleKilledBy, this);
        this.character.dead.subscribe(this.handleDead, this);
        this.character.inventory.equipment.weapon.item.subscribe(this.onWeaponUpdate, this);
        this._fsm.start();
        this.dungeon.ticker.add(this._fsm.update, this._fsm);
    }
    destroy() {
        this.dungeon.ticker.remove(this._fsm.update, this._fsm);
        this.character.killedBy.unsubscribe(this.handleKilledBy, this);
        this.character.dead.unsubscribe(this.handleDead, this);
        this.character.inventory.equipment.weapon.item.unsubscribe(this.onWeaponUpdate, this);
        this.dungeon.remove(this._x, this._y, this);
        if (this._newX !== -1 && this._newY !== -1) {
            this.dungeon.remove(this._newX, this._newY, this);
        }
        this.view.destroy();
    }
    collide(object) {
        return this !== object;
    }
    distanceTo(that) {
        const segmentDistance = (s1, e1, s2, e2) => {
            return Math.max(0, Math.max(s1, s2) - Math.min(e1, e2));
        };
        const dx = segmentDistance(this.x, this.x + this.width, that.x, that.x + that.width);
        const dy = segmentDistance(this.y, this.y + this.height, that.y, that.y + that.height);
        return Math.max(dx, dy);
    }
    handleKilledBy(by) {
        if (by)
            this.onKilledBy(by);
    }
    handleDead(dead) {
        if (dead) {
            this.onDead();
        }
    }
    onWeaponUpdate(weapon) {
        this.view.weapon.setWeapon(weapon);
    }
    findDropCell(maxDistance = 5) {
        return this.findCell(maxDistance, cell => cell.hasFloor && !cell.hasObject && !cell.hasDrop);
    }
    findSpawnCell(maxDistance = 5) {
        return this.findCell(maxDistance, cell => cell.hasFloor && !cell.hasObject);
    }
    findCell(maxDistance, predicate) {
        const posX = this.x;
        const posY = this.y;
        const isLeft = this.view.isLeft;
        let closestCell = null;
        let closestDistance = null;
        const metric = (a) => {
            return Math.max(Math.abs(a.x - posX), Math.abs(a.y - posY)) +
                (a.y !== posY ? 0.5 : 0) +
                (a.x === posX && a.y === posY ? 0 : 1) +
                (isLeft ? (a.x < posX ? 0 : 1) : (a.x > posX ? 0 : 0.5));
        };
        const minX = Math.max(0, posX - maxDistance);
        const maxX = Math.min(this.dungeon.width - 1, posX + maxDistance);
        const minY = Math.max(0, posY - maxDistance);
        const maxY = Math.min(this.dungeon.width - 1, posY + maxDistance);
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const cell = this.dungeon.cell(x, y);
                if (cell.hasFloor && predicate(cell)) {
                    const distance = metric(cell);
                    if (closestDistance === null || closestDistance > distance) {
                        closestCell = cell;
                        closestDistance = distance;
                    }
                }
            }
        }
        return closestCell;
    }
    findPath(character) {
        const dungeon = this.dungeon;
        const pf = new _pathfinding__WEBPACK_IMPORTED_MODULE_2__["PathFinding"](dungeon.width, dungeon.height);
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const cell = dungeon.cell(x, y);
                const m = cell.object;
                if (cell.hasFloor && (!cell.collide(this) || m === character)) {
                    pf.clear(x, y);
                }
                else {
                    pf.mark(x, y);
                }
            }
        }
        const start = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](this.x, this.y);
        const end = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](character.x, character.y);
        return pf.find(start, end);
    }
    setPosition(x, y) {
        this.resetDestination();
        this.dungeon.remove(this._x, this._y, this);
        this._x = Math.floor(x);
        this._y = Math.floor(y);
        this.dungeon.set(this._x, this._y, this);
        this.view.setPosition(x, y);
    }
    setDestination(x, y) {
        this.resetDestination();
        this._newX = x;
        this._newY = y;
        this.dungeon.set(this._newX, this._newY, this);
    }
    tryMove(dx, dy) {
        return ((dx !== 0 || dy !== 0) && this.move(dx, dy)) ||
            (dx !== 0 && this.move(dx, 0)) ||
            (dy !== 0 && this.move(0, dy));
    }
    move(dx, dy) {
        if (dx > 0)
            this.view.isLeft = false;
        if (dx < 0)
            this.view.isLeft = true;
        const newX = this._x + dx;
        const newY = this._y + dy;
        if (this.dungeon.available(newX, newY, this)) {
            this.setDestination(newX, newY);
            return true;
        }
        else {
            return false;
        }
    }
    randomMove() {
        if (Math.random() < 0.1) {
            const moveX = Math.floor(Math.random() * 3) - 1;
            const moveY = Math.floor(Math.random() * 3) - 1;
            if (this.tryMove(moveX, moveY)) {
                return true;
            }
        }
        return false;
    }
    hasDestination() {
        return this._newX !== -1 && this._newY !== -1;
    }
    moveToDestination() {
        if (this._newX !== -1 && this._newY !== -1) {
            this.setPosition(this._newX, this._newY);
        }
    }
    resetDestination() {
        if (this._newX !== -1 && this._newY !== -1) {
            this.dungeon.remove(this._newX, this._newY, this);
            this.dungeon.set(this._x, this._y, this);
            this._newX = -1;
            this._newY = -1;
        }
    }
    lookAt(character) {
        if (character.x < this.x)
            this.view.isLeft = true;
        if (character.x > this.x)
            this.view.isLeft = false;
    }
    scanObjects(direction, maxDistance, predicate) {
        const objects = this.scanCells(direction, maxDistance, cell => cell.hasObject && predicate(cell.object))
            .map(cell => cell.object);
        const set = new Set(objects);
        return [...set];
    }
    scanCells(direction, maxDistance, predicate) {
        const posX = this.x;
        const posY = this.y;
        const width = this.width;
        const isLeft = this.view.isLeft;
        const scanLeft = direction === 4 || direction === 1;
        const scanRight = direction === 4 || direction === 2;
        const scanMinX = scanLeft ? Math.max(0, posX - maxDistance) : posX + (width - 1);
        const scanMaxX = scanRight ? Math.min(this.dungeon.width - 1, posX + (width - 1) + maxDistance) : posX;
        const scanMinY = Math.max(0, posY - maxDistance);
        const scanMaxY = Math.min(this.dungeon.height - 1, posY + maxDistance);
        const cells = [];
        for (let scanY = scanMinY; scanY <= scanMaxY; scanY++) {
            for (let scanX = scanMinX; scanX <= scanMaxX; scanX++) {
                const cell = this.dungeon.cell(scanX, scanY);
                if (predicate(cell)) {
                    cells.push(cell);
                }
            }
        }
        const metric = (a) => {
            return Math.max(Math.abs(a.x - posX), Math.abs(a.y - posY)) +
                (a.y !== posY ? 0.5 : 0) +
                (a.x === posX && a.y === posY ? 0 : 1) +
                (isLeft ? (a.x < posX ? 0 : 1) : (a.x > posX ? 0 : 0.5));
        };
        cells.sort((a, b) => metric(a) - metric(b));
        return cells;
    }
    raycastIsVisible(x1, y1) {
        let x0 = this.x;
        let y0 = this.y;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = (dx > dy ? dx : -dy) / 2;
        for (;;) {
            if (x0 === x1 && y0 === y1)
                break;
            const e2 = err;
            if (e2 > -dx) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dy) {
                err += dx;
                y0 += sy;
            }
            if (x0 === x1 && y0 === y1)
                break;
            const cell = this.dungeon.cell(x0, y0);
            if (!cell.hasFloor)
                return false;
            if (cell.collide(this))
                return false;
        }
        return true;
    }
    idle() {
        const character = this.character;
        const animator = this.animator;
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](0, [0, 1]);
        fsm.state(0)
            .onEnter(() => {
            const speed = character.speed * 0.2;
            animator.clear();
            animator.animateCharacter(speed, character.name + "_idle", 4);
            const weapon = character.weapon;
            if (weapon) {
                animator.animateWeapon(speed, weapon.animations.idle);
            }
            animator.start();
        })
            .onUpdate(deltaTime => animator.update(deltaTime))
            .onExit(() => animator.stop())
            .transitionTo(1)
            .condition(() => !animator.isPlaying);
        return fsm;
    }
    run() {
        const character = this.character;
        const animator = this.animator;
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](0, [0, 0, 1]);
        fsm.state(0)
            .onEnter(() => {
            const speed = character.speed * 0.2;
            animator.clear();
            animator.animateCharacter(speed, character.name + "_run", 4);
            animator.animateMove(speed, this);
            const weapon = character.weapon;
            if (weapon) {
                animator.animateWeapon(speed, weapon.animations.run);
            }
            animator.start();
        })
            .onExit(() => {
            if (animator.isPlaying) {
                this.resetDestination();
                animator.stop();
            }
            else {
                this.moveToDestination();
            }
        })
            .onUpdate(deltaTime => animator.update(deltaTime))
            .transitionTo(1).condition(() => !animator.isPlaying);
        return fsm;
    }
    hit(hitController) {
        const character = this.character;
        const simple = this.simpleHit(hitController);
        const combo = this.comboHit(hitController);
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](0, [
            0,
            1,
            2,
            3
        ]);
        fsm.state(0)
            .transitionTo(2)
            .condition(() => character.weapon !== null)
            .condition(() => character.weapon.animations.combo !== undefined);
        fsm.state(0)
            .transitionTo(1);
        fsm.state(1)
            .nested(simple)
            .transitionTo(3)
            .condition(() => simple.isFinal);
        fsm.state(2)
            .nested(combo)
            .transitionTo(3)
            .condition(() => combo.isFinal);
        return fsm;
    }
    simpleHit(hitController) {
        const character = this.character;
        const animator = this.animator;
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](0, [0, 1, 2]);
        fsm.state(0)
            .onEnter(() => {
            const weapon = character.weapon;
            animator.clear();
            if (weapon) {
                const speed = weapon.speed * 0.2;
                animator.animateCharacter(speed, character.name + "_idle", 4);
                animator.animateWeapon(speed, weapon.animations.hit);
            }
            else {
                const speed = character.speed * 0.2;
                animator.animateCharacter(speed, character.name + "_idle", 4);
            }
            animator.start();
        })
            .transitionTo(1);
        fsm.state(1).onUpdate(deltaTime => animator.update(deltaTime));
        fsm.state(1).transitionTo(2).condition(() => !animator.isPlaying);
        fsm.state(2).onEnter(() => hitController.onHit(1)).onEnter(() => animator.stop());
        return fsm;
    }
    comboHit(hitController) {
        const character = this.character;
        const animator = this.animator;
        let hits = 0;
        let speed = 0;
        let combo = [];
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_6__["FiniteStateMachine"](0, [0, 1, 2]);
        fsm.state(0)
            .onEnter(() => {
            const weapon = character.weapon;
            combo = weapon.animations.combo;
            speed = weapon.speed * 0.2;
            hits = 0;
            animator.clear();
            animator.animateCharacter(speed, character.name + "_idle", 4);
            animator.animateWeapon(speed, combo[0]);
            animator.start();
            hits++;
        })
            .onUpdate(deltaTime => animator.update(deltaTime))
            .onExit(() => hitController.onHit(hits));
        fsm.state(0)
            .transitionTo(1)
            .condition(() => !animator.isPlaying)
            .condition(() => hitController.continueCombo());
        fsm.state(0)
            .transitionTo(2)
            .condition(() => !animator.isPlaying)
            .condition(() => !hitController.continueCombo());
        fsm.state(1)
            .onEnter(() => {
            animator.clear();
            animator.animateCharacter(speed, character.name + "_idle", 4);
            animator.animateWeapon(speed, combo[hits]);
            animator.start();
            hits++;
        })
            .onUpdate(deltaTime => animator.update(deltaTime))
            .onExit(() => hitController.onHit(hits));
        fsm.state(1)
            .transitionTo(1)
            .condition(() => !animator.isPlaying)
            .condition(() => hits < combo.length)
            .condition(() => hitController.continueCombo());
        fsm.state(1)
            .transitionTo(1)
            .condition(() => !animator.isPlaying)
            .condition(() => hits < combo.length)
            .condition(() => !hitController.continueCombo());
        fsm.state(1)
            .transitionTo(2)
            .condition(() => !animator.isPlaying)
            .condition(() => hits === combo.length);
        return fsm;
    }
}
var IdleState;
(function (IdleState) {
    IdleState[IdleState["PLAY"] = 0] = "PLAY";
    IdleState[IdleState["COMPLETE"] = 1] = "COMPLETE";
})(IdleState || (IdleState = {}));
var RunState;
(function (RunState) {
    RunState[RunState["PLAY"] = 0] = "PLAY";
    RunState[RunState["COMPLETE"] = 1] = "COMPLETE";
})(RunState || (RunState = {}));
var HitState;
(function (HitState) {
    HitState[HitState["INITIAL"] = 0] = "INITIAL";
    HitState[HitState["SIMPLE_HIT"] = 1] = "SIMPLE_HIT";
    HitState[HitState["COMBO_HIT"] = 2] = "COMBO_HIT";
    HitState[HitState["COMPLETE"] = 3] = "COMPLETE";
})(HitState || (HitState = {}));
var SimpleHitState;
(function (SimpleHitState) {
    SimpleHitState[SimpleHitState["INITIAL"] = 0] = "INITIAL";
    SimpleHitState[SimpleHitState["PLAY"] = 1] = "PLAY";
    SimpleHitState[SimpleHitState["COMPLETE"] = 2] = "COMPLETE";
})(SimpleHitState || (SimpleHitState = {}));
var ComboHitState;
(function (ComboHitState) {
    ComboHitState[ComboHitState["FIRST_HIT"] = 0] = "FIRST_HIT";
    ComboHitState[ComboHitState["NEXT_HIT"] = 1] = "NEXT_HIT";
    ComboHitState[ComboHitState["COMPLETE"] = 2] = "COMPLETE";
})(ComboHitState || (ComboHitState = {}));


/***/ }),

/***/ "./src/characters/CharacterView.ts":
/*!*****************************************!*\
  !*** ./src/characters/CharacterView.ts ***!
  \*****************************************/
/*! exports provided: CharacterView, DefaultWeaponView */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CharacterView", function() { return CharacterView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DefaultWeaponView", function() { return DefaultWeaponView; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _dungeon__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dungeon */ "./src/dungeon/index.ts");


const TILE_SIZE = 16;
class CharacterView {
    constructor(parent, resources, zIndex, gridWidth, onPosition) {
        this._isLeft = false;
        this._sprite = null;
        this._x = 0;
        this._y = 0;
        this._resources = resources;
        this._baseZIndex = zIndex;
        this._gridWidth = gridWidth;
        this._onPosition = onPosition || null;
        this._weapon = new DefaultWeaponView(this._resources);
        this._weapon.zIndex = 2;
        this._weapon.position.set(TILE_SIZE * this._gridWidth, TILE_SIZE - 4);
        this._container = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"]();
        this._container.addChild(this._weapon);
        parent.addChild(this._container);
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get isLeft() {
        return this._isLeft;
    }
    set isLeft(isLeft) {
        this._isLeft = isLeft;
        this.updatePosition();
    }
    set sprite(spriteName) {
        var _a;
        (_a = this._sprite) === null || _a === void 0 ? void 0 : _a.destroy();
        this._sprite = this._resources.animated(spriteName, {
            autoUpdate: false,
            loop: false,
        });
        this._sprite.anchor.set(0, 1);
        this._sprite.position.y = TILE_SIZE - 2;
        this._sprite.position.x = 0;
        if (this._sprite.width > this._gridWidth * TILE_SIZE) {
            this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
        }
        this._sprite.zIndex = 1;
        this._container.addChild(this._sprite);
    }
    get weapon() {
        return this._weapon;
    }
    destroy() {
        var _a;
        this._container.destroy();
        this._weapon.destroy();
        (_a = this._sprite) === null || _a === void 0 ? void 0 : _a.destroy();
        this._sprite = null;
    }
    setPosition(x, y) {
        this._x = Math.round(x * TILE_SIZE * 2) / 2;
        this._y = Math.round(y * TILE_SIZE * 2) / 2;
        this.updatePosition();
        this._container.zIndex = this._baseZIndex + Math.floor(y) * _dungeon__WEBPACK_IMPORTED_MODULE_1__["DungeonZIndexes"].row;
        if (this._onPosition) {
            this._onPosition(this._x, this._y);
        }
    }
    setSprite(spriteName) {
        var _a;
        (_a = this._sprite) === null || _a === void 0 ? void 0 : _a.destroy();
        this._sprite = this._resources.animated(spriteName, {
            autoUpdate: false,
            loop: false,
        });
        this._sprite.anchor.set(0, 1);
        this._sprite.position.y = TILE_SIZE - 2;
        this._sprite.position.x = 0;
        if (this._sprite.width > this._gridWidth * TILE_SIZE) {
            this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
        }
        this._sprite.zIndex = 1;
        this._container.addChild(this._sprite);
    }
    setFrame(frame) {
        if (this._sprite) {
            this._sprite.gotoAndStop(frame);
        }
    }
    updatePosition() {
        this._container.scale.set(this._isLeft ? -1 : 1, 1);
        this._container.position.set(this._x + (this._isLeft ? this._gridWidth * TILE_SIZE : 0), this._y);
    }
}
class DefaultWeaponView extends pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"] {
    constructor(resources) {
        super();
        this._sprite = null;
        this._resources = resources;
    }
    destroy() {
        var _a;
        (_a = this._sprite) === null || _a === void 0 ? void 0 : _a.destroy();
        this._sprite = null;
        super.destroy();
    }
    setWeapon(weapon) {
        var _a;
        (_a = this._sprite) === null || _a === void 0 ? void 0 : _a.destroy();
        this._sprite = null;
        if (weapon) {
            this._sprite = this._resources.sprite(weapon.spriteName);
            this._sprite.anchor.set(0.5, 1);
            this.addChild(this._sprite);
        }
    }
    setAngle(angle) {
        if (this._sprite) {
            this._sprite.angle = angle;
        }
    }
    setPosition(x, y) {
        if (this._sprite) {
            this._sprite.position.set(x, y);
        }
    }
}


/***/ }),

/***/ "./src/characters/Hero.ts":
/*!********************************!*\
  !*** ./src/characters/Hero.ts ***!
  \********************************/
/*! exports provided: heroCharacterNames, Hero, HeroController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "heroCharacterNames", function() { return heroCharacterNames; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Hero", function() { return Hero; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HeroController", function() { return HeroController; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Character__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Character */ "./src/characters/Character.ts");
/* harmony import */ var _dungeon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../dungeon */ "./src/dungeon/index.ts");
/* harmony import */ var _observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../observable */ "./src/observable.ts");
/* harmony import */ var _Monster__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Monster */ "./src/characters/Monster.ts");
/* harmony import */ var _fsm__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../fsm */ "./src/fsm.ts");






const heroCharacterNames = [
    "elf_f",
    "elf_m",
    "knight_f",
    "knight_m",
    "wizard_f",
    "wizard_m",
];
const defaultGlobalState = {
    coins: 0,
    baseDamage: 3,
    level: 1,
    levelXp: 0,
    skillPoints: 0,
    xp: 0,
    healthMax: 30,
    speed: 1,
};
class Hero extends _Character__WEBPACK_IMPORTED_MODULE_1__["Character"] {
    constructor(name, state, persistent) {
        super({
            name: name,
            speed: state.speed,
            healthMax: state.healthMax,
            baseDamage: state.baseDamage,
            coins: state.coins,
        });
        this.dungeonSeeds = new Map();
        this.bonfires = new Set();
        this._persistent = persistent;
        this._level = new _observable__WEBPACK_IMPORTED_MODULE_3__["ObservableVar"](state.level);
        this._levelXp = new _observable__WEBPACK_IMPORTED_MODULE_3__["ObservableVar"](state.levelXp);
        this._skillPoints = new _observable__WEBPACK_IMPORTED_MODULE_3__["ObservableVar"](state.skillPoints);
        this._xp = new _observable__WEBPACK_IMPORTED_MODULE_3__["ObservableVar"](state.xp);
        this.subscribe();
    }
    get level() {
        return this._level;
    }
    get levelXp() {
        return this._levelXp;
    }
    get skillPoints() {
        return this._skillPoints;
    }
    get xp() {
        return this._xp;
    }
    addXp(value) {
        this._xp.update((v) => {
            let newXp = v + value;
            for (;;) {
                const levelXp = this._levelXp.get();
                if (newXp >= levelXp) {
                    newXp = newXp - levelXp;
                    this._level.update((v) => v + 1);
                    this._levelXp.update((v) => v + 1000);
                    this._skillPoints.update((v) => v + 1);
                }
                else {
                    break;
                }
            }
            return newXp;
        });
    }
    increaseHealth() {
        this._skillPoints.update((points) => {
            if (points > 0) {
                points--;
                this._healthMax.update((h) => h + 1);
                this._health.update((h) => h + 1);
            }
            return points;
        });
    }
    subscribe() {
        this._coins.subscribe(this.save, this);
        this._baseDamage.subscribe(this.save, this);
        this._level.subscribe(this.save, this);
        this._levelXp.subscribe(this.save, this);
        this._skillPoints.subscribe(this.save, this);
        this._xp.subscribe(this.save, this);
        this._healthMax.subscribe(this.save, this);
        this._speed.subscribe(this.save, this);
    }
    save() {
        this._persistent.global.save(this.name, this.state);
    }
    get state() {
        return {
            coins: this._coins.get(),
            baseDamage: this._baseDamage.get(),
            level: this._level.get(),
            levelXp: this._levelXp.get(),
            skillPoints: this._skillPoints.get(),
            xp: this._xp.get(),
            healthMax: this._healthMax.get(),
            speed: this._speed.get(),
        };
    }
    static load(name, persistent) {
        const state = persistent.global.load(name) || defaultGlobalState;
        return new Hero(name, state, persistent);
    }
}
class HeroController extends _Character__WEBPACK_IMPORTED_MODULE_1__["BaseCharacterController"] {
    constructor(character, dungeon, x, y) {
        super(dungeon, {
            x: x,
            y: y,
            width: 1,
            height: 1,
            zIndex: _dungeon__WEBPACK_IMPORTED_MODULE_2__["DungeonZIndexes"].hero,
            onPosition: dungeon.camera.bind(dungeon),
        });
        this.interacting = false;
        this.character = character;
        this._fsm = this.fsm();
        this.init();
    }
    init() {
        super.init();
        this.character.inventory.drop.subscribe(this.onDrop, this);
    }
    destroy() {
        this.character.inventory.drop.unsubscribe(this.onDrop, this);
        super.destroy();
    }
    interact() {
    }
    onKilledBy(by) {
        this.dungeon.log(`${this.character.name} killed by ${by.name}`);
    }
    onDead() {
        this.destroy();
        this.dungeon.controller.dead();
    }
    onDrop(event) {
        const [drop] = event;
        const cell = this.findDropCell();
        if (cell) {
            cell.dropItem = drop;
        }
    }
    scanDrop() {
        var _a;
        const cell = this.dungeon.cell(this.x, this.y);
        if ((_a = cell.drop) === null || _a === void 0 ? void 0 : _a.pickedUp(this.character)) {
            pixi_js__WEBPACK_IMPORTED_MODULE_0__["sound"].play('fruit_collect');
        }
    }
    scanHit(combo) {
        const weapon = this.character.weapon;
        const distance = (weapon === null || weapon === void 0 ? void 0 : weapon.distance) || 1;
        const direction = this.view.isLeft ? 1 : 2;
        const monsters = this.scanMonsters(direction, distance);
        const damage = this.character.damage + combo;
        for (const monster of monsters) {
            monster.character.hitDamage(this.character, damage);
        }
        if (monsters.length > 0) {
            pixi_js__WEBPACK_IMPORTED_MODULE_0__["sound"].play('hit_damage', { speed: (weapon === null || weapon === void 0 ? void 0 : weapon.speed) || 1 });
        }
    }
    lookAtMonsters() {
        const weapon = this.character.weapon;
        const distance = (weapon === null || weapon === void 0 ? void 0 : weapon.distance) || 1;
        const leftHealthSum = this.monstersHealth(1, distance);
        const rightHealthSum = this.monstersHealth(2, distance);
        if (leftHealthSum > 0 && leftHealthSum > rightHealthSum) {
            this.view.isLeft = true;
        }
        else if (rightHealthSum > 0 && rightHealthSum > leftHealthSum) {
            this.view.isLeft = false;
        }
    }
    scanAndInteract() {
        const direction = this.view.isLeft ? 1 : 2;
        const [object] = this.scanCells(direction, 1, c => c.interacting);
        if (object) {
            object.interact(this);
            return true;
        }
        return false;
    }
    scanMonsters(direction, maxDistance) {
        return this.scanObjects(direction, maxDistance, c => c instanceof _Monster__WEBPACK_IMPORTED_MODULE_4__["MonsterController"]);
    }
    monstersHealth(direction, maxDistance) {
        return this.scanMonsters(direction, maxDistance).map(m => m.character.health.get()).reduce((a, b) => a + b, 0);
    }
    fsm() {
        const joystick = this.dungeon.controller.joystick;
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_5__["FiniteStateMachine"](0, [
            0,
            1,
            2,
            3
        ]);
        const idle = this.idle();
        const run = this.run();
        const hit = this.hit(new HeroHitController(this));
        fsm.state(0)
            .nested(idle)
            .onEnter(() => this.scanDrop())
            .onUpdate(() => this.processInventory());
        fsm.state(0)
            .transitionTo(3)
            .condition(() => joystick.hit.once());
        fsm.state(0)
            .transitionTo(1)
            .condition(() => this.processMove());
        fsm.state(0)
            .transitionTo(0)
            .condition(() => idle.isFinal);
        fsm.state(1)
            .nested(run)
            .onEnter(() => this.scanDrop())
            .onUpdate(() => this.processInventory());
        fsm.state(1)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => joystick.hit.once());
        fsm.state(1)
            .transitionTo(1)
            .condition(() => run.isFinal)
            .condition(() => this.processMove());
        fsm.state(1)
            .transitionTo(0)
            .condition(() => run.isFinal);
        fsm.state(2)
            .nested(hit)
            .onEnter(() => this.scanDrop())
            .onEnter(() => this.lookAtMonsters())
            .onUpdate(() => this.processInventory());
        fsm.state(2)
            .transitionTo(3)
            .condition(() => hit.isFinal)
            .condition(() => joystick.hit.once());
        fsm.state(2)
            .transitionTo(1)
            .condition(() => hit.isFinal)
            .condition(() => this.processMove());
        fsm.state(2)
            .transitionTo(0)
            .condition(() => hit.isFinal);
        fsm.state(3)
            .transitionTo(2)
            .condition(() => this.scanMonsters(4, 1).length > 0);
        fsm.state(3)
            .transitionTo(0)
            .condition(() => this.scanAndInteract())
            .action(() => joystick.hit.reset());
        fsm.state(3)
            .transitionTo(2);
        return fsm;
    }
    static delta(a, b) {
        if (a.repeat()) {
            return -1;
        }
        else if (b.repeat()) {
            return 1;
        }
        else {
            return 0;
        }
    }
    processMove() {
        const joystick = this.dungeon.controller.joystick;
        const dx = HeroController.delta(joystick.moveLeft, joystick.moveRight);
        const dy = HeroController.delta(joystick.moveUp, joystick.moveDown);
        return this.tryMove(dx, dy);
    }
    processInventory() {
        const joystick = this.dungeon.controller.joystick;
        const inventory = this.character.inventory;
        for (let d = 0; d <= 9; d++) {
            const digit = (d + 1) % 10;
            if (joystick.digit(digit).once()) {
                this.character.inventory.belt.cell(d).use();
            }
        }
        if (joystick.drop.once()) {
            inventory.equipment.weapon.drop();
        }
        if (joystick.inventory.once()) {
            this.dungeon.controller.showInventory(this.character);
        }
    }
}
class HeroHitController {
    constructor(controller) {
        this._controller = controller;
        this._joystick = controller.dungeon.controller.joystick;
    }
    continueCombo() {
        return this._joystick.hit.once();
    }
    onHit(combo) {
        this._controller.scanHit(combo);
    }
}
var HeroState;
(function (HeroState) {
    HeroState[HeroState["IDLE"] = 0] = "IDLE";
    HeroState[HeroState["RUN"] = 1] = "RUN";
    HeroState[HeroState["HIT"] = 2] = "HIT";
    HeroState[HeroState["ON_HIT"] = 3] = "ON_HIT";
})(HeroState || (HeroState = {}));


/***/ }),

/***/ "./src/characters/HeroStateView.ts":
/*!*****************************************!*\
  !*** ./src/characters/HeroStateView.ts ***!
  \*****************************************/
/*! exports provided: HeroStateView */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HeroStateView", function() { return HeroStateView; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _bar_view__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../bar.view */ "./src/bar.view.ts");
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");



class HeroStateView extends pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"] {
    constructor(heroState, options) {
        super();
        this._fixedHPSize = options.fixedHPSize;
        this._hpBarSize = options.hpBarSize || 8;
        this._maxBarSize = options.maxBarSize || 256;
        this._maxBarInnerSize = this._maxBarSize - (_ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiBorder << 1);
        const barHeight = 18 + (_ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiBorder << 1);
        const offsetY = barHeight + _ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin;
        this._heroState = heroState;
        this._health = new _bar_view__WEBPACK_IMPORTED_MODULE_1__["BarView"]({
            color: _ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiRed,
            width: 0,
            widthMax: this._maxBarInnerSize
        });
        this._xp = new _bar_view__WEBPACK_IMPORTED_MODULE_1__["BarView"]({
            color: _ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiYellow,
            width: 0,
            widthMax: this._maxBarInnerSize
        });
        this._xp.position.set(0, offsetY);
        this._coins = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"]("", { font: { name: "alagard", size: 16 } });
        this._coins.position.set(0, offsetY * 2);
        super.addChild(this._health, this._xp, this._coins);
        heroState.health.subscribe(this.updateHealth, this);
        heroState.healthMax.subscribe(this.updateHealthMax, this);
        heroState.level.subscribe(this.updateXp, this);
        heroState.levelXp.subscribe(this.updateXp, this);
        heroState.skillPoints.subscribe(this.updateXp, this);
        heroState.xp.subscribe(this.updateXp, this);
        heroState.coins.subscribe(this.updateCoins, this);
    }
    destroy() {
        super.destroy();
        this._heroState.health.unsubscribe(this.updateHealth, this);
        this._heroState.healthMax.unsubscribe(this.updateHealthMax, this);
        this._heroState.level.unsubscribe(this.updateXp, this);
        this._heroState.levelXp.unsubscribe(this.updateXp, this);
        this._heroState.skillPoints.unsubscribe(this.updateXp, this);
        this._heroState.xp.unsubscribe(this.updateXp, this);
        this._heroState.coins.unsubscribe(this.updateCoins, this);
    }
    updateHealthMax(healthMax) {
        const health = this._heroState.health.get();
        if (!this._fixedHPSize) {
            this._health.widthMax = this._hpBarSize * healthMax;
        }
        this._health.label = `${health}/${healthMax}`;
    }
    updateHealth(health) {
        const healthMax = this._heroState.healthMax.get();
        if (this._fixedHPSize) {
            this._health.width = Math.floor(this._maxBarInnerSize * health / healthMax);
        }
        else {
            this._health.width = this._hpBarSize * health;
        }
        this._health.label = `${health}/${healthMax}`;
    }
    updateXp() {
        const level = this._heroState.level.get();
        const levelXp = this._heroState.levelXp.get();
        const skillPoints = this._heroState.skillPoints.get();
        const xp = this._heroState.xp.get();
        this._xp.widthMax = this._maxBarInnerSize;
        this._xp.width = Math.floor(this._maxBarInnerSize * xp / levelXp);
        this._xp.label = `L:${level} XP:${xp}/${levelXp} SP:${skillPoints}`;
    }
    updateCoins(coins) {
        this._coins.text = `$${coins}`;
    }
}


/***/ }),

/***/ "./src/characters/Monster.ts":
/*!***********************************!*\
  !*** ./src/characters/Monster.ts ***!
  \***********************************/
/*! exports provided: MonsterCategory, MonsterType, Monster, MonsterController, MonsterHitController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MonsterCategory", function() { return MonsterCategory; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MonsterType", function() { return MonsterType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Monster", function() { return Monster; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MonsterController", function() { return MonsterController; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MonsterHitController", function() { return MonsterHitController; });
/* harmony import */ var _Hero__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Hero */ "./src/characters/Hero.ts");
/* harmony import */ var _Character__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Character */ "./src/characters/Character.ts");


var MonsterCategory;
(function (MonsterCategory) {
    MonsterCategory[MonsterCategory["DEMON"] = 1] = "DEMON";
    MonsterCategory[MonsterCategory["ZOMBIE"] = 2] = "ZOMBIE";
    MonsterCategory[MonsterCategory["ORC"] = 3] = "ORC";
    MonsterCategory[MonsterCategory["SLIME"] = 4] = "SLIME";
    MonsterCategory[MonsterCategory["UNDEAD"] = 5] = "UNDEAD";
})(MonsterCategory || (MonsterCategory = {}));
var MonsterType;
(function (MonsterType) {
    MonsterType[MonsterType["NORMAL"] = 1] = "NORMAL";
    MonsterType[MonsterType["SUMMON"] = 2] = "SUMMON";
    MonsterType[MonsterType["MINION"] = 3] = "MINION";
})(MonsterType || (MonsterType = {}));
class Monster extends _Character__WEBPACK_IMPORTED_MODULE_1__["Character"] {
    constructor(options) {
        super({
            name: options.name,
            speed: options.speed,
            healthMax: options.healthMax,
            baseDamage: options.baseDamage,
            coins: 0,
        });
        this.level = options.level;
        this.luck = options.luck;
        this.xp = options.xp;
        this.category = options.category;
        this.type = options.type;
        this.spawn = options.spawn;
    }
}
class MonsterController extends _Character__WEBPACK_IMPORTED_MODULE_1__["BaseCharacterController"] {
    constructor(dungeon, options) {
        super(dungeon, options);
        this.interacting = false;
        this._path = [];
        this._hero = null;
    }
    get hasPath() {
        return this._path.length > 0;
    }
    interact() {
    }
    onKilledBy(by) {
        if (by && by instanceof _Hero__WEBPACK_IMPORTED_MODULE_0__["Hero"]) {
            this.dungeon.log(`${this.character.name} killed by ${by.name}`);
            by.addXp(this.character.xp);
        }
    }
    scanHit(combo) {
        const weapon = this.character.weapon;
        const direction = this.view.isLeft ? 1 : 2;
        const distance = (weapon === null || weapon === void 0 ? void 0 : weapon.distance) || 1;
        const heroes = this.scanHeroes(direction, distance);
        const damage = this.character.damage + combo;
        for (const hero of heroes) {
            hero.character.hitDamage(this.character, damage);
        }
    }
    onAlarm(hero) {
        this._path = this.findPath(hero);
    }
    scanHeroes(direction, distance = this.maxDistance) {
        return this.scanObjects(direction, distance, c => c instanceof _Hero__WEBPACK_IMPORTED_MODULE_0__["HeroController"])
            .filter(o => !o.character.dead.get())
            .filter(o => this.raycastIsVisible(o.x, o.y));
    }
    scanHero() {
        if (this._hero !== null && this._hero.character.dead.get()) {
            this._hero = null;
        }
        if (this._hero !== null && this.distanceTo(this._hero) <= this.maxDistance) {
            return true;
        }
        const [hero] = this.scanHeroes(4, this.maxDistance);
        if (hero) {
            this._hero = hero;
            for (const monster of this.scanMonsters(4)) {
                monster.onAlarm(hero);
            }
        }
        return false;
    }
    get heroOnAttack() {
        if (this._hero !== null && this._hero.character.dead.get()) {
            this._hero = null;
        }
        return this._hero !== null && this.distanceTo(this._hero) === 0;
    }
    get heroIsNear() {
        if (this._hero !== null && this._hero.character.dead.get()) {
            this._hero = null;
        }
        return this._hero !== null && this.distanceTo(this._hero) <= this.maxDistance;
    }
    moveToHero() {
        if (this._hero !== null && this._hero.character.dead.get()) {
            this._hero = null;
        }
        return this._hero !== null && this.moveTo(this._hero);
    }
    lookAtHero() {
        if (this._hero !== null && this._hero.character.dead.get()) {
            this._hero = null;
        }
        if (this._hero !== null) {
            this.lookAt(this._hero);
        }
    }
    runAway() {
        if (this._hero !== null && this._hero.character.dead.get()) {
            this._hero = null;
        }
        if (this._hero !== null) {
            const dx = Math.min(1, Math.max(-1, this.x - this._hero.x));
            const dy = Math.min(1, Math.max(-1, this.y - this._hero.y));
            return this.tryMove(dx, dy);
        }
        return false;
    }
    scanMonsters(direction) {
        return this.scanObjects(direction, this.maxDistance, c => c instanceof MonsterController && c !== this);
    }
    moveByPath() {
        if (this._path.length > 0) {
            const next = this._path[0];
            const deltaX = next.x - this.x;
            const deltaY = next.y - this.y;
            if (this.move(deltaX, deltaY)) {
                this._path.splice(0, 1);
                return true;
            }
            else {
                this._path = [];
                return false;
            }
        }
        else {
            return false;
        }
    }
    moveTo(hero) {
        this._path = this.findPath(hero);
        return this.moveByPath();
    }
}
class MonsterHitController {
    constructor(controller) {
        this._controller = controller;
    }
    onHit(combo) {
        this._controller.scanHit(combo);
    }
    continueCombo() {
        return true;
    }
}


/***/ }),

/***/ "./src/characters/Npc.ts":
/*!*******************************!*\
  !*** ./src/characters/Npc.ts ***!
  \*******************************/
/*! exports provided: NpcSkill, SellingSkill, BuyingSkill, HealSkill, TradingType, NPCs, Npc, NpcController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NpcSkill", function() { return NpcSkill; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SellingSkill", function() { return SellingSkill; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BuyingSkill", function() { return BuyingSkill; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HealSkill", function() { return HealSkill; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TradingType", function() { return TradingType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NPCs", function() { return NPCs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Npc", function() { return Npc; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NpcController", function() { return NpcController; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Character__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Character */ "./src/characters/Character.ts");
/* harmony import */ var _dungeon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../dungeon */ "./src/dungeon/index.ts");
/* harmony import */ var _drop__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../drop */ "./src/drop/index.ts");




class NpcSkill {
    constructor(npc, controller) {
        this.npc = npc;
        this.controller = controller;
    }
}
class SellingSkill extends NpcSkill {
    constructor(npc, controller) {
        super(npc, controller);
    }
    use(hero) {
        this.controller.sellInventory(hero, this.npc);
    }
}
SellingSkill.id = 'selling';
class BuyingSkill extends NpcSkill {
    constructor(npc, controller) {
        super(npc, controller);
    }
    use(hero) {
        this.controller.buyInventory(hero, this.npc);
    }
}
BuyingSkill.id = 'buying';
class HealSkill extends NpcSkill {
    constructor(npc, controller) {
        super(npc, controller);
    }
    use(hero) {
        pixi_js__WEBPACK_IMPORTED_MODULE_0__["sound"].play('big_egg_collect');
        hero.heal(hero.healthMax.get());
    }
}
HealSkill.id = 'heal';
var TradingType;
(function (TradingType) {
    TradingType[TradingType["POTIONS"] = 1] = "POTIONS";
    TradingType[TradingType["WEAPONS"] = 2] = "WEAPONS";
})(TradingType || (TradingType = {}));
const NPCs = [
    {
        name: "alchemist",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 1000,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [],
        trading: [TradingType.POTIONS],
    },
    {
        name: "archer",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 1000,
        skills: [],
        weapons: [],
        trading: [],
    },
    {
        name: "bishop",
        width: 1,
        height: 2,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [],
        trading: [],
    },
    {
        name: "blacksmith",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 1000,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [_drop__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"].hammer],
        trading: [TradingType.WEAPONS]
    },
    {
        name: "butcher",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 1000,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [],
        trading: []
    },
    {
        name: "executioner",
        width: 2,
        height: 2,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [_drop__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"].axe],
        trading: []
    },
    {
        name: "herald",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [],
        trading: []
    },
    {
        name: "king",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [],
        trading: []
    },
    {
        name: "knight",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [_drop__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"].regular_sword],
        trading: []
    },
    {
        name: "knight_elite",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [_drop__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"].regular_sword],
        trading: []
    },
    {
        name: "knight_heavy",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [_drop__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"].regular_sword],
        trading: []
    },
    {
        name: "large_knight",
        width: 2,
        height: 2,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [_drop__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"].knight_sword],
        trading: []
    },
    {
        name: "large_knight_elite",
        width: 2,
        height: 2,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [_drop__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"].knight_sword],
        trading: []
    },
    {
        name: "mage",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 1000,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [],
        trading: [TradingType.POTIONS]
    },
    {
        name: "magic_shop_keeper",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 1000,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [],
        trading: [TradingType.POTIONS]
    },
    {
        name: "merchant",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 10000,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [],
        trading: [TradingType.POTIONS]
    },
    {
        name: "mountain_king",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [],
        trading: []
    },
    {
        name: "nun",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [HealSkill.id],
        weapons: [],
        trading: []
    },
    {
        name: "nun_fat",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [HealSkill.id],
        weapons: [],
        trading: []
    },
    {
        name: "nun_tall",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [HealSkill.id],
        weapons: [],
        trading: []
    },
    {
        name: "princess",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [],
        trading: []
    },
    {
        name: "queen",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 0,
        skills: [],
        weapons: [],
        trading: []
    },
    {
        name: "thief",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 1000,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [_drop__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"].knife],
        trading: []
    },
    {
        name: "townsfolk_f",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 100,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [],
        trading: []
    },
    {
        name: "townsfolk_m",
        width: 1,
        height: 1,
        baseDamage: 0,
        coins: 100,
        skills: [SellingSkill.id, BuyingSkill.id],
        weapons: [],
        trading: []
    },
];
class Npc extends _Character__WEBPACK_IMPORTED_MODULE_1__["Character"] {
    constructor(options) {
        super({
            name: options.name,
            speed: 1,
            healthMax: 1000,
            baseDamage: options.baseDamage,
            coins: options.coins,
        });
        this._context = new Map();
        this._skill = new Map();
    }
    setContext(key, value) {
        this._context.set(key, value);
    }
    getContext(key) {
        return this._context.get(key);
    }
    hasSkill(id) {
        return this._skill.has(id);
    }
    getSkill(id) {
        return this._skill.get(id) || null;
    }
    addSkill(id, skill) {
        this._skill.set(id, skill);
    }
}
class NpcController extends _Character__WEBPACK_IMPORTED_MODULE_1__["BaseCharacterController"] {
    constructor(config, dungeon, controller, x, y) {
        super(dungeon, {
            width: config.width,
            height: config.height,
            x: x,
            y: y,
            zIndex: _dungeon__WEBPACK_IMPORTED_MODULE_2__["DungeonZIndexes"].character
        });
        this.interacting = true;
        this.character = new Npc(config);
        const weapon = _drop__WEBPACK_IMPORTED_MODULE_3__["Weapon"].select(this.dungeon.rng, config.weapons);
        if (weapon) {
            this.character.inventory.equipment.weapon.set(weapon);
        }
        this._fsm = this.idle();
        this._fsm.state(1)
            .transitionTo(0)
            .action(() => "npc idle complete");
        this.initSkills(controller, config);
        this.init();
    }
    initSkills(controller, config) {
        const backpack = this.character.inventory.backpack;
        for (const id of config.skills) {
            switch (id) {
                case SellingSkill.id:
                    this.character.addSkill(id, new SellingSkill(this.character, controller));
                    break;
                case BuyingSkill.id:
                    this.character.addSkill(id, new BuyingSkill(this.character, controller));
                    for (const trading of config.trading) {
                        switch (trading) {
                            case TradingType.POTIONS:
                                for (let x = 0; x < 10; x++) {
                                    backpack.cell(x, 0).set(new _drop__WEBPACK_IMPORTED_MODULE_3__["HealthFlask"](), 3);
                                }
                                for (let x = 0; x < 10; x++) {
                                    backpack.cell(x, 1).set(new _drop__WEBPACK_IMPORTED_MODULE_3__["HealthBigFlask"](), 3);
                                }
                                break;
                            case TradingType.WEAPONS:
                                for (const config of _drop__WEBPACK_IMPORTED_MODULE_3__["weaponConfigs"]) {
                                    if (config.level <= this.dungeon.level + 2) {
                                        backpack.add(new _drop__WEBPACK_IMPORTED_MODULE_3__["Weapon"](config));
                                    }
                                }
                                break;
                        }
                    }
                    break;
                case HealSkill.id:
                    this.character.addSkill(id, new HealSkill(this.character, controller));
                    break;
            }
        }
    }
    onDead() {
        this.destroy();
    }
    onKilledBy(_) {
    }
    interact(hero) {
        this.lookAt(hero);
        this.dungeon.controller.showDialog(hero.character, this.character);
    }
}


/***/ }),

/***/ "./src/characters/SpawningMonster.ts":
/*!*******************************************!*\
  !*** ./src/characters/SpawningMonster.ts ***!
  \*******************************************/
/*! exports provided: SpawningMonsterController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SpawningMonsterController", function() { return SpawningMonsterController; });
/* harmony import */ var _Monster__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Monster */ "./src/characters/Monster.ts");
/* harmony import */ var _TinyMonster__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./TinyMonster */ "./src/characters/TinyMonster.ts");


class SpawningMonsterController extends _Monster__WEBPACK_IMPORTED_MODULE_0__["MonsterController"] {
    constructor(dungeon, options) {
        super(dungeon, options);
        this._spawned = [];
    }
    spawnMinions() {
        for (let i = this._spawned.length - 1; i >= 0; i--) {
            if (this._spawned[i].character.dead.get()) {
                this._spawned.splice(i, 1);
            }
        }
        if (this._spawned.length < this.character.spawn) {
            if (Math.random() > 0.1) {
                return false;
            }
            const cell = this.findSpawnCell();
            if (!cell) {
                console.warn(`spawn cell not found at ${this.x}:${this.y}`, this.character.category, this.character.type);
                return false;
            }
            const minion = this.spawnMinion(cell.x, cell.y);
            if (minion) {
                cell.object = minion;
                this._spawned.push(minion);
                return true;
            }
            else {
                console.warn("minion not spawned", this.character.category, this.character.type);
                return false;
            }
        }
        return false;
    }
    spawnMinion(x, y) {
        const minions = _TinyMonster__WEBPACK_IMPORTED_MODULE_1__["tinyMonsters"].filter(c => c.category === this.character.category && c.type === _Monster__WEBPACK_IMPORTED_MODULE_0__["MonsterType"].MINION);
        if (minions.length === 0) {
            console.warn("no minion config found", this.character.category);
            return null;
        }
        const config = this.dungeon.rng.select(minions);
        return new _TinyMonster__WEBPACK_IMPORTED_MODULE_1__["TinyMonsterController"](config, this.dungeon, x, y);
    }
}


/***/ }),

/***/ "./src/characters/SummonMonster.ts":
/*!*****************************************!*\
  !*** ./src/characters/SummonMonster.ts ***!
  \*****************************************/
/*! exports provided: summonMonsters, SummonMonster, SummonMonsterController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "summonMonsters", function() { return summonMonsters; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SummonMonster", function() { return SummonMonster; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SummonMonsterController", function() { return SummonMonsterController; });
/* harmony import */ var _Monster__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Monster */ "./src/characters/Monster.ts");
/* harmony import */ var _dungeon__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dungeon */ "./src/dungeon/index.ts");
/* harmony import */ var _drop__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../drop */ "./src/drop/index.ts");
/* harmony import */ var _SpawningMonster__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./SpawningMonster */ "./src/characters/SpawningMonster.ts");
/* harmony import */ var _fsm__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../fsm */ "./src/fsm.ts");





const knife = _drop__WEBPACK_IMPORTED_MODULE_2__["monsterWeapons"].knife;
const summonMonsters = [
    { name: "orc_shaman", category: _Monster__WEBPACK_IMPORTED_MODULE_0__["MonsterCategory"].ORC, luck: 0.4, weapons: [knife] },
    { name: "necromancer", category: _Monster__WEBPACK_IMPORTED_MODULE_0__["MonsterCategory"].UNDEAD, luck: 0.4, weapons: [knife] },
];
class SummonMonster extends _Monster__WEBPACK_IMPORTED_MODULE_0__["Monster"] {
    constructor(config, level) {
        super({
            name: config.name,
            category: config.category,
            type: _Monster__WEBPACK_IMPORTED_MODULE_0__["MonsterType"].SUMMON,
            speed: 0.8,
            healthMax: 10 + Math.floor(level * 2),
            level: level,
            luck: config.luck,
            baseDamage: 1 + 0.5 * level,
            xp: 35 + 5 * level,
            spawn: 3,
        });
    }
}
class SummonMonsterController extends _SpawningMonster__WEBPACK_IMPORTED_MODULE_3__["SpawningMonsterController"] {
    constructor(config, dungeon, x, y) {
        super(dungeon, {
            x: x,
            y: y,
            width: 1,
            height: 1,
            zIndex: _dungeon__WEBPACK_IMPORTED_MODULE_1__["DungeonZIndexes"].character
        });
        this.maxDistance = 7;
        this.character = new SummonMonster(config, dungeon.level);
        const weapon = config.luck < this.dungeon.rng.float() ? _drop__WEBPACK_IMPORTED_MODULE_2__["Weapon"].select(this.dungeon.rng, config.weapons) : null;
        if (weapon) {
            this.character.inventory.equipment.weapon.set(weapon);
        }
        this._fsm = this.fsm();
        this.init();
    }
    onDead() {
        var _a;
        if (Math.random() < this.character.luck) {
            (_a = this.findDropCell()) === null || _a === void 0 ? void 0 : _a.randomDrop();
        }
        this.destroy();
    }
    fsm() {
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_4__["FiniteStateMachine"](0, [
            0,
            1,
        ]);
        const patrolling = this.patrolling();
        const attack = this.attack();
        fsm.state(0)
            .nested(patrolling)
            .transitionTo(1)
            .condition(() => patrolling.isFinal)
            .condition(() => patrolling.current === 2);
        fsm.state(1)
            .nested(attack)
            .transitionTo(0)
            .condition(() => attack.isFinal)
            .condition(() => attack.current === 5);
        return fsm;
    }
    patrolling() {
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_4__["FiniteStateMachine"](0, [
            0,
            1,
            2,
        ]);
        const idle = this.idle();
        const run = this.run();
        fsm.state(0)
            .nested(idle)
            .onEnter(() => this.spawnMinions());
        fsm.state(0)
            .transitionTo(2)
            .condition(() => idle.isFinal)
            .condition(() => this.scanHero());
        fsm.state(0)
            .transitionTo(1)
            .condition(() => idle.isFinal)
            .condition(() => this.randomMove());
        fsm.state(0)
            .transitionTo(0)
            .condition(() => idle.isFinal);
        fsm.state(1)
            .nested(run);
        fsm.state(1)
            .transitionTo(2)
            .condition(() => run.isFinal)
            .condition(() => this.scanHero());
        fsm.state(1)
            .transitionTo(0)
            .condition(() => run.isFinal);
        return fsm;
    }
    attack() {
        const rng = this.dungeon.rng;
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_4__["FiniteStateMachine"](0, [
            0,
            1,
            2,
            3,
            4,
            5,
        ]);
        const idle = this.idle();
        const run = this.run();
        const hit = this.hit(new _Monster__WEBPACK_IMPORTED_MODULE_0__["MonsterHitController"](this));
        fsm.state(0);
        fsm.state(0)
            .transitionTo(5)
            .condition(() => !this.heroIsNear);
        fsm.state(0)
            .transitionTo(1)
            .condition(() => this.heroIsNear);
        fsm.state(1)
            .transitionTo(4)
            .condition(() => this.heroOnAttack)
            .condition(() => rng.float() < this.character.luck);
        fsm.state(1)
            .transitionTo(3)
            .condition(() => this.heroIsNear)
            .condition(() => this.runAway());
        fsm.state(1)
            .transitionTo(2)
            .condition(() => this.heroIsNear);
        fsm.state(1)
            .transitionTo(5);
        fsm.state(2)
            .nested(idle)
            .onEnter(() => this.lookAtHero())
            .onEnter(() => this.spawnMinions())
            .transitionTo(1)
            .condition(() => idle.isFinal);
        fsm.state(3)
            .nested(run)
            .transitionTo(1)
            .condition(() => run.isFinal);
        fsm.state(4)
            .nested(hit)
            .onEnter(() => this.lookAtHero())
            .transitionTo(2)
            .condition(() => hit.isFinal);
        return fsm;
    }
}
var SummonMonsterFsmState;
(function (SummonMonsterFsmState) {
    SummonMonsterFsmState[SummonMonsterFsmState["PATROLLING"] = 0] = "PATROLLING";
    SummonMonsterFsmState[SummonMonsterFsmState["ATTACK"] = 1] = "ATTACK";
})(SummonMonsterFsmState || (SummonMonsterFsmState = {}));
var SummonMonsterPatrollingFsmState;
(function (SummonMonsterPatrollingFsmState) {
    SummonMonsterPatrollingFsmState[SummonMonsterPatrollingFsmState["IDLE"] = 0] = "IDLE";
    SummonMonsterPatrollingFsmState[SummonMonsterPatrollingFsmState["RANDOM_MOVE"] = 1] = "RANDOM_MOVE";
    SummonMonsterPatrollingFsmState[SummonMonsterPatrollingFsmState["GO_ATTACK"] = 2] = "GO_ATTACK";
})(SummonMonsterPatrollingFsmState || (SummonMonsterPatrollingFsmState = {}));
var SummonMonsterAttackFsmState;
(function (SummonMonsterAttackFsmState) {
    SummonMonsterAttackFsmState[SummonMonsterAttackFsmState["INITIAL"] = 0] = "INITIAL";
    SummonMonsterAttackFsmState[SummonMonsterAttackFsmState["DECISION"] = 1] = "DECISION";
    SummonMonsterAttackFsmState[SummonMonsterAttackFsmState["IDLE"] = 2] = "IDLE";
    SummonMonsterAttackFsmState[SummonMonsterAttackFsmState["RUN_AWAY"] = 3] = "RUN_AWAY";
    SummonMonsterAttackFsmState[SummonMonsterAttackFsmState["HIT"] = 4] = "HIT";
    SummonMonsterAttackFsmState[SummonMonsterAttackFsmState["GO_PATROLLING"] = 5] = "GO_PATROLLING";
})(SummonMonsterAttackFsmState || (SummonMonsterAttackFsmState = {}));


/***/ }),

/***/ "./src/characters/TinyMonster.ts":
/*!***************************************!*\
  !*** ./src/characters/TinyMonster.ts ***!
  \***************************************/
/*! exports provided: tinyMonsters, TinyMonster, TinyMonsterController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "tinyMonsters", function() { return tinyMonsters; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TinyMonster", function() { return TinyMonster; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TinyMonsterController", function() { return TinyMonsterController; });
/* harmony import */ var _dungeon__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../dungeon */ "./src/dungeon/index.ts");
/* harmony import */ var _Monster__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Monster */ "./src/characters/Monster.ts");
/* harmony import */ var _drop__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../drop */ "./src/drop/index.ts");
/* harmony import */ var _fsm__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../fsm */ "./src/fsm.ts");




const knife = _drop__WEBPACK_IMPORTED_MODULE_2__["monsterWeapons"].knife;
const tinyMonsters = [
    { name: "chort", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].DEMON, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [] },
    { name: "wogol", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].DEMON, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [] },
    { name: "imp", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].DEMON, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [] },
    { name: "ice_zombie", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].ZOMBIE, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [knife] },
    { name: "tiny_zombie", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].ZOMBIE, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [knife] },
    { name: "zombie", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].ZOMBIE, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [knife] },
    { name: "masked_orc", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].ORC, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [knife] },
    { name: "orc_warrior", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].ORC, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].MINION, luck: 0.3, weapons: [knife] },
    { name: "goblin", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].ORC, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].MINION, luck: 0.3, weapons: [knife] },
    { name: "swampy", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].SLIME, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [] },
    { name: "muddy", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].SLIME, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].NORMAL, luck: 0.3, weapons: [] },
    { name: "skeleton", category: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterCategory"].UNDEAD, type: _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterType"].MINION, luck: 0.3, weapons: [knife] },
];
class TinyMonster extends _Monster__WEBPACK_IMPORTED_MODULE_1__["Monster"] {
    constructor(config, level) {
        super({
            name: config.name,
            category: config.category,
            type: config.type,
            speed: 0.8,
            healthMax: 10 + Math.floor(level * 2),
            level: level,
            luck: config.luck,
            baseDamage: 1 + 0.5 * level,
            xp: 35 + 5 * level,
            spawn: 3,
        });
    }
}
class TinyMonsterController extends _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterController"] {
    constructor(config, dungeon, x, y) {
        super(dungeon, {
            x: x,
            y: y,
            width: 1,
            height: 1,
            zIndex: _dungeon__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].character
        });
        this.maxDistance = 5;
        this.character = new TinyMonster(config, dungeon.level);
        const weapon = config.luck < this.dungeon.rng.float() ? _drop__WEBPACK_IMPORTED_MODULE_2__["Weapon"].select(this.dungeon.rng, config.weapons) : null;
        if (weapon) {
            this.character.inventory.equipment.weapon.set(weapon);
        }
        this._fsm = this.fsm();
        this.init();
    }
    onDead() {
        var _a;
        if (Math.random() < this.character.luck) {
            (_a = this.findDropCell()) === null || _a === void 0 ? void 0 : _a.randomDrop();
        }
        this.destroy();
    }
    fsm() {
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_3__["FiniteStateMachine"](0, [
            0,
            1,
            2,
        ]);
        const patrolling = this.patrolling();
        const alarm = this.alarm();
        const attack = this.attack();
        fsm.state(0)
            .nested(patrolling);
        fsm.state(0)
            .transitionTo(2)
            .condition(() => patrolling.isFinal)
            .condition(() => patrolling.current === 3);
        fsm.state(0)
            .transitionTo(1)
            .condition(() => patrolling.isFinal)
            .condition(() => patrolling.current === 2);
        fsm.state(1)
            .nested(alarm);
        fsm.state(1)
            .transitionTo(2)
            .condition(() => alarm.isFinal)
            .condition(() => alarm.current === 3);
        fsm.state(1)
            .transitionTo(0)
            .condition(() => alarm.isFinal)
            .condition(() => alarm.current === 4);
        fsm.state(2)
            .nested(attack);
        fsm.state(2)
            .transitionTo(1)
            .condition(() => attack.isFinal)
            .condition(() => attack.current === 4);
        return fsm;
    }
    patrolling() {
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_3__["FiniteStateMachine"](0, [
            0,
            1,
            2,
            3,
        ]);
        const idle = this.idle();
        const run = this.run();
        fsm.state(0)
            .nested(idle);
        fsm.state(0)
            .transitionTo(3)
            .condition(() => idle.isFinal)
            .condition(() => this.scanHero());
        fsm.state(0)
            .transitionTo(2)
            .condition(() => idle.isFinal)
            .condition(() => this.hasPath);
        fsm.state(0)
            .transitionTo(1)
            .condition(() => idle.isFinal)
            .condition(() => this.randomMove());
        fsm.state(0)
            .transitionTo(0)
            .condition(() => idle.isFinal);
        fsm.state(1)
            .nested(run);
        fsm.state(1)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => this.scanHero());
        fsm.state(1)
            .transitionTo(2)
            .condition(() => run.isFinal)
            .condition(() => this.hasPath);
        fsm.state(1)
            .transitionTo(0)
            .condition(() => run.isFinal);
        return fsm;
    }
    alarm() {
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_3__["FiniteStateMachine"](1, [
            0,
            1,
            2,
            3,
            4,
        ]);
        const idle = this.idle();
        const run = this.run();
        let alarmCountdown = 0;
        fsm.state(0)
            .onEnter(() => alarmCountdown = 10);
        fsm.state(0)
            .transitionTo(2)
            .condition(() => this.moveByPath());
        fsm.state(0)
            .transitionTo(1);
        fsm.state(1)
            .nested(idle);
        fsm.state(1)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => this.scanHero());
        fsm.state(1)
            .transitionTo(2)
            .condition(() => idle.isFinal)
            .condition(() => this.moveByPath());
        fsm.state(1)
            .transitionTo(1)
            .condition(() => idle.isFinal)
            .condition(() => --alarmCountdown > 0);
        fsm.state(1)
            .transitionTo(4)
            .condition(() => idle.isFinal);
        fsm.state(2)
            .nested(run);
        fsm.state(2)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => this.scanHero());
        fsm.state(2)
            .transitionTo(2)
            .condition(() => run.isFinal)
            .condition(() => this.moveByPath());
        fsm.state(2)
            .transitionTo(1)
            .condition(() => run.isFinal);
        return fsm;
    }
    attack() {
        const rng = this.dungeon.rng;
        const fsm = new _fsm__WEBPACK_IMPORTED_MODULE_3__["FiniteStateMachine"](0, [
            0,
            1,
            2,
            3,
            4,
        ]);
        const idle = this.idle();
        const run = this.run();
        const hit = this.hit(new _Monster__WEBPACK_IMPORTED_MODULE_1__["MonsterHitController"](this));
        fsm.state(0)
            .transitionTo(3)
            .condition(() => this.heroOnAttack)
            .condition(() => rng.float() < this.character.luck);
        fsm.state(0)
            .transitionTo(2)
            .condition(() => this.heroIsNear)
            .condition(() => this.moveToHero());
        fsm.state(0)
            .transitionTo(1)
            .condition(() => this.heroIsNear);
        fsm.state(0)
            .transitionTo(4);
        fsm.state(1)
            .nested(idle)
            .onEnter(() => this.lookAtHero());
        fsm.state(1)
            .transitionTo(3)
            .condition(() => idle.isFinal)
            .condition(() => this.heroOnAttack)
            .condition(() => rng.float() < this.character.luck);
        fsm.state(1)
            .transitionTo(2)
            .condition(() => idle.isFinal)
            .condition(() => this.heroIsNear)
            .condition(() => this.moveToHero());
        fsm.state(1)
            .transitionTo(1)
            .condition(() => idle.isFinal)
            .condition(() => this.heroIsNear);
        fsm.state(1)
            .transitionTo(4)
            .condition(() => idle.isFinal);
        fsm.state(2)
            .nested(run);
        fsm.state(2)
            .transitionTo(3)
            .condition(() => run.isFinal)
            .condition(() => this.heroOnAttack)
            .condition(() => rng.float() < this.character.luck);
        fsm.state(2)
            .transitionTo(2)
            .condition(() => run.isFinal)
            .condition(() => this.heroIsNear)
            .condition(() => this.moveToHero());
        fsm.state(2)
            .transitionTo(1)
            .condition(() => run.isFinal);
        fsm.state(3)
            .nested(hit)
            .onEnter(() => this.lookAtHero());
        fsm.state(3)
            .transitionTo(2)
            .condition(() => hit.isFinal)
            .condition(() => this.heroIsNear)
            .condition(() => this.moveToHero());
        fsm.state(3)
            .transitionTo(1)
            .condition(() => hit.isFinal);
        return fsm;
    }
}
var TinyMonsterState;
(function (TinyMonsterState) {
    TinyMonsterState[TinyMonsterState["PATROLLING"] = 0] = "PATROLLING";
    TinyMonsterState[TinyMonsterState["ALARM"] = 1] = "ALARM";
    TinyMonsterState[TinyMonsterState["ATTACK"] = 2] = "ATTACK";
})(TinyMonsterState || (TinyMonsterState = {}));
var TinyMonsterPatrollingState;
(function (TinyMonsterPatrollingState) {
    TinyMonsterPatrollingState[TinyMonsterPatrollingState["IDLE"] = 0] = "IDLE";
    TinyMonsterPatrollingState[TinyMonsterPatrollingState["RANDOM_MOVE"] = 1] = "RANDOM_MOVE";
    TinyMonsterPatrollingState[TinyMonsterPatrollingState["GO_ALARM"] = 2] = "GO_ALARM";
    TinyMonsterPatrollingState[TinyMonsterPatrollingState["GO_ATTACK"] = 3] = "GO_ATTACK";
})(TinyMonsterPatrollingState || (TinyMonsterPatrollingState = {}));
var TinyMonsterAlarmState;
(function (TinyMonsterAlarmState) {
    TinyMonsterAlarmState[TinyMonsterAlarmState["INITIAL"] = 0] = "INITIAL";
    TinyMonsterAlarmState[TinyMonsterAlarmState["IDLE"] = 1] = "IDLE";
    TinyMonsterAlarmState[TinyMonsterAlarmState["RUN"] = 2] = "RUN";
    TinyMonsterAlarmState[TinyMonsterAlarmState["GO_ATTACK"] = 3] = "GO_ATTACK";
    TinyMonsterAlarmState[TinyMonsterAlarmState["GO_PATROLLING"] = 4] = "GO_PATROLLING";
})(TinyMonsterAlarmState || (TinyMonsterAlarmState = {}));
var TinyMonsterAttackState;
(function (TinyMonsterAttackState) {
    TinyMonsterAttackState[TinyMonsterAttackState["INITIAL"] = 0] = "INITIAL";
    TinyMonsterAttackState[TinyMonsterAttackState["IDLE"] = 1] = "IDLE";
    TinyMonsterAttackState[TinyMonsterAttackState["RUN"] = 2] = "RUN";
    TinyMonsterAttackState[TinyMonsterAttackState["HIT"] = 3] = "HIT";
    TinyMonsterAttackState[TinyMonsterAttackState["GO_ALARM"] = 4] = "GO_ALARM";
})(TinyMonsterAttackState || (TinyMonsterAttackState = {}));


/***/ }),

/***/ "./src/characters/index.ts":
/*!*********************************!*\
  !*** ./src/characters/index.ts ***!
  \*********************************/
/*! exports provided: Animator, Character, ScanDirection, BaseCharacterController, IdleState, RunState, HitState, SimpleHitState, ComboHitState, CharacterView, DefaultWeaponView, heroCharacterNames, Hero, HeroController, HeroStateView, NpcSkill, SellingSkill, BuyingSkill, HealSkill, TradingType, NPCs, Npc, NpcController, MonsterCategory, MonsterType, Monster, MonsterController, MonsterHitController, tinyMonsters, TinyMonster, TinyMonsterController, bossMonsters, BossMonster, BossMonsterController, BossHealthView, summonMonsters, SummonMonster, SummonMonsterController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Animator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Animator */ "./src/characters/Animator.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Animator", function() { return _Animator__WEBPACK_IMPORTED_MODULE_0__["Animator"]; });

/* harmony import */ var _Character__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Character */ "./src/characters/Character.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Character", function() { return _Character__WEBPACK_IMPORTED_MODULE_1__["Character"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScanDirection", function() { return _Character__WEBPACK_IMPORTED_MODULE_1__["ScanDirection"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BaseCharacterController", function() { return _Character__WEBPACK_IMPORTED_MODULE_1__["BaseCharacterController"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "IdleState", function() { return _Character__WEBPACK_IMPORTED_MODULE_1__["IdleState"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RunState", function() { return _Character__WEBPACK_IMPORTED_MODULE_1__["RunState"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HitState", function() { return _Character__WEBPACK_IMPORTED_MODULE_1__["HitState"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SimpleHitState", function() { return _Character__WEBPACK_IMPORTED_MODULE_1__["SimpleHitState"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ComboHitState", function() { return _Character__WEBPACK_IMPORTED_MODULE_1__["ComboHitState"]; });

/* harmony import */ var _CharacterView__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./CharacterView */ "./src/characters/CharacterView.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CharacterView", function() { return _CharacterView__WEBPACK_IMPORTED_MODULE_2__["CharacterView"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DefaultWeaponView", function() { return _CharacterView__WEBPACK_IMPORTED_MODULE_2__["DefaultWeaponView"]; });

/* harmony import */ var _Hero__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Hero */ "./src/characters/Hero.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "heroCharacterNames", function() { return _Hero__WEBPACK_IMPORTED_MODULE_3__["heroCharacterNames"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Hero", function() { return _Hero__WEBPACK_IMPORTED_MODULE_3__["Hero"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HeroController", function() { return _Hero__WEBPACK_IMPORTED_MODULE_3__["HeroController"]; });

/* harmony import */ var _HeroStateView__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./HeroStateView */ "./src/characters/HeroStateView.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HeroStateView", function() { return _HeroStateView__WEBPACK_IMPORTED_MODULE_4__["HeroStateView"]; });

/* harmony import */ var _Npc__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Npc */ "./src/characters/Npc.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "NpcSkill", function() { return _Npc__WEBPACK_IMPORTED_MODULE_5__["NpcSkill"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SellingSkill", function() { return _Npc__WEBPACK_IMPORTED_MODULE_5__["SellingSkill"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BuyingSkill", function() { return _Npc__WEBPACK_IMPORTED_MODULE_5__["BuyingSkill"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HealSkill", function() { return _Npc__WEBPACK_IMPORTED_MODULE_5__["HealSkill"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TradingType", function() { return _Npc__WEBPACK_IMPORTED_MODULE_5__["TradingType"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "NPCs", function() { return _Npc__WEBPACK_IMPORTED_MODULE_5__["NPCs"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Npc", function() { return _Npc__WEBPACK_IMPORTED_MODULE_5__["Npc"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "NpcController", function() { return _Npc__WEBPACK_IMPORTED_MODULE_5__["NpcController"]; });

/* harmony import */ var _Monster__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./Monster */ "./src/characters/Monster.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MonsterCategory", function() { return _Monster__WEBPACK_IMPORTED_MODULE_6__["MonsterCategory"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MonsterType", function() { return _Monster__WEBPACK_IMPORTED_MODULE_6__["MonsterType"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Monster", function() { return _Monster__WEBPACK_IMPORTED_MODULE_6__["Monster"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MonsterController", function() { return _Monster__WEBPACK_IMPORTED_MODULE_6__["MonsterController"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MonsterHitController", function() { return _Monster__WEBPACK_IMPORTED_MODULE_6__["MonsterHitController"]; });

/* harmony import */ var _TinyMonster__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./TinyMonster */ "./src/characters/TinyMonster.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "tinyMonsters", function() { return _TinyMonster__WEBPACK_IMPORTED_MODULE_7__["tinyMonsters"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TinyMonster", function() { return _TinyMonster__WEBPACK_IMPORTED_MODULE_7__["TinyMonster"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TinyMonsterController", function() { return _TinyMonster__WEBPACK_IMPORTED_MODULE_7__["TinyMonsterController"]; });

/* harmony import */ var _BossMonster__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./BossMonster */ "./src/characters/BossMonster.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "bossMonsters", function() { return _BossMonster__WEBPACK_IMPORTED_MODULE_8__["bossMonsters"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BossMonster", function() { return _BossMonster__WEBPACK_IMPORTED_MODULE_8__["BossMonster"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BossMonsterController", function() { return _BossMonster__WEBPACK_IMPORTED_MODULE_8__["BossMonsterController"]; });

/* harmony import */ var _BossHealthView__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./BossHealthView */ "./src/characters/BossHealthView.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BossHealthView", function() { return _BossHealthView__WEBPACK_IMPORTED_MODULE_9__["BossHealthView"]; });

/* harmony import */ var _SummonMonster__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./SummonMonster */ "./src/characters/SummonMonster.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "summonMonsters", function() { return _SummonMonster__WEBPACK_IMPORTED_MODULE_10__["summonMonsters"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SummonMonster", function() { return _SummonMonster__WEBPACK_IMPORTED_MODULE_10__["SummonMonster"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SummonMonsterController", function() { return _SummonMonster__WEBPACK_IMPORTED_MODULE_10__["SummonMonsterController"]; });














/***/ }),

/***/ "./src/concurency.ts":
/*!***************************!*\
  !*** ./src/concurency.ts ***!
  \***************************/
/*! exports provided: yields */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "yields", function() { return yields; });
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function yields(delay = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve => setTimeout(resolve, delay)));
    });
}


/***/ }),

/***/ "./src/dead.scene.ts":
/*!***************************!*\
  !*** ./src/dead.scene.ts ***!
  \***************************/
/*! exports provided: YouDeadScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "YouDeadScene", function() { return YouDeadScene; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);

class YouDeadScene {
    constructor(controller) {
        this._controller = controller;
    }
    init() {
        this.renderTitle();
        this.renderHelp();
        this._controller.app.ticker.add(this.handleInput, this);
    }
    destroy() {
        this._controller.app.ticker.remove(this.handleInput, this);
        this._controller.stage.removeChildren();
    }
    pause() {
    }
    resume() {
    }
    renderTitle() {
        const title = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"]("ROGUELIKE DUNGEON", { font: { name: 'alagard', size: 64 } });
        title.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.5, 0);
        title.position.set(this._controller.app.screen.width >> 1, 64);
        this._controller.stage.addChild(title);
        const youDead = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"]("YOU DEAD", { font: { name: "alagard", size: 128 }, tint: 0xFF0000 });
        youDead.anchor = 0.5;
        youDead.position.set(this._controller.app.screen.width >> 1, 256);
        this._controller.stage.addChild(youDead);
    }
    renderHelp() {
        const line = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"]("PRESS F TO RESTART", { font: { name: "alagard", size: 32 } });
        line.anchor = 0.5;
        line.position.set(this._controller.app.screen.width >> 1, this._controller.app.screen.height - 64);
        this._controller.stage.addChild(line);
    }
    handleInput() {
        if (this._controller.joystick.hit.once()) {
            this._controller.selectHero();
        }
    }
}


/***/ }),

/***/ "./src/dialog/dialog.ts":
/*!******************************!*\
  !*** ./src/dialog/dialog.ts ***!
  \******************************/
/*! exports provided: DialogManager, Dialog, DialogQuestion, DialogAnswer */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DialogManager", function() { return DialogManager; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Dialog", function() { return Dialog; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DialogQuestion", function() { return DialogQuestion; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DialogAnswer", function() { return DialogAnswer; });
/* harmony import */ var _observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../observable */ "./src/observable.ts");
/* harmony import */ var _expression__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../expression */ "./src/expression.ts");
/* harmony import */ var _template__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../template */ "./src/template.ts");



class DialogManager {
    constructor(controller) {
        this._controller = controller;
    }
    dialog(hero, npc) {
        const dialogs = this._controller.app.loader.resources['dialogs.json'].data;
        const config = dialogs[npc.name] || dialogs["default"];
        return new Dialog(this._controller, hero, npc, config);
    }
}
class Dialog {
    constructor(controller, hero, npc, config) {
        this._question = new _observable__WEBPACK_IMPORTED_MODULE_0__["EventPublisher"]();
        this._controller = controller;
        this.hero = hero;
        this.npc = npc;
        this._config = config;
        this._expression = new _expression__WEBPACK_IMPORTED_MODULE_1__["Expression"]();
        this._expression.register("goto", 100, true, this.goto.bind(this));
        this._expression.register("exit", 100, false, this.exit.bind(this));
        this._expression.register("context", 100, false, this.context.bind(this));
        this._expression.register("hasSkill", 100, false, this.hasSkill.bind(this));
        this._expression.register("skill", 100, false, this.skill.bind(this));
        this._template = new _template__WEBPACK_IMPORTED_MODULE_2__["Template"]();
        this._template.add("hero", this.hero);
        this._template.add("npc", this.npc);
    }
    get question() {
        return this._question;
    }
    start() {
        this.goto(...this._config.start);
    }
    hasSkill(id) {
        return this.npc.hasSkill(id);
    }
    skill(id) {
        var _a;
        (_a = this.npc.getSkill(id)) === null || _a === void 0 ? void 0 : _a.use(this.hero);
    }
    exit() {
        this._controller.closeModal();
    }
    context(key, value) {
        if (value === undefined) {
            return this.npc.getContext(key);
        }
        else {
            this.npc.setContext(key, value);
            return null;
        }
    }
    goto(...ids) {
        for (const id of ids) {
            const config = this._config.questions[id];
            if (this.check(config.conditions || [])) {
                const text = this._template.render(config.text);
                const question = new DialogQuestion(this, text);
                for (const answer of config.answers) {
                    if (this.check(answer.conditions)) {
                        const text = this._template.render(answer.text);
                        question.add(text, answer.commands);
                    }
                }
                this._question.send(question);
                return;
            }
        }
    }
    check(conditions) {
        if (conditions) {
            for (const rule of conditions) {
                if (!this.evaluate(rule)) {
                    return false;
                }
            }
        }
        return true;
    }
    evaluate(command) {
        return this._expression.evaluate(command);
    }
}
class DialogQuestion {
    constructor(dialog, text) {
        this.answers = [];
        this._dialog = dialog;
        this.text = text;
    }
    add(text, commands) {
        this.answers.push(new DialogAnswer(this._dialog, text, commands));
    }
}
class DialogAnswer {
    constructor(dialog, text, commands) {
        this.dialog = dialog;
        this.text = text;
        this.commands = commands;
    }
    action() {
        for (const command of this.commands) {
            this.dialog.evaluate(command);
        }
    }
}


/***/ }),

/***/ "./src/dialog/index.ts":
/*!*****************************!*\
  !*** ./src/dialog/index.ts ***!
  \*****************************/
/*! exports provided: DialogManager, Dialog, DialogQuestion, DialogAnswer, DialogModalScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _dialog__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dialog */ "./src/dialog/dialog.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DialogManager", function() { return _dialog__WEBPACK_IMPORTED_MODULE_0__["DialogManager"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Dialog", function() { return _dialog__WEBPACK_IMPORTED_MODULE_0__["Dialog"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DialogQuestion", function() { return _dialog__WEBPACK_IMPORTED_MODULE_0__["DialogQuestion"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DialogAnswer", function() { return _dialog__WEBPACK_IMPORTED_MODULE_0__["DialogAnswer"]; });

/* harmony import */ var _modal__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./modal */ "./src/dialog/modal.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DialogModalScene", function() { return _modal__WEBPACK_IMPORTED_MODULE_1__["DialogModalScene"]; });





/***/ }),

/***/ "./src/dialog/modal.ts":
/*!*****************************!*\
  !*** ./src/dialog/modal.ts ***!
  \*****************************/
/*! exports provided: DialogModalScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DialogModalScene", function() { return DialogModalScene; });
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_1__);


class DialogModalScene extends _ui__WEBPACK_IMPORTED_MODULE_0__["HStack"] {
    constructor(controller, dialog) {
        super({
            background: { color: _ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].background },
        });
        this._selectable = null;
        this._dialogView = null;
        this._questionView = null;
        this._answers = [];
        this._controller = controller;
        this._dialog = dialog;
    }
    init() {
        this._selectable = new _ui__WEBPACK_IMPORTED_MODULE_0__["SelectableGrid"](this._controller.joystick);
        const iconView = new _ui__WEBPACK_IMPORTED_MODULE_0__["VStack"]({
            spacing: 0,
            background: { color: _ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiBackground },
        });
        this.addChild(iconView);
        const icon = this._controller.resources.animated(this._dialog.npc.name + "_idle");
        icon.width = icon.width * 4;
        icon.height = icon.height * 4;
        iconView.addChild(icon);
        this._dialogView = new _ui__WEBPACK_IMPORTED_MODULE_0__["VStack"]({
            padding: 0
        });
        this.addChild(this._dialogView);
        this._questionView = new DialogQuestionView(300);
        this._dialogView.addChild(this._questionView);
        this.position.set((this._controller.app.screen.width >> 1) - (this.width >> 1), (this._controller.app.screen.height >> 1) - (this.height >> 1));
        this._controller.stage.addChild(this);
        this._controller.app.ticker.add(this.handleInput, this);
        this._dialog.question.subscribe(this.onQuestion, this);
        this._dialog.start();
    }
    destroy() {
        this._dialog.question.unsubscribe(this.onQuestion, this);
        this._controller.app.ticker.remove(this.handleInput, this);
        this._selectable = null;
        super.destroy({ children: true });
    }
    onQuestion(question) {
        for (let i = 0; i < this._answers.length; i++) {
            const answer = this._answers[i];
            answer.destroy();
            this._selectable.remove(0, i);
        }
        this._selectable.reset();
        this._answers = [];
        this._questionView.text = question.text;
        for (let i = 0; i < question.answers.length; i++) {
            const answer = question.answers[i];
            const answerView = new _ui__WEBPACK_IMPORTED_MODULE_0__["Button"]({
                label: answer.text,
                width: 300,
            });
            this._selectable.set(0, i, answerView, answer.action.bind(answer));
            this._answers.push(answerView);
            this._dialogView.addChild(answerView);
        }
        this.updateLayout();
        this._selectable.reset();
    }
    handleInput() {
        var _a;
        (_a = this._selectable) === null || _a === void 0 ? void 0 : _a.handleInput();
    }
}
class DialogQuestionView extends pixi_js__WEBPACK_IMPORTED_MODULE_1__["Container"] {
    constructor(width) {
        super();
        this._text = new pixi_js__WEBPACK_IMPORTED_MODULE_1__["BitmapText"]("", { font: { name: "alagard", size: 16 } });
        this._text.maxWidth = width - _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder * 2;
        this._text.calculateBounds();
        this._text.position.set(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder);
        this._background = new pixi_js__WEBPACK_IMPORTED_MODULE_1__["Graphics"]().beginFill(_ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiBackground).drawRect(0, 0, 1, 1).endFill();
        this._background.width = width;
        this.addChild(this._background, this._text);
    }
    set text(text) {
        this._text.text = text;
        this._background.height = this._text.height + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder * 2;
    }
}


/***/ }),

/***/ "./src/drop/Drop.ts":
/*!**************************!*\
  !*** ./src/drop/Drop.ts ***!
  \**************************/
/*! exports provided: Coins, HealthFlask, HealthBigFlask */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Coins", function() { return Coins; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HealthFlask", function() { return HealthFlask; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HealthBigFlask", function() { return HealthBigFlask; });
class Coins {
    constructor(rng) {
        this.spriteName = "coin";
        this._coins = rng.range(1, 30);
    }
    pickedUp(hero) {
        hero.addCoins(this._coins);
        return true;
    }
}
class HealthFlask {
    constructor() {
        this.spriteName = "flask_red.png";
        this._health = 2;
    }
    info() {
        return {
            name: "Health flask",
            health: this._health,
            buyPrice: 100,
        };
    }
    pickedUp(hero) {
        return hero.inventory.add(this);
    }
    same(item) {
        return item instanceof HealthFlask;
    }
    use(cell, character) {
        character.heal(this._health);
        cell.decrease();
    }
}
class HealthBigFlask {
    constructor() {
        this.spriteName = "flask_big_red.png";
        this._health = 5;
    }
    info() {
        return {
            name: "Big health flask",
            health: this._health,
            buyPrice: 300,
        };
    }
    pickedUp(hero) {
        return hero.inventory.add(this);
    }
    same(item) {
        return item instanceof HealthBigFlask;
    }
    use(cell, character) {
        character.heal(this._health);
        cell.decrease();
    }
}


/***/ }),

/***/ "./src/drop/Weapon.ts":
/*!****************************!*\
  !*** ./src/drop/Weapon.ts ***!
  \****************************/
/*! exports provided: Weapon */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Weapon", function() { return Weapon; });
/* harmony import */ var _WeaponConfig__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WeaponConfig */ "./src/drop/WeaponConfig.ts");

class Weapon {
    constructor(config) {
        this._name = config.name;
        this.speed = config.speed;
        this.distance = config.distance;
        this.damage = config.damage;
        this._price = config.price;
        this.animations = config.animations;
    }
    get spriteName() {
        return this._name + ".png";
    }
    info() {
        return {
            name: this._name.replace(/weapon_/, ''),
            speed: this.speed,
            distance: this.distance,
            damage: this.damage,
            sellPrice: this._price,
            buyPrice: this._price * 10,
        };
    }
    pickedUp(hero) {
        return hero.inventory.add(this);
    }
    same() {
        return false;
    }
    use(cell) {
        cell.equip();
    }
    static create(rng, level) {
        const available = _WeaponConfig__WEBPACK_IMPORTED_MODULE_0__["weaponConfigs"].filter(c => c.level <= level);
        if (available.length > 0) {
            const config = rng.select(available);
            return new Weapon(config);
        }
        else {
            return null;
        }
    }
    static select(rng, weapons) {
        if (weapons.length > 0) {
            const config = rng.select(weapons);
            return new Weapon(config);
        }
        else {
            return null;
        }
    }
}


/***/ }),

/***/ "./src/drop/WeaponAnimation.ts":
/*!*************************************!*\
  !*** ./src/drop/WeaponAnimation.ts ***!
  \*************************************/
/*! exports provided: basic, basicSword, weaponAnimations */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "basic", function() { return basic; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "basicSword", function() { return basicSword; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "weaponAnimations", function() { return weaponAnimations; });
const basic = {
    idle: {
        smoothly: false,
        angle: [
            { time: 0, args: [0] },
        ],
        pos: [
            { time: 0, args: [-1, 0] },
            { time: 1, args: [-1, 1] },
            { time: 2, args: [-1, 2] },
            { time: 3, args: [-1, 1] },
        ]
    },
    run: {
        smoothly: false,
        angle: [
            { time: 0, args: [0] }
        ],
        pos: [
            { time: 0, args: [-1, -1] },
            { time: 1, args: [-1, -2] },
            { time: 2, args: [-1, -1] },
            { time: 3, args: [-1, 0] },
        ]
    },
    hit: {
        smoothly: false,
        angle: [
            { time: 0, args: [0] },
            { time: 1.5, args: [-30] },
            { time: 2, args: [120] },
            { time: 3, args: [90] },
            { time: 4, args: [0] },
        ],
        pos: [
            { time: 0, args: [-1, 0] },
        ]
    },
};
const basicSword = {
    idle: basic.idle,
    run: basic.run,
    hit: basic.hit,
    combo: [
        {
            smoothly: false,
            angle: [
                { time: 0, args: [0] },
                { time: 1.5, args: [-30] },
                { time: 2, args: [120] },
                { time: 4, args: [120] },
            ],
            pos: [
                { time: 0, args: [-1, 0] },
            ],
        },
        {
            smoothly: false,
            angle: [
                { time: 0, args: [120] },
                { time: 1.5, args: [150] },
                { time: 2, args: [-15] },
                { time: 4, args: [-15] },
            ],
            pos: [
                { time: 0, args: [-1, 0] },
            ],
        },
        {
            smoothly: true,
            angle: [
                { time: 0, args: [-15] },
                { time: 1.5, args: [90] },
                { time: 4, args: [90] }
            ],
            pos: [
                {
                    time: 0,
                    args: [-1, 0]
                },
                {
                    time: 0.5,
                    args: [-14, -4]
                },
                {
                    time: 3,
                    args: [-14, -4]
                },
                {
                    time: 3.5,
                    args: [0, -4]
                },
                {
                    time: 6,
                    args: [0, -4]
                }
            ]
        }
    ]
};
const weaponAnimations = {
    knife: {
        idle: basic.idle,
        run: basic.run,
        hit: {
            smoothly: true,
            angle: [
                { time: 0, args: [90] },
            ],
            pos: [
                { time: 0, args: [-8, -4] },
                { time: 1, args: [-4, -4] },
                { time: 2, args: [4, -4] },
                { time: 3, args: [-2, -4] },
            ]
        },
    },
    rusty_sword: basicSword,
    regular_sword: basicSword,
    red_gem_sword: basicSword,
    hammer: basic,
    big_hammer: basic,
    baton_with_spikes: basic,
    mace: basic,
    katana: basicSword,
    saw_sword: basicSword,
    anime_sword: basicSword,
    axe: basic,
    machete: basic,
    cleaver: basic,
    duel_sword: basicSword,
    knight_sword: basicSword,
    golden_sword: basicSword,
    lavish_sword: basicSword,
};


/***/ }),

/***/ "./src/drop/WeaponConfig.ts":
/*!**********************************!*\
  !*** ./src/drop/WeaponConfig.ts ***!
  \**********************************/
/*! exports provided: weapons, weaponConfigs, monsterWeapons, npcWeapons */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "weapons", function() { return weapons; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "weaponConfigs", function() { return weaponConfigs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "monsterWeapons", function() { return monsterWeapons; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "npcWeapons", function() { return npcWeapons; });
/* harmony import */ var _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WeaponAnimation */ "./src/drop/WeaponAnimation.ts");

const weapons = {
    knife: {
        name: "weapon_knife",
        speed: 1.4,
        distance: 1,
        damage: 2,
        level: 1,
        price: 12,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].knife
    },
    rusty_sword: {
        name: "weapon_rusty_sword",
        speed: 1.0,
        distance: 1,
        damage: 4,
        level: 1,
        price: 15,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].rusty_sword
    },
    regular_sword: {
        name: "weapon_regular_sword",
        speed: 1.0,
        distance: 1,
        damage: 5,
        level: 3,
        price: 20,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].regular_sword
    },
    red_gem_sword: {
        name: "weapon_red_gem_sword",
        speed: 1.0,
        distance: 1,
        damage: 6,
        level: 3,
        price: 30,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].red_gem_sword
    },
    hammer: {
        name: "weapon_hammer",
        speed: 0.7,
        distance: 1,
        damage: 7,
        level: 5,
        price: 38,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].hammer
    },
    big_hammer: {
        name: "weapon_big_hammer",
        speed: 0.5,
        distance: 2,
        damage: 10,
        level: 5,
        price: 40,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].big_hammer
    },
    baton_with_spikes: {
        name: "weapon_baton_with_spikes",
        speed: 0.6,
        distance: 1,
        damage: 7,
        level: 5,
        price: 42,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].baton_with_spikes
    },
    mace: {
        name: "weapon_mace",
        speed: 0.6,
        distance: 1,
        damage: 7,
        level: 5,
        price: 45,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].mace
    },
    katana: {
        name: "weapon_katana",
        speed: 1.5,
        distance: 1,
        damage: 8,
        level: 7,
        price: 100,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].katana
    },
    saw_sword: {
        name: "weapon_saw_sword",
        speed: 1.5,
        distance: 1,
        damage: 9,
        level: 7,
        price: 110,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].saw_sword
    },
    anime_sword: {
        name: "weapon_anime_sword",
        speed: 0.7,
        distance: 1,
        damage: 12,
        level: 7,
        price: 130,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].anime_sword
    },
    axe: {
        name: "weapon_axe",
        speed: 0.8,
        distance: 1,
        damage: 12,
        level: 7,
        price: 115,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].axe
    },
    machete: {
        name: "weapon_machete",
        speed: 1.0,
        distance: 1,
        damage: 11,
        level: 9,
        price: 150,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].machete
    },
    cleaver: {
        name: "weapon_cleaver",
        speed: 1.0,
        distance: 1,
        damage: 12,
        level: 9,
        price: 160,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].cleaver
    },
    duel_sword: {
        name: "weapon_duel_sword",
        speed: 1.5,
        distance: 1,
        damage: 13,
        level: 9,
        price: 170,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].duel_sword
    },
    knight_sword: {
        name: "weapon_knight_sword",
        speed: 1.5,
        distance: 1,
        damage: 14,
        level: 9,
        price: 180,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].knight_sword
    },
    golden_sword: {
        name: "weapon_golden_sword",
        speed: 1.5,
        distance: 1,
        damage: 15,
        level: 11,
        price: 220,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].golden_sword
    },
    lavish_sword: {
        name: "weapon_lavish_sword",
        speed: 1.5,
        distance: 1,
        damage: 16,
        level: 11,
        price: 240,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].lavish_sword
    },
};
const weaponConfigs = Object.getOwnPropertyNames(weapons).map(w => weapons[w]);
const monsterWeapons = {
    knife: {
        name: "weapon_knife",
        speed: 0.7,
        distance: 1,
        damage: 0.5,
        level: 1,
        price: 0,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].knife
    },
    baton_with_spikes: {
        name: "weapon_baton_with_spikes",
        speed: 0.3,
        distance: 1,
        damage: 3,
        level: 5,
        price: 0,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].baton_with_spikes
    },
    anime_sword: {
        name: "weapon_anime_sword",
        speed: 0.4,
        distance: 1,
        damage: 4,
        level: 10,
        price: 0,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].anime_sword
    },
    big_hammer: {
        name: "weapon_big_hammer",
        speed: 0.3,
        distance: 2,
        damage: 5,
        level: 15,
        price: 0,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].big_hammer
    },
    mace: {
        name: "weapon_mace",
        speed: 0.6,
        distance: 1,
        damage: 6,
        level: 20,
        price: 0,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].mace
    },
    cleaver: {
        name: "weapon_cleaver",
        speed: 0.5,
        distance: 1,
        damage: 7,
        level: 25,
        price: 0,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].cleaver
    },
};
const npcWeapons = {
    knife: {
        name: "weapon_knife",
        speed: 1.4,
        distance: 1,
        damage: 2,
        level: 1,
        price: 12,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].knife
    },
    hammer: {
        name: "weapon_hammer",
        speed: 0.7,
        distance: 1,
        damage: 7,
        level: 5,
        price: 38,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].hammer
    },
    cleaver: {
        name: "weapon_cleaver",
        speed: 1.0,
        distance: 1,
        damage: 12,
        level: 9,
        price: 160,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].cleaver
    },
    axe: {
        name: "weapon_axe",
        speed: 0.8,
        distance: 1,
        damage: 12,
        level: 7,
        price: 115,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].axe
    },
    regular_sword: {
        name: "weapon_regular_sword",
        speed: 1.0,
        distance: 1,
        damage: 5,
        level: 3,
        price: 20,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].regular_sword
    },
    knight_sword: {
        name: "weapon_knight_sword",
        speed: 1.5,
        distance: 1,
        damage: 14,
        level: 9,
        price: 180,
        animations: _WeaponAnimation__WEBPACK_IMPORTED_MODULE_0__["weaponAnimations"].knight_sword
    },
};


/***/ }),

/***/ "./src/drop/index.ts":
/*!***************************!*\
  !*** ./src/drop/index.ts ***!
  \***************************/
/*! exports provided: Coins, HealthFlask, HealthBigFlask, Weapon, basic, basicSword, weaponAnimations, weapons, weaponConfigs, monsterWeapons, npcWeapons */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Drop__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Drop */ "./src/drop/Drop.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Coins", function() { return _Drop__WEBPACK_IMPORTED_MODULE_0__["Coins"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HealthFlask", function() { return _Drop__WEBPACK_IMPORTED_MODULE_0__["HealthFlask"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HealthBigFlask", function() { return _Drop__WEBPACK_IMPORTED_MODULE_0__["HealthBigFlask"]; });

/* harmony import */ var _Weapon__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Weapon */ "./src/drop/Weapon.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Weapon", function() { return _Weapon__WEBPACK_IMPORTED_MODULE_1__["Weapon"]; });

/* harmony import */ var _WeaponAnimation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./WeaponAnimation */ "./src/drop/WeaponAnimation.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "basic", function() { return _WeaponAnimation__WEBPACK_IMPORTED_MODULE_2__["basic"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "basicSword", function() { return _WeaponAnimation__WEBPACK_IMPORTED_MODULE_2__["basicSword"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "weaponAnimations", function() { return _WeaponAnimation__WEBPACK_IMPORTED_MODULE_2__["weaponAnimations"]; });

/* harmony import */ var _WeaponConfig__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./WeaponConfig */ "./src/drop/WeaponConfig.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "weapons", function() { return _WeaponConfig__WEBPACK_IMPORTED_MODULE_3__["weapons"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "weaponConfigs", function() { return _WeaponConfig__WEBPACK_IMPORTED_MODULE_3__["weaponConfigs"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "monsterWeapons", function() { return _WeaponConfig__WEBPACK_IMPORTED_MODULE_3__["monsterWeapons"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "npcWeapons", function() { return _WeaponConfig__WEBPACK_IMPORTED_MODULE_3__["npcWeapons"]; });







/***/ }),

/***/ "./src/dungeon/DungeonBonfire.ts":
/*!***************************************!*\
  !*** ./src/dungeon/DungeonBonfire.ts ***!
  \***************************************/
/*! exports provided: BonfireState, DungeonBonfire */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BonfireState", function() { return BonfireState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonBonfire", function() { return DungeonBonfire; });
/* harmony import */ var _DungeonMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DungeonMap */ "./src/dungeon/DungeonMap.ts");
/* harmony import */ var _DungeonLight__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DungeonLight */ "./src/dungeon/DungeonLight.ts");
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");



const TILE_SIZE = 16;
var BonfireState;
(function (BonfireState) {
    BonfireState[BonfireState["UNLIT"] = 0] = "UNLIT";
    BonfireState[BonfireState["LIGHT"] = 1] = "LIGHT";
    BonfireState[BonfireState["LIT"] = 2] = "LIT";
})(BonfireState || (BonfireState = {}));
class DungeonBonfire {
    constructor(dungeon, x, y, light) {
        this.width = 1;
        this.height = 1;
        this.static = true;
        this.interacting = true;
        this._dungeon = dungeon;
        this.x = x;
        this.y = y;
        this._state = BonfireState.UNLIT;
        this._sprite = this._dungeon.animated(this.x, this.y, `bonfire_unlit`);
        this._sprite.zIndex = _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].static + this.y * _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].row;
        this._dungeon.cell(this.x, this.y).object = this;
        if (light)
            this.light();
    }
    get state() {
        return this._state;
    }
    destroy() {
        this._dungeon.remove(this.x, this.y, this);
        this._sprite.destroy();
    }
    interact(hero) {
        switch (this._state) {
            case BonfireState.UNLIT:
                hero.character.bonfires.add(this._dungeon.level);
                this._dungeon.controller.showBanner({
                    text: 'BONFIRE LIT',
                    color: _ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiYellow
                });
                this.light();
                break;
            case BonfireState.LIGHT:
            case BonfireState.LIT:
                this._dungeon.controller.showBonfire(hero.character);
                break;
        }
    }
    collide() {
        return true;
    }
    light() {
        if (this._state === BonfireState.UNLIT) {
            this._state = BonfireState.LIGHT;
            this._sprite.destroy();
            this._sprite = this._dungeon.animated(this.x, this.y, "bonfire_light");
            this._sprite.zIndex = _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].static + this.y * _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].row;
            this._sprite.loop = false;
            this._sprite.onComplete = () => this.lit();
            this._dungeon.light.addLight({
                x: this.x * TILE_SIZE + 8,
                y: this.y * TILE_SIZE - TILE_SIZE,
            }, _DungeonLight__WEBPACK_IMPORTED_MODULE_1__["DungeonLightType"].BONFIRE);
        }
    }
    lit() {
        var _a;
        this._state = BonfireState.LIT;
        (_a = this._sprite) === null || _a === void 0 ? void 0 : _a.destroy();
        this._sprite = this._dungeon.animated(this.x, this.y, "bonfire_lit");
        this._sprite.zIndex = _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].static + this.y * _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].row;
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonBonfireModalScene.ts":
/*!*************************************************!*\
  !*** ./src/dungeon/DungeonBonfireModalScene.ts ***!
  \*************************************************/
/*! exports provided: DungeonBonfireModal */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonBonfireModal", function() { return DungeonBonfireModal; });
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");

class DungeonBonfireModal extends _ui__WEBPACK_IMPORTED_MODULE_0__["VStack"] {
    constructor(controller, hero) {
        super({ background: { color: _ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].background } });
        this._selectable = null;
        this._controller = controller;
        this._hero = hero;
    }
    destroy() {
        this._controller.app.ticker.remove(this.handleInput, this);
        this._selectable = null;
        super.destroy({ children: true });
    }
    init() {
        this._selectable = new _ui__WEBPACK_IMPORTED_MODULE_0__["SelectableGrid"](this._controller.joystick);
        let y = 0;
        const addButton = (label, action) => {
            const button = new _ui__WEBPACK_IMPORTED_MODULE_0__["Button"]({
                label: label,
                width: 400,
                height: 32,
                textSize: 24
            });
            this.addChild(button);
            this._selectable.set(0, y, button, action);
            y++;
        };
        const levels = [...this._hero.bonfires].sort((a, b) => a - b);
        for (const level of levels) {
            addButton(`Level ${level}`, () => this.goto(level));
        }
        addButton(`Cancel`, () => this.cancel());
        this._controller.stage.addChild(this);
        this._controller.app.ticker.add(this.handleInput, this);
        this.position.set((this._controller.app.screen.width >> 1) - (this.width >> 1), (this._controller.app.screen.height >> 1) - (this.height >> 1));
    }
    goto(level) {
        this._controller.closeModal();
        this._controller.generateDungeon({
            hero: this._hero,
            level: level
        });
    }
    cancel() {
        this._controller.closeModal();
    }
    handleInput() {
        var _a;
        (_a = this._selectable) === null || _a === void 0 ? void 0 : _a.handleInput();
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonDrop.ts":
/*!************************************!*\
  !*** ./src/dungeon/DungeonDrop.ts ***!
  \************************************/
/*! exports provided: DungeonDrop */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonDrop", function() { return DungeonDrop; });
/* harmony import */ var _DungeonMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DungeonMap */ "./src/dungeon/DungeonMap.ts");

const TILE_SIZE = 16;
class DungeonDrop {
    constructor(dungeon, x, y, drop) {
        this.height = 1;
        this.width = 1;
        this.static = true;
        this.interacting = false;
        this.dungeon = dungeon;
        this.x = x;
        this.y = y;
        this.drop = drop;
        this._sprite = dungeon.sprite(x, y, drop.spriteName);
        this._sprite.zIndex = _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].drop + y * _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].row;
        this._sprite.x += (TILE_SIZE >> 1);
        this._sprite.y += TILE_SIZE - 2;
        this._sprite.anchor.set(0.5, 1);
    }
    pickedUp(hero) {
        if (this.drop.pickedUp(hero)) {
            this.dungeon.cell(this.x, this.y).dropItem = null;
            return true;
        }
        else {
            return false;
        }
    }
    interact(_) {
    }
    collide(_) {
        return false;
    }
    destroy() {
        this._sprite.destroy();
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonFloor.ts":
/*!*************************************!*\
  !*** ./src/dungeon/DungeonFloor.ts ***!
  \*************************************/
/*! exports provided: DungeonFloor, DefaultDungeonFloor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonFloor", function() { return DungeonFloor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DefaultDungeonFloor", function() { return DefaultDungeonFloor; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _DungeonMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DungeonMap */ "./src/dungeon/DungeonMap.ts");


const TILE_SIZE = 16;
class DungeonFloor {
    constructor(dungeon, x, y, name) {
        this.height = 1;
        this.width = 1;
        this.static = true;
        this.dungeon = dungeon;
        this.x = x;
        this.y = y;
        this.name = name;
        this.sprite = this.dungeon.controller.resources.sprite(name);
        this.sprite.zIndex = _DungeonMap__WEBPACK_IMPORTED_MODULE_1__["DungeonZIndexes"].floor;
        this.sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
        if (this.sprite instanceof pixi_js__WEBPACK_IMPORTED_MODULE_0__["AnimatedSprite"]) {
            this.dungeon.container.addChild(this.sprite);
        }
        else {
            this.dungeon.floorContainer.addChild(this.sprite);
        }
    }
    collide() {
        return false;
    }
    destroy() {
        this.sprite.destroy();
    }
}
class DefaultDungeonFloor extends DungeonFloor {
    constructor(dungeon, x, y, name) {
        super(dungeon, x, y, name);
        this.interacting = false;
    }
    interact() {
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonGenerator.ts":
/*!*****************************************!*\
  !*** ./src/dungeon/DungeonGenerator.ts ***!
  \*****************************************/
/*! exports provided: BaseDungeonGenerator */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BaseDungeonGenerator", function() { return BaseDungeonGenerator; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _DungeonMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DungeonMap */ "./src/dungeon/DungeonMap.ts");
/* harmony import */ var _characters__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../characters */ "./src/characters/index.ts");
/* harmony import */ var _DungeonLight__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./DungeonLight */ "./src/dungeon/DungeonLight.ts");
/* harmony import */ var _DungeonBonfire__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./DungeonBonfire */ "./src/dungeon/DungeonBonfire.ts");





class BaseDungeonGenerator {
    constructor(controller) {
        this.resources = controller.resources;
        this.controller = controller;
    }
    createDungeon(rng, seed, level, width, height) {
        return new _DungeonMap__WEBPACK_IMPORTED_MODULE_1__["DungeonMap"](this.controller, new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Ticker"](), rng, seed, level, width, height);
    }
    replaceFloorRandomly(rng, dungeon) {
        const replacements = ['floor_2.png', 'floor_3.png', 'floor_4.png', 'floor_5.png', 'floor_6.png', 'floor_7.png', 'floor_8.png'];
        const percent = 0.2;
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const cell = dungeon.cell(x, y);
                if (cell.hasFloor && rng.float() < percent) {
                    cell.floorName = rng.select(replacements);
                }
            }
        }
    }
    replaceWallRandomly(rng, dungeon) {
        const banners = [
            'wall_banner_red.png',
            'wall_banner_blue.png',
            'wall_banner_green.png',
            'wall_banner_yellow.png',
        ];
        const goo = [
            'wall_goo.png',
        ];
        const fountains = [
            'wall_fountain_mid_red',
            'wall_fountain_mid_blue',
        ];
        const holes = [
            'wall_hole_1.png',
            'wall_hole_2.png',
        ];
        const percent = 0.3;
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const cell = dungeon.cell(x, y);
                if (cell.wallName === 'wall_mid.png') {
                    if (rng.float() < percent) {
                        const replacements = [...holes];
                        const hasFloor = y + 1 < dungeon.height && dungeon.cell(x, y + 1).floorName === 'floor_1.png';
                        if (hasFloor) {
                            replacements.push(...banners);
                            replacements.push(...goo);
                        }
                        const hasTop = y > 0 && dungeon.cell(x, y - 1).wallName === 'wall_top_mid.png';
                        if (hasTop && hasFloor) {
                            replacements.push(...fountains);
                        }
                        const replacement = rng.select(replacements);
                        switch (replacement) {
                            case 'wall_goo.png':
                                dungeon.cell(x, y).wallName = 'wall_goo.png';
                                dungeon.cell(x, y + 1).floorName = 'wall_goo_base.png';
                                break;
                            case 'wall_fountain_mid_red':
                                dungeon.cell(x, y - 1).wallName = 'wall_fountain_top.png';
                                dungeon.cell(x, y).wallName = 'wall_fountain_mid_red';
                                dungeon.cell(x, y + 1).floorName = 'wall_fountain_basin_red';
                                break;
                            case 'wall_fountain_mid_blue':
                                dungeon.cell(x, y - 1).wallName = 'wall_fountain_top.png';
                                dungeon.cell(x, y).wallName = 'wall_fountain_mid_blue';
                                dungeon.cell(x, y + 1).floorName = 'wall_fountain_basin_blue';
                                break;
                            default:
                                dungeon.cell(x, y).wallName = replacement;
                                break;
                        }
                    }
                }
            }
        }
    }
    distance(a, b) {
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    }
    findFreePositions(dungeon, width, height) {
        const free = [];
        for (let y = height; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width - width; x++) {
                let valid = true;
                for (let dy = 0; dy < height && valid; dy++) {
                    for (let dx = 0; dx < width && valid; dx++) {
                        const cell = dungeon.cell(x + dx, y - dy);
                        valid = cell.hasFloor && !cell.hasObject;
                    }
                }
                if (valid)
                    free.push(dungeon.cell(x, y));
            }
        }
        return free;
    }
    placeHero(rng, dungeon, hero) {
        const free = this.findFreePositions(dungeon, 2, 2);
        if (free.length === 0) {
            throw "hero not placed";
        }
        const cell = rng.select(free);
        const ai = new _characters__WEBPACK_IMPORTED_MODULE_2__["HeroController"](hero, dungeon, cell.x, cell.y);
        dungeon.light.addLight(ai.view, _DungeonLight__WEBPACK_IMPORTED_MODULE_3__["DungeonLightType"].HERO);
        return ai;
    }
    placeNpc(rng, dungeon, hero) {
        const maxHeroDistance = 10;
        const npcCount = 5;
        for (let n = 0; n < npcCount; n++) {
            const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
                return this.distance(hero, cell) < maxHeroDistance;
            });
            if (free.length === 0) {
                console.warn("no free place for npc");
            }
            const i = rng.range(0, free.length);
            const [cell] = free.splice(i, 1);
            const config = rng.select(_characters__WEBPACK_IMPORTED_MODULE_2__["NPCs"]);
            new _characters__WEBPACK_IMPORTED_MODULE_2__["NpcController"](config, dungeon, this.controller, cell.x, cell.y);
        }
    }
    placeMonsters(rng, dungeon, hero) {
        const totalSpace = dungeon.width * dungeon.height;
        const floorSpace = Math.floor(totalSpace * 0.4);
        const spawnSpace = Math.floor(floorSpace * 0.2);
        const monsterCount = Math.floor(spawnSpace * 0.1);
        const summonMonsterCount = Math.floor(spawnSpace * 0.01);
        console.log(`total space: ${floorSpace}`);
        console.log(`floor space: ${floorSpace}`);
        console.log(`spawn space: ${spawnSpace}`);
        console.log(`monster count: ${monsterCount}`);
        console.log(`summon monster count: ${summonMonsterCount}`);
        const category = this.bossConfig(dungeon).category;
        for (let m = 0; m < monsterCount; m++) {
            if (!this.placeMonster(rng, dungeon, hero, category)) {
                break;
            }
        }
        for (let m = 0; m < summonMonsterCount; m++) {
            if (!this.placeSummonMonster(rng, dungeon, hero, category)) {
                break;
            }
        }
    }
    placeMonster(rng, dungeon, hero, category) {
        const filteredMonsters = _characters__WEBPACK_IMPORTED_MODULE_2__["tinyMonsters"].filter(config => {
            return config.category === category ||
                (config.category != _characters__WEBPACK_IMPORTED_MODULE_2__["MonsterCategory"].DEMON &&
                    config.category != _characters__WEBPACK_IMPORTED_MODULE_2__["MonsterCategory"].ORC &&
                    config.category != _characters__WEBPACK_IMPORTED_MODULE_2__["MonsterCategory"].ZOMBIE);
        });
        if (filteredMonsters.length === 0) {
            console.warn("no tiny monster config found");
            return false;
        }
        const minHeroDistance = 15;
        const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
            return this.distance(hero, cell) > minHeroDistance;
        });
        if (free.length === 0) {
            console.warn("no free place for tiny monster");
            return false;
        }
        const i = rng.range(0, free.length);
        const [cell] = free.splice(i, 1);
        const config = rng.select(filteredMonsters);
        new _characters__WEBPACK_IMPORTED_MODULE_2__["TinyMonsterController"](config, dungeon, cell.x, cell.y);
        return true;
    }
    placeSummonMonster(rng, dungeon, hero, category) {
        const filteredSummonMonsters = _characters__WEBPACK_IMPORTED_MODULE_2__["summonMonsters"].filter(config => {
            return config.category === category ||
                (config.category != _characters__WEBPACK_IMPORTED_MODULE_2__["MonsterCategory"].DEMON &&
                    config.category != _characters__WEBPACK_IMPORTED_MODULE_2__["MonsterCategory"].ORC &&
                    config.category != _characters__WEBPACK_IMPORTED_MODULE_2__["MonsterCategory"].ZOMBIE);
        });
        if (filteredSummonMonsters.length === 0) {
            console.warn("no summon monster config found");
            return false;
        }
        const minHeroDistance = 15;
        const free = this.findFreePositions(dungeon, 3, 3).filter(cell => {
            return this.distance(hero, cell) > minHeroDistance;
        });
        if (free.length === 0) {
            console.warn("no free place for summon monster");
            return false;
        }
        const i = rng.range(0, free.length);
        const [cell] = free.splice(i, 1);
        const config = rng.select(filteredSummonMonsters);
        new _characters__WEBPACK_IMPORTED_MODULE_2__["SummonMonsterController"](config, dungeon, cell.x + 1, cell.y - 1);
        return true;
    }
    placeBoss(rng, dungeon, hero) {
        const minHeroDistance = 20;
        const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
            return this.distance(hero, cell) > minHeroDistance;
        });
        if (free.length > 0) {
            const i = rng.range(0, free.length);
            const [cell] = free.splice(i, 1);
            const config = this.bossConfig(dungeon);
            new _characters__WEBPACK_IMPORTED_MODULE_2__["BossMonsterController"](config, dungeon, cell.x, cell.y);
        }
        else {
            console.error("boss not placed");
        }
    }
    bossConfig(dungeon) {
        return _characters__WEBPACK_IMPORTED_MODULE_2__["bossMonsters"][Math.floor((dungeon.level - 1) / 5) % _characters__WEBPACK_IMPORTED_MODULE_2__["bossMonsters"].length];
    }
    placeDrop(rng, dungeon) {
        const free = [];
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.height; x++) {
                const cell = dungeon.cell(x, y);
                if (cell.hasFloor && !cell.hasDrop && !cell.hasObject) {
                    free.push(cell);
                }
            }
        }
        const dropPercent = 3;
        const dropCount = Math.floor(free.length * dropPercent / 100.0);
        for (let d = 0; d < dropCount && free.length > 0; d++) {
            const i = rng.range(0, free.length);
            free.splice(i, 1)[0].randomDrop();
        }
    }
    placeLadder(rng, dungeon, hero) {
        const free3 = [];
        const free1 = [];
        const directions = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
        for (let y = 1; y < dungeon.height - 1; y++) {
            for (let x = 1; x < dungeon.height - 1; x++) {
                const cell = dungeon.cell(x, y);
                if (cell.hasFloor) {
                    let c = 0;
                    for (const [dx, dy] of directions) {
                        if (dungeon.cell(x + dx, y + dy).hasFloor) {
                            c++;
                        }
                    }
                    const distance = this.distance(hero, { x: x, y: y });
                    if (c === directions.length) {
                        free3.push([cell, distance]);
                    }
                    else {
                        free1.push([cell, distance]);
                    }
                }
            }
        }
        free3.sort((a, b) => a[1] - b[1]);
        free1.sort((a, b) => a[1] - b[1]);
        const free = [...free1, ...free3].reverse().splice(0, 10);
        if (free.length == 0) {
            throw "ladder not set";
        }
        rng.select(free)[0].ladder();
    }
    placeBonfire(rng, dungeon, hero) {
        const maxHeroDistance = 10;
        const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
            return this.distance(hero, cell) < maxHeroDistance;
        });
        if (free.length > 0) {
            const cell = rng.select(free);
            const light = hero.character.bonfires.has(dungeon.level);
            return new _DungeonBonfire__WEBPACK_IMPORTED_MODULE_4__["DungeonBonfire"](dungeon, cell.x, cell.y, light);
        }
        else {
            throw "bonfire not placed";
        }
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonLadder.ts":
/*!**************************************!*\
  !*** ./src/dungeon/DungeonLadder.ts ***!
  \**************************************/
/*! exports provided: DungeonLadder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonLadder", function() { return DungeonLadder; });
/* harmony import */ var _DungeonFloor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DungeonFloor */ "./src/dungeon/DungeonFloor.ts");

class DungeonLadder extends _DungeonFloor__WEBPACK_IMPORTED_MODULE_0__["DungeonFloor"] {
    constructor(dungeon, x, y) {
        super(dungeon, x, y, 'floor_ladder.png');
        this.interacting = true;
    }
    interact(hero) {
        this.dungeon.controller.updateHero(hero.character, this.dungeon.level + 1);
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonLight.ts":
/*!*************************************!*\
  !*** ./src/dungeon/DungeonLight.ts ***!
  \*************************************/
/*! exports provided: DungeonLight, DungeonLightType, DungeonLightSource */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonLight", function() { return DungeonLight; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonLightType", function() { return DungeonLightType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonLightSource", function() { return DungeonLightSource; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ShadowCaster */ "./src/dungeon/ShadowCaster.ts");


const TILE_SIZE = 16;
class DungeonLight {
    constructor(dungeon) {
        this._lights = [];
        this._wall_top = {
            default: [
                { x1: 0, y1: 12, x2: 16, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 0, y1: 12, x2: 0, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 16, y1: 12, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            top: [
                { x1: 0, y1: 0, x2: 16, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
            ],
            left: [
                { x1: 0, y1: 0, x2: 0, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            right: [
                { x1: 16, y1: 0, x2: 16, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            bottom: []
        };
        this._wall_side_left = {
            default: [
                { x1: 11, y1: 0, x2: 11, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 11, y1: 0, x2: 16, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 11, y1: 16, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
            ],
            top: [
                { x1: 0, y1: 0, x2: 11, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
            ],
            left: [
                { x1: 0, y1: 0, x2: 0, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            right: [],
            bottom: [
                { x1: 0, y1: 16, x2: 11, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
        };
        this._wall_side_right = {
            default: [
                { x1: 5, y1: 0, x2: 5, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 0, y1: 0, x2: 5, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 0, y1: 16, x2: 5, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
            ],
            top: [
                { x1: 5, y1: 0, x2: 16, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
            ],
            left: [],
            right: [
                { x1: 16, y1: 0, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            bottom: [
                { x1: 5, y1: 16, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
        };
        this._wall_corner_left = {
            default: [
                { x1: 5, y1: 0, x2: 5, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 5, y1: 12, x2: 16, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 16, y1: 12, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL }
            ],
            top: [
                { x1: 5, y1: 0, x2: 16, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
            ],
            left: [],
            right: [
                { x1: 16, y1: 0, x2: 16, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            bottom: [],
        };
        this._wall_corner_right = {
            default: [
                { x1: 11, y1: 0, x2: 11, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 0, y1: 12, x2: 11, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                { x1: 0, y1: 12, x2: 0, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL }
            ],
            top: [
                { x1: 0, y1: 0, x2: 11, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
            ],
            left: [
                { x1: 0, y1: 0, x2: 0, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            right: [],
            bottom: [],
        };
        this._wall_default = {
            default: [],
            top: [
                { x1: 0, y1: 0, x2: 16, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
            ],
            left: [
                { x1: 0, y1: 0, x2: 0, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            right: [
                { x1: 16, y1: 0, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
            bottom: [
                { x1: 0, y1: 16, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
            ],
        };
        this._config = {
            "wall_top_mid.png": this._wall_top,
            "wall_side_front_left.png": this._wall_side_left,
            "wall_side_front_right.png": this._wall_side_right,
            "wall_side_mid_left.png": this._wall_side_left,
            "wall_side_mid_right.png": this._wall_side_right,
            "wall_side_top_left.png": {
                default: [
                    { x1: 11, y1: 12, x2: 16, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                    { x1: 11, y1: 12, x2: 11, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                top: [
                    { x1: 0, y1: 0, x2: 16, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
                ],
                left: [
                    { x1: 0, y1: 0, x2: 0, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                right: [
                    { x1: 16, y1: 0, x2: 16, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                bottom: [
                    { x1: 0, y1: 16, x2: 11, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
            },
            "wall_side_top_right.png": {
                default: [
                    { x1: 0, y1: 12, x2: 5, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                    { x1: 5, y1: 12, x2: 5, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                top: [
                    { x1: 0, y1: 0, x2: 16, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
                ],
                left: [
                    { x1: 0, y1: 12, x2: 0, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                right: [
                    { x1: 16, y1: 0, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                bottom: [
                    { x1: 5, y1: 16, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
            },
            "wall_inner_corner_t_top_left.png": this._wall_top,
            "wall_inner_corner_t_top_right.png": this._wall_top,
            "wall_inner_corner_l_top_left.png": this._wall_corner_left,
            "wall_inner_corner_l_top_right.png": this._wall_corner_right,
            "wall_corner_bottom_left.png": this._wall_corner_left,
            "wall_corner_bottom_right.png": this._wall_corner_right,
            "wall_corner_top_left.png": this._wall_top,
            "wall_corner_top_right.png": this._wall_top,
            "wall_fountain_top.png": {
                default: [
                    { x1: 0, y1: 12, x2: 0, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                    { x1: 0, y1: 12, x2: 2, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                    { x1: 2, y1: 9, x2: 2, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                    { x1: 2, y1: 9, x2: 14, y2: 9, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                    { x1: 14, y1: 9, x2: 14, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                    { x1: 14, y1: 12, x2: 16, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                    { x1: 16, y1: 12, x2: 16, y2: 16, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                top: [
                    { x1: 0, y1: 0, x2: 16, y2: 0, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].TOP },
                ],
                left: [
                    { x1: 0, y1: 0, x2: 0, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                right: [
                    { x1: 16, y1: 0, x2: 16, y2: 12, type: _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["SegmentType"].NORMAL },
                ],
                bottom: []
            },
            "wall_one_top.png": this._wall_top,
            "wall_one_corner_left.png": this._wall_corner_left,
            "wall_one_corner_right.png": this._wall_corner_right,
        };
        this._dungeon = dungeon;
        this.layer = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["display"].Layer();
        this.layer.useRenderTexture = true;
        this.layer.on('display', (element) => {
            element.blendMode = pixi_js__WEBPACK_IMPORTED_MODULE_0__["BLEND_MODES"].MULTIPLY;
        });
        this.layer.clearColor = [0, 0, 0, 1];
        this.container = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"]();
        this.layer.addChild(this.container);
        this._heroLightTexture = DungeonLight.gradient("white", 150);
        this._fountainRedTexture = DungeonLight.gradient("rgb(211,78,56)", 50);
        this._fountainBlueTexture = DungeonLight.gradient("rgb(86,152,204)", 50);
        this._bonfireTexture = DungeonLight.gradient("rgb(255,239,204)", 100);
        this._shadowCaster = new _ShadowCaster__WEBPACK_IMPORTED_MODULE_1__["ShadowCaster"]();
        this._dungeon.ticker.add(this.update, this);
    }
    destroy() {
        this._dungeon.ticker.remove(this.update, this);
        this._lights.forEach(l => l.destroy());
        this._heroLightTexture.destroy();
        this._fountainBlueTexture.destroy();
        this._fountainRedTexture.destroy();
        this._bonfireTexture.destroy();
        this.container.destroy();
        this.layer.destroy();
    }
    loadMap() {
        this._shadowCaster.init();
        const dungeon = this._dungeon;
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const cell = dungeon.cell(x, y);
                if (cell.hasFloor) {
                    const position = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](x * TILE_SIZE, y * TILE_SIZE);
                    switch (cell.floorName) {
                        case 'wall_fountain_basin_red':
                            this.addLight(position, DungeonLightType.RED_BASIN);
                            break;
                        case 'wall_fountain_basin_blue':
                            this.addLight(position, DungeonLightType.BLUE_BASIN);
                            break;
                        default:
                            break;
                    }
                    const hasTop = y > 0 && dungeon.cell(x, y - 1).hasFloor;
                    const hasBottom = y + 1 < dungeon.height && dungeon.cell(x, y + 1).hasFloor;
                    const hasLeft = x > 0 && dungeon.cell(x - 1, y).hasFloor;
                    const hasRight = x + 1 < dungeon.width && dungeon.cell(x + 1, y).hasFloor;
                    let config;
                    const cellWall = cell.wallName;
                    if (cellWall && this._config[cellWall]) {
                        config = this._config[cellWall] || this._wall_default;
                    }
                    else {
                        config = this._wall_default;
                    }
                    this.add(x, y, config.default);
                    if (!hasTop)
                        this.add(x, y, config.top);
                    if (!hasBottom)
                        this.add(x, y, config.bottom);
                    if (!hasLeft)
                        this.add(x, y, config.left);
                    if (!hasRight)
                        this.add(x, y, config.right);
                }
            }
        }
        this._shadowCaster.optimize();
        this.update();
    }
    addLight(position, type) {
        let texture;
        let maxDistance;
        switch (type) {
            case DungeonLightType.HERO:
                texture = this._heroLightTexture;
                maxDistance = 350;
                break;
            case DungeonLightType.RED_BASIN:
                texture = this._fountainRedTexture;
                maxDistance = 150;
                break;
            case DungeonLightType.BLUE_BASIN:
                texture = this._fountainBlueTexture;
                maxDistance = 150;
                break;
            case DungeonLightType.BONFIRE:
                texture = this._bonfireTexture;
                maxDistance = 250;
                break;
        }
        const light = new DungeonLightSource(position, maxDistance, texture, this.container);
        this._lights.push(light);
        this.renderLight(light);
    }
    add(x, y, segments) {
        for (const segment of segments) {
            this._shadowCaster.addSegment(x * TILE_SIZE + segment.x1, y * TILE_SIZE + segment.y1, x * TILE_SIZE + segment.x2, y * TILE_SIZE + segment.y2, segment.type);
        }
    }
    update() {
        for (const light of this._lights) {
            if (light.dirty) {
                this.renderLight(light);
                light.rendered();
            }
        }
    }
    renderLight(light) {
        const start = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](light.position.x + 8, light.position.y + 8);
        this._shadowCaster.setLightLocation(start.x, start.y, light.maxDistance);
        const output = this._shadowCaster.sweep();
        light.sprite.position.set(start.x, start.y);
        light.mask.clear()
            .beginFill(0xFFFFFF)
            .drawPolygon(output)
            .endFill();
    }
    static gradient(color, radius) {
        const diameter = radius << 1;
        const c = document.createElement("canvas");
        c.width = diameter;
        c.height = diameter;
        const ctx = c.getContext("2d");
        if (ctx) {
            const grd = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
            grd.addColorStop(0.1, color);
            grd.addColorStop(1, "transparent");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, diameter, diameter);
        }
        return pixi_js__WEBPACK_IMPORTED_MODULE_0__["Texture"].from(c);
    }
}
var DungeonLightType;
(function (DungeonLightType) {
    DungeonLightType[DungeonLightType["HERO"] = 0] = "HERO";
    DungeonLightType[DungeonLightType["RED_BASIN"] = 1] = "RED_BASIN";
    DungeonLightType[DungeonLightType["BLUE_BASIN"] = 2] = "BLUE_BASIN";
    DungeonLightType[DungeonLightType["BONFIRE"] = 3] = "BONFIRE";
})(DungeonLightType || (DungeonLightType = {}));
class DungeonLightSource {
    constructor(position, maxDistance, texture, container) {
        this._rendered = null;
        this.position = position;
        this.maxDistance = maxDistance;
        this.mask = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Graphics"]();
        this.mask.isMask = true;
        this.sprite = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Sprite"](texture);
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.mask = this.mask;
        this.sprite.blendMode = pixi_js__WEBPACK_IMPORTED_MODULE_0__["BLEND_MODES"].ADD;
        container.addChild(this.mask);
        container.addChild(this.sprite);
    }
    get dirty() {
        return this._rendered === null || this.position.x !== this._rendered.x || this.position.y !== this._rendered.y;
    }
    rendered() {
        this._rendered = { x: this.position.x, y: this.position.y };
    }
    destroy() {
        this.sprite.destroy();
        this.mask.destroy();
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonMap.ts":
/*!***********************************!*\
  !*** ./src/dungeon/DungeonMap.ts ***!
  \***********************************/
/*! exports provided: DungeonZIndexes, DungeonMap, DungeonMapCell, DungeonTitle */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonZIndexes", function() { return DungeonZIndexes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonMap", function() { return DungeonMap; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonMapCell", function() { return DungeonMapCell; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonTitle", function() { return DungeonTitle; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _drop__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../drop */ "./src/drop/index.ts");
/* harmony import */ var _DungeonLight__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DungeonLight */ "./src/dungeon/DungeonLight.ts");
/* harmony import */ var _DungeonFloor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./DungeonFloor */ "./src/dungeon/DungeonFloor.ts");
/* harmony import */ var _DungeonWall__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./DungeonWall */ "./src/dungeon/DungeonWall.ts");
/* harmony import */ var _DungeonDrop__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./DungeonDrop */ "./src/dungeon/DungeonDrop.ts");
/* harmony import */ var _DungeonLadder__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./DungeonLadder */ "./src/dungeon/DungeonLadder.ts");







const TILE_SIZE = 16;
const DungeonZIndexes = {
    character: 60,
    hero: 70,
    drop: 50,
    static: 40,
    floor: 1,
    wall: 100,
    row: 256
};
class DungeonMap {
    constructor(controller, ticker, rng, seed, level, width, height) {
        this.scale = 2;
        this.controller = controller;
        this.ticker = ticker;
        this.rng = rng;
        this.seed = seed;
        this.level = level;
        this.width = width;
        this.height = height;
        this._cells = [];
        for (let y = 0; y < this.width; y++) {
            this._cells[y] = [];
            for (let x = 0; x < this.height; x++) {
                this._cells[y][x] = new DungeonMapCell(this, x, y);
            }
        }
        this.container = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"]();
        this.container.zIndex = 0;
        this.container.sortableChildren = true;
        this.container.scale.set(this.scale, this.scale);
        this.floorContainer = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"]();
        this.floorContainer.zIndex = DungeonZIndexes.floor;
        this.floorContainer.sortableChildren = false;
        this.floorContainer.cacheAsBitmap = true;
        this.container.addChild(this.floorContainer);
        this.light = new _DungeonLight__WEBPACK_IMPORTED_MODULE_2__["DungeonLight"](this);
        this.light.layer.zIndex = 1;
        this.light.container.scale.set(this.scale, this.scale);
        this.lighting = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Sprite"](this.light.layer.getRenderTexture());
        this.lighting.blendMode = pixi_js__WEBPACK_IMPORTED_MODULE_0__["BLEND_MODES"].MULTIPLY;
        this.lighting.zIndex = 2;
    }
    destroy() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this._cells[y][x].destroy();
            }
        }
        this.lighting.destroy();
        this.light.destroy();
        this.container.destroy({ children: true });
    }
    log(message) {
        console.info(message);
    }
    cell(x, y) {
        return this._cells[y][x];
    }
    remove(x, y, object) {
        for (let dx = 0; dx < object.width; dx++) {
            for (let dy = 0; dy < object.height; dy++) {
                const cell = this.cell(x + dx, y - dy);
                const c = cell.object;
                if (c && (c === object)) {
                    cell.object = null;
                }
            }
        }
    }
    set(x, y, object) {
        for (let dx = 0; dx < object.width; dx++) {
            for (let dy = 0; dy < object.height; dy++) {
                this.cell(x + dx, y - dy).object = object;
            }
        }
    }
    available(x, y, object) {
        for (let dx = 0; dx < object.width; dx++) {
            for (let dy = 0; dy < object.height; dy++) {
                const cell = this.cell(x + dx, y - dy);
                if (!cell.hasFloor || cell.collide(object)) {
                    return false;
                }
            }
        }
        return true;
    }
    camera(x, y) {
        const screen = this.controller.app.screen;
        const posX = (screen.width >> 1) - x * this.scale;
        const posY = (screen.height >> 1) - y * this.scale;
        this.container.position.set(posX, posY);
        this.light.container.position.set(posX, posY);
    }
    sprite(x, y, name) {
        const sprite = this.controller.resources.sprite(name);
        sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
        this.container.addChild(sprite);
        return sprite;
    }
    animated(x, y, name) {
        const animated = this.controller.resources.animated(name);
        animated.position.set(x * TILE_SIZE, y * TILE_SIZE);
        animated.play();
        this.container.addChild(animated);
        return animated;
    }
}
class DungeonMapCell {
    constructor(dungeon, x, y) {
        this._floor = null;
        this._wall = null;
        this._drop = null;
        this._object = null;
        this._dungeon = dungeon;
        this.x = x;
        this.y = y;
    }
    destroy() {
        var _a, _b, _c, _d;
        (_a = this._floor) === null || _a === void 0 ? void 0 : _a.destroy();
        this._floor = null;
        (_b = this._wall) === null || _b === void 0 ? void 0 : _b.destroy();
        this._wall = null;
        (_c = this._drop) === null || _c === void 0 ? void 0 : _c.destroy();
        this._drop = null;
        (_d = this._object) === null || _d === void 0 ? void 0 : _d.destroy();
        this._object = null;
    }
    set floorName(name) {
        var _a;
        (_a = this._floor) === null || _a === void 0 ? void 0 : _a.destroy();
        this._floor = null;
        if (name) {
            this._floor = new _DungeonFloor__WEBPACK_IMPORTED_MODULE_3__["DefaultDungeonFloor"](this._dungeon, this.x, this.y, name);
        }
    }
    get floorName() {
        var _a;
        return ((_a = this._floor) === null || _a === void 0 ? void 0 : _a.name) || null;
    }
    get floor() {
        return this._floor;
    }
    get hasFloor() {
        return !!this._floor;
    }
    get wallName() {
        var _a;
        return ((_a = this._wall) === null || _a === void 0 ? void 0 : _a.name) || null;
    }
    set wallName(name) {
        var _a;
        (_a = this._wall) === null || _a === void 0 ? void 0 : _a.destroy();
        this._wall = null;
        if (name) {
            this._wall = new _DungeonWall__WEBPACK_IMPORTED_MODULE_4__["DungeonWall"](this._dungeon, this.x, this.y, name);
        }
    }
    get wall() {
        return this._wall;
    }
    set dropItem(drop) {
        var _a;
        (_a = this._drop) === null || _a === void 0 ? void 0 : _a.destroy();
        this._drop = null;
        if (drop) {
            this._drop = new _DungeonDrop__WEBPACK_IMPORTED_MODULE_5__["DungeonDrop"](this._dungeon, this.x, this.y, drop);
        }
    }
    get drop() {
        return this._drop;
    }
    get hasDrop() {
        return !!this._drop;
    }
    randomDrop() {
        const rng = this._dungeon.rng;
        const weightCoins = 20;
        const weightHealthFlask = 10;
        const weightHealthBigFlask = 10;
        const weightWeapon = 10;
        const sum = weightCoins + weightHealthFlask + weightHealthBigFlask + weightWeapon;
        let remainingDistance = rng.float() * sum;
        if ((remainingDistance -= weightWeapon) <= 0) {
            this.dropItem = _drop__WEBPACK_IMPORTED_MODULE_1__["Weapon"].create(rng, this._dungeon.level);
        }
        else if ((remainingDistance -= weightHealthBigFlask) <= 0) {
            this.dropItem = new _drop__WEBPACK_IMPORTED_MODULE_1__["HealthBigFlask"]();
        }
        else if ((remainingDistance -= weightHealthFlask) <= 0) {
            this.dropItem = new _drop__WEBPACK_IMPORTED_MODULE_1__["HealthFlask"]();
        }
        else if ((remainingDistance - weightCoins) <= 0) {
            this.dropItem = new _drop__WEBPACK_IMPORTED_MODULE_1__["Coins"](rng);
        }
        return this.hasDrop;
    }
    get object() {
        return this._object;
    }
    set object(object) {
        if (object && !(this._object === null || this._object === object)) {
            console.log("current object", this._object);
            console.log("new object", object);
            throw "error while set object to cell";
        }
        this._object = object;
    }
    get hasObject() {
        return this._object != null;
    }
    ladder() {
        var _a;
        (_a = this._floor) === null || _a === void 0 ? void 0 : _a.destroy();
        this._floor = new _DungeonLadder__WEBPACK_IMPORTED_MODULE_6__["DungeonLadder"](this._dungeon, this.x, this.y);
    }
    get interacting() {
        var _a, _b, _c, _d;
        return ((_a = this._floor) === null || _a === void 0 ? void 0 : _a.interacting) || ((_b = this._wall) === null || _b === void 0 ? void 0 : _b.interacting) || ((_c = this._drop) === null || _c === void 0 ? void 0 : _c.interacting) || ((_d = this._object) === null || _d === void 0 ? void 0 : _d.interacting) || false;
    }
    interact(hero) {
        if (this._object && this._object.interacting) {
            this._object.interact(hero);
        }
        else if (this._drop && this._drop.interacting) {
            this._drop.interact(hero);
        }
        else if (this._wall && this._wall.interacting) {
            this._wall.interact(hero);
        }
        else if (this._floor && this._floor.interacting) {
            this._floor.interact(hero);
        }
    }
    collide(object) {
        return (this._object && this._object.collide(object)) ||
            (this._wall && this._wall.collide(object)) ||
            false;
    }
}
class DungeonTitle extends pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"] {
    constructor() {
        super();
        this._title = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"]("", { font: { name: 'alagard', size: 32 } });
        this._title.anchor = 0.5;
        this._title.position.set(0, 16);
        this.addChild(this._title);
    }
    set level(level) {
        this._title.text = `LEVEL ${level}`;
    }
    destroy() {
        this._title.destroy();
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonScene.ts":
/*!*************************************!*\
  !*** ./src/dungeon/DungeonScene.ts ***!
  \*************************************/
/*! exports provided: DungeonScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonScene", function() { return DungeonScene; });
/* harmony import */ var _characters__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../characters */ "./src/characters/index.ts");
/* harmony import */ var _DungeonMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DungeonMap */ "./src/dungeon/DungeonMap.ts");
/* harmony import */ var _inventory__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../inventory */ "./src/inventory/index.ts");



class DungeonScene {
    constructor(controller, hero, dungeon) {
        this._controller = controller;
        this._dungeon = dungeon;
        this._titleView = new _DungeonMap__WEBPACK_IMPORTED_MODULE_1__["DungeonTitle"]();
        this._inventoryView = new _inventory__WEBPACK_IMPORTED_MODULE_2__["BeltInventoryView"](this._controller.resources, hero.inventory.belt);
        this._healthView = new _characters__WEBPACK_IMPORTED_MODULE_0__["HeroStateView"](hero, { fixedHPSize: false });
    }
    init() {
        const screen = this._controller.app.screen;
        this._titleView.position.set(screen.width >> 1, 16);
        this._titleView.zIndex = 10;
        this._controller.stage.addChild(this._titleView);
        const invWidth = this._inventoryView.width;
        this._inventoryView.position.set((screen.width >> 1) - (invWidth >> 1), screen.height - (32 + 4 + 16));
        this._inventoryView.zIndex = 11;
        this._controller.stage.addChild(this._inventoryView);
        this._healthView.position.set(16, 16);
        this._healthView.zIndex = 12;
        this._controller.stage.addChild(this._healthView);
        this._titleView.level = this._dungeon.level;
        this._dungeon.container.zIndex = 0;
        this._controller.stage.addChild(this._dungeon.container);
        this._dungeon.light.layer.zIndex = 1;
        this._controller.stage.addChild(this._dungeon.light.layer);
        this._dungeon.lighting.zIndex = 2;
        this._dungeon.lighting.alpha = 0.8;
        this._controller.stage.addChild(this._dungeon.lighting);
        this._controller.stage.sortChildren();
        this._dungeon.ticker.start();
    }
    destroy() {
        this._titleView.destroy();
        this._healthView.destroy();
        this._inventoryView.destroy();
        this._dungeon.destroy();
        this._controller.stage.removeChildren();
    }
    pause() {
        this._dungeon.ticker.stop();
    }
    resume() {
        this._dungeon.ticker.start();
    }
}


/***/ }),

/***/ "./src/dungeon/DungeonWall.ts":
/*!************************************!*\
  !*** ./src/dungeon/DungeonWall.ts ***!
  \************************************/
/*! exports provided: DungeonWall */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonWall", function() { return DungeonWall; });
/* harmony import */ var _DungeonMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DungeonMap */ "./src/dungeon/DungeonMap.ts");

class DungeonWall {
    constructor(dungeon, x, y, name) {
        this.height = 1;
        this.width = 1;
        this.static = true;
        this.interacting = false;
        this.dungeon = dungeon;
        this.x = x;
        this.y = y;
        this.name = name;
        this.sprite = dungeon.sprite(x, y, name);
        this.sprite.zIndex = _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].wall + y * _DungeonMap__WEBPACK_IMPORTED_MODULE_0__["DungeonZIndexes"].row;
    }
    interact(_) {
    }
    collide(_) {
        return !this.dungeon.cell(this.x, this.y).hasFloor;
    }
    destroy() {
        this.sprite.destroy();
    }
}


/***/ }),

/***/ "./src/dungeon/GenerateDungeonScene.ts":
/*!*********************************************!*\
  !*** ./src/dungeon/GenerateDungeonScene.ts ***!
  \*********************************************/
/*! exports provided: GenerateDungeonScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GenerateDungeonScene", function() { return GenerateDungeonScene; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _HybridDungeonGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./HybridDungeonGenerator */ "./src/dungeon/HybridDungeonGenerator.ts");
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");



class GenerateDungeonScene {
    constructor(controller, options) {
        this._title = null;
        this._controller = controller;
        this._generator = new _HybridDungeonGenerator__WEBPACK_IMPORTED_MODULE_1__["HybridDungeonGenerator"](this._controller);
        this._promise = this._generator.generate(options);
        this._promise.then((dungeon) => this._controller.dungeon(options.hero, dungeon));
        this._progressBar = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Graphics"]();
    }
    init() {
        this.renderTitle();
        this.renderProgressBar();
        this._controller.app.ticker.add(this.update, this);
    }
    destroy() {
        var _a, _b;
        this._controller.app.ticker.remove(this.update, this);
        (_a = this._title) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this._progressBar) === null || _b === void 0 ? void 0 : _b.destroy();
    }
    pause() {
    }
    resume() {
    }
    renderTitle() {
        this._title = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"]("ROGUELIKE DUNGEON", { font: { name: 'alagard', size: 64 } });
        this._title.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.5, 0);
        this._title.position.set(this._controller.app.screen.width >> 1, 64);
        this._controller.stage.addChild(this._title);
    }
    renderProgressBar() {
        this._progressBar = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Graphics"]();
        this._controller.stage.addChild(this._progressBar);
    }
    update() {
        const screen = this._controller.app.screen;
        const margin = 40;
        const h = 60;
        const border = 4;
        const width = screen.width - margin - margin;
        const progressWidth = Math.floor((width - border - border) * this._generator.percent / 100);
        this._progressBar.clear();
        this._progressBar.beginFill(_ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiBackground);
        this._progressBar.drawRect(margin, screen.height - margin - h - border - border, width, h);
        this._progressBar.endFill();
        this._progressBar.beginFill(_ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiSelected);
        this._progressBar.drawRect(margin + border, screen.height - margin - h - border, progressWidth, h - border - border);
        this._progressBar.endFill();
    }
}


/***/ }),

/***/ "./src/dungeon/HybridDungeonGenerator.ts":
/*!***********************************************!*\
  !*** ./src/dungeon/HybridDungeonGenerator.ts ***!
  \***********************************************/
/*! exports provided: HybridDungeonGenerator */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HybridDungeonGenerator", function() { return HybridDungeonGenerator; });
/* harmony import */ var _wfc_even_simple_tiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../wfc/even.simple.tiled */ "./src/wfc/even.simple.tiled.ts");
/* harmony import */ var _wfc_model__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../wfc/model */ "./src/wfc/model.ts");
/* harmony import */ var _concurency__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../concurency */ "./src/concurency.ts");
/* harmony import */ var _rng__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../rng */ "./src/rng.ts");
/* harmony import */ var _DungeonGenerator__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./DungeonGenerator */ "./src/dungeon/DungeonGenerator.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





class HybridDungeonGenerator extends _DungeonGenerator__WEBPACK_IMPORTED_MODULE_4__["BaseDungeonGenerator"] {
    constructor(controller) {
        super(controller);
        this._model = null;
    }
    get percent() {
        var _a;
        return ((_a = this._model) === null || _a === void 0 ? void 0 : _a.percent) || 0;
    }
    generate(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const tileset = this.controller.app.loader.resources['dungeon.rules.4.json'].data;
            const config = this.controller.app.loader.resources['dungeon.design.json'].data;
            const hero = options.hero;
            let seed;
            if (hero.dungeonSeeds.has(options.level)) {
                seed = hero.dungeonSeeds.get(options.level);
                console.log(`dungeon level ${options.level} exists seed: ${seed}`);
            }
            else {
                seed = this.controller.rng.int();
                console.log(`dungeon level ${options.level} new seed: ${seed}`);
                hero.dungeonSeeds.set(options.level, seed);
            }
            const rng = _rng__WEBPACK_IMPORTED_MODULE_3__["RNG"].seeded(seed);
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])(10);
            const crawler = new _wfc_even_simple_tiled__WEBPACK_IMPORTED_MODULE_0__["DungeonCrawlerConstraint"](config);
            this._model = new _wfc_even_simple_tiled__WEBPACK_IMPORTED_MODULE_0__["EvenSimpleTiledModel"](this.resources, tileset, rng, config.width, config.height, [crawler]);
            console.time("model loop run");
            let state;
            for (;;) {
                console.time("model run");
                state = yield this._model.run(10000);
                console.timeEnd("model run");
                if (state !== _wfc_model__WEBPACK_IMPORTED_MODULE_1__["Resolution"].Decided) {
                    console.error("failed run model");
                }
                else {
                    console.log("success run model");
                    break;
                }
                yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            }
            console.timeEnd("model loop run");
            const dungeon = this.createDungeon(rng, seed, options.level, this._model.FMX, this._model.FMY);
            const observed = this._model.observed;
            for (let y = 0; y < this._model.FMY; y++) {
                for (let x = 0; x < this._model.FMX; x++) {
                    const i = x + y * this._model.FMX;
                    const [floor, wall] = tileset.cells[observed[i]];
                    if (floor >= 0) {
                        dungeon.cell(x, y).floorName = tileset.tiles[floor];
                    }
                    if (wall >= 0) {
                        dungeon.cell(x, y).wallName = tileset.tiles[wall];
                    }
                }
            }
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            this.replaceFloorRandomly(rng, dungeon);
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            this.replaceWallRandomly(rng, dungeon);
            const heroAI = this.placeHero(rng, dungeon, options.hero);
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            this.placeLadder(rng, dungeon, heroAI);
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            const isBonfire = options.level % 5 === 1;
            if (isBonfire) {
                this.placeBonfire(rng, dungeon, heroAI);
                yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            }
            this.placeNpc(rng, dungeon, heroAI);
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            this.placeMonsters(rng, dungeon, heroAI);
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            const isBoss = options.level % 5 === 0;
            if (isBoss) {
                this.placeBoss(rng, dungeon, heroAI);
                yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            }
            this.placeDrop(rng, dungeon);
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            dungeon.light.loadMap();
            yield Object(_concurency__WEBPACK_IMPORTED_MODULE_2__["yields"])();
            return dungeon;
        });
    }
}


/***/ }),

/***/ "./src/dungeon/ShadowCaster.ts":
/*!*************************************!*\
  !*** ./src/dungeon/ShadowCaster.ts ***!
  \*************************************/
/*! exports provided: EndPoint, SegmentType, Segment, ShadowCaster */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EndPoint", function() { return EndPoint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SegmentType", function() { return SegmentType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Segment", function() { return Segment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ShadowCaster", function() { return ShadowCaster; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);

const TILE_SIZE = 16;
class EndPoint {
    constructor(point, segment) {
        this.begin = false;
        this.angle = 0.0;
        this.point = point;
        this.segment = segment;
    }
}
var SegmentType;
(function (SegmentType) {
    SegmentType[SegmentType["NORMAL"] = 0] = "NORMAL";
    SegmentType[SegmentType["TOP"] = 1] = "TOP";
})(SegmentType || (SegmentType = {}));
class Segment {
    constructor(p1, p2, type) {
        this.distance = 0;
        this.p1 = new EndPoint(p1, this);
        this.p2 = new EndPoint(p2, this);
        this.type = type;
    }
    toString() {
        const p1 = this.p1.point;
        const p2 = this.p2.point;
        return `[${p1.x}:${p1.y} - ${p2.x}:${p2.y}]`;
    }
}
class ShadowCaster {
    constructor() {
        this._segments = [];
        this._endpoints = [];
        this._light = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0, 0);
        this._maxDistance = 500;
    }
    init() {
        this._segments = [];
        this._endpoints = [];
        this._light = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.0, 0.0);
    }
    addSegment(x1, y1, x2, y2, type) {
        const p1 = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](x1, y1);
        const p2 = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](x2, y2);
        const segment = new Segment(p1, p2, type);
        this._segments.push(segment);
        this._endpoints.push(segment.p1);
        this._endpoints.push(segment.p2);
    }
    static deduplicated(queue) {
        const deduplicated = [];
        while (queue.length > 0) {
            const segment = queue.pop();
            const duplicates = [];
            for (let i = 0; i < queue.length; i++) {
                const next = queue[i];
                const sameType = segment.type === next.type;
                const equal = segment.p1.point.equals(next.p1.point) && segment.p2.point.equals(next.p2.point);
                if (sameType && equal) {
                    duplicates.push(i);
                }
            }
            for (const i of duplicates) {
                queue.splice(i, 1);
            }
            deduplicated.push(segment);
        }
        return deduplicated;
    }
    static connected(segments) {
        const connected = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            let hasP1 = false;
            let hasP2 = false;
            for (let j = 0; j < segments.length; j++) {
                if (j == i)
                    continue;
                const test = segments[j];
                if (segment.p1.point.equals(test.p1.point) && segment.p2.point.equals(test.p2.point))
                    continue;
                if (!hasP1 && (segment.p1.point.equals(test.p1.point) || segment.p1.point.equals(test.p2.point))) {
                    hasP1 = true;
                }
                if (!hasP2 && (segment.p2.point.equals(test.p1.point) || segment.p2.point.equals(test.p2.point))) {
                    hasP2 = true;
                }
                if (hasP1 && hasP2) {
                    connected.push(segment);
                    break;
                }
            }
        }
        return connected;
    }
    static filtered(segments) {
        const filtered = [];
        const queue = [];
        const parts = [
            [0, 12, 0, 16],
            [5, 12, 5, 16],
            [0, 12, 5, 12],
            [0, 0, 5, 0],
            [11, 12, 11, 16],
            [11, 12, 16, 12],
            [11, 0, 16, 0],
        ];
        const isPart = (segment) => {
            const segmentX1 = segment.p1.point.x % 16;
            const segmentY1 = segment.p1.point.y % 16;
            const segmentX2 = segment.p2.point.x - segment.p1.point.x + segmentX1;
            const segmentT2 = segment.p2.point.y - segment.p1.point.y + segmentY1;
            for (const [x1, y1, x2, y2] of parts) {
                if (x1 === segmentX1 && y1 === segmentY1 && x2 === segmentX2 && y2 === segmentT2) {
                    return true;
                }
            }
            return false;
        };
        for (const segment of segments) {
            if (isPart(segment)) {
                queue.push(segment);
            }
            else {
                filtered.push(segment);
            }
        }
        while (queue.length > 0) {
            const segment = queue.pop();
            const rect = [segment];
            const points = [segment.p1.point, segment.p2.point];
            const counts = [1, 1];
            const joins = [];
            for (let t = 0; t < 2; t++) {
                for (let i = 0; i < queue.length; i++) {
                    if (joins.indexOf(i) >= 0)
                        continue;
                    const next = queue[i];
                    const p1 = next.p1.point;
                    const p2 = next.p2.point;
                    let hasP1 = false;
                    let hasP2 = false;
                    for (let j = 0; j < points.length; j++) {
                        const p = points[j];
                        if (p.equals(p1)) {
                            hasP1 = true;
                            counts[j]++;
                        }
                        else if (p.equals(p2)) {
                            hasP2 = true;
                            counts[j]++;
                        }
                    }
                    if (hasP1 || hasP2) {
                        joins.push(i);
                        rect.push(next);
                        if (!hasP1) {
                            points.push(p1);
                            counts.push(1);
                        }
                        if (!hasP2) {
                            points.push(p2);
                            counts.push(1);
                        }
                    }
                }
            }
            if (counts.length === 4 && counts.every(c => c === 2)) {
                let bottom = 0;
                let bottomY = 0;
                for (let i = 0; i < 4; i++) {
                    const s = rect[i];
                    if (s.p1.point.y === s.p2.point.y && s.p1.point.y > bottomY) {
                        bottom = i;
                        bottomY = s.p1.point.y;
                    }
                }
                for (const i of joins.reverse()) {
                    queue.splice(i, 1);
                }
                rect.splice(bottom, 1);
                filtered.push(...rect);
            }
            else {
                filtered.push(segment);
            }
        }
        return filtered;
    }
    static merge(queue) {
        const merged = [];
        while (queue.length > 0) {
            const first = queue.pop();
            let pair = null;
            for (let i = 0; i < queue.length; i++) {
                const next = queue[i];
                if (first.type === next.type) {
                    if (first.p2.point.equals(next.p1.point)) {
                        queue.splice(i, 1);
                        pair = [first, next];
                        break;
                    }
                    else if (next.p2.point.equals(first.p1.point)) {
                        queue.splice(i, 1);
                        pair = [next, first];
                        break;
                    }
                }
            }
            if (pair) {
                const [a, b] = pair;
                queue.push(new Segment(a.p1.point, b.p2.point, a.type));
            }
            else {
                merged.push(first);
            }
        }
        return merged;
    }
    optimize() {
        console.log(`optimize: segments=${this._segments.length}`);
        const deduplicated = ShadowCaster.deduplicated([...this._segments]);
        console.log(`optimize: deduplicated=${deduplicated.length}`);
        const connected = ShadowCaster.connected(deduplicated);
        console.log(`optimize: connected=${connected.length}`);
        const filtered = ShadowCaster.filtered(connected);
        console.log(`optimize: filtered=${filtered.length}`);
        const connected2 = ShadowCaster.connected(filtered);
        console.log(`optimize: connected = ${connected2.length}`);
        const merged = [
            ...ShadowCaster.merge(connected2.filter(s => s.p1.point.x === s.p2.point.x)),
            ...ShadowCaster.merge(connected2.filter(s => s.p1.point.y === s.p2.point.y)),
        ];
        console.log(`optimize: merged=${merged.length}`);
        this._segments = [];
        this._endpoints = [];
        for (const segment of merged) {
            this._segments.push(segment);
            this._endpoints.push(segment.p1);
            this._endpoints.push(segment.p2);
        }
    }
    setLightLocation(x, y, maxDistance) {
        this._light.x = x;
        this._light.y = y;
        this._maxDistance = maxDistance;
        this._endpoints = [];
        for (const segment of this._segments) {
            const deltaX = 0.5 * (segment.p1.point.x + segment.p2.point.x) - x;
            const deltaY = 0.5 * (segment.p1.point.y + segment.p2.point.y) - y;
            segment.distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (segment.distance < maxDistance) {
                segment.p1.angle = Math.atan2(segment.p1.point.y - y, segment.p1.point.x - x);
                segment.p2.angle = Math.atan2(segment.p2.point.y - y, segment.p2.point.x - x);
                let dAngle = segment.p2.angle - segment.p1.angle;
                if (dAngle <= -Math.PI) {
                    dAngle += 2 * Math.PI;
                }
                if (dAngle > Math.PI) {
                    dAngle -= 2 * Math.PI;
                }
                segment.p1.begin = (dAngle > 0.0);
                segment.p2.begin = !segment.p1.begin;
                this._endpoints.push(segment.p1, segment.p2);
            }
        }
        this._endpoints.sort(ShadowCaster.compare);
    }
    static compare(a, b) {
        if (a.angle > b.angle)
            return 1;
        if (a.angle < b.angle)
            return -1;
        if (!a.begin && b.begin)
            return 1;
        if (a.begin && !b.begin)
            return -1;
        return 0;
    }
    static leftOf(s, p) {
        const cross = (s.p2.point.x - s.p1.point.x) * (p.y - s.p1.point.y)
            - (s.p2.point.y - s.p1.point.y) * (p.x - s.p1.point.x);
        return cross < 0;
    }
    static interpolate(p, q, f) {
        return new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](p.x * (1 - f) + q.x * f, p.y * (1 - f) + q.y * f);
    }
    static segmentInFrontOf(a, b, relativeTo) {
        const A1 = ShadowCaster.leftOf(a, ShadowCaster.interpolate(b.p1.point, b.p2.point, 0.01));
        const A2 = ShadowCaster.leftOf(a, ShadowCaster.interpolate(b.p2.point, b.p1.point, 0.01));
        const A3 = ShadowCaster.leftOf(a, relativeTo);
        const B1 = ShadowCaster.leftOf(b, ShadowCaster.interpolate(a.p1.point, a.p2.point, 0.01));
        const B2 = ShadowCaster.leftOf(b, ShadowCaster.interpolate(a.p2.point, a.p1.point, 0.01));
        const B3 = ShadowCaster.leftOf(b, relativeTo);
        if (B1 == B2 && B2 != B3)
            return true;
        if (A1 == A2 && A2 == A3)
            return true;
        if (A1 == A2 && A2 != A3)
            return false;
        if (B1 == B2 && B2 == B3)
            return false;
        return false;
    }
    sweep() {
        const output = [];
        const open = [];
        let beginAngle = 0.0;
        for (let pass = 0; pass <= 2; pass++) {
            for (const p of this._endpoints) {
                const currentOld = open.length === 0 ? null : open[0];
                if (p.begin) {
                    let i = 0;
                    let node = open[i];
                    while (node != null && ShadowCaster.segmentInFrontOf(p.segment, node, this._light)) {
                        i++;
                        node = open[i];
                    }
                    if (node == null) {
                        open.push(p.segment);
                    }
                    else {
                        open.splice(i, 0, p.segment);
                    }
                }
                else {
                    for (let i = 0; i < open.length; i++) {
                        if (open[i] === p.segment)
                            open.splice(i, 1);
                    }
                }
                const currentNew = open.length === 0 ? null : open[0];
                if (currentOld !== currentNew) {
                    if (pass == 1) {
                        this.addTriangle(beginAngle, p.angle, currentOld, output);
                    }
                    beginAngle = p.angle;
                }
            }
        }
        const queue = [...output];
        const deduplicated = [];
        while (queue.length > 0) {
            if (queue.length >= 2) {
                const [a, b,] = queue;
                if (a.equals(b)) {
                    queue.shift();
                    continue;
                }
            }
            const point = queue.shift();
            deduplicated.push(point);
        }
        const optimized = [];
        while (deduplicated.length > 0) {
            if (deduplicated.length >= 3) {
                const [a, b, c,] = deduplicated;
                if (a.x === b.x && a.x === c.x) {
                    deduplicated.splice(1, 1);
                    continue;
                }
            }
            const point = deduplicated.shift();
            optimized.push(point);
        }
        return optimized;
    }
    static lineIntersection(p1, p2, p3, p4) {
        const numerator = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x));
        const denominator = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
        if (denominator === 0) {
            return null;
        }
        const s = numerator / denominator;
        return new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](p1.x + s * (p2.x - p1.x), p1.y + s * (p2.y - p1.y));
    }
    addTriangle(angle1, angle2, segment, output) {
        const angle1cos = Math.cos(angle1);
        const angle1sin = Math.sin(angle1);
        const angle2cos = Math.cos(angle2);
        const angle2sin = Math.sin(angle2);
        const p1 = this._light;
        const p2 = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](this._light.x + angle1cos, this._light.y + angle1sin);
        const p3 = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.0, 0.0);
        const p4 = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.0, 0.0);
        if (segment != null) {
            p3.x = segment.p1.point.x;
            p3.y = segment.p1.point.y;
            p4.x = segment.p2.point.x;
            p4.y = segment.p2.point.y;
        }
        else {
            p3.x = this._light.x + angle1cos * this._maxDistance;
            p3.y = this._light.y + angle1sin * this._maxDistance;
            p4.x = this._light.x + angle2cos * this._maxDistance;
            p4.y = this._light.y + angle2sin * this._maxDistance;
        }
        const pBegin = ShadowCaster.lineIntersection(p3, p4, p1, p2);
        if (pBegin === null)
            return;
        pBegin.x = Math.round(pBegin.x);
        pBegin.y = Math.round(pBegin.y);
        p2.x = this._light.x + angle2cos;
        p2.y = this._light.y + angle2sin;
        const pEnd = ShadowCaster.lineIntersection(p3, p4, p1, p2);
        if (pEnd === null)
            return;
        pEnd.x = Math.round(pEnd.x);
        pEnd.y = Math.round(pEnd.y);
        if (segment != null) {
            switch (segment.type) {
                case SegmentType.TOP:
                    output.push(pBegin);
                    output.push(new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](pBegin.x, pBegin.y - TILE_SIZE));
                    output.push(new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](pEnd.x, pEnd.y - TILE_SIZE));
                    output.push(pEnd);
                    break;
                case SegmentType.NORMAL:
                    output.push(pBegin);
                    output.push(pEnd);
                    break;
            }
        }
        else {
            output.push(pBegin);
            output.push(pEnd);
        }
    }
    debug() {
        const scale = 1;
        const width = (80 * 16) * scale;
        const height = (80 * 16) * scale;
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        ctx.fillRect(0, 0, width, height);
        ctx.scale(scale, scale);
        const segments = new Path2D();
        for (const segment of this._segments) {
            const start = segment.p1.point;
            const end = segment.p2.point;
            segments.moveTo(start.x, start.y);
            segments.lineTo(end.x, end.y);
        }
        ctx.strokeStyle = 'rgba(255,0,0,0.5)';
        ctx.stroke(segments);
        console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
    }
}


/***/ }),

/***/ "./src/dungeon/index.ts":
/*!******************************!*\
  !*** ./src/dungeon/index.ts ***!
  \******************************/
/*! exports provided: BonfireState, DungeonBonfire, DungeonBonfireModal, DungeonDrop, DungeonFloor, DefaultDungeonFloor, BaseDungeonGenerator, DungeonLadder, DungeonLight, DungeonLightType, DungeonLightSource, DungeonZIndexes, DungeonMap, DungeonMapCell, DungeonTitle, DungeonScene, DungeonWall, GenerateDungeonScene, EndPoint, SegmentType, Segment, ShadowCaster */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _DungeonBonfire__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DungeonBonfire */ "./src/dungeon/DungeonBonfire.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BonfireState", function() { return _DungeonBonfire__WEBPACK_IMPORTED_MODULE_0__["BonfireState"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonBonfire", function() { return _DungeonBonfire__WEBPACK_IMPORTED_MODULE_0__["DungeonBonfire"]; });

/* harmony import */ var _DungeonBonfireModalScene__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DungeonBonfireModalScene */ "./src/dungeon/DungeonBonfireModalScene.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonBonfireModal", function() { return _DungeonBonfireModalScene__WEBPACK_IMPORTED_MODULE_1__["DungeonBonfireModal"]; });

/* harmony import */ var _DungeonDrop__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DungeonDrop */ "./src/dungeon/DungeonDrop.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonDrop", function() { return _DungeonDrop__WEBPACK_IMPORTED_MODULE_2__["DungeonDrop"]; });

/* harmony import */ var _DungeonFloor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./DungeonFloor */ "./src/dungeon/DungeonFloor.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonFloor", function() { return _DungeonFloor__WEBPACK_IMPORTED_MODULE_3__["DungeonFloor"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DefaultDungeonFloor", function() { return _DungeonFloor__WEBPACK_IMPORTED_MODULE_3__["DefaultDungeonFloor"]; });

/* harmony import */ var _DungeonGenerator__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./DungeonGenerator */ "./src/dungeon/DungeonGenerator.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BaseDungeonGenerator", function() { return _DungeonGenerator__WEBPACK_IMPORTED_MODULE_4__["BaseDungeonGenerator"]; });

/* harmony import */ var _DungeonLadder__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./DungeonLadder */ "./src/dungeon/DungeonLadder.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonLadder", function() { return _DungeonLadder__WEBPACK_IMPORTED_MODULE_5__["DungeonLadder"]; });

/* harmony import */ var _DungeonLight__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./DungeonLight */ "./src/dungeon/DungeonLight.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonLight", function() { return _DungeonLight__WEBPACK_IMPORTED_MODULE_6__["DungeonLight"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonLightType", function() { return _DungeonLight__WEBPACK_IMPORTED_MODULE_6__["DungeonLightType"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonLightSource", function() { return _DungeonLight__WEBPACK_IMPORTED_MODULE_6__["DungeonLightSource"]; });

/* harmony import */ var _DungeonMap__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./DungeonMap */ "./src/dungeon/DungeonMap.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonZIndexes", function() { return _DungeonMap__WEBPACK_IMPORTED_MODULE_7__["DungeonZIndexes"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonMap", function() { return _DungeonMap__WEBPACK_IMPORTED_MODULE_7__["DungeonMap"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonMapCell", function() { return _DungeonMap__WEBPACK_IMPORTED_MODULE_7__["DungeonMapCell"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonTitle", function() { return _DungeonMap__WEBPACK_IMPORTED_MODULE_7__["DungeonTitle"]; });

/* harmony import */ var _DungeonScene__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./DungeonScene */ "./src/dungeon/DungeonScene.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonScene", function() { return _DungeonScene__WEBPACK_IMPORTED_MODULE_8__["DungeonScene"]; });

/* harmony import */ var _DungeonWall__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./DungeonWall */ "./src/dungeon/DungeonWall.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonWall", function() { return _DungeonWall__WEBPACK_IMPORTED_MODULE_9__["DungeonWall"]; });

/* harmony import */ var _GenerateDungeonScene__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./GenerateDungeonScene */ "./src/dungeon/GenerateDungeonScene.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GenerateDungeonScene", function() { return _GenerateDungeonScene__WEBPACK_IMPORTED_MODULE_10__["GenerateDungeonScene"]; });

/* harmony import */ var _ShadowCaster__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./ShadowCaster */ "./src/dungeon/ShadowCaster.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "EndPoint", function() { return _ShadowCaster__WEBPACK_IMPORTED_MODULE_11__["EndPoint"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SegmentType", function() { return _ShadowCaster__WEBPACK_IMPORTED_MODULE_11__["SegmentType"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Segment", function() { return _ShadowCaster__WEBPACK_IMPORTED_MODULE_11__["Segment"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ShadowCaster", function() { return _ShadowCaster__WEBPACK_IMPORTED_MODULE_11__["ShadowCaster"]; });















/***/ }),

/***/ "./src/expression.ts":
/*!***************************!*\
  !*** ./src/expression.ts ***!
  \***************************/
/*! exports provided: Expression */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Expression", function() { return Expression; });
var TokenizerStates;
(function (TokenizerStates) {
    TokenizerStates[TokenizerStates["Started"] = 1] = "Started";
    TokenizerStates[TokenizerStates["ParsingNumber"] = 2] = "ParsingNumber";
    TokenizerStates[TokenizerStates["ParsingStringStarted"] = 3] = "ParsingStringStarted";
    TokenizerStates[TokenizerStates["ParsingString"] = 4] = "ParsingString";
    TokenizerStates[TokenizerStates["ParsingStringFinished"] = 5] = "ParsingStringFinished";
    TokenizerStates[TokenizerStates["ParsingFunction"] = 6] = "ParsingFunction";
    TokenizerStates[TokenizerStates["Finished"] = 7] = "Finished";
    TokenizerStates[TokenizerStates["ParsingContext"] = 8] = "ParsingContext";
    TokenizerStates[TokenizerStates["ParsingBracket"] = 9] = "ParsingBracket";
    TokenizerStates[TokenizerStates["Error"] = 10] = "Error";
})(TokenizerStates || (TokenizerStates = {}));
var KnownStringComponents;
(function (KnownStringComponents) {
    KnownStringComponents[KnownStringComponents["Delimiter"] = 1] = "Delimiter";
    KnownStringComponents[KnownStringComponents["Digit"] = 2] = "Digit";
    KnownStringComponents[KnownStringComponents["Bracket"] = 3] = "Bracket";
    KnownStringComponents[KnownStringComponents["Other"] = 4] = "Other";
    KnownStringComponents[KnownStringComponents["ContextBracket"] = 5] = "ContextBracket";
    KnownStringComponents[KnownStringComponents["Quote"] = 6] = "Quote";
})(KnownStringComponents || (KnownStringComponents = {}));
const tokenStateMachine = {
    [TokenizerStates.Started]: {
        [KnownStringComponents.Delimiter]: TokenizerStates.Started,
        [KnownStringComponents.Digit]: TokenizerStates.ParsingNumber,
        [KnownStringComponents.Bracket]: TokenizerStates.ParsingBracket,
        [KnownStringComponents.Other]: TokenizerStates.ParsingFunction,
        [KnownStringComponents.ContextBracket]: TokenizerStates.ParsingContext,
        [KnownStringComponents.Quote]: TokenizerStates.ParsingStringStarted
    },
    [TokenizerStates.ParsingNumber]: {
        [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
        [KnownStringComponents.Digit]: TokenizerStates.ParsingNumber,
        [KnownStringComponents.Bracket]: TokenizerStates.Finished,
        [KnownStringComponents.Other]: TokenizerStates.Finished,
        [KnownStringComponents.ContextBracket]: TokenizerStates.Error,
        [KnownStringComponents.Quote]: TokenizerStates.Error
    },
    [TokenizerStates.ParsingFunction]: {
        [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
        [KnownStringComponents.Digit]: TokenizerStates.ParsingFunction,
        [KnownStringComponents.Bracket]: TokenizerStates.Finished,
        [KnownStringComponents.Other]: TokenizerStates.ParsingFunction,
        [KnownStringComponents.ContextBracket]: TokenizerStates.Error,
        [KnownStringComponents.Quote]: TokenizerStates.Error
    },
    [TokenizerStates.ParsingContext]: {
        [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
        [KnownStringComponents.Digit]: TokenizerStates.ParsingContext,
        [KnownStringComponents.Bracket]: TokenizerStates.Finished,
        [KnownStringComponents.Other]: TokenizerStates.ParsingContext,
        [KnownStringComponents.ContextBracket]: TokenizerStates.ParsingContext,
        [KnownStringComponents.Quote]: TokenizerStates.Error
    },
    [TokenizerStates.ParsingBracket]: {
        [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
        [KnownStringComponents.Digit]: TokenizerStates.Finished,
        [KnownStringComponents.Bracket]: TokenizerStates.Finished,
        [KnownStringComponents.Other]: TokenizerStates.Finished,
        [KnownStringComponents.ContextBracket]: TokenizerStates.Finished,
        [KnownStringComponents.Quote]: TokenizerStates.Finished
    },
    [TokenizerStates.ParsingStringStarted]: {
        [KnownStringComponents.Delimiter]: TokenizerStates.ParsingString,
        [KnownStringComponents.Digit]: TokenizerStates.ParsingString,
        [KnownStringComponents.Bracket]: TokenizerStates.ParsingString,
        [KnownStringComponents.Other]: TokenizerStates.ParsingString,
        [KnownStringComponents.ContextBracket]: TokenizerStates.ParsingString,
        [KnownStringComponents.Quote]: TokenizerStates.Finished
    },
    [TokenizerStates.ParsingString]: {
        [KnownStringComponents.Delimiter]: TokenizerStates.ParsingString,
        [KnownStringComponents.Digit]: TokenizerStates.ParsingString,
        [KnownStringComponents.Bracket]: TokenizerStates.ParsingString,
        [KnownStringComponents.Other]: TokenizerStates.ParsingString,
        [KnownStringComponents.ContextBracket]: TokenizerStates.ParsingString,
        [KnownStringComponents.Quote]: TokenizerStates.ParsingStringFinished
    },
    [TokenizerStates.ParsingStringFinished]: {
        [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
        [KnownStringComponents.Digit]: TokenizerStates.Finished,
        [KnownStringComponents.Bracket]: TokenizerStates.Finished,
        [KnownStringComponents.Other]: TokenizerStates.Finished,
        [KnownStringComponents.ContextBracket]: TokenizerStates.Finished,
        [KnownStringComponents.Quote]: TokenizerStates.Finished
    }
};
class Expression {
    constructor() {
        this._operations = {
            "+": {
                priority: 0,
                variable: false,
                apply: (a, b) => a + b
            },
            "-": {
                priority: 0,
                variable: false,
                apply: (a, b) => a - b
            },
            "*": {
                priority: 1,
                variable: false,
                apply: (a, b) => a * b
            },
            "/": {
                priority: 1,
                variable: false,
                apply: (a, b) => a / b
            },
            "%": {
                priority: 1,
                variable: false,
                apply: (a, b) => a % b
            },
            or: {
                priority: 0,
                variable: false,
                apply: (a, b) => a || b
            },
            and: {
                priority: 1,
                variable: false,
                apply: (a, b) => a && b
            },
            "!": {
                priority: 2,
                variable: false,
                apply: (a) => !a
            },
            true: {
                priority: 100,
                variable: false,
                apply: () => true
            },
            false: {
                priority: 100,
                variable: false,
                apply: () => false
            },
            $$getContextValue: {
                priority: 100,
                variable: false,
                apply: (contextPropertyName, context) => {
                    const propertyName = contextPropertyName.substring(1, contextPropertyName.length - 1);
                    return context[propertyName];
                }
            }
        };
        this._context = {};
    }
    static classifySymbol(symbol) {
        if (Expression.delimiters.indexOf(symbol) !== -1) {
            return KnownStringComponents.Delimiter;
        }
        else if (Expression.brackets.indexOf(symbol) !== -1) {
            return KnownStringComponents.Bracket;
        }
        else if (Expression.digits.indexOf(symbol) !== -1) {
            return KnownStringComponents.Digit;
        }
        else if (Expression.contextBrackets.indexOf(symbol) !== -1) {
            return KnownStringComponents.ContextBracket;
        }
        else if (Expression.quotes.indexOf(symbol) !== -1) {
            return KnownStringComponents.Quote;
        }
        else {
            return KnownStringComponents.Other;
        }
    }
    isOfMoreOrEqualPriority(currentOp, otherOp) {
        return (this._operations[currentOp].priority <= this._operations[otherOp].priority);
    }
    scanToken(str, start) {
        let state = TokenizerStates.Started;
        let workingState = TokenizerStates.Error;
        let tokenString = "";
        let i = start;
        while (i < str.length && state !== TokenizerStates.Finished && state !== TokenizerStates.Error) {
            const symbolClass = Expression.classifySymbol(str[i]);
            state = tokenStateMachine[state][symbolClass];
            if (state === TokenizerStates.ParsingFunction &&
                this._operations[tokenString] !== undefined) {
                state = TokenizerStates.Finished;
            }
            if (state === TokenizerStates.ParsingFunction ||
                state === TokenizerStates.ParsingNumber ||
                state === TokenizerStates.ParsingBracket ||
                state === TokenizerStates.ParsingContext ||
                state === TokenizerStates.ParsingString) {
                workingState = state;
                tokenString += str[i++];
            }
            else if (state === TokenizerStates.Started ||
                state === TokenizerStates.ParsingStringStarted ||
                state === TokenizerStates.ParsingStringFinished) {
                i++;
            }
        }
        if (tokenString === "") {
            workingState = TokenizerStates.Error;
        }
        return {
            workingState,
            tokenString,
            pos: i
        };
    }
    convertToRPN(tokens) {
        const stack = [];
        const rpn = [];
        let currToken;
        let j = 0;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type === "n") {
                rpn[j++] = tokens[i];
                continue;
            }
            if (tokens[i].type === "(") {
                stack.push(tokens[i]);
                continue;
            }
            if (tokens[i].type === ")") {
                do {
                    currToken = stack.pop();
                    rpn[j++] = currToken;
                } while (rpn[j - 1].type !== "(");
                j--;
                continue;
            }
            if (Object.keys(this._operations).indexOf(tokens[i].type) !== -1) {
                if (stack.length > 0) {
                    do {
                        currToken = stack.pop();
                        rpn[j++] = currToken;
                    } while (stack.length > 0 &&
                        Expression.brackets.indexOf(rpn[j - 1].type) === -1 &&
                        this.isOfMoreOrEqualPriority(tokens[i].type, rpn[j - 1].type));
                    if (Expression.brackets.indexOf(rpn[j - 1].type) !== -1 ||
                        !this.isOfMoreOrEqualPriority(tokens[i].type, rpn[j - 1].type)) {
                        stack.push(currToken);
                        j--;
                    }
                }
                stack.push(tokens[i]);
            }
        }
        while (stack.length > 0) {
            currToken = stack.pop();
            rpn[j++] = currToken;
        }
        return rpn;
    }
    calculateRPN(rpn) {
        var _a;
        const operands = [];
        if (rpn.length === 0) {
            return null;
        }
        for (let i = 0; i < rpn.length; i++) {
            if (rpn[i].type === "n") {
                operands.push(rpn[i]);
            }
            else {
                const op = this._operations[rpn[i].type];
                const func = op.apply;
                const len = op.variable ? operands.length : func.length;
                const args = operands.splice(operands.length - len).map(op => op.value);
                const result = func(...args);
                operands.push({ type: "n", value: result });
            }
        }
        return ((_a = operands.shift()) === null || _a === void 0 ? void 0 : _a.value) || null;
    }
    tokenize(expression) {
        const tokens = [];
        for (let i = 0; i < expression.length;) {
            const tokenCandidate = this.scanToken(expression, i);
            if (tokenCandidate.workingState !== TokenizerStates.Error) {
                if (tokenCandidate.workingState === TokenizerStates.ParsingNumber) {
                    tokens.push({
                        type: "n",
                        value: tokenCandidate.tokenString.indexOf(".") !== -1
                            ? parseFloat(tokenCandidate.tokenString)
                            : parseInt(tokenCandidate.tokenString)
                    });
                }
                else if (tokenCandidate.workingState === TokenizerStates.ParsingContext) {
                    tokens.push({
                        type: "$$getContextValue",
                        value: null
                    });
                    tokens.push({
                        type: "n",
                        value: tokenCandidate.tokenString
                    });
                    tokens.push({
                        type: "n",
                        value: this._context
                    });
                }
                else if (tokenCandidate.workingState === TokenizerStates.ParsingString) {
                    tokens.push({
                        type: "n",
                        value: tokenCandidate.tokenString
                    });
                }
                else {
                    tokens.push({
                        type: tokenCandidate.tokenString,
                        value: null
                    });
                }
            }
            i = tokenCandidate.pos;
        }
        return tokens;
    }
    register(name, priority, variable, apply) {
        this._operations[name] = { priority: priority, variable: variable, apply: apply };
    }
    evaluate(expression, context = {}) {
        this._context = context;
        const tokens = this.tokenize(expression);
        const rpn = this.convertToRPN(tokens);
        return this.calculateRPN(rpn);
    }
}
Expression.digits = "0123456789.";
Expression.brackets = "()";
Expression.contextBrackets = "{}";
Expression.delimiters = " ,\r\r\n";
Expression.quotes = "'\"";


/***/ }),

/***/ "./src/fsm.ts":
/*!********************!*\
  !*** ./src/fsm.ts ***!
  \********************/
/*! exports provided: FiniteStateMachine, FiniteState, FiniteStateTransition */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FiniteStateMachine", function() { return FiniteStateMachine; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FiniteState", function() { return FiniteState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FiniteStateTransition", function() { return FiniteStateTransition; });
class FiniteStateMachine {
    constructor(initial, states) {
        const builder = {};
        for (const state of states) {
            builder[state] = new FiniteState();
        }
        this._states = builder;
        this._initial = initial;
        this._current = this._initial;
    }
    get isFinal() {
        return this._states[this._current].isFinal;
    }
    get current() {
        return this._current;
    }
    state(state) {
        return this._states[state];
    }
    start() {
        this._current = this._initial;
        this._states[this._current].enter();
        this.transition();
    }
    stop() {
        this._states[this._current].exit();
    }
    update(deltaTime) {
        this._states[this._current].update(deltaTime);
        this.transition();
    }
    handle(event) {
        this._states[this._current].handle(event);
        this.transition();
    }
    transition() {
        for (;;) {
            const next = this._states[this._current].transition();
            if (next !== null) {
                this._states[this._current].exit();
                this._current = next;
                this._states[this._current].enter();
            }
            else {
                break;
            }
        }
    }
}
class FiniteState {
    constructor() {
        this._onEnter = [];
        this._onUpdate = [];
        this._onEvent = [];
        this._onExit = [];
        this._transitions = [];
        this._nested = [];
    }
    get isFinal() {
        return this._transitions.length === 0;
    }
    onEnter(listener) {
        this._onEnter.push(listener);
        return this;
    }
    onUpdate(listener) {
        this._onUpdate.push(listener);
        return this;
    }
    onEvent(listener) {
        this._onEvent.push(listener);
        return this;
    }
    onExit(listener) {
        this._onExit.push(listener);
        return this;
    }
    nested(machine) {
        this._nested.push(machine);
        return this;
    }
    transitionTo(state) {
        const transition = new FiniteStateTransition(state);
        this._transitions.push(transition);
        return transition;
    }
    enter() {
        for (const action of this._onEnter) {
            action();
        }
        for (const nested of this._nested) {
            nested.start();
        }
    }
    update(deltaTime) {
        for (const action of this._onUpdate) {
            action(deltaTime);
        }
        for (const nested of this._nested) {
            nested.update(deltaTime);
        }
    }
    exit() {
        for (const action of this._onExit) {
            action();
        }
        for (const nested of this._nested) {
            nested.stop();
        }
    }
    handle(event) {
        for (const action of this._onEvent) {
            action(event);
        }
        for (const nested of this._nested) {
            nested.handle(event);
        }
    }
    transition() {
        for (const transition of this._transitions) {
            if (transition.check()) {
                transition.perform();
                return transition.to;
            }
        }
        return null;
    }
}
class FiniteStateTransition {
    constructor(to) {
        this._conditions = [];
        this._actions = [];
        this.to = to;
    }
    condition(condition) {
        this._conditions.push(condition);
        return this;
    }
    action(action) {
        this._actions.push(action);
        return this;
    }
    check() {
        for (const condition of this._conditions) {
            if (!condition()) {
                return false;
            }
        }
        return true;
    }
    perform() {
        for (const action of this._actions) {
            action();
        }
    }
}


/***/ }),

/***/ "./src/geometry.ts":
/*!*************************!*\
  !*** ./src/geometry.ts ***!
  \*************************/
/*! exports provided: ImmutableRect, MutableRect */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ImmutableRect", function() { return ImmutableRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MutableRect", function() { return MutableRect; });
const X_DIST = 2;
const Y_DIST = 3;
class ImmutableRect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    mutable() {
        return new MutableRect(this.x, this.y, this.w, this.h);
    }
    expand() {
        return new ImmutableRect(this.x - X_DIST, this.y - Y_DIST, this.w + X_DIST + X_DIST, this.h + Y_DIST + Y_DIST);
    }
    expandV() {
        return new ImmutableRect(this.x - X_DIST, this.y, this.w + X_DIST + X_DIST, this.h);
    }
    expandH() {
        return new ImmutableRect(this.x, this.y - Y_DIST, this.w, this.h + Y_DIST + Y_DIST);
    }
    isOverlap(b) {
        return this.x < b.x + b.w
            && this.x + this.w > b.x
            && this.y < b.y + b.h
            && this.y + this.h > b.y;
    }
    toString() {
        return `{x=${this.x},y=${this.y},w=${this.w},h=${this.h}}`;
    }
}
class MutableRect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    static from(rect) {
        return new MutableRect(rect.x, rect.y, rect.w, rect.h);
    }
    immutable() {
        return new ImmutableRect(this.x, this.y, this.w, this.h);
    }
    isOverlap(b) {
        return this.x < b.x + b.w
            && this.x + this.w > b.x
            && this.y < b.y + b.h
            && this.y + this.h > b.y;
    }
    toString() {
        return `{x=${this.x},y=${this.y},w=${this.w},h=${this.h}}`;
    }
}


/***/ }),

/***/ "./src/indexer.ts":
/*!************************!*\
  !*** ./src/indexer.ts ***!
  \************************/
/*! exports provided: Indexer */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Indexer", function() { return Indexer; });
class Indexer {
    constructor(equality) {
        this.values = [];
        this.equality = equality;
    }
    index(value) {
        for (let i = 0; i < this.values.length; i++) {
            if (this.equality(value, this.values[i])) {
                return i;
            }
        }
        this.values.push(value);
        return this.values.length - 1;
    }
    get(n) {
        return this.values[n];
    }
    static array() {
        return new Indexer((a, b) => {
            if (a.length !== b.length)
                return false;
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i])
                    return false;
            }
            return true;
        });
    }
    static identity() {
        return new Indexer((a, b) => a === b);
    }
}


/***/ }),

/***/ "./src/input.ts":
/*!**********************!*\
  !*** ./src/input.ts ***!
  \**********************/
/*! exports provided: KeyBind, Joystick */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KeyBind", function() { return KeyBind; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Joystick", function() { return Joystick; });
var KeyBindState;
(function (KeyBindState) {
    KeyBindState[KeyBindState["Await"] = 1] = "Await";
    KeyBindState[KeyBindState["Pressed"] = 2] = "Pressed";
})(KeyBindState || (KeyBindState = {}));
class KeyBind {
    constructor(code) {
        this.code = code;
        this._state = KeyBindState.Await;
        this._triggered = false;
        this._processed = true;
    }
    get triggered() {
        return this._triggered;
    }
    once() {
        if (!this._processed) {
            this._processed = true;
            return true;
        }
        else
            return false;
    }
    repeat() {
        if (!this._processed) {
            this._processed = true;
            return true;
        }
        else
            return this._triggered;
    }
    keydown(e) {
        if (e.code === this.code) {
            e.preventDefault();
            if (this._state === KeyBindState.Await) {
                this._triggered = true;
                this._processed = false;
                this._state = KeyBindState.Pressed;
            }
        }
    }
    keyup(e) {
        if (e.code === this.code) {
            e.preventDefault();
            if (this._state === KeyBindState.Pressed) {
                this._triggered = false;
                this._state = KeyBindState.Await;
            }
        }
    }
    reset() {
        this._triggered = false;
        this._processed = true;
    }
}
class Joystick {
    constructor() {
        this.moveUp = new KeyBind('KeyW');
        this.moveLeft = new KeyBind('KeyA');
        this.moveDown = new KeyBind('KeyS');
        this.moveRight = new KeyBind('KeyD');
        this.hit = new KeyBind('KeyF');
        this.drop = new KeyBind('KeyQ');
        this.inventory = new KeyBind('KeyI');
        this.digit1 = new KeyBind('Digit1');
        this.digit2 = new KeyBind('Digit2');
        this.digit3 = new KeyBind('Digit3');
        this.digit4 = new KeyBind('Digit4');
        this.digit5 = new KeyBind('Digit5');
        this.digit6 = new KeyBind('Digit6');
        this.digit7 = new KeyBind('Digit7');
        this.digit8 = new KeyBind('Digit8');
        this.digit9 = new KeyBind('Digit9');
        this.digit0 = new KeyBind('Digit0');
        this._bindings = {};
        for (const property of Object.getOwnPropertyNames(this)) {
            const value = this[property];
            if (value && value instanceof KeyBind) {
                this._bindings[value.code] = value;
            }
        }
        window.addEventListener("keydown", this.keydown.bind(this));
        window.addEventListener("keyup", this.keyup.bind(this));
    }
    digit(num) {
        switch (num) {
            case 1:
                return this.digit1;
            case 2:
                return this.digit2;
            case 3:
                return this.digit3;
            case 4:
                return this.digit4;
            case 5:
                return this.digit5;
            case 6:
                return this.digit6;
            case 7:
                return this.digit7;
            case 8:
                return this.digit8;
            case 9:
                return this.digit9;
            case 0:
                return this.digit0;
        }
    }
    reset() {
        var _a;
        for (const code of Object.getOwnPropertyNames(this._bindings)) {
            (_a = this._bindings[code]) === null || _a === void 0 ? void 0 : _a.reset();
        }
    }
    keydown(e) {
        var _a;
        (_a = this._bindings[e.code]) === null || _a === void 0 ? void 0 : _a.keydown(e);
    }
    keyup(e) {
        var _a;
        (_a = this._bindings[e.code]) === null || _a === void 0 ? void 0 : _a.keyup(e);
    }
}


/***/ }),

/***/ "./src/inventory/Inventory.ts":
/*!************************************!*\
  !*** ./src/inventory/Inventory.ts ***!
  \************************************/
/*! exports provided: Inventory, EquipmentInventory, BeltInventory, BackpackInventory */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Inventory", function() { return Inventory; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EquipmentInventory", function() { return EquipmentInventory; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BeltInventory", function() { return BeltInventory; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BackpackInventory", function() { return BackpackInventory; });
/* harmony import */ var _drop__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../drop */ "./src/drop/index.ts");
/* harmony import */ var _observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../observable */ "./src/observable.ts");
/* harmony import */ var _InventoryCell__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./InventoryCell */ "./src/inventory/InventoryCell.ts");



class Inventory {
    constructor(character) {
        this._drop = new _observable__WEBPACK_IMPORTED_MODULE_1__["EventPublisher"]();
        this.equipment = new EquipmentInventory(character, this._drop);
        this.belt = new BeltInventory(character, this._drop);
        this.backpack = new BackpackInventory(character, this._drop);
    }
    get drop() {
        return this._drop;
    }
    stack(item) {
        return this.belt.stack(item) || this.backpack.stack(item);
    }
    set(item) {
        return this.belt.set(item) || this.backpack.set(item);
    }
    add(item) {
        return this.stack(item) || this.set(item);
    }
    hasSpace(item) {
        return this.belt.hasSpace(item) || this.backpack.hasSpace(item);
    }
}
class EquipmentInventory {
    constructor(character, drop) {
        this.weapon = new _InventoryCell__WEBPACK_IMPORTED_MODULE_2__["InventoryCell"](character, 1, (item) => item instanceof _drop__WEBPACK_IMPORTED_MODULE_0__["Weapon"], drop, this);
    }
}
class BeltInventory {
    constructor(character, drop) {
        this.length = 10;
        this._cells = [];
        for (let i = 0; i < 10; i++) {
            this._cells[i] = new _InventoryCell__WEBPACK_IMPORTED_MODULE_2__["InventoryCell"](character, 3, () => true, drop, this);
        }
    }
    cell(index) {
        return this._cells[index];
    }
    stack(item) {
        for (let i = 0; i < this._cells.length; i++) {
            if (this._cells[i].stack(item)) {
                return true;
            }
        }
        return false;
    }
    set(item) {
        for (let i = 0; i < this._cells.length; i++) {
            if (this._cells[i].set(item)) {
                return true;
            }
        }
        return false;
    }
    add(item) {
        return this.stack(item) || this.set(item);
    }
    hasSpace(item) {
        for (let i = 0; i < this._cells.length; i++) {
            if (this._cells[i].hasSpace(item)) {
                return true;
            }
        }
        return false;
    }
}
class BackpackInventory {
    constructor(character, drop) {
        this.width = 10;
        this.height = 5;
        this._cells = [];
        for (let y = 0; y < this.height; y++) {
            this._cells.push([]);
            for (let x = 0; x < this.width; x++) {
                this._cells[y][x] = new _InventoryCell__WEBPACK_IMPORTED_MODULE_2__["InventoryCell"](character, 3, () => true, drop, this);
            }
        }
    }
    cell(x, y) {
        return this._cells[y][x];
    }
    stack(item) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this._cells[y][x].stack(item)) {
                    return true;
                }
            }
        }
        return false;
    }
    set(item) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this._cells[y][x].set(item)) {
                    return true;
                }
            }
        }
        return false;
    }
    add(item) {
        return this.stack(item) || this.set(item);
    }
    hasSpace(item) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this._cells[y][x].hasSpace(item)) {
                    return true;
                }
            }
        }
        return false;
    }
}


/***/ }),

/***/ "./src/inventory/InventoryCell.ts":
/*!****************************************!*\
  !*** ./src/inventory/InventoryCell.ts ***!
  \****************************************/
/*! exports provided: InventoryCell */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InventoryCell", function() { return InventoryCell; });
/* harmony import */ var _observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../observable */ "./src/observable.ts");

class InventoryCell {
    constructor(character, maxInStack, predicate, drop, parent) {
        this._item = new _observable__WEBPACK_IMPORTED_MODULE_0__["ObservableVar"](null);
        this._count = new _observable__WEBPACK_IMPORTED_MODULE_0__["ObservableVar"](0);
        this._character = character;
        this._maxInStack = maxInStack;
        this._predicate = predicate;
        this._drop = drop;
        this.parent = parent;
    }
    get item() {
        return this._item;
    }
    get count() {
        return this._count;
    }
    hasSpace(item) {
        return this.supports(item) && (this.isEmpty || (this._item.get().same(item) && this._count.get() < this._maxInStack));
    }
    supports(item) {
        return this._predicate(item);
    }
    stack(item) {
        var _a;
        if (((_a = this._item.get()) === null || _a === void 0 ? void 0 : _a.same(item)) && this._count.get() < this._maxInStack) {
            this._count.update(c => c + 1);
            return true;
        }
        return false;
    }
    clear() {
        if (this._item.get()) {
            this._item.set(null);
            this._count.set(0);
        }
    }
    set(item, count = 1) {
        if (!this._item.get() && this._predicate(item)) {
            this._item.set(item);
            this._count.set(count);
            return true;
        }
        return false;
    }
    decrease() {
        this._count.update(c => Math.max(0, c - 1));
        if (this._count.get() <= 0) {
            this._item.set(null);
            this._count.set(0);
        }
    }
    get isEmpty() {
        return this._item.get() == null;
    }
    use() {
        const item = this._item.get();
        if (item) {
            item.use(this, this._character);
            return true;
        }
        return false;
    }
    equip() {
        const item = this._item.get();
        const weapon = this._character.inventory.equipment.weapon;
        if (item && weapon.supports(item)) {
            const prev = weapon.item.get();
            weapon.clear();
            weapon.set(item);
            this.clear();
            if (prev) {
                this.set(prev);
            }
        }
    }
    toBelt() {
        const item = this._item.get();
        while (item && !this.isEmpty) {
            if (this._character.inventory.belt.add(item)) {
                this.decrease();
            }
            else {
                break;
            }
        }
    }
    toBackpack() {
        const item = this._item.get();
        while (item && !this.isEmpty) {
            if (this._character.inventory.backpack.add(item)) {
                this.decrease();
            }
            else {
                break;
            }
        }
    }
    drop() {
        const drop = this._item.get();
        const count = this._count.get();
        if (drop) {
            this._item.set(null);
            this._count.set(0);
            this._drop.send([drop, count]);
        }
    }
}


/***/ }),

/***/ "./src/inventory/InventoryController.ts":
/*!**********************************************!*\
  !*** ./src/inventory/InventoryController.ts ***!
  \**********************************************/
/*! exports provided: BaseInventoryActionsController, BaseHeroInventoryActionsController, DefaultInventoryActionsController, SellingInventoryActionsController, BuyingInventoryActionsController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BaseInventoryActionsController", function() { return BaseInventoryActionsController; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BaseHeroInventoryActionsController", function() { return BaseHeroInventoryActionsController; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DefaultInventoryActionsController", function() { return DefaultInventoryActionsController; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SellingInventoryActionsController", function() { return SellingInventoryActionsController; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BuyingInventoryActionsController", function() { return BuyingInventoryActionsController; });
/* harmony import */ var _Inventory__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Inventory */ "./src/inventory/Inventory.ts");

class BaseInventoryActionsController {
    constructor(inventory, title) {
        this.inventory = inventory;
        this.title = title;
    }
    handleActions(view, drop) {
        view.removeButtons();
        if (drop) {
            this.buttons(view, drop);
        }
    }
}
class BaseHeroInventoryActionsController extends BaseInventoryActionsController {
    constructor(inventory, title) {
        super(inventory, title);
    }
    basicButtons(view, item) {
        const cell = view.cell;
        if (cell.parent instanceof _Inventory__WEBPACK_IMPORTED_MODULE_0__["BeltInventory"] || cell.parent instanceof _Inventory__WEBPACK_IMPORTED_MODULE_0__["BackpackInventory"]) {
            if (this.inventory.equipment.weapon.supports(item)) {
                view.addButton("Equip", () => cell.equip());
            }
            else {
                view.addButton("Use item", () => cell.use());
            }
        }
        if (!(cell.parent instanceof _Inventory__WEBPACK_IMPORTED_MODULE_0__["BeltInventory"]))
            view.addButton("To belt", () => cell.toBelt());
        if (!(cell.parent instanceof _Inventory__WEBPACK_IMPORTED_MODULE_0__["BackpackInventory"]))
            view.addButton("To backpack", () => cell.toBackpack());
        view.addButton("Drop", () => cell.drop());
    }
}
class DefaultInventoryActionsController extends BaseHeroInventoryActionsController {
    constructor(inventory) {
        super(inventory, "Inventory");
    }
    buttons(view, item) {
        this.basicButtons(view, item);
    }
    handleInfo(drop) {
        const info = drop.info();
        info.price = info.sellPrice;
        return info;
    }
}
class SellingInventoryActionsController extends BaseHeroInventoryActionsController {
    constructor(hero, npc) {
        super(hero.inventory, "Selling");
        this._hero = hero;
        this._npc = npc;
    }
    buttons(view, item) {
        this.basicButtons(view, item);
        this.sellingButtons(view, item);
    }
    sellingButtons(view, item) {
        const price = item.info().sellPrice;
        if (price !== undefined && this._npc.coins.get() >= price && this._npc.inventory.backpack.hasSpace(item)) {
            view.addButton('Sell', () => {
                if (this._npc.coins.get() >= price && this._npc.inventory.backpack.hasSpace(item)) {
                    this._npc.decreaseCoins(price);
                    this._npc.inventory.backpack.add(item);
                    this._hero.addCoins(price);
                    view.cell.decrease();
                }
                else {
                    console.warn("failed sell item");
                }
            });
        }
        else {
            console.warn(`price: ${price} npc coins: ${this._npc.coins.get()}`);
        }
    }
    handleInfo(drop) {
        const info = drop.info();
        info.price = info.sellPrice;
        return info;
    }
}
class BuyingInventoryActionsController extends BaseInventoryActionsController {
    constructor(hero, npc) {
        super(npc.inventory, "Buying");
        this._hero = hero;
        this._npc = npc;
    }
    buttons(view, drop) {
        if (view.cell.parent instanceof _Inventory__WEBPACK_IMPORTED_MODULE_0__["BackpackInventory"]) {
            this.buyingButtons(view, drop);
        }
    }
    buyingButtons(view, drop) {
        const price = drop.info().buyPrice;
        if (price !== undefined && this._hero.coins.get() >= price && this._hero.inventory.hasSpace(drop)) {
            view.addButton('Buy', () => {
                if (this._npc.coins.get() >= price && this._hero.inventory.hasSpace(drop)) {
                    this._hero.decreaseCoins(price);
                    this._hero.inventory.backpack.add(drop);
                    this._npc.addCoins(price);
                    view.cell.decrease();
                }
                else {
                    console.warn("failed buy item");
                }
            });
        }
        else {
            console.warn(`price: ${price} hero coins: ${this._hero.coins.get()}`);
        }
    }
    handleInfo(drop) {
        const info = drop.info();
        info.price = info.buyPrice;
        return info;
    }
}


/***/ }),

/***/ "./src/inventory/InventoryModalScene.ts":
/*!**********************************************!*\
  !*** ./src/inventory/InventoryModalScene.ts ***!
  \**********************************************/
/*! exports provided: InventoryModalScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InventoryModalScene", function() { return InventoryModalScene; });
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");
/* harmony import */ var _InventoryView__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./InventoryView */ "./src/inventory/InventoryView.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_2__);



class InventoryModalScene extends _ui__WEBPACK_IMPORTED_MODULE_0__["VStack"] {
    constructor(controller, actionsController) {
        super({ background: { color: _ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].background } });
        this._controller = controller;
        this._actionsController = actionsController;
        this._selectable = new _ui__WEBPACK_IMPORTED_MODULE_0__["SelectableGrid"](this._controller.joystick);
    }
    init() {
        const head = new _ui__WEBPACK_IMPORTED_MODULE_0__["HStack"]({ padding: 0 });
        this.addChild(head);
        const close = new _ui__WEBPACK_IMPORTED_MODULE_0__["Button"]({ label: "X", width: 40, height: 32 });
        head.addChild(close);
        this._selectable.set(0, 0, close, () => this._controller.closeModal());
        const title = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["BitmapText"](this._actionsController.title, { font: { name: "alagard", size: 32 } });
        head.addChild(title);
        const inventoryView = new _InventoryView__WEBPACK_IMPORTED_MODULE_1__["InventoryView"](this._controller.resources, this._actionsController, this._selectable, 0, 1);
        inventoryView.position.set(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin);
        inventoryView.calculateBounds();
        inventoryView.zIndex = 1;
        this.addChild(inventoryView);
        this.position.set((this._controller.app.screen.width >> 1) - (this.width >> 1), (this._controller.app.screen.height >> 1) - (this.height >> 1));
        this._controller.stage.addChild(this);
        this._controller.app.ticker.add(this.handleInput, this);
    }
    destroy() {
        this._controller.app.ticker.remove(this.handleInput, this);
        super.destroy({ children: true });
    }
    handleInput() {
        const joystick = this._controller.joystick;
        if (joystick.inventory.once()) {
            this._controller.closeModal();
            return;
        }
        this._selectable.handleInput();
    }
}


/***/ }),

/***/ "./src/inventory/InventoryView.ts":
/*!****************************************!*\
  !*** ./src/inventory/InventoryView.ts ***!
  \****************************************/
/*! exports provided: InventoryView, EquipmentInventoryView, BeltInventoryView, BackpackInventoryView, InventoryCellView, InventoryCellCardView, InventoryCellActionsView */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InventoryView", function() { return InventoryView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EquipmentInventoryView", function() { return EquipmentInventoryView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BeltInventoryView", function() { return BeltInventoryView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BackpackInventoryView", function() { return BackpackInventoryView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InventoryCellView", function() { return InventoryCellView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InventoryCellCardView", function() { return InventoryCellCardView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InventoryCellActionsView", function() { return InventoryCellActionsView; });
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../ui */ "./src/ui.ts");
/* harmony import */ var _observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../observable */ "./src/observable.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_2__);



const CELL_SIZE = 32;
const BUTTON_WIDTH = 170;
const BUTTON_HEIGHT = 32;
class InventoryView extends pixi_js__WEBPACK_IMPORTED_MODULE_2__["Container"] {
    constructor(resources, controller, selectable, selectableOffsetX, selectableOffsetY) {
        super();
        this._selectable = selectable;
        this._selectableOffsetX = selectableOffsetX;
        this._selectableOffsetY = selectableOffsetY;
        const inventory = controller.inventory;
        const viewStack = new _ui__WEBPACK_IMPORTED_MODULE_0__["HStack"]({ padding: 0 });
        this.addChild(viewStack);
        const inventoryStack = new _ui__WEBPACK_IMPORTED_MODULE_0__["VStack"]({ padding: 0 });
        viewStack.addChild(inventoryStack);
        this._equipment = new EquipmentInventoryView(resources, inventory.equipment);
        inventoryStack.addChild(this._equipment);
        selectable.set(selectableOffsetX, selectableOffsetY, this._equipment.weapon, () => this.show(inventory.equipment.weapon));
        selectable.merge(selectableOffsetX, selectableOffsetY, 10, 1);
        this._belt = new BeltInventoryView(resources, inventory.belt);
        inventoryStack.addChild(this._belt);
        for (let i = 0; i < this._belt.length; i++) {
            const cell = inventory.belt.cell(i);
            this._selectable.set(selectableOffsetX + i, selectableOffsetY + 1, this._belt.cell(i), () => this.show(cell));
        }
        this._backpack = new BackpackInventoryView(resources, inventory.backpack);
        inventoryStack.addChild(this._backpack);
        for (let x = 0; x < inventory.backpack.width; x++) {
            for (let y = 0; y < inventory.backpack.height; y++) {
                const cell = inventory.backpack.cell(x, y);
                this._selectable.set(selectableOffsetX + x, selectableOffsetY + y + 2, this._backpack.cell(x, y), () => this.show(cell));
            }
        }
        this._actions = new InventoryCellActionsView(this._selectable, this._selectableOffsetX, this._selectableOffsetY, controller);
        inventoryStack.addChild(this._actions);
        this._card = new InventoryCellCardView(resources, controller, {
            width: 400,
            height: 400,
        });
        viewStack.addChild(this._card);
    }
    destroy() {
        super.destroy();
        this._equipment.destroy();
        this._belt.destroy();
        this._backpack.destroy();
        this._card.destroy();
    }
    show(cell) {
        this._card.publisher = cell.item;
        this._actions.cell = cell;
    }
}
class EquipmentInventoryView extends pixi_js__WEBPACK_IMPORTED_MODULE_2__["Container"] {
    constructor(resources, equipment) {
        super();
        this._equipment = equipment;
        const background = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["Graphics"]()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiBackground)
            .drawRect(0, 0, CELL_SIZE + (_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder << 1), CELL_SIZE + (_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder << 1))
            .endFill();
        this.addChild(background);
        this.weapon = new InventoryCellView(resources, {
            item: this._equipment.weapon.item,
            count: new _observable__WEBPACK_IMPORTED_MODULE_1__["ObservableVar"](null)
        });
        this.weapon.position.set(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder);
        this.addChild(this.weapon);
    }
}
class BeltInventoryView extends pixi_js__WEBPACK_IMPORTED_MODULE_2__["Container"] {
    constructor(resources, inventory) {
        super();
        this._inventory = inventory;
        const background = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["Graphics"]()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiBackground)
            .drawRect(0, 0, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder + (CELL_SIZE + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder) * inventory.length, CELL_SIZE + (_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder << 1))
            .endFill();
        this.addChild(background);
        this._cells = [];
        for (let i = 0; i < inventory.length; i++) {
            const cell = inventory.cell(i);
            const view = new InventoryCellView(resources, {
                item: cell.item,
                count: cell.count,
            });
            view.position.set(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder + (CELL_SIZE + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder) * i, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder);
            this._cells.push(view);
            this.addChild(view);
        }
    }
    get length() {
        return this._inventory.length;
    }
    cell(index) {
        return this._cells[index];
    }
}
class BackpackInventoryView extends pixi_js__WEBPACK_IMPORTED_MODULE_2__["Container"] {
    constructor(resources, inventory) {
        super();
        const background = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["Graphics"]()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiBackground)
            .drawRect(0, 0, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder + (CELL_SIZE + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder) * inventory.width, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder + (CELL_SIZE + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder) * inventory.height)
            .endFill();
        this.addChild(background);
        this._cells = [];
        for (let y = 0; y < inventory.height; y++) {
            this._cells.push([]);
            for (let x = 0; x < inventory.width; x++) {
                const cell = inventory.cell(x, y);
                const view = new InventoryCellView(resources, {
                    item: cell.item,
                    count: cell.count,
                });
                view.position.set(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder + (CELL_SIZE + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder) * x, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder + (CELL_SIZE + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder) * y);
                this._cells[y][x] = view;
                this.addChild(view);
            }
        }
    }
    cell(x, y) {
        return this._cells[y][x];
    }
}
class InventoryCellView extends pixi_js__WEBPACK_IMPORTED_MODULE_2__["Container"] {
    constructor(resources, options) {
        super();
        this._sprite = null;
        this._selected = false;
        this._item = options.item;
        this._count = options.count;
        this._resources = resources;
        this._background = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["Graphics"]();
        this.selected = false;
        this._counter = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["BitmapText"]("0", { font: { name: "alagard", size: 16 } });
        this._counter.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["Point"](1, 0);
        this._counter.position.set(CELL_SIZE - _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder, 0);
        this.addChild(this._background, this._counter);
        this._item.subscribe(this.updateItem, this);
        this._count.subscribe(this.updateCounter, this);
    }
    destroy() {
        super.destroy();
        this._item.unsubscribe(this.updateItem, this);
        this._count.unsubscribe(this.updateCounter, this);
    }
    get selected() {
        return this._selected;
    }
    set selected(selected) {
        this._selected = selected;
        this._background
            .clear()
            .beginFill(selected ? _ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiSelected : _ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiNotSelected)
            .drawRect(0, 0, CELL_SIZE, CELL_SIZE)
            .endFill();
    }
    updateCounter(counter) {
        if (counter === null || counter === 0) {
            this._counter.text = "";
        }
        else {
            this._counter.text = counter.toString();
        }
    }
    updateItem(item) {
        var _a;
        (_a = this._sprite) === null || _a === void 0 ? void 0 : _a.destroy();
        this._sprite = null;
        if (item) {
            this._sprite = this._resources.sprite(item.spriteName);
            const max = CELL_SIZE - (_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder << 1);
            const scale = max / Math.max(this._sprite.width, this._sprite.height);
            this._sprite.scale.set(scale, scale);
            this._sprite.anchor.set(0.5, 0);
            this._sprite.position.set(CELL_SIZE >> 1, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiBorder);
            this.addChild(this._sprite);
        }
    }
}
class InventoryCellCardView extends pixi_js__WEBPACK_IMPORTED_MODULE_2__["Container"] {
    constructor(resources, controller, options) {
        super();
        this._sprite = null;
        this._publisher = null;
        this._resources = resources;
        this._controller = controller;
        this._width = options.width || 400;
        this._height = options.height || 400;
        this._spriteSize = 128 + (_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin << 1);
        const background = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["Graphics"]()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiBackground)
            .drawRect(0, 0, this._width, this._height)
            .endFill()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_0__["Colors"].uiNotSelected)
            .drawRect(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin + 32 + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin, this._spriteSize, this._spriteSize)
            .endFill();
        this._title = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["BitmapText"]("", { font: { name: "alagard", size: 32 } });
        this._title.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["Point"](0.5, 0);
        this._title.position.set(this._width >> 1, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin);
        this._description = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["BitmapText"]("", { font: { name: "alagard", size: 16 } });
        this._description.position.set(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin + this._spriteSize + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin, _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin + 32 + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin);
        this.addChild(background, this._title, this._description);
    }
    destroy() {
        var _a;
        super.destroy();
        (_a = this._publisher) === null || _a === void 0 ? void 0 : _a.unsubscribe(this.handle, this);
        this._publisher = null;
    }
    set publisher(publisher) {
        var _a;
        (_a = this._publisher) === null || _a === void 0 ? void 0 : _a.unsubscribe(this.handle, this);
        this._publisher = null;
        this._publisher = publisher;
        this._publisher.subscribe(this.handle, this);
    }
    handle(drop) {
        var _a;
        (_a = this._sprite) === null || _a === void 0 ? void 0 : _a.destroy();
        this._sprite = null;
        this._title.text = "";
        this._description.text = "";
        if (drop) {
            const sprite = this._sprite = this._resources.sprite(drop.spriteName);
            sprite.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_2__["Point"](0.5, 0.5);
            sprite.position.set(_ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin + (this._spriteSize >> 1), _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin + (this._spriteSize >> 1) + 32 + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin);
            const maxSize = this._spriteSize - _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin;
            const w = sprite.width;
            const h = sprite.height;
            if (w > h) {
                this._sprite.width = maxSize;
                this._sprite.height = (maxSize / w) * h;
            }
            else {
                this._sprite.height = maxSize;
                this._sprite.width = (maxSize / h) * w;
            }
            this.addChild(this._sprite);
            const info = this._controller.handleInfo(drop);
            this._title.text = info.name;
            const text = [];
            if (info.health)
                text.push(`health: ${info.health}`);
            if (info.speed)
                text.push(`speed: ${info.speed * 100}%`);
            if (info.distance)
                text.push(`distance: ${info.distance}`);
            if (info.damage)
                text.push(`damage: ${info.damage}`);
            if (info.price)
                text.push(`price: ${info.price}$`);
            this._description.text = text.join("\n");
        }
    }
}
class InventoryCellActionsView extends pixi_js__WEBPACK_IMPORTED_MODULE_2__["Container"] {
    constructor(selectable, selectableOffsetX, selectableOffsetY, controller) {
        super();
        this._buttons = [];
        this._cell = null;
        this._selectable = selectable;
        this._selectableOffsetX = selectableOffsetX;
        this._selectableOffsetY = selectableOffsetY;
        this._controller = controller;
    }
    destroy() {
        var _a;
        super.destroy();
        (_a = this._cell) === null || _a === void 0 ? void 0 : _a.item.unsubscribe(this.handle, this);
        this._cell = null;
        this.removeButtons();
    }
    set cell(cell) {
        var _a;
        (_a = this._cell) === null || _a === void 0 ? void 0 : _a.item.unsubscribe(this.handle, this);
        this.removeButtons();
        this._cell = cell;
        this._cell.item.subscribe(this.handle, this);
    }
    get cell() {
        return this._cell;
    }
    handle(item) {
        this._controller.handleActions(this, item);
    }
    removeButtons() {
        for (const [button, x, y] of this._buttons) {
            this._selectable.unmerge(x, y);
            this._selectable.remove(x, y);
            button.destroy();
        }
        this._selectable.reset();
        this._buttons.splice(0, this._buttons.length);
    }
    addButton(label, action) {
        const total = this._buttons.length;
        const row = total >> 1;
        const cell = total % 2;
        const mergeWidth = 5;
        const selectableX = this._selectableOffsetX + (cell * mergeWidth);
        const selectableY = this._selectableOffsetY + 10 + row;
        const button = new _ui__WEBPACK_IMPORTED_MODULE_0__["Button"]({
            label: label,
            width: BUTTON_WIDTH,
            height: BUTTON_HEIGHT,
        });
        button.position.set(cell * (BUTTON_WIDTH + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin), row * (BUTTON_HEIGHT + _ui__WEBPACK_IMPORTED_MODULE_0__["Sizes"].uiMargin));
        this._buttons.push([button, selectableX, selectableY]);
        this._selectable.set(selectableX, selectableY, button, action);
        this._selectable.merge(selectableX, selectableY, mergeWidth, 1);
        this.addChild(button);
    }
}


/***/ }),

/***/ "./src/inventory/index.ts":
/*!********************************!*\
  !*** ./src/inventory/index.ts ***!
  \********************************/
/*! exports provided: Inventory, EquipmentInventory, BeltInventory, BackpackInventory, InventoryModalScene, InventoryCell, BaseInventoryActionsController, BaseHeroInventoryActionsController, DefaultInventoryActionsController, SellingInventoryActionsController, BuyingInventoryActionsController, InventoryView, EquipmentInventoryView, BeltInventoryView, BackpackInventoryView, InventoryCellView, InventoryCellCardView, InventoryCellActionsView */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Inventory__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Inventory */ "./src/inventory/Inventory.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Inventory", function() { return _Inventory__WEBPACK_IMPORTED_MODULE_0__["Inventory"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "EquipmentInventory", function() { return _Inventory__WEBPACK_IMPORTED_MODULE_0__["EquipmentInventory"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BeltInventory", function() { return _Inventory__WEBPACK_IMPORTED_MODULE_0__["BeltInventory"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BackpackInventory", function() { return _Inventory__WEBPACK_IMPORTED_MODULE_0__["BackpackInventory"]; });

/* harmony import */ var _InventoryModalScene__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./InventoryModalScene */ "./src/inventory/InventoryModalScene.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InventoryModalScene", function() { return _InventoryModalScene__WEBPACK_IMPORTED_MODULE_1__["InventoryModalScene"]; });

/* harmony import */ var _InventoryCell__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./InventoryCell */ "./src/inventory/InventoryCell.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InventoryCell", function() { return _InventoryCell__WEBPACK_IMPORTED_MODULE_2__["InventoryCell"]; });

/* harmony import */ var _InventoryController__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./InventoryController */ "./src/inventory/InventoryController.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BaseInventoryActionsController", function() { return _InventoryController__WEBPACK_IMPORTED_MODULE_3__["BaseInventoryActionsController"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BaseHeroInventoryActionsController", function() { return _InventoryController__WEBPACK_IMPORTED_MODULE_3__["BaseHeroInventoryActionsController"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DefaultInventoryActionsController", function() { return _InventoryController__WEBPACK_IMPORTED_MODULE_3__["DefaultInventoryActionsController"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SellingInventoryActionsController", function() { return _InventoryController__WEBPACK_IMPORTED_MODULE_3__["SellingInventoryActionsController"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BuyingInventoryActionsController", function() { return _InventoryController__WEBPACK_IMPORTED_MODULE_3__["BuyingInventoryActionsController"]; });

/* harmony import */ var _InventoryView__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./InventoryView */ "./src/inventory/InventoryView.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InventoryView", function() { return _InventoryView__WEBPACK_IMPORTED_MODULE_4__["InventoryView"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "EquipmentInventoryView", function() { return _InventoryView__WEBPACK_IMPORTED_MODULE_4__["EquipmentInventoryView"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BeltInventoryView", function() { return _InventoryView__WEBPACK_IMPORTED_MODULE_4__["BeltInventoryView"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BackpackInventoryView", function() { return _InventoryView__WEBPACK_IMPORTED_MODULE_4__["BackpackInventoryView"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InventoryCellView", function() { return _InventoryView__WEBPACK_IMPORTED_MODULE_4__["InventoryCellView"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InventoryCellCardView", function() { return _InventoryView__WEBPACK_IMPORTED_MODULE_4__["InventoryCellCardView"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InventoryCellActionsView", function() { return _InventoryView__WEBPACK_IMPORTED_MODULE_4__["InventoryCellActionsView"]; });








/***/ }),

/***/ "./src/keybind.scene.ts":
/*!******************************!*\
  !*** ./src/keybind.scene.ts ***!
  \******************************/
/*! exports provided: KeyBindScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KeyBindScene", function() { return KeyBindScene; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);

class KeyBindScene {
    constructor(controller) {
        this._controller = controller;
    }
    init() {
        this.renderTitle();
        this.renderHelp();
        this._controller.app.ticker.add(this.handleInput, this);
    }
    destroy() {
        this._controller.app.ticker.remove(this.handleInput, this);
        this._controller.stage.removeChildren();
    }
    pause() {
    }
    resume() {
    }
    renderTitle() {
        const title = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"]("ROGUELIKE DUNGEON", { font: { name: 'alagard', size: 64 } });
        title.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.5, 0);
        title.position.set(this._controller.app.screen.width >> 1, 64);
        this._controller.stage.addChild(title);
    }
    renderHelp() {
        const bindings = [
            "WASD - top, left, bottom, right",
            "F - action",
            "Q - drop weapon",
            "I - inventory",
            "1 ... 0 - belt",
            "",
            "PRESS F TO CONTINUE",
        ];
        for (let i = 0; i < bindings.length; i++) {
            const text = bindings[i];
            if (text.length > 0) {
                const line = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"](text, { font: { name: 'alagard', size: 32 } });
                line.position.set(40, 200 + i * 30);
                this._controller.stage.addChild(line);
            }
        }
    }
    handleInput() {
        if (this._controller.joystick.hit.once()) {
            this._controller.selectHero();
        }
    }
}


/***/ }),

/***/ "./src/observable.ts":
/*!***************************!*\
  !*** ./src/observable.ts ***!
  \***************************/
/*! exports provided: ObservableVar, EventPublisher */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ObservableVar", function() { return ObservableVar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EventPublisher", function() { return EventPublisher; });
class ObservableVar {
    constructor(value) {
        this._listeners = [];
        this._value = value;
    }
    set(value) {
        this._value = value;
        for (let i = this._listeners.length - 1; i >= 0; i--) {
            const listener = this._listeners[i];
            if (listener.gc) {
                this._listeners.splice(i, 1);
            }
            else {
                listener.send(this._value);
            }
        }
    }
    update(f) {
        this.set(f(this._value));
    }
    get() {
        return this._value;
    }
    subscribe(callback, context) {
        const listener = new Listener(callback, context);
        this._listeners.push(listener);
        listener.send(this._value);
    }
    unsubscribe(callback, context) {
        var _a;
        (_a = this._listeners.find(l => l.matches(callback, context))) === null || _a === void 0 ? void 0 : _a.unsubscribe();
    }
}
class EventPublisher {
    constructor() {
        this._listeners = [];
    }
    send(value) {
        for (let i = this._listeners.length - 1; i >= 0; i--) {
            const listener = this._listeners[i];
            if (listener.gc) {
                this._listeners.splice(i, 1);
            }
            else {
                listener.send(value);
            }
        }
    }
    subscribe(callback, context) {
        const listener = new Listener(callback, context);
        this._listeners.push(listener);
    }
    unsubscribe(callback, context) {
        var _a;
        (_a = this._listeners.find(l => l.matches(callback, context))) === null || _a === void 0 ? void 0 : _a.unsubscribe();
    }
}
class Listener {
    constructor(callback, context) {
        this._gc = false;
        this._callback = callback;
        this._context = context || null;
    }
    get gc() {
        return this._gc;
    }
    matches(callback, context) {
        return this._callback === callback && this._context === context;
    }
    send(value) {
        if (this._context) {
            this._callback.call(this._context, value);
        }
        else {
            this._callback(value);
        }
    }
    unsubscribe() {
        this._gc = true;
    }
}


/***/ }),

/***/ "./src/pathfinding.ts":
/*!****************************!*\
  !*** ./src/pathfinding.ts ***!
  \****************************/
/*! exports provided: Heuristic, PathFinding */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Heuristic", function() { return Heuristic; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PathFinding", function() { return PathFinding; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);

var Heuristic;
(function (Heuristic) {
    Heuristic[Heuristic["Manhattan"] = 0] = "Manhattan";
    Heuristic[Heuristic["Euclidean"] = 1] = "Euclidean";
    Heuristic[Heuristic["Chebyshev"] = 2] = "Chebyshev";
    Heuristic[Heuristic["Octile"] = 3] = "Octile";
})(Heuristic || (Heuristic = {}));
class Node {
    constructor(parent, position) {
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = parent;
        this.position = position;
    }
    equal(other) {
        return this.position.equals(other.position);
    }
}
class PathFinding {
    constructor(width, height, diagonalAllowed = true, includeStart = false, includeEnd = false, heuristic = Heuristic.Chebyshev, weight = 1) {
        this._map = [];
        this._weight = 1;
        this._width = width;
        this._height = height;
        this._diagonalAllowed = diagonalAllowed;
        this._includeStart = includeStart;
        this._includeEnd = includeEnd;
        this._heuristic = heuristic;
        this._weight = weight;
        for (let x = 0; x < width; x++) {
            const row = [];
            this._map.push(row);
            for (let y = 0; y < height; y++) {
                row.push(1);
            }
        }
    }
    clear(x, y) {
        this._map[x][y] = 0;
    }
    mark(x, y) {
        this._map[x][y] = 1;
    }
    find(start, end) {
        const startNode = new Node(null, start);
        const endNode = new Node(null, end);
        const openList = [];
        const closedList = [];
        openList.push(startNode);
        while (openList.length > 0) {
            let currentNode = openList[0];
            let currentIndex = 0;
            for (let i = 1; i < openList.length; i++) {
                const item = openList[i];
                if (item.f < currentNode.f) {
                    currentNode = item;
                    currentIndex = i;
                }
            }
            openList.splice(currentIndex, 1);
            closedList.push(currentNode);
            if (currentNode.equal(endNode)) {
                const path = [];
                let current;
                if (this._includeEnd) {
                    current = currentNode;
                }
                else {
                    current = currentNode.parent;
                }
                while (current.parent !== null) {
                    path.push(current.position);
                    current = current.parent;
                }
                if (this._includeStart) {
                    path.push(current.position);
                }
                return path.reverse();
            }
            const children = [];
            const squares = this._diagonalAllowed ? PathFinding.adjacentSquaresDiagonal : PathFinding.adjacentSquares;
            for (let i = 0; i < squares.length; i++) {
                const newPosition = squares[i];
                const nodePosition = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](currentNode.position.x + newPosition.x, currentNode.position.y + newPosition.y);
                if (nodePosition.x >= this._width || nodePosition.x < 0 ||
                    nodePosition.y >= this._height || nodePosition.y < 0) {
                    continue;
                }
                if (this._map[nodePosition.x][nodePosition.y] != 0) {
                    continue;
                }
                const newNode = new Node(currentNode, nodePosition);
                children.push(newNode);
            }
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (closedList.find(c => c.equal(child)) != null) {
                    continue;
                }
                child.g = currentNode.g + 1;
                child.h = this.heuristicFunction(child.position, endNode.position);
                child.f = child.g + child.h;
                if (openList.find(c => c.equal(child)) != null) {
                    continue;
                }
                openList.push(child);
            }
        }
        return [];
    }
    heuristicFunction(pos0, pos1) {
        const deltaX = Math.abs(pos1.x - pos0.x);
        const deltaY = Math.abs(pos1.y - pos0.y);
        switch (this._heuristic) {
            case Heuristic.Manhattan:
                return (deltaX + deltaY) * this._weight;
            case Heuristic.Euclidean:
                return Math.sqrt(deltaX * deltaX + deltaY * deltaY) * this._weight;
            case Heuristic.Chebyshev:
                return Math.max(deltaX, deltaY) * this._weight;
            case Heuristic.Octile:
                return (deltaX + deltaY - 0.58 * Math.min(deltaX, deltaY)) * this._weight;
        }
    }
}
PathFinding.adjacentSquares = [
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0, -1),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0, 1),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](-1, 0),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](1, 0),
];
PathFinding.adjacentSquaresDiagonal = [
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0, -1),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0, 1),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](-1, 0),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](1, 0),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](-1, -1),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](-1, 1),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](1, -1),
    new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](1, 1)
];


/***/ }),

/***/ "./src/persistent.state.ts":
/*!*********************************!*\
  !*** ./src/persistent.state.ts ***!
  \*********************************/
/*! exports provided: StoragePersistentStore, SessionPersistentState */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StoragePersistentStore", function() { return StoragePersistentStore; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SessionPersistentState", function() { return SessionPersistentState; });
class StoragePersistentStore {
    constructor(storage, prefix) {
        this._transaction = new Map();
        this._storage = storage;
        this._prefix = prefix;
    }
    clear() {
        for (const key of Object.keys(this._storage)) {
            if (key.startsWith(this._prefix)) {
                this._storage.removeItem(key);
            }
        }
        this._transaction.clear();
    }
    load(key) {
        const value = this._storage.getItem(this.key(key));
        if (value !== null) {
            return JSON.parse(value);
        }
        else {
            return null;
        }
    }
    save(key, value) {
        this._transaction.set(key, value);
        this._storage.setItem(this.key(key), JSON.stringify(value));
    }
    commit() {
        for (const [key, value] of this._transaction) {
            this._storage.setItem(this.key(key), JSON.stringify(value));
        }
        this._transaction.clear();
    }
    key(key) {
        return [this._prefix, key].join();
    }
}
function isLocalhost() {
    return location.hostname === "localhost" ||
        location.hostname === "0.0.0.0" ||
        location.hostname === "127.0.0.1";
}
class SessionPersistentState {
    constructor() {
        const storage = isLocalhost() ? sessionStorage : localStorage;
        this.global = new StoragePersistentStore(storage, "global.");
        this.session = new StoragePersistentStore(storage, "session.");
    }
}


/***/ }),

/***/ "./src/resources.ts":
/*!**************************!*\
  !*** ./src/resources.ts ***!
  \**************************/
/*! exports provided: Resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Resources", function() { return Resources; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

class Resources {
    constructor(loader) {
        this._sprites = {};
        this._animations = {};
        this.loader = loader;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve => {
                this.loader
                    .add('npc.json')
                    .add('dungeon.json')
                    .add('bonfire.json')
                    .add('dungeon.rules.json')
                    .add('dungeon.rules.4.json')
                    .add('dungeon.design.json')
                    .add('dialogs.json')
                    .add('alagard', 'fonts/alagard.fnt')
                    .add('big_egg_collect', 'sounds/big_egg_collect.{ogg,mp3}')
                    .add('fruit_collect', 'sounds/fruit_collect.{ogg,mp3}')
                    .add('select', 'sounds/select.{ogg,mp3}')
                    .add('confirm', 'sounds/confirm.{ogg,mp3}')
                    .add('cancel', 'sounds/cancel.{ogg,mp3}')
                    .add('text', 'sounds/text.{ogg,mp3}')
                    .add('boss_hit', 'sounds/boss_hit.{ogg,mp3}')
                    .add('hit_damage', 'sounds/hit_damage.{ogg,mp3}')
                    .load((_loader, resources) => {
                    resources['fonts/alagard.png'].texture.baseTexture.scaleMode = pixi_js__WEBPACK_IMPORTED_MODULE_0__["SCALE_MODES"].NEAREST;
                    this.add(resources['npc.json'].spritesheet);
                    this.add(resources['dungeon.json'].spritesheet);
                    this.add(resources['bonfire.json'].spritesheet);
                    resolve();
                });
            }));
        });
    }
    add(spritesheet) {
        spritesheet.baseTexture.scaleMode = pixi_js__WEBPACK_IMPORTED_MODULE_0__["SCALE_MODES"].NEAREST;
        for (const name of Object.keys(spritesheet.textures)) {
            this._sprites[name] = spritesheet.textures[name];
        }
        for (const name of Object.keys(spritesheet.animations)) {
            this._animations[name] = spritesheet.animations[name];
        }
    }
    sprite(name, options = {}) {
        if (this._sprites[name]) {
            return this.fixed(name);
        }
        else if (this._animations[name]) {
            return this.animated(name, options);
        }
        else {
            throw `sprite or animation not found: ${name}`;
        }
    }
    fixed(name) {
        if (!this._sprites[name]) {
            throw `sprite not found: ${name}`;
        }
        const sprite = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Sprite"](this._sprites[name]);
        sprite.name = name;
        return sprite;
    }
    animated(name, options = {}) {
        if (!this._animations[name]) {
            throw `animation not found: ${name}`;
        }
        const sprite = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["AnimatedSprite"](this._animations[name]);
        sprite.name = name;
        sprite.autoUpdate = options.autoUpdate !== undefined ? options.autoUpdate : true;
        sprite.animationSpeed = options.animationSpeed !== undefined ? options.animationSpeed : 0.2;
        sprite.loop = options.loop !== undefined ? options.loop : true;
        if (options.play !== undefined ? options.play : true) {
            sprite.play();
        }
        return sprite;
    }
}


/***/ }),

/***/ "./src/rng.ts":
/*!********************!*\
  !*** ./src/rng.ts ***!
  \********************/
/*! exports provided: RNG */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RNG", function() { return RNG; });
const FRAC = 2.3283064365386963e-10;
class RNG {
    constructor(seed) {
        if (seed <= 1)
            throw "Illegal seed number";
        this._s0 = (seed >>> 0) * FRAC;
        seed = (seed * 69069 + 1) >>> 0;
        this._s1 = seed * FRAC;
        seed = (seed * 69069 + 1) >>> 0;
        this._s2 = seed * FRAC;
        this._c = 1;
        return this;
    }
    static create() {
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        console.log(`SRG generated seed: ${seed}`);
        return new RNG(seed);
    }
    static seeded(seed) {
        return new RNG(seed);
    }
    float() {
        const t = 2091639 * this._s0 + this._c * FRAC;
        this._s0 = this._s1;
        this._s1 = this._s2;
        this._c = t | 0;
        this._s2 = t - this._c;
        return this._s2;
    }
    int() {
        return this.float() * 0x100000000;
    }
    boolean() {
        return this.float() < 0.5;
    }
    range(lowerBound, upperBound) {
        return Math.floor(this.float() * (upperBound - lowerBound)) + lowerBound;
    }
    normal(mean = 0, stddev = 1) {
        let u, v, r;
        do {
            u = 2 * this.float() - 1;
            v = 2 * this.float() - 1;
            r = u * u + v * v;
        } while (r > 1 || r == 0);
        const gauss = u * Math.sqrt(-2 * Math.log(r) / r);
        return mean + gauss * stddev;
    }
    skewNormal(min, max, skew) {
        let u = 0, v = 0;
        while (u === 0)
            u = this.float();
        while (v === 0)
            v = this.float();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num / 10.0 + 0.5;
        if (num > 1 || num < 0)
            num = this.skewNormal(min, max, skew);
        num = Math.pow(num, skew);
        num *= max - min;
        num += min;
        return num;
    }
    select(array) {
        if (array.length === 0) {
            return null;
        }
        return array[Math.floor(this.float() * array.length)];
    }
}


/***/ }),

/***/ "./src/scene.banner.ts":
/*!*****************************!*\
  !*** ./src/scene.banner.ts ***!
  \*****************************/
/*! exports provided: SceneBanner */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SceneBanner", function() { return SceneBanner; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);

class SceneBanner extends pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"] {
    constructor(controller, options) {
        super();
        this._show = 120;
        this._fadeOut = 60;
        this._controller = controller;
        const size = 64;
        const height = size << 1;
        const screen = this._controller.app.screen;
        const y = Math.floor(screen.height * 0.7);
        this._text = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"](options.text, {
            font: { name: "alagard", size: size },
            align: "center",
            tint: options.color
        });
        this._text.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.5, 0.5);
        this._text.position.set(screen.width >> 1, y);
        const blur = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["filters"].BlurFilter();
        blur.blurY = 1;
        blur.blurX = 10;
        blur.quality = 4;
        this._textShadow = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"](options.text, {
            font: { name: "alagard", size: size },
            align: "center",
            tint: options.color
        });
        this._textShadow.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.5, 0.5);
        this._textShadow.position.set(screen.width >> 1, y);
        this._textShadow.width += size * 0.7;
        this._textShadow.alpha = 0.5;
        this._textShadow.filters = [blur];
        this._textShadow.filterArea = this._textShadow.getBounds().clone().pad(50, 0);
        this._texture = SceneBanner.gradient(1, height);
        this._background = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["TilingSprite"](this._texture, screen.width, height);
        this._background.position.set(0, y - (height >> 1));
        this.addChild(this._background, this._textShadow, this._text);
        this._controller.stage.addChild(this);
        this._controller.app.ticker.add(this.update, this);
    }
    update(deltaTime) {
        if (this._show > 0) {
            this._show -= deltaTime;
        }
        else if (this._fadeOut > 0) {
            this._fadeOut -= deltaTime;
            this.alpha = this._fadeOut / 60;
        }
        else {
            this._controller.closeBanner();
        }
    }
    destroy() {
        super.destroy();
        this._controller.app.ticker.remove(this.update, this);
        this._text.destroy();
        this._background.destroy();
        this._texture.destroy(true);
    }
    static gradient(width, height) {
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        const ctx = c.getContext("2d");
        const grd = ctx.createLinearGradient(0, 0, 0, height);
        grd.addColorStop(0, "rgba(0, 0, 0, 0)");
        grd.addColorStop(0.3, "rgba(0, 0, 0, 1)");
        grd.addColorStop(0.7, "rgba(0, 0, 0, 1)");
        grd.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
        return pixi_js__WEBPACK_IMPORTED_MODULE_0__["Texture"].from(c);
    }
}


/***/ }),

/***/ "./src/scene.ts":
/*!**********************!*\
  !*** ./src/scene.ts ***!
  \**********************/
/*! exports provided: SceneController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SceneController", function() { return SceneController; });
/* harmony import */ var _rng__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./rng */ "./src/rng.ts");
/* harmony import */ var _input__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./input */ "./src/input.ts");
/* harmony import */ var _resources__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./resources */ "./src/resources.ts");
/* harmony import */ var _dead_scene__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./dead.scene */ "./src/dead.scene.ts");
/* harmony import */ var _dungeon__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./dungeon */ "./src/dungeon/index.ts");
/* harmony import */ var _keybind_scene__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./keybind.scene */ "./src/keybind.scene.ts");
/* harmony import */ var _select_hero_scene__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./select.hero.scene */ "./src/select.hero.scene.ts");
/* harmony import */ var _update_hero_scene__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./update.hero.scene */ "./src/update.hero.scene.ts");
/* harmony import */ var _inventory__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./inventory */ "./src/inventory/index.ts");
/* harmony import */ var _persistent_state__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./persistent.state */ "./src/persistent.state.ts");
/* harmony import */ var _dialog__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./dialog */ "./src/dialog/index.ts");
/* harmony import */ var _scene_banner__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./scene.banner */ "./src/scene.banner.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_12__);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};














class SceneController {
    constructor(app, stage) {
        this._mainScene = null;
        this._modalScene = null;
        this._banner = null;
        this.persistent = new _persistent_state__WEBPACK_IMPORTED_MODULE_9__["SessionPersistentState"]();
        this.rng = _rng__WEBPACK_IMPORTED_MODULE_0__["RNG"].create();
        this.joystick = new _input__WEBPACK_IMPORTED_MODULE_1__["Joystick"]();
        this.resources = new _resources__WEBPACK_IMPORTED_MODULE_2__["Resources"](app.loader);
        this.app = app;
        this.stage = stage;
        this.dialogs = new _dialog__WEBPACK_IMPORTED_MODULE_10__["DialogManager"](this);
        this.app.ticker.add(this.persistent.global.commit, this.persistent.global, pixi_js__WEBPACK_IMPORTED_MODULE_12__["UPDATE_PRIORITY"].LOW);
        this.app.ticker.add(this.persistent.session.commit, this.persistent.session, pixi_js__WEBPACK_IMPORTED_MODULE_12__["UPDATE_PRIORITY"].LOW);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.resources.load();
        });
    }
    set scene(scene) {
        var _a;
        (_a = this._mainScene) === null || _a === void 0 ? void 0 : _a.destroy();
        this.joystick.reset();
        this._mainScene = scene;
        this._mainScene.init();
    }
    keyBind() {
        this.scene = new _keybind_scene__WEBPACK_IMPORTED_MODULE_5__["KeyBindScene"](this);
    }
    selectHero() {
        this.scene = new _select_hero_scene__WEBPACK_IMPORTED_MODULE_6__["SelectHeroScene"](this);
    }
    updateHero(hero, level) {
        this.scene = new _update_hero_scene__WEBPACK_IMPORTED_MODULE_7__["UpdateHeroScene"](this, {
            level: level,
            hero: hero
        });
    }
    dead() {
        this.scene = new _dead_scene__WEBPACK_IMPORTED_MODULE_3__["YouDeadScene"](this);
    }
    generateDungeon(options) {
        this.scene = new _dungeon__WEBPACK_IMPORTED_MODULE_4__["GenerateDungeonScene"](this, options);
    }
    dungeon(hero, dungeon) {
        this.scene = new _dungeon__WEBPACK_IMPORTED_MODULE_4__["DungeonScene"](this, hero, dungeon);
    }
    modal(scene) {
        var _a;
        pixi_js__WEBPACK_IMPORTED_MODULE_12__["sound"].play('text');
        (_a = this._mainScene) === null || _a === void 0 ? void 0 : _a.pause();
        this.joystick.reset();
        this._modalScene = scene;
        this._modalScene.init();
    }
    closeModal() {
        var _a, _b;
        (_a = this._modalScene) === null || _a === void 0 ? void 0 : _a.destroy();
        this.joystick.reset();
        (_b = this._mainScene) === null || _b === void 0 ? void 0 : _b.resume();
    }
    showInventory(hero) {
        const actions = new _inventory__WEBPACK_IMPORTED_MODULE_8__["DefaultInventoryActionsController"](hero.inventory);
        this.modal(new _inventory__WEBPACK_IMPORTED_MODULE_8__["InventoryModalScene"](this, actions));
    }
    sellInventory(hero, npc) {
        const actions = new _inventory__WEBPACK_IMPORTED_MODULE_8__["SellingInventoryActionsController"](hero, npc);
        this.modal(new _inventory__WEBPACK_IMPORTED_MODULE_8__["InventoryModalScene"](this, actions));
    }
    buyInventory(hero, npc) {
        const actions = new _inventory__WEBPACK_IMPORTED_MODULE_8__["BuyingInventoryActionsController"](hero, npc);
        this.modal(new _inventory__WEBPACK_IMPORTED_MODULE_8__["InventoryModalScene"](this, actions));
    }
    showDialog(hero, npc) {
        const dialog = this.dialogs.dialog(hero, npc);
        this.modal(new _dialog__WEBPACK_IMPORTED_MODULE_10__["DialogModalScene"](this, dialog));
    }
    showBonfire(hero) {
        this.modal(new _dungeon__WEBPACK_IMPORTED_MODULE_4__["DungeonBonfireModal"](this, hero));
    }
    showBanner(options) {
        this.closeBanner();
        this._banner = new _scene_banner__WEBPACK_IMPORTED_MODULE_11__["SceneBanner"](this, options);
    }
    closeBanner() {
        var _a;
        (_a = this._banner) === null || _a === void 0 ? void 0 : _a.destroy();
        this._banner = null;
    }
}


/***/ }),

/***/ "./src/select.hero.scene.ts":
/*!**********************************!*\
  !*** ./src/select.hero.scene.ts ***!
  \**********************************/
/*! exports provided: SelectHeroScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectHeroScene", function() { return SelectHeroScene; });
/* harmony import */ var _characters__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./characters */ "./src/characters/index.ts");
/* harmony import */ var _drop__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./drop */ "./src/drop/index.ts");
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ui */ "./src/ui.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_3__);




const MARGIN = 40;
const TITLE_H = 32;
const TILE_W = 16;
const TILE_H = 28;
class SelectHeroScene {
    constructor(controller) {
        this._heroes = [];
        this._controller = controller;
        this._selectable = new _ui__WEBPACK_IMPORTED_MODULE_2__["SelectableGrid"](controller.joystick);
    }
    init() {
        this.renderTitle();
        this.renderHeroes();
        this._controller.app.ticker.add(this._selectable.handleInput, this._selectable);
    }
    destroy() {
        this._controller.app.ticker.remove(this._selectable.handleInput, this._selectable);
        this._heroes.forEach(h => h.destroy());
        this._controller.stage.removeChildren();
    }
    pause() {
    }
    resume() {
    }
    renderTitle() {
        const title = new pixi_js__WEBPACK_IMPORTED_MODULE_3__["BitmapText"]("ROGUELIKE DUNGEON", { font: { name: 'alagard', size: 64 } });
        title.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_3__["Point"](0.5, 0);
        title.position.set(this._controller.app.screen.width >> 1, 64);
        this._controller.stage.addChild(title);
    }
    renderHeroes() {
        const screen = this._controller.app.screen;
        const total = _characters__WEBPACK_IMPORTED_MODULE_0__["heroCharacterNames"].length;
        const rectWidth = Math.floor((screen.width - MARGIN * (total + 1)) / total);
        const spriteWidth = rectWidth - (MARGIN << 1);
        const scale = spriteWidth / TILE_W;
        const spriteHeight = Math.floor(TILE_H * scale);
        const rectHeight = spriteHeight + TITLE_H + MARGIN * 3;
        for (let i = 0; i < total; i++) {
            const heroName = _characters__WEBPACK_IMPORTED_MODULE_0__["heroCharacterNames"][i];
            const posX = MARGIN * (i + 1) + rectWidth * i;
            const posY = (screen.height >> 1) - (rectHeight >> 1);
            const view = new SelectHeroView(rectWidth, rectHeight, heroName, this._controller.resources);
            view.position.set(posX, posY);
            this._heroes.push(view);
            this._controller.stage.addChild(view);
            this._selectable.set(i, 0, view, () => this.select(heroName));
        }
        this._selectable.reset();
    }
    select(name) {
        const hero = _characters__WEBPACK_IMPORTED_MODULE_0__["Hero"].load(name, this._controller.persistent);
        const weapon = new _drop__WEBPACK_IMPORTED_MODULE_1__["Weapon"](_drop__WEBPACK_IMPORTED_MODULE_1__["weapons"].knife);
        hero.inventory.equipment.weapon.set(weapon);
        this._controller.generateDungeon({
            level: 1,
            hero: hero
        });
    }
}
class SelectHeroView extends pixi_js__WEBPACK_IMPORTED_MODULE_3__["Container"] {
    constructor(width, height, heroName, resources) {
        super();
        this._isSelected = false;
        this._selectedBg = new pixi_js__WEBPACK_IMPORTED_MODULE_3__["Graphics"]()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiSelected)
            .drawRect(0, 0, width, height)
            .endFill();
        this._notSelectedBg = new pixi_js__WEBPACK_IMPORTED_MODULE_3__["Graphics"]()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiNotSelected)
            .drawRect(0, 0, width, height)
            .endFill();
        this._title = new pixi_js__WEBPACK_IMPORTED_MODULE_3__["BitmapText"](heroName, { font: { name: 'alagard', size: TITLE_H } });
        this._title.anchor = 0.5;
        this._title.position.set(width >> 1, MARGIN);
        const spriteWidth = width - (MARGIN << 1);
        const scale = spriteWidth / TILE_W;
        const spriteHeight = Math.floor(TILE_H * scale);
        this._sprite = resources.animated(heroName + "_idle");
        this._sprite.width = spriteWidth;
        this._sprite.height = spriteHeight;
        this._sprite.position.set(MARGIN, MARGIN + MARGIN + TITLE_H);
        this.addChild(this._selectedBg, this._notSelectedBg, this._title, this._sprite);
        this.selected = false;
    }
    get selected() {
        return this._isSelected;
    }
    set selected(selected) {
        this._isSelected = selected;
        if (selected) {
            this._selectedBg.visible = true;
            this._notSelectedBg.visible = false;
            this._title.visible = true;
            this._sprite.gotoAndPlay(0);
        }
        else {
            this._selectedBg.visible = false;
            this._notSelectedBg.visible = true;
            this._title.visible = false;
            this._sprite.gotoAndStop(0);
        }
    }
    destroy() {
        super.destroy();
        this._selectedBg.destroy();
        this._notSelectedBg.destroy();
        this._title.destroy();
        this._sprite.destroy();
    }
}


/***/ }),

/***/ "./src/template.ts":
/*!*************************!*\
  !*** ./src/template.ts ***!
  \*************************/
/*! exports provided: Template */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Template", function() { return Template; });
class Template {
    constructor() {
        this._context = {};
    }
    add(key, value) {
        this._context[key] = value;
    }
    render(template) {
        return template.replace(/{{([^}]+)}}/g, (_match, token) => {
            const sub = token.split('.');
            if (sub.length >= 1) {
                let value = this._context;
                while (sub.length > 0) {
                    const [next] = sub.splice(0, 1);
                    value = value[next];
                }
                return value || null;
            }
            return token;
        });
    }
}


/***/ }),

/***/ "./src/tunneler/crawler.ts":
/*!*********************************!*\
  !*** ./src/tunneler/crawler.ts ***!
  \*********************************/
/*! exports provided: Crawler */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Crawler", function() { return Crawler; });
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./model */ "./src/tunneler/model.ts");

class Crawler {
    constructor(rng, dungeonCrawler, location, direction, age, maxAge, generation) {
        this.rng = rng;
        this.dungeonCrawler = dungeonCrawler;
        this.config = dungeonCrawler.config;
        this.location = location;
        this.direction = direction;
        this.age = age;
        this.maxAge = maxAge;
        this.generation = generation;
        console.assert(this.valid(location));
        console.assert(this.validDirection(direction));
    }
    rightDirection() {
        if (this.direction.x === 0) {
            return new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](this.direction.y, 0);
        }
        else if (this.direction.y === 0) {
            return new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](0, -this.direction.x);
        }
        else {
            throw "illegal direction";
        }
    }
    valid(point) {
        return point.x >= 0 && point.y >= 0 && point.x < this.config.width && point.y < this.config.height;
    }
    validDirection(direction) {
        return (direction.x === 0 && (direction.y === -1 || direction.y === 1)) || (direction.y === 0 && (direction.x === -1 || direction.x === 1));
    }
    frontFree(position, heading, leftFree, rightFree) {
        console.assert((leftFree >= 1) && (rightFree >= 1));
        console.assert(this.valid(position));
        console.assert(heading.x === 0 && ((heading.y === 1) || (heading.y === -1)) || heading.y === 0 && ((heading.x === 1) || (heading.x === -1)));
        let right;
        if (heading.x === 0) {
            right = new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](heading.y, 0);
        }
        else if (heading.y === 0) {
            right = new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](0, -heading.x);
        }
        else {
            throw "invalid heading";
        }
        const frontFree = this.findFrontFree(leftFree, rightFree, position, right, heading);
        console.assert(frontFree >= 0);
        if (frontFree > 0) {
            leftFree = this.findLeftFree(leftFree, frontFree, position, right, heading);
            rightFree = this.findRightFree(rightFree, frontFree, position, right, heading);
        }
        return [frontFree, leftFree, rightFree];
    }
    findFrontFree(leftFree, rightFree, position, right, heading) {
        let frontFree = 0;
        for (;;) {
            frontFree++;
            for (let i = -leftFree; i <= rightFree; i++) {
                const cell = position.plus(right.multiply(i)).plus(heading.multiply(frontFree));
                if (!this.valid(cell)) {
                    return Math.max(0, frontFree - 1);
                }
                if (this.freePredicate(this.dungeonCrawler.getMap(cell))) {
                    return Math.max(0, frontFree - 1);
                }
            }
        }
    }
    findLeftFree(leftFree, frontFree, position, right, heading) {
        for (;;) {
            leftFree++;
            for (let i = 1; i <= frontFree; i++) {
                const cell = position.minus(right.multiply(leftFree)).plus(heading.multiply(i));
                if (!this.valid(cell)) {
                    return leftFree - 1;
                }
                if (this.freePredicate(this.dungeonCrawler.getMap(cell))) {
                    return leftFree - 1;
                }
            }
        }
    }
    findRightFree(rightFree, frontFree, position, right, heading) {
        for (;;) {
            rightFree++;
            for (let i = 1; i <= frontFree; i++) {
                const cell = position.plus(right.multiply(rightFree)).plus(heading.multiply(i));
                if (!this.valid(cell)) {
                    return rightFree - 1;
                }
                if (this.freePredicate(this.dungeonCrawler.getMap(cell))) {
                    return rightFree - 1;
                }
            }
        }
    }
    freePredicate(type) {
        return (type !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED) && (type !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED);
    }
    contains(value, ...options) {
        for (const option of options) {
            if (value === option) {
                return true;
            }
        }
        return false;
    }
}


/***/ }),

/***/ "./src/tunneler/dungeon.crawler.ts":
/*!*****************************************!*\
  !*** ./src/tunneler/dungeon.crawler.ts ***!
  \*****************************************/
/*! exports provided: DungeonCrawler */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonCrawler", function() { return DungeonCrawler; });
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./model */ "./src/tunneler/model.ts");
/* harmony import */ var _wall_crawler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./wall.crawler */ "./src/tunneler/wall.crawler.ts");
/* harmony import */ var _tunnel_crawler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tunnel.crawler */ "./src/tunneler/tunnel.crawler.ts");
/* harmony import */ var _room_crawler__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./room.crawler */ "./src/tunneler/room.crawler.ts");




class DungeonCrawler {
    constructor(config, rng) {
        this._rooms = [];
        this._mapFlagsDirections = [];
        this._crawlers = [];
        this.activeGeneration = 0;
        this._currSmallRoomsLabyrinth = 0;
        this._currMediumRoomsLabyrinth = 0;
        this._currLargeRoomsLabyrinth = 0;
        this._currSmallRoomsDungeon = 0;
        this._currMediumRoomsDungeon = 0;
        this._currLargeRoomsDungeon = 0;
        this.rng = rng;
        this.config = config;
        console.assert(config.childDelayProbabilityForGenerationCrawlers.length === 11);
        console.assert(config.childDelayProbabilityForGenerationRoomCrawlers.length === 11);
        console.assert(config.roomAspectRatio >= 0 && config.roomAspectRatio <= 1, "roomAspectRatio must be a double between 0 and 1");
        console.assert(config.genSpeedUpOnAnteroom >= 1, "Please use genSpeedUpOnAnteroom >= 1; parameter reset to 1");
        console.assert(!config.crawlersInAnterooms || (config.crawlersInAnterooms && config.crawlersInTunnels), "when you allow Crawlers in Anterooms, you must also allow them in Tunnels");
        this._map = [];
        for (let i = 0; i < this.config.width * this.config.height; i++) {
            this._map[i] = this.config.background;
            this._mapFlagsDirections[i] = false;
        }
        for (let i = 0; i < 4; i++) {
            this._crawlers[i] = null;
        }
        this.setRect(0, 0, this.config.width - 1, 0, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_CLOSED);
        this.setRect(0, 0, 0, this.config.height - 1, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_CLOSED);
        this.setRect(this.config.width - 1, 0, this.config.width - 1, this.config.height - 1, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_CLOSED);
        this.setRect(0, this.config.height - 1, this.config.width - 1, this.config.height - 1, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_CLOSED);
        for (const des of this.config.design) {
            this.setRectFill(des);
        }
        for (const entry of this.config.openings) {
            switch (entry) {
                case _model__WEBPACK_IMPORTED_MODULE_0__["Direction"].NORTH:
                    this.setRect(0, Math.floor(this.config.height / 2) - 1, 2, Math.floor(this.config.height / 2) + 1, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN);
                    break;
                case _model__WEBPACK_IMPORTED_MODULE_0__["Direction"].WEST:
                    this.setRect(Math.floor(this.config.width / 2) - 1, 0, Math.floor(this.config.width / 2) + 1, 2, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN);
                    break;
                case _model__WEBPACK_IMPORTED_MODULE_0__["Direction"].EAST:
                    this.setRect(Math.floor(this.config.width / 2) - 1, this.config.height - 3, Math.floor(this.config.width / 2) + 1, this.config.height - 1, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN);
                    break;
                case _model__WEBPACK_IMPORTED_MODULE_0__["Direction"].SOUTH:
                    this.setRect(this.config.width - 3, Math.floor(this.config.height / 2) - 1, this.config.width - 1, Math.floor(this.config.height / 2) + 1, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN);
                    break;
                case _model__WEBPACK_IMPORTED_MODULE_0__["Direction"].NORTH_WEST:
                    this.setRect(0, 0, 2, 2, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN);
                    break;
                case _model__WEBPACK_IMPORTED_MODULE_0__["Direction"].NORTH_EAST:
                    this.setRect(0, this.config.height - 3, 2, this.config.height - 1, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN);
                    break;
                case _model__WEBPACK_IMPORTED_MODULE_0__["Direction"].SOUTH_WEST:
                    this.setRect(this.config.width - 3, 0, this.config.width - 1, 2, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN);
                    break;
                case _model__WEBPACK_IMPORTED_MODULE_0__["Direction"].SOUTH_EAST:
                    this.setRect(this.config.width - 3, this.config.height - 3, this.config.width - 1, this.config.height - 1, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN);
                    break;
                default:
                    console.assert(false);
                    break;
            }
        }
        const spawnRandomWallCrawler = (location, direction, generation) => {
            this.createWallCrawler(location, direction, 0, this.getMaxAgeCrawlers(generation), generation, direction, this.getStepLength(generation), 1, this.getCorridorWidth(generation), this.mutate2(config.randCrawler.straightSingleSpawnProbability), this.mutate2(config.randCrawler.straightDoubleSpawnProbability), this.mutate2(config.randCrawler.turnSingleSpawnProbability), this.mutate2(config.randCrawler.turnDoubleSpawnProbability), this.mutate2(config.randCrawler.changeDirectionProbability));
        };
        for (let generation = 0; generation < config.randCrawler.perGeneration.length; generation++) {
            const crawlersPer1000Squares = config.randCrawler.perGeneration[generation];
            if (crawlersPer1000Squares > 0) {
                let crawlersPerTopBottomWall = Math.floor((this.config.height * crawlersPer1000Squares) / 1000);
                if (crawlersPerTopBottomWall === 0) {
                    if (this.rng.range(0, 1000) < (this.config.height * crawlersPer1000Squares))
                        crawlersPerTopBottomWall = 1;
                }
                let yIndex = 0;
                for (let ind = 0; ind < crawlersPerTopBottomWall; ind++) {
                    yIndex = 2 + this.rng.range(0, this.config.height - 4);
                    spawnRandomWallCrawler(new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](0, yIndex), _model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH, generation);
                    yIndex = 2 + this.rng.range(0, this.config.height - 4);
                    spawnRandomWallCrawler(new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](this.config.width - 1, yIndex), _model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH, generation);
                }
                let crawlersPerLeftRightWall = Math.floor((this.config.width * crawlersPer1000Squares) / 1000);
                if (crawlersPerLeftRightWall === 0) {
                    if (this.rng.range(0, 1000) < (this.config.width * crawlersPer1000Squares))
                        crawlersPerLeftRightWall = 1;
                }
                let xIndex = 0;
                for (let i = 0; i < crawlersPerLeftRightWall; i++) {
                    xIndex = 2 + this.rng.range(0, this.config.width - 4);
                    spawnRandomWallCrawler(new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](xIndex, 0), _model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST, generation);
                    xIndex = 2 + this.rng.range(0, this.config.width - 4);
                    spawnRandomWallCrawler(new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](xIndex, this.config.height - 1), _model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST, generation);
                }
            }
        }
        for (const cd of config.crawlers) {
            this.createWallCrawler(cd.location, cd.direction, -cd.age, cd.maxAge, cd.generation, cd.intendedDirection, cd.stepLength, cd.opening, cd.corridorWidth, cd.straightSingleSpawnProbability, cd.straightDoubleSpawnProbability, cd.turnSingleSpawnProbability, cd.turnDoubleSpawnProbability, cd.changeDirectionProbability);
        }
        for (const [first, second] of config.crawlerPairs) {
            let firstIsOpen = true;
            if (this.rng.boolean())
                firstIsOpen = false;
            this.createWallCrawler(first.location, first.direction, -first.age, first.maxAge, first.generation, first.intendedDirection, first.stepLength, (firstIsOpen ? 1 : 0), first.corridorWidth, first.straightSingleSpawnProbability, first.straightDoubleSpawnProbability, first.turnSingleSpawnProbability, first.turnDoubleSpawnProbability, first.changeDirectionProbability);
            this.setMap(first.location, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED);
            this.createWallCrawler(second.location, second.direction, -second.age, second.maxAge, second.generation, second.intendedDirection, second.stepLength, (firstIsOpen ? 1 : 0), second.corridorWidth, second.straightSingleSpawnProbability, second.straightDoubleSpawnProbability, second.turnSingleSpawnProbability, second.turnDoubleSpawnProbability, second.changeDirectionProbability);
            this.setMap(second.location, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED);
        }
        for (const td of config.tunnelCrawlers) {
            this.createTunnelCrawler(td.location, td.direction, -td.age, td.maxAge, td.generation, td.intendedDirection, td.stepLength, td.tunnelWidth, td.straightDoubleSpawnProbability, td.turnDoubleSpawnProbability, td.changeDirectionProbability, td.makeRoomsRightProbability, td.makeRoomsLeftProbability, td.joinPreference);
        }
    }
    isOpen(pos) {
        const type = this.getMap(pos);
        return (type === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN) ||
            (type === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_OPEN) ||
            (type === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) ||
            (type === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN) ||
            (type === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN) ||
            (type === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_OPEN);
    }
    static isActive(pos, Active) {
        for (const i of Active) {
            if ((pos.x === i.x) && (pos.y === i.y))
                return true;
        }
        return false;
    }
    setMap(point, data) {
        const x = point.x;
        const y = point.y;
        console.assert(data !== undefined);
        console.assert((x < this.config.width) && (y < this.config.height) && (x >= 0) && (y >= 0));
        this._map[x * this.config.height + y] = data;
    }
    getMap(point) {
        const x = point.x;
        const y = point.y;
        console.assert((x < this.config.width) && (y < this.config.height) && (x >= 0) && (y >= 0));
        return this._map[x * this.config.height + y];
    }
    isMapOpen(point) {
        switch (this.getMap(point)) {
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN:
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN:
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_OPEN:
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_OPEN:
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN:
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN:
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN:
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR:
            case _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR:
                return true;
            default:
                return false;
        }
    }
    isMoreRoomsLabyrinth(size = null) {
        if (size !== null) {
            switch (size) {
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL:
                    return (this.config.numSmallRoomsInLabyrinth > this._currSmallRoomsLabyrinth);
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM:
                    return (this.config.numMediumRoomsInLabyrinth > this._currMediumRoomsLabyrinth);
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE:
                    return (this.config.numLargeRoomsInLabyrinth > this._currLargeRoomsLabyrinth);
            }
        }
        else {
            return (this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL) || this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM) || this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE));
        }
    }
    isMoreRoomsDungeon(size) {
        if (size !== null) {
            switch (size) {
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL:
                    return (this.config.numSmallRoomsInDungeon > this._currSmallRoomsDungeon);
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM:
                    return (this.config.numMediumRoomsInDungeon > this._currMediumRoomsDungeon);
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE:
                    return (this.config.numLargeRoomsInDungeon > this._currLargeRoomsDungeon);
            }
        }
        else {
            return (this.isMoreRoomsDungeon(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL) || this.isMoreRoomsDungeon(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM) || this.isMoreRoomsDungeon(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE));
        }
    }
    builtRoomDungeon(size) {
        if (_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL === size)
            this._currSmallRoomsDungeon++;
        else if (_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM === size)
            this._currMediumRoomsDungeon++;
        else if (_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE === size)
            this._currLargeRoomsDungeon++;
    }
    getStepLength(generation) {
        if (generation >= this.config.stepLengths.length)
            return this.config.stepLengths[this.config.stepLengths.length - 1];
        else
            return this.config.stepLengths[generation];
    }
    getCorridorWidth(generation) {
        if (generation >= this.config.corridorWidths.length)
            return this.config.corridorWidths[this.config.corridorWidths.length - 1];
        else
            return this.config.corridorWidths[generation];
    }
    getMaxAgeCrawlers(generation) {
        if (generation >= this.config.maxAgesCrawlers.length)
            return this.config.maxAgesCrawlers[this.config.maxAgesCrawlers.length - 1];
        else
            return this.config.maxAgesCrawlers[generation];
    }
    addRoom(r) {
        this._rooms.push(r);
    }
    isChecked(pos) {
        console.assert((pos.x < this.config.width) && (pos.y < this.config.height) && (pos.x >= 0) && (pos.y >= 0));
        return this._mapFlagsDirections[pos.x * this.config.height + pos.y];
    }
    static isCheckedList(pos, checked) {
        for (let i = 0; i < checked.length; i++) {
            if ((pos.x === checked[i].x) && (pos.y === checked[i].y))
                return true;
        }
        return false;
    }
    setChecked(pos) {
        console.assert((pos.x < this.config.width) && (pos.y < this.config.height) && (pos.x >= 0) && (pos.y >= 0));
        this._mapFlagsDirections[pos.x * this.config.height + pos.y] = true;
    }
    setRectFill(rect) {
        this.setRect(rect.startX, rect.startY, rect.endX, rect.endY, rect.type);
    }
    setRect(startX, startY, endX, endY, data) {
        if ((endX < startX) || (endY < startY)) {
            console.error(`Refuse to set incorrectly specified rectangle; sX = ${startX} sY=${startY} eX=${endX} endY=${endY}`);
            return;
        }
        else {
            for (let x = startX; x <= endX; x++)
                for (let y = startY; y <= endY; y++)
                    this.setMap({ x: x, y: y }, data);
        }
    }
    createWallCrawler(location, direction, age, maxAge, generation, intendedDirection, stepLength, opening, corridorWidth, straightSingleSpawnProbability, straightDoubleSpawnProbability, turnSingleSpawnProbability, turnDoubleSpawnProbability, changeDirectionProbability) {
        const crawler = new _wall_crawler__WEBPACK_IMPORTED_MODULE_1__["WallCrawler"](this.rng, this, _model__WEBPACK_IMPORTED_MODULE_0__["Point"].from(location), _model__WEBPACK_IMPORTED_MODULE_0__["Point"].from(direction), age, maxAge, generation, _model__WEBPACK_IMPORTED_MODULE_0__["Point"].from(intendedDirection), stepLength, opening, corridorWidth, straightSingleSpawnProbability, straightDoubleSpawnProbability, turnSingleSpawnProbability, turnDoubleSpawnProbability, changeDirectionProbability);
        for (let i = 0; i < this._crawlers.length; i++) {
            if (this._crawlers[i] === null) {
                this._crawlers[i] = crawler;
                return;
            }
        }
        this._crawlers.push(crawler);
    }
    createTunnelCrawler(location, direction, age, maxAge, generation, intendedDirection, stepLength, tunnelWidth, straightDoubleSpawnProbability, turnDoubleSpawnProbability, changeDirectionProbability, makeRoomsRightProbability, makeRoomsLeftProbability, joinPreference) {
        const crawler = new _tunnel_crawler__WEBPACK_IMPORTED_MODULE_2__["TunnelCrawler"](this.rng, this, _model__WEBPACK_IMPORTED_MODULE_0__["Point"].from(location), _model__WEBPACK_IMPORTED_MODULE_0__["Point"].from(direction), age, maxAge, generation, _model__WEBPACK_IMPORTED_MODULE_0__["Point"].from(intendedDirection), stepLength, tunnelWidth, straightDoubleSpawnProbability, turnDoubleSpawnProbability, changeDirectionProbability, makeRoomsRightProbability, makeRoomsLeftProbability, joinPreference);
        for (let i = 0; i < this._crawlers.length; i++) {
            if (this._crawlers[i] === null) {
                this._crawlers[i] = crawler;
                return;
            }
        }
        this._crawlers.push(crawler);
    }
    createRoomCrawler(location, direction, age, maxAge, generation, defaultWidth, size) {
        const crawler = new _room_crawler__WEBPACK_IMPORTED_MODULE_3__["RoomCrawler"](this.rng, this, _model__WEBPACK_IMPORTED_MODULE_0__["Point"].from(location), _model__WEBPACK_IMPORTED_MODULE_0__["Point"].from(direction), age, maxAge, generation, defaultWidth, size);
        for (let i = 0; i < this._crawlers.length; i++) {
            if (this._crawlers[i] === null) {
                this._crawlers[i] = crawler;
                return;
            }
        }
        this._crawlers.push(crawler);
    }
    mutate(input) {
        const output = input - this.config.mutator + this.rng.range(0, 2 * this.config.mutator + 1);
        if (output < 0)
            return 0;
        else
            return output;
    }
    mutate2(input) {
        if (input <= 50) {
            if (input < 0)
                return 0;
            else
                return this.rng.range(0, 2 * input + 1);
        }
        else {
            if (input > 100)
                return 100;
            else
                return 2 * input - 100 + this.rng.range(0, 200 - 2 * input + 1);
        }
    }
    createSeedCrawlersInTunnels() {
        let numberFound = 0;
        let tries = 0;
        new _wall_crawler__WEBPACK_IMPORTED_MODULE_1__["WallCrawler"](this.rng, this, new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](2, 2), _model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH, 0, 1, 0, _model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH, 1, 0, 1, 0, 0, 0, 0, 0);
        while ((numberFound < this.config.seedCrawlersInTunnels) && (tries < this.config.width * this.config.height)) {
            tries++;
            let startX = 1 + this.rng.range(0, this.config.width - 4);
            let startY = 1 + this.rng.range(0, this.config.height - 4);
            let test = new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](startX, startY);
            if (this.rng.range(0, 100) < 50)
                startX = 0;
            else
                startY = 0;
            if (startX === 0) {
                if (this.rng.range(0, 100) < 50)
                    startY = -1;
                else
                    startY = 1;
            }
            else {
                console.assert(startY === 0);
                if (this.rng.range(0, 100) < 50)
                    startX = -1;
                else
                    startX = 1;
            }
            const direction = new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](startX, startY);
            let orthogonal;
            if (direction.x === 0) {
                orthogonal = new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](direction.y, 0);
            }
            else if (direction.y === 0) {
                orthogonal = new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](0, -direction.x);
            }
            else {
                throw "illegal direction";
            }
            let notFound = true;
            while (notFound) {
                test = test.plus(direction);
                if ((test.x < 2) || (test.y < 2) || (test.x > this.config.width - 3) || (test.y > this.config.height - 3)) {
                    break;
                }
                if (this.getMap(test) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN)
                    continue;
                if ((this.getMap(test.plus(direction)) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction)) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) ||
                    (this.getMap(test.plus(orthogonal)) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(orthogonal)) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) ||
                    (this.getMap(test.plus(direction).plus(orthogonal)) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction).plus(orthogonal)) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) ||
                    (this.getMap(test.plus(direction).minus(orthogonal)) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction).minus(orthogonal)) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN))
                    continue;
                this.setMap(test, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED);
                this.createWallCrawler(test, direction, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction, this.config.tunnelCrawlerStats.stepLength, 1, 1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability, this.config.tunnelCrawlerStats.turnSingleSpawnProbability, this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
                this.createWallCrawler(test, orthogonal, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction, this.config.tunnelCrawlerStats.stepLength, 1, 1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability, this.config.tunnelCrawlerStats.turnSingleSpawnProbability, this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
                this.createWallCrawler(test, orthogonal.negative, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction, this.config.tunnelCrawlerStats.stepLength, 1, 1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability, this.config.tunnelCrawlerStats.turnSingleSpawnProbability, this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
                if (this.rng.range(0, 100) < this.config.tunnelCrawlerClosedProbability)
                    this.createWallCrawler(test, direction.negative, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction, this.config.tunnelCrawlerStats.stepLength, 0, 1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability, this.config.tunnelCrawlerStats.turnSingleSpawnProbability, this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
                else
                    this.createWallCrawler(test, direction.negative, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction, this.config.tunnelCrawlerStats.stepLength, 1, 1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability, this.config.tunnelCrawlerStats.turnSingleSpawnProbability, this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
                notFound = false;
                numberFound++;
            }
        }
    }
    makeIteration() {
        for (let i = 0; i < this._crawlers.length; i++) {
            if (null !== this._crawlers[i]) {
                if (!this._crawlers[i].stepAhead()) {
                    this._crawlers[i] = null;
                }
            }
        }
        return false;
    }
    advanceGeneration() {
        let isCrawlerExists = false;
        let highestNegativeAge = 0;
        for (let i = 0; i < this._crawlers.length; i++) {
            if (null !== this._crawlers[i]) {
                isCrawlerExists = true;
                if (this._crawlers[i].generation === this.activeGeneration) {
                    const a = this._crawlers[i].age;
                    if (a >= 0)
                        return true;
                    else if ((highestNegativeAge === 0) || (a > highestNegativeAge))
                        highestNegativeAge = a;
                }
            }
        }
        if (highestNegativeAge === 0) {
            this.activeGeneration++;
            return isCrawlerExists;
        }
        else {
            console.assert(highestNegativeAge < 0);
            for (let i = 0; i < this._crawlers.length; i++) {
                if (null !== this._crawlers[i]) {
                    if (this._crawlers[i].generation === this.activeGeneration)
                        this._crawlers[i].age -= highestNegativeAge;
                }
            }
            return isCrawlerExists;
        }
    }
    createRoom(rect) {
        if ((this.config.width < 10) || (this.config.height < 10))
            return false;
        if ((rect.endX - rect.startX) <= 5)
            return false;
        if ((rect.endY - rect.startY) <= 5)
            return false;
        const startX = rect.startX + 1 + this.rng.range(0, rect.endX - rect.startX - 3);
        const startY = rect.startY + 1 + this.rng.range(0, rect.endY - rect.startY - 3);
        const start = new _model__WEBPACK_IMPORTED_MODULE_0__["Point"](startX, startY);
        if (!this.isOpen(start))
            return false;
        if (this.isChecked(start))
            return false;
        let maxRS = this.config.maxRoomSize;
        if (!this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE))
            maxRS = this.config.largeRoomSize;
        if (!this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE) && !this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM))
            maxRS = this.config.mediumRoomSize;
        if (!this.isMoreRoomsLabyrinth())
            return false;
        let stillFindingMultiples = true;
        const RoomSquaresChecked = [];
        const RoomSquaresActive = [];
        const ActiveFoundThisTurn = [];
        RoomSquaresActive.push(start);
        let numberFound;
        while (stillFindingMultiples) {
            stillFindingMultiples = false;
            for (let actIt = 0; actIt < RoomSquaresActive.length;) {
                const curr = RoomSquaresActive[actIt];
                numberFound = 0;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), ActiveFoundThisTurn))
                    numberFound++;
                if (numberFound > 2) {
                    stillFindingMultiples = true;
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST));
                    if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
                        RoomSquaresChecked.push(curr);
                        this.setChecked(curr);
                    }
                    RoomSquaresActive.splice(actIt, 1);
                    actIt++;
                }
                else if (numberFound === 2) {
                    let found = 0;
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), ActiveFoundThisTurn)) {
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH));
                        found++;
                    }
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), ActiveFoundThisTurn)) {
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH));
                        found++;
                    }
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), ActiveFoundThisTurn)) {
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST));
                        found++;
                    }
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), ActiveFoundThisTurn)) {
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST));
                        found++;
                    }
                    if (found === 1) {
                        actIt++;
                        continue;
                    }
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST));
                    if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
                        RoomSquaresChecked.push(curr);
                        this.setChecked(curr);
                    }
                    RoomSquaresActive.splice(actIt, 1);
                    actIt++;
                }
                else if (numberFound ==
                    1) {
                    actIt++;
                }
                else {
                    console.assert(numberFound === 0);
                    if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
                        RoomSquaresChecked.push(curr);
                        this.setChecked(curr);
                    }
                    RoomSquaresActive.splice(actIt, 1);
                    actIt++;
                }
                if (RoomSquaresChecked.length > maxRS)
                    return false;
            }
            for (const curr of ActiveFoundThisTurn) {
                if ((this.getMap(curr) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN) || (this.getMap(curr) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_OPEN))
                    return false;
                if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked) && !DungeonCrawler.isActive(curr, RoomSquaresActive))
                    RoomSquaresActive.push(curr);
            }
            ActiveFoundThisTurn.splice(0, ActiveFoundThisTurn.length);
        }
        let proceeding = true;
        let squaresFindingMultiples = 0;
        let curr = _model__WEBPACK_IMPORTED_MODULE_0__["Point"].ZERO;
        while (proceeding) {
            squaresFindingMultiples = 0;
            proceeding = false;
            for (let actIt = 0; actIt < RoomSquaresActive.length;) {
                curr = RoomSquaresActive[actIt];
                numberFound = 0;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), ActiveFoundThisTurn))
                    numberFound++;
                if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresChecked) &&
                    !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), ActiveFoundThisTurn))
                    numberFound++;
                if (numberFound > 1) {
                    squaresFindingMultiples++;
                    actIt++;
                }
                else if (numberFound === 1) {
                    proceeding = true;
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_EAST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH_WEST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_EAST));
                    if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresChecked) &&
                        !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST), ActiveFoundThisTurn))
                        ActiveFoundThisTurn.push(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH_WEST));
                    if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
                        RoomSquaresChecked.push(curr);
                        this.setChecked(curr);
                    }
                    RoomSquaresActive.splice(actIt, 1);
                }
                else {
                    console.assert(numberFound === 0);
                    if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
                        RoomSquaresChecked.push(curr);
                        this.setChecked(curr);
                    }
                    RoomSquaresActive.splice(actIt, 1);
                }
            }
            for (curr of ActiveFoundThisTurn) {
                if ((this.getMap(curr) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN) || (this.getMap(curr) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_OPEN))
                    return false;
                if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked) && !DungeonCrawler.isActive(curr, RoomSquaresActive))
                    RoomSquaresActive.push(curr);
            }
            ActiveFoundThisTurn.splice(0, ActiveFoundThisTurn.length);
        }
        if (squaresFindingMultiples > 1)
            return false;
        else if (squaresFindingMultiples === 0) {
            console.assert(RoomSquaresChecked.length > 0);
            console.log("FILLING CLOSED ROOM");
            for (let i = 0; i !== RoomSquaresChecked.length; i++) {
                console.assert((this.getMap(RoomSquaresChecked[i]) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN) || (this.getMap(RoomSquaresChecked[i]) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_OPEN) ||
                    (this.getMap(RoomSquaresChecked[i]) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) || (this.getMap(RoomSquaresChecked[i]) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN));
                this.setMap(RoomSquaresChecked[i], _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED);
            }
        }
        else {
            console.assert(squaresFindingMultiples === 1);
            if (RoomSquaresChecked.length < this.config.minRoomSize)
                return false;
            let diffX = false;
            let diffY = false;
            for (let i = 0; i !== RoomSquaresChecked.length; i++) {
                if (RoomSquaresChecked[i].x !== RoomSquaresChecked[0].x)
                    diffX = true;
                if (RoomSquaresChecked[i].y !== RoomSquaresChecked[0].y)
                    diffY = true;
            }
            if (!diffX || !diffY)
                return false;
            if (this.getMap(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR || this.getMap(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR ||
                this.getMap(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR || this.getMap(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR ||
                this.getMap(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR || this.getMap(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR ||
                this.getMap(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR || this.getMap(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR)
                return false;
            if (RoomSquaresChecked.length < this.config.mediumRoomSize)
                if (!this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL))
                    return false;
                else
                    this._currSmallRoomsLabyrinth++;
            else if (RoomSquaresChecked.length < this.config.largeRoomSize)
                if (!this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM))
                    return false;
                else
                    this._currMediumRoomsLabyrinth++;
            else if (RoomSquaresChecked.length < this.config.maxRoomSize)
                if (!this.isMoreRoomsLabyrinth(_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE))
                    return false;
                else
                    this._currLargeRoomsLabyrinth++;
            else
                return false;
            console.assert(RoomSquaresActive.length === 1);
            curr = RoomSquaresActive[0];
            if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].NORTH))) {
                console.assert(this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].SOUTH)));
                this.setMap(curr, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR);
            }
            else if (this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].WEST))) {
                console.assert(this.isOpen(curr.plus(_model__WEBPACK_IMPORTED_MODULE_0__["Point"].EAST)));
                this.setMap(curr, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR);
            }
            const newRoom = new _model__WEBPACK_IMPORTED_MODULE_0__["Room"]();
            for (let i = 0; i !== RoomSquaresChecked.length; i++) {
                console.assert((this.getMap(RoomSquaresChecked[i]) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN) || (this.getMap(RoomSquaresChecked[i]) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_OPEN) ||
                    (this.getMap(RoomSquaresChecked[i]) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) || (this.getMap(RoomSquaresChecked[i]) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN));
                this.setMap(RoomSquaresChecked[i], _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN);
                newRoom.inside.push(RoomSquaresChecked[i]);
            }
            newRoom.inDungeon = false;
            this._rooms.push(newRoom);
        }
        return true;
    }
    generate() {
        for (;;) {
            if (this.activeGeneration === this.config.tunnelCrawlerGeneration)
                this.createSeedCrawlersInTunnels();
            while (this.makeIteration()) {
            }
            if (!this.advanceGeneration())
                break;
        }
        if ((this.config.tunnelCrawlerGeneration < 0) || (this.activeGeneration < this.config.tunnelCrawlerGeneration)) {
            this.createSeedCrawlersInTunnels();
            for (;;) {
                while (this.makeIteration()) {
                }
                if (!this.advanceGeneration())
                    break;
            }
        }
        let counter = 0;
        let number = 0;
        if (this.config.background === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN) {
            const rect = new _model__WEBPACK_IMPORTED_MODULE_0__["FillRect"](0, 0, this.config.width, this.config.height, this.config.background);
            counter = 0;
            number = this.config.width * this.config.height;
            while (this.isMoreRoomsLabyrinth()) {
                if (this.createRoom(rect)) {
                }
                else
                    counter++;
                if (counter > number)
                    break;
            }
        }
        for (const rect of this.config.design) {
            if (rect.type !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN)
                continue;
            counter = 0;
            number = (rect.endX - rect.startX) * (rect.endY - rect.startY);
            while (this.isMoreRoomsLabyrinth()) {
                if (this.createRoom(rect)) {
                }
                else
                    counter++;
                if (counter > number)
                    break;
            }
        }
    }
}


/***/ }),

/***/ "./src/tunneler/index.ts":
/*!*******************************!*\
  !*** ./src/tunneler/index.ts ***!
  \*******************************/
/*! exports provided: Point, Direction, TunnelerCellType, RoomSize, Room, FillRect, Crawler, RoomCrawler, WallCrawler, TunnelCrawler, DungeonCrawler */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./model */ "./src/tunneler/model.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Point", function() { return _model__WEBPACK_IMPORTED_MODULE_0__["Point"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Direction", function() { return _model__WEBPACK_IMPORTED_MODULE_0__["Direction"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TunnelerCellType", function() { return _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RoomSize", function() { return _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Room", function() { return _model__WEBPACK_IMPORTED_MODULE_0__["Room"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FillRect", function() { return _model__WEBPACK_IMPORTED_MODULE_0__["FillRect"]; });

/* harmony import */ var _crawler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./crawler */ "./src/tunneler/crawler.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Crawler", function() { return _crawler__WEBPACK_IMPORTED_MODULE_1__["Crawler"]; });

/* harmony import */ var _room_crawler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./room.crawler */ "./src/tunneler/room.crawler.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RoomCrawler", function() { return _room_crawler__WEBPACK_IMPORTED_MODULE_2__["RoomCrawler"]; });

/* harmony import */ var _wall_crawler__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./wall.crawler */ "./src/tunneler/wall.crawler.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "WallCrawler", function() { return _wall_crawler__WEBPACK_IMPORTED_MODULE_3__["WallCrawler"]; });

/* harmony import */ var _tunnel_crawler__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./tunnel.crawler */ "./src/tunneler/tunnel.crawler.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TunnelCrawler", function() { return _tunnel_crawler__WEBPACK_IMPORTED_MODULE_4__["TunnelCrawler"]; });

/* harmony import */ var _dungeon_crawler__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./dungeon.crawler */ "./src/tunneler/dungeon.crawler.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DungeonCrawler", function() { return _dungeon_crawler__WEBPACK_IMPORTED_MODULE_5__["DungeonCrawler"]; });









/***/ }),

/***/ "./src/tunneler/model.ts":
/*!*******************************!*\
  !*** ./src/tunneler/model.ts ***!
  \*******************************/
/*! exports provided: Point, Direction, TunnelerCellType, RoomSize, Room, FillRect */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Point", function() { return Point; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Direction", function() { return Direction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TunnelerCellType", function() { return TunnelerCellType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RoomSize", function() { return RoomSize; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Room", function() { return Room; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FillRect", function() { return FillRect; });
class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    plus(that) {
        return new Point(this.x + that.x, this.y + that.y);
    }
    minus(that) {
        return new Point(this.x - that.x, this.y - that.y);
    }
    multiply(value) {
        return new Point(this.x * value, this.y * value);
    }
    get negative() {
        return new Point(-this.x, -this.y);
    }
    equal(x, y) {
        return this.x === x && this.y === y;
    }
    equals(that) {
        return this.x === that.x && this.y === that.y;
    }
    toString() {
        return `{x: ${this.x}, y: ${this.y}}`;
    }
    static from(point) {
        return new Point(point.x, point.y);
    }
}
Point.NORTH = new Point(-1, 0);
Point.SOUTH = new Point(1, 0);
Point.EAST = new Point(0, 1);
Point.WEST = new Point(0, -1);
Point.NORTH_EAST = new Point(-1, 1);
Point.SOUTH_EAST = new Point(1, 1);
Point.SOUTH_WEST = new Point(1, -1);
Point.NORTH_WEST = new Point(-1, -1);
Point.ZERO = new Point(0, 0);
var Direction;
(function (Direction) {
    Direction[Direction["NORTH"] = 0] = "NORTH";
    Direction[Direction["EAST"] = 1] = "EAST";
    Direction[Direction["SOUTH"] = 2] = "SOUTH";
    Direction[Direction["WEST"] = 3] = "WEST";
    Direction[Direction["NORTH_EAST"] = 4] = "NORTH_EAST";
    Direction[Direction["SOUTH_EAST"] = 5] = "SOUTH_EAST";
    Direction[Direction["SOUTH_WEST"] = 6] = "SOUTH_WEST";
    Direction[Direction["NORTH_WEST"] = 7] = "NORTH_WEST";
})(Direction || (Direction = {}));
var TunnelerCellType;
(function (TunnelerCellType) {
    TunnelerCellType[TunnelerCellType["OPEN"] = 0] = "OPEN";
    TunnelerCellType[TunnelerCellType["CLOSED"] = 1] = "CLOSED";
    TunnelerCellType[TunnelerCellType["GUARANTEED_OPEN"] = 2] = "GUARANTEED_OPEN";
    TunnelerCellType[TunnelerCellType["GUARANTEED_CLOSED"] = 3] = "GUARANTEED_CLOSED";
    TunnelerCellType[TunnelerCellType["NON_JOIN_OPEN"] = 4] = "NON_JOIN_OPEN";
    TunnelerCellType[TunnelerCellType["NON_JOIN_CLOSED"] = 5] = "NON_JOIN_CLOSED";
    TunnelerCellType[TunnelerCellType["NON_JOIN_GUARANTEED_OPEN"] = 6] = "NON_JOIN_GUARANTEED_OPEN";
    TunnelerCellType[TunnelerCellType["NON_JOIN_GUARANTEED_CLOSED"] = 7] = "NON_JOIN_GUARANTEED_CLOSED";
    TunnelerCellType[TunnelerCellType["INSIDE_ROOM_OPEN"] = 8] = "INSIDE_ROOM_OPEN";
    TunnelerCellType[TunnelerCellType["INSIDE_TUNNEL_OPEN"] = 9] = "INSIDE_TUNNEL_OPEN";
    TunnelerCellType[TunnelerCellType["INSIDE_ANTEROOM_OPEN"] = 10] = "INSIDE_ANTEROOM_OPEN";
    TunnelerCellType[TunnelerCellType["H_DOOR"] = 11] = "H_DOOR";
    TunnelerCellType[TunnelerCellType["V_DOOR"] = 12] = "V_DOOR";
    TunnelerCellType[TunnelerCellType["COLUMN"] = 13] = "COLUMN";
})(TunnelerCellType || (TunnelerCellType = {}));
var RoomSize;
(function (RoomSize) {
    RoomSize[RoomSize["SMALL"] = 0] = "SMALL";
    RoomSize[RoomSize["MEDIUM"] = 1] = "MEDIUM";
    RoomSize[RoomSize["LARGE"] = 2] = "LARGE";
})(RoomSize || (RoomSize = {}));
class Room {
    constructor(inside = []) {
        this.inside = inside;
        this.inDungeon = false;
    }
    randomSquare() {
        return this.inside[Math.floor(Math.random() * this.inside.length)];
    }
    static compare(first, second) {
        return first.inside.length - second.inside.length;
    }
}
class FillRect {
    constructor(startX, startY, endX, endY, type) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.type = type;
    }
}


/***/ }),

/***/ "./src/tunneler/room.crawler.ts":
/*!**************************************!*\
  !*** ./src/tunneler/room.crawler.ts ***!
  \**************************************/
/*! exports provided: RoomCrawler */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RoomCrawler", function() { return RoomCrawler; });
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./model */ "./src/tunneler/model.ts");
/* harmony import */ var _crawler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./crawler */ "./src/tunneler/crawler.ts");


class RoomCrawler extends _crawler__WEBPACK_IMPORTED_MODULE_1__["Crawler"] {
    constructor(rng, dungeonCrawler, location, direction, age, maxAge, generation, defaultWidth, size) {
        super(rng, dungeonCrawler, location, direction, age, maxAge, generation);
        this._defaultWidth = defaultWidth;
        this._size = size;
    }
    stepAhead() {
        if (!this.dungeonCrawler.isMoreRoomsDungeon(this._size)) {
            return false;
        }
        if (this.generation !== this.dungeonCrawler.activeGeneration) {
            console.assert(this.generation > this.dungeonCrawler.activeGeneration);
            return true;
        }
        this.age++;
        if (this.age >= this.maxAge)
            return false;
        else if (this.age < 0)
            return true;
        const right = this.rightDirection();
        let defaultWidth = this._defaultWidth;
        const minSize = this.getMinRoomSize(this._size);
        const maxSize = this.getMaxRoomSize(this._size);
        let leftFree;
        let rightFree;
        let frontFree;
        do {
            [frontFree, leftFree, rightFree] = this.frontFree(this.location, this.direction, defaultWidth + 1, defaultWidth + 1);
            let length = frontFree - 2;
            let width = leftFree + rightFree - 1;
            if (length < 2) {
                break;
            }
            if (width / length < this.config.roomAspectRatio) {
                length = Math.floor(width / this.config.roomAspectRatio);
                if (width / length < this.config.roomAspectRatio) {
                    console.error("length = " + length + ", width = " + width + ", but width/length should be >= " + this.config.roomAspectRatio);
                }
            }
            if (length / width < this.config.roomAspectRatio) {
                width = Math.floor(length / this.config.roomAspectRatio);
                if (length / width < this.config.roomAspectRatio) {
                    console.error("length = " + length + ", width = " + width + ", but length/width should be >= " + this.config.roomAspectRatio);
                }
            }
            if (width / length < this.config.roomAspectRatio) {
                console.error("The Emperor suggests you make your roomAspectRatio in the design file smaller...");
                return false;
            }
            while (length * width > maxSize) {
                if (length > width)
                    length--;
                else if (width > length)
                    width--;
                else if (this.rng.range(0, 100) < 50)
                    length--;
                else
                    width--;
            }
            console.assert(length * width <= maxSize);
            if (length * width >= minSize) {
                const room = new _model__WEBPACK_IMPORTED_MODULE_0__["Room"]();
                if (leftFree <= rightFree) {
                    if ((2 * leftFree - 1) > width) {
                        this.attachRoom(room, right, length, (width >> 1) - width + 1, width >> 2);
                    }
                    else {
                        this.attachRoom(room, right, length, -leftFree + 1, -leftFree + width);
                    }
                    if (this.direction.x === 0) {
                        this.dungeonCrawler.setMap(this.location.plus(this.direction), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR);
                    }
                    else {
                        console.assert(this.direction.y === 0);
                        this.dungeonCrawler.setMap(this.location.plus(this.direction), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR);
                    }
                }
                else {
                    if ((2 * rightFree - 1) > width) {
                        this.attachRoom(room, right, length, -(width >> 1), -(width >> 1) + width - 1);
                    }
                    else {
                        this.attachRoom(room, right, length, rightFree - width, rightFree - 1);
                    }
                    if (this.direction.x === 0) {
                        this.dungeonCrawler.setMap(this.location.plus(this.direction), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR);
                    }
                    else {
                        console.assert(this.direction.y === 0);
                        this.dungeonCrawler.setMap(this.location.plus(this.direction), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR);
                    }
                }
                this.dungeonCrawler.builtRoomDungeon(this._size);
                room.inDungeon = true;
                this.dungeonCrawler.addRoom(room);
                return false;
            }
            else {
                defaultWidth++;
            }
        } while ((frontFree - 2) >= ((2 * defaultWidth + 1) * this.config.roomAspectRatio));
        return false;
    }
    attachRoom(room, right, length, from, to) {
        for (let direction = 1; direction <= length; direction++) {
            for (let sideDistance = from; sideDistance <= to; sideDistance++) {
                const point = this.location.plus(this.direction.multiply(direction + 1)).plus(right.multiply(sideDistance));
                this.dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN);
                room.inside.push(point);
            }
        }
    }
    getMinRoomSize(size) {
        switch (size) {
            case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL:
                return this.config.minRoomSize;
            case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM:
                return this.config.mediumRoomSize;
            case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE:
                return this.config.largeRoomSize;
        }
    }
    getMaxRoomSize(size) {
        switch (size) {
            case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL:
                return (this.config.mediumRoomSize - 1);
            case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM:
                return (this.config.largeRoomSize - 1);
            case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE:
                return (this.config.maxRoomSize - 1);
        }
    }
}


/***/ }),

/***/ "./src/tunneler/tunnel.crawler.ts":
/*!****************************************!*\
  !*** ./src/tunneler/tunnel.crawler.ts ***!
  \****************************************/
/*! exports provided: TunnelCrawler */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TunnelCrawler", function() { return TunnelCrawler; });
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./model */ "./src/tunneler/model.ts");
/* harmony import */ var _crawler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./crawler */ "./src/tunneler/crawler.ts");


class TunnelCrawler extends _crawler__WEBPACK_IMPORTED_MODULE_1__["Crawler"] {
    constructor(rng, dungeonCrawler, location, direction, age, maxAge, generation, intendedDirection, stepLength, tunnelWidth, straightDoubleSpawnProbability, turnDoubleSpawnProbability, changeDirectionProbability, makeRoomsRightProbability, makeRoomsLeftProbability, joinPreference) {
        super(rng, dungeonCrawler, location, direction, age, maxAge, generation);
        this._intendedDirection = intendedDirection;
        this._stepLength = stepLength;
        this._tunnelWidth = tunnelWidth;
        this._straightDoubleSpawnProbability = straightDoubleSpawnProbability;
        this._turnDoubleSpawnProbability = turnDoubleSpawnProbability;
        this._changeDirectionProbability = changeDirectionProbability;
        this._makeRoomsRightProbability = makeRoomsRightProbability;
        this._makeRoomsLeftProbability = makeRoomsLeftProbability;
        this._joinPreference = joinPreference;
    }
    stepAhead() {
        const dungeonCrawler = this.dungeonCrawler;
        if (this.generation !== dungeonCrawler.activeGeneration) {
            console.assert(this.generation > dungeonCrawler.activeGeneration);
            return true;
        }
        this.age++;
        if (this.age >= this.maxAge)
            return false;
        else if (this.age < 0)
            return true;
        console.assert(this._tunnelWidth >= 0);
        const [frontFree, leftFree, rightFree] = this.frontFree(this.location, this.direction, this._tunnelWidth + 1, this._tunnelWidth + 1);
        if (frontFree === 0) {
            return false;
        }
        const [sizeSideways, sizeBranching] = this.sidewaysBranchingRoomSizes();
        const right = this.rightDirection();
        const left = right.negative;
        const roomGeneration = this.roomGeneration();
        if ((frontFree < (2 * this._stepLength)) || ((this.maxAge - 1) === this.age)) {
            return this.joinOrBuildTerminatingRoom(sizeBranching, frontFree, leftFree, rightFree, right, left);
        }
        console.assert(frontFree >= 2 * this._stepLength);
        console.assert(this._stepLength > 0);
        this.buildTunnel(this._stepLength, this._tunnelWidth);
        if (this.rng.range(0, 100) < this._makeRoomsRightProbability) {
            const spawnPoint = this.location.plus(this.direction.multiply((this._stepLength >> 1 + 1))).plus(right.multiply(this._tunnelWidth));
            this.spawnRoomCrawler(spawnPoint, right, -1, 2, roomGeneration, sizeSideways, false);
        }
        if (this.rng.range(0, 100) < this._makeRoomsLeftProbability) {
            const spawnPoint = this.location.plus(this.direction.multiply((this._stepLength >> 1 + 1))).plus(left.multiply(this._tunnelWidth));
            this.spawnRoomCrawler(spawnPoint, left, -1, 2, roomGeneration, sizeSideways, false);
        }
        this.location = this.location.plus(this.direction.multiply(this._stepLength));
        const smallAnteroomPossible = this.isAnteroomPossible(right, this._tunnelWidth + 2, this._tunnelWidth + 2, 2 * this._tunnelWidth + 5);
        const largeAnteroomPossible = this.isAnteroomPossible(right, this._tunnelWidth + 3, this._tunnelWidth + 3, 2 * this._tunnelWidth + 7);
        let sizeUpTunnel = false;
        let sizeDownTunnel = false;
        const diceRoll = this.rng.range(0, 100);
        const sizeUpProbability = this.getSizeUpProbability(this.generation);
        const sizeDownProbability = sizeUpProbability + this.getSizeDownProbability(this.generation);
        if (diceRoll < sizeUpProbability) {
            sizeUpTunnel = true;
        }
        else if (diceRoll < sizeDownProbability) {
            sizeDownTunnel = true;
        }
        if (sizeUpTunnel && !largeAnteroomPossible) {
            return true;
        }
        const changeDirection = this.isChangeDirection();
        const doSpawn = this.isSpawn(changeDirection);
        if (!changeDirection && !doSpawn) {
            return true;
        }
        const doSpawnRoom = this.isSpawnRoom(doSpawn);
        const diceRollSpawn = this.rng.range(0, 100);
        let childGeneration = this.generation + 1;
        if (doSpawn) {
            if (!sizeUpTunnel) {
                let summedProbability = 0;
                for (let i = 0; i <= 10; i++) {
                    summedProbability = summedProbability + this.getChildDelayProbabilityForGenerationTunnelCrawlers(i);
                    if (diceRollSpawn < summedProbability) {
                        childGeneration = this.generation + i;
                        break;
                    }
                }
            }
            else {
                childGeneration = this.generation + this.config.sizeUpGenDelay;
            }
        }
        const options = this.mutateOptions();
        const spawnPoints = this.determineSpawnPoints(sizeUpTunnel, doSpawn, smallAnteroomPossible, right, left);
        if (spawnPoints === true) {
            return true;
        }
        const [spawnPointDirection, spawnPointRight, spawnPointLeft, builtAnteroom] = spawnPoints;
        let usedRight = false;
        let usedLeft = false;
        const oldDirection = this.direction;
        let goStraight = false;
        if (changeDirection) {
            const [frontFreeRight] = this.frontFree(spawnPointRight, right, this._tunnelWidth + 1, this._tunnelWidth + 1);
            const [frontFreeLeft] = this.frontFree(spawnPointLeft, left, this._tunnelWidth + 1, this._tunnelWidth + 1);
            if (this._intendedDirection.equal(0, 0) || this._intendedDirection.equals(this.direction)) {
                if ((!sizeUpTunnel) || (!doSpawn)) {
                    if ((frontFreeRight > frontFreeLeft) || ((frontFreeRight === frontFreeLeft) && this.rng.boolean())) {
                        if (frontFreeRight > 0) {
                            this.location = spawnPointRight;
                            this.direction = right;
                            usedRight = true;
                        }
                    }
                    else if (frontFreeLeft > 0) {
                        this.location = spawnPointLeft;
                        this.direction = left;
                        usedLeft = true;
                    }
                }
                else {
                    console.assert(doSpawn);
                    if ((frontFreeRight < frontFreeLeft) || ((frontFreeRight === frontFreeLeft) && this.rng.boolean())) {
                        if (frontFreeRight > 0) {
                            this.location = spawnPointRight;
                            this.direction = right;
                            usedRight = true;
                        }
                    }
                    else if (frontFreeLeft > 0) {
                        this.location = spawnPointLeft;
                        this.direction = left;
                        usedLeft = true;
                    }
                }
            }
            else {
                if ((this._intendedDirection.x === 0) || (this._intendedDirection.y === 0)) {
                    this.direction = this._intendedDirection;
                    if ((this.direction.equals(right))) {
                        if (frontFreeRight > 0) {
                            usedRight = true;
                            this.location = spawnPointRight;
                        }
                    }
                    else if (frontFreeLeft > 0) {
                        console.assert(this.direction.equals(left));
                        this.location = spawnPointLeft;
                        usedLeft = true;
                    }
                }
                else {
                    console.assert(!this._intendedDirection.equal(0, 0));
                    this.direction = this._intendedDirection.minus(this.direction);
                    if (this.direction.equals(right)) {
                        if (frontFreeRight > 0) {
                            usedRight = true;
                            this.location = spawnPointRight;
                        }
                    }
                    else if (frontFreeLeft > 0) {
                        console.assert(this.direction.equals(left));
                        this.location = spawnPointLeft;
                        usedLeft = true;
                    }
                }
            }
            if (doSpawn) {
                let spawnPoint = _model__WEBPACK_IMPORTED_MODULE_0__["Point"].ZERO;
                let spawnDirection = _model__WEBPACK_IMPORTED_MODULE_0__["Point"].ZERO;
                if (usedLeft) {
                    spawnPoint = spawnPointRight;
                    spawnDirection = right;
                }
                else if (usedRight) {
                    spawnPoint = spawnPointLeft;
                    spawnDirection = left;
                }
                else {
                    goStraight = true;
                }
                if (!goStraight) {
                    const diceRoll = this.rng.range(0, 100);
                    if (doSpawnRoom && (diceRoll < 50)) {
                        this.spawnRoomCrawler(spawnPoint, spawnDirection, 0, 2, roomGeneration, sizeBranching, builtAnteroom);
                    }
                    else {
                        this.spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, spawnPoint, spawnDirection, childGeneration, spawnDirection, options);
                    }
                    if (doSpawnRoom && (diceRoll >= 50)) {
                        this.spawnRoomCrawler(spawnPointDirection, oldDirection, 0, 2, roomGeneration, sizeBranching, builtAnteroom);
                    }
                    else {
                        this.spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, spawnPointDirection, oldDirection, childGeneration, oldDirection, options);
                    }
                }
            }
        }
        else {
            goStraight = true;
        }
        if (goStraight) {
            this.location = spawnPointDirection;
            const diceRoll = this.rng.range(0, 100);
            if (doSpawnRoom && (diceRoll < 50)) {
                this.spawnRoomCrawler(spawnPointRight, right, 0, 2, roomGeneration, sizeBranching, builtAnteroom);
            }
            else {
                this.spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, spawnPointRight, right, childGeneration, right, options);
            }
            if (doSpawnRoom && (diceRoll >= 50)) {
                this.spawnRoomCrawler(spawnPointRight, left, 0, 2, roomGeneration, sizeBranching, builtAnteroom);
            }
            else {
                this.spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, spawnPointLeft, left, childGeneration, left, options);
            }
        }
        return true;
    }
    isAnteroomPossible(right, leftFree, rightFree, minFrontFree) {
        const dungeonCrawler = this.dungeonCrawler;
        let anteroomPossible = false;
        console.assert(this._tunnelWidth >= 0);
        console.assert(dungeonCrawler.getMap(this.location) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
        dungeonCrawler.setMap(this.location, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED);
        for (let m = 1; m <= this._tunnelWidth; m++) {
            console.assert(dungeonCrawler.getMap(this.location.plus(right.multiply(m))) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
            console.assert(dungeonCrawler.getMap(this.location.minus(right.multiply(m))) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
            dungeonCrawler.setMap(this.location.plus(right.multiply(m)), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED);
            dungeonCrawler.setMap(this.location.minus(right.multiply(m)), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED);
        }
        const [frontFree] = this.frontFree(this.location.minus(this.direction), this.direction, leftFree, rightFree);
        if (frontFree >= minFrontFree) {
            anteroomPossible = true;
        }
        dungeonCrawler.setMap(this.location, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
        for (let m = 1; m <= this._tunnelWidth; m++) {
            dungeonCrawler.setMap(this.location.plus(right.multiply(m)), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
            dungeonCrawler.setMap(this.location.minus(right.multiply(m)), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
        }
        return anteroomPossible;
    }
    determineSpawnPoints(sizeUpTunnel, doSpawn, smallAnteroomPossible, right, left) {
        const dungeonCrawler = this.dungeonCrawler;
        if (sizeUpTunnel) {
            if (this.rng.range(0, 100) < this.getAnteroomProbability(this._tunnelWidth) || doSpawn) {
                const result = this.buildAnteroom(2 * this._tunnelWidth + 5, this._tunnelWidth + 2);
                console.assert(result);
                const spawnDirection = this.location.plus(this.direction.multiply(2 * this._tunnelWidth + 5));
                const spawnRight = this.location.plus(this.direction.multiply(this._tunnelWidth + 3)).plus(right.multiply(this._tunnelWidth + 2));
                const spawnLeft = this.location.plus(this.direction.multiply(this._tunnelWidth + 3)).plus(left.multiply(this._tunnelWidth + 2));
                return [spawnDirection, spawnRight, spawnLeft, true];
            }
        }
        else {
            if (this.rng.range(0, 100) < this.getAnteroomProbability(this._tunnelWidth) && smallAnteroomPossible) {
                const result = this.buildAnteroom(2 * this._tunnelWidth + 3, this._tunnelWidth + 1);
                console.assert(result);
                const spawnDirection = this.location.plus(this.direction.multiply(2 * this._tunnelWidth + 3));
                const spawnRight = this.location.plus(this.direction.multiply(this._tunnelWidth + 2)).plus(right.multiply(this._tunnelWidth + 1));
                const spawnLeft = this.location.plus(this.direction.multiply(this._tunnelWidth + 2)).plus(left.multiply(this._tunnelWidth + 1));
                return [spawnDirection, spawnRight, spawnLeft, true];
            }
        }
        const spawnDirection = this.location;
        const spawnRight = this.location.minus(this.direction.multiply(this._tunnelWidth)).plus(right.multiply(this._tunnelWidth));
        const spawnLeft = this.location.minus(this.direction.multiply(this._tunnelWidth)).plus(left.multiply(this._tunnelWidth));
        if (this.dungeonCrawler.getMap(spawnRight) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN ||
            dungeonCrawler.getMap(spawnLeft) !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) {
            return true;
        }
        else {
            return [spawnDirection, spawnRight, spawnLeft, false];
        }
    }
    joinOrBuildTerminatingRoom(sizeBranching, frontFree, leftFree, rightFree, right, left) {
        const dungeonCrawler = this.dungeonCrawler;
        let guaranteedClosedAhead = false;
        let openAhead = false;
        let roomAhead = false;
        let count = 0;
        for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
            const test = this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(i));
            const cell = dungeonCrawler.getMap(test);
            if (this.contains(cell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN)) {
                openAhead = true;
                count++;
            }
            else if (this.contains(cell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_CLOSED)) {
                guaranteedClosedAhead = true;
                count = 0;
            }
            else if (cell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN) {
                roomAhead = true;
                count = 0;
            }
            else
                count = 0;
        }
        if ((this.rng.range(0, 100) <= this._joinPreference) &&
            ((this.age < this.maxAge - 1) || (frontFree <= this.config.tunnelJoinDist)) || frontFree < 5) {
            const result = this.joinOtherTunnel(count, frontFree, leftFree, rightFree, openAhead, roomAhead, guaranteedClosedAhead, right);
            if (result != null) {
                return result;
            }
        }
        if (dungeonCrawler.isMoreRoomsDungeon(sizeBranching)) {
            this.spawnRoomCrawler(this.location, this.direction, 0, 2, this.generation, sizeBranching, false);
        }
        const joinPreference = this.rng.range(0, 11) * 10;
        if ((this._joinPreference !== 100) || (this._makeRoomsLeftProbability !== this.config.lastChanceTunnelCrawler.makeRoomsLeftProbability) ||
            (this._makeRoomsRightProbability !== this.config.lastChanceTunnelCrawler.makeRoomsRightProbability) ||
            (this._changeDirectionProbability !== this.config.lastChanceTunnelCrawler.changeDirectionProbability) ||
            (this._straightDoubleSpawnProbability !== this.config.lastChanceTunnelCrawler.straightDoubleSpawnProbability) ||
            (this._turnDoubleSpawnProbability !== this.config.lastChanceTunnelCrawler.turnDoubleSpawnProbability) ||
            (this._tunnelWidth !== 0)) {
            const [frontFreeRight] = this.frontFree(this.location.plus(right.multiply(this._tunnelWidth)), right, this._tunnelWidth + 1, this._tunnelWidth + 1);
            const [frontFreeLeft] = this.frontFree(this.location.minus(right.multiply(this._tunnelWidth)), left, this._tunnelWidth + 1, this._tunnelWidth + 1);
            const [frontFreeBack] = this.frontFree(this.location, this.direction.negative, this._tunnelWidth + 1, this._tunnelWidth + 1);
            const fork = (location, direction, generation, intendedDirection) => {
                this.dungeonCrawler.createTunnelCrawler(location, direction, 0, this.maxAge, generation, intendedDirection, 3, 0, this.config.lastChanceTunnelCrawler.straightDoubleSpawnProbability, this.config.lastChanceTunnelCrawler.turnDoubleSpawnProbability, this.config.lastChanceTunnelCrawler.changeDirectionProbability, this.config.lastChanceTunnelCrawler.makeRoomsRightProbability, this.config.lastChanceTunnelCrawler.makeRoomsLeftProbability, joinPreference);
            };
            if (this._tunnelWidth === 0) {
                if ((this._makeRoomsLeftProbability === this.config.lastChanceTunnelCrawler.makeRoomsLeftProbability) &&
                    (this._makeRoomsRightProbability === this.config.lastChanceTunnelCrawler.makeRoomsRightProbability) &&
                    (this._changeDirectionProbability === this.config.lastChanceTunnelCrawler.changeDirectionProbability) &&
                    (this._straightDoubleSpawnProbability === this.config.lastChanceTunnelCrawler.straightDoubleSpawnProbability) &&
                    (this._turnDoubleSpawnProbability === this.config.lastChanceTunnelCrawler.turnDoubleSpawnProbability)) {
                    if (frontFree >= frontFreeRight && frontFree >= frontFreeLeft && frontFree >= frontFreeBack) {
                        fork(this.location, this.direction, this.generation + 1, this.direction);
                    }
                    else if (frontFreeBack >= frontFreeRight && frontFreeBack >= frontFreeLeft) {
                        fork(this.location, this.direction.negative, this.generation + this.config.genDelayLastChance, this.direction.negative);
                    }
                    else if (frontFreeRight >= frontFreeLeft || (frontFreeRight === frontFreeLeft) && (this.rng.range(0, 100) < 50)) {
                        fork(this.location, right, this.generation + this.config.genDelayLastChance, right);
                    }
                    else {
                        fork(this.location, left, this.generation + this.config.genDelayLastChance, left);
                    }
                }
                else {
                    fork(this.location, this.direction, this.generation + this.config.genDelayLastChance, this.direction);
                }
            }
            else {
                if (guaranteedClosedAhead) {
                    fork(this.location.plus(right.multiply(this._tunnelWidth)), right, this.generation + this.config.genDelayLastChance, right);
                    fork(this.location.minus(right.multiply(this._tunnelWidth)), left, this.generation + this.config.genDelayLastChance, left);
                }
                else if (frontFreeRight >= frontFreeLeft || frontFreeRight === frontFreeLeft && this.rng.range(0, 100) < 50) {
                    fork(this.location.plus(right.multiply(this._tunnelWidth)), right, this.generation + this.config.genDelayLastChance, right);
                    fork(this.location.minus(right.multiply(this._tunnelWidth)), this.direction, this.generation + this.config.genDelayLastChance, this.direction);
                }
                else {
                    fork(this.location.plus(right.multiply(this._tunnelWidth)), this.direction, this.generation + this.config.genDelayLastChance, this.direction);
                    fork(this.location.minus(right.multiply(this._tunnelWidth)), this.direction, this.generation + this.config.genDelayLastChance, this.direction);
                }
            }
        }
        return false;
    }
    joinOtherTunnel(count, frontFree, leftFree, rightFree, openAhead, roomAhead, guaranteedClosedAhead, right) {
        const dungeonCrawler = this.dungeonCrawler;
        if ((2 * this._tunnelWidth + 1) === count) {
            this.buildTunnel(frontFree, this._tunnelWidth);
            return false;
        }
        if (openAhead) {
            return this.buildSmallerTunnel(frontFree, dungeonCrawler, right);
        }
        if (roomAhead && (this._tunnelWidth === 0)) {
            if (frontFree > 1) {
                const test = this.location.plus(this.direction.multiply(frontFree + 1));
                const cell = dungeonCrawler.getMap(test);
                console.assert(cell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN);
                this.buildTunnel(frontFree - 1, 0);
                if (this.direction.x === 0)
                    dungeonCrawler.setMap(this.location.plus(this.direction.multiply(frontFree)), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].V_DOOR);
                else {
                    console.assert(this.direction.y === 0);
                    dungeonCrawler.setMap(this.location.plus(this.direction.multiply(frontFree)), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].H_DOOR);
                }
                return false;
            }
        }
        if (guaranteedClosedAhead) {
            if (this._tunnelWidth === 0) {
                if (this._joinPreference !== 100 ||
                    this._makeRoomsLeftProbability !== 20 ||
                    this._makeRoomsRightProbability !== 20 ||
                    this._changeDirectionProbability !== 30 ||
                    this._straightDoubleSpawnProbability !== 0 ||
                    this._turnDoubleSpawnProbability !== 0 ||
                    this._tunnelWidth !== 0) {
                    const joinPreference = this.rng.range(0, 11) * 10;
                    const direction = leftFree >= rightFree ? right.negative : right;
                    dungeonCrawler.createTunnelCrawler(this.location, direction, 0, this.maxAge, this.generation + 1, direction, 3, 0, 0, 0, 30, 20, 20, joinPreference);
                }
                return false;
            }
        }
        if (!openAhead && !guaranteedClosedAhead) {
            if (this.isSpecialCase(frontFree, right)) {
                const isJoined = this.buildTunnel(frontFree, this._tunnelWidth);
                console.assert(isJoined);
                for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
                    dungeonCrawler.setMap(this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(i)), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
                }
                let directionLength = frontFree + 2;
                let contactInNextRow = true;
                let rowAfterIsOK = true;
                while (contactInNextRow && rowAfterIsOK) {
                    for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
                        const test = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(i));
                        const cell = dungeonCrawler.getMap(test);
                        if (cell !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED) {
                            contactInNextRow = false;
                            break;
                        }
                    }
                    let testRight = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(this._tunnelWidth + 1));
                    let testLeft = this.location.plus(this.direction.multiply(directionLength)).minus(right.multiply(this._tunnelWidth + 1));
                    let rightCell = dungeonCrawler.getMap(testRight);
                    let leftCell = dungeonCrawler.getMap(testLeft);
                    if (!this.contains(rightCell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN) &&
                        !this.contains(leftCell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN)) {
                        contactInNextRow = false;
                        break;
                    }
                    if ((rightCell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN) || (leftCell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN)) {
                        contactInNextRow = false;
                        break;
                    }
                    for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
                        const test = this.location.plus(this.direction.multiply(directionLength + 1)).plus(right.multiply(i));
                        const cell = dungeonCrawler.getMap(test);
                        if (cell !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED) {
                            rowAfterIsOK = false;
                        }
                    }
                    testRight = this.location.plus(this.direction.multiply(directionLength + 1)).plus(right.multiply(this._tunnelWidth + 1));
                    testLeft = this.location.plus(this.direction.multiply(directionLength + 1)).minus(right.multiply(this._tunnelWidth + 1));
                    rightCell = dungeonCrawler.getMap(testRight);
                    leftCell = dungeonCrawler.getMap(testLeft);
                    if (!this.contains(rightCell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED) &&
                        !this.contains(leftCell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED)) {
                        rowAfterIsOK = false;
                    }
                    if ((rightCell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN) || (leftCell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN))
                        rowAfterIsOK = false;
                    let allOpen = true;
                    for (let i = -this._tunnelWidth - 1; i <= this._tunnelWidth + 1; i++) {
                        const test = this.location.plus(this.direction.multiply(directionLength + 1)).plus(right.multiply(i));
                        const cell = dungeonCrawler.getMap(test);
                        if ((cell !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN) && (cell !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN)) {
                            allOpen = false;
                        }
                    }
                    if (allOpen) {
                        rowAfterIsOK = true;
                    }
                    if (contactInNextRow && rowAfterIsOK) {
                        for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
                            dungeonCrawler.setMap(this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(i)), _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
                        }
                    }
                    directionLength++;
                }
                return false;
            }
            if (this._tunnelWidth === 0) {
                if (dungeonCrawler.getMap(this.location.plus(this.direction.multiply(frontFree + 1))) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED) {
                    if (dungeonCrawler.getMap(this.location.plus(this.direction.multiply(frontFree + 1)).plus(right)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN) {
                        this.direction = right.negative;
                        if (this.direction.equals(this._intendedDirection.negative)) {
                            this.direction = this._intendedDirection;
                        }
                        return true;
                    }
                    else if (dungeonCrawler.getMap(this.location.plus(this.direction.multiply(frontFree + 1)).minus(right)) === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN) {
                        this.direction = right;
                        if (this.direction.equals(this._intendedDirection.negative)) {
                            this.direction = this._intendedDirection;
                        }
                        return true;
                    }
                }
            }
        }
        return null;
    }
    isSpecialCase(frontFree, right) {
        const dungeonCrawler = this.dungeonCrawler;
        let isSpecialCase = true;
        for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
            const test = this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(i));
            const cell = dungeonCrawler.getMap(test);
            if (cell !== _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED) {
                isSpecialCase = false;
                break;
            }
        }
        const testRight = this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(this._tunnelWidth + 1));
        const testLeft = this.location.plus(this.direction.multiply(frontFree + 1)).minus(right.multiply(this._tunnelWidth + 1));
        const rightCell = dungeonCrawler.getMap(testRight);
        const leftCell = dungeonCrawler.getMap(testLeft);
        if (!this.contains(rightCell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN) &&
            !this.contains(leftCell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN)) {
            isSpecialCase = false;
        }
        if ((rightCell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN) || (leftCell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN)) {
            isSpecialCase = false;
        }
        for (let i = -this._tunnelWidth - 1; i <= this._tunnelWidth + 1; i++) {
            const test = this.location.plus(this.direction.multiply(frontFree + 2)).plus(right.multiply(i));
            const cell = dungeonCrawler.getMap(test);
            if (cell === _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ROOM_OPEN) {
                isSpecialCase = false;
                break;
            }
        }
        return isSpecialCase;
    }
    spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, location, direction, generation, intendedDirection, options) {
        let tunnelWidth = this._tunnelWidth;
        let stepLength = this._stepLength;
        if (sizeUpTunnel) {
            tunnelWidth++;
            stepLength = stepLength + 2;
        }
        else if (sizeDownTunnel) {
            tunnelWidth--;
            if (tunnelWidth < 0) {
                tunnelWidth = 0;
            }
            stepLength = stepLength - 2;
            if (stepLength < 3) {
                stepLength = 3;
            }
        }
        this.dungeonCrawler.createTunnelCrawler(location, direction, 0, this.getMaxAgeTunnelCrawlers(generation), generation, intendedDirection, stepLength, tunnelWidth, options.straightDoubleSpawnProbability, options.turnDoubleSpawnProbability, options.changeDirectionProbability, options.makeRoomsRightProbability, options.makeRoomsLeftProbability, options.joinPreference);
    }
    spawnRoomCrawler(location, direction, age, maxAge, generation, size, builtAnteroom) {
        const defaultWidth = Math.max(1, 2 * this._tunnelWidth);
        if (builtAnteroom) {
            generation = this.generation + Math.floor((generation - this.generation) / (this.config.genSpeedUpOnAnteroom));
        }
        this.dungeonCrawler.createRoomCrawler(location, direction, age, maxAge, generation, defaultWidth, size);
    }
    buildSmallerTunnel(frontFree, dungeonCrawler, right) {
        const test = this.location.plus(this.direction.multiply(frontFree + 1));
        const cell = dungeonCrawler.getMap(test);
        if (this.contains(cell, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN)) {
            if (!this.buildTunnel(frontFree, 0)) {
                console.error("openAhead, failed to join, frontFree = " + frontFree);
            }
            return false;
        }
        let offset = 0;
        for (let i = 1; i <= this._tunnelWidth; i++) {
            const testP = this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(i));
            const cellP = dungeonCrawler.getMap(testP);
            if (this.contains(cellP, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN)) {
                offset = i;
                break;
            }
            const testM = this.location.plus(this.direction.multiply(frontFree + 1)).minus(right.multiply(i));
            const cellM = dungeonCrawler.getMap(testM);
            if (this.contains(cellM, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN)) {
                offset = -i;
                break;
            }
        }
        console.assert(offset !== 0);
        for (let i = 1; i <= frontFree; i++) {
            const point = this.location.plus(this.direction.multiply(i)).plus(right.multiply(offset));
            dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
        }
        return false;
    }
    roomGeneration() {
        const diceRoll = this.rng.range(0, 100);
        let roomGeneration = this.generation;
        let summedProbability = 0;
        for (let i = 0; i <= 10; i++) {
            summedProbability = summedProbability + this.getChildDelayProbabilityForGenerationRoomCrawlers(i);
            if (diceRoll < summedProbability) {
                roomGeneration = this.generation + i;
                break;
            }
        }
        return roomGeneration;
    }
    sidewaysBranchingRoomSizes() {
        let sizeSideways;
        let sizeBranching;
        const probabilityMediumSideways = this.getRoomSizeProbabilitySideways(this._tunnelWidth, _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM);
        const probabilitySmallSideways = this.getRoomSizeProbabilitySideways(this._tunnelWidth, _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL);
        const probabilityMediumBranching = this.getRoomSizeProbabilityBranching(this._tunnelWidth, _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM);
        const probSmallBranching = this.getRoomSizeProbabilityBranching(this._tunnelWidth, _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL);
        const diceRoll = this.rng.range(0, 100);
        if (diceRoll < probabilitySmallSideways)
            sizeSideways = _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL;
        else if (diceRoll < (probabilitySmallSideways + probabilityMediumSideways))
            sizeSideways = _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM;
        else
            sizeSideways = _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE;
        if (diceRoll < probSmallBranching)
            sizeBranching = _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL;
        else if (diceRoll < (probSmallBranching + probabilityMediumBranching))
            sizeBranching = _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM;
        else
            sizeBranching = _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE;
        return [sizeSideways, sizeBranching];
    }
    isChangeDirection() {
        return this.rng.range(0, 100) < this._changeDirectionProbability;
    }
    isSpawn(changeDirection) {
        if (changeDirection && this.rng.range(0, 100) < this._turnDoubleSpawnProbability) {
            return true;
        }
        else if (!changeDirection && this.rng.range(0, 100) < this._straightDoubleSpawnProbability) {
            return true;
        }
        return false;
    }
    isSpawnRoom(doSpawn) {
        return doSpawn && this.rng.range(0, 100) > this.config.patience;
    }
    buildAnteroom(length, width) {
        if ((length < 3) || (width < 1)) {
            console.error("Anteroom must be at least 3x3");
            return false;
        }
        const [frontFree] = this.frontFree(this.location, this.direction, width + 1, width + 1);
        if (frontFree <= length) {
            return false;
        }
        const right = this.rightDirection();
        for (let directionLength = 1; directionLength <= length; directionLength++) {
            for (let side = -width; side <= width; side++) {
                const current = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
                this.dungeonCrawler.setMap(current, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN);
            }
        }
        if ((width >= 3) && (length >= 7) && this.config.columnsInTunnels) {
            const directionLength = 2;
            this.placeColumns(width, directionLength, right);
        }
        return true;
    }
    buildTunnel(length, width) {
        if ((length < 1) || (width < 0)) {
            console.error("Trying to build zero size tunnel with length = " + length + "; width =  " + width);
            return false;
        }
        const [frontFree] = this.frontFree(this.location, this.direction, width + 1, width + 1);
        if (frontFree < length) {
            return false;
        }
        const right = this.rightDirection();
        for (let directionLength = 1; directionLength <= length; directionLength++) {
            for (let side = -width; side <= width; side++) {
                const current = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
                this.dungeonCrawler.setMap(current, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN);
            }
        }
        if ((width >= 3) && (length >= 7) && this.config.columnsInTunnels) {
            const numCols = Math.floor((length - 1) / 6);
            console.assert(numCols > 0);
            for (let i = 0; i < numCols; i++) {
                const directionLength = 2 + i * 3;
                this.placeColumns(width, directionLength, right);
            }
        }
        return true;
    }
    placeColumns(width, directionLength, right) {
        let side = -width + 1;
        let point = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
        this.dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].COLUMN);
        side = width - 1;
        point = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
        this.dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].COLUMN);
        directionLength = directionLength - 1;
        side = -width + 1;
        point = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
        this.dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].COLUMN);
        side = width - 1;
        point = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
        this.dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].COLUMN);
    }
    getChildDelayProbabilityForGenerationRoomCrawlers(generation) {
        if ((0 <= generation) && (generation <= 10)) {
            return this.config.childDelayProbabilityForGenerationRoomCrawlers[generation];
        }
        else {
            return 0;
        }
    }
    getChildDelayProbabilityForGenerationTunnelCrawlers(generation) {
        if ((0 <= generation) && (generation <= 10)) {
            return this.config.childDelayProbabilityForGenerationTunnelCrawlers[generation];
        }
        else {
            return 0;
        }
    }
    getAnteroomProbability(tunnelWidth) {
        if (tunnelWidth >= this.config.anteroomProbability.length) {
            return 100;
        }
        else {
            return this.config.anteroomProbability[tunnelWidth];
        }
    }
    getSizeUpProbability(generation) {
        if (generation >= this.config.sizeUpProbability.length) {
            return this.config.sizeUpProbability[this.config.sizeUpProbability.length - 1];
        }
        else {
            return this.config.sizeUpProbability[generation];
        }
    }
    getSizeDownProbability(generation) {
        if (generation >= this.config.sizeDownProbability.length) {
            return this.config.sizeDownProbability[this.config.sizeDownProbability.length - 1];
        }
        else {
            return this.config.sizeDownProbability[generation];
        }
    }
    getMaxAgeTunnelCrawlers(generation) {
        if (generation >= this.config.maxAgesTunnelCrawlers.length) {
            return this.config.maxAgesTunnelCrawlers[this.config.maxAgesTunnelCrawlers.length - 1];
        }
        else {
            return this.config.maxAgesTunnelCrawlers[generation];
        }
    }
    getRoomSizeProbabilitySideways(tunnelWidth, size) {
        if (tunnelWidth >= this.config.roomSizeProbabilitySidewaysRooms.length) {
            if (_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE === size) {
                return 100;
            }
            else {
                return 0;
            }
        }
        else {
            switch (size) {
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE:
                    return (this.config.roomSizeProbabilitySidewaysRooms[tunnelWidth][2]);
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM:
                    return (this.config.roomSizeProbabilitySidewaysRooms[tunnelWidth][1]);
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL:
                    return (this.config.roomSizeProbabilitySidewaysRooms[tunnelWidth][0]);
            }
        }
    }
    getRoomSizeProbabilityBranching(tunnelWidth, size) {
        if (tunnelWidth >= this.config.roomSizeProbabilityBranching.length) {
            if (_model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE === size) {
                return 100;
            }
            else {
                return 0;
            }
        }
        else {
            switch (size) {
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].LARGE:
                    return (this.config.roomSizeProbabilityBranching[tunnelWidth][2]);
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].MEDIUM:
                    return (this.config.roomSizeProbabilityBranching[tunnelWidth][1]);
                case _model__WEBPACK_IMPORTED_MODULE_0__["RoomSize"].SMALL:
                    return (this.config.roomSizeProbabilityBranching[tunnelWidth][0]);
            }
        }
    }
    mutateOptions() {
        return {
            straightDoubleSpawnProbability: this.dungeonCrawler.mutate(this._straightDoubleSpawnProbability),
            turnDoubleSpawnProbability: this.dungeonCrawler.mutate(this._turnDoubleSpawnProbability),
            changeDirectionProbability: this.dungeonCrawler.mutate(this._changeDirectionProbability),
            makeRoomsRightProbability: this.dungeonCrawler.mutate(this._makeRoomsRightProbability),
            makeRoomsLeftProbability: this.dungeonCrawler.mutate(this._makeRoomsLeftProbability),
            joinPreference: this.dungeonCrawler.mutate(this._joinPreference),
        };
    }
}


/***/ }),

/***/ "./src/tunneler/wall.crawler.ts":
/*!**************************************!*\
  !*** ./src/tunneler/wall.crawler.ts ***!
  \**************************************/
/*! exports provided: WallCrawler */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WallCrawler", function() { return WallCrawler; });
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./model */ "./src/tunneler/model.ts");
/* harmony import */ var _crawler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./crawler */ "./src/tunneler/crawler.ts");


class WallCrawler extends _crawler__WEBPACK_IMPORTED_MODULE_1__["Crawler"] {
    constructor(rng, dungeonCrawler, location, direction, age, maxAge, generation, intendedDirection, stepLength, opening, corridorWidth, straightSingleSpawnProbability, straightDoubleSpawnProbability, turnSingleSpawnProbability, turnDoubleSpawnProbability, changeDirectionProbability) {
        super(rng, dungeonCrawler, location, direction, age, maxAge, generation);
        this._intendedDirection = intendedDirection;
        this._stepLength = stepLength;
        this._opening = opening;
        this._corridorWidth = corridorWidth;
        this._straightSingleSpawnProbability = straightSingleSpawnProbability;
        this._straightDoubleSpawnProbability = straightDoubleSpawnProbability;
        this._turnSingleSpawnProbability = turnSingleSpawnProbability;
        this._turnDoubleSpawnProbability = turnDoubleSpawnProbability;
        this._changeDirectionProbability = changeDirectionProbability;
        console.assert(corridorWidth >= 0);
    }
    freePredicate(type) {
        if (this.config.crawlersInTunnels && this.config.crawlersInAnterooms) {
            if (!this.contains(type, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_ANTEROOM_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_OPEN)) {
                return true;
            }
        }
        else if (this.config.crawlersInTunnels) {
            if (!this.contains(type, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].INSIDE_TUNNEL_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_OPEN)) {
                return true;
            }
        }
        else {
            if (!this.contains(type, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_OPEN, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_OPEN)) {
                return true;
            }
        }
        return false;
    }
    stepAhead() {
        if (this.generation !== this.dungeonCrawler.activeGeneration) {
            console.assert(this.generation > this.dungeonCrawler.activeGeneration);
            return true;
        }
        this.age++;
        if (this.age >= this.maxAge) {
            return false;
        }
        else if (this.age < 0) {
            return true;
        }
        const [frontFree, leftFree, rightFree] = this.frontFree(this.location, this.direction, this._corridorWidth, this._corridorWidth);
        const right = this.rightDirection();
        const left = right.negative;
        let test = right;
        if ((this._opening === 0) && (frontFree < this.config.joinDistance)) {
            if (this.join(frontFree)) {
                return false;
            }
        }
        let tilesLaid = this._stepLength;
        if (frontFree > this._corridorWidth) {
            if ((frontFree - this._corridorWidth) < this._stepLength) {
                tilesLaid = frontFree - this._corridorWidth;
            }
            for (let i = 1; i <= tilesLaid; i++) {
                test = this.location.plus(this.direction.multiply(i));
                if (this._opening === 1) {
                    this.dungeonCrawler.setMap(test, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED);
                }
                else {
                    console.assert(this._opening === 0);
                    this.dungeonCrawler.setMap(test, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED);
                }
            }
            this.location = test;
            const diceRoll = this.rng.range(0, 100);
            let childGeneration = this.generation + 1;
            let summedProbability = 0;
            for (let i = 0; i <= 10; i++) {
                summedProbability = summedProbability + this.getChildDelayProbabilityForGenerationCrawlers(i);
                if (diceRoll < summedProbability) {
                    childGeneration = this.generation + i;
                    break;
                }
            }
            const options = {
                straightSingleSpawnProbability: this.dungeonCrawler.mutate(this._straightSingleSpawnProbability),
                straightDoubleSpawnProbability: this.dungeonCrawler.mutate(this._straightDoubleSpawnProbability),
                turnSingleSpawnProbability: this.dungeonCrawler.mutate(this._turnSingleSpawnProbability),
                turnDoubleSpawnProbability: this.dungeonCrawler.mutate(this._turnDoubleSpawnProbability),
                changeDirectionProbability: this.dungeonCrawler.mutate(this._changeDirectionProbability),
            };
            if (this.rng.range(0, 100) < this._changeDirectionProbability) {
                const oldDirection = this.direction;
                if (((this._intendedDirection.x === 0) && (this._intendedDirection.y === 0)) ||
                    ((this._intendedDirection.x === this.direction.x) && (this._intendedDirection.y === this.direction.y))) {
                    const random = this.rng.range(0, 4);
                    if (random === 0) {
                        this.direction = right;
                    }
                    else if (random === 1) {
                        this.direction = left;
                    }
                    else {
                        if ((rightFree > leftFree) || ((rightFree === leftFree) && this.rng.boolean())) {
                            this.direction = right;
                        }
                        else {
                            this.direction = left;
                        }
                    }
                }
                else {
                    if ((this._intendedDirection.x === 0) || (this._intendedDirection.y === 0)) {
                        this.direction = this._intendedDirection;
                    }
                    else {
                        console.assert(!this._intendedDirection.equal(0, 0));
                        this.direction = this._intendedDirection.minus(this.direction);
                    }
                }
                if (this.rng.range(0, 100) < this._turnDoubleSpawnProbability) {
                    this.spawnWallCrawler(this.direction.negative, this.direction.negative, childGeneration, options);
                    this.spawnWallCrawler(oldDirection, oldDirection, childGeneration, options);
                }
                else if (this.rng.range(0, 100) < this._turnSingleSpawnProbability) {
                    this.spawnWallCrawler(this.direction.negative, this.direction.negative, childGeneration, options);
                }
            }
            else {
                if (this.rng.range(0, 100) < this._straightDoubleSpawnProbability) {
                    this.spawnWallCrawler(right, right, childGeneration, options);
                    this.spawnWallCrawler(left, left, childGeneration, options);
                }
                else if (this.rng.range(0, 100) < this._straightSingleSpawnProbability) {
                    if (leftFree > rightFree || leftFree === rightFree && this.rng.boolean()) {
                        test = left;
                    }
                    else {
                        test = right;
                    }
                    if (this.rng.range(0, 3) === 0) {
                        test = test.negative;
                    }
                    this.spawnWallCrawler(test, test, childGeneration, options);
                }
            }
        }
        else {
            if (this.direction.equals(this._intendedDirection) || this._intendedDirection.equal(0, 0)) {
                const [rightFree] = this.frontFree(this.location, right, this._corridorWidth, this._corridorWidth);
                const [leftFree] = this.frontFree(this.location, left, this._corridorWidth, this._corridorWidth);
                if ((rightFree <= this._corridorWidth) && (leftFree <= this._corridorWidth)) {
                    return false;
                }
                else if ((rightFree > 2 * this._corridorWidth + 1) && (leftFree > 2 * this._corridorWidth + 1)) {
                    if (this.rng.boolean()) {
                        this.direction = right;
                    }
                    else {
                        this.direction = left;
                    }
                }
                else if (rightFree > leftFree)
                    this.direction = right;
                else if (leftFree > rightFree)
                    this.direction = left;
                else if (this.rng.boolean()) {
                    this.direction = right;
                }
                else {
                    this.direction = left;
                }
            }
            else {
                if ((this._intendedDirection.x === 0) || (this._intendedDirection.y === 0)) {
                    const [directionFree] = this.frontFree(this.location, this._intendedDirection, this._corridorWidth, this._corridorWidth);
                    if (directionFree > this._corridorWidth) {
                        this.direction = this._intendedDirection;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    console.assert(!this._intendedDirection.equal(0, 0));
                    test = this._intendedDirection.minus(this.direction);
                    const [testFree] = this.frontFree(this.location, test, this._corridorWidth, this._corridorWidth);
                    if (testFree > this._corridorWidth) {
                        this.direction = test;
                    }
                    else {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    spawnWallCrawler(direction, intendedDirection, generation, options) {
        if (this.rng.range(0, 100) < this.config.noHeadingProbability) {
            intendedDirection = _model__WEBPACK_IMPORTED_MODULE_0__["Point"].ZERO;
        }
        this.dungeonCrawler.createWallCrawler(this.location, direction, 0, this.dungeonCrawler.getMaxAgeCrawlers(generation), generation, intendedDirection, this.dungeonCrawler.getStepLength(generation), 1, this.dungeonCrawler.getCorridorWidth(generation), options.straightSingleSpawnProbability, options.straightDoubleSpawnProbability, options.turnSingleSpawnProbability, options.turnDoubleSpawnProbability, options.changeDirectionProbability);
    }
    join(frontFree) {
        const right = this.rightDirection();
        let test = this.location.plus(this.direction.multiply(frontFree + 1));
        if (!this.valid(test)) {
            return false;
        }
        let type = this.dungeonCrawler.getMap(test);
        if (this.contains(type, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_CLOSED)) {
            for (let i = 1; i <= frontFree; i++) {
                const point = this.location.plus(this.direction.multiply(i));
                if (!this.valid(point)) {
                    return false;
                }
                this.dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED);
            }
            return true;
        }
        else if (this.contains(type, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_CLOSED)) {
            return false;
        }
        let wall = new _model__WEBPACK_IMPORTED_MODULE_0__["Point"]();
        let sidestep = 0;
        for (let i = 1; i <= this._corridorWidth; i++) {
            let point = this.location.plus(right.multiply(i)).plus(this.direction.multiply(frontFree + 1));
            if (!this.valid(point)) {
                return false;
            }
            type = this.dungeonCrawler.getMap(point);
            if (this.contains(type, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_CLOSED)) {
                wall = point;
                sidestep = i;
                break;
            }
            point = this.location.minus(right.multiply(i).plus(this.direction.multiply(frontFree + 1)));
            if (!this.valid(point)) {
                return false;
            }
            type = this.dungeonCrawler.getMap(point);
            if (this.contains(type, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].GUARANTEED_CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_CLOSED)) {
                wall = point;
                sidestep = -i;
                break;
            }
        }
        if ((wall.x !== 0) || (wall.y !== 0)) {
            return false;
        }
        if (sidestep !== 0) {
            return false;
        }
        if (this.contains(type, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_GUARANTEED_CLOSED)) {
            return false;
        }
        if (sidestep < 0) {
            test = right;
        }
        else {
            test = right.negative;
        }
        const [free] = this.frontFree(wall, test, 1, 1);
        let absSidestep;
        let factorSidestep;
        if (sidestep > 0) {
            absSidestep = sidestep;
            factorSidestep = 1;
        }
        else {
            absSidestep = -sidestep;
            factorSidestep = -1;
        }
        if (free < absSidestep + 1) {
            return false;
        }
        for (let i = 1; i <= frontFree + 1; i++) {
            const point = this.location.plus(this.direction.multiply(i));
            if (!this.valid(point)) {
                return false;
            }
            this.dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED);
        }
        for (let i = 1; i < absSidestep; i++) {
            const point = this.location.plus(right.multiply(i * factorSidestep)).plus(this.direction.multiply(frontFree + 1));
            if (!this.valid(point)) {
                return false;
            }
            this.dungeonCrawler.setMap(point, _model__WEBPACK_IMPORTED_MODULE_0__["TunnelerCellType"].NON_JOIN_CLOSED);
        }
        return true;
    }
    getChildDelayProbabilityForGenerationCrawlers(generation) {
        if ((0 <= generation) && (generation <= 10)) {
            return this.config.childDelayProbabilityForGenerationCrawlers[generation];
        }
        else {
            return 0;
        }
    }
}


/***/ }),

/***/ "./src/tunneling.ts":
/*!**************************!*\
  !*** ./src/tunneling.ts ***!
  \**************************/
/*! exports provided: TunnelingAlgorithm */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TunnelingAlgorithm", function() { return TunnelingAlgorithm; });
/* harmony import */ var _geometry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./geometry */ "./src/geometry.ts");

class TunnelingAlgorithm {
    constructor(rng, width, height, options) {
        this._possible = [];
        this.rooms = [];
        this.corridorsV = [];
        this.corridorsH = [];
        this._rng = rng;
        this._width = width;
        this._height = height;
        this._roomMinW = options.roomMinW || 5;
        this._roomNinH = options.roomMinH || 5;
        this._roomMaxW = options.roomMaxW || 20;
        this._roomMaxH = options.roomMaxH || 20;
        this._roomMinX = options.roomMinX || 2;
        this._roomMinY = options.roomMinY || 2;
        this.MaxCorrDist = options.maxCorrDist || 20;
        this.MaxCorrWidth = options.maxCorrWidth || 5;
        this._skew = options.skew || 3;
        this._xDist = options.xDist || 2;
        this._yDist = options.yDist || 2;
        this.MinCorrDistX = options.minCorrDistX || (this._xDist << 1) + 1;
        this.MinCorrDistY = options.minCorrDistY || (this._yDist << 1) + 1;
        this.MaxRooms = options.maxRooms || 0;
        this._debug = options.debug || false;
    }
    isOverlap(a) {
        const f = a.isOverlap.bind(a);
        return this.rooms.some(f) ||
            this.corridorsV.some(f) ||
            this.corridorsH.some(f);
    }
    valid(rect) {
        return rect.x >= 0 && rect.y >= 0 && rect.w > 0 && rect.h > 0 &&
            rect.x + rect.w < this._width &&
            rect.y + rect.h < this._height &&
            !this.isOverlap(rect);
    }
    generate() {
        this.rooms.splice(0, this.rooms.length);
        this.corridorsH.splice(0, this.corridorsH.length);
        this.corridorsV.splice(0, this.corridorsV.length);
        if (this.generateFirstRoom()) {
            if (this.MaxRooms > 0) {
                while (this.rooms.length < this.MaxRooms) {
                    if (!this.generateNextRoom()) {
                        return false;
                    }
                }
                return true;
            }
            else {
                while (this.generateNextRoom()) {
                    console.log("generate next room");
                }
                return true;
            }
        }
        return false;
    }
    generateFirstRoom() {
        const roomW = this._rng.range(this._roomMinW, this._roomMaxW);
        const roomH = this._rng.range(this._roomNinH, this._roomMaxH);
        const minX = Math.max(this._roomMinX, (this._width >> 1) - roomW);
        const minY = Math.max(this._roomMinY, (this._height >> 1) - roomH);
        const maxX = Math.min(this._width - this._roomMinX - roomW, (this._width >> 1) + roomW);
        const maxY = Math.min(this._height - this._roomMinY - roomH, (this._height >> 1) + roomH);
        const room = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](this.nextRange(minX, maxX), this.nextRange(minY, maxY), roomW, roomH);
        if (!this.isOverlap(room.expand())) {
            this.rooms.push(room);
            return true;
        }
        return false;
    }
    generateNextRoom() {
        if (this._debug)
            console.log("generate next room");
        this._possible.splice(0, this._possible.length);
        this.rooms.forEach((room) => {
            const topC = this.findTopCorridorArea(room);
            const bottomC = this.findBottomCorridorArea(room);
            const rightC = this.findRightCorridorArea(room);
            const leftC = this.findLeftCorridorArea(room);
            if (topC) {
                if (this._debug)
                    console.log("possible top corridor area", room, topC);
                const topR = this.findTopRoomArea(topC);
                if (topR) {
                    if (this._debug)
                        console.log("add possible top room area", room, topC, topR);
                    this._possible.push(new Possible(topR, topC, Direction.TOP));
                }
            }
            if (bottomC) {
                if (this._debug)
                    console.log("possible bottom corridor area", room, bottomC);
                const bottomR = this.findBottomRoomArea(bottomC);
                if (bottomR) {
                    if (this._debug)
                        console.log("add possible bottom room area", room, bottomC, bottomR);
                    this._possible.push(new Possible(bottomR, bottomC, Direction.BOTTOM));
                }
            }
            if (rightC) {
                if (this._debug)
                    console.log("possible right corridor area", room, rightC);
                const rightR = this.findRightRoomArea(rightC);
                if (rightR) {
                    if (this._debug)
                        console.log("add possible right room area", room, rightC, rightR);
                    this._possible.push(new Possible(rightR, rightC, Direction.RIGHT));
                }
            }
            if (leftC) {
                if (this._debug)
                    console.log("possible left corridor area", room, leftC);
                const leftR = this.findLeftRoomArea(leftC);
                if (leftR) {
                    if (this._debug)
                        console.log("add possible left room area", room, leftC, leftR);
                    this._possible.push(new Possible(leftR, leftC, Direction.LEFT));
                }
            }
        });
        if (this._debug)
            console.log("possible", [...this._possible]);
        if (this._debug)
            console.log("rooms", [...this.rooms]);
        if (this._debug)
            console.log("corridorsV", [...this.corridorsV]);
        if (this._debug)
            console.log("corridorsH", [...this.corridorsH]);
        while (this._possible.length > 0) {
            const i = this._rng.range(0, this._possible.length);
            const possible = this._possible[i];
            this._possible.splice(i, 1);
            switch (possible.direction) {
                case Direction.TOP:
                    if (this.generateTopRoom(possible)) {
                        return true;
                    }
                    break;
                case Direction.BOTTOM:
                    if (this.generateBottomRoom(possible)) {
                        return true;
                    }
                    break;
                case Direction.RIGHT:
                    if (this.generateRightRoom(possible)) {
                        return true;
                    }
                    break;
                case Direction.LEFT:
                    if (this.generateLeftRoom(possible)) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }
    findTopCorridorArea(room) {
        const buffer = _geometry__WEBPACK_IMPORTED_MODULE_0__["MutableRect"].from(room);
        buffer.h = this.MinCorrDistY;
        buffer.y -= this.MinCorrDistY;
        buffer.x += this._xDist;
        buffer.w -= this._xDist << 1;
        let h = -1;
        let y = -1;
        for (; buffer.h <= this.MaxCorrDist; buffer.h++, buffer.y--) {
            if (this.valid(buffer)) {
                h = buffer.h;
                y = buffer.y;
            }
            else {
                break;
            }
        }
        if (h >= 0 && y >= 0) {
            buffer.h = h;
            buffer.y = y;
            return buffer.immutable();
        }
        else {
            return null;
        }
    }
    findBottomCorridorArea(room) {
        const buffer = _geometry__WEBPACK_IMPORTED_MODULE_0__["MutableRect"].from(room);
        buffer.y += room.h;
        buffer.h = this.MinCorrDistY;
        buffer.x += this._xDist;
        buffer.w -= this._xDist << 1;
        let h = -1;
        for (; buffer.h < this.MaxCorrDist; buffer.h++) {
            if (this.valid(buffer)) {
                h = buffer.h;
            }
            else {
                break;
            }
        }
        if (h >= 0) {
            buffer.h = h;
            return buffer.immutable();
        }
        else {
            return null;
        }
    }
    findRightCorridorArea(room) {
        const buffer = _geometry__WEBPACK_IMPORTED_MODULE_0__["MutableRect"].from(room);
        buffer.x += buffer.w;
        buffer.y += this._yDist;
        buffer.h -= this._yDist << 1;
        let w = -1;
        for (; buffer.w < this.MaxCorrDist; buffer.w++) {
            if (this.valid(buffer)) {
                w = buffer.w;
            }
            else {
                break;
            }
        }
        if (w >= 0) {
            buffer.w = w;
            return buffer.immutable();
        }
        else {
            return null;
        }
    }
    findLeftCorridorArea(room) {
        const buffer = _geometry__WEBPACK_IMPORTED_MODULE_0__["MutableRect"].from(room);
        buffer.w = this.MinCorrDistX;
        buffer.x -= this.MinCorrDistX;
        buffer.y += this._yDist;
        buffer.h -= this._yDist << 1;
        let w = -1;
        let x = -1;
        for (; buffer.w <= this.MaxCorrDist; buffer.w++, buffer.x--) {
            if (this.valid(buffer)) {
                w = buffer.w;
                x = buffer.x;
            }
            else {
                break;
            }
        }
        if (w >= 0 && x >= 0) {
            buffer.w = w;
            buffer.x = x;
            return buffer.immutable();
        }
        else {
            return null;
        }
    }
    findTopRoomArea(corridor) {
        const buffer = _geometry__WEBPACK_IMPORTED_MODULE_0__["MutableRect"].from(corridor);
        buffer.h -= this.MinCorrDistY;
        buffer.x -= this._xDist;
        buffer.w += this._xDist << 1;
        if (buffer.h < this._roomNinH) {
            const d = this._roomNinH - buffer.h;
            buffer.h += d;
            buffer.y -= d;
        }
        let y = buffer.y;
        let h = buffer.h;
        for (; buffer.h <= this._roomMaxH; buffer.h++, buffer.y--) {
            if (this.valid(buffer)) {
                h = buffer.h;
                y = buffer.y;
            }
            else {
                buffer.h = h;
                buffer.y = y;
                break;
            }
        }
        if (y >= 0 && h >= 0) {
            let x = buffer.x;
            let w = buffer.w;
            for (const minX = corridor.x + this._xDist + 1 - this._roomMaxW; buffer.x > minX; buffer.x--, buffer.w++) {
                if (this.valid(buffer)) {
                    x = buffer.x;
                    w = buffer.w;
                }
                else {
                    break;
                }
            }
            buffer.x = x;
            buffer.w = w;
            for (const maxX = corridor.x + corridor.w - this._xDist - 1 + this._roomMaxW; buffer.x + buffer.w < maxX; buffer.w++) {
                if (this.valid(buffer)) {
                    w = buffer.w;
                }
                else {
                    break;
                }
            }
            buffer.w = w;
            return buffer.immutable();
        }
        return null;
    }
    findBottomRoomArea(corridor) {
        const buffer = _geometry__WEBPACK_IMPORTED_MODULE_0__["MutableRect"].from(corridor);
        buffer.y += this.MinCorrDistY;
        buffer.h -= this.MinCorrDistY;
        buffer.x -= this._xDist;
        buffer.w += this._xDist << 1;
        if (buffer.h < this._roomNinH) {
            buffer.h = this._roomNinH;
        }
        let h = buffer.h;
        for (; buffer.h <= this._roomMaxH; buffer.h++) {
            if (this.valid(buffer)) {
                h = buffer.h;
            }
            else {
                buffer.h = h;
                break;
            }
        }
        if (h >= 0) {
            let x = buffer.x;
            let w = buffer.w;
            for (const minX = corridor.x + this._xDist + 1 - this._roomMaxW; buffer.x > minX; buffer.x--, buffer.w++) {
                if (this.valid(buffer)) {
                    x = buffer.x;
                    w = buffer.w;
                }
                else {
                    break;
                }
            }
            buffer.x = x;
            buffer.w = w;
            for (const maxX = corridor.x + corridor.w - this._xDist - 1 + this._roomMaxW; buffer.x + buffer.w < maxX; buffer.w++) {
                if (this.valid(buffer)) {
                    w = buffer.w;
                }
                else {
                    break;
                }
            }
            buffer.w = w;
            return buffer.immutable();
        }
        return null;
    }
    findRightRoomArea(corridor) {
        const buffer = _geometry__WEBPACK_IMPORTED_MODULE_0__["MutableRect"].from(corridor);
        buffer.x += this.MinCorrDistX;
        buffer.w -= this.MinCorrDistX;
        buffer.y -= this._yDist;
        buffer.h += this._yDist << 1;
        if (buffer.w < this._roomMinW) {
            buffer.w = this._roomMinW;
        }
        let w = buffer.w;
        for (; buffer.w <= this._roomMaxW; buffer.w++) {
            if (this.valid(buffer)) {
                w = buffer.w;
            }
            else {
                buffer.w = w;
                break;
            }
        }
        if (w >= 0) {
            let y = buffer.y;
            let h = buffer.h;
            for (const minY = corridor.y + this._yDist + 1 - this._roomMaxH; buffer.y > minY; buffer.y--, buffer.h++) {
                if (this.valid(buffer)) {
                    y = buffer.y;
                    h = buffer.h;
                }
                else {
                    buffer.y = y;
                    buffer.h = h;
                    break;
                }
            }
            for (const maxY = corridor.y + corridor.h - this._yDist - 1 + this._roomMaxH; buffer.y + buffer.h < maxY; buffer.h++) {
                if (this.valid(buffer)) {
                    h = buffer.h;
                }
                else {
                    buffer.h = h;
                    break;
                }
            }
            return buffer.immutable();
        }
        return null;
    }
    findLeftRoomArea(corridor) {
        const buffer = _geometry__WEBPACK_IMPORTED_MODULE_0__["MutableRect"].from(corridor);
        buffer.w -= this.MinCorrDistX;
        buffer.y -= this._yDist;
        buffer.h += this._yDist << 1;
        if (buffer.w < this._roomMinW) {
            const d = this._roomMinW - buffer.w;
            buffer.w += d;
            buffer.x -= d;
        }
        let x = buffer.x;
        let w = buffer.w;
        for (; buffer.w <= this._roomMaxW; buffer.w++, buffer.x--) {
            if (this.valid(buffer)) {
                w = buffer.w;
                x = buffer.x;
            }
            else {
                buffer.x = x;
                buffer.w = w;
                break;
            }
        }
        if (x >= 0 && w >= 0) {
            let y = buffer.y;
            let h = buffer.h;
            for (const minY = corridor.y + this._yDist + 1 - this._roomMaxH; buffer.y > minY; buffer.y--, buffer.h++) {
                if (this.valid(buffer)) {
                    y = buffer.y;
                    h = buffer.h;
                }
                else {
                    break;
                }
            }
            buffer.y = y;
            buffer.h = h;
            for (const maxY = corridor.y - this._yDist - 1 + this._roomMaxH; buffer.y + buffer.h < maxY; buffer.h++) {
                if (this.valid(buffer)) {
                    h = buffer.h;
                }
                else {
                    break;
                }
            }
            buffer.h = h;
            return buffer.immutable();
        }
        else {
            if (this._debug)
                console.warn("left room area not valid", corridor, buffer);
        }
        return null;
    }
    generateTopRoom(possible) {
        const corrW = this.nextRange(1, Math.min(this.MaxCorrWidth, possible.corridor.w));
        const corrH = this.nextRange(this.MinCorrDistY, possible.corridor.h);
        const corrY = possible.corridor.y + (possible.corridor.h - corrH);
        const corrX = this.nextRange(possible.corridor.x, possible.corridor.x + possible.corridor.w - corrW);
        const corr = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](corrX, corrY, corrW, corrH);
        if (this.valid(corr.expandV())) {
            const roomMinY = Math.max(3, possible.room.y, corr.y - this._roomMaxH);
            const roomY = this.nextRange(roomMinY, corr.y - this._roomNinH);
            const roomH = corr.y - roomY;
            const roomMaxX = corr.x - this._xDist;
            const roomMinX = Math.max(2, possible.room.x, corr.x + corr.w + this._xDist - this._roomMaxW);
            const roomX = this.nextRange(roomMinX, roomMaxX);
            const roomMinRightX = corr.x + corr.w + this._xDist;
            const roomMaxRightX = Math.min(possible.room.x + possible.room.w, roomX + this._roomMaxW);
            const roomRightX = this.nextRange(roomMinRightX, roomMaxRightX);
            const roomW = roomRightX - roomX;
            const room = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](roomX, roomY, roomW, roomH);
            if (this.valid(room.expand())) {
                if (this._debug)
                    console.log("add top room", corr, room);
                this.corridorsV.push(corr);
                this.rooms.push(room);
                this.connectWithOthers(room);
                return true;
            }
            else {
                if (this._debug)
                    console.warn("top room not valid");
            }
        }
        else {
            if (this._debug)
                console.warn("top corridor not valid");
        }
        return false;
    }
    generateBottomRoom(possible) {
        const corrY = possible.corridor.y;
        const corrW = this.nextRange(1, Math.min(this.MaxCorrWidth, possible.corridor.w));
        const corrH = this.nextRange(this.MinCorrDistY, possible.corridor.h);
        const corrX = this.nextRange(possible.corridor.x, possible.corridor.x + possible.corridor.w - corrW);
        const corr = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](corrX, corrY, corrW, corrH);
        if (this.valid(corr.expandV())) {
            const roomY = corr.y + corr.h;
            const roomMinY = roomY + this._roomNinH;
            const roomMaxY = Math.min(possible.room.y + possible.room.h, roomMinY + this._roomMaxH);
            const roomBottomY = this.nextRange(roomMinY, roomMaxY);
            const roomH = roomBottomY - roomY;
            const roomMaxX = corr.x - this._xDist;
            const roomMinX = Math.max(2, possible.room.x, corr.x + corr.w + this._xDist - this._roomMaxW);
            const roomX = this.nextRange(roomMinX, roomMaxX);
            const roomMinRightX = corr.x + corr.w + this._xDist;
            const roomMaxRightX = Math.min(possible.room.x + possible.room.w, roomX + this._roomMaxW);
            const roomRightX = this.nextRange(roomMinRightX, roomMaxRightX);
            const roomW = roomRightX - roomX;
            const room = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](roomX, roomY, roomW, roomH);
            if (this.valid(room.expand())) {
                if (this._debug)
                    console.log("add bottom room", corr, room);
                this.corridorsV.push(corr);
                this.rooms.push(room);
                this.connectWithOthers(room);
                return true;
            }
            else {
                if (this._debug)
                    console.warn("bottom room not valid", corr, room);
            }
        }
        else {
            if (this._debug)
                console.warn("bottom corridor not valid", corr);
        }
        return false;
    }
    generateRightRoom(possible) {
        const corrX = possible.corridor.x;
        const corrH = this.nextRange(1, Math.min(this.MaxCorrWidth, possible.corridor.h));
        const corrW = this.nextRange(this.MinCorrDistX, possible.corridor.w);
        const corrY = this.nextRange(possible.corridor.y, possible.corridor.y + possible.corridor.h - corrH);
        const corr = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](corrX, corrY, corrW, corrH);
        if (this.valid(corr.expandH())) {
            const roomX = corr.x + corr.w;
            const roomMinX = roomX + this._roomMinW;
            const roomMaxX = Math.min(possible.room.x + possible.room.w, roomMinX + this._roomMaxW);
            const roomRightX = this.nextRange(roomMinX, roomMaxX);
            const roomW = roomRightX - roomX;
            const roomMaxY = corr.y - this._yDist;
            const roomMinY = Math.max(2, possible.room.y, corr.y + corr.h + this._yDist - this._roomMaxH);
            const roomY = this.nextRange(roomMinY, roomMaxY);
            const roomMinBottomY = corr.y + corr.h + this._yDist;
            const roomMaxBottomY = Math.min(possible.room.y + possible.room.h, roomY + this._roomMaxH);
            const roomBottomY = this.nextRange(roomMinBottomY, roomMaxBottomY);
            const roomH = roomBottomY - roomY;
            const room = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](roomX, roomY, roomW, roomH);
            if (this.valid(room.expand())) {
                if (this._debug)
                    console.log("add right room", corr, room);
                this.corridorsH.push(corr);
                this.rooms.push(room);
                this.connectWithOthers(room);
                return true;
            }
            else {
                if (this._debug)
                    console.warn("right room not valid", corr, room);
            }
        }
        else {
            if (this._debug)
                console.warn("right corridor not valid", corr);
        }
        return false;
    }
    generateLeftRoom(possible) {
        const corrH = this.nextRange(1, Math.min(this.MaxCorrWidth, possible.corridor.h));
        const corrW = this.nextRange(this.MinCorrDistX, possible.corridor.w);
        const corrX = possible.corridor.x + (possible.corridor.w - corrW);
        const corrY = this.nextRange(possible.corridor.y, possible.corridor.y + possible.corridor.h - corrH);
        const corr = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](corrX, corrY, corrW, corrH);
        if (this.valid(corr.expandH())) {
            const roomMinX = Math.max(2, possible.room.x, corr.x - this._roomMaxW);
            const roomX = this.nextRange(roomMinX, corr.x - this._roomMinW);
            const roomW = corr.x - roomX;
            const roomMaxY = corr.y - this._yDist;
            const roomMinY = Math.max(3, possible.room.y, corr.y + corr.h + this._yDist - this._roomMaxH);
            const roomY = this.nextRange(roomMinY, roomMaxY);
            const roomMinBottomY = corr.y + corr.h + this._yDist;
            const roomMaxBottomY = Math.min(possible.room.y + possible.room.h, roomY + this._roomMaxH);
            const roomBottomY = this.nextRange(roomMinBottomY, roomMaxBottomY);
            const roomH = roomBottomY - roomY;
            const room = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](roomX, roomY, roomW, roomH);
            if (this.valid(room.expand())) {
                if (this._debug)
                    console.log("add left room", corr, room);
                this.corridorsH.push(corr);
                this.rooms.push(room);
                this.connectWithOthers(room);
                return true;
            }
            else {
                if (this._debug)
                    console.warn("left room not valid");
            }
        }
        else {
            if (this._debug)
                console.warn("left corridor not valid");
        }
        return false;
    }
    connectWithOthers(room) {
        const a = room;
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const b = this.rooms[i];
            const maxX = Math.max(a.x, b.x);
            const minWidthX = Math.min(a.x + a.w, b.x + b.w);
            if (maxX + 5 <= minWidthX) {
                let rect;
                if (a.y + a.h < b.y) {
                    rect = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](maxX + 2, a.y + a.h, minWidthX - maxX - 4, b.y - a.y - a.h);
                }
                else {
                    rect = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](maxX + 2, b.y + b.h, minWidthX - maxX - 4, a.y - b.y - b.h);
                }
                if (this._debug)
                    console.log("test v corr", rect);
                if (rect.w < this.MaxCorrDist && this.valid(rect.expandV())) {
                    if (this._debug)
                        console.log("add v corr", rect);
                    this.corridorsV.push(rect);
                }
            }
            const maxY = Math.max(a.y, b.y);
            const minHeightY = Math.min(a.y + a.h, b.y + b.h);
            if (maxY + 3 <= minHeightY) {
                let rect;
                if (a.x + a.w < b.x) {
                    rect = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](a.x + a.w, maxY + 1, b.x - a.x - a.w, minHeightY - maxY - 2);
                }
                else {
                    rect = new _geometry__WEBPACK_IMPORTED_MODULE_0__["ImmutableRect"](b.x + b.w, maxY + 1, a.x - b.x - b.w, minHeightY - maxY - 2);
                }
                if (this._debug)
                    console.log("test h corr", rect);
                if (rect.h < this.MaxCorrDist && this.valid(rect.expandH())) {
                    if (this._debug)
                        console.log("add h corr", rect);
                    this.corridorsH.push(rect);
                }
            }
        }
    }
    nextRange(min, max) {
        return Math.round(this._rng.skewNormal(min, max, this._skew));
    }
}
var Direction;
(function (Direction) {
    Direction[Direction["TOP"] = 0] = "TOP";
    Direction[Direction["RIGHT"] = 1] = "RIGHT";
    Direction[Direction["BOTTOM"] = 2] = "BOTTOM";
    Direction[Direction["LEFT"] = 3] = "LEFT";
})(Direction || (Direction = {}));
class Possible {
    constructor(room, corridor, direction) {
        this.room = room;
        this.corridor = corridor;
        this.direction = direction;
    }
}


/***/ }),

/***/ "./src/ui.ts":
/*!*******************!*\
  !*** ./src/ui.ts ***!
  \*******************/
/*! exports provided: Colors, Sizes, Button, Layout, SelectableGrid, VStack, HStack */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Colors", function() { return Colors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Sizes", function() { return Sizes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Button", function() { return Button; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Layout", function() { return Layout; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectableGrid", function() { return SelectableGrid; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VStack", function() { return VStack; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HStack", function() { return HStack; });
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_0__);

const Colors = {
    background: 0x101010,
    uiBackground: 0x202020,
    uiSelected: 0x505050,
    uiNotSelected: 0x404040,
    uiRed: 0xFF0000,
    uiYellow: 0xBF9E00,
};
const Sizes = {
    uiBorder: 4,
    uiMargin: 16,
};
class Button extends pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"] {
    constructor(options) {
        super();
        this._selected = false;
        this._width = options.width || 200;
        this._height = options.height || 24;
        this._textSize = options.textSize || 16;
        this._border = options.border || false;
        this._bg = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Graphics"]();
        this._text = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["BitmapText"](options.label, { font: { name: "alagard", size: this._textSize } });
        this._text.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Point"](0.5, 0.5);
        this._text.position.set(this._width >> 1, this._height >> 1);
        this.selected = options.selected || false;
        super.addChild(this._bg, this._text);
    }
    get selected() {
        return this._selected;
    }
    set selected(selected) {
        this._selected = selected;
        if (this._border) {
            this._bg
                .clear()
                .beginFill(Colors.uiBackground)
                .drawRect(0, 0, this._width, this._height)
                .endFill()
                .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
                .drawRect(Sizes.uiBorder, Sizes.uiBorder, this._width - Sizes.uiBorder * 2, this._height - Sizes.uiBorder * 2)
                .endFill();
        }
        else {
            this._bg
                .clear()
                .beginFill(selected ? Colors.uiSelected : Colors.uiNotSelected)
                .drawRect(0, 0, this._width, this._height)
                .endFill();
        }
    }
}
class Layout {
    constructor() {
        this._commitX = 0;
        this._commitY = 0;
        this._offsetX = 0;
        this._offsetY = 0;
    }
    commit() {
        this._commitX = this._offsetX;
        this._commitY = this._offsetY;
    }
    reset() {
        this._offsetX = this._commitX;
        this._offsetY = this._commitY;
    }
    offset(x, y) {
        this._offsetX += x;
        this._offsetY += y;
    }
    get x() {
        return this._offsetX;
    }
    get y() {
        return this._offsetY;
    }
}
function nextNonEmptyCount(counts, from) {
    for (let i = from + 1; i < counts.length; i++) {
        if (counts[i] > 0) {
            return i;
        }
    }
    return null;
}
function prevNonEmptyCount(counts, from) {
    for (let i = from - 1; i >= 0; i--) {
        if (counts[i] > 0) {
            return i;
        }
    }
    return null;
}
function nonEmptyCount(counts, curr) {
    const i = curr || 0;
    if (counts[i] > 0)
        return i;
    const p = prevNonEmptyCount(counts, i);
    if (p !== null)
        return p;
    const n = nextNonEmptyCount(counts, i);
    if (n !== null)
        return n;
    return null;
}
class SelectableGrid {
    constructor(joystick) {
        this._cells = [];
        this._countsX = [];
        this._countsY = [];
        this._limitX = -1;
        this._limitY = -1;
        this._selectedX = null;
        this._selectedY = null;
        this._joystick = joystick;
    }
    reset() {
        this.unmark();
        this._selectedX = nonEmptyCount(this._countsX, this._selectedX);
        this._selectedY = nonEmptyCount(this._countsY, this._selectedY);
        if (this._selectedX === null || this._selectedY === null) {
            this._selectedX = null;
            this._selectedY = null;
        }
        else {
            if (!this.cell(this._selectedX, this._selectedY).isSelectable) {
                const y = this._selectedY;
                const prev = (from) => {
                    for (let x = from - 1; x >= 0; x--) {
                        if (this.cell(x, y).isSelectable) {
                            return x;
                        }
                    }
                    return null;
                };
                const p = prev(this._selectedX);
                if (p !== null) {
                    this._selectedX = p;
                }
                else {
                    const next = (from) => {
                        for (let x = from + 1; x <= this._limitX; x++) {
                            if (this.cell(x, y).isSelectable) {
                                return x;
                            }
                        }
                        return null;
                    };
                    const n = next(this._selectedX);
                    if (n !== null) {
                        this._selectedX = n;
                    }
                    else {
                        throw "illegal state";
                    }
                }
            }
        }
        this.mark();
    }
    moveLeft() {
        var _a;
        this.unmark();
        if (this._selectedX !== null && this._selectedY !== null) {
            const y = this._selectedY;
            if (this._countsY[y] === 0)
                throw `illegal state: empty column ${y}`;
            const merged = (_a = this.selectedCell) === null || _a === void 0 ? void 0 : _a.merged;
            const startX = this._selectedX;
            const prev = (x) => x > 0 ? x - 1 : this._limitX;
            for (let x = prev(startX); x != startX; x = prev(x)) {
                if (merged === null || merged === void 0 ? void 0 : merged.contains(x, y))
                    continue;
                if (this.cell(x, y).isSelectable) {
                    this._selectedX = x;
                    break;
                }
            }
        }
        this.mark();
    }
    moveRight() {
        var _a;
        this.unmark();
        if (this._selectedX !== null && this._selectedY !== null) {
            const y = this._selectedY;
            if (this._countsY[y] === 0)
                throw `illegal state: empty column ${y}`;
            const merged = (_a = this.selectedCell) === null || _a === void 0 ? void 0 : _a.merged;
            const startX = this._selectedX;
            const next = (x) => (x + 1) % (this._limitX + 1);
            for (let x = next(startX); x != startX; x = next(x)) {
                if (merged === null || merged === void 0 ? void 0 : merged.contains(x, y))
                    continue;
                if (this.cell(x, y).isSelectable) {
                    this._selectedX = x;
                    break;
                }
            }
        }
        this.mark();
    }
    moveUp() {
        var _a;
        this.unmark();
        if (this._selectedX !== null && this._selectedY !== null) {
            const x = this._selectedX;
            if (this._countsX[x] === 0)
                throw `illegal state: empty row ${x}`;
            const merged = (_a = this.selectedCell) === null || _a === void 0 ? void 0 : _a.merged;
            const startY = this._selectedY;
            const prev = (y) => y > 0 ? y - 1 : this._limitY;
            for (let y = prev(startY); y != startY; y = prev(y)) {
                if (merged === null || merged === void 0 ? void 0 : merged.contains(x, y))
                    continue;
                if (this.cell(x, y).isSelectable) {
                    this._selectedY = y;
                    break;
                }
            }
        }
        this.mark();
    }
    moveDown() {
        var _a;
        this.unmark();
        if (this._selectedX !== null && this._selectedY !== null) {
            const x = this._selectedX;
            if (this._countsX[x] === 0)
                throw `illegal state: empty row ${x}`;
            const merged = (_a = this.selectedCell) === null || _a === void 0 ? void 0 : _a.merged;
            const startY = this._selectedY;
            const next = (y) => (y + 1) % (this._limitY + 1);
            for (let y = next(startY); y != startY; y = next(y)) {
                if (merged === null || merged === void 0 ? void 0 : merged.contains(x, y))
                    continue;
                if (this.cell(x, y).isSelectable) {
                    this._selectedY = y;
                    break;
                }
            }
        }
        this.mark();
    }
    unmark() {
        var _a;
        (_a = this.selectedCell) === null || _a === void 0 ? void 0 : _a.unmark();
    }
    mark() {
        var _a;
        (_a = this.selectedCell) === null || _a === void 0 ? void 0 : _a.mark();
    }
    get selected() {
        var _a;
        return ((_a = this.selectedCell) === null || _a === void 0 ? void 0 : _a.value) || null;
    }
    get selectedCell() {
        if (this._selectedX !== null && this._selectedY !== null) {
            const cell = this.cell(this._selectedX, this._selectedY);
            if (cell.merged && cell.isRef) {
                return this.cell(cell.merged.from_x, cell.merged.from_y);
            }
            else {
                return cell;
            }
        }
        return null;
    }
    set(x, y, selectable, action) {
        if (x < 0 || y < 0)
            throw `illegal coordinate: ${x}:${y}`;
        const cell = this.cell(x, y);
        if (cell.isRef)
            throw `cell is ref: ${x}:${y}`;
        const hasPrev = cell.value !== null;
        cell.value = [selectable, action];
        if (!hasPrev) {
            if (cell.merged) {
                const merged = cell.merged;
                for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
                    for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
                        this._countsX[sx]++;
                        this._countsY[sy]++;
                    }
                }
            }
            else {
                this._countsX[x]++;
                this._countsY[y]++;
            }
        }
        this.reset();
    }
    merge(x, y, width, height) {
        if (x < 0 || y < 0)
            throw `illegal coordinate: ${x}:${y}`;
        if (width < 1 || height < 1)
            throw `illegal size: ${width}:${height}`;
        const merged = new MergedRegion(x, y, x + width - 1, y + height - 1);
        const origin = this.cell(x, y);
        if (origin.isRef)
            throw `cell is ref: ${x}:${y}`;
        if (origin.merged)
            throw `cell is merged: ${JSON.stringify(origin.merged)}`;
        origin.merged = merged;
        const hasValue = origin.value !== null;
        for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
            for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
                if (!(sx === x && sy === y)) {
                    const cell = this.cell(sx, sy);
                    if (cell.value)
                        throw `merging cell already has value: ${sx}:${sy}`;
                    if (cell.isRef)
                        throw `merging cell is ref: ${sx}:${sy}`;
                    cell.merged = merged;
                    if (hasValue) {
                        this._countsX[sx]++;
                        this._countsY[sy]++;
                    }
                }
            }
        }
    }
    remove(x, y) {
        if (x < 0 || y < 0)
            throw `illegal coordinate: ${x}:${y}`;
        const cell = this.cell(x, y);
        if (cell.isRef)
            throw `cell is ref: ${x}:${y}`;
        if (cell.value) {
            cell.value = null;
            if (cell.merged) {
                const merged = cell.merged;
                for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
                    for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
                        this._countsX[sx]--;
                        this._countsY[sy]--;
                    }
                }
            }
            else {
                this._countsX[x]--;
                this._countsY[y]--;
            }
        }
    }
    unmerge(x, y) {
        if (x < 0 || y < 0)
            throw `illegal coordinate: ${x}:${y}`;
        const origin = this.cell(x, y);
        if (origin.isRef)
            throw `cell is ref: ${x}:${y}`;
        if (origin.merged) {
            const hasValue = origin.value !== null;
            const merged = origin.merged;
            origin.merged = null;
            for (let sx = merged.from_x; sx <= merged.to_x; sx++) {
                for (let sy = merged.from_y; sy <= merged.to_y; sy++) {
                    if (!(sx === x && sy === y)) {
                        this.cell(sx, sy).merged = null;
                        if (hasValue) {
                            this._countsX[sx]--;
                            this._countsY[sy]--;
                        }
                    }
                }
            }
        }
    }
    cell(x, y) {
        if (x < 0 || y < 0)
            throw "illegal coordinate";
        this.expand(x, y);
        return this._cells[y][x];
    }
    expand(toX, toY) {
        while (this._limitY < toY) {
            this._limitY++;
            this._countsY[this._limitY] = 0;
            this._cells[this._limitY] = [];
            for (let x = 0; x <= this._limitX; x++) {
                this._cells[this._limitY][x] = new SelectableCell(x, this._limitY);
            }
        }
        while (this._limitX < toX) {
            this._limitX++;
            this._countsX[this._limitX] = 0;
            for (let y = 0; y <= this._limitY; y++) {
                this._cells[y][this._limitX] = new SelectableCell(this._limitX, y);
            }
        }
    }
    handleInput() {
        const joystick = this._joystick;
        if (joystick.moveUp.once()) {
            this.moveUp();
        }
        if (joystick.moveDown.once()) {
            this.moveDown();
        }
        if (joystick.moveLeft.once()) {
            this.moveLeft();
        }
        if (joystick.moveRight.once()) {
            this.moveRight();
        }
        if (joystick.hit.once()) {
            const selected = this.selected;
            if (selected) {
                const [, callback] = selected;
                pixi_js__WEBPACK_IMPORTED_MODULE_0__["sound"].play('confirm');
                callback();
            }
            else {
                pixi_js__WEBPACK_IMPORTED_MODULE_0__["sound"].play('cancel');
                console.warn("selected not found");
            }
        }
    }
}
class SelectableCell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.merged = null;
        this.value = null;
    }
    unmark() {
        if (this.value) {
            this.value[0].selected = false;
        }
    }
    mark() {
        if (this.value) {
            this.value[0].selected = true;
        }
    }
    get isRef() {
        return this.merged !== null && !(this.merged.from_x === this.x && this.merged.from_y === this.y);
    }
    get isSelectable() {
        return this.value !== null || this.isRef;
    }
}
class MergedRegion {
    constructor(from_x, from_y, to_x, to_y) {
        this.from_x = from_x;
        this.from_y = from_y;
        this.to_x = to_x;
        this.to_y = to_y;
    }
    contains(x, y) {
        return x >= this.from_x && x <= this.to_x && y >= this.from_y && y <= this.to_y;
    }
}
class VStack extends pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"] {
    constructor(options = {}) {
        super();
        this._width = 0;
        this._height = 0;
        this._dirtyLayout = false;
        this._spacing = options.spacing !== undefined ? options.spacing : Sizes.uiMargin;
        this._padding = options.padding !== undefined ? options.padding : Sizes.uiMargin;
        if (options.background) {
            this._background = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Graphics"]()
                .beginFill(options.background.color)
                .drawRect(0, 0, 1, 1)
                .endFill();
        }
        else {
            this._background = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"]();
        }
        this.addChild(this._background);
    }
    destroy(options) {
        super.destroy(options);
    }
    onChildrenChange() {
        this._dirtyLayout = true;
    }
    _calculateBounds() {
        this._bounds.addFrame(this.transform, 0, 0, this._width, this._height);
    }
    updateTransform() {
        if (this._dirtyLayout) {
            this.updateLayout();
        }
        super.updateTransform();
    }
    updateLayout() {
        let maxWidth = 0;
        let y = this._padding;
        const x = this._padding;
        let first = true;
        for (const child of this.children) {
            if (child === this._background)
                continue;
            if (!first)
                y += this._spacing;
            first = false;
            child.position.set(x, y);
            child.updateTransform();
            const bounds = child.getBounds();
            y += bounds.height;
            maxWidth = Math.max(maxWidth, bounds.width);
        }
        this._height = y + this._padding;
        this._width = maxWidth + this._padding * 2;
        this._background.width = this._width;
        this._background.height = this._height;
        this._calculateBounds();
        this._dirtyLayout = false;
    }
}
class HStack extends pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"] {
    constructor(options = {}) {
        super();
        this._width = 0;
        this._height = 0;
        this._dirtyLayout = false;
        this._spacing = options.spacing !== undefined ? options.spacing : Sizes.uiMargin;
        this._padding = options.padding !== undefined ? options.padding : Sizes.uiMargin;
        if (options.background) {
            this._background = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Graphics"]()
                .beginFill(options.background.color, options.background.alpha || 1)
                .drawRect(0, 0, 1, 1)
                .endFill();
        }
        else {
            this._background = new pixi_js__WEBPACK_IMPORTED_MODULE_0__["Container"]();
        }
        this.addChild(this._background);
    }
    destroy(options) {
        super.destroy(options);
    }
    onChildrenChange() {
        this._dirtyLayout = true;
    }
    _calculateBounds() {
        this._bounds.addFrame(this.transform, 0, 0, this._width, this._height);
    }
    updateTransform() {
        if (this._dirtyLayout) {
            this.updateLayout();
        }
        super.updateTransform();
    }
    updateLayout() {
        let maxHeight = 0;
        const y = this._padding;
        let x = this._padding;
        let first = true;
        for (const child of this.children) {
            if (child === this._background)
                continue;
            if (!first)
                x += this._spacing;
            first = false;
            child.position.set(x, y);
            child.updateTransform();
            const bounds = child.getBounds();
            x += bounds.width;
            maxHeight = Math.max(maxHeight, bounds.height);
        }
        this._width = x + this._padding;
        this._height = maxHeight + this._padding * 2;
        this._background.width = this._width;
        this._background.height = this._height;
        this._calculateBounds();
        this._dirtyLayout = false;
    }
}


/***/ }),

/***/ "./src/update.hero.scene.ts":
/*!**********************************!*\
  !*** ./src/update.hero.scene.ts ***!
  \**********************************/
/*! exports provided: UpdateHeroScene */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "UpdateHeroScene", function() { return UpdateHeroScene; });
/* harmony import */ var _characters__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./characters */ "./src/characters/index.ts");
/* harmony import */ var _inventory__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./inventory */ "./src/inventory/index.ts");
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ui */ "./src/ui.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_3__);




class UpdateHeroScene {
    constructor(controller, options) {
        this._title = null;
        this._sprite = null;
        this._spriteBg = null;
        this._state = null;
        this._inventory = null;
        this._buttons = [];
        this._controller = controller;
        this._hero = options.hero;
        this._options = options;
        this._selectable = new _ui__WEBPACK_IMPORTED_MODULE_2__["SelectableGrid"](controller.joystick);
    }
    init() {
        const layout = new _ui__WEBPACK_IMPORTED_MODULE_2__["Layout"]();
        this.renderTitle(layout);
        this.renderState(layout);
        this.renderIcon(layout);
        this.renderContinue(layout);
        layout.reset();
        layout.offset(256 + _ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin, 0);
        layout.commit();
        this.renderIncreaseHealth(layout);
        layout.reset();
        layout.offset(24 + _ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin * 2, 0);
        layout.commit();
        this.renderInventory(layout);
        this._selectable.reset();
        this._controller.app.ticker.add(this.handleInput, this);
    }
    destroy() {
        var _a, _b, _c, _d, _e;
        this._controller.app.ticker.remove(this.handleInput, this);
        (_a = this._title) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this._sprite) === null || _b === void 0 ? void 0 : _b.destroy();
        (_c = this._spriteBg) === null || _c === void 0 ? void 0 : _c.destroy();
        (_d = this._state) === null || _d === void 0 ? void 0 : _d.destroy();
        (_e = this._inventory) === null || _e === void 0 ? void 0 : _e.destroy();
        for (const button of this._buttons) {
            button.destroy();
        }
        this._sprite = null;
        this._spriteBg = null;
        this._title = null;
        this._state = null;
        this._inventory = null;
        this._buttons.splice(0, 1000);
    }
    pause() {
    }
    resume() {
    }
    renderTitle(layout) {
        this._title = new pixi_js__WEBPACK_IMPORTED_MODULE_3__["BitmapText"]("ROGUELIKE DUNGEON", { font: { name: 'alagard', size: 64 } });
        this._title.anchor = new pixi_js__WEBPACK_IMPORTED_MODULE_3__["Point"](0.5, 0);
        this._title.position.set(this._controller.app.screen.width >> 1, 64);
        this._controller.stage.addChild(this._title);
        layout.offset(0, 128 + _ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin);
        layout.commit();
    }
    renderState(layout) {
        layout.offset(_ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin, 0);
        layout.commit();
        this._state = new _characters__WEBPACK_IMPORTED_MODULE_0__["HeroStateView"](this._hero, { fixedHPSize: true });
        this._state.position.set(layout.x, layout.y);
        this._controller.stage.addChild(this._state);
        layout.offset(0, this._state.getBounds().height);
    }
    renderIcon(layout) {
        this._sprite = this._controller.resources.animated(this._hero.name + "_idle");
        const w = this._sprite.width;
        const h = this._sprite.height;
        this._sprite.width = 256 - (_ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin << 1);
        const scale = this._sprite.width / w;
        this._sprite.height = Math.floor(scale * h);
        const trimmedH = Math.floor(scale * this._sprite.texture.trim.height);
        const offsetY = this._sprite.height - trimmedH;
        layout.offset(0, _ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin);
        this._sprite.position.set(layout.x + _ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin, layout.y + _ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin - offsetY);
        this._spriteBg = new pixi_js__WEBPACK_IMPORTED_MODULE_3__["Graphics"]()
            .beginFill(_ui__WEBPACK_IMPORTED_MODULE_2__["Colors"].uiBackground)
            .drawRect(0, 0, 256, trimmedH + (_ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin << 1))
            .endFill();
        this._spriteBg.position.set(layout.x, layout.y);
        this._controller.stage.addChild(this._spriteBg, this._sprite);
        layout.offset(0, trimmedH + (_ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin << 1));
    }
    renderIncreaseHealth(layout) {
        const button = new _ui__WEBPACK_IMPORTED_MODULE_2__["Button"]({
            label: "+",
            width: 24,
            height: 24
        });
        button.position.set(layout.x, layout.y);
        this._selectable.set(1, 0, button, () => this._hero.increaseHealth());
        this._selectable.merge(1, 0, 1, 12);
        this._buttons.push(button);
        this._controller.stage.addChild(button);
        layout.offset(0, 24);
    }
    renderContinue(layout) {
        layout.offset(0, _ui__WEBPACK_IMPORTED_MODULE_2__["Sizes"].uiMargin);
        const button = new _ui__WEBPACK_IMPORTED_MODULE_2__["Button"]({
            label: "Continue ...",
            width: 256,
            height: 32,
        });
        button.position.set(layout.x, layout.y);
        this._selectable.set(0, 0, button, () => this._controller.generateDungeon(this._options));
        this._selectable.merge(0, 0, 1, 12);
        this._buttons.push(button);
        this._controller.stage.addChild(button);
        layout.offset(0, 32);
    }
    renderInventory(layout) {
        const controller = new _inventory__WEBPACK_IMPORTED_MODULE_1__["DefaultInventoryActionsController"](this._hero.inventory);
        this._inventory = new _inventory__WEBPACK_IMPORTED_MODULE_1__["InventoryView"](this._controller.resources, controller, this._selectable, 2, 0);
        this._inventory.position.set(layout.x, layout.y);
        this._controller.stage.addChild(this._inventory);
    }
    handleInput() {
        this._selectable.handleInput();
    }
}


/***/ }),

/***/ "./src/wfc/even.simple.tiled.ts":
/*!**************************************!*\
  !*** ./src/wfc/even.simple.tiled.ts ***!
  \**************************************/
/*! exports provided: Direction, CellType, TilesetRulesBuilder, EvenSimpleTiledModel, BorderConstraint, PathConstraint, RoomConstraint, DungeonCrawlerConstraint, EvenSimpleTiledModelTest */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Direction", function() { return Direction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CellType", function() { return CellType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TilesetRulesBuilder", function() { return TilesetRulesBuilder; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EvenSimpleTiledModel", function() { return EvenSimpleTiledModel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BorderConstraint", function() { return BorderConstraint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PathConstraint", function() { return PathConstraint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RoomConstraint", function() { return RoomConstraint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DungeonCrawlerConstraint", function() { return DungeonCrawlerConstraint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EvenSimpleTiledModelTest", function() { return EvenSimpleTiledModelTest; });
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./model */ "./src/wfc/model.ts");
/* harmony import */ var _rng__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../rng */ "./src/rng.ts");
/* harmony import */ var _tunneling__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../tunneling */ "./src/tunneling.ts");
/* harmony import */ var _indexer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../indexer */ "./src/indexer.ts");
/* harmony import */ var _tunneler__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../tunneler */ "./src/tunneler/index.ts");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! pixi.js */ "pixi.js");
/* harmony import */ var pixi_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(pixi_js__WEBPACK_IMPORTED_MODULE_5__);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






var Direction;
(function (Direction) {
    Direction[Direction["RIGHT"] = 2] = "RIGHT";
    Direction[Direction["DOWN"] = 1] = "DOWN";
})(Direction || (Direction = {}));
var CellType;
(function (CellType) {
    CellType[CellType["EMPTY"] = 0] = "EMPTY";
    CellType[CellType["FLOOR"] = 1] = "FLOOR";
    CellType[CellType["FLOOR_WALL_TOP"] = 2] = "FLOOR_WALL_TOP";
    CellType[CellType["WALL_MID"] = 3] = "WALL_MID";
    CellType[CellType["WALL_TOP"] = 4] = "WALL_TOP";
    CellType[CellType["WALL_SIDE"] = 5] = "WALL_SIDE";
})(CellType || (CellType = {}));
class TilesetRulesBuilder {
    constructor() {
        this._tilesIndex = _indexer__WEBPACK_IMPORTED_MODULE_3__["Indexer"].identity();
        this._cellsIndex = _indexer__WEBPACK_IMPORTED_MODULE_3__["Indexer"].array();
        this._rightIndex = _indexer__WEBPACK_IMPORTED_MODULE_3__["Indexer"].array();
        this._downIndex = _indexer__WEBPACK_IMPORTED_MODULE_3__["Indexer"].array();
    }
    addCell(floor, wall, type) {
        const floorId = floor ? this._tilesIndex.index(floor) : -1;
        const wallId = wall ? this._tilesIndex.index(wall) : -1;
        return this._cellsIndex.index([floorId, wallId, type]);
    }
    addRuleRight(first, next) {
        this._rightIndex.index([first, next]);
    }
    addRuleDown(first, next) {
        this._downIndex.index([first, next]);
    }
    build() {
        return {
            size: 16,
            tiles: this._tilesIndex.values,
            cells: this._cellsIndex.values,
            right: this._rightIndex.values,
            down: this._downIndex.values,
        };
    }
}
class EvenSimpleTiledModel extends _model__WEBPACK_IMPORTED_MODULE_0__["Model"] {
    constructor(resources, tileset, rng, width, height, constraints) {
        super(rng, width, height);
        this._app = null;
        this._resources = resources;
        this.weights = [];
        this.tileset = tileset;
        this._constraints = constraints;
        this.T = tileset.cells.length;
        for (let i = 0; i < this.T; i++) {
            this.weights[i] = 1;
        }
        const tmpPropagator = [];
        for (let direction = 0; direction < 4; direction++) {
            tmpPropagator[direction] = [];
            for (let cell1 = 0; cell1 < this.T; cell1++) {
                tmpPropagator[direction][cell1] = [];
                for (let cell2 = 0; cell2 < this.T; cell2++) {
                    tmpPropagator[direction][cell1][cell2] = false;
                }
            }
        }
        for (const [first, next] of tileset.right) {
            const opposite = _model__WEBPACK_IMPORTED_MODULE_0__["Model"].opposite[Direction.RIGHT];
            tmpPropagator[Direction.RIGHT][first][next] = true;
            tmpPropagator[opposite][next][first] = true;
        }
        for (const [first, next] of tileset.down) {
            const opposite = _model__WEBPACK_IMPORTED_MODULE_0__["Model"].opposite[Direction.DOWN];
            tmpPropagator[Direction.DOWN][first][next] = true;
            tmpPropagator[opposite][next][first] = true;
        }
        this.propagator = [];
        for (let direction = 0; direction < 4; direction++) {
            this.propagator[direction] = [];
            for (let cell1 = 0; cell1 < this.T; cell1++) {
                this.propagator[direction][cell1] = [];
                for (let cell2 = 0; cell2 < this.T; cell2++) {
                    if (tmpPropagator[direction][cell1][cell2]) {
                        this.propagator[direction][cell1].push(cell2);
                    }
                }
            }
        }
    }
    onBoundary(x, y) {
        return !this.periodic && (x < 0 || y < 0 || x >= this.FMX || y >= this.FMY);
    }
    clear() {
        super.clear();
        for (const constraint of this._constraints) {
            constraint.onClear();
            this.propagate();
        }
    }
    backtrackConstraint(index, pattern) {
        for (const constraint of this._constraints) {
            constraint.onBacktrack(index, pattern);
        }
    }
    banConstraint(index, pattern) {
        for (const constraint of this._constraints) {
            constraint.onBan(index, pattern);
        }
    }
    initConstraint() {
        for (const constraint of this._constraints) {
            constraint.init(this);
            if (this.status != _model__WEBPACK_IMPORTED_MODULE_0__["Resolution"].Undecided) {
                if (this.debug)
                    console.warn("failed init constraint", this.status);
                return;
            }
        }
    }
    stepConstraint() {
        for (const constraint of this._constraints) {
            constraint.check();
            if (this.status != _model__WEBPACK_IMPORTED_MODULE_0__["Resolution"].Undecided) {
                if (this.debug)
                    console.warn("failed step constraint check");
                return;
            }
            this.propagate();
            if (this.status != _model__WEBPACK_IMPORTED_MODULE_0__["Resolution"].Undecided) {
                if (this.debug)
                    console.warn("failed step constraint propagate");
                return;
            }
        }
        this.deferredConstraintsStep = false;
    }
    testObserved(i) {
        const x = i % this.FMX, y = Math.floor(i / this.FMX);
        if (!this.onBoundary(x, y)) {
            const patterns = this.wave[i].filter(v => v).length;
            console.assert(patterns === 1, `wave ${i} pattern count ${patterns}`);
        }
    }
    graphics(markup) {
        const scale = 1;
        const tilesize = this.tileset.size;
        console.log("tilesize", tilesize, this.tileset, this.tileset.size);
        if (this._app == null) {
            this._app = new pixi_js__WEBPACK_IMPORTED_MODULE_5__["Application"]({
                width: this.FMX * tilesize * scale,
                height: this.FMY * tilesize * scale,
                resolution: 1,
                antialias: false,
                autoStart: false,
                sharedTicker: false,
                sharedLoader: false
            });
            document.body.appendChild(this._app.view);
        }
        const app = this._app;
        this._app.stage.removeChildren();
        const container = new pixi_js__WEBPACK_IMPORTED_MODULE_5__["Container"]();
        container.scale.set(scale, scale);
        app.stage.addChild(container);
        if (this.observed != null) {
            for (let x = 0; x < this.FMX; x++) {
                for (let y = 0; y < this.FMY; y++) {
                    const [floor, wall] = this.tileset.cells[this.observed[x + y * this.FMX]];
                    if (floor >= 0) {
                        const sprite = this._resources.sprite(this.tileset.tiles[floor]);
                        sprite.position.set(x * tilesize, y * tilesize);
                        sprite.zIndex = 1;
                        container.addChild(sprite);
                    }
                    if (wall >= 0) {
                        const sprite = this._resources.sprite(this.tileset.tiles[wall]);
                        sprite.position.set(x * tilesize, y * tilesize);
                        sprite.zIndex = 2;
                        container.addChild(sprite);
                    }
                }
            }
        }
        else {
            for (let x = 0; x < this.FMX; x++) {
                for (let y = 0; y < this.FMY; y++) {
                    const a = this.wave[x + y * this.FMX];
                    let weightsSum = 0;
                    for (let t = 0; t < this.T; t++) {
                        if (a[t]) {
                            weightsSum += this.weights[t];
                        }
                    }
                    const alpha = 1 / weightsSum;
                    for (let t = 0; t < this.T; t++) {
                        if (a[t]) {
                            const [floor, wall] = this.tileset.cells[t];
                            const tiles = (floor >= 0 ? 1 : 0) + (wall >= 0 ? 1 : 0);
                            if (floor >= 0) {
                                const sprite = this._resources.sprite(this.tileset.tiles[floor]);
                                sprite.position.set(x * tilesize, y * tilesize);
                                sprite.zIndex = 1;
                                sprite.alpha = alpha * (1 / tiles) * this.weights[t];
                                container.addChild(sprite);
                            }
                            if (wall >= 0) {
                                const sprite = this._resources.sprite(this.tileset.tiles[wall]);
                                sprite.position.set(x * tilesize, y * tilesize);
                                sprite.zIndex = 2;
                                sprite.alpha = alpha * (1 / tiles) * this.weights[t];
                                container.addChild(sprite);
                            }
                        }
                    }
                }
            }
        }
        const graphics = new pixi_js__WEBPACK_IMPORTED_MODULE_5__["Graphics"]();
        container.addChild(graphics);
        graphics.lineStyle(1, 0xFF0000);
        for (const i of markup) {
            const x = i % this.FMX, y = Math.floor(i / this.FMX);
            graphics.drawRect(x * tilesize, y * tilesize, tilesize, tilesize);
        }
        app.render();
        const canvas = app.view;
        console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
    }
}
class BorderConstraint {
    constructor(isBorderCell) {
        this._model = null;
        this._isBorderCell = isBorderCell;
    }
    init(model) {
        this._model = model;
    }
    onClear() {
        console.log("on clear");
        const model = this._model;
        const indices = model.FMX * model.FMY;
        for (let i = 0; i < indices; i++) {
            const x = i % model.FMX, y = Math.floor(i / model.FMX);
            if (x === 0 || x === model.FMX - 1 || y === 0 || y === model.FMY - 1) {
                for (let t = 0; t < model.T; t++) {
                    if (model.wave[i][t] && !this._isBorderCell[t]) {
                        model.ban(i, t);
                    }
                }
            }
        }
    }
    onBan(_index, _pattern) {
    }
    onBacktrack(_index, _pattern) {
    }
    check() {
        return true;
    }
}
class PathConstraint {
    constructor(isPathCell) {
        this._model = null;
        this._graph = null;
        this._couldBePath = [];
        this._mustBePath = [];
        this._refresh = [];
        this._refreshQueue = [];
        this._isPathCell = isPathCell;
    }
    init(model) {
        this._model = model;
        const indices = model.FMX * model.FMY;
        this._couldBePath = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, false);
        this._mustBePath = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, false);
        this._refresh = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, true);
        this._refreshQueue = [];
    }
    onClear() {
        const indices = this._model.FMX * this._model.FMY;
        this._couldBePath = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, false);
        this._mustBePath = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, false);
        this._refresh = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, true);
        this._refreshQueue = [];
        for (let i = 0; i < indices; i++) {
            this._refreshQueue.push(i);
        }
        this.refreshAll();
        this._graph = this.createGraph();
    }
    onBacktrack(index, _pattern) {
        this.addRefresh(index);
    }
    onBan(index, _pattern) {
        this.addRefresh(index);
    }
    addRefresh(index) {
        if (!this._refresh[index]) {
            const FMX = this._model.FMX;
            const FMY = this._model.FMY;
            const x = index % FMX, y = Math.floor(index / FMX);
            this._refresh[index] = true;
            this._refreshQueue.push(index);
            for (let direction = 0; direction < 4; direction++) {
                const dx = _model__WEBPACK_IMPORTED_MODULE_0__["Model"].DX[direction], dy = _model__WEBPACK_IMPORTED_MODULE_0__["Model"].DY[direction];
                let sx = x + dx, sy = y + dy;
                if (this._model.onBoundary(sx, sy)) {
                    continue;
                }
                if (sx < 0)
                    sx += FMX;
                else if (sx >= FMX)
                    sx -= FMX;
                if (sy < 0)
                    sy += FMY;
                else if (sy >= FMY)
                    sy -= FMY;
                const s = sx + sy * FMX;
                if (!this._refresh[s]) {
                    this._refresh[s] = true;
                    this._refreshQueue.push(s);
                }
            }
        }
    }
    refreshAll() {
        const model = this._model;
        const T = model.T;
        while (this._refreshQueue.length > 0) {
            const i = this._refreshQueue.pop();
            this._refresh[i] = false;
            let pathCount = 0;
            let totalCount = 0;
            for (let t = 0; t < T; t++) {
                if (model.wave[i][t]) {
                    totalCount++;
                    if (this._isPathCell[t]) {
                        pathCount++;
                    }
                }
            }
            this._couldBePath[i] = pathCount > 0;
            this._mustBePath[i] = pathCount > 0 && totalCount === pathCount;
        }
    }
    check() {
        for (;;) {
            this.refreshAll();
            const isArticulation = this.getArticulationPoints();
            if (isArticulation == null) {
                if (this._model.debug)
                    console.error("no articulation");
                this._model.status = _model__WEBPACK_IMPORTED_MODULE_0__["Resolution"].Contradiction;
                return;
            }
            if (this.applyArticulationPoints(isArticulation)) {
                if (this._model.debug) {
                    console.log("articulation");
                    const markup = isArticulation
                        .map((v, i) => [v, i])
                        .filter(a => a[0])
                        .map(a => a[1]);
                    this._model.graphics(markup);
                    console.log("continue articulation loop");
                }
            }
            else {
                break;
            }
        }
    }
    applyArticulationPoints(isArticulation) {
        const model = this._model;
        const FMX = model.FMX;
        const FMY = model.FMY;
        const indices = FMX * FMY;
        let changed = false;
        for (let i = 0; i < indices; i++) {
            if (isArticulation[i] && !this._mustBePath[i]) {
                if (model.debug)
                    console.log("articulation", i);
                const x = i % model.FMX, y = Math.floor(i / model.FMX);
                if (model.debug)
                    console.log("x, y, i", x, y, i);
                for (let t = 0; t < model.T; t++) {
                    if (model.wave[i][t]) {
                        if (this._isPathCell[t]) {
                            if (model.debug)
                                console.log("ban not path", i, t);
                            model.ban(i, t);
                            changed = true;
                        }
                    }
                }
            }
        }
        return changed;
    }
    getArticulationPoints() {
        const walkable = this._couldBePath;
        const relevant = this._mustBePath;
        const model = this._model;
        const graph = this._graph;
        const indices = walkable.length;
        const low = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, 0);
        let num = 1;
        const dfsNum = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, 0);
        const markup = [];
        const isArticulation = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(indices, false);
        function cutVertex(initialU) {
            const stack = [];
            stack.push(new CutVertexFrame(initialU));
            let childRelevantSubtree = false;
            let childCount = 0;
            for (;;) {
                const frameIndex = stack.length - 1;
                const frame = stack[frameIndex];
                const u = frame.u;
                let switchState = frame.state;
                let loop;
                do {
                    loop = false;
                    switch (switchState) {
                        case 0: {
                            const isRelevant = relevant != null && relevant[u];
                            if (isRelevant) {
                                isArticulation[u] = true;
                            }
                            frame.isRelevantSubtree = isRelevant;
                            low[u] = dfsNum[u] = num++;
                            markup.push(u);
                            switchState = 1;
                            loop = true;
                            break;
                        }
                        case 1: {
                            const neighbours = graph.neighbours[u];
                            const neighbourIndex = frame.neighbourIndex;
                            if (neighbourIndex >= neighbours.length) {
                                switchState = 3;
                                loop = true;
                                break;
                            }
                            const v = neighbours[neighbourIndex];
                            if (!walkable[v]) {
                                frame.neighbourIndex = neighbourIndex + 1;
                                switchState = 1;
                                loop = true;
                                break;
                            }
                            const unvisited = dfsNum[v] === 0;
                            if (unvisited) {
                                stack.push(new CutVertexFrame(v));
                                frame.state = 2;
                                switchState = 2;
                                stack[frameIndex] = frame;
                                break;
                            }
                            else {
                                low[u] = Math.min(low[u], dfsNum[v]);
                            }
                            frame.neighbourIndex = neighbourIndex + 1;
                            switchState = 1;
                            loop = true;
                            break;
                        }
                        case 2: {
                            const neighbours = graph.neighbours[u];
                            const neighbourIndex = frame.neighbourIndex;
                            const v = neighbours[neighbourIndex];
                            if (frameIndex == 0) {
                                childCount++;
                            }
                            if (childRelevantSubtree) {
                                frame.isRelevantSubtree = true;
                            }
                            if (low[v] >= dfsNum[u]) {
                                if (relevant == null || childRelevantSubtree) {
                                    isArticulation[u] = true;
                                }
                            }
                            low[u] = Math.min(low[u], low[v]);
                            frame.neighbourIndex = neighbourIndex + 1;
                            switchState = 1;
                            loop = true;
                            break;
                        }
                        case 3: {
                            if (frameIndex == 0) {
                                return childCount;
                            }
                            else {
                                childRelevantSubtree = frame.isRelevantSubtree;
                                stack.splice(frameIndex, 1);
                                break;
                            }
                        }
                    }
                } while (loop);
            }
        }
        for (let i = 0; i < indices; i++) {
            if (!walkable[i])
                continue;
            if (!relevant[i])
                continue;
            if (dfsNum[i] != 0)
                continue;
            cutVertex(i);
            break;
        }
        for (let i = 0; i < indices; i++) {
            if (relevant[i] && dfsNum[i] == 0) {
                if (model.debug) {
                    console.warn("walkable:");
                    const markupW = walkable
                        .map((v, i) => [v, i])
                        .filter(a => a[0])
                        .map(a => a[1]);
                    model.graphics(markupW);
                    console.warn("visited");
                    model.graphics(markup);
                    const w = model.FMX;
                    const x = i % w, y = Math.floor(i / w);
                    console.error(`not visited relevant point i=${i} x=${x} y=${y}`);
                    console.warn('graph neighbours', graph.neighbours[i]);
                    model.graphics([i]);
                }
                return null;
            }
        }
        for (let i = 0; i < indices; i++) {
            if (!walkable[i])
                continue;
            if (relevant[i])
                continue;
            if (dfsNum[i] != 0)
                continue;
            if (isArticulation[i])
                continue;
            const childCount = cutVertex(i);
            isArticulation[i] = childCount > 1;
        }
        return isArticulation;
    }
    createGraph() {
        const model = this._model;
        const nodeCount = model.FMX * model.FMY;
        const neighbours = [];
        for (let i = 0; i < nodeCount; i++) {
            neighbours[i] = [];
            const x = i % model.FMX, y = Math.floor(i / model.FMX);
            for (let direction = 0; direction < 4; direction++) {
                const dx = _model__WEBPACK_IMPORTED_MODULE_0__["Model"].DX[direction], dy = _model__WEBPACK_IMPORTED_MODULE_0__["Model"].DY[direction];
                let sx = x + dx, sy = y + dy;
                if (!model.periodic && (sx >= model.FMX || sy >= model.FMY || sx < 0 || sy < 0)) {
                    continue;
                }
                if (sx < 0)
                    sx += model.FMX;
                else if (sx >= model.FMX)
                    sx -= model.FMX;
                if (sy < 0)
                    sy += model.FMY;
                else if (sy >= model.FMY)
                    sy -= model.FMY;
                const s = sx + sy * model.FMX;
                neighbours[i].push(s);
            }
        }
        return {
            nodeCount: nodeCount,
            neighbours: neighbours,
        };
    }
}
class CutVertexFrame {
    constructor(u) {
        this.state = 0;
        this.neighbourIndex = 0;
        this.isRelevantSubtree = false;
        this.u = u;
    }
}
class RoomConstraint {
    constructor(isRoomCell, denyOther, tunneling) {
        this._isRoomCell = [];
        this._model = null;
        this._isRoomCell = isRoomCell;
        this._denyOther = denyOther;
        this._tunnelingOptions = tunneling;
    }
    init(model) {
        this._model = model;
    }
    onClear() {
        const model = this._model;
        const tunneling = new _tunneling__WEBPACK_IMPORTED_MODULE_2__["TunnelingAlgorithm"](model.rng, model.FMX, model.FMY, this._tunnelingOptions);
        tunneling.generate();
        const isRoom = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(model.FMX * model.FMY, false);
        for (const room of tunneling.rooms) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    isRoom[x + y * model.FMX] = true;
                }
            }
        }
        for (let i = 0; i < isRoom.length; i++) {
            for (let t = 0; t < model.T; t++) {
                if (isRoom[i]) {
                    if (!this._isRoomCell[t]) {
                        model.ban(i, t);
                    }
                }
                else if (this._denyOther) {
                    if (this._isRoomCell[t]) {
                        model.ban(i, t);
                    }
                }
            }
        }
    }
    check() {
    }
    onBacktrack(_index, _pattern) {
    }
    onBan(_index, _pattern) {
    }
}
class DungeonCrawlerConstraint {
    constructor(config) {
        this._model = null;
        this._config = config;
    }
    init(model) {
        this._model = model;
    }
    onClear() {
        const model = this._model;
        console.time("crawler");
        const crawler = new _tunneler__WEBPACK_IMPORTED_MODULE_4__["DungeonCrawler"](this._config, model.rng);
        crawler.generate();
        console.timeEnd("crawler");
        console.time("crawler constraint");
        const isOpen = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(model.FMX * model.FMY, false);
        for (let y = 0; y < crawler.config.height; y++) {
            for (let x = 0; x < crawler.config.width; x++) {
                const i = x + y * model.FMX;
                isOpen[i] = crawler.isMapOpen({ x: x, y: y });
            }
        }
        function onlyFloorAround(i) {
            const x = i % model.FMX, y = Math.floor(i / model.FMX);
            for (let dy = 0; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx !== 0 || dy !== 0) {
                        const sx = x + dx;
                        const sy = y + dy;
                        if (model.onBoundary(sx, sy))
                            continue;
                        if (!isOpen[sx + sy * model.FMX]) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        function hasFloorAround(i, h = 2) {
            const x = i % model.FMX, y = Math.floor(i / model.FMX);
            for (let dy = -1; dy <= h; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx !== 0 || dy !== 0) {
                        const sx = x + dx;
                        const sy = y + dy;
                        if (model.onBoundary(sx, sy))
                            continue;
                        if (isOpen[sx + sy * model.FMX]) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        function checkOpen(i, dx, dy) {
            const x = i % model.FMX, y = Math.floor(i / model.FMX);
            const sx = x + dx;
            const sy = y + dy;
            if (model.onBoundary(sx, sy))
                return null;
            return isOpen[sx + sy * model.FMX];
        }
        for (let i = 0; i < isOpen.length; i++) {
            const possibleTypes = Object(_model__WEBPACK_IMPORTED_MODULE_0__["buffer"])(6, false);
            const bottom = checkOpen(i, 0, 1);
            if (isOpen[i]) {
                possibleTypes[CellType.EMPTY] = false;
                possibleTypes[CellType.FLOOR] = true;
                if (!onlyFloorAround(i)) {
                    possibleTypes[CellType.FLOOR_WALL_TOP] = true;
                }
            }
            else {
                if (hasFloorAround(i)) {
                    const top = checkOpen(i, 0, -1);
                    possibleTypes[CellType.EMPTY] = !(top === true || bottom === true);
                    possibleTypes[CellType.WALL_MID] = top === true || bottom === true;
                    possibleTypes[CellType.WALL_TOP] = true;
                    possibleTypes[CellType.WALL_SIDE] = true;
                }
                else {
                    possibleTypes[CellType.EMPTY] = true;
                }
            }
            for (let t = 0; t < model.T; t++) {
                const type = model.tileset.cells[t][2];
                if (!possibleTypes[type]) {
                    model.ban(i, t);
                }
            }
        }
        console.timeEnd("crawler constraint");
    }
    check() {
    }
    onBacktrack(_index, _pattern) {
    }
    onBan(_index, _pattern) {
    }
}
class EvenSimpleTiledModelTest {
    static test(resources) {
        return __awaiter(this, void 0, void 0, function* () {
            const loader = new pixi_js__WEBPACK_IMPORTED_MODULE_5__["Loader"]();
            loader.add("village.rules.json");
            yield new Promise((resolve) => loader.load(() => resolve()));
            const tileset = loader.resources["village.rules.json"].data;
            console.log("tileset", tileset);
            const filter = (regex) => {
                const tiles = tileset.tiles.map(t => !!t.match(regex));
                return tileset.cells.map(cell => {
                    const [f, w] = cell;
                    return f >= 0 && tiles[f] && w === -1;
                });
            };
            const borderCells = filter(/^grass_\d+\.png$/);
            const pathCells = filter(/^road_\d+\.png$/);
            const roomCells = filter(/^wood_floor_\d+\.png$/);
            console.log("borderCells", borderCells);
            console.log("pathCells", pathCells);
            console.log("roomCells", roomCells);
            const model = new EvenSimpleTiledModel(resources, tileset, _rng__WEBPACK_IMPORTED_MODULE_1__["RNG"].create(), 50, 50, [
                new BorderConstraint(borderCells),
                new RoomConstraint(roomCells, true, {
                    roomMaxW: 7,
                    roomMaxH: 5,
                    maxCorrDist: 20,
                    minCorrDistX: 5,
                    minCorrDistY: 10,
                }),
                new PathConstraint(pathCells),
            ]);
            console.time("model loop run");
            let state;
            for (;;) {
                console.time("model run");
                state = yield model.run(10000);
                console.timeEnd("model run");
                if (state !== _model__WEBPACK_IMPORTED_MODULE_0__["Resolution"].Decided) {
                    console.error("failed run model");
                }
                else {
                    console.log("success run model");
                    break;
                }
            }
            console.timeEnd("model loop run");
            console.log("model", model);
            model.graphics([]);
        });
    }
}


/***/ }),

/***/ "./src/wfc/model.ts":
/*!**************************!*\
  !*** ./src/wfc/model.ts ***!
  \**************************/
/*! exports provided: buffer, Color, Tile, Resolution, Model */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "buffer", function() { return buffer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Color", function() { return Color; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Tile", function() { return Tile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Resolution", function() { return Resolution; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Model", function() { return Model; });
/* harmony import */ var _concurency__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../concurency */ "./src/concurency.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function buffer(size, value) {
    const a = [];
    for (let i = 0; i < size; i++) {
        a.push(value);
    }
    return a;
}
class Color {
    constructor(R, G, B, A = 255) {
        this.R = R;
        this.G = G;
        this.B = B;
        this.A = A;
    }
    static fromRgb(rgb) {
        const r = (rgb >> 16) & 0xFF;
        const g = (rgb >> 8) & 0xFF;
        const b = rgb & 0xFF;
        return new Color(r, g, b);
    }
    static fromImage(imageData, x, y) {
        return Color.fromBuffer(imageData.data, imageData.width, x, y);
    }
    static fromBuffer(buffer, w, x, y) {
        const offset = 4 * (y * w + x);
        const R = buffer[offset];
        const G = buffer[offset + 1];
        const B = buffer[offset + 2];
        const A = buffer[offset + 3];
        return new Color(R, G, B, A);
    }
    equals(that) {
        return this.R === that.R &&
            this.G === that.G &&
            this.B === that.B &&
            this.A === that.A;
    }
}
class Tile {
    constructor(value, color, equal = (a, b) => a === b) {
        this.value = value;
        this.color = color;
        this._equal = equal;
    }
    equals(that) {
        return that._equal(this.value, that.value);
    }
}
var Resolution;
(function (Resolution) {
    Resolution[Resolution["Decided"] = 0] = "Decided";
    Resolution[Resolution["Undecided"] = -1] = "Undecided";
    Resolution[Resolution["Contradiction"] = -2] = "Contradiction";
})(Resolution || (Resolution = {}));
class Model {
    constructor(rng, width, height) {
        this.wave = [];
        this.propagator = [];
        this.compatible = [];
        this.observed = null;
        this.toPropagate = [];
        this.backtrackItems = [];
        this._backtrackItemsLengths = [];
        this._prevChoices = [];
        this._droppedBacktrackItemsCount = 0;
        this.T = 0;
        this.periodic = false;
        this.weights = [];
        this.weightLogWeights = [];
        this.sumsOfOnes = [];
        this.sumOfWeights = 0;
        this.sumOfWeightLogWeights = 0;
        this.startingEntropy = 0;
        this.sumsOfWeights = [];
        this.sumsOfWeightLogWeights = [];
        this.entropies = [];
        this.status = Resolution.Undecided;
        this.deferredConstraintsStep = false;
        this.debug = false;
        this.rng = rng;
        this.FMX = width;
        this.FMY = height;
    }
    get percent() {
        let count = 0;
        for (let i = 0; i < this.wave.length; i++) {
            if (this.sumsOfOnes[i] === 1) {
                count++;
            }
        }
        return count * 100.0 / this.wave.length;
    }
    init() {
        this.wave = buffer(this.FMX * this.FMY, []);
        this.compatible = [];
        for (let i = 0; i < this.wave.length; i++) {
            this.wave[i] = buffer(this.T, true);
            this.compatible[i] = [];
            for (let t = 0; t < this.T; t++) {
                this.compatible[i][t] = buffer(4, 0);
            }
        }
        this.weightLogWeights = [];
        this.sumOfWeights = 0;
        this.sumOfWeightLogWeights = 0;
        for (let t = 0; t < this.T; t++) {
            this.weightLogWeights[t] = this.weights[t] * Math.log(this.weights[t]);
            this.sumOfWeights += this.weights[t];
            this.sumOfWeightLogWeights += this.weightLogWeights[t];
        }
        this.startingEntropy = Math.log(this.sumOfWeights) - this.sumOfWeightLogWeights / this.sumOfWeights;
        this.status = Resolution.Undecided;
        this.initConstraint();
    }
    clear() {
        this.sumsOfOnes = [];
        this.sumsOfWeights = [];
        this.sumsOfWeightLogWeights = [];
        this.entropies = [];
        for (let i = 0; i < this.wave.length; i++) {
            for (let t = 0; t < this.T; t++) {
                this.wave[i][t] = true;
                for (let d = 0; d < 4; d++) {
                    this.compatible[i][t][d] = this.propagator[Model.opposite[d]][t].length;
                }
            }
            this.sumsOfOnes[i] = this.weights.length;
            this.sumsOfWeights[i] = this.sumOfWeights;
            this.sumsOfWeightLogWeights[i] = this.sumOfWeightLogWeights;
            this.entropies[i] = this.startingEntropy;
        }
        this.toPropagate = [];
        this.backtrackItems = [];
        this._backtrackItemsLengths = [0];
        this._droppedBacktrackItemsCount = 0;
        this._prevChoices = [];
        this.status = Resolution.Undecided;
    }
    run(limit = 0, debug = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.wave.length === 0) {
                console.time("model.init");
                this.init();
                console.timeEnd("model.init");
            }
            console.time("model.clear");
            this.clear();
            console.timeEnd("model.clear");
            console.time("model.run");
            this.debug = debug;
            let i = 0;
            for (; i < limit || limit === 0; i++) {
                if (i % 50 === 0) {
                    yield Object(_concurency__WEBPACK_IMPORTED_MODULE_0__["yields"])();
                }
                if (this.debug) {
                    console.log("step", i);
                }
                this.step();
                if (this.debug) {
                    console.log("after step", i);
                    this.graphics([]);
                }
                if (this.status !== Resolution.Undecided) {
                    break;
                }
            }
            console.timeEnd("model.run");
            console.log(`complete, steps: ${i}`);
            return this.status;
        });
    }
    step() {
        let index = -1;
        let pattern;
        let restart = false;
        if (this.deferredConstraintsStep) {
            if (this.debug)
                console.log("step constraint");
            this.stepConstraint();
        }
        if (this.status != Resolution.Undecided) {
            index = 0;
            restart = true;
            if (this.debug)
                console.log("restart = true");
        }
        if (!restart) {
            console.assert(this.toPropagate.length == 0);
            this._backtrackItemsLengths.push(this._droppedBacktrackItemsCount + this.backtrackItems.length);
            [index, pattern] = this.observe();
            if (this.debug)
                console.log("observed", index, pattern);
            if (index !== -1) {
                if (this.debug)
                    console.log("push to prev choices");
                this._prevChoices.push([index, pattern]);
            }
        }
        do {
            if (this.debug)
                console.log("do loop");
            restart = false;
            if (this.debug)
                console.log("status", this.status);
            if (this.status === Resolution.Undecided)
                this.propagate();
            if (this.status === Resolution.Undecided)
                this.stepConstraint();
            if (index === -1 && this.status === Resolution.Undecided) {
                if (this.debug)
                    console.log("decided");
                this.status = Resolution.Decided;
                return this.status;
            }
            if (this.status === Resolution.Contradiction) {
                if (this.debug)
                    console.log("contradiction");
                index = 0;
                for (;;) {
                    if (this.debug)
                        console.log("while backtrack");
                    if (this._backtrackItemsLengths.length == 1) {
                        if (this.debug)
                            console.log("We've backtracked as much as we can, but, it's still not possible. That means it is impossible");
                        return Resolution.Contradiction;
                    }
                    this.backtrack();
                    const item = this._prevChoices.pop();
                    this.toPropagate = [];
                    this.status = Resolution.Undecided;
                    if (this.debug) {
                        console.log("Mark the given choice as impossible", item[0], item[1]);
                        this.graphics([item[0]]);
                    }
                    if (this.internalBan(item[0], item[1])) {
                        this.status = Resolution.Contradiction;
                    }
                    if (this.status === Resolution.Undecided)
                        this.propagate();
                    if (this.status === Resolution.Contradiction) {
                        if (this.debug)
                            console.log("If still in contradiction, repeat backtracking");
                        continue;
                    }
                    else {
                        if (this.debug)
                            console.log("// Include the last ban as part of the previous backtrack");
                        console.assert(this.toPropagate.length === 0);
                        this._backtrackItemsLengths.pop();
                        this._backtrackItemsLengths.push(this._droppedBacktrackItemsCount + this.backtrackItems.length);
                    }
                    if (this.debug)
                        console.log("restart = true and break");
                    restart = true;
                    break;
                }
            }
        } while (restart);
        return this.status;
    }
    observe() {
        if (this.debug)
            console.log("observe");
        let min = 1E+3;
        let argmin = -1;
        for (let i = 0; i < this.wave.length; i++) {
            if (this.onBoundary(i % this.FMX, Math.floor(i / this.FMX)))
                continue;
            const amount = this.sumsOfOnes[i];
            if (amount === 0) {
                if (this.debug)
                    console.error(`[wave=${i}] found zero sum of ones`);
                if (this.debug)
                    this.graphics([i]);
                this.status = Resolution.Contradiction;
                return [-1, -1];
            }
            const entropy = this.entropies[i];
            if (amount > 1 && entropy <= min) {
                const noise = 1E-6 * this.rng.float();
                if (entropy + noise < min) {
                    min = entropy + noise;
                    argmin = i;
                }
            }
        }
        if (argmin == -1) {
            if (this.debug)
                console.log("complete observed");
            this.observed = buffer(this.FMX * this.FMY, 0);
            for (let i = 0; i < this.wave.length; i++) {
                const x = i % this.FMX, y = Math.floor(i / this.FMX);
                if (this.onBoundary(x, y)) {
                    continue;
                }
                this.testObserved(i);
                for (let t = 0; t < this.T; t++) {
                    if (this.wave[i][t]) {
                        this.observed[i] = t;
                        break;
                    }
                }
            }
            return [-1, -1];
        }
        let distributionSum = 0;
        const distribution = [];
        for (let t = 0; t < this.T; t++) {
            distribution[t] = this.wave[argmin][t] ? this.weights[t] : 0;
            distributionSum += distribution[t];
        }
        let rnd = this.rng.float() * distributionSum;
        let r = 0;
        for (const weight of distribution) {
            rnd -= weight;
            if (rnd < 0)
                break;
            r++;
        }
        const w = this.wave[argmin];
        for (let t = 0; t < this.T; t++) {
            if (w[t] != (t == r)) {
                if (this.debug)
                    console.log("observe select");
                if (this.internalBan(argmin, t)) {
                    this.status = Resolution.Contradiction;
                }
            }
        }
        if (this.debug) {
            console.log("observed", [argmin, r]);
            this.graphics([argmin]);
        }
        return [argmin, r];
    }
    propagate() {
        while (this.toPropagate.length > 0) {
            const [i, t] = this.toPropagate.pop();
            const x = i % this.FMX, y = Math.floor(i / this.FMX);
            for (let direction = 0; direction < 4; direction++) {
                const dx = Model.DX[direction], dy = Model.DY[direction];
                let sx = x + dx, sy = y + dy;
                if (this.onBoundary(sx, sy)) {
                    continue;
                }
                if (sx < 0)
                    sx += this.FMX;
                else if (sx >= this.FMX)
                    sx -= this.FMX;
                if (sy < 0)
                    sy += this.FMY;
                else if (sy >= this.FMY)
                    sy -= this.FMY;
                const s = sx + sy * this.FMX;
                const pattern1 = this.propagator[direction][t];
                const compat = this.compatible[s];
                for (const st of pattern1) {
                    const comp = compat[st];
                    comp[direction]--;
                    if (comp[direction] == 0) {
                        if (this.internalBan(s, st)) {
                            this.status = Resolution.Contradiction;
                        }
                    }
                }
            }
            if (this.status == Resolution.Contradiction) {
                break;
            }
        }
    }
    ban(index, pattern) {
        if (this.debug)
            console.log("ban", index, pattern);
        if (this.wave[index][pattern]) {
            this.deferredConstraintsStep = true;
            if (this.internalBan(index, pattern)) {
                return this.status = Resolution.Contradiction;
            }
        }
        this.propagate();
        return this.status;
    }
    internalBan(index, pattern) {
        if (this.debug)
            console.log("internal ban", index, pattern);
        this.wave[index][pattern] = false;
        const comp = this.compatible[index][pattern];
        for (let d = 0; d < 4; d++) {
            comp[d] -= this.T;
        }
        this.toPropagate.push([index, pattern]);
        this.sumsOfOnes[index] -= 1;
        this.sumsOfWeights[index] -= this.weights[pattern];
        this.sumsOfWeightLogWeights[index] -= this.weightLogWeights[pattern];
        const sum = this.sumsOfWeights[index];
        this.entropies[index] = Math.log(sum) - this.sumsOfWeightLogWeights[index] / sum;
        this.backtrackItems.push([index, pattern]);
        this.banConstraint(index, pattern);
        if (this.sumsOfOnes[index] === 0) {
            if (this.debug) {
                console.error("sum is zero", index);
                this.graphics([index]);
            }
            return true;
        }
        else {
            return false;
        }
    }
    backtrack() {
        const targetLength = this._backtrackItemsLengths.pop() - this._droppedBacktrackItemsCount;
        if (this.debug)
            console.warn("backtrack", targetLength);
        const markup = [];
        const toPropagateSet = new Set(this.toPropagate.map((i) => i.join(",")));
        while (this.backtrackItems.length > targetLength) {
            const [index, patternIndex] = this.backtrackItems.pop();
            markup.push(index);
            const comp = this.compatible[index][patternIndex];
            for (let d = 0; d < 4; d++) {
                comp[d] += this.T;
            }
            this.wave[index][patternIndex] = true;
            this.sumsOfOnes[index] += 1;
            this.sumsOfWeights[index] += this.weights[patternIndex];
            this.sumsOfWeightLogWeights[index] += this.weightLogWeights[patternIndex];
            const sum = this.sumsOfWeights[index];
            this.entropies[index] = Math.log(sum) - this.sumsOfWeightLogWeights[index] / sum;
            if (!toPropagateSet.has([index, patternIndex].join(","))) {
                const x = index % this.FMX, y = Math.floor(index / this.FMX);
                for (let direction = 0; direction < 4; direction++) {
                    const dx = Model.DX[direction], dy = Model.DY[direction];
                    let sx = x + dx, sy = y + dy;
                    if (this.onBoundary(sx, sy)) {
                        continue;
                    }
                    if (sx < 0)
                        sx += this.FMX;
                    else if (sx >= this.FMX)
                        sx -= this.FMX;
                    if (sy < 0)
                        sy += this.FMY;
                    else if (sy >= this.FMY)
                        sy -= this.FMY;
                    const s = sx + sy * this.FMX;
                    markup.push(s);
                    const pattern = this.propagator[direction][patternIndex];
                    for (const st of pattern) {
                        this.compatible[s][st][direction]++;
                    }
                }
            }
            this.backtrackConstraint(index, patternIndex);
        }
        if (this.debug) {
            console.log("backtracked");
            this.graphics(markup);
        }
    }
}
Model.DX = [-1, 0, 1, 0];
Model.DY = [0, 1, 0, -1];
Model.opposite = [2, 3, 0, 1];


/***/ }),

/***/ "pixi-layers":
/*!******************************!*\
  !*** external "PIXI.layers" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = PIXI.layers;

/***/ }),

/***/ "pixi-sound":
/*!*****************************!*\
  !*** external "PIXI.sound" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = PIXI.sound;

/***/ }),

/***/ "pixi.js":
/*!***********************!*\
  !*** external "PIXI" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = PIXI;

/***/ })

/******/ });
//# sourceMappingURL=bundle.js.map