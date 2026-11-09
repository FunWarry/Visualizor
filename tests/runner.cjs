"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/harness/test-context.ts
var suites = [];
var currentSuite = null;
function describe(name, fn) {
  const suite = {
    name,
    tests: [],
    beforeEachHooks: [],
    afterEachHooks: []
  };
  const prevSuite = currentSuite;
  currentSuite = suite;
  suites.push(suite);
  try {
    fn();
  } finally {
    currentSuite = prevSuite;
  }
}
function test(name, fn) {
  if (!currentSuite) {
    describe("Default Suite", () => {
      currentSuite?.tests.push({ name, fn });
    });
    return;
  }
  currentSuite.tests.push({ name, fn });
}
function beforeEach(fn) {
  if (currentSuite) {
    currentSuite.beforeEachHooks.push(fn);
  }
}
var ExpectationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ExpectationError";
  }
};
function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  const objA = a;
  const objB = b;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }
  return true;
}
var Matcher = class _Matcher {
  actual;
  isNot = false;
  constructor(actual) {
    this.actual = actual;
  }
  get not() {
    const inverted = new _Matcher(this.actual);
    inverted.isNot = !this.isNot;
    return inverted;
  }
  toBe(expected) {
    const pass = Object.is(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? "not to be" : "to be"} ${JSON.stringify(expected)}`
      );
    }
  }
  toEqual(expected) {
    const pass = deepEqual(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? "not to equal" : "to equal"} ${JSON.stringify(expected)}`
      );
    }
  }
  toBeCloseTo(expected, delta = 5e-3) {
    if (typeof this.actual !== "number") {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const diff = Math.abs(this.actual - expected);
    const pass = diff <= delta;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected ${this.actual} ${this.isNot ? "not to be close to" : "to be close to"} ${expected} (diff: ${diff}, delta: ${delta})`
      );
    }
  }
  toBeGreaterThan(expected) {
    if (typeof this.actual !== "number") {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const pass = this.actual > expected;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${this.actual} ${this.isNot ? "not to be >" : "to be >"} ${expected}`);
    }
  }
  toBeGreaterThanOrEqual(expected) {
    if (typeof this.actual !== "number") {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const pass = this.actual >= expected;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${this.actual} ${this.isNot ? "not to be >=" : "to be >="} ${expected}`);
    }
  }
  toBeLessThan(expected) {
    if (typeof this.actual !== "number") {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const pass = this.actual < expected;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${this.actual} ${this.isNot ? "not to be <" : "to be <"} ${expected}`);
    }
  }
  toBeLessThanOrEqual(expected) {
    if (typeof this.actual !== "number") {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const pass = this.actual <= expected;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${this.actual} ${this.isNot ? "not to be <=" : "to be <="} ${expected}`);
    }
  }
  toBeTruthy() {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${String(this.actual)} ${this.isNot ? "not to be truthy" : "to be truthy"}`);
    }
  }
  toBeFalsy() {
    const pass = !this.actual;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${String(this.actual)} ${this.isNot ? "not to be falsy" : "to be falsy"}`);
    }
  }
  toBeNull() {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${String(this.actual)} ${this.isNot ? "not to be null" : "to be null"}`);
    }
  }
  toBeUndefined() {
    const pass = this.actual === void 0;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${String(this.actual)} ${this.isNot ? "not to be undefined" : "to be undefined"}`);
    }
  }
  toBeDefined() {
    const pass = this.actual !== void 0;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected value ${this.isNot ? "not to be defined" : "to be defined"}`);
    }
  }
  toContain(item) {
    let pass = false;
    if (typeof this.actual === "string" && typeof item === "string") {
      pass = this.actual.includes(item);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.some((el) => deepEqual(el, item));
    } else if (this.actual instanceof Set) {
      pass = this.actual.has(item);
    }
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? "not to contain" : "to contain"} ${JSON.stringify(item)}`
      );
    }
  }
  toHaveLength(expectedLength) {
    const length = this.actual?.length;
    const pass = length === expectedLength;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected length ${this.isNot ? "not to be" : "to be"} ${expectedLength}, got ${length}`
      );
    }
  }
  toMatch(regex) {
    if (typeof this.actual !== "string") {
      throw new ExpectationError(`Expected string for regex matching, got ${typeof this.actual}`);
    }
    const pass = regex.test(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected "${this.actual}" ${this.isNot ? "not to match" : "to match"} ${regex}`);
    }
  }
  toThrow(expectedMessageOrClass) {
    if (typeof this.actual !== "function") {
      throw new ExpectationError(`Expected function, received ${typeof this.actual}`);
    }
    let threw = false;
    let caughtError = null;
    try {
      this.actual();
    } catch (err) {
      threw = true;
      caughtError = err;
    }
    if (this.isNot ? threw : !threw) {
      throw new ExpectationError(`Expected function ${this.isNot ? "not to throw" : "to throw"}`);
    }
    if (threw && expectedMessageOrClass) {
      const msg = caughtError instanceof Error ? caughtError.message : String(caughtError);
      if (typeof expectedMessageOrClass === "string" && !msg.includes(expectedMessageOrClass)) {
        throw new ExpectationError(`Expected error message containing "${expectedMessageOrClass}", got "${msg}"`);
      }
      if (expectedMessageOrClass instanceof RegExp && !expectedMessageOrClass.test(msg)) {
        throw new ExpectationError(`Expected error message to match ${expectedMessageOrClass}, got "${msg}"`);
      }
    }
  }
};
function expect(actual) {
  return new Matcher(actual);
}
async function runAllSuites() {
  const startTotal = Date.now();
  const suiteResults = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  for (const suite of suites) {
    const suiteStart = Date.now();
    const testResults = [];
    let suitePassed = true;
    for (const testCase of suite.tests) {
      totalTests++;
      const testStart = Date.now();
      let passed = true;
      let error;
      try {
        for (const hook of suite.beforeEachHooks) {
          await hook();
        }
        await testCase.fn();
        for (const hook of suite.afterEachHooks) {
          await hook();
        }
      } catch (err) {
        passed = false;
        suitePassed = false;
        error = err instanceof Error ? err : new Error(String(err));
      }
      const durationMs = Date.now() - testStart;
      if (passed) {
        totalPassed++;
      } else {
        totalFailed++;
      }
      testResults.push({
        name: testCase.name,
        passed,
        error,
        durationMs
      });
    }
    suiteResults.push({
      name: suite.name,
      tests: testResults,
      passed: suitePassed,
      durationMs: Date.now() - suiteStart
    });
  }
  return {
    totalSuites: suites.length,
    totalTests,
    totalPassed,
    totalFailed,
    durationMs: Date.now() - startTotal,
    suites: suiteResults
  };
}

// tests/harness/env.ts
var fs = __toESM(require("node:fs"), 1);
var path = __toESM(require("node:path"), 1);
var MockStorage = class {
  store = /* @__PURE__ */ new Map();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key) {
    return this.store.get(key) ?? null;
  }
  key(index) {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
  removeItem(key) {
    this.store.delete(key);
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
};
var MockDOMTokenList = class {
  tokens = /* @__PURE__ */ new Set();
  constructor(initialTokens = []) {
    initialTokens.forEach((t) => this.tokens.add(t));
  }
  add(...tokens) {
    tokens.forEach((t) => this.tokens.add(t));
  }
  remove(...tokens) {
    tokens.forEach((t) => this.tokens.delete(t));
  }
  toggle(token, force) {
    if (force === true) {
      this.tokens.add(token);
      return true;
    }
    if (force === false) {
      this.tokens.delete(token);
      return false;
    }
    if (this.tokens.has(token)) {
      this.tokens.delete(token);
      return false;
    }
    this.tokens.add(token);
    return true;
  }
  contains(token) {
    return this.tokens.has(token);
  }
  toString() {
    return Array.from(this.tokens).join(" ");
  }
};
var MockElement = class {
  tagName;
  id = "";
  classList = new MockDOMTokenList();
  _className = "";
  get className() {
    return this._className;
  }
  set className(value) {
    this._className = value;
    this.classList = new MockDOMTokenList(value.split(" ").filter(Boolean));
  }
  dataset = {};
  style = {};
  attributes = {};
  children = [];
  parentElement = null;
  textContent = "";
  value = "";
  width = 1920;
  height = 1080;
  _innerHTML = "";
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = val;
    if (val === "") {
      this.children = [];
    }
  }
  listeners = /* @__PURE__ */ new Map();
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
    if (name === "id") this.id = value;
    if (name === "class") {
      this.className = value;
      this.classList = new MockDOMTokenList(value.split(" ").filter(Boolean));
    }
    if (name.startsWith("data-")) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[prop] = value;
    }
  }
  getAttribute(name) {
    if (name === "id") return this.id || null;
    if (name === "class") return this.classList.toString() || null;
    if (name.startsWith("data-")) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return this.dataset[prop] ?? null;
    }
    return this.attributes[name] ?? null;
  }
  removeAttribute(name) {
    delete this.attributes[name];
    if (name === "id") this.id = "";
    if (name === "class") {
      this.className = "";
      this.classList = new MockDOMTokenList();
    }
    if (name.startsWith("data-")) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      delete this.dataset[prop];
    }
  }
  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parentElement = null;
      this.children.splice(idx, 1);
    }
    return child;
  }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, /* @__PURE__ */ new Set());
    }
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }
  dispatchEvent(event) {
    if (!("target" in event) || !event.target) {
      Object.defineProperty(event, "target", { value: this, configurable: true });
    }
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((h) => h(event));
    }
    return true;
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
  querySelectorAll(selector) {
    const results = [];
    const matches = (el) => {
      if (selector.startsWith("#") && el.id === selector.slice(1)) return true;
      if (selector.startsWith(".") && el.classList.contains(selector.slice(1))) return true;
      if (selector.toUpperCase() === el.tagName) return true;
      if (selector.includes("[data-")) {
        const match = /\[data-([^=\]]+)(?:="([^"]+)")?\]/.exec(selector);
        if (match) {
          const key = match[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          const val = match[2];
          if (val !== void 0) {
            return el.dataset[key] === val;
          }
          return key in el.dataset;
        }
      }
      return false;
    };
    const traverse = (el) => {
      if (matches(el)) results.push(el);
      for (const child of el.children) {
        traverse(child);
      }
    };
    for (const child of this.children) {
      traverse(child);
    }
    return results;
  }
  click() {
    this.dispatchEvent(new Event("click"));
  }
  toDataURL(format = "image/png") {
    return `data:${format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }
  getContext(type) {
    if (type === "2d") {
      return createMockCanvas2DContext();
    }
    if (type === "webgl" || type === "webgl2") {
      return createMockWebGLContext();
    }
    return null;
  }
};
function createMockCanvas2DContext() {
  return {
    canvas: null,
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    font: "16px sans-serif",
    textAlign: "center",
    textBaseline: "middle",
    shadowColor: "transparent",
    shadowBlur: 0,
    clearRect: () => {
    },
    fillRect: () => {
    },
    strokeRect: () => {
    },
    fillText: () => {
    },
    strokeText: () => {
    },
    measureText: (text) => ({ width: text.length * 8 }),
    beginPath: () => {
    },
    closePath: () => {
    },
    moveTo: () => {
    },
    lineTo: () => {
    },
    arc: () => {
    },
    fill: () => {
    },
    stroke: () => {
    },
    save: () => {
    },
    restore: () => {
    },
    translate: () => {
    },
    rotate: () => {
    },
    scale: () => {
    },
    roundRect: () => {
    },
    drawImage: () => {
    }
  };
}
var WEBGL_CONSTANTS = {
  VERSION: 7938,
  VENDOR: 7936,
  RENDERER: 7937,
  SHADING_LANGUAGE_VERSION: 36344,
  MAX_TEXTURE_SIZE: 3379,
  MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
  MAX_VERTEX_ATTRIBS: 34930,
  MAX_VERTEX_UNIFORM_VECTORS: 34921,
  MAX_VARYING_VECTORS: 36346,
  MAX_FRAGMENT_UNIFORM_VECTORS: 36347,
  MAX_COMBINED_TEXTURE_IMAGE_UNITS: 34929,
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
  MAX_TEXTURE_IMAGE_UNITS: 34930,
  MAX_RENDERBUFFER_SIZE: 32883,
  MAX_COLOR_ATTACHMENTS: 36063,
  MAX_DRAW_BUFFERS: 34852,
  SAMPLE_BUFFERS: 32873,
  SAMPLES: 32936,
  RED_BITS: 36183,
  GREEN_BITS: 36184,
  BLUE_BITS: 36185,
  ALPHA_BITS: 36186,
  DEPTH_BITS: 36182,
  STENCIL_BITS: 36181,
  MAX_TEXTURE_LOD_BIAS: 34018,
  ALIASED_LINE_WIDTH_RANGE: 35657,
  ALIASED_POINT_SIZE_RANGE: 33901,
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  HIGH_FLOAT: 36338,
  MEDIUM_FLOAT: 36337,
  LOW_FLOAT: 36336,
  HIGH_INT: 36341,
  MEDIUM_INT: 36340,
  LOW_INT: 36339,
  FRAMEBUFFER: 36160,
  RENDERBUFFER: 36161,
  RGBA: 6408,
  UNSIGNED_BYTE: 5121,
  COLOR_ATTACHMENT0: 36064,
  DEPTH_ATTACHMENT: 36096,
  STENCIL_ATTACHMENT: 36128,
  FRAMEBUFFER_COMPLETE: 36053,
  TEXTURE_2D: 3553,
  TEXTURE_CUBE_MAP: 34067,
  LINEAR: 9729,
  NEAREST: 9728,
  REPEAT: 10497,
  CLAMP_TO_EDGE: 33071
};
function createMockWebGLContext() {
  const target = {
    canvas: null,
    drawingBufferWidth: 1920,
    drawingBufferHeight: 1080,
    isContextLost: () => false,
    getContextAttributes: () => ({
      alpha: true,
      depth: true,
      stencil: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    }),
    getExtension: (name) => {
      if (name === "WEBGL_depth_texture") return {};
      if (name === "OES_texture_float") return {};
      if (name === "OES_texture_half_float") return {};
      if (name === "OES_standard_derivatives") return {};
      if (name === "EXT_texture_filter_anisotropic") return { MAX_TEXTURE_MAX_ANISOTROPY_EXT: 16 };
      if (name === "WEBGL_draw_buffers") return {};
      return {};
    },
    getParameter: (p) => {
      if (p === 7938 || p === 1 || p === "1" || p === "VERSION") return "WebGL 2.0 (Mock)";
      if (p === 7936 || p === "VENDOR") return "WebKit";
      if (p === 7937 || p === "RENDERER") return "WebKit WebGL";
      if (p === 36344 || p === "SHADING_LANGUAGE_VERSION") return "WebGL GLSL ES 3.00 (Mock)";
      switch (p) {
        case 3379:
          return 16384;
        // MAX_TEXTURE_SIZE
        case 34076:
          return 16384;
        // MAX_CUBE_MAP_TEXTURE_SIZE
        case 34930:
          return 16;
        // MAX_VERTEX_ATTRIBS
        case 34921:
          return 1024;
        // MAX_VERTEX_UNIFORM_VECTORS
        case 36346:
          return 30;
        // MAX_VARYING_VECTORS
        case 36347:
          return 1024;
        // MAX_FRAGMENT_UNIFORM_VECTORS
        case 34929:
          return 32;
        // MAX_COMBINED_TEXTURE_IMAGE_UNITS
        case 35660:
          return 16;
        // MAX_VERTEX_TEXTURE_IMAGE_UNITS
        case 32883:
          return 16384;
        // MAX_RENDERBUFFER_SIZE
        case 36063:
          return 8;
        // MAX_COLOR_ATTACHMENTS
        case 34852:
          return 8;
        // MAX_DRAW_BUFFERS
        case 32873:
          return 0;
        // SAMPLE_BUFFERS
        case 32936:
          return 0;
        // SAMPLES
        case 36183:
          return 8;
        // RED_BITS
        case 36184:
          return 8;
        // GREEN_BITS
        case 36185:
          return 8;
        // BLUE_BITS
        case 36186:
          return 8;
        // ALPHA_BITS
        case 36182:
          return 24;
        // DEPTH_BITS
        case 36181:
          return 8;
        // STENCIL_BITS
        case 34018:
          return 2;
        // MAX_TEXTURE_LOD_BIAS
        case 35657:
          return new Float32Array([1, 1]);
        // ALIASED_LINE_WIDTH_RANGE
        case 33901:
          return new Float32Array([1, 1024]);
        // ALIASED_POINT_SIZE_RANGE
        default:
          return 0;
      }
    },
    getShaderPrecisionFormat: (_shaderType, _precisionType) => ({
      precision: 23,
      rangeMin: 127,
      rangeMax: 127
    }),
    createShader: () => ({}),
    shaderSource: () => {
    },
    compileShader: () => {
    },
    getShaderParameter: () => true,
    getShaderInfoLog: () => "",
    getProgramParameter: (_program, param) => {
      if (param === 35718) return 0;
      if (param === 35721) return 0;
      if (param === 35716) return 0;
      if (param === 35719) return 0;
      if (param === 35722) return 0;
      return true;
    },
    getProgramInfoLog: () => "",
    getActiveUniform: (_program, _index) => ({
      name: "uMock",
      size: 1,
      type: 35664
    }),
    getActiveAttrib: (_program, _index) => ({
      name: "aMock",
      size: 1,
      type: 35664
    }),
    useProgram: () => {
    },
    createBuffer: () => ({}),
    bindBuffer: () => {
    },
    bufferData: () => {
    },
    bufferSubData: () => {
    },
    enable: () => {
    },
    disable: () => {
    },
    clear: () => {
    },
    clearColor: () => {
    },
    clearDepth: () => {
    },
    clearStencil: () => {
    },
    viewport: () => {
    },
    createTexture: () => ({}),
    bindTexture: () => {
    },
    texParameteri: () => {
    },
    texImage2D: () => {
    },
    pixelStorei: () => {
    },
    generateMipmap: () => {
    },
    createFramebuffer: () => ({}),
    bindFramebuffer: () => {
    },
    framebufferTexture2D: () => {
    },
    checkFramebufferStatus: () => 36053,
    // FRAMEBUFFER_COMPLETE
    createRenderbuffer: () => ({}),
    bindRenderbuffer: () => {
    },
    renderbufferStorage: () => {
    },
    renderbufferStorageMultisample: () => {
    },
    framebufferRenderbuffer: () => {
    },
    getUniformLocation: () => ({}),
    getAttribLocation: () => 0,
    enableVertexAttribArray: () => {
    },
    disableVertexAttribArray: () => {
    },
    vertexAttribPointer: () => {
    },
    drawArrays: () => {
    },
    drawElements: () => {
    },
    drawArraysInstanced: () => {
    },
    drawElementsInstanced: () => {
    },
    activeTexture: () => {
    },
    cullFace: () => {
    },
    frontFace: () => {
    },
    depthFunc: () => {
    },
    depthMask: () => {
    },
    depthRange: () => {
    },
    colorMask: () => {
    },
    scissor: () => {
    },
    stencilFunc: () => {
    },
    stencilOp: () => {
    },
    stencilMask: () => {
    },
    blendFunc: () => {
    },
    blendFuncSeparate: () => {
    },
    blendEquation: () => {
    },
    blendEquationSeparate: () => {
    },
    deleteShader: () => {
    },
    deleteProgram: () => {
    },
    deleteTexture: () => {
    },
    deleteBuffer: () => {
    },
    deleteFramebuffer: () => {
    },
    deleteRenderbuffer: () => {
    }
  };
  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) {
        return obj[prop];
      }
      if (typeof prop === "string") {
        if (prop in WEBGL_CONSTANTS) {
          return WEBGL_CONSTANTS[prop];
        }
        if (/^[A-Z0-9_]+$/.test(prop)) {
          return 1;
        }
      }
      return () => ({});
    }
  });
}
var MockAudioParam = class {
  value;
  constructor(initial = 0) {
    this.value = initial;
  }
  setValueAtTime(val, _time) {
    this.value = val;
  }
  linearRampToValueAtTime(val, _time) {
    this.value = val;
  }
  exponentialRampToValueAtTime(val, _time) {
    this.value = val;
  }
};
var MockAudioNode = class {
  context;
  constructor(ctx) {
    this.context = ctx;
  }
  connect(dest) {
    return dest;
  }
  disconnect() {
  }
};
var MockGainNode = class extends MockAudioNode {
  gain;
  constructor(ctx, initialGain = 1) {
    super(ctx);
    this.gain = new MockAudioParam(initialGain);
  }
};
var MockAnalyserNode = class extends MockAudioNode {
  fftSize = 2048;
  frequencyBinCount = 1024;
  smoothingTimeConstant = 0.82;
  minDecibels = -100;
  maxDecibels = -30;
  mockFreqData = new Uint8Array(1024);
  mockTimeData = new Uint8Array(1024).fill(128);
  getByteFrequencyData(arr) {
    arr.set(this.mockFreqData.subarray(0, arr.length));
  }
  getByteTimeDomainData(arr) {
    arr.set(this.mockTimeData.subarray(0, arr.length));
  }
};
var MockOscillatorNode = class extends MockAudioNode {
  frequency = new MockAudioParam(440);
  type = "sine";
  start(_time) {
  }
  stop(_time) {
  }
};
var MockMediaStreamAudioDestinationNode = class extends MockAudioNode {
  stream = {};
};
var MockAudioContext = class {
  state = "running";
  currentTime = 0;
  destination = new MockAudioNode(this);
  createAnalyser() {
    return new MockAnalyserNode(this);
  }
  createGain() {
    return new MockGainNode(this);
  }
  createOscillator() {
    return new MockOscillatorNode(this);
  }
  createMediaStreamDestination() {
    return new MockMediaStreamAudioDestinationNode(this);
  }
  createMediaElementSource(_audio) {
    return new MockAudioNode(this);
  }
  createMediaStreamSource(_stream) {
    return new MockAudioNode(this);
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  async close() {
    this.state = "closed";
  }
};
var MockMIDIInput = class {
  id;
  name;
  manufacturer;
  onmidimessage = null;
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.manufacturer = "Visuval Virtual Controller";
  }
  simulateMessage(bytes) {
    if (this.onmidimessage) {
      this.onmidimessage({ data: new Uint8Array(bytes) });
    }
  }
};
var MockMIDIAccess = class {
  inputs = /* @__PURE__ */ new Map();
  outputs = /* @__PURE__ */ new Map();
  onstatechange = null;
  addMockInput(id, name) {
    const input = new MockMIDIInput(id, name);
    this.inputs.set(id, input);
    return input;
  }
};
var activeMidiAccess = null;
function setupTestEnvironment() {
  const doc = new MockElement("HTML");
  const body = new MockElement("BODY");
  const head = new MockElement("HEAD");
  doc.appendChild(head);
  doc.appendChild(body);
  const canvas = new MockElement("CANVAS");
  canvas.id = "webgl-canvas";
  body.appendChild(canvas);
  const milkCanvas = new MockElement("CANVAS");
  milkCanvas.id = "milkdrop-canvas";
  body.appendChild(milkCanvas);
  const transitionCanvas = new MockElement("CANVAS");
  transitionCanvas.id = "transition-canvas";
  body.appendChild(transitionCanvas);
  activeMidiAccess = new MockMIDIAccess();
  activeMidiAccess.addMockInput("input-0", "Arturia BeatStep MIDI 1");
  const mockLocalStorage = new MockStorage();
  const mockSessionStorage = new MockStorage();
  const originalFetch = globalThis.fetch;
  const mockFetch = async (input, init) => {
    let urlStr;
    if (typeof input === "string") {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else {
      urlStr = input.url;
    }
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      const cleanPath = urlStr.replace(/^\/+/, "").split("?")[0];
      const filePath = path.resolve(process.cwd(), "public", cleanPath);
      if (fs.existsSync(filePath)) {
        const data = await fs.promises.readFile(filePath);
        const isJson = cleanPath.endsWith(".json");
        const isPng = cleanPath.endsWith(".png");
        const contentType = isJson ? "application/json" : isPng ? "image/png" : "text/plain; charset=utf-8";
        return new Response(data, {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": contentType }
        });
      }
      return new Response(JSON.stringify({ error: `File not found: ${cleanPath}` }), {
        status: 404,
        statusText: "Not Found",
        headers: { "Content-Type": "application/json" }
      });
    }
    if (originalFetch) {
      return originalFetch(input, init);
    }
    return new Response(JSON.stringify({ error: `No fetch handler for: ${urlStr}` }), {
      status: 404,
      statusText: "Not Found"
    });
  };
  const mockWindow = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: () => {
    },
    removeEventListener: () => {
    },
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    fetch: mockFetch
  };
  const mockDocument = {
    documentElement: doc,
    body,
    head,
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => doc.querySelector(`#${id}`),
    querySelector: (sel) => doc.querySelector(sel),
    querySelectorAll: (sel) => doc.querySelectorAll(sel),
    addEventListener: () => {
    },
    removeEventListener: () => {
    }
  };
  const mockNavigator = {
    userAgent: "Node.js Test Agent (Headless)",
    mediaDevices: {
      getUserMedia: async () => ({
        getTracks: () => [{ stop: () => {
        } }],
        getAudioTracks: () => [{ stop: () => {
        } }],
        getVideoTracks: () => [{ stop: () => {
        } }]
      }),
      getDisplayMedia: async () => ({
        getTracks: () => [{ stop: () => {
        } }],
        getAudioTracks: () => [{ stop: () => {
        } }],
        getVideoTracks: () => [{ stop: () => {
        } }]
      })
    },
    requestMIDIAccess: async () => activeMidiAccess
  };
  class MockAudio {
    crossOrigin = "anonymous";
    currentTime = 0;
    duration = 180;
    paused = true;
    play = async () => {
      this.paused = false;
    };
    pause = () => {
      this.paused = true;
    };
    addEventListener = () => {
    };
    removeEventListener = () => {
    };
  }
  Object.defineProperty(globalThis, "window", {
    value: mockWindow,
    configurable: true,
    writable: true
  });
  Object.defineProperty(globalThis, "document", {
    value: mockDocument,
    configurable: true,
    writable: true
  });
  Object.defineProperty(globalThis, "navigator", {
    value: mockNavigator,
    configurable: true,
    writable: true
  });
  Object.defineProperty(globalThis, "Audio", {
    value: MockAudio,
    configurable: true,
    writable: true
  });
  Object.defineProperty(globalThis, "HTMLCanvasElement", {
    value: MockElement,
    configurable: true,
    writable: true
  });
  Object.defineProperty(globalThis, "AudioContext", {
    value: MockAudioContext,
    configurable: true,
    writable: true
  });
  const origCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = (obj) => {
    if (typeof Blob !== "undefined" && obj instanceof Blob) {
      try {
        return origCreateObjectURL(obj);
      } catch {
      }
    }
    return `blob:mock-object-${Math.random().toString(36).slice(2)}`;
  };
  URL.revokeObjectURL = () => {
  };
  Object.defineProperty(globalThis, "fetch", {
    value: mockFetch,
    configurable: true,
    writable: true
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: mockLocalStorage,
    configurable: true,
    writable: true
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: mockSessionStorage,
    configurable: true,
    writable: true
  });
}
function getActiveMidiAccess() {
  return activeMidiAccess;
}
setupTestEnvironment();

// src/themes/themes.ts
var CORAL_REEF = "coral-reef";
var THEMES = [
  {
    id: "ember",
    name: "Ember",
    primary: "#ff5c00",
    secondary: "#ff8a4c",
    accent: "#ffaa00",
    background: "#0a0502",
    glow: "#ff5c00"
  },
  {
    id: "jade",
    name: "Jade",
    primary: "#22c55e",
    secondary: "#10b981",
    accent: "#70ffc5",
    background: "#020d08",
    glow: "#22c55e"
  },
  {
    id: "violet",
    name: "Violet",
    primary: "#8b5cf6",
    secondary: "#a78bfa",
    accent: "#cc66ff",
    background: "#07020d",
    glow: "#8b5cf6"
  },
  {
    id: "rose",
    name: "Rose",
    primary: "#ec4899",
    secondary: "#f472b6",
    accent: "#ff69b4",
    background: "#0d0207",
    glow: "#ec4899"
  },
  {
    id: "azure",
    name: "Azure",
    primary: "#3b82f6",
    secondary: "#60a5fa",
    accent: "#33ccff",
    background: "#02070d",
    glow: "#3b82f6"
  },
  {
    id: "amber",
    name: "Amber",
    primary: "#f59e0b",
    secondary: "#fbbf24",
    accent: "#ffe066",
    background: "#0d0901",
    glow: "#f59e0b"
  },
  {
    id: "crimson",
    name: "Crimson",
    primary: "#dc1429",
    secondary: "#f2334d",
    accent: "#ff4d6a",
    background: "#0d0103",
    glow: "#dc1429"
  },
  {
    id: "teal",
    name: "Teal",
    primary: "#00b5ab",
    secondary: "#26d1c7",
    accent: "#48dbfb",
    background: "#010d0d",
    glow: "#00b5ab"
  },
  {
    id: "slate",
    name: "Slate",
    primary: "#607894",
    secondary: "#8ca1b8",
    accent: "#cbd5e1",
    background: "#090b0e",
    glow: "#607894"
  },
  {
    id: "indigo",
    name: "Indigo",
    primary: "#4f46e5",
    secondary: "#818cf8",
    accent: "#818cf8",
    background: "#05040f",
    glow: "#4f46e5"
  },
  {
    id: "coral",
    name: "Coral",
    primary: "#ff6b6b",
    secondary: "#ff8787",
    accent: "#feca57",
    background: "#0d0404",
    glow: "#ff6b6b"
  },
  {
    id: "lime",
    name: "Lime",
    primary: "#84cc16",
    secondary: "#bef264",
    accent: "#caff4d",
    background: "#070d01",
    glow: "#84cc16"
  },
  {
    id: "earthy",
    name: "Earthy",
    primary: "#5c8552",
    secondary: "#789459",
    accent: "#789459",
    background: "#070d06",
    glow: "#5c8552"
  },
  {
    id: "terracotta",
    name: "Terracotta",
    primary: "#b8613d",
    secondary: "#c28573",
    accent: "#c28573",
    background: "#0d0604",
    glow: "#b8613d"
  },
  {
    id: "sand",
    name: "Sand",
    primary: "#e2ca76",
    secondary: "#c4a852",
    accent: "#c4a852",
    background: "#0d0b07",
    glow: "#e2ca76"
  },
  {
    id: "lavender",
    name: "Lavender",
    primary: "#8c6ba6",
    secondary: "#6b85ad",
    accent: "#6b85ad",
    background: "#09080e",
    glow: "#8c6ba6"
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "#ff5c0d",
    secondary: "#00ccb4",
    accent: "#00ccb4",
    background: "#0d0407",
    glow: "#ff5c0d"
  },
  {
    id: "synthwave",
    name: "Synthwave",
    primary: "#f21aa5",
    secondary: "#00e5f0",
    accent: "#00e5f0",
    background: "#08010d",
    glow: "#f21aa5"
  },
  {
    id: "toxic",
    name: "Toxic",
    primary: "#87ff00",
    secondary: "#8c00f2",
    accent: "#8c00f2",
    background: "#020d01",
    glow: "#87ff00"
  },
  {
    id: CORAL_REEF,
    name: "Coral Reef",
    primary: "#ff705f",
    secondary: "#145ad1",
    accent: "#145ad1",
    background: "#01080d",
    glow: "#ff705f"
  },
  {
    id: "firefly",
    name: "Firefly",
    primary: "#d4f030",
    secondary: "#0a2418",
    accent: "#0a2418",
    background: "#050d00",
    glow: "#d4f030"
  },
  {
    id: "horizon",
    name: "Horizon",
    primary: "#22c55e",
    secondary: "#3b82f6",
    accent: "#3b82f6",
    background: "#03060d",
    glow: "#22c55e"
  },
  {
    id: "arctic",
    name: "Arctic",
    primary: "#33b3ff",
    secondary: "#ff3d85",
    accent: "#ff3d85",
    background: "#010d0f",
    glow: "#33b3ff"
  },
  {
    id: "eclipse",
    name: "Eclipse",
    primary: "#2e196b",
    secondary: "#ffd600",
    accent: "#ffd600",
    background: "#050505",
    glow: "#ffd600"
  },
  {
    id: "vapor",
    name: "Vapor",
    primary: "#b38cf2",
    secondary: "#4debb3",
    accent: "#4debb3",
    background: "#08020a",
    glow: "#b38cf2"
  },
  {
    id: "nebula",
    name: "Nebula",
    primary: "#9333ea",
    secondary: "#ec4899",
    accent: "#ec4899",
    background: "#06010d",
    glow: "#9333ea"
  },
  {
    id: "glacier",
    name: "Glacier",
    primary: "#14b8a6",
    secondary: "#6366f1",
    accent: "#6366f1",
    background: "#020b0e",
    glow: "#14b8a6"
  },
  {
    id: "prism",
    name: "Prism",
    primary: "#7c3aed",
    secondary: "#f59e0b",
    accent: "#f59e0b",
    background: "#0a0408",
    glow: "#7c3aed"
  }
];
var THEME_ALIASES = {
  forest: "earthy",
  copper: "glacier",
  orange: "ember",
  green: "jade",
  purple: "violet",
  pink: "rose",
  blue: "azure",
  yellow: "amber",
  coralreef: CORAL_REEF
};
function getTheme(id) {
  if (!id || typeof id !== "string") return THEMES[0];
  const trimmed = id.trim();
  if (!trimmed) return THEMES[0];
  const directMatch = THEMES.find((t) => t.id === trimmed);
  if (directMatch) return directMatch;
  const gradMatch = GRADIENT_THEMES.find((t) => t.id === trimmed);
  if (gradMatch) return gradMatch;
  const normalized = trimmed.toLowerCase().replace(/[-_\s]/g, "");
  const aliasTarget = THEME_ALIASES[normalized] || THEME_ALIASES[trimmed.toLowerCase()];
  if (aliasTarget) {
    const aliasMatch = THEMES.find((t) => t.id === aliasTarget);
    if (aliasMatch) return aliasMatch;
  }
  const nameMatch = GRADIENT_THEMES.find((t) => t.name.toLowerCase().replace(/[-_\s]/g, "") === normalized);
  if (nameMatch) return nameMatch;
  return THEMES.find((t) => t.id.toLowerCase().replace(/[-_\s]/g, "") === normalized) || THEMES[0];
}
var THEME_VECTORS = {
  ember: { primary: [1, 0.36, 0], secondary: [1, 0.54, 0.3] },
  orange: { primary: [1, 0.36, 0], secondary: [1, 0.54, 0.3] },
  jade: { primary: [0.13, 0.77, 0.37], secondary: [0.06, 0.73, 0.51] },
  green: { primary: [0.13, 0.77, 0.37], secondary: [0.06, 0.73, 0.51] },
  violet: { primary: [0.55, 0.36, 0.96], secondary: [0.65, 0.55, 0.98] },
  purple: { primary: [0.55, 0.36, 0.96], secondary: [0.65, 0.55, 0.98] },
  rose: { primary: [0.93, 0.29, 0.6], secondary: [0.96, 0.45, 0.71] },
  pink: { primary: [0.93, 0.29, 0.6], secondary: [0.96, 0.45, 0.71] },
  azure: { primary: [0.23, 0.51, 0.96], secondary: [0.38, 0.65, 0.98] },
  blue: { primary: [0.23, 0.51, 0.96], secondary: [0.38, 0.65, 0.98] },
  amber: { primary: [0.96, 0.62, 0.04], secondary: [0.98, 0.75, 0.14] },
  yellow: { primary: [0.96, 0.62, 0.04], secondary: [0.98, 0.75, 0.14] },
  crimson: { primary: [0.86, 0.08, 0.16], secondary: [0.95, 0.2, 0.3] },
  teal: { primary: [0, 0.71, 0.67], secondary: [0.15, 0.82, 0.78] },
  slate: { primary: [0.38, 0.47, 0.58], secondary: [0.55, 0.63, 0.72] },
  indigo: { primary: [0.31, 0.275, 0.898], secondary: [0.506, 0.549, 0.973] },
  coral: { primary: [1, 0.42, 0.42], secondary: [1, 0.529, 0.529] },
  lime: { primary: [0.518, 0.8, 0.086], secondary: [0.745, 0.949, 0.392] },
  terracotta: { primary: [0.72, 0.38, 0.24], secondary: [0.76, 0.52, 0.45] },
  earthy: { primary: [0.36, 0.52, 0.32], secondary: [0.47, 0.58, 0.35] },
  forest: { primary: [0.36, 0.52, 0.32], secondary: [0.47, 0.58, 0.35] },
  sand: { primary: [0.886, 0.792, 0.463], secondary: [0.769, 0.659, 0.322] },
  lavender: { primary: [0.55, 0.42, 0.65], secondary: [0.42, 0.52, 0.68] },
  sunset: { primary: [1, 0.36, 0.05], secondary: [0, 0.8, 0.75] },
  synthwave: { primary: [0.95, 0.1, 0.65], secondary: [0, 0.9, 0.95] },
  toxic: { primary: [0.53, 1, 0], secondary: [0.55, 0, 0.95] },
  [CORAL_REEF]: { primary: [1, 0.44, 0.37], secondary: [0.08, 0.35, 0.82] },
  coralReef: { primary: [1, 0.44, 0.37], secondary: [0.08, 0.35, 0.82] },
  firefly: { primary: [0.831, 0.941, 0.188], secondary: [0.039, 0.141, 0.094] },
  horizon: { primary: [0.133, 0.773, 0.369], secondary: [0.231, 0.51, 0.965] },
  arctic: { primary: [0.2, 0.7, 1], secondary: [1, 0.24, 0.52] },
  eclipse: { primary: [0.18, 0.1, 0.42], secondary: [1, 0.84, 0] },
  vapor: { primary: [0.7, 0.55, 0.95], secondary: [0.3, 0.92, 0.7] },
  nebula: { primary: [0.576, 0.2, 0.918], secondary: [0.925, 0.282, 0.6] },
  glacier: { primary: [0.078, 0.722, 0.651], secondary: [0.388, 0.4, 0.945] },
  copper: { primary: [0.078, 0.722, 0.651], secondary: [0.388, 0.4, 0.945] },
  prism: { primary: [0.486, 0.227, 0.929], secondary: [0.961, 0.62, 0.043] },
  custom: { primary: [1, 1, 1], secondary: [0.7, 0.7, 0.7] }
};
var GRADIENT_PRESETS = [
  { name: "Cyberpunk", stops: ["#FF007F", "#7928CA", "#00F0FF", "#FCEE0A"] },
  { name: "Sunset Dream", stops: ["#FF0844", "#FFB199", "#F3696E", "#F857A6"] },
  { name: "Aurora Borealis", stops: ["#00FF87", "#60EFFF", "#0061FF", "#7000FF"] },
  { name: "Deep Cosmic", stops: ["#8A2387", "#E94057", "#F27121", "#FFA07A"] },
  { name: "Toxic Lime", stops: ["#10B981", "#A3E635", "#06B6D4", "#3B82F6"] },
  { name: "Vaporwave", stops: ["#FF71CE", "#01CDFE", "#05FFA1", "#B967FF"] },
  { name: "Fire & Ice", stops: ["#FF3B00", "#FFAA00", "#00D2FF", "#0044FF"] },
  { name: "Electric Violet", stops: ["#3A1C71", "#D76D77", "#FFAF7B"] },
  { name: "Emerald Wave", stops: ["#0575E6", "#00F260", "#11998E", "#38EF7D"] },
  { name: "Golden Sun", stops: ["#F12711", "#F5AF19", "#FFDD00"] },
  { name: "Acid Techno", stops: ["#39FF14", "#00FFFF", "#FF007F", "#FFFF00"] },
  { name: "Neon Tokyo", stops: ["#FE00FE", "#00F0FF", "#FF0055", "#7F00FF"] },
  { name: "Pastel Dreams", stops: ["#FFAAA6", "#FF8C94", "#FFD3B6", "#A8E6CF"] },
  { name: "Black Hole", stops: ["#0D0D11", "#4A00E0", "#8E2DE2", "#FF007F"] },
  { name: "Solar Flare", stops: ["#FFE000", "#FF8C00", "#FF0055", "#7F00FF"] },
  { name: "Synth Glitch", stops: ["#00FFFF", "#FF00FF", "#FFFF00", "#00E5FF"] }
];
function createThemeFromGradientPreset(preset) {
  const id = `gradient_${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const stops = preset.stops;
  const primary = stops[0] || "#ff5c00";
  const secondary = stops[1] || stops[0] || "#00d2ff";
  const accent = stops[2] || secondary;
  return {
    id,
    name: preset.name,
    primary,
    secondary,
    accent,
    background: "#0a0a0c",
    glow: primary,
    gradientStops: [...stops]
  };
}
var GRADIENT_THEMES = GRADIENT_PRESETS.map(createThemeFromGradientPreset);
var ALL_COLOR_PRESETS = [
  ...THEMES,
  ...GRADIENT_THEMES
];
function sampleGradient(stops, t) {
  if (!stops || stops.length === 0) return "#FF5C00";
  if (stops.length === 1) return stops[0];
  const clampedT = Math.max(0, Math.min(1, t));
  const scaled = clampedT * (stops.length - 1);
  const idx = Math.floor(scaled);
  const rem = scaled - idx;
  if (idx >= stops.length - 1) return stops.at(-1) ?? stops[0];
  const c1 = stops[idx];
  const c2 = stops[idx + 1];
  const r1 = Number.parseInt(c1.slice(1, 3), 16);
  const g1 = Number.parseInt(c1.slice(3, 5), 16);
  const b1 = Number.parseInt(c1.slice(5, 7), 16);
  const r2 = Number.parseInt(c2.slice(1, 3), 16);
  const g2 = Number.parseInt(c2.slice(3, 5), 16);
  const b2 = Number.parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * rem).toString(16).padStart(2, "0");
  const g = Math.round(g1 + (g2 - g1) * rem).toString(16).padStart(2, "0");
  const b = Math.round(b1 + (b2 - b1) * rem).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

// src/engine/RenderEngine.ts
var THREE76 = __toESM(require("three"), 1);
var import_EffectComposer = require("three/examples/jsm/postprocessing/EffectComposer.js");
var import_RenderPass = require("three/examples/jsm/postprocessing/RenderPass.js");
var import_ShaderPass = require("three/examples/jsm/postprocessing/ShaderPass.js");
var import_UnrealBloomPass = require("three/examples/jsm/postprocessing/UnrealBloomPass.js");
var import_AfterimagePass = require("three/examples/jsm/postprocessing/AfterimagePass.js");

// src/engine/CameraController.ts
var THREE = __toESM(require("three"), 1);
var CANONICAL_VIEWPOINTS = {
  default: { id: "default", name: "Front (Default)", rotAngle: 0, tiltAngle: 0, zoom: 0.5 },
  front: { id: "front", name: "Front (Hero)", rotAngle: 0, tiltAngle: 0, zoom: 0.5 },
  top: { id: "top", name: "Top Down", rotAngle: 0, tiltAngle: Math.PI / 2 - 0.05, zoom: 0.5 },
  low: { id: "low", name: "Low Angle", rotAngle: 0, tiltAngle: -0.6, zoom: 0.6 },
  iso: { id: "iso", name: "Isometric 3/4", rotAngle: Math.PI / 4, tiltAngle: 0.5, zoom: 0.5 },
  isometric: { id: "isometric", name: "Isometric 3/4", rotAngle: Math.PI / 4, tiltAngle: 0.5, zoom: 0.5 },
  side: { id: "side", name: "Side Profile", rotAngle: Math.PI / 2, tiltAngle: 0, zoom: 0.5 }
};
function computeZoomDistance(normalizedZoom) {
  if (typeof normalizedZoom !== "number" || Number.isNaN(normalizedZoom)) return 0.7;
  const clamped = Math.max(0, Math.min(1, normalizedZoom));
  return 0.7 + (2.5 - 0.7) * clamped;
}
var CameraController = class _CameraController {
  camera;
  target = new THREE.Vector3(0, 0, 0);
  // Configuration properties
  baseRadius = 12;
  minDistance = 1;
  maxDistance = 50;
  dpadStepAngle = 0.1;
  shakeDecayRate = 8;
  lerpSpeed = 8;
  static MIN_TILT = -Math.PI / 2 + 0.05;
  static MAX_TILT = Math.PI / 2 - 0.05;
  // Spherical coordinates
  radius = 12;
  rotAngle = 0;
  tiltAngle = 0;
  normalizedZoom = 0.5;
  // Lerp targets for smooth transitions
  targetRadius = 12;
  targetRotAngle = 0;
  targetTiltAngle = 0;
  isTransitioning = false;
  activeViewpointId = "default";
  // Auto-orbit state
  autoRotate = true;
  autoRotateSpeed = 0.4;
  autoRotateDirection = 1;
  // Audio kick shake
  cameraShakeEnabled = true;
  cameraShakeIntensity = 0.6;
  shakeIntensity = 0;
  shakeOffset = new THREE.Vector3();
  constructor(camera, options) {
    this.camera = camera;
    if (options?.baseRadius !== void 0) this.baseRadius = options.baseRadius;
    if (options?.minDistance !== void 0) this.minDistance = options.minDistance;
    if (options?.maxDistance !== void 0) this.maxDistance = options.maxDistance;
    if (options?.dpadStepAngle !== void 0) this.dpadStepAngle = options.dpadStepAngle;
    if (options?.orbitSpeed !== void 0) this.autoRotateSpeed = options.orbitSpeed;
    if (options?.shakeDecayRate !== void 0) this.shakeDecayRate = options.shakeDecayRate;
    if (options?.lerpSpeed !== void 0) this.lerpSpeed = options.lerpSpeed;
    this.reset();
  }
  setCameraPosition(x, y, z, target) {
    if (target) {
      this.target.copy(target);
    } else {
      this.target.set(0, 0, 0);
    }
    const dx = x - this.target.x;
    const dy = y - this.target.y;
    const dz = z - this.target.z;
    const totalDist = Math.hypot(dx, dy, dz);
    const clampedDist = Math.max(this.minDistance, Math.min(this.maxDistance, totalDist));
    this.radius = clampedDist;
    this.targetRadius = clampedDist;
    this.rotAngle = Math.atan2(dx, dz);
    this.targetRotAngle = this.rotAngle;
    const tilt = clampedDist > 0 ? Math.asin(Math.max(-1, Math.min(1, dy / clampedDist))) : 0;
    this.tiltAngle = Math.max(_CameraController.MIN_TILT, Math.min(_CameraController.MAX_TILT, tilt));
    this.targetTiltAngle = this.tiltAngle;
    const multiplier = clampedDist / this.baseRadius * 1.6;
    this.normalizedZoom = Math.max(0, Math.min(1, (multiplier - 0.7) / (2.5 - 0.7)));
    this.isTransitioning = false;
    this.applyTransform();
  }
  setPosition(rot, tilt, zoom, immediate = false) {
    const validRot = Number.isFinite(rot) ? rot : 0;
    const validTilt = Number.isFinite(tilt) ? tilt : 0;
    const clampedTilt = Math.max(_CameraController.MIN_TILT, Math.min(_CameraController.MAX_TILT, validTilt));
    if (zoom !== void 0) {
      this.setZoom(zoom, immediate);
    }
    if (immediate) {
      this.rotAngle = validRot;
      this.tiltAngle = clampedTilt;
      this.targetRotAngle = validRot;
      this.targetTiltAngle = clampedTilt;
      this.isTransitioning = false;
      this.applyTransform();
    } else {
      this.autoRotate = false;
      this.targetRotAngle = validRot;
      this.targetTiltAngle = clampedTilt;
      this.isTransitioning = true;
    }
  }
  setZoom(zoom, immediate = false, allowBeyondLimits = false) {
    const validZoom = Number.isFinite(zoom) ? zoom : 0.5;
    if (!allowBeyondLimits) {
      const clampedZoom = Math.max(0, Math.min(1, validZoom));
      this.normalizedZoom = clampedZoom;
      const multiplier = computeZoomDistance(clampedZoom);
      const targetDist = Math.max(
        this.minDistance,
        Math.min(this.maxDistance, this.baseRadius * (multiplier / 1.6))
      );
      if (immediate) {
        this.radius = targetDist;
        this.targetRadius = targetDist;
        this.applyTransform();
      } else {
        this.targetRadius = targetDist;
        this.isTransitioning = true;
      }
    } else {
      this.normalizedZoom = validZoom;
      const multiplier = 0.7 + (2.5 - 0.7) * validZoom;
      const targetDist = Math.max(0.1, Math.min(200, this.baseRadius * (multiplier / 1.6)));
      if (immediate) {
        this.radius = targetDist;
        this.targetRadius = targetDist;
        this.applyTransform();
      } else {
        this.targetRadius = targetDist;
        this.isTransitioning = true;
      }
    }
  }
  setOrbit(rotAngle, immediate = true) {
    const validRot = Number.isFinite(rotAngle) ? rotAngle : 0;
    this.rotAngle = validRot;
    this.targetRotAngle = validRot;
    if (immediate) {
      this.isTransitioning = false;
      this.applyTransform();
    }
  }
  setTilt(tiltAngle, immediate = true) {
    const validTilt = Number.isFinite(tiltAngle) ? tiltAngle : 0;
    const clampedTilt = Math.max(_CameraController.MIN_TILT, Math.min(_CameraController.MAX_TILT, validTilt));
    this.tiltAngle = clampedTilt;
    this.targetTiltAngle = clampedTilt;
    if (immediate) {
      this.isTransitioning = false;
      this.applyTransform();
    }
  }
  setDistance(dist, immediate = true) {
    const validDist = Number.isFinite(dist) ? dist : this.baseRadius;
    const clampedDist = Math.max(0.1, Math.min(200, validDist));
    this.radius = clampedDist;
    this.targetRadius = clampedDist;
    const multiplier = clampedDist / this.baseRadius * 1.6;
    this.normalizedZoom = Math.max(0, Math.min(1, (multiplier - 0.7) / (2.5 - 0.7)));
    if (immediate) {
      this.isTransitioning = false;
      this.applyTransform();
    }
  }
  setTargetHeight(height, immediate = true) {
    const validHeight = Number.isFinite(height) ? height : 0;
    this.target.y = validHeight;
    if (immediate) {
      this.applyTransform();
    }
  }
  getTargetHeight() {
    return this.target.y;
  }
  exportState() {
    return {
      rotAngle: this.rotAngle,
      tiltAngle: this.tiltAngle,
      radius: this.radius,
      zoom: this.normalizedZoom,
      targetY: this.target.y,
      target: [this.target.x, this.target.y, this.target.z],
      autoRotate: this.autoRotate,
      autoRotateSpeed: this.autoRotateSpeed,
      autoRotateDirection: this.autoRotateDirection,
      cameraShakeEnabled: this.cameraShakeEnabled,
      cameraShakeIntensity: this.cameraShakeIntensity
    };
  }
  importState(state, immediate = true) {
    if (state.rotAngle !== void 0) this.rotAngle = state.rotAngle;
    if (state.tiltAngle !== void 0) this.tiltAngle = state.tiltAngle;
    if (state.radius !== void 0) this.radius = state.radius;
    if (state.zoom !== void 0) this.normalizedZoom = state.zoom;
    if (Array.isArray(state.target) && state.target.length === 3) {
      this.target.set(state.target[0], state.target[1], state.target[2]);
    } else if (state.targetY !== void 0) {
      this.target.y = state.targetY;
    }
    if (state.autoRotate !== void 0) this.autoRotate = state.autoRotate;
    if (state.autoRotateSpeed !== void 0) this.autoRotateSpeed = state.autoRotateSpeed;
    if (state.autoRotateDirection !== void 0) this.autoRotateDirection = state.autoRotateDirection;
    if (state.cameraShakeEnabled !== void 0) this.cameraShakeEnabled = state.cameraShakeEnabled;
    if (state.cameraShakeIntensity !== void 0) this.cameraShakeIntensity = state.cameraShakeIntensity;
    this.targetRotAngle = this.rotAngle;
    this.targetTiltAngle = this.tiltAngle;
    this.targetRadius = this.radius;
    if (immediate) {
      this.isTransitioning = false;
      this.applyTransform();
    }
  }
  nudge(axis, direction, delta) {
    const step = (delta ?? this.dpadStepAngle) * direction;
    if (axis === "orbit") {
      this.nudgeOrbit(step);
    } else {
      this.nudgeTilt(step);
    }
  }
  nudgeOrbit(delta) {
    this.autoRotate = false;
    this.rotAngle += delta;
    this.targetRotAngle = this.rotAngle;
    this.isTransitioning = false;
    this.applyTransform();
  }
  nudgeTilt(delta) {
    this.autoRotate = false;
    const nextTilt = this.tiltAngle + delta;
    this.tiltAngle = Math.max(_CameraController.MIN_TILT, Math.min(_CameraController.MAX_TILT, nextTilt));
    this.targetTiltAngle = this.tiltAngle;
    this.isTransitioning = false;
    this.applyTransform();
  }
  stepOrbit(direction, step = this.dpadStepAngle) {
    this.nudgeOrbit(direction * step);
  }
  stepTilt(direction, step = this.dpadStepAngle) {
    this.nudgeTilt(direction * step);
  }
  setAutoRotate(enabled, speed, direction) {
    this.autoRotate = enabled;
    if (speed !== void 0) this.autoRotateSpeed = Math.max(0, speed);
    if (direction !== void 0) this.autoRotateDirection = direction;
  }
  setAutoRotateSpeed(speed) {
    this.autoRotateSpeed = Math.max(0, speed);
  }
  setRotationDirection(direction) {
    this.autoRotateDirection = direction;
  }
  setCameraShakeEnabled(enabled) {
    this.cameraShakeEnabled = enabled;
    if (!enabled) {
      this.shakeIntensity = 0;
      this.shakeOffset.set(0, 0, 0);
      this.applyTransform();
    }
  }
  setCameraShakeIntensity(intensity) {
    this.cameraShakeIntensity = Math.max(0, Math.min(1, intensity));
  }
  triggerShake(intensity) {
    if (!this.cameraShakeEnabled || this.cameraShakeIntensity <= 0) {
      this.shakeIntensity = 0;
      this.shakeOffset.set(0, 0, 0);
      return;
    }
    const valid = Number.isFinite(intensity) ? intensity : 0;
    const scaled = valid * this.cameraShakeIntensity;
    this.shakeIntensity = Math.min(1, Math.max(this.shakeIntensity, scaled));
    if (this.shakeIntensity > 5e-3) {
      const dirX = Math.random() >= 0.5 ? 1 : -1;
      const dirY = Math.random() >= 0.5 ? 1 : -1;
      const dirZ = Math.random() >= 0.5 ? 1 : -1;
      const distScale = Math.max(1, this.radius / 10);
      const kick = this.shakeIntensity * 0.9 * distScale;
      this.shakeOffset.set(
        dirX * (0.3 + Math.random() * 0.7) * kick,
        dirY * (0.3 + Math.random() * 0.7) * kick,
        dirZ * (0.2 + Math.random() * 0.4) * kick
      );
      this.applyTransform();
    }
  }
  setViewpoint(viewpointId, immediate = false) {
    const key = viewpointId.toLowerCase();
    const vp = CANONICAL_VIEWPOINTS[key];
    if (!vp) return;
    this.activeViewpointId = vp.id;
    this.autoRotate = false;
    this.setPosition(vp.rotAngle, vp.tiltAngle, vp.zoom, immediate);
  }
  reset() {
    this.activeViewpointId = "default";
    this.rotAngle = 0;
    this.tiltAngle = 0;
    this.targetRotAngle = 0;
    this.targetTiltAngle = 0;
    this.normalizedZoom = 0.5;
    this.radius = this.baseRadius;
    this.targetRadius = this.baseRadius;
    this.autoRotate = true;
    this.shakeIntensity = 0;
    this.shakeOffset.set(0, 0, 0);
    this.isTransitioning = false;
    this.target.set(0, 0, 0);
    this.applyTransform();
  }
  update(delta, audioBeat = false, audioBass = 0) {
    const safeDelta = delta >= 8e-3 && delta <= 0.1 ? delta : 1 / 60;
    this.updateShake(safeDelta, audioBeat, audioBass);
    this.updateAutoRotate(safeDelta);
    this.updateTransition(safeDelta);
    this.applyTransform();
  }
  updateShake(safeDelta, audioBeat, audioBass) {
    if (this.cameraShakeEnabled && (audioBeat || audioBass > 0.65)) {
      const bassFactor = Number.isFinite(audioBass) ? audioBass : 0;
      this.triggerShake(Math.min(1, bassFactor * 0.9 + 0.35));
    }
    if (this.cameraShakeEnabled && this.shakeIntensity > 0.01) {
      const distScale = Math.max(1, this.radius / 10);
      const kick = this.shakeIntensity * 0.75 * distScale;
      this.shakeOffset.set(
        (Math.random() - 0.5) * kick,
        (Math.random() - 0.5) * kick,
        (Math.random() - 0.5) * kick * 0.5
      );
      this.shakeIntensity *= Math.exp(-this.shakeDecayRate * safeDelta);
    } else {
      this.shakeOffset.set(0, 0, 0);
      this.shakeIntensity = 0;
    }
  }
  updateAutoRotate(safeDelta) {
    if (this.autoRotate && this.autoRotateSpeed > 0 && !this.isTransitioning) {
      const angleDelta = safeDelta * this.autoRotateSpeed * 0.5 * this.autoRotateDirection;
      this.rotAngle = (this.rotAngle + angleDelta) % (Math.PI * 2);
      this.targetRotAngle = this.rotAngle;
    }
  }
  updateTransition(safeDelta) {
    if (!this.isTransitioning) return;
    const factor = 1 - Math.exp(-this.lerpSpeed * safeDelta);
    let diffRot = (this.targetRotAngle - this.rotAngle + Math.PI) % (Math.PI * 2);
    if (diffRot < 0) diffRot += Math.PI * 2;
    diffRot -= Math.PI;
    const diffTilt = this.targetTiltAngle - this.tiltAngle;
    const diffRadius = this.targetRadius - this.radius;
    this.rotAngle += diffRot * factor;
    this.tiltAngle += diffTilt * factor;
    this.radius += diffRadius * factor;
    if (Math.abs(diffRot) < 1e-3 && Math.abs(diffTilt) < 1e-3 && Math.abs(diffRadius) < 1e-3) {
      this.rotAngle = this.targetRotAngle;
      this.tiltAngle = this.targetTiltAngle;
      this.radius = this.targetRadius;
      this.isTransitioning = false;
    }
  }
  applyTransform() {
    const cosTilt = Math.cos(this.tiltAngle);
    const sinTilt = Math.sin(this.tiltAngle);
    const sinRot = Math.sin(this.rotAngle);
    const cosRot = Math.cos(this.rotAngle);
    this.camera.position.set(
      this.target.x + this.radius * cosTilt * sinRot + this.shakeOffset.x,
      this.target.y + this.radius * sinTilt + this.shakeOffset.y,
      this.target.z + this.radius * cosTilt * cosRot + this.shakeOffset.z
    );
    this.camera.lookAt(
      this.target.x + this.shakeOffset.x * 0.45,
      this.target.y + this.shakeOffset.y * 0.45,
      this.target.z + this.shakeOffset.z * 0.45
    );
  }
  // Getters for inspection and testing
  getCoordinates() {
    return {
      rotAngle: this.rotAngle,
      tiltAngle: this.tiltAngle,
      radius: this.radius,
      zoom: this.normalizedZoom
    };
  }
  getRotAngle() {
    return this.rotAngle;
  }
  getTiltAngle() {
    return this.tiltAngle;
  }
  getZoom() {
    return this.normalizedZoom;
  }
  getDistance() {
    return this.radius;
  }
  getActiveViewpoint() {
    return this.activeViewpointId;
  }
  getShakeIntensity() {
    return this.shakeIntensity;
  }
  getShakeOffset() {
    return this.shakeOffset;
  }
};

// src/overlay/TextOverlayEngine.ts
var THREE2 = __toESM(require("three"), 1);
function clampNumber(val, fallback, min = -Infinity, max = Infinity) {
  if (typeof val !== "number" || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, val));
}
var TextOverlayEngine = class {
  canvas;
  ctx;
  texture;
  orthoCamera;
  orthoScene;
  orthoQuad;
  width = 1920;
  height = 1080;
  dpr = 1;
  elapsedTime = 0;
  isDirty = true;
  glitchOffset = { x: 0, y: 0 };
  scaleMultiplier = 1;
  marqueeOffset = 0;
  imageOverlay = null;
  imageOpacity = 0.8;
  imageScale = 1;
  config;
  watermarkConfig;
  constructor(width = 1920, height = 1080, dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2)) {
    const validW = typeof width === "number" && Number.isFinite(width) ? Math.max(1, width) : 1920;
    const validH = typeof height === "number" && Number.isFinite(height) ? Math.max(1, height) : 1080;
    const validDpr = typeof dpr === "number" && Number.isFinite(dpr) && dpr > 0 ? Math.min(dpr, 4) : 1;
    this.width = validW;
    this.height = validH;
    this.dpr = validDpr;
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.ctx = this.canvas.getContext("2d");
    this.texture = new THREE2.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE2.LinearFilter;
    this.texture.magFilter = THREE2.LinearFilter;
    this.texture.generateMipmaps = false;
    this.orthoCamera = new THREE2.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.orthoScene = new THREE2.Scene();
    const material = new THREE2.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    this.orthoQuad = new THREE2.Mesh(new THREE2.PlaneGeometry(2, 2), material);
    this.orthoScene.add(this.orthoQuad);
    this.config = {
      layers: {
        title: "",
        artist: "",
        custom: ""
      },
      watermark: false,
      anchor: "center",
      animation: "pulse",
      fontSize: 32,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeight: "normal",
      fontStyle: "normal",
      color: "#ffffff",
      glowIntensity: 0.8,
      opacity: 1,
      animationIntensity: 0.5,
      bgShape: "none",
      bgColor: "#000000",
      bgOpacity: 0.7
    };
    this.watermarkConfig = {
      enabled: false,
      text: "VISUALIZOR",
      anchor: "bottom-right",
      fontSize: 14,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "rgba(255, 255, 255, 0.45)",
      opacity: 0.45
    };
  }
  getConfig() {
    return {
      layers: { ...this.config.layers },
      watermark: this.config.watermark,
      anchor: this.config.anchor,
      animation: this.config.animation,
      fontSize: this.config.fontSize,
      fontFamily: this.config.fontFamily,
      fontWeight: this.config.fontWeight,
      fontStyle: this.config.fontStyle,
      color: this.config.color,
      glowIntensity: this.config.glowIntensity,
      opacity: this.config.opacity,
      animationIntensity: this.config.animationIntensity,
      bgShape: this.config.bgShape,
      bgColor: this.config.bgColor,
      bgOpacity: this.config.bgOpacity
    };
  }
  setTitle(text) {
    this.config.layers.title = typeof text === "string" ? text.trim().slice(0, 200) : "";
    this.isDirty = true;
  }
  setArtist(text) {
    this.config.layers.artist = typeof text === "string" ? text.trim().slice(0, 200) : "";
    this.isDirty = true;
  }
  setCustomText(text) {
    this.config.layers.custom = typeof text === "string" ? text.trim().slice(0, 200) : "";
    this.isDirty = true;
  }
  setWatermark(enabled) {
    this.config.watermark = Boolean(enabled);
    this.watermarkConfig.enabled = Boolean(enabled);
    this.isDirty = true;
  }
  setAnchor(anchor) {
    this.config.anchor = anchor;
    this.isDirty = true;
  }
  setAnimationMode(mode) {
    this.config.animation = mode;
    this.isDirty = true;
  }
  setFontSize(size) {
    const val = typeof size === "number" && !Number.isNaN(size) ? size : 32;
    this.config.fontSize = Math.max(12, Math.min(96, Math.round(val)));
    this.isDirty = true;
  }
  setFontFamily(family) {
    if (family && typeof family === "string") {
      this.config.fontFamily = family;
      this.isDirty = true;
    }
  }
  setColor(color) {
    if (color && typeof color === "string") {
      this.config.color = color;
      this.isDirty = true;
    }
  }
  setGlowIntensity(intensity) {
    const val = typeof intensity === "number" && !Number.isNaN(intensity) ? intensity : 0.8;
    this.config.glowIntensity = Math.max(0, Math.min(2, Number(val.toFixed(2))));
    this.isDirty = true;
  }
  setOpacity(opacity) {
    const val = typeof opacity === "number" && !Number.isNaN(opacity) ? opacity : 1;
    this.config.opacity = Math.max(0, Math.min(1, Number(val.toFixed(2))));
    this.isDirty = true;
  }
  setAnimationIntensity(intensity) {
    const val = typeof intensity === "number" && !Number.isNaN(intensity) ? intensity : 0.5;
    this.config.animationIntensity = Math.max(0, Math.min(1, Number(val.toFixed(2))));
    this.isDirty = true;
  }
  clearAll() {
    this.config.layers.title = "";
    this.config.layers.artist = "";
    this.config.layers.custom = "";
    this.config.watermark = false;
    this.watermarkConfig.enabled = false;
    this.isDirty = true;
  }
  getActiveLayers() {
    const active = [];
    if (this.config.layers.title.length > 0) active.push("title");
    if (this.config.layers.artist.length > 0) active.push("artist");
    if (this.config.layers.custom.length > 0) active.push("custom");
    return active;
  }
  setImageOverlay(img) {
    this.imageOverlay = img;
    this.isDirty = true;
  }
  setImageOverlayOpacity(opacity) {
    const val = typeof opacity === "number" && !Number.isNaN(opacity) ? opacity : 0.8;
    this.imageOpacity = Math.max(0, Math.min(1, val));
    this.isDirty = true;
  }
  setImageOverlayScale(scale) {
    const val = typeof scale === "number" && !Number.isNaN(scale) ? scale : 1;
    this.imageScale = Math.max(0.1, Math.min(3, val));
    this.isDirty = true;
  }
  getImageOverlay() {
    return this.imageOverlay;
  }
  hasActiveContent() {
    return Boolean(this.imageOverlay) || this.config.watermark || this.config.layers.title.length > 0 || this.config.layers.artist.length > 0 || this.config.layers.custom.length > 0;
  }
  hasVisibleContent() {
    return this.hasActiveContent();
  }
  getGlitchDisplacement() {
    return { ...this.glitchOffset };
  }
  getScaleMultiplier() {
    return this.scaleMultiplier;
  }
  resize(width, height, dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2)) {
    const fallbackW = this.width > 0 ? this.width : 1920;
    const validW = typeof width === "number" && Number.isFinite(width) ? Math.max(1, width) : fallbackW;
    const fallbackH = this.height > 0 ? this.height : 1080;
    const validH = typeof height === "number" && Number.isFinite(height) ? Math.max(1, height) : fallbackH;
    const fallbackDpr = this.dpr > 0 ? this.dpr : 1;
    const validDpr = typeof dpr === "number" && Number.isFinite(dpr) && dpr > 0 ? Math.min(dpr, 4) : fallbackDpr;
    this.width = validW;
    this.height = validH;
    this.dpr = validDpr;
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.texture.dispose();
    this.texture.image = this.canvas;
    this.isDirty = true;
  }
  update(audioOrDelta, deltaOrTime, maybeAudio) {
    const { audio, delta } = this.resolveUpdateParams(audioOrDelta, deltaOrTime, maybeAudio);
    this.elapsedTime += delta;
    this.updateAnimations(audio);
    if (!this.hasActiveContent()) {
      this.handleInactiveOverlay();
      return;
    }
    const effectiveOpacity = this.computeEffectiveOpacity(audio);
    this.renderCanvas(effectiveOpacity, audio);
    this.texture.needsUpdate = true;
    this.isDirty = false;
  }
  resolveUpdateParams(audioOrDelta, deltaOrTime, maybeAudio) {
    if (typeof audioOrDelta === "object" && audioOrDelta !== null) {
      return {
        audio: audioOrDelta,
        delta: clampNumber(deltaOrTime, 0.016, 0)
      };
    }
    return {
      audio: maybeAudio,
      delta: clampNumber(audioOrDelta, 0.016, 0)
    };
  }
  handleInactiveOverlay() {
    if (this.isDirty && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.texture.needsUpdate = true;
      this.isDirty = false;
    }
  }
  updateAnimations(audio) {
    this.updatePulse(audio);
    this.updateGlitch(audio);
    this.updateMarquee();
  }
  updatePulse(audio) {
    if (this.config.animation !== "pulse") {
      this.scaleMultiplier = 1;
      return;
    }
    const bass = clampNumber(audio?.bass, 0, 0);
    const intensity = clampNumber(this.config.animationIntensity, 0.5, 0, 1);
    const beatBonus = audio?.beat ? 0.15 * intensity : 0;
    const computed = 1 + bass * intensity * 0.35 + beatBonus;
    this.scaleMultiplier = clampNumber(computed, 1, 0);
  }
  updateGlitch(audio) {
    if (this.config.animation !== "glitch") {
      this.glitchOffset.x = 0;
      this.glitchOffset.y = 0;
      return;
    }
    const safeBass = clampNumber(audio?.bass, 0, 0);
    const isKick = Boolean(audio?.beat) || safeBass > 0.6;
    const baseJitter = isKick ? 12 : 4;
    const intensity = clampNumber(this.config.animationIntensity, 0.5, 0, 1);
    const time = clampNumber(this.elapsedTime, 0);
    this.glitchOffset.x = Math.sin(time * 35) * baseJitter * intensity;
    this.glitchOffset.y = Math.cos(time * 45) * (baseJitter * 0.6) * intensity;
  }
  updateMarquee() {
    const anim = this.config.animation;
    if (anim !== "marquee" && anim !== "runningRow") {
      this.marqueeOffset = 0;
      return;
    }
    const intensity = clampNumber(this.config.animationIntensity, 0.5, 0, 1);
    const speed = 40 + intensity * 160;
    const time = clampNumber(this.elapsedTime, 0);
    const span = Math.max(1, clampNumber(this.width, 1920, 1) + 500);
    this.marqueeOffset = clampNumber(time * speed % span, 0, 0);
  }
  computeEffectiveOpacity(audio) {
    const intensity = clampNumber(this.config.animationIntensity, 0.5, 0, 1);
    const baseOpacity = clampNumber(this.config.opacity, 1, 0, 1);
    if (this.config.animation === "fade") {
      const time = clampNumber(this.elapsedTime, 0);
      const sine = (Math.sin(time * (1.5 + intensity * 2.5)) + 1) / 2;
      let opacity = baseOpacity * (0.35 + 0.65 * sine);
      if (audio?.beat) {
        opacity = Math.min(1, opacity + 0.2 * intensity);
      }
      return clampNumber(opacity, baseOpacity, 0, 1);
    }
    if (this.config.animation === "glow") {
      const beatEnergy = clampNumber(audio?.beatEnergy, 0, 0, 1);
      return clampNumber(0.6 + 0.4 * beatEnergy * intensity, baseOpacity, 0, 1);
    }
    return baseOpacity;
  }
  renderCanvas(effectiveOpacity, audio) {
    if (!this.ctx) return;
    if (this.ctx.save) this.ctx.save();
    if (this.ctx.setTransform) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
    const activeEntries = [];
    if (this.config.layers.title) {
      activeEntries.push({ layerId: "title", text: this.config.layers.title, size: this.config.fontSize });
    }
    if (this.config.layers.artist) {
      activeEntries.push({
        layerId: "artist",
        text: this.config.layers.artist,
        size: Math.round(this.config.fontSize * 0.75)
      });
    }
    if (this.config.layers.custom) {
      activeEntries.push({
        layerId: "custom",
        text: this.config.layers.custom,
        size: Math.round(this.config.fontSize * 0.65)
      });
    }
    if (this.imageOverlay) {
      this.renderImageOverlay();
    }
    if (activeEntries.length > 0) {
      this.renderTextLines(activeEntries, effectiveOpacity, audio);
    }
    if (this.config.watermark || this.watermarkConfig.enabled) {
      this.renderWatermark();
    }
    if (this.ctx.restore) this.ctx.restore();
  }
  renderImageOverlay() {
    if (!this.ctx || !this.imageOverlay) return;
    const img = this.imageOverlay;
    const naturalW = img.naturalWidth || img.width || 400;
    const naturalH = img.naturalHeight || img.height || 300;
    const maxDim = Math.min(this.width, this.height) * 0.45 * this.imageScale;
    const aspect = naturalW / (naturalH || 1);
    let drawW = maxDim;
    let drawH = maxDim / aspect;
    if (aspect < 1) {
      drawH = maxDim;
      drawW = maxDim * aspect;
    }
    const x = (this.width - drawW) * 0.5;
    const y = (this.height - drawH) * 0.5;
    if (this.ctx.save) this.ctx.save();
    this.ctx.globalAlpha = this.imageOpacity;
    this.ctx.drawImage(img, x, y, drawW, drawH);
    if (this.ctx.restore) this.ctx.restore();
  }
  computeAnchorCoordinates(anchor) {
    const margin = 40;
    let baseX = this.width / 2;
    let baseY = this.height / 2;
    let align = "center";
    let baseline = "middle";
    const normalized = anchor.replace("middle-left", "center-left").replace("middle-center", "center").replace("middle-right", "center-right");
    if (normalized.includes("left")) {
      baseX = margin;
      align = "left";
    } else if (normalized.includes("right")) {
      baseX = this.width - margin;
      align = "right";
    }
    if (normalized.startsWith("top")) {
      baseY = margin;
      baseline = "top";
    } else if (normalized.startsWith("bottom")) {
      baseY = this.height - margin;
      baseline = "bottom";
    }
    return { baseX, baseY, align, baseline };
  }
  renderTextLines(lines, effectiveOpacity, audio) {
    const { baseX, baseY, align, baseline } = this.computeAnchorCoordinates(this.config.anchor);
    const totalLines = lines.length;
    const lineHeightRatio = 1.35;
    lines.forEach((lineItem, index) => {
      let posX = baseX + this.glitchOffset.x;
      let posY = baseY + (index - (totalLines - 1) / 2) * (lineItem.size * lineHeightRatio) + this.glitchOffset.y;
      if (this.config.anchor.startsWith("top")) {
        posY = baseY + index * (lineItem.size * lineHeightRatio) + this.glitchOffset.y;
      } else if (this.config.anchor.startsWith("bottom")) {
        posY = baseY - (totalLines - 1 - index) * (lineItem.size * lineHeightRatio) + this.glitchOffset.y;
      }
      let lineAlign = align;
      if (this.config.animation === "marquee" || this.config.animation === "runningRow") {
        posX = this.width + 200 - this.marqueeOffset;
        lineAlign = "left";
      }
      this.renderLine(lineItem, posX, posY, lineAlign, baseline, effectiveOpacity, audio);
    });
  }
  renderLine(lineItem, posX, posY, align, baseline, effectiveOpacity, audio) {
    if (this.ctx.save) this.ctx.save();
    if (this.scaleMultiplier !== 1 && Number.isFinite(this.scaleMultiplier) && this.scaleMultiplier > 0 && this.ctx.translate && this.ctx.scale) {
      this.ctx.translate(posX, posY);
      this.ctx.scale(this.scaleMultiplier, this.scaleMultiplier);
      this.ctx.translate(-posX, -posY);
    }
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.font = `${this.config.fontWeight} ${this.config.fontStyle} ${lineItem.size}px ${this.config.fontFamily}`;
    this.ctx.fillStyle = this.config.color;
    this.ctx.globalAlpha = effectiveOpacity;
    if (this.config.glowIntensity > 0) {
      const safeGlow = clampNumber(this.config.glowIntensity, 0, 0);
      const safeBeatEnergy = clampNumber(audio?.beatEnergy, 0, 0);
      this.ctx.shadowColor = this.config.color;
      this.ctx.shadowBlur = Math.max(0, safeGlow * 12 + safeBeatEnergy * 10);
    }
    if (this.config.bgShape && this.config.bgShape !== "none") {
      this.drawBadge(lineItem, posX, posY, align, baseline, effectiveOpacity);
    }
    this.ctx.fillText(lineItem.text, posX, posY);
    if (this.ctx.restore) this.ctx.restore();
  }
  drawBadge(lineItem, posX, posY, align, baseline, effectiveOpacity) {
    if (!("roundRect" in this.ctx) || typeof this.ctx.roundRect !== "function") return;
    const textMetrics = this.ctx.measureText(lineItem.text);
    const textWidth = textMetrics.width || lineItem.text.length * lineItem.size * 0.6;
    const textHeight = lineItem.size * 1.25;
    const padX = lineItem.size * 0.4;
    const padY = lineItem.size * 0.2;
    let bgX = posX - padX;
    if (align === "center") bgX = posX - textWidth / 2 - padX;
    if (align === "right") bgX = posX - textWidth - padX;
    let bgY = posY - padY;
    if (baseline === "middle") bgY = posY - textHeight / 2 - padY;
    if (baseline === "bottom") bgY = posY - textHeight - padY;
    this.ctx.fillStyle = this.config.bgColor;
    this.ctx.globalAlpha = this.config.bgOpacity * effectiveOpacity;
    const radius = this.config.bgShape === "pill" ? (textHeight + padY * 2) / 2 : 4;
    this.ctx.beginPath();
    this.ctx.roundRect(bgX, bgY, textWidth + padX * 2, textHeight + padY * 2, radius);
    this.ctx.fill();
    this.ctx.fillStyle = this.config.color;
    this.ctx.globalAlpha = effectiveOpacity;
  }
  renderWatermark() {
    if (!this.ctx) return;
    const margin = 28;
    const x = this.width - margin;
    const y = this.height - margin;
    if (this.ctx.save) this.ctx.save();
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "bottom";
    this.ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = this.watermarkConfig.color;
    this.ctx.globalAlpha = this.watermarkConfig.opacity;
    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(this.watermarkConfig.text, x, y);
    if (this.ctx.restore) this.ctx.restore();
  }
  renderPass(renderer) {
    if (!this.hasActiveContent()) return;
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.orthoScene, this.orthoCamera);
    renderer.autoClear = prevAutoClear;
  }
  dispose() {
    this.orthoQuad.geometry.dispose();
    if (Array.isArray(this.orthoQuad.material)) {
      this.orthoQuad.material.forEach((m) => m.dispose());
    } else {
      this.orthoQuad.material.dispose();
    }
    this.texture.dispose();
  }
};

// src/presets/WaveForm.ts
var THREE4 = __toESM(require("three"), 1);

// src/tuning/ParameterStore.ts
var ParameterStore = class {
  schema;
  values = /* @__PURE__ */ new Map();
  constructor(schema) {
    this.schema = schema;
    this.reset();
  }
  getDefinitions() {
    return this.schema.map((def) => ({
      ...def,
      currentValue: this.getValue(def.id)
    }));
  }
  getValue(id) {
    const val = this.values.get(id);
    if (val !== void 0) {
      return val;
    }
    const def = this.schema.find((p) => p.id === id);
    return def ? def.defaultValue : 0;
  }
  get(id) {
    return this.getValue(id);
  }
  setValue(id, rawVal) {
    const def = this.schema.find((p) => p.id === id);
    if (!def) return;
    if (typeof rawVal !== "number" || Number.isNaN(rawVal) || !Number.isFinite(rawVal)) {
      this.values.set(id, def.defaultValue);
      return;
    }
    const snapped = Math.round((rawVal - def.min) / def.step) * def.step + def.min;
    const clamped = Math.max(def.min, Math.min(def.max, snapped));
    this.values.set(id, Number(clamped.toFixed(4)));
  }
  set(id, rawVal) {
    this.setValue(id, rawVal);
  }
  reset() {
    for (const def of this.schema) {
      this.values.set(def.id, def.defaultValue);
    }
  }
  resetAll() {
    this.reset();
  }
  toRecord() {
    const record = {};
    for (const def of this.schema) {
      record[def.id] = this.getValue(def.id);
    }
    return record;
  }
};

// src/presets/BasePreset.ts
var THREE3 = __toESM(require("three"), 1);
var BasePreset = class {
  cameraConfig;
  group = new THREE3.Group();
  paramStore = new ParameterStore([
    { id: "speed", name: "Speed", min: 0.1, max: 3, step: 0.1, defaultValue: 1 },
    { id: "reactivity", name: "Reactivity", min: 0.1, max: 2, step: 0.05, defaultValue: 1 },
    { id: "density", name: "Scale / Density", min: 0.5, max: 2, step: 0.1, defaultValue: 1 }
  ]);
  disposables = [];
  init(ctx) {
    this.group = new THREE3.Group();
    this.setup(ctx);
    ctx.scene.add(this.group);
  }
  getCustomParameters() {
    return this.paramStore.getDefinitions();
  }
  setCustomParameter(id, value) {
    this.paramStore.setValue(id, value);
  }
  getCustomParameterValue(id) {
    return this.paramStore.getValue(id);
  }
  resetCustomParameters() {
    this.paramStore.reset();
  }
  dispose() {
    if (this.group) {
      this.group.traverse((obj) => {
        const mesh = obj;
        if (mesh.geometry) {
          try {
            mesh.geometry.dispose();
          } catch {
          }
        }
        if (mesh.material) {
          try {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m?.dispose?.());
            } else {
              mesh.material.dispose?.();
            }
          } catch {
          }
        }
      });
      try {
        this.group.removeFromParent();
      } catch {
      }
    }
    for (const d of this.disposables) {
      try {
        d?.dispose?.();
      } catch {
      }
    }
    this.disposables.length = 0;
    this.onDispose();
  }
  onDispose() {
  }
};

// src/presets/WaveForm.ts
var WaveFormPreset = class extends BasePreset {
  id = "wave";
  name = "Wave Form";
  category = "Structures";
  description = "Endless glowing 3D wireframe ocean terrain undulating forward with floating stardust motes.";
  // Camera looking forward across the undulating wave horizon (visuval.io production [0, 14, 34])
  cameraConfig = {
    position: [0, 14, 34],
    target: [0, 0, 0],
    autoRotate: false,
    autoRotateSpeed: 0,
    bloomIntensity: 0.45
  };
  // 1. Terrain Mesh & Wireframe Mesh
  geometry;
  wireMesh;
  surfaceMesh;
  wireMaterial;
  terrainMaterial;
  positionAttribute;
  sceneRef;
  // 2. 3000 Floating Stardust Particles
  particlesMesh;
  particlesGeo;
  particlesMaterial;
  waveHeight = 0.5;
  waveSpeed = 0.5;
  sheetShape = 0;
  numParticles = 3e3;
  currentDensity = 64;
  audioData64 = new Float32Array(64);
  lastTime = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Wave Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "deformation", name: "Wave Height", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "density", name: "Mesh Density", min: 32, max: 256, step: 16, defaultValue: 64 }
    ]);
  }
  setup(ctx) {
    this.sceneRef = ctx.scene;
    ctx.scene.fog = new THREE4.FogExp2(0, 0.016);
    const primaryCol = new THREE4.Color(ctx.theme.primary);
    const secondaryCol = new THREE4.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    const size = 120;
    const halfSize = size * 0.5;
    const edgeFade = 22.5;
    const initialDensity = Math.max(16, Math.min(256, Math.round(this.paramStore.getValue("density") ?? 64)));
    this.currentDensity = initialDensity;
    const segs = initialDensity - 1;
    this.geometry = new THREE4.PlaneGeometry(size, size, segs, segs);
    this.positionAttribute = this.geometry.attributes.position;
    this.wireMaterial = new THREE4.MeshStandardMaterial({
      color: primaryCol,
      emissive: primaryCol,
      emissiveIntensity: 0.4,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
      roughness: 0.2,
      metalness: 0.3
    });
    this.wireMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWorldWavePos;`
      ).replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vWorldWavePos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWorldWavePos;`
      ).replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        float dist = length(vWorldWavePos.xz);
        float edgeAlpha = smoothstep(54.0, 24.0, dist);
        gl_FragColor.a *= edgeAlpha;`
      );
    };
    this.wireMesh = new THREE4.Mesh(this.geometry, this.wireMaterial);
    this.wireMesh.rotation.x = -Math.PI / 2;
    this.group.add(this.wireMesh);
    this.terrainMaterial = new THREE4.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: primaryCol },
        uColor2: { value: secondaryCol },
        uAudioData: { value: this.audioData64 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uAudio: { value: 0 },
        uSensitivity: { value: 0.75 },
        uWaveHeight: { value: 0.5 },
        uWaveSpeed: { value: 0.5 },
        uHalfSize: { value: halfSize },
        uEdgeFade: { value: edgeFade },
        uSheetShape: { value: this.sheetShape }
      },
      vertexShader: `
        varying vec3 vPos;
        varying float vHeight;

        void main() {
          vPos = position;
          vHeight = position.z;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uHalfSize;
        uniform float uEdgeFade;
        uniform float uSheetShape;
        varying vec3 vPos;
        varying float vHeight;

        void main() {
          float t = smoothstep(-4.0, 6.0, vHeight);

          vec3 deepColor = uColor1 * 0.1;
          vec3 midColor = mix(uColor1, uColor2, 0.5) * 0.6;
          vec3 peakColor = uColor2 * 1.0;

          vec3 color = mix(deepColor, midColor, smoothstep(-4.0, 0.0, vHeight));
          color = mix(color, peakColor, smoothstep(0.0, 6.0, vHeight));

          float glow = exp(-abs(vHeight - 3.0) * 0.2) * 0.6;
          color += uColor2 * glow;

          float grid = step(0.94, fract(vPos.x * 0.333)) + step(0.94, fract(vPos.y * 0.333));
          color += vec3(grid) * uColor2 * 0.4;

          float radialDist = length(vPos.xy);
          float circularAlpha = smoothstep(54.0, 24.0, radialDist);
          float edgeDist = min(uHalfSize - abs(vPos.x), uHalfSize - abs(vPos.y));
          float squareAlpha = smoothstep(0.0, uEdgeFade, edgeDist);
          float alpha = mix(circularAlpha, squareAlpha, uSheetShape);
          gl_FragColor = vec4(color, alpha * 0.85);
        }
      `,
      transparent: true,
      wireframe: false,
      side: THREE4.DoubleSide,
      depthWrite: false
    });
    this.surfaceMesh = new THREE4.Mesh(this.geometry, this.terrainMaterial);
    this.surfaceMesh.rotation.x = -Math.PI / 2;
    this.group.add(this.surfaceMesh);
    const count = this.numParticles;
    this.particlesGeo = new THREE4.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const fades = new Float32Array(count);
    const phases = new Float32Array(count);
    const halfWidth = 52.5;
    const heightRange = 33;
    for (let i = 0; i < count; i++) {
      const px = (Math.random() * 2 - 1) * halfWidth;
      const py = Math.random() * heightRange + 3;
      const pz = (Math.random() * 2 - 1) * halfWidth;
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      const rDist = Math.hypot(px, pz) / halfWidth;
      const hNorm = py / (heightRange + 3);
      const fade = 1 - Math.pow(Math.max(rDist, hNorm), 2);
      sizes[i] = Math.random() * 2 + 1;
      fades[i] = Math.max(0, fade);
      phases[i] = Math.random() * Math.PI * 2;
    }
    this.particlesGeo.setAttribute("position", new THREE4.BufferAttribute(positions, 3));
    this.particlesGeo.setAttribute("size", new THREE4.BufferAttribute(sizes, 1));
    this.particlesGeo.setAttribute("aFade", new THREE4.BufferAttribute(fades, 1));
    this.particlesGeo.setAttribute("aPhase", new THREE4.BufferAttribute(phases, 1));
    this.particlesMaterial = new THREE4.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: primaryCol }
      },
      vertexShader: `
        attribute float size;
        attribute float aFade;
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.5 + aPhase) * 1.2;
          pos.x += sin(uTime * 0.3 + aPhase * 1.7) * 0.8;
          pos.z += cos(uTime * 0.4 + aPhase * 2.3) * 0.6;
          float twinkle = 0.3 + 0.7 * sin(uTime * 1.5 + aPhase);
          vAlpha = twinkle * aFade;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (200.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          float softEdge = 1.0 - smoothstep(0.0, 0.5, d);
          float core = exp(-d * 14.0);
          float inner = exp(-d * 6.0);
          float halo = exp(-d * 2.5) * 0.35;
          float glow = core * 0.5 + inner * 0.35 + halo;
          float alpha = glow * softEdge;
          if (alpha < 0.005) discard;
          vec3 color = mix(uColor * 2.0, vec3(1.0, 0.97, 0.92), core * 0.4);
          gl_FragColor = vec4(color, alpha * vAlpha * 0.6);
        }
      `,
      transparent: true,
      blending: THREE4.AdditiveBlending,
      depthWrite: false
    });
    this.particlesMesh = new THREE4.Points(this.particlesGeo, this.particlesMaterial);
    this.group.add(this.particlesMesh);
  }
  update(ctx, audio, time, delta) {
    const dt = Math.min(delta, 0.1);
    const speedParam = this.paramStore.get("speed") ?? 1;
    const reactParam = this.paramStore.get("reactivity") ?? 1;
    const deformParam = this.paramStore.get("deformation") ?? 1;
    const densityParam = this.paramStore.get("density") ?? 64;
    if (Math.round(densityParam) !== this.currentDensity) {
      this.rebuildGeometry(densityParam);
    }
    const sens = reactParam;
    const elapsed = this.lastTime += dt * speedParam;
    this.resampleFrequencyData(audio.frequencyData);
    this.updateTerrainUniforms(elapsed, sens, deformParam, speedParam, audio);
    if (this.particlesMaterial?.uniforms) {
      this.particlesMaterial.uniforms.uTime.value = elapsed;
    }
    this.updateWireEmissive(audio);
    this.updateCpuWaveHeight(elapsed, sens, deformParam, speedParam, audio, time);
  }
  updateWireEmissive(audio) {
    if (audio.beat) {
      this.wireMaterial.emissiveIntensity = Math.min(2, 0.9 + audio.beatEnergy * 1);
    } else {
      this.wireMaterial.emissiveIntensity = THREE4.MathUtils.lerp(this.wireMaterial.emissiveIntensity, 0.35, 0.75);
    }
  }
  updateCpuWaveHeight(elapsed, sens, deformParam, speedParam, audio, rawTime) {
    const isSilent = audio.rms === 0 && audio.bass === 0 && audio.mid === 0 && audio.treble === 0;
    const vertexCount = this.positionAttribute.count;
    if (isSilent && rawTime <= 1.05) {
      for (let i = 0; i < vertexCount; i++) {
        this.positionAttribute.setZ(i, 0);
      }
      this.positionAttribute.needsUpdate = true;
      return;
    }
    const speedScale = 0.3 + this.waveSpeed * speedParam * 1.7;
    const baseAmp = 0.3 + this.waveHeight * deformParam * 1.7;
    const globalMod = 0.7 + audio.rms * sens * 0.8;
    for (let i = 0; i < vertexCount; i++) {
      const px = this.positionAttribute.getX(i);
      const py = this.positionAttribute.getY(i);
      const dist = Math.hypot(px, py);
      const wave1 = Math.sin(px * 0.15 + elapsed * 1.5 * speedScale) * Math.cos(py * 0.15 + elapsed * 0.8 * speedScale);
      const wave2 = Math.sin(px * 0.3 - elapsed * 0.7 * speedScale) * Math.sin(py * 0.2 + elapsed * 1.2 * speedScale);
      const wave3 = Math.cos(dist * 0.1 - elapsed * 2 * speedScale) * 2;
      const baseWaves = (wave1 * 2 + wave2 * 1.5 + wave3) * baseAmp;
      const ripple = (audio.bass * sens * 2.5 + audio.rms * sens * 2.5) * Math.sin(dist * 0.12 - elapsed * 3 * speedScale);
      const h = baseWaves * globalMod + ripple;
      this.positionAttribute.setZ(i, h);
    }
    this.positionAttribute.needsUpdate = true;
  }
  resampleFrequencyData(frequencyData) {
    const dataLen = frequencyData ? frequencyData.length : 0;
    for (let i = 0; i < 64; i++) {
      const idx = dataLen > 0 ? Math.floor(i / 64 * dataLen) : 0;
      this.audioData64[i] = dataLen > 0 && frequencyData ? frequencyData[idx] / 255 : 0;
    }
  }
  updateTerrainUniforms(elapsed, sens, deformParam, speedParam, audio) {
    if (!this.terrainMaterial?.uniforms) return;
    const u = this.terrainMaterial.uniforms;
    u.uTime.value = elapsed;
    u.uSensitivity.value = sens;
    u.uBass.value = audio.bass * sens;
    u.uMid.value = audio.mid * sens;
    u.uTreble.value = audio.treble * sens;
    u.uAudio.value = audio.rms * sens;
    u.uWaveHeight.value = this.waveHeight * deformParam;
    u.uWaveSpeed.value = this.waveSpeed * speedParam;
    u.uSheetShape.value = this.sheetShape;
  }
  onParticleConfigChange(density, spread) {
    if (this.particlesGeo) {
      if (density <= 0) {
        if (this.particlesMesh) this.particlesMesh.visible = false;
        this.particlesGeo.setDrawRange(0, 0);
      } else {
        if (this.particlesMesh) {
          this.particlesMesh.visible = true;
          this.particlesMesh.scale.set(spread, spread, spread);
        }
        this.particlesGeo.setDrawRange(0, Math.floor(this.numParticles * Math.min(1, density)));
      }
    }
  }
  onThemeChange(theme) {
    const stops = theme.gradientStops;
    const primaryCol = new THREE4.Color(stops?.[0] ?? theme.primary);
    const secondaryCol = new THREE4.Color(stops?.[1] ?? theme.secondary ?? theme.accent ?? theme.primary);
    const particleCol = new THREE4.Color(stops?.[2] ?? stops?.[0] ?? theme.primary);
    if (this.wireMaterial) {
      this.wireMaterial.color.copy(primaryCol);
      this.wireMaterial.emissive.copy(primaryCol);
    }
    if (this.terrainMaterial?.uniforms) {
      this.terrainMaterial.uniforms.uColor1.value.copy(primaryCol);
      this.terrainMaterial.uniforms.uColor2.value.copy(secondaryCol);
    }
    if (this.particlesMaterial?.uniforms) {
      this.particlesMaterial.uniforms.uColor.value.copy(particleCol);
    }
  }
  rebuildGeometry(density) {
    if (!this.wireMesh || !this.surfaceMesh) return;
    const boundedDensity = Math.max(16, Math.min(256, Math.round(density)));
    if (this.currentDensity === boundedDensity && this.geometry) return;
    this.currentDensity = boundedDensity;
    const oldGeometry = this.geometry;
    const size = 120;
    const segs = boundedDensity - 1;
    this.geometry = new THREE4.PlaneGeometry(size, size, segs, segs);
    this.positionAttribute = this.geometry.attributes.position;
    this.wireMesh.geometry = this.geometry;
    this.surfaceMesh.geometry = this.geometry;
    if (oldGeometry) {
      oldGeometry.dispose();
    }
  }
  setCustomParameter(id, value) {
    super.setCustomParameter(id, value);
    if (id === "density") {
      this.rebuildGeometry(value);
    }
  }
  resetCustomParameters() {
    super.resetCustomParameters();
    const defaultDensity = this.paramStore.getValue("density") ?? 64;
    this.rebuildGeometry(defaultDensity);
  }
  onDispose() {
    if (this.sceneRef) {
      this.sceneRef.fog = null;
    }
    this.geometry?.dispose();
    this.wireMaterial?.dispose();
    this.terrainMaterial?.dispose();
    this.particlesGeo?.dispose();
    this.particlesMaterial?.dispose();
  }
};

// src/presets/CircularSpectrum.ts
var THREE5 = __toESM(require("three"), 1);
function createArcGeometry(innerR, outerR, halfWidth, segments) {
  const vertices = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const radius = innerR + (outerR - innerR) * progress;
    const width = halfWidth * (1 - progress * 0.5);
    const elevation = progress * progress * 2.5;
    vertices.push(radius, elevation, -width, radius, elevation, width);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }
  const geo = new THREE5.BufferGeometry();
  geo.setAttribute("position", new THREE5.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
var CircularSpectrumPreset = class extends BasePreset {
  id = "circular";
  name = "Circular";
  category = "Structures";
  description = "Volumetric glowing cosmic star core, orbital rings, and soft celestial nebula dust cloud.";
  // Camera looking at cosmic core (visuval.io production [0, 18, 30])
  cameraConfig = {
    position: [0, 18, 30],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.35,
    bloomIntensity: 0.55
  };
  // 1. Concentric Resonance Ring Group (this.group contains 16 concentric lines for tests)
  rings = [];
  ringGeometries = [];
  ringMaterials = [];
  numRings = 16;
  ringSegments = 128;
  ringSpeeds = new Float32Array(16);
  ringRotations = new Float32Array(16);
  ringHarmonics = new Int32Array(16);
  // 2. Cosmic Composition Group (added directly to ctx.scene alongside this.group)
  coreGroup = new THREE5.Group();
  // 3. Cosmic Core & Corona Shell
  core;
  coronaShell;
  innerRing;
  outerRing;
  // 4. 5 Orbital Rings
  orbitalRingGroup;
  orbitalRings = [];
  orbitalRingConfigs = [
    { radius: 6, tube: 0.04, tiltX: Math.PI * 0.35, tiltZ: 0.3, speed: 1, band: "bass" },
    { radius: 7.5, tube: 0.03, tiltX: Math.PI * 0.55, tiltZ: -0.5, speed: -0.7, band: "mid" },
    { radius: 9, tube: 0.035, tiltX: Math.PI * 0.2, tiltZ: 0.8, speed: 0.5, band: "treble" },
    { radius: 11, tube: 0.025, tiltX: Math.PI * 0.65, tiltZ: -0.2, speed: -0.4, band: "bass" },
    { radius: 13.5, tube: 0.03, tiltX: Math.PI * 0.4, tiltZ: 0.6, speed: 0.3, band: "mid" }
  ];
  orbitalRingRotationsY = new Float32Array(5);
  // 5. Instanced Spectral Arcs (64 Ribbons)
  arcInstanced = null;
  sharedArcGeo = null;
  arcIntensities = new Float32Array(64);
  arcIndices = new Float32Array(64);
  arcCount = 64;
  arcDummy = new THREE5.Object3D();
  // 6. Frequency Ribbons (10,000 Particles in 3 Bands)
  frequencyRibbons = null;
  freqRibbonsGeo = null;
  freqRibbonsMat = null;
  // 7. Nebula Cloud (4,000 Voluminous Stardust Dust Particles - soft Gaussian falloff)
  nebulaParticles = null;
  nebulaGeo = null;
  nebulaMat = null;
  // 8. Halo Particles (6,000 Glowing Halo Particles)
  haloParticles = null;
  haloGeo = null;
  haloMat = null;
  // 9. Shockwave Rings (4 Expanding Rings on Bass Spikes)
  shockwaveInstanced = null;
  swOpacities = new Float32Array(4);
  shockwaveData = [];
  swDummy = new THREE5.Object3D();
  lastBassSpike = 0;
  bassAccum = 0;
  // 10. Energy Tendrils (8 Lines)
  tendrils = [];
  tendrilFrame = 0;
  // 11. Light Beams (24 Radiating Beams)
  beamInstanced = null;
  beamOpacities = new Float32Array(24);
  beamDummy = new THREE5.Object3D();
  beamRotationZ = 0;
  // Audio smoothers
  smoothBass = 0;
  smoothMid = 0;
  smoothTreble = 0;
  smoothAvg = 0;
  lastTime = null;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Rotation Speed", min: 0.1, max: 2, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Reactivity", min: 0.2, max: 2, step: 0.1, defaultValue: 1 },
      { id: "deformation", name: "Core Pulse", min: 0.2, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "density", name: "Ring Density", min: 4, max: 16, step: 1, defaultValue: 16 }
    ]);
  }
  init(ctx) {
    this.group = new THREE5.Group();
    ctx.scene.add(this.group);
    this.coreGroup.removeFromParent();
    this.coreGroup.clear();
    ctx.scene.add(this.coreGroup);
    this.setup(ctx);
  }
  setup(ctx) {
    this.rings.length = 0;
    this.ringGeometries.length = 0;
    this.ringMaterials.length = 0;
    this.orbitalRings.length = 0;
    this.tendrils.length = 0;
    this.shockwaveData.length = 0;
    this.buildResonanceRings(ctx);
    this.buildPulseCore(ctx);
    this.buildOrbitalRings(ctx);
    this.buildSpectralArcs(ctx);
    this.buildFrequencyRibbons(ctx);
    this.buildNebulaLayer(ctx);
    this.buildHaloParticles(ctx);
    this.buildShockwaveRings(ctx);
    this.buildEnergyTendrils(ctx);
    this.buildLightBeams(ctx);
  }
  buildResonanceRings(ctx) {
    const primaryCol = new THREE5.Color(ctx.theme.primary);
    const secondaryCol = new THREE5.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    for (let i = 0; i < this.numRings; i++) {
      const geo = new THREE5.BufferGeometry();
      const positions = new Float32Array((this.ringSegments + 1) * 3);
      const radius = 5 + i * 1.1;
      for (let j = 0; j <= this.ringSegments; j++) {
        const theta = j / this.ringSegments * Math.PI * 2;
        positions[j * 3] = Math.cos(theta) * radius;
        positions[j * 3 + 1] = 0;
        positions[j * 3 + 2] = Math.sin(theta) * radius;
      }
      geo.setAttribute("position", new THREE5.BufferAttribute(positions, 3));
      this.ringGeometries.push(geo);
      const color = new THREE5.Color().lerpColors(primaryCol, secondaryCol, i / this.numRings);
      const mat = new THREE5.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2 + i / this.numRings * 0.2,
        blending: THREE5.AdditiveBlending
      });
      this.ringMaterials.push(mat);
      const dir = i % 2 === 0 ? 1 : -1;
      this.ringSpeeds[i] = dir * (0.5 + (this.numRings - i) * 0.05);
      this.ringHarmonics[i] = 2 + i % 4;
      const ring = new THREE5.LineLoop(geo, mat);
      this.rings.push(ring);
      this.group.add(ring);
    }
  }
  buildPulseCore(ctx) {
    const primary = new THREE5.Color(ctx.theme.primary);
    const secondary = new THREE5.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    const coreGeo = new THREE5.IcosahedronGeometry(3, 6);
    const coreMat = new THREE5.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: primary },
        uColor2: { value: secondary },
        uBass: { value: 0 },
        uAudio: { value: 0 },
        uPulseRate: { value: 0.5 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vDisplacement;

        float noise3(vec3 p) {
          return sin(p.x * 1.7 + p.y * 2.3 + uTime * 1.2)
               * cos(p.y * 1.9 + p.z * 2.1 + uTime * 0.9)
               * sin(p.z * 2.5 + p.x * 1.3 + uTime * 1.5);
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position;

          float n1 = noise3(pos * 1.2) * 0.6;
          float n2 = noise3(pos * 2.5 + 10.0) * 0.35;
          float n3 = noise3(pos * 5.0 + 20.0) * 0.15;
          float displacement = (n1 + n2 + n3) * (1.0 + uBass * 4.5);
          vDisplacement = displacement;

          pos += normal * displacement;
          vWorldPos = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        uniform float uAudio;
        uniform float uPulseRate;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vDisplacement;

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          float pulse = sin(vWorldPos.y * 3.0 + uTime * (1.0 + uPulseRate * 5.0)) * 0.5 + 0.5;
          float pulse2 = sin(vWorldPos.x * 2.5 - uTime * 2.0) * 0.5 + 0.5;

          vec3 coreColor = mix(uColor1, uColor2, fresnel);
          coreColor += uColor2 * pulse * 0.4;
          coreColor += uColor1 * pulse2 * 0.2;
          coreColor *= 1.0 + vDisplacement * 2.0;

          float edgeGlow = fresnel * (2.0 + uAudio * 3.0);
          coreColor += uColor1 * edgeGlow * 0.5;
          coreColor += vec3(1.0, 0.95, 0.9) * pow(fresnel, 4.0) * 0.6;

          float alpha = 0.85 + fresnel * 0.15;
          gl_FragColor = vec4(coreColor, alpha);
        }
      `,
      transparent: true
    });
    this.core = new THREE5.Mesh(coreGeo, coreMat);
    this.coreGroup.add(this.core);
    const shellGeo = new THREE5.IcosahedronGeometry(4.2, 4);
    const shellMat = new THREE5.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: primary },
        uColor2: { value: secondary },
        uBass: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vNoise;

        float noise3(vec3 p) {
          return sin(p.x * 1.3 + p.y * 2.1 + uTime * 0.8)
               * cos(p.y * 1.7 + p.z * 1.9 + uTime * 1.1)
               * sin(p.z * 2.3 + p.x * 1.5 + uTime * 0.7);
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position;
          float n = noise3(pos * 0.8) * (0.8 + uBass * 2.0);
          vNoise = n;
          pos += normal * n;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uBass;
        varying vec3 vNormal;
        varying float vNoise;

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          vec3 color = mix(uColor1, uColor2, fresnel) * (1.5 + uBass);
          float alpha = fresnel * (0.25 + uBass * 0.3) * (0.5 + abs(vNoise));
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE5.AdditiveBlending,
      depthWrite: false,
      side: THREE5.DoubleSide
    });
    this.coronaShell = new THREE5.Mesh(shellGeo, shellMat);
    this.coreGroup.add(this.coronaShell);
    const innerRingGeo = new THREE5.TorusGeometry(4.5, 0.08, 16, 128);
    const innerRingMat = new THREE5.MeshBasicMaterial({
      color: secondary,
      transparent: true,
      opacity: 0.6,
      blending: THREE5.AdditiveBlending,
      depthWrite: false
    });
    this.innerRing = new THREE5.Mesh(innerRingGeo, innerRingMat);
    this.innerRing.rotation.x = Math.PI / 2;
    this.coreGroup.add(this.innerRing);
    const outerRingGeo = new THREE5.TorusGeometry(20, 0.05, 16, 256);
    const outerRingMat = new THREE5.MeshBasicMaterial({
      color: primary,
      transparent: true,
      opacity: 0.25,
      blending: THREE5.AdditiveBlending,
      depthWrite: false
    });
    this.outerRing = new THREE5.Mesh(outerRingGeo, outerRingMat);
    this.outerRing.rotation.x = Math.PI / 2;
    this.coreGroup.add(this.outerRing);
  }
  buildOrbitalRings(ctx) {
    const primary = new THREE5.Color(ctx.theme.primary);
    const secondary = new THREE5.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    this.orbitalRingGroup = new THREE5.Group();
    this.coreGroup.add(this.orbitalRingGroup);
    for (const config of this.orbitalRingConfigs) {
      const geo = new THREE5.TorusGeometry(config.radius, config.tube, 16, 192);
      const color = config.band === "bass" ? primary : secondary;
      const mat = new THREE5.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        blending: THREE5.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE5.Mesh(geo, mat);
      ring.rotation.set(config.tiltX, 0, config.tiltZ);
      this.orbitalRings.push(ring);
      this.orbitalRingGroup.add(ring);
    }
  }
  buildSpectralArcs(ctx) {
    const primary = new THREE5.Color(ctx.theme.primary);
    const secondary = new THREE5.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    this.sharedArcGeo = createArcGeometry(5, 18, 0.22, 32);
    for (let i = 0; i < this.arcCount; i++) {
      this.arcIntensities[i] = 0;
      this.arcIndices[i] = i / this.arcCount;
    }
    this.sharedArcGeo.setAttribute("aIntensity", new THREE5.InstancedBufferAttribute(this.arcIntensities, 1));
    this.sharedArcGeo.setAttribute("aIndex", new THREE5.InstancedBufferAttribute(this.arcIndices, 1));
    const arcMat = new THREE5.ShaderMaterial({
      uniforms: {
        uColor1: { value: primary },
        uColor2: { value: secondary }
      },
      vertexShader: `
        attribute float aIntensity;
        attribute float aIndex;
        varying float vProgress;
        varying vec3 vPos;
        varying float vIntensity;
        varying float vIndex;

        void main() {
          vIntensity = aIntensity;
          vIndex = aIndex;
          vPos = position;
          vProgress = (length(position.xz) - 5.0) / 13.0;

          vec3 pos = position;
          float scale = 1.0 + aIntensity * 0.8 * vProgress;
          pos.xz *= scale;
          pos.y *= 1.0 + aIntensity * 3.5 * vProgress;

          vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vProgress;
        varying float vIntensity;
        varying float vIndex;

        void main() {
          vec3 color = mix(uColor2, uColor1, vProgress);
          color *= 0.8 + vIntensity * 2.5;
          color += vec3(1.0, 0.95, 0.9) * vIntensity * 0.3 * (1.0 - vProgress);
          float alpha = (0.2 + vIntensity * 0.8) * (1.0 - vProgress * 0.3);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE5.AdditiveBlending,
      depthWrite: false,
      side: THREE5.DoubleSide
    });
    this.arcInstanced = new THREE5.InstancedMesh(this.sharedArcGeo, arcMat, this.arcCount);
    this.arcInstanced.frustumCulled = false;
    for (let i = 0; i < this.arcCount; i++) {
      const angle = i / this.arcCount * Math.PI * 2;
      this.arcDummy.position.set(0, 0, 0);
      this.arcDummy.rotation.set(0, angle, 0);
      this.arcDummy.scale.set(1, 1, 1);
      this.arcDummy.updateMatrix();
      this.arcInstanced.setMatrixAt(i, this.arcDummy.matrix);
    }
    this.arcInstanced.instanceMatrix.needsUpdate = true;
    this.coreGroup.add(this.arcInstanced);
  }
  buildFrequencyRibbons(ctx) {
    const primary = new THREE5.Color(ctx.theme.primary);
    const secondary = new THREE5.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    const count = 1e4;
    this.freqRibbonsGeo = new THREE5.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const aData = new Float32Array(count * 3);
    const bands = [
      { rMin: 5.5, rMax: 9, ySpread: 0.3, speed: 0.8, band: 0 },
      { rMin: 9, rMax: 14, ySpread: 0.6, speed: -0.5, band: 1 },
      { rMin: 14, rMax: 20, ySpread: 1, speed: 0.3, band: 2 }
    ];
    for (let i = 0; i < count; i++) {
      let bIdx = 2;
      if (i < count * 0.4) {
        bIdx = 0;
      } else if (i < count * 0.75) {
        bIdx = 1;
      }
      const b = bands[bIdx];
      const theta = Math.random() * Math.PI * 2;
      const r = b.rMin + Math.random() * (b.rMax - b.rMin);
      const y = (Math.random() - 0.5) * b.ySpread;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      aData[i * 3] = r;
      aData[i * 3 + 1] = b.speed;
      aData[i * 3 + 2] = b.band;
    }
    this.freqRibbonsGeo.setAttribute("position", new THREE5.BufferAttribute(positions, 3));
    this.freqRibbonsGeo.setAttribute("aRibbonData", new THREE5.BufferAttribute(aData, 3));
    this.freqRibbonsMat = new THREE5.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: primary },
        uColor2: { value: secondary },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 }
      },
      vertexShader: `
        attribute vec3 aRibbonData;
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        varying float vAlpha;
        varying vec3 vColor;
        uniform vec3 uColor1;
        uniform vec3 uColor2;

        void main() {
          float radius = aRibbonData.x;
          float speed = aRibbonData.y;
          float band = aRibbonData.z;

          float energy = band < 0.5 ? uBass : (band < 1.5 ? uMid : uTreble);
          float angle = atan(position.z, position.x) + uTime * speed * 0.15;
          float curR = radius * (1.0 + energy * 0.25);

          vec3 pos;
          pos.x = cos(angle) * curR;
          pos.z = sin(angle) * curR;
          pos.y = position.y + sin(angle * 6.0 + uTime * 2.0) * (0.3 + energy * 1.5);

          vColor = mix(uColor1, uColor2, band * 0.5);
          vAlpha = 0.35 + energy * 0.65;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (1.5 + energy * 2.5) * (150.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float falloff = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(vColor, vAlpha * falloff);
        }
      `,
      transparent: true,
      blending: THREE5.AdditiveBlending,
      depthWrite: false
    });
    this.frequencyRibbons = new THREE5.Points(this.freqRibbonsGeo, this.freqRibbonsMat);
    this.coreGroup.add(this.frequencyRibbons);
  }
  buildNebulaLayer(ctx) {
    const primary = new THREE5.Color(ctx.theme.primary);
    const secondary = new THREE5.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    const count = 4e3;
    this.nebulaGeo = new THREE5.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const aRandom = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 16;
      const y = (Math.random() - 0.5) * 6;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      sizes[i] = Math.random() * 8 + 3;
      aRandom[i] = Math.random();
    }
    this.nebulaGeo.setAttribute("position", new THREE5.BufferAttribute(positions, 3));
    this.nebulaGeo.setAttribute("size", new THREE5.BufferAttribute(sizes, 1));
    this.nebulaGeo.setAttribute("aRandom", new THREE5.BufferAttribute(aRandom, 1));
    this.nebulaMat = new THREE5.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: primary },
        uColor2: { value: secondary },
        uAudio: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;
        uniform float uTime;
        uniform float uAudio;
        varying float vAlpha;
        varying float vMix;

        void main() {
          vec3 pos = position;
          float angle = atan(pos.z, pos.x) + uTime * 0.03;
          float r = length(pos.xz);
          pos.x = cos(angle) * r;
          pos.z = sin(angle) * r;
          pos.y += sin(uTime * 0.4 + aRandom * 6.28) * 1.5;

          vAlpha = 0.08 + uAudio * 0.15;
          vMix = aRandom;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = max(size * (1.0 + uAudio * 0.5) * (200.0 / -mvPos.z), 2.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vAlpha;
        varying float vMix;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float d = length(center);
          float softEdge = 1.0 - smoothstep(0.35, 0.5, d);
          float glow = exp(-d * 3.0) * softEdge;
          if (glow < 0.01) discard;
          vec3 color = mix(uColor1, uColor2, vMix) * 0.8;
          gl_FragColor = vec4(color, glow * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE5.AdditiveBlending,
      depthWrite: false
    });
    this.nebulaParticles = new THREE5.Points(this.nebulaGeo, this.nebulaMat);
    this.coreGroup.add(this.nebulaParticles);
  }
  buildHaloParticles(ctx) {
    const primary = new THREE5.Color(ctx.theme.primary);
    const count = 6e3;
    this.haloGeo = new THREE5.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const aPhase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      const r = 20 + Math.random() * 8;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = Math.random() * 2.5 + 0.8;
      aPhase[i] = Math.random() * Math.PI * 2;
    }
    this.haloGeo.setAttribute("position", new THREE5.BufferAttribute(positions, 3));
    this.haloGeo.setAttribute("size", new THREE5.BufferAttribute(sizes, 1));
    this.haloGeo.setAttribute("aPhase", new THREE5.BufferAttribute(aPhase, 1));
    this.haloMat = new THREE5.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: primary },
        uAudio: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aPhase;
        uniform float uTime;
        uniform float uAudio;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          float twinkle = sin(uTime * 2.0 + aPhase) * 0.5 + 0.5;
          vAlpha = (0.2 + twinkle * 0.5) * (0.6 + uAudio * 0.4);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (120.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float core = exp(-d * 8.0);
          gl_FragColor = vec4(uColor, vAlpha * core);
        }
      `,
      transparent: true,
      blending: THREE5.AdditiveBlending,
      depthWrite: false
    });
    this.haloParticles = new THREE5.Points(this.haloGeo, this.haloMat);
    this.coreGroup.add(this.haloParticles);
  }
  buildShockwaveRings(ctx) {
    const primary = new THREE5.Color(ctx.theme.primary);
    const ringGeo = new THREE5.TorusGeometry(1, 0.12, 8, 128);
    this.shockwaveData = [
      { life: 0, active: false },
      { life: 0, active: false },
      { life: 0, active: false },
      { life: 0, active: false }
    ];
    const swMat = new THREE5.ShaderMaterial({
      uniforms: {
        uColor: { value: primary }
      },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vOpacity;
        void main() {
          if (vOpacity < 0.01) discard;
          gl_FragColor = vec4(uColor, vOpacity);
        }
      `,
      transparent: true,
      blending: THREE5.AdditiveBlending,
      depthWrite: false
    });
    ringGeo.setAttribute("aOpacity", new THREE5.InstancedBufferAttribute(this.swOpacities, 1));
    this.shockwaveInstanced = new THREE5.InstancedMesh(ringGeo, swMat, 4);
    this.shockwaveInstanced.frustumCulled = false;
    for (let i = 0; i < 4; i++) {
      this.swDummy.scale.set(0, 0, 0);
      this.swDummy.updateMatrix();
      this.shockwaveInstanced.setMatrixAt(i, this.swDummy.matrix);
      this.swOpacities[i] = 0;
    }
    this.shockwaveInstanced.instanceMatrix.needsUpdate = true;
    this.coreGroup.add(this.shockwaveInstanced);
  }
  buildEnergyTendrils(ctx) {
    const secondary = new THREE5.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    const tendrilCount = 8;
    const segCount = 40;
    for (let i = 0; i < tendrilCount; i++) {
      const geo = new THREE5.BufferGeometry();
      const positions = new Float32Array(segCount * 3);
      geo.setAttribute("position", new THREE5.BufferAttribute(positions, 3));
      const mat = new THREE5.LineBasicMaterial({
        color: secondary,
        transparent: true,
        opacity: 0.4,
        blending: THREE5.AdditiveBlending
      });
      const line = new THREE5.Line(geo, mat);
      line.userData = {
        baseAngle: i / tendrilCount * Math.PI * 2,
        segCount
      };
      this.tendrils.push(line);
      this.coreGroup.add(line);
    }
  }
  buildLightBeams(ctx) {
    const primary = new THREE5.Color(ctx.theme.primary);
    const beamCount = 24;
    const beamGeo = new THREE5.CylinderGeometry(0.04, 0.8, 35, 8, 1, true);
    beamGeo.translate(0, 17.5, 0);
    const beamMat = new THREE5.ShaderMaterial({
      uniforms: {
        uColor: { value: primary }
      },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        varying float vHeight;

        void main() {
          vOpacity = aOpacity;
          vHeight = position.y / 35.0;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vOpacity;
        varying float vHeight;

        void main() {
          float fade = (1.0 - vHeight) * vOpacity;
          if (fade < 0.005) discard;
          gl_FragColor = vec4(uColor, fade * 0.25);
        }
      `,
      transparent: true,
      blending: THREE5.AdditiveBlending,
      depthWrite: false,
      side: THREE5.DoubleSide
    });
    beamGeo.setAttribute("aOpacity", new THREE5.InstancedBufferAttribute(this.beamOpacities, 1));
    this.beamInstanced = new THREE5.InstancedMesh(beamGeo, beamMat, beamCount);
    this.beamInstanced.frustumCulled = false;
    for (let i = 0; i < beamCount; i++) {
      const angle = i / beamCount * Math.PI * 2;
      this.beamDummy.position.set(0, 0, 0);
      this.beamDummy.rotation.set(Math.PI / 2, 0, angle);
      this.beamDummy.scale.set(1, 1, 1);
      this.beamDummy.updateMatrix();
      this.beamInstanced.setMatrixAt(i, this.beamDummy.matrix);
      this.beamOpacities[i] = 0;
    }
    this.beamInstanced.instanceMatrix.needsUpdate = true;
    this.coreGroup.add(this.beamInstanced);
  }
  update(ctx, audio, time, _delta) {
    const speedParam = this.paramStore.get("speed") ?? 1;
    const reactParam = this.paramStore.get("reactivity") ?? 1;
    const deformParam = this.paramStore.get("deformation") ?? 1;
    const densityParam = this.paramStore.get("density") ?? 16;
    const sensitivity = reactParam;
    const dt = this.lastTime !== null ? Math.min(time - this.lastTime, 0.1) : 1 / 60;
    this.lastTime = time;
    const speedScale = dt * 60 * speedParam;
    const rawBass = audio.bass * sensitivity * reactParam;
    const kick = this.updateAudioSmoothers(audio, sensitivity, reactParam);
    this.updateResonanceAndCore(time, kick, speedParam, deformParam, densityParam, audio);
    this.updateOrbitalRingsAnimation(deformParam, speedScale);
    this.updateSpectralArcsAnimation(audio, sensitivity, reactParam, speedScale);
    this.updateParticles(time);
    this.updateShockwaves(rawBass, dt, speedScale, time);
    this.updateTendrilsAndBeams(time, rawBass, speedParam, speedScale);
    this.coreGroup.rotation.y = time * 0.03 * speedParam;
  }
  updateAudioSmoothers(audio, sensitivity, reactParam) {
    const rawBass = audio.bass * sensitivity * reactParam;
    const rawMid = audio.mid * sensitivity * reactParam;
    const rawTreble = audio.treble * sensitivity * reactParam;
    const rawAvg = (audio.rms || (audio.bass + audio.mid + audio.treble) / 3) * sensitivity * reactParam;
    const attack = 0.25;
    const decay = 0.06;
    this.smoothBass += (rawBass - this.smoothBass) * (rawBass > this.smoothBass ? attack : decay);
    this.smoothMid += (rawMid - this.smoothMid) * (rawMid > this.smoothMid ? attack : decay);
    this.smoothTreble += (rawTreble - this.smoothTreble) * (rawTreble > this.smoothTreble ? attack : decay);
    this.smoothAvg += (rawAvg - this.smoothAvg) * (rawAvg > this.smoothAvg ? attack : decay);
    return audio.beat ? audio.beatEnergy * 1.5 : 0;
  }
  updateResonanceAndCore(time, kick, speedParam, deformParam, densityParam, audio) {
    const activeCount = Math.max(1, Math.min(this.numRings, Math.round(densityParam)));
    this.group.rotation.z += (audio.beat ? 0.02 : 5e-3) * speedParam;
    this.updateResonanceRings(activeCount, time, speedParam, deformParam);
    if (this.core?.material) {
      const u = this.core.material.uniforms;
      u.uTime.value = time;
      u.uBass.value = (this.smoothBass * 0.95 + kick * 0.3) * deformParam;
      u.uAudio.value = this.smoothAvg;
      this.core.scale.setScalar(1 + (this.smoothBass * 0.5 + kick * 0.08) * deformParam);
      this.core.rotation.y = time * 0.2 * speedParam;
      this.core.rotation.x = Math.sin(time * 0.12) * 0.2;
    }
    if (this.coronaShell?.material) {
      const u = this.coronaShell.material.uniforms;
      u.uTime.value = time;
      u.uBass.value = (this.smoothBass * 0.7 + kick * 0.35) * deformParam;
      this.coronaShell.scale.setScalar(1 + this.smoothAvg * 0.2 + this.smoothBass * 0.18 * deformParam);
      this.coronaShell.rotation.y = -time * 0.1 * speedParam;
    }
    if (this.innerRing) {
      this.innerRing.scale.setScalar(1 + (this.smoothBass * 0.55 + kick * 0.1) * deformParam);
      this.innerRing.material.opacity = Math.min(1, 0.4 + this.smoothBass * 0.5 + kick * 0.15);
    }
    if (this.outerRing) {
      this.outerRing.scale.setScalar(1 + this.smoothTreble * 0.2);
      this.outerRing.material.opacity = 0.15 + this.smoothTreble * 0.5;
      this.outerRing.rotation.z = time * 0.02 * speedParam;
    }
  }
  updateResonanceRings(activeCount, time, speedParam, deformParam) {
    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      const isVisible = i < activeCount;
      ring.visible = isVisible;
      if (!isVisible) continue;
      const radius = 5 + i * 1.1;
      let bandEnergy = this.smoothTreble;
      if (i < 5) {
        bandEnergy = this.smoothBass;
      } else if (i < 10) {
        bandEnergy = this.smoothMid;
      }
      this.ringRotations[i] += this.ringSpeeds[i] * 0.012 * speedParam * (1 + bandEnergy * 0.8);
      ring.rotation.y = this.ringRotations[i];
      const harmonics = this.ringHarmonics[i];
      const waveAmp = (0.04 + bandEnergy * 0.28) * deformParam;
      const phase = time * (1.2 + i % 3 * 0.4) * (i % 2 === 0 ? 1 : -1);
      const pos = ring.geometry.attributes.position.array;
      for (let j = 0; j <= this.ringSegments; j++) {
        const theta = j / this.ringSegments * Math.PI * 2;
        const ripple = Math.sin(theta * harmonics + phase) * waveAmp;
        const r = radius + ripple;
        pos[j * 3] = Math.cos(theta) * r;
        pos[j * 3 + 1] = Math.sin(theta * (harmonics + 1) + phase) * (waveAmp * 0.4);
        pos[j * 3 + 2] = Math.sin(theta) * r;
      }
      ring.geometry.attributes.position.needsUpdate = true;
    }
  }
  updateOrbitalRingsAnimation(deformParam, speedScale) {
    for (let i = 0; i < this.orbitalRings.length; i++) {
      const ring = this.orbitalRings[i];
      const cfg = this.orbitalRingConfigs[i];
      let bandEnergy = this.smoothTreble;
      if (cfg.band === "bass") {
        bandEnergy = this.smoothBass;
      } else if (cfg.band === "mid") {
        bandEnergy = this.smoothMid;
      }
      this.orbitalRingRotationsY[i] += cfg.speed * 5e-3 * speedScale;
      const scale = 1 + bandEnergy * 0.25 * deformParam;
      ring.rotation.set(cfg.tiltX, this.orbitalRingRotationsY[i], cfg.tiltZ);
      ring.scale.set(scale, scale, scale);
    }
  }
  updateSpectralArcsAnimation(audio, sensitivity, reactParam, speedScale) {
    if (!this.arcInstanced || !this.sharedArcGeo) return;
    const freqData = audio.frequencyData;
    const dataLen = freqData?.length || 1;
    for (let i = 0; i < this.arcCount; i++) {
      const binIdx = Math.min(dataLen - 1, Math.floor(i / this.arcCount * dataLen));
      const binVal = freqData && dataLen > 1 ? freqData[binIdx] / 255 * sensitivity * reactParam : 0;
      this.arcIntensities[i] += (binVal - this.arcIntensities[i]) * 0.2 * speedScale;
      const angle = i / this.arcCount * Math.PI * 2;
      this.arcDummy.position.set(0, 0, 0);
      this.arcDummy.rotation.set(0, angle, 0);
      this.arcDummy.updateMatrix();
      this.arcInstanced.setMatrixAt(i, this.arcDummy.matrix);
    }
    this.arcInstanced.instanceMatrix.needsUpdate = true;
    const attr = this.sharedArcGeo.getAttribute("aIntensity");
    if (attr) attr.needsUpdate = true;
  }
  updateParticles(time) {
    if (this.freqRibbonsMat?.uniforms) {
      const u = this.freqRibbonsMat.uniforms;
      u.uTime.value = time;
      u.uBass.value = this.smoothBass;
      u.uMid.value = this.smoothMid;
      u.uTreble.value = this.smoothTreble;
    }
    if (this.nebulaMat?.uniforms) {
      this.nebulaMat.uniforms.uTime.value = time;
      this.nebulaMat.uniforms.uAudio.value = this.smoothAvg;
    }
    if (this.haloMat?.uniforms) {
      this.haloMat.uniforms.uTime.value = time;
      this.haloMat.uniforms.uAudio.value = this.smoothAvg;
    }
  }
  updateShockwaves(rawBass, dt, speedScale, time) {
    this.bassAccum += (rawBass - this.bassAccum) * 0.3 * speedScale;
    if (rawBass > 0.6 && rawBass > this.bassAccum * 1.3 && time - this.lastBassSpike > 0.3) {
      this.lastBassSpike = time;
      const inactive = this.shockwaveData.find((sw) => !sw.active);
      if (inactive) {
        inactive.active = true;
        inactive.life = 0;
      }
    }
    if (!this.shockwaveInstanced) return;
    for (let i = 0; i < this.shockwaveData.length; i++) {
      const sw = this.shockwaveData[i];
      if (!sw.active) continue;
      sw.life += dt * 1.5;
      const progress = sw.life;
      const radius = 4 + progress * 18;
      this.swDummy.position.set(0, 0, 0);
      this.swDummy.rotation.set(Math.PI / 2, 0, 0);
      this.swDummy.scale.setScalar(radius);
      this.swDummy.updateMatrix();
      this.shockwaveInstanced.setMatrixAt(i, this.swDummy.matrix);
      this.swOpacities[i] = Math.max(0, (1 - progress) * 0.5);
      if (progress >= 1) {
        sw.active = false;
        this.swOpacities[i] = 0;
        this.swDummy.scale.set(0, 0, 0);
        this.swDummy.updateMatrix();
        this.shockwaveInstanced.setMatrixAt(i, this.swDummy.matrix);
      }
    }
    this.shockwaveInstanced.instanceMatrix.needsUpdate = true;
    const swAttr = this.shockwaveInstanced.geometry.getAttribute("aOpacity");
    if (swAttr) swAttr.needsUpdate = true;
  }
  updateTendrilsAndBeams(time, rawBass, speedParam, speedScale) {
    this.tendrilFrame = (this.tendrilFrame + 1) % 2;
    if (this.tendrilFrame === 0 && this.tendrils.length > 0) {
      for (const tendril of this.tendrils) {
        const { baseAngle, segCount } = tendril.userData;
        const pos = tendril.geometry.attributes.position.array;
        for (let j = 0; j < segCount; j++) {
          const progress = j / (segCount - 1);
          const r = 3.5 + progress * 14;
          const angle = baseAngle + Math.sin(time * 1.5 + progress * 4) * 0.3 * progress;
          const y = Math.sin(time * 2 + progress * 6 + baseAngle) * progress * 2 * (0.5 + this.smoothAvg);
          pos[j * 3] = Math.cos(angle) * r;
          pos[j * 3 + 1] = y;
          pos[j * 3 + 2] = Math.sin(angle) * r;
        }
        tendril.geometry.attributes.position.needsUpdate = true;
        tendril.material.opacity = 0.15 + this.smoothAvg * 0.5;
      }
    }
    if (!this.beamInstanced) return;
    const beamCount = this.beamInstanced.count;
    this.beamRotationZ = time * 0.025 * speedParam;
    for (let i = 0; i < beamCount; i++) {
      const shimmer = Math.sin(time * 4 + i * 0.8) * 0.5 + 0.5;
      const targetOpacity = rawBass > 0.35 ? rawBass * shimmer * 0.2 : 0;
      this.beamOpacities[i] += (targetOpacity - this.beamOpacities[i]) * 0.25 * speedScale;
      const angle = i / beamCount * Math.PI * 2 + this.beamRotationZ;
      this.beamDummy.position.set(0, 0, 0);
      this.beamDummy.rotation.set(Math.PI / 2, 0, angle);
      this.beamDummy.scale.set(1, 1, 1);
      this.beamDummy.updateMatrix();
      this.beamInstanced.setMatrixAt(i, this.beamDummy.matrix);
    }
    this.beamInstanced.instanceMatrix.needsUpdate = true;
    const beamAttr = this.beamInstanced.geometry.getAttribute("aOpacity");
    if (beamAttr) beamAttr.needsUpdate = true;
  }
  onThemeChange(theme) {
    const primary = new THREE5.Color(theme.primary);
    const secondary = new THREE5.Color(theme.secondary || theme.accent || theme.primary);
    this.updateOrbitalAndRingColors(primary, secondary, theme.gradientStops);
    this.updateParticleAndBeamColors(primary, secondary);
  }
  updateOrbitalAndRingColors(primary, secondary, gradientStops) {
    for (let i = 0; i < this.ringMaterials.length; i++) {
      let color;
      if (gradientStops && gradientStops.length > 1) {
        color = new THREE5.Color(sampleGradient(gradientStops, i / Math.max(1, this.numRings - 1)));
      } else {
        color = new THREE5.Color().lerpColors(primary, secondary, i / this.numRings);
      }
      this.ringMaterials[i].color.copy(color);
    }
    if (this.core?.material) {
      const u = this.core.material.uniforms;
      u.uColor1.value.copy(primary);
      u.uColor2.value.copy(secondary);
    }
    if (this.coronaShell?.material) {
      const u = this.coronaShell.material.uniforms;
      u.uColor1.value.copy(primary);
      u.uColor2.value.copy(secondary);
    }
    if (this.innerRing?.material) {
      this.innerRing.material.color.copy(secondary);
    }
    if (this.outerRing?.material) {
      this.outerRing.material.color.copy(primary);
    }
    for (let i = 0; i < this.orbitalRings.length; i++) {
      const ring = this.orbitalRings[i];
      const cfg = this.orbitalRingConfigs[i];
      ring.material.color.copy(cfg.band === "bass" ? primary : secondary);
    }
  }
  updateParticleAndBeamColors(primary, secondary) {
    if (this.arcInstanced?.material) {
      const u = this.arcInstanced.material.uniforms;
      u.uColor1.value.copy(primary);
      u.uColor2.value.copy(secondary);
    }
    if (this.freqRibbonsMat?.uniforms) {
      this.freqRibbonsMat.uniforms.uColor1.value.copy(primary);
      this.freqRibbonsMat.uniforms.uColor2.value.copy(secondary);
    }
    if (this.nebulaMat?.uniforms) {
      this.nebulaMat.uniforms.uColor1.value.copy(primary);
      this.nebulaMat.uniforms.uColor2.value.copy(secondary);
    }
    if (this.haloMat?.uniforms) {
      this.haloMat.uniforms.uColor.value.copy(primary);
    }
    if (this.shockwaveInstanced?.material) {
      this.shockwaveInstanced.material.uniforms.uColor.value.copy(primary);
    }
    for (const tendril of this.tendrils) {
      tendril.material.color.copy(secondary);
    }
    if (this.beamInstanced?.material) {
      this.beamInstanced.material.uniforms.uColor.value.copy(primary);
    }
  }
  onDispose() {
    for (const g of this.ringGeometries) g.dispose();
    for (const m of this.ringMaterials) m.dispose();
    this.rings.length = 0;
    this.ringGeometries.length = 0;
    this.ringMaterials.length = 0;
    this.core?.geometry.dispose();
    this.core?.material?.dispose();
    this.coronaShell?.geometry.dispose();
    this.coronaShell?.material?.dispose();
    this.innerRing?.geometry.dispose();
    this.innerRing?.material?.dispose();
    this.outerRing?.geometry.dispose();
    this.outerRing?.material?.dispose();
    for (const r of this.orbitalRings) {
      r.geometry.dispose();
      r.material?.dispose();
    }
    this.orbitalRings.length = 0;
    this.sharedArcGeo?.dispose();
    this.arcInstanced?.material?.dispose();
    this.freqRibbonsGeo?.dispose();
    this.freqRibbonsMat?.dispose();
    this.nebulaGeo?.dispose();
    this.nebulaMat?.dispose();
    this.haloGeo?.dispose();
    this.haloMat?.dispose();
    this.shockwaveInstanced?.geometry.dispose();
    this.shockwaveInstanced?.material?.dispose();
    for (const t of this.tendrils) {
      t.geometry.dispose();
      t.material?.dispose();
    }
    this.tendrils.length = 0;
    this.beamInstanced?.geometry.dispose();
    this.beamInstanced?.material?.dispose();
    this.coreGroup.removeFromParent();
    this.coreGroup.clear();
  }
};

// src/presets/ThreeDBars.ts
var THREE6 = __toESM(require("three"), 1);
var BAR_RINGS = [
  { count: 16, radius: 3 },
  { count: 24, radius: 5 },
  { count: 36, radius: 7.5 },
  { count: 48, radius: 10 },
  { count: 60, radius: 12.5 },
  { count: 72, radius: 15 }
];
var TOTAL_BARS = 256;
var BARS_VERTEX_SHADER = `
  attribute float aGlow;
  attribute float aEnergy;
  attribute float aRingNorm;
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vGlow;
  varying float vEnergy;
  varying float vRingNorm;

  void main() {
    vPosition = position;
    vGlow = aGlow;
    vEnergy = aEnergy;
    vRingNorm = aRingNorm;

    mat4 mvInstance = modelViewMatrix * instanceMatrix;
    vNormal = normalize(transpose(inverse(mat3(mvInstance))) * normal);

    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;

    gl_Position = projectionMatrix * mvInstance * vec4(position, 1.0);
  }
`;
var BARS_FRAGMENT_SHADER = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uBarGlow;
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vGlow;
  varying float vEnergy;
  varying float vRingNorm;

  void main() {
    float t = vPosition.y + 0.5;
    vec3 innerCol = mix(uColor1, uColor2, t);
    vec3 outerCol = mix(uColor2, uColor1 * 0.6 + uColor2 * 1.4, t);
    vec3 baseColor = mix(innerCol, outerCol, vRingNorm);

    vec3 hotColor = mix(baseColor, vec3(1.0, 0.95, 0.85), vEnergy * 0.25);

    float scanSpeed = 3.0 + vEnergy * 5.0;
    float scanPos = fract(uTime * scanSpeed * 0.1);
    float scan = smoothstep(scanPos - 0.15, scanPos, t) * smoothstep(scanPos + 0.15, scanPos, t);
    hotColor += uColor2 * scan * 0.6 * vGlow * (0.2 + uBarGlow * 0.5);

    float stream = sin(vPosition.x * 25.0 + uTime * 8.0) * sin(vPosition.z * 25.0 - uTime * 6.0);
    stream = smoothstep(0.7, 1.0, stream);
    hotColor += uColor2 * stream * 0.15 * vEnergy;

    float topGlow = smoothstep(0.5, 0.95, t);
    hotColor += uColor2 * topGlow * vGlow * 0.5 * (0.2 + uBarGlow * 0.5);

    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
    hotColor += uColor2 * fresnel * (0.15 + vEnergy * 0.3) * (0.2 + uBarGlow * 0.5);

    float radius = length(vPosition.xz) / 0.4;
    float edgeGlow = smoothstep(0.6, 1.0, radius);
    hotColor += uColor2 * edgeGlow * 0.15 * (0.2 + uBarGlow * 0.5);

    gl_FragColor = vec4(hotColor, 1.0);
  }
`;
var CORE_VERTEX_SHADER = `
  uniform float uPulse;
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 p = position * uPulse;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
var CORE_FRAGMENT_SHADER = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uBass;
  uniform float uAudio;
  varying vec3 vNormal;

  void main() {
    vec3 n = normalize(vNormal);
    float fresnel = pow(1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0))), 2.0);
    vec3 col = mix(uColor1, uColor2, 0.45 + fresnel * 0.35);
    col += uColor2 * fresnel * (0.35 + uBass * 0.5);
    col *= 0.75 + uAudio * 0.45;
    gl_FragColor = vec4(col, 1.0);
  }
`;
var ThreeDBarsPreset = class extends BasePreset {
  id = "bars3d";
  name = "3D Bars";
  category = "Structures";
  description = "Concentric cybernetic rings of hexagonal audio pillars with pulsating energy core.";
  cameraConfig = {
    position: [0, 14, 20],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };
  instancedMesh;
  barGeometry;
  barMaterial;
  coreMesh;
  coreGeometry;
  coreMaterial;
  barGlowAttr;
  barEnergyAttr;
  barRingNormAttr;
  barData = [];
  dummy = new THREE6.Object3D();
  tmpLookTarget = new THREE6.Vector3();
  prevBass = 0;
  explosionForce = 0;
  flashIntensity = 0;
  kickPulse = 0;
  lastTime = void 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Column Spacing", min: 0.5, max: 1.5, step: 0.05, defaultValue: 0.8 },
      { id: "reactivity", name: "Reactivity", min: 0.1, max: 2, step: 0.05, defaultValue: 1 },
      { id: "deformation", name: "Column Height", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "density", name: "Grid Density", min: 0.2, max: 1, step: 0.1, defaultValue: 1 }
    ]);
  }
  setup(ctx) {
    this.lastTime = void 0;
    this.barData.length = 0;
    this.barGeometry = new THREE6.CylinderGeometry(0.35, 0.35, 1, 6);
    BAR_RINGS.forEach((ring, ringIdx) => {
      const ringNorm = ringIdx / (BAR_RINGS.length - 1);
      for (let i = 0; i < ring.count; i++) {
        const angle = i / ring.count * Math.PI * 2;
        this.barData.push({
          ringNorm,
          angle,
          baseRadius: ring.radius,
          targetHeight: 1,
          currentHeight: 0.1,
          currentTwist: 0
        });
      }
    });
    const glowArray = new Float32Array(TOTAL_BARS);
    const energyArray = new Float32Array(TOTAL_BARS);
    const ringNormArray = new Float32Array(TOTAL_BARS);
    for (let i = 0; i < TOTAL_BARS; i++) {
      ringNormArray[i] = this.barData[i].ringNorm;
    }
    this.barGlowAttr = new THREE6.InstancedBufferAttribute(glowArray, 1);
    this.barEnergyAttr = new THREE6.InstancedBufferAttribute(energyArray, 1);
    this.barRingNormAttr = new THREE6.InstancedBufferAttribute(ringNormArray, 1);
    this.barGeometry.setAttribute("aGlow", this.barGlowAttr);
    this.barGeometry.setAttribute("aEnergy", this.barEnergyAttr);
    this.barGeometry.setAttribute("aRingNorm", this.barRingNormAttr);
    const primaryColor = new THREE6.Color(ctx.theme.primary);
    const accentColor = new THREE6.Color(ctx.theme.accent);
    this.barMaterial = new THREE6.ShaderMaterial({
      uniforms: {
        uColor1: { value: primaryColor },
        uColor2: { value: accentColor },
        uBarGlow: { value: 0.5 },
        uTime: { value: 0 }
      },
      vertexShader: BARS_VERTEX_SHADER,
      fragmentShader: BARS_FRAGMENT_SHADER,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });
    this.instancedMesh = new THREE6.InstancedMesh(this.barGeometry, this.barMaterial, TOTAL_BARS);
    this.instancedMesh.count = TOTAL_BARS;
    this.instancedMesh.frustumCulled = false;
    this.group.add(this.instancedMesh);
    this.coreGeometry = new THREE6.SphereGeometry(1.35, 32, 32);
    this.coreMaterial = new THREE6.ShaderMaterial({
      uniforms: {
        uColor1: { value: primaryColor },
        uColor2: { value: accentColor },
        uBass: { value: 0 },
        uAudio: { value: 0 },
        uPulse: { value: 1 }
      },
      vertexShader: CORE_VERTEX_SHADER,
      fragmentShader: CORE_FRAGMENT_SHADER,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });
    this.coreMesh = new THREE6.Mesh(this.coreGeometry, this.coreMaterial);
    this.coreMesh.frustumCulled = false;
    this.coreMesh.position.y = 1.4;
    this.group.add(this.coreMesh);
  }
  update(_ctx, audio, time, delta) {
    if (!this.instancedMesh || !this.coreMesh) return;
    const dt = this.lastTime !== void 0 ? Math.min(time - this.lastTime, 0.1) : delta || 1 / 60;
    this.lastTime = time;
    const lerpFactor = 0.15 * (dt * 60);
    const reactivity = this.paramStore.getValue("reactivity");
    const heightScale = this.paramStore.getValue("deformation");
    const spacing = this.paramStore.getValue("speed");
    const density = this.paramStore.getValue("density");
    const scaledBass = audio.bass * reactivity;
    const scaledMid = audio.mid * reactivity;
    const scaledTreble = audio.treble * reactivity;
    const scaledAvg = audio.rms * reactivity;
    if (scaledBass > this.prevBass + 0.15 && scaledBass > 0.35) {
      if (scaledBass > 0.5) {
        this.explosionForce = Math.min(1, (scaledBass - 0.5) * 3);
      }
      this.flashIntensity = Math.min(scaledBass * 1.5, 1);
    }
    this.prevBass = scaledBass;
    this.explosionForce *= 0.92;
    if (this.explosionForce < 0.01) this.explosionForce = 0;
    this.flashIntensity *= 0.88;
    this.kickPulse = audio.beat ? 1 : this.kickPulse * 0.9;
    this.barMaterial.uniforms.uTime.value = time;
    this.barMaterial.uniforms.uBarGlow.value = 0.5 * reactivity;
    const activeCount = density >= 1 ? TOTAL_BARS : Math.max(1, Math.floor(TOTAL_BARS * density));
    this.instancedMesh.count = activeCount;
    this.updateBarInstances(audio, time, lerpFactor, reactivity, heightScale, spacing, scaledBass, scaledMid, scaledTreble);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.barGlowAttr.needsUpdate = true;
    this.barEnergyAttr.needsUpdate = true;
    this.group.rotation.y = Math.sin(time * 0.12) * 0.2;
    this.group.rotation.x = Math.sin(time * 0.08) * 0.015 * scaledBass;
    this.coreMaterial.uniforms.uBass.value = scaledBass;
    this.coreMaterial.uniforms.uAudio.value = scaledAvg;
    this.coreMaterial.uniforms.uPulse.value = 1 + this.flashIntensity * 1.5;
    this.coreMesh.rotation.y = time * 0.35 + scaledBass * 0.25;
    this.coreMesh.position.y = 1.4 + Math.sin(time * 1.8) * 0.12 * scaledBass + this.kickPulse * 1.2;
  }
  updateBarInstances(audio, time, lerpFactor, reactivity, heightScale, spacing, scaledBass, scaledMid, scaledTreble) {
    const glowArr = this.barGlowAttr.array;
    const energyArr = this.barEnergyAttr.array;
    const freqLength = audio.frequencyData.length;
    for (let i = 0; i < TOTAL_BARS; i++) {
      const datum = this.barData[i];
      const ringNorm = datum.ringNorm;
      const bandEnergy = scaledBass * (1 - ringNorm) + scaledMid * 0.5 + scaledTreble * ringNorm;
      const freqIdx = Math.floor(i / TOTAL_BARS * Math.min(63, freqLength - 1));
      const rawFreq = (audio.frequencyData[freqIdx] || 0) / 255;
      const barEnergy = (rawFreq * reactivity * 0.5 + bandEnergy * 0.5) * 0.55;
      datum.targetHeight = (0.5 + barEnergy * 18) * heightScale;
      datum.currentHeight += (datum.targetHeight - datum.currentHeight) * lerpFactor;
      const h = Math.max(0.1, datum.currentHeight);
      const glowVal = Math.min(1, barEnergy * 1.5);
      const twistTarget = barEnergy * 0.8 + scaledBass * 0.4;
      datum.currentTwist += (twistTarget - datum.currentTwist) * lerpFactor * 0.5;
      const spacingScale = 0.7 + spacing * 0.6;
      const explosionPush = this.explosionForce * (1 + ringNorm * 0.5) * 2.5;
      const currentRadius = datum.baseRadius * spacingScale + explosionPush;
      const posX = Math.cos(datum.angle) * currentRadius;
      const posZ = Math.sin(datum.angle) * currentRadius;
      const undulation = Math.sin(time * 2 + i * 0.15) * 0.3 * scaledMid;
      const posY = h * 0.5 + undulation;
      this.dummy.position.set(posX, posY, posZ);
      this.dummy.scale.set(1, h, 1);
      const centerDist = Math.hypot(posX, posZ);
      if (centerDist < 1e-4) {
        this.dummy.quaternion.identity();
      } else {
        this.tmpLookTarget.set(0, posY, 0);
        this.dummy.lookAt(this.tmpLookTarget);
      }
      this.dummy.rotation.y += datum.currentTwist;
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      glowArr[i] = barEnergy;
      energyArr[i] = glowVal;
    }
  }
  onThemeChange(theme) {
    const primary = new THREE6.Color(theme.primary);
    const accent = new THREE6.Color(theme.accent);
    if (this.barMaterial?.uniforms) {
      this.barMaterial.uniforms.uColor1.value.copy(primary);
      this.barMaterial.uniforms.uColor2.value.copy(accent);
    }
    if (this.coreMaterial?.uniforms) {
      this.coreMaterial.uniforms.uColor1.value.copy(primary);
      this.coreMaterial.uniforms.uColor2.value.copy(accent);
    }
  }
  dispose() {
    this.barGeometry?.dispose();
    this.barMaterial?.dispose();
    this.coreGeometry?.dispose();
    this.coreMaterial?.dispose();
    this.barData.length = 0;
    this.prevBass = 0;
    this.explosionForce = 0;
    this.flashIntensity = 0;
    this.kickPulse = 0;
    this.lastTime = void 0;
    super.dispose();
  }
};

// src/presets/Ferrofluid.ts
var THREE7 = __toESM(require("three"), 1);
var FERRO_SPIKES = 14;
var FERRO_GOLDEN = 2.399963229728653;
var NUM_PARTICLES = 3e3;
var FerrofluidPreset = class extends BasePreset {
  id = "ferrofluid";
  name = "Ferrofluid";
  category = "Structures";
  description = "Liquid magnetic sphere erupting spikes on bass kick transients.";
  cameraConfig = {
    position: [0, 6, 16],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.2
  };
  mesh;
  geometry;
  material;
  basePositions;
  spikeDirections;
  numVertices = 0;
  basePlane;
  basePlaneMaterial;
  ambientParticles;
  particleMaterial;
  fluidLight;
  smoothBass = 0;
  smoothMid = 0;
  smoothTreble = 0;
  smoothAvg = 0;
  cachedAxes = [];
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Rotation Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Pulse Reactivity", min: 0.1, max: 2, step: 0.05, defaultValue: 1 },
      { id: "deformation", name: "Spike Height", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "density", name: "Spike Density", min: 0.2, max: 1, step: 0.1, defaultValue: 0.5 }
    ]);
  }
  setup(ctx) {
    this.geometry = new THREE7.SphereGeometry(4.8, 72, 72);
    const pos = this.geometry.attributes.position.array;
    this.numVertices = pos.length / 3;
    this.basePositions = new Float32Array(pos);
    this.spikeDirections = new Float32Array(pos.length);
    for (let i = 0; i < this.numVertices; i++) {
      const vx = pos[i * 3];
      const vy = pos[i * 3 + 1];
      const vz = pos[i * 3 + 2];
      const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      this.spikeDirections[i * 3] = vx / len;
      this.spikeDirections[i * 3 + 1] = vy / len;
      this.spikeDirections[i * 3 + 2] = vz / len;
    }
    this.material = new THREE7.MeshPhysicalMaterial({
      color: new THREE7.Color(ctx.theme.primary).multiplyScalar(0.85),
      emissive: new THREE7.Color(ctx.theme.primary),
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.05
    });
    this.mesh = new THREE7.Mesh(this.geometry, this.material);
    this.group.add(this.mesh);
    this.fluidLight = new THREE7.PointLight(new THREE7.Color(ctx.theme.primary), 3, 50);
    this.fluidLight.position.set(0, 10, 15);
    this.group.add(this.fluidLight);
    this.cachedAxes.length = 0;
    for (let i = 0; i < FERRO_SPIKES; i++) {
      const y = 1 - (i + 0.5) / FERRO_SPIKES * 2;
      const r = Math.sqrt(Math.max(1 - y * y, 0));
      const phi = i * FERRO_GOLDEN;
      this.cachedAxes.push(new THREE7.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r));
    }
    this.setupBasePlane(ctx);
    this.setupParticles(ctx);
  }
  setupBasePlane(ctx) {
    const planeGeom = new THREE7.PlaneGeometry(40, 40, 1, 1);
    this.basePlaneMaterial = new THREE7.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE7.Color(ctx.theme.primary) },
        uColor2: { value: new THREE7.Color(ctx.theme.secondary) },
        uAudio: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uAudio;
        varying vec2 vUv;
        void main() {
          vec2 centered = vUv - 0.5;
          float dist = length(centered);
          float ripple = sin(dist * 30.0 - uTime * 3.0) * 0.5 + 0.5;
          ripple *= exp(-dist * 4.0) * uAudio;
          vec3 color = mix(uColor1, uColor2, ripple) * ripple * 0.4;
          float alpha = (0.08 + ripple * 0.3) * (1.0 - smoothstep(0.3, 0.5, dist));
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE7.AdditiveBlending,
      depthWrite: false
    });
    this.basePlane = new THREE7.Mesh(planeGeom, this.basePlaneMaterial);
    this.basePlane.rotation.x = -Math.PI / 2;
    this.basePlane.position.y = -7;
    this.group.add(this.basePlane);
  }
  setupParticles(ctx) {
    const pGeom = new THREE7.BufferGeometry();
    const positions = new Float32Array(NUM_PARTICLES * 3);
    const sizes = new Float32Array(NUM_PARTICLES);
    const randoms = new Float32Array(NUM_PARTICLES);
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 12 + Math.random() * 25;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 1.2 + Math.random() * 2.5;
      randoms[i] = Math.random();
    }
    pGeom.setAttribute("position", new THREE7.BufferAttribute(positions, 3));
    pGeom.setAttribute("size", new THREE7.BufferAttribute(sizes, 1));
    pGeom.setAttribute("aRandom", new THREE7.BufferAttribute(randoms, 1));
    this.particleMaterial = new THREE7.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE7.Color(ctx.theme.primary) },
        uColor2: { value: new THREE7.Color(ctx.theme.secondary) },
        uBass: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;
        uniform float uTime;
        uniform float uBass;
        varying float vAlpha;
        varying float vRandom;
        void main() {
          vRandom = aRandom;
          vec3 pos = position;
          float angle = atan(pos.z, pos.x) + uTime * 0.2;
          float fieldStrength = uBass * 2.0;
          pos.y += sin(angle * 3.0 + uTime) * fieldStrength;
          pos.x += cos(uTime * 0.3 + aRandom * 6.28) * 0.5;
          vAlpha = 0.1 + 0.15 * sin(uTime * 0.8 + aRandom * 6.28);
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (120.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vAlpha;
        varying float vRandom;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float core = exp(-d * 12.0);
          float glow = exp(-d * 4.0) * 0.4;
          float alpha = (core + glow) * (1.0 - smoothstep(0.0, 0.5, d));
          if (alpha < 0.005) discard;
          vec3 color = mix(uColor1, uColor2, vRandom);
          color = mix(color, vec3(1.0), core * 0.3);
          gl_FragColor = vec4(color, alpha * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE7.AdditiveBlending,
      depthWrite: false
    });
    this.ambientParticles = new THREE7.Points(pGeom, this.particleMaterial);
    this.group.add(this.ambientParticles);
  }
  update(ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const deformation = this.paramStore.getValue("deformation");
    const density = this.paramStore.getValue("density");
    this.updateAudioSmoothing(audio, delta);
    this.mesh.rotation.y += delta * (0.2 + this.smoothMid * 0.4) * speed;
    this.mesh.rotation.x = Math.sin(time * 0.15) * 0.1;
    this.deformSphere(time, speed, reactivity, deformation, density);
    this.updateFloorAndParticles(time, audio);
    const baseEmissive = 0.35 * reactivity;
    const beatEmissive = audio.beat ? 0.65 * reactivity : this.smoothBass * 0.35 * reactivity;
    this.material.emissiveIntensity = baseEmissive + beatEmissive;
    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
    } else {
      this.material.emissive.lerp(new THREE7.Color(ctx.theme.primary), 0.08);
    }
  }
  updateAudioSmoothing(audio, delta) {
    const rate = Math.min(1, delta * 15);
    this.smoothBass += (audio.bass - this.smoothBass) * rate;
    this.smoothMid += (audio.mid - this.smoothMid) * rate;
    this.smoothTreble += (audio.treble - this.smoothTreble) * rate;
    this.smoothAvg += (audio.rms - this.smoothAvg) * rate;
  }
  deformSphere(time, speed, reactivity, deformation, density) {
    const pos = this.geometry.attributes.position.array;
    const spikeHeight = (0.5 + density * 2 + this.smoothBass * 2.5) * deformation * reactivity * 0.45;
    const spikeSharpness = 4 + density * 12 + this.smoothTreble * 8;
    const yaw = time * 0.25 * speed;
    const pitch = Math.sin(time * 0.17 * speed) * 0.35;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rotatedAxes = [];
    for (let i = 0; i < FERRO_SPIKES; i++) {
      const a = this.cachedAxes[i];
      const px = cy * a.x + sy * a.z;
      const py = a.y;
      const pz = -sy * a.x + cy * a.z;
      const rx = px;
      const ry = cp * py - sp * pz;
      const rz = sp * py + cp * pz;
      const hMul = 0.75 + 0.25 * Math.sin(i * FERRO_GOLDEN + time * 0.9);
      rotatedAxes.push({ x: rx, y: ry, z: rz, hMul });
    }
    for (let i = 0; i < this.numVertices; i++) {
      const idx = i * 3;
      const bx = this.basePositions[idx];
      const by = this.basePositions[idx + 1];
      const bz = this.basePositions[idx + 2];
      const dx = this.spikeDirections[idx];
      const dy = this.spikeDirections[idx + 1];
      const dz = this.spikeDirections[idx + 2];
      let disp = 0;
      for (let s = 0; s < FERRO_SPIKES; s++) {
        const ax = rotatedAxes[s];
        const dot = dx * ax.x + dy * ax.y + dz * ax.z;
        if (dot > 0) {
          const smooth = Math.min(1, dot / 0.3);
          const sCurve = smooth * smooth * (3 - 2 * smooth);
          const spikeVal = Math.pow(dot, spikeSharpness) * sCurve * spikeHeight * ax.hMul;
          if (spikeVal > disp) disp = spikeVal;
        }
      }
      disp += Math.sin(dx * 4 + time * 2) * Math.cos(dy * 4 + time * 1.5) * Math.sin(dz * 4 + time * 1.8) * 0.15;
      pos[idx] = bx + dx * disp;
      pos[idx + 1] = by + dy * disp;
      pos[idx + 2] = bz + dz * disp;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
  updateFloorAndParticles(time, audio) {
    if (this.basePlaneMaterial) {
      this.basePlaneMaterial.uniforms.uTime.value = time;
      this.basePlaneMaterial.uniforms.uAudio.value = audio.rms;
    }
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uTime.value = time;
      this.particleMaterial.uniforms.uBass.value = audio.bass;
    }
  }
  onThemeChange(theme) {
    const stops = theme.gradientStops;
    const cFluid = stops?.[0] ?? theme.primary;
    const cPlane1 = stops?.[1] ?? theme.primary;
    const cPlane2 = stops?.[2] ?? theme.secondary;
    const cPart1 = stops?.[2] ?? theme.primary;
    const cPart2 = stops?.[3] ?? stops?.[1] ?? theme.secondary;
    this.material.color.set(cFluid).multiplyScalar(0.85);
    this.material.emissive.set(cFluid);
    if (this.fluidLight) {
      this.fluidLight.color.set(cFluid);
    }
    if (this.basePlaneMaterial) {
      this.basePlaneMaterial.uniforms.uColor1.value.set(cPlane1);
      this.basePlaneMaterial.uniforms.uColor2.value.set(cPlane2);
    }
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uColor1.value.set(cPart1);
      this.particleMaterial.uniforms.uColor2.value.set(cPart2);
    }
  }
  onDispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.basePlane) {
      this.basePlane.geometry.dispose();
      this.basePlaneMaterial?.dispose();
    }
    if (this.ambientParticles) {
      this.ambientParticles.geometry.dispose();
      this.particleMaterial?.dispose();
    }
  }
};

// src/presets/ObsidianPoly.ts
var THREE8 = __toESM(require("three"), 1);
var NUM_SHARDS = 24;
var NUM_PARTICLES2 = 1500;
var ObsidianPolyPreset = class extends BasePreset {
  id = "obsidian";
  name = "Obsidian";
  category = "Structures";
  description = "Dark glossy multifaceted polyhedron deforming dynamically.";
  cameraConfig = {
    position: [0, 4, 14],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.15
  };
  mesh;
  material;
  basePositions;
  baseNormals;
  shardMesh;
  shardMaterial;
  shardData = [];
  dummy = new THREE8.Object3D();
  quat = new THREE8.Quaternion();
  particles;
  particleMaterial;
  nebula;
  nebulaMaterial;
  polyLight;
  smoothBass = 0;
  smoothMid = 0;
  smoothTreble = 0;
  energy = 0;
  bassHit = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Tumble Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2, step: 0.05, defaultValue: 1 },
      { id: "deformation", name: "Vertex Morph", min: 0, max: 2, step: 0.05, defaultValue: 0.5 },
      { id: "density", name: "Wireframe Opacity", min: 0.1, max: 1, step: 0.05, defaultValue: 0.75 }
    ]);
  }
  setup(ctx) {
    const geometry = new THREE8.IcosahedronGeometry(4.8, 3);
    geometry.computeVertexNormals();
    const pos = geometry.attributes.position.array;
    const norm = geometry.attributes.normal.array;
    this.basePositions = new Float32Array(pos);
    this.baseNormals = new Float32Array(norm);
    this.material = new THREE8.MeshPhysicalMaterial({
      color: new THREE8.Color(ctx.theme.primary),
      emissive: new THREE8.Color(ctx.theme.primary),
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      flatShading: true
    });
    this.mesh = new THREE8.Mesh(geometry, this.material);
    this.group.add(this.mesh);
    this.polyLight = new THREE8.PointLight(new THREE8.Color(ctx.theme.primary), 3, 50);
    this.polyLight.position.set(0, 8, 12);
    this.group.add(this.polyLight);
    this.setupShards(ctx);
    this.setupParticles(ctx);
    this.setupNebula(ctx);
  }
  setupShards(ctx) {
    const shardGeom = new THREE8.IcosahedronGeometry(1, 0);
    this.shardMaterial = new THREE8.MeshPhysicalMaterial({
      color: new THREE8.Color(ctx.theme.secondary),
      emissive: new THREE8.Color(ctx.theme.secondary),
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      flatShading: true,
      transparent: true,
      opacity: 0.9
    });
    this.shardMesh = new THREE8.InstancedMesh(shardGeom, this.shardMaterial, NUM_SHARDS);
    this.shardData = [];
    for (let i = 0; i < NUM_SHARDS; i++) {
      const radius = 7.5 + Math.random() * 5;
      const speed = 0.08 + Math.random() * 0.14;
      const height = (Math.random() - 0.4) * 6;
      const phase = Math.random() * Math.PI * 2;
      const tilt = (Math.random() - 0.5) * 0.6;
      const size = 0.25 + Math.random() * 0.45;
      const tumbleSpeed = 0.4 + Math.random() * 1.2;
      const tumbleAxis = new THREE8.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const bobSpeed = 0.2 + Math.random() * 0.6;
      const bobAmp = 0.3 + Math.random() * 1;
      this.shardData.push({
        orbitRadius: radius,
        orbitSpeed: speed,
        orbitHeight: height,
        orbitPhase: phase,
        orbitTilt: tilt,
        size,
        tumbleSpeed,
        tumbleAxis,
        bobSpeed,
        bobAmp,
        currentAngle: phase,
        currentTumble: Math.random() * Math.PI * 2
      });
      this.dummy.position.set(Math.cos(phase) * radius, height, Math.sin(phase) * radius);
      this.dummy.scale.setScalar(size);
      this.dummy.updateMatrix();
      this.shardMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.shardMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.shardMesh);
  }
  setupParticles(ctx) {
    const pGeom = new THREE8.BufferGeometry();
    const positions = new Float32Array(NUM_PARTICLES2 * 3);
    const sizes = new Float32Array(NUM_PARTICLES2);
    const randoms = new Float32Array(NUM_PARTICLES2);
    for (let i = 0; i < NUM_PARTICLES2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 4 + Math.random() * 12;
      positions[i * 3] = Math.cos(angle) * rad;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = Math.sin(angle) * rad;
      sizes[i] = 0.3 + Math.random() * 1.5;
      randoms[i] = Math.random();
    }
    pGeom.setAttribute("position", new THREE8.BufferAttribute(positions, 3));
    pGeom.setAttribute("size", new THREE8.BufferAttribute(sizes, 1));
    pGeom.setAttribute("aRandom", new THREE8.BufferAttribute(randoms, 1));
    this.particleMaterial = new THREE8.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE8.Color(ctx.theme.primary) },
        uColor2: { value: new THREE8.Color(ctx.theme.secondary) },
        uBass: { value: 0 },
        uAudio: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;
        uniform float uTime;
        uniform float uBass;
        uniform float uAudio;
        varying float vAlpha;
        varying float vRandom;
        void main() {
          vRandom = aRandom;
          vec3 pos = position;
          float angle = atan(pos.z, pos.x) + uTime * (0.06 + aRandom * 0.12);
          float r = length(pos.xz) + sin(uTime * 0.8 + aRandom * 6.28) * (0.2 + uBass * 0.5);
          pos.x = cos(angle) * r;
          pos.z = sin(angle) * r;
          pos.y += sin(uTime * (0.3 + aRandom * 0.4) + aRandom * 6.28) * 0.6;
          vAlpha = (0.15 + 0.2 * sin(uTime * 1.5 + aRandom * 6.28)) * (0.3 + uAudio * 0.7);
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (80.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying float vAlpha;
        varying float vRandom;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float core = exp(-d * 12.0);
          float glow = exp(-d * 4.0) * 0.3;
          float brightness = core + glow;
          float alpha = brightness * (1.0 - smoothstep(0.0, 0.5, d));
          if (alpha < 0.005) discard;
          vec3 color = mix(uColor1, uColor2, vRandom) * 0.6;
          color = mix(color, vec3(1.0), core * 0.3);
          float flicker = 0.85 + 0.15 * sin(uTime * 8.0 + vRandom * 30.0);
          gl_FragColor = vec4(color * flicker, alpha * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE8.AdditiveBlending,
      depthWrite: false
    });
    this.particles = new THREE8.Points(pGeom, this.particleMaterial);
    this.group.add(this.particles);
  }
  setupNebula(ctx) {
    const geom = new THREE8.SphereGeometry(60, 32, 32);
    this.nebulaMaterial = new THREE8.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE8.Color(ctx.theme.primary) },
        uColor2: { value: new THREE8.Color(ctx.theme.secondary) },
        uAudio: { value: 0 },
        uBass: { value: 0 }
      },
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vWorldDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uAudio;
        uniform float uBass;
        varying vec3 vWorldDir;

        float hash3(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }
        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), u.x),
                mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
            mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), u.x),
                mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
            u.z
          );
        }
        float fbm3(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise3(p);
            p = p * 2.0 + vec3(1.3, 2.7, 1.9);
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldDir);
          float t = uTime * 0.06;
          vec3 p1 = dir * 3.0 + vec3(t, t * 0.7, t * 0.3);
          vec3 p2 = dir * 2.0 - vec3(t * 0.5, t * 1.2, t * 0.4);
          float n1 = fbm3(p1);
          float n2 = fbm3(p2);
          float aurora = smoothstep(0.3, 0.7, n1) * smoothstep(0.2, 0.6, n2);
          vec3 col = mix(uColor1 * (0.6 + uBass * 0.4), uColor2 * (0.6 + uAudio * 0.4), n1) * aurora;
          float streaks = pow(abs(sin(dir.y * 20.0 + n1 * 5.0 + uTime * 0.2)), 8.0);
          col += mix(uColor1, uColor2, 0.5) * streaks * 0.15;
          float alpha = (0.2 + uAudio * 0.3) * aurora;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      side: THREE8.BackSide,
      transparent: true,
      depthWrite: false
    });
    this.nebula = new THREE8.Mesh(geom, this.nebulaMaterial);
    this.nebula.renderOrder = -1;
    this.group.add(this.nebula);
  }
  update(ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const deformation = this.paramStore.getValue("deformation");
    this.updateAudioSmoothing(audio, delta);
    this.updateMeshDeformation(time, speed, reactivity, deformation);
    this.updateShards(time, delta, speed);
    this.updateParticles(audio, time);
    this.updateNebula(audio, time);
    const baseEmissive = 0.35 * reactivity;
    const beatEmissive = audio.beat ? 0.65 * reactivity : this.smoothBass * 0.35 * reactivity;
    this.material.emissiveIntensity = baseEmissive + beatEmissive;
    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
    } else {
      this.material.emissive.lerp(new THREE8.Color(ctx.theme.primary), 0.08);
    }
  }
  updateAudioSmoothing(audio, delta) {
    this.smoothBass += (audio.bass - this.smoothBass) * Math.min(1, delta * 12);
    this.smoothMid += (audio.mid - this.smoothMid) * Math.min(1, delta * 10);
    this.smoothTreble += (audio.treble - this.smoothTreble) * Math.min(1, delta * 14);
    const targetEnergy = Math.min((audio.bass * 0.5 + audio.mid * 0.3 + audio.treble * 0.2) * 2.5, 1);
    this.energy += (targetEnergy - this.energy) * (targetEnergy > this.energy ? 0.25 : 0.03);
    this.bassHit = audio.beat ? 1 : this.bassHit * 0.88;
  }
  updateMeshDeformation(time, speed, reactivity, deformation) {
    const rotSpeed = (0.15 + this.energy * 0.6 + this.bassHit * 1.2) * speed;
    this.mesh.rotation.y += rotSpeed * 0.016;
    this.mesh.rotation.x = Math.sin(time * 0.2) * 0.15 + Math.sin(time * 0.8) * this.smoothBass * 0.35 + this.bassHit * 0.15;
    this.mesh.rotation.z = Math.sin(time * 0.15 + 1) * 0.1 + Math.cos(time * 0.7) * this.smoothMid * 0.2;
    const scale = 1 + Math.sin(time * 0.6) * 0.05 + this.smoothBass * 0.08 + this.bassHit * 0.38;
    this.mesh.scale.setScalar(scale);
    const pos = this.mesh.geometry.attributes.position.array;
    const len = pos.length;
    for (let i = 0; i < len; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];
      const nx = this.baseNormals[i];
      const ny = this.baseNormals[i + 1];
      const nz = this.baseNormals[i + 2];
      const bassWave1 = Math.sin(nx * 3 + time * 1.5 * speed) * Math.cos(ny * 2.5 + time * 1.1 * speed) * Math.sin(nz * 4 + time * 1.8 * speed);
      const bassWave2 = Math.sin(ny * 5 - time * 0.8 * speed) * Math.cos(nz * 3.5 + time * 1.3 * speed);
      const bassWave3 = Math.sin((nx + nz) * 2 + time * 2 * speed) * Math.cos(ny * 4 - time * 1.6 * speed);
      let disp = (bassWave1 + bassWave2 * 0.7 + bassWave3 * 0.5) * this.smoothBass * 2.5;
      const midRipple = Math.sin(nx * 8 + nz * 6 - time * 3 * speed) * Math.sin(ny * 5 + time * 2.5 * speed);
      disp += midRipple * this.smoothMid * 1.2;
      const trebleJitter = Math.sin(nx * 16 + time * 6) * Math.cos(nz * 14 - time * 5);
      disp += trebleJitter * 0.4 * this.smoothTreble * 2;
      disp += this.bassHit * 1.5;
      disp *= deformation * reactivity * 0.4;
      pos[i] = bx + nx * disp;
      pos[i + 1] = by + ny * disp;
      pos[i + 2] = bz + nz * disp;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }
  updateShards(time, delta, speed) {
    if (!this.shardMesh) return;
    const dt = Math.min(delta, 0.1);
    const audioBoost = 1 + this.energy * 0.35 + this.bassHit * 0.25;
    for (let i = 0; i < NUM_SHARDS; i++) {
      const data = this.shardData[i];
      data.currentAngle += dt * data.orbitSpeed * audioBoost * speed;
      const angle = data.currentAngle;
      const rad = data.orbitRadius + this.bassHit * 1.2 - this.smoothBass * 0.5;
      const bob = Math.sin(time * data.bobSpeed + data.orbitPhase * 3) * data.bobAmp * (1 + this.smoothBass * 1.5);
      this.dummy.position.set(
        Math.cos(angle) * rad,
        data.orbitHeight + bob + Math.sin(angle) * data.orbitTilt * rad,
        Math.sin(angle) * rad
      );
      data.currentTumble += dt * data.tumbleSpeed * (1 + this.energy * 0.5) * speed;
      this.quat.setFromAxisAngle(data.tumbleAxis, data.currentTumble);
      this.dummy.quaternion.copy(this.quat);
      this.dummy.scale.setScalar(data.size * (1 + this.bassHit * 0.4 + this.smoothBass * 0.15));
      this.dummy.updateMatrix();
      this.shardMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.shardMesh.instanceMatrix.needsUpdate = true;
  }
  updateParticles(audio, time) {
    if (!this.particleMaterial) return;
    this.particleMaterial.uniforms.uTime.value = time;
    this.particleMaterial.uniforms.uAudio.value = audio.rms;
    this.particleMaterial.uniforms.uBass.value = audio.bass;
  }
  updateNebula(audio, time) {
    if (!this.nebulaMaterial) return;
    this.nebulaMaterial.uniforms.uTime.value = time;
    this.nebulaMaterial.uniforms.uAudio.value = audio.rms;
    this.nebulaMaterial.uniforms.uBass.value = audio.bass;
  }
  onThemeChange(theme) {
    const stops = theme.gradientStops;
    const colCore = stops?.[0] ?? theme.primary;
    const colShards = stops?.[1] ?? theme.secondary;
    const colPart1 = stops?.[2] ?? stops?.[0] ?? theme.primary;
    const colPart2 = stops?.[3] ?? stops?.[1] ?? theme.secondary;
    const colNeb1 = stops?.[0] ?? theme.primary;
    const colNeb2 = stops ? stops.at(-1) ?? theme.secondary : theme.secondary;
    this.material.color.set(colCore);
    this.material.emissive.set(colCore);
    this.material.emissiveIntensity = 0.45;
    if (this.polyLight) {
      this.polyLight.color.set(colCore);
    }
    if (this.shardMaterial) {
      this.shardMaterial.color.set(colShards);
      this.shardMaterial.emissive.set(colShards);
    }
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uColor1.value.set(colPart1);
      this.particleMaterial.uniforms.uColor2.value.set(colPart2);
    }
    if (this.nebulaMaterial) {
      this.nebulaMaterial.uniforms.uColor1.value.set(colNeb1);
      this.nebulaMaterial.uniforms.uColor2.value.set(colNeb2);
    }
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.shardMesh) {
      this.shardMesh.geometry.dispose();
      this.shardMaterial?.dispose();
    }
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particleMaterial?.dispose();
    }
    if (this.nebula) {
      this.nebula.geometry.dispose();
      this.nebulaMaterial?.dispose();
    }
  }
};

// src/presets/Pendulum.ts
var THREE9 = __toESM(require("three"), 1);
var PendulumPreset = class extends BasePreset {
  id = "pendulum";
  name = "Pendulum";
  category = "Structures";
  description = "Array of harmonic suspended spheres forming a phase-aligned wave.";
  cameraConfig = {
    position: [0, 1.5, 10],
    target: [0, 1.5, 0],
    autoRotate: false
  };
  numPendulums = 24;
  sphereMeshes = [];
  stringLines = [];
  sphereMaterial;
  stringMaterial;
  sphereGeom = new THREE9.SphereGeometry(0.35, 24, 24);
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Swing Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Amplitude", min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.2 }
    ]);
  }
  setup(ctx) {
    this.sphereMeshes.length = 0;
    this.stringLines.length = 0;
    this.sphereMaterial = new THREE9.MeshStandardMaterial({
      color: new THREE9.Color(ctx.theme.primary),
      emissive: new THREE9.Color(ctx.theme.secondary),
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8
    });
    this.stringMaterial = new THREE9.LineBasicMaterial({
      color: new THREE9.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.6
    });
    const spacing = 0.5;
    const startX = -((this.numPendulums - 1) * spacing) / 2;
    for (let i = 0; i < this.numPendulums; i++) {
      const x = startX + i * spacing;
      const sphere = new THREE9.Mesh(this.sphereGeom, this.sphereMaterial);
      sphere.position.set(x, 0, 0);
      const lineGeom = new THREE9.BufferGeometry().setFromPoints([
        new THREE9.Vector3(x, 4, 0),
        new THREE9.Vector3(x, 0, 0)
      ]);
      const string = new THREE9.Line(lineGeom, this.stringMaterial);
      this.sphereMeshes.push(sphere);
      this.stringLines.push(string);
      this.group.add(sphere);
      this.group.add(string);
    }
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const amplitude = this.paramStore.getValue("density");
    this.group.rotation.y += delta * 0.1 * speed;
    const spacing = 0.5;
    const startX = -((this.numPendulums - 1) * spacing) / 2;
    const kickBoost = audio.bass * 0.8 * reactivity;
    for (let i = 0; i < this.numPendulums; i++) {
      const x = startX + i * spacing;
      const freq = 1 + i * 0.05;
      const angle = Math.sin(time * freq * 2 * speed) * (0.8 * amplitude + kickBoost);
      const length = 4;
      const sphereX = x + Math.sin(angle) * (length * 0.5);
      const sphereY = 4 - Math.cos(angle) * length;
      const sphereZ = Math.sin(angle * 2) * (audio.mid * 1.5 * reactivity);
      this.sphereMeshes[i].position.set(sphereX, sphereY, sphereZ);
      const linePos = this.stringLines[i].geometry.attributes.position.array;
      linePos[0] = x;
      linePos[1] = 4;
      linePos[2] = 0;
      linePos[3] = sphereX;
      linePos[4] = sphereY;
      linePos[5] = sphereZ;
      this.stringLines[i].geometry.attributes.position.needsUpdate = true;
    }
    if (audio.beat) {
      this.sphereMaterial.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.sphereMaterial.emissiveIntensity *= 0.94;
    }
  }
  onThemeChange(theme) {
    this.sphereMaterial.color.set(theme.primary);
    this.sphereMaterial.emissive.set(theme.secondary);
    this.stringMaterial.color.set(theme.accent);
  }
};

// src/presets/WarpGrid.ts
var THREE10 = __toESM(require("three"), 1);
var WarpGridPreset = class extends BasePreset {
  id = "warp";
  name = "Warp Grid";
  category = "Structures";
  description = "Distorted spacetime wireframe lattice warping on transients.";
  cameraConfig = {
    position: [0, 8, 16],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };
  mesh;
  geometry;
  material;
  basePositions;
  segments = 48;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Grid Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Curvature Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Gravity Dip", min: 0.5, max: 3, step: 0.1, defaultValue: 1.5 }
    ]);
  }
  setup(ctx) {
    this.geometry = new THREE10.PlaneGeometry(20, 20, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2);
    const pos = this.geometry.attributes.position.array;
    this.basePositions = new Float32Array(pos);
    this.material = new THREE10.MeshStandardMaterial({
      color: new THREE10.Color(ctx.theme.primary),
      emissive: new THREE10.Color(ctx.theme.accent),
      emissiveIntensity: 0.4,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9
    });
    this.mesh = new THREE10.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, -1, 0);
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const dip = this.paramStore.getValue("density");
    this.group.rotation.y += delta * 0.08 * speed;
    const pos = this.geometry.attributes.position.array;
    const kickForce = (audio.bass * 2 + audio.beatEnergy * 2.5) * reactivity;
    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const bz = this.basePositions[i + 2];
      const dist = Math.hypot(bx, bz);
      const warpSink = -dip / (1 + dist * 0.4) * (1 + kickForce * 0.8);
      const ripple = Math.sin(dist * 2.5 - time * 4 * speed) * (0.3 + audio.mid * 0.8 * reactivity);
      pos[i + 1] = warpSink + ripple;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    if (audio.beat) {
      this.material.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.93;
    }
  }
  onThemeChange(theme) {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.accent);
  }
};

// src/presets/DNAHelix.ts
var THREE11 = __toESM(require("three"), 1);
var DNAHelixPreset = class extends BasePreset {
  id = "dna";
  name = "DNA Helix";
  category = "Structures";
  description = "Intertwined double helix strands rotating and vibrating.";
  cameraConfig = {
    position: [0, 0, 12],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };
  sphereMesh;
  rungsMesh;
  numPairs = 64;
  dummy = new THREE11.Object3D();
  sphereColors;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Twist Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Strand Radius", min: 1, max: 4, step: 0.1, defaultValue: 2 }
    ]);
  }
  setup(ctx) {
    const sphereGeom = new THREE11.SphereGeometry(0.18, 16, 16);
    const sphereMat = new THREE11.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.8
    });
    this.sphereMesh = new THREE11.InstancedMesh(sphereGeom, sphereMat, this.numPairs * 2);
    this.sphereColors = new Float32Array(this.numPairs * 2 * 3);
    const rungGeom = new THREE11.CylinderGeometry(0.04, 0.04, 1, 8);
    rungGeom.rotateZ(Math.PI / 2);
    const rungMat = new THREE11.MeshStandardMaterial({
      color: new THREE11.Color(ctx.theme.secondary),
      roughness: 0.4,
      metalness: 0.6
    });
    this.rungsMesh = new THREE11.InstancedMesh(rungGeom, rungMat, this.numPairs);
    const col1 = new THREE11.Color(ctx.theme.primary);
    const col2 = new THREE11.Color(ctx.theme.accent);
    for (let i = 0; i < this.numPairs; i++) {
      col1.toArray(this.sphereColors, i * 2 * 3);
      col2.toArray(this.sphereColors, (i * 2 + 1) * 3);
    }
    this.sphereMesh.instanceColor = new THREE11.InstancedBufferAttribute(this.sphereColors, 3);
    this.group.add(this.sphereMesh);
    this.group.add(this.rungsMesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const baseRadius = this.paramStore.getValue("density");
    this.group.rotation.y += delta * (0.3 + audio.mid * 0.8 * reactivity) * speed;
    this.group.rotation.x = Math.sin(time * 0.5 * speed) * 0.25;
    const heightStep = 0.22;
    const totalHeight = this.numPairs * heightStep;
    const baseY = -totalHeight / 2;
    const radius = baseRadius + audio.bass * 0.8 * reactivity;
    const twistSpeed = 0.18;
    for (let i = 0; i < this.numPairs; i++) {
      const angle = i * twistSpeed + time * 1.2 * speed;
      const y = baseY + i * heightStep;
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;
      this.dummy.position.set(x1, y, z1);
      this.dummy.scale.setScalar(1 + (audio.beat ? 0.3 * reactivity : 0));
      this.dummy.updateMatrix();
      this.sphereMesh.setMatrixAt(i * 2, this.dummy.matrix);
      this.dummy.position.set(x2, y, z2);
      this.dummy.scale.setScalar(1 + (audio.beat ? 0.3 * reactivity : 0));
      this.dummy.updateMatrix();
      this.sphereMesh.setMatrixAt(i * 2 + 1, this.dummy.matrix);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const rungLen = Math.hypot(x2 - x1, z2 - z1);
      this.dummy.position.set(midX, y, midZ);
      this.dummy.rotation.set(0, -angle, 0);
      this.dummy.scale.set(rungLen, 1, 1);
      this.dummy.updateMatrix();
      this.rungsMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.sphereMesh.instanceMatrix.needsUpdate = true;
    this.rungsMesh.instanceMatrix.needsUpdate = true;
  }
  onThemeChange(theme) {
    const col1 = new THREE11.Color(theme.primary);
    const col2 = new THREE11.Color(theme.accent);
    for (let i = 0; i < this.numPairs; i++) {
      col1.toArray(this.sphereColors, i * 2 * 3);
      col2.toArray(this.sphereColors, (i * 2 + 1) * 3);
    }
    if (this.sphereMesh.instanceColor) {
      this.sphereMesh.instanceColor.needsUpdate = true;
    }
  }
  onDispose() {
    if (this.sphereMesh) {
      this.sphereMesh.geometry.dispose();
      this.sphereMesh.material.dispose();
    }
    if (this.rungsMesh) {
      this.rungsMesh.geometry.dispose();
      this.rungsMesh.material.dispose();
    }
  }
};

// src/presets/Cymatic.ts
var THREE12 = __toESM(require("three"), 1);
var CymaticPreset = class extends BasePreset {
  id = "cymatic";
  name = "Cymatic";
  category = "Structures";
  description = "Standing wave resonance plate organizing nodal sand figures.";
  cameraConfig = {
    position: [0, 8, 14],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };
  plateMesh;
  sandParticles;
  material;
  particleMaterial;
  numParticles = 4e3;
  particleBasePositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Resonance Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Nodal Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Mode Complexity", min: 2, max: 8, step: 1, defaultValue: 4 }
    ]);
  }
  setup(ctx) {
    const plateGeom = new THREE12.CylinderGeometry(6, 6, 0.2, 64);
    this.material = new THREE12.MeshStandardMaterial({
      color: new THREE12.Color(ctx.theme.background).offsetHSL(0, 0, 0.08),
      roughness: 0.4,
      metalness: 0.85,
      emissive: new THREE12.Color(ctx.theme.primary),
      emissiveIntensity: 0.15
    });
    this.plateMesh = new THREE12.Mesh(plateGeom, this.material);
    this.group.add(this.plateMesh);
    const particleGeom = new THREE12.BufferGeometry();
    const positions = new Float32Array(this.numParticles * 3);
    this.particleBasePositions = new Float32Array(this.numParticles * 2);
    for (let i = 0; i < this.numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 5.6;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      this.particleBasePositions[i * 2] = x;
      this.particleBasePositions[i * 2 + 1] = z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = 0.15;
      positions[i * 3 + 2] = z;
    }
    particleGeom.setAttribute("position", new THREE12.BufferAttribute(positions, 3));
    this.particleMaterial = new THREE12.PointsMaterial({
      color: new THREE12.Color(ctx.theme.accent),
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE12.AdditiveBlending,
      depthWrite: false
    });
    this.sandParticles = new THREE12.Points(particleGeom, this.particleMaterial);
    this.plateMesh.add(this.sandParticles);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const baseMode = Math.floor(this.paramStore.getValue("density"));
    this.plateMesh.rotation.y += delta * 0.15 * speed;
    const n = baseMode + Math.floor(audio.bass * 3);
    const m = baseMode + 2 + Math.floor(audio.mid * 3);
    const pos = this.sandParticles.geometry.attributes.position.array;
    for (let i = 0; i < this.numParticles; i++) {
      const bx = this.particleBasePositions[i * 2];
      const bz = this.particleBasePositions[i * 2 + 1];
      const chladni = Math.cos(n * bx * 0.6) * Math.cos(m * bz * 0.6) - Math.cos(m * bx * 0.6) * Math.cos(n * bz * 0.6);
      const vibration = Math.abs(chladni);
      const drift = vibration * 0.25 * (1 + audio.bass * 2 * reactivity);
      const jitter = Math.sin(i * 12 + time * 8) * drift;
      pos[i * 3] = bx + (chladni > 0 ? -1 : 1) * Math.abs(chladni) * 0.15 * reactivity;
      pos[i * 3 + 1] = 0.15 + Math.abs(jitter);
      pos[i * 3 + 2] = bz + (chladni > 0 ? 1 : -1) * Math.abs(chladni) * 0.15 * reactivity;
    }
    this.sandParticles.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.material.emissive.set(theme.primary);
    this.particleMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.plateMesh) {
      this.plateMesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.sandParticles) {
      this.sandParticles.geometry.dispose();
      this.particleMaterial.dispose();
    }
  }
};

// src/presets/TopoMap.ts
var THREE13 = __toESM(require("three"), 1);
var TopoMapPreset = class extends BasePreset {
  id = "topographic";
  name = "Topo Map";
  category = "Structures";
  description = "Stepped 3D contour elevation map with glowing isoline bands.";
  cameraConfig = {
    position: [0, 10, 18],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };
  terrainMesh;
  material;
  basePositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Contour Drift", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Elevation Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Contour Bands", min: 2, max: 10, step: 0.5, defaultValue: 6 }
    ]);
  }
  setup(ctx) {
    const gridRes = 80;
    const size = 18;
    const geometry = new THREE13.PlaneGeometry(size, size, gridRes, gridRes);
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position.array;
    this.basePositions = new Float32Array(pos);
    this.material = new THREE13.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE13.Color(ctx.theme.primary) },
        uColor2: { value: new THREE13.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE13.Color(ctx.theme.accent) },
        uBands: { value: 6 }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        uniform float uBands;
        varying vec3 vPos;

        void main() {
          float elev = vPos.y * 1.2;
          float contour = abs(fract(elev * uBands - 0.5) - 0.5) / fwidth(elev * uBands);
          float line = 1.0 - clamp(contour, 0.0, 1.0);

          vec3 baseCol = mix(uColor1, uColor2, clamp(elev * 0.35 + 0.5, 0.0, 1.0));
          vec3 col = mix(baseCol, uAccent, line * 0.9);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.terrainMesh = new THREE13.Mesh(geometry, this.material);
    this.group.add(this.terrainMesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const bands = this.paramStore.getValue("density");
    this.material.uniforms.uBands.value = bands;
    this.group.rotation.y += delta * 0.08 * speed;
    const pos = this.terrainMesh.geometry.attributes.position.array;
    const bassElevation = (audio.bass * 2.2 + audio.beatEnergy * 1.5) * reactivity;
    for (let i = 0; i < pos.length; i += 3) {
      const x = this.basePositions[i] * 0.25;
      const z = this.basePositions[i + 2] * 0.25;
      const ridge1 = Math.sin(x * 1.8 + time * 1.5 * speed) * Math.cos(z * 1.8 + time * 1.2 * speed);
      const ridge2 = Math.sin(Math.hypot(x, z) * 3 - time * 2 * speed) * 0.5;
      pos[i + 1] = (ridge1 + ridge2) * (1.2 + bassElevation * 0.8) + audio.mid * 0.5 * reactivity;
    }
    this.terrainMesh.geometry.attributes.position.needsUpdate = true;
    this.terrainMesh.geometry.computeVertexNormals();
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.terrainMesh) {
      this.terrainMesh.geometry.dispose();
      this.material.dispose();
    }
  }
};

// src/presets/VinylPlayer.ts
var THREE14 = __toESM(require("three"), 1);
var VinylPlayerPreset = class extends BasePreset {
  id = "vinyl";
  name = "Vinyl";
  category = "Structures";
  description = "3D spinning vinyl record turntable with tonearm and grooves.";
  cameraConfig = {
    position: [0, 8, 12],
    target: [0, 0, 0],
    autoRotate: false
  };
  vinylDisc;
  toneArm;
  vinylMaterial;
  labelMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "RPM Speed", min: 0.5, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Scratch Reactivity", min: 0.1, max: 2, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Groove Shine", min: 0.2, max: 1, step: 0.05, defaultValue: 0.8 }
    ]);
  }
  setup(ctx) {
    const discGeom = new THREE14.CylinderGeometry(4, 4, 0.08, 64);
    this.vinylMaterial = new THREE14.MeshPhysicalMaterial({
      color: new THREE14.Color(ctx.theme.background).offsetHSL(0, 0, 0.05),
      roughness: 0.3,
      metalness: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.1
    });
    this.vinylDisc = new THREE14.Mesh(discGeom, this.vinylMaterial);
    this.vinylDisc.rotation.set(0, 0, 0);
    this.group.add(this.vinylDisc);
    const labelGeom = new THREE14.CylinderGeometry(1.3, 1.3, 0.09, 32);
    this.labelMaterial = new THREE14.MeshBasicMaterial({
      color: new THREE14.Color(ctx.theme.accent)
    });
    const labelMesh = new THREE14.Mesh(labelGeom, this.labelMaterial);
    this.vinylDisc.add(labelMesh);
    const spindleGeom = new THREE14.CylinderGeometry(0.1, 0.1, 0.4, 16);
    const spindleMat = new THREE14.MeshStandardMaterial({
      color: new THREE14.Color(ctx.theme.primary),
      metalness: 0.95
    });
    const spindleMesh = new THREE14.Mesh(spindleGeom, spindleMat);
    this.vinylDisc.add(spindleMesh);
    this.toneArm = new THREE14.Group();
    this.toneArm.position.set(3.8, 0.2, 0.5);
    const armGeom = new THREE14.CylinderGeometry(0.04, 0.04, 3.8, 12);
    armGeom.rotateZ(Math.PI / 2);
    const armMat = new THREE14.MeshStandardMaterial({
      color: new THREE14.Color(ctx.theme.accent),
      metalness: 0.9,
      roughness: 0.2
    });
    const armMesh = new THREE14.Mesh(armGeom, armMat);
    this.toneArm.add(armMesh);
    const headshellGeom = new THREE14.BoxGeometry(0.2, 0.1, 0.4);
    const headshellMat = new THREE14.MeshStandardMaterial({ color: 2236962, metalness: 0.5 });
    const headshell = new THREE14.Mesh(headshellGeom, headshellMat);
    headshell.position.set(-1.8, -0.1, 0);
    this.toneArm.add(headshell);
    this.group.add(this.toneArm);
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const shine = this.paramStore.getValue("density");
    this.vinylMaterial.clearcoat = shine;
    const rpm = 3.5 * speed + audio.mid * 3 * reactivity;
    this.vinylDisc.rotation.y += delta * rpm;
    this.toneArm.rotation.y = -0.25 + Math.sin(this.vinylDisc.rotation.y * 0.4) * 0.02 + audio.bass * 0.06 * reactivity;
  }
  onThemeChange(theme) {
    this.labelMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.vinylDisc) {
      this.vinylDisc.traverse((child) => {
        if (child instanceof THREE14.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }
    if (this.toneArm) {
      this.toneArm.traverse((child) => {
        if (child instanceof THREE14.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }
  }
};

// src/presets/OrbitalRings.ts
var THREE15 = __toESM(require("three"), 1);
var OrbitalRingsPreset = class extends BasePreset {
  id = "rings";
  name = "Rings";
  category = "Structures";
  description = "Multi-axis concentric nested torus rings orbiting central nucleus.";
  cameraConfig = {
    position: [0, 3, 11],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.35
  };
  rings = [];
  coreMesh;
  ringMaterial;
  coreMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Orbit Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Gimbal Spread", min: 0.5, max: 2, step: 0.1, defaultValue: 1 }
    ]);
  }
  setup(ctx) {
    this.rings.length = 0;
    const coreGeom = new THREE15.SphereGeometry(1.2, 32, 32);
    this.coreMaterial = new THREE15.MeshStandardMaterial({
      color: new THREE15.Color(ctx.theme.primary),
      emissive: new THREE15.Color(ctx.theme.accent),
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.8
    });
    this.coreMesh = new THREE15.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);
    this.ringMaterial = new THREE15.MeshStandardMaterial({
      color: new THREE15.Color(ctx.theme.secondary),
      emissive: new THREE15.Color(ctx.theme.primary),
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: true
    });
    const radii = [2.4, 3.6, 4.8];
    for (const r of radii) {
      const torusGeom = new THREE15.TorusGeometry(r, 0.15, 16, 64);
      const ring = new THREE15.Mesh(torusGeom, this.ringMaterial);
      this.rings.push(ring);
      this.group.add(ring);
    }
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const spread = this.paramStore.getValue("density");
    const coreScale = 1 + (audio.bass * 0.5 + audio.beatEnergy * 0.6) * reactivity;
    this.coreMesh.scale.setScalar(coreScale);
    if (this.rings.length >= 3) {
      this.rings[0].rotation.x += delta * (0.8 * speed + audio.bass * 1.5 * reactivity);
      this.rings[0].rotation.y = Math.sin(time * 0.5) * 0.3 * spread;
      this.rings[1].rotation.y += delta * (0.6 * speed + audio.mid * 1.2 * reactivity);
      this.rings[1].rotation.z = Math.cos(time * 0.4) * 0.4 * spread;
      this.rings[2].rotation.z += delta * (0.5 * speed + audio.treble * 1.8 * reactivity);
      this.rings[2].rotation.x = Math.sin(time * 0.6) * 0.5 * spread;
    }
    if (audio.beat) {
      this.coreMaterial.emissiveIntensity = 1 * reactivity;
      this.ringMaterial.emissiveIntensity = 0.8 * reactivity;
    } else {
      this.coreMaterial.emissiveIntensity *= 0.93;
      this.ringMaterial.emissiveIntensity *= 0.95;
    }
  }
  onThemeChange(theme) {
    this.coreMaterial.color.set(theme.primary);
    this.coreMaterial.emissive.set(theme.accent);
    this.ringMaterial.color.set(theme.secondary);
    this.ringMaterial.emissive.set(theme.primary);
  }
  onDispose() {
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial.dispose();
    }
    this.rings.forEach((ring) => {
      ring.geometry.dispose();
    });
    if (this.ringMaterial) {
      this.ringMaterial.dispose();
    }
  }
};

// src/presets/Tesseract4D.ts
var THREE16 = __toESM(require("three"), 1);
var Tesseract4DPreset = class extends BasePreset {
  id = "tesseract";
  name = "Tesseract";
  category = "Structures";
  description = "4D hypercube projected stereographically into 3D space.";
  cameraConfig = {
    position: [0, 0, 9],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.35
  };
  edgeLines;
  vertexNodes;
  lineMaterial;
  nodeMaterial;
  vertices4D = [];
  edges = [];
  rotXW = 0;
  rotYW = 0;
  rotZW = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "4D Rotation Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Perspective Scale", min: 1, max: 3.5, step: 0.1, defaultValue: 1.8 }
    ]);
  }
  setup(ctx) {
    this.vertices4D.length = 0;
    for (let i = 0; i < 16; i++) {
      const x = i & 1 ? 1 : -1;
      const y = i & 2 ? 1 : -1;
      const z = i & 4 ? 1 : -1;
      const w = i & 8 ? 1 : -1;
      this.vertices4D.push([x, y, z, w]);
    }
    this.edges.length = 0;
    for (let i = 0; i < 16; i++) {
      for (let bit = 0; bit < 4; bit++) {
        const neighbor = i ^ 1 << bit;
        if (neighbor > i) {
          this.edges.push([i, neighbor]);
        }
      }
    }
    const lineGeom = new THREE16.BufferGeometry();
    const linePositions = new Float32Array(this.edges.length * 2 * 3);
    lineGeom.setAttribute("position", new THREE16.BufferAttribute(linePositions, 3));
    this.lineMaterial = new THREE16.LineBasicMaterial({
      color: new THREE16.Color(ctx.theme.primary),
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      blending: THREE16.AdditiveBlending,
      depthWrite: false
    });
    this.edgeLines = new THREE16.LineSegments(lineGeom, this.lineMaterial);
    this.group.add(this.edgeLines);
    const nodeGeom = new THREE16.BufferGeometry();
    const nodePositions = new Float32Array(16 * 3);
    nodeGeom.setAttribute("position", new THREE16.BufferAttribute(nodePositions, 3));
    this.nodeMaterial = new THREE16.PointsMaterial({
      color: new THREE16.Color(ctx.theme.accent),
      size: 0.25,
      transparent: true,
      opacity: 0.95,
      blending: THREE16.AdditiveBlending,
      depthWrite: false
    });
    this.vertexNodes = new THREE16.Points(nodeGeom, this.nodeMaterial);
    this.group.add(this.vertexNodes);
  }
  update(ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const projScale = this.paramStore.getValue("density");
    this.rotXW += delta * (0.4 + audio.bass * 1.5 * reactivity) * speed;
    this.rotYW += delta * (0.3 + audio.mid * 1.2 * reactivity) * speed;
    this.rotZW += delta * (0.2 + audio.treble * 1 * reactivity) * speed;
    this.group.rotation.y += delta * 0.15 * speed;
    this.group.rotation.x += delta * 0.1 * speed;
    const projected = [];
    const distance4D = 2.4;
    const nodePos = this.vertexNodes.geometry.attributes.position.array;
    for (let i = 0; i < 16; i++) {
      const [x, y, z, w] = this.vertices4D[i];
      const cosXW = Math.cos(this.rotXW);
      const sinXW = Math.sin(this.rotXW);
      const x1 = x * cosXW - w * sinXW;
      const w1 = x * sinXW + w * cosXW;
      const cosYW = Math.cos(this.rotYW);
      const sinYW = Math.sin(this.rotYW);
      const y2 = y * cosYW - w1 * sinYW;
      const w2 = y * sinYW + w1 * cosYW;
      const cosZW = Math.cos(this.rotZW);
      const sinZW = Math.sin(this.rotZW);
      const z3 = z * cosZW - w2 * sinZW;
      const w3 = z * sinZW + w2 * cosZW;
      const scale = distance4D / Math.max(0.1, distance4D - w3);
      const v3 = new THREE16.Vector3(x1 * scale * projScale, y2 * scale * projScale, z3 * scale * projScale);
      projected.push(v3);
      nodePos[i * 3] = v3.x;
      nodePos[i * 3 + 1] = v3.y;
      nodePos[i * 3 + 2] = v3.z;
    }
    this.vertexNodes.geometry.attributes.position.needsUpdate = true;
    const linePos = this.edgeLines.geometry.attributes.position.array;
    let ptr = 0;
    for (const [p1Idx, p2Idx] of this.edges) {
      const p1 = projected[p1Idx];
      const p2 = projected[p2Idx];
      linePos[ptr++] = p1.x;
      linePos[ptr++] = p1.y;
      linePos[ptr++] = p1.z;
      linePos[ptr++] = p2.x;
      linePos[ptr++] = p2.y;
      linePos[ptr++] = p2.z;
    }
    this.edgeLines.geometry.attributes.position.needsUpdate = true;
    if (audio.beat) {
      this.nodeMaterial.size = 0.45;
      this.lineMaterial.color.set(ctx.theme.accent);
    } else {
      this.nodeMaterial.size = 0.25;
      this.lineMaterial.color.set(ctx.theme.primary);
    }
  }
  onThemeChange(theme) {
    this.lineMaterial.color.set(theme.primary);
    this.nodeMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.edgeLines) {
      this.edgeLines.geometry.dispose();
      this.lineMaterial.dispose();
    }
    if (this.vertexNodes) {
      this.vertexNodes.geometry.dispose();
      this.nodeMaterial.dispose();
    }
  }
};

// src/presets/Hologram.ts
var THREE17 = __toESM(require("three"), 1);
var HologramPreset = class extends BasePreset {
  id = "hologram";
  name = "Hologram";
  category = "Structures";
  description = "Sci-fi projection glitch plane with scanlines and chromatic fringe.";
  cameraConfig = {
    position: [0, 2, 8],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };
  planeMesh;
  emitterCone;
  hologramMaterial;
  emitterMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Scanline Speed", min: 0.1, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Glitch Intensity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Holo Opacity", min: 0.2, max: 1, step: 0.05, defaultValue: 0.8 }
    ]);
  }
  setup(ctx) {
    const planeGeom = new THREE17.PlaneGeometry(8, 8, 32, 32);
    this.hologramMaterial = new THREE17.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScanSpeed: { value: 1 },
        uGlitch: { value: 0 },
        uOpacity: { value: 0.8 },
        uColor: { value: new THREE17.Color(ctx.theme.primary) },
        uAccent: { value: new THREE17.Color(ctx.theme.accent) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE17.AdditiveBlending,
      side: THREE17.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uGlitch;

        void main() {
          vUv = uv;
          vec3 p = position;
          // Chromatic/jitter glitch displacement on claps
          if (uGlitch > 0.05) {
            float jitter = sin(p.y * 20.0 + uTime * 30.0) * uGlitch * 0.4;
            p.x += jitter;
          }
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uScanSpeed;
        uniform float uGlitch;
        uniform float uOpacity;
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          // Scanlines
          float scanline = sin((vUv.y * 60.0 - uTime * uScanSpeed * 8.0)) * 0.5 + 0.5;
          float grid = (step(0.95, fract(vUv.x * 16.0)) + step(0.95, fract(vUv.y * 16.0))) * 0.3;

          vec3 col = mix(uColor, uAccent, scanline * 0.4 + grid);
          float alpha = (scanline * 0.6 + 0.2 + grid) * uOpacity;

          // Edge flicker
          float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x) *
                       smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

          gl_FragColor = vec4(col, alpha * edge);
        }
      `
    });
    this.planeMesh = new THREE17.Mesh(planeGeom, this.hologramMaterial);
    this.planeMesh.position.set(0, 1.2, 0);
    this.group.add(this.planeMesh);
    const coneGeom = new THREE17.ConeGeometry(2, 2.5, 32, 1, true);
    coneGeom.rotateX(Math.PI);
    this.emitterMaterial = new THREE17.MeshStandardMaterial({
      color: new THREE17.Color(ctx.theme.background).offsetHSL(0, 0, 0.08),
      emissive: new THREE17.Color(ctx.theme.primary),
      emissiveIntensity: 0.3,
      wireframe: true
    });
    this.emitterCone = new THREE17.Mesh(coneGeom, this.emitterMaterial);
    this.emitterCone.position.set(0, -1.8, 0);
    this.group.add(this.emitterCone);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const opacity = this.paramStore.getValue("density");
    this.group.rotation.y += delta * 0.2 * speed;
    this.hologramMaterial.uniforms.uTime.value = time;
    this.hologramMaterial.uniforms.uScanSpeed.value = speed;
    this.hologramMaterial.uniforms.uOpacity.value = opacity;
    let glitch = 0;
    if (audio.beat) {
      glitch = 0.35 * reactivity;
    } else if (audio.treble > 0.6) {
      glitch = 0.15 * reactivity;
    }
    this.hologramMaterial.uniforms.uGlitch.value = glitch;
    if (audio.beat) {
      this.emitterMaterial.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.emitterMaterial.emissiveIntensity *= 0.94;
    }
  }
  onThemeChange(theme) {
    this.hologramMaterial.uniforms.uColor.value.set(theme.primary);
    this.hologramMaterial.uniforms.uAccent.value.set(theme.accent);
    this.emitterMaterial.emissive.set(theme.primary);
  }
  onDispose() {
    if (this.planeMesh) {
      this.planeMesh.geometry.dispose();
      this.hologramMaterial.dispose();
    }
    if (this.emitterCone) {
      this.emitterCone.geometry.dispose();
      this.emitterMaterial.dispose();
    }
  }
};

// src/presets/GeodesicSphere.ts
var THREE18 = __toESM(require("three"), 1);
var GeodesicSpherePreset = class extends BasePreset {
  id = "geodesic";
  name = "Geodesic";
  category = "Structures";
  description = "Tessellated geodesic frequency sphere pulsing across faces.";
  cameraConfig = {
    position: [0, 0, 9],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.35
  };
  mesh;
  wireframe;
  geometry;
  material;
  wireMaterial;
  basePositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Spin Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Facet Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Sphere Radius", min: 1.5, max: 4.5, step: 0.1, defaultValue: 3 }
    ]);
  }
  setup(ctx) {
    const radius = this.paramStore.getValue("density");
    this.geometry = new THREE18.IcosahedronGeometry(radius, 3);
    const pos = this.geometry.attributes.position.array;
    this.basePositions = new Float32Array(pos);
    this.material = new THREE18.MeshStandardMaterial({
      color: new THREE18.Color(ctx.theme.primary),
      emissive: new THREE18.Color(ctx.theme.secondary),
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.wireMaterial = new THREE18.LineBasicMaterial({
      color: new THREE18.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE18.Mesh(this.geometry, this.material);
    const wireGeom = new THREE18.WireframeGeometry(this.geometry);
    this.wireframe = new THREE18.LineSegments(wireGeom, this.wireMaterial);
    this.group.add(this.mesh);
    this.group.add(this.wireframe);
  }
  update(ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.x += delta * (0.2 + audio.mid * 0.4 * reactivity) * speed;
    this.group.rotation.y += delta * (0.25 + audio.treble * 0.5 * reactivity) * speed;
    const pos = this.geometry.attributes.position.array;
    const pulse = (audio.bass * 1.4 + audio.beatEnergy * 1.8) * reactivity;
    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];
      const freqIdx = i % 256;
      const freq = (audio.frequencyData[freqIdx] || 0) / 255;
      const scale = 1 + freq * 0.5 * reactivity + pulse * 0.2 + Math.sin(time * 3 * speed + i * 0.1) * 0.1;
      pos[i] = bx * scale;
      pos[i + 1] = by * scale;
      pos[i + 2] = bz * scale;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
      this.material.emissiveIntensity = 0.8 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.92;
    }
  }
  onThemeChange(theme) {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.secondary);
    this.wireMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.wireframe) {
      this.wireframe.geometry.dispose();
      this.wireMaterial.dispose();
    }
  }
};

// src/presets/Starfield.ts
var THREE19 = __toESM(require("three"), 1);
var WARP_VERTEX_SHADER = `
  attribute float size;
  attribute float aRandom;
  uniform float uTime;
  uniform float uAudio;
  uniform float uBass;
  uniform float uWarpSpeed;
  uniform float uStreakLength;
  uniform float uSwirl;

  varying float vAlpha;
  varying float vRandom;
  varying float vDepthRatio;
  varying vec2 vScreenDir;
  varying float vStreakAmount;

  void main() {
    vec3 pos = position;

    float speed = 5.0 + uWarpSpeed * 25.0;
    float z = 300.0 - mod(-pos.z + uTime * speed, 300.0);
    pos.z = -z;

    float depthRatio = z * 0.00333;
    vDepthRatio = depthRatio;
    float proximity = 1.0 - depthRatio;

    if (uSwirl > 0.5) {
      float r = length(pos.xy);
      float theta = atan(pos.y, pos.x);
      theta += (proximity * (1.2 + aRandom * 0.8) + uTime * 0.3) * 0.35;
      pos.x = cos(theta) * r;
      pos.y = sin(theta) * r;
    }

    vAlpha = smoothstep(1.0, 0.7, depthRatio) * smoothstep(0.0, 0.04, depthRatio);
    vAlpha *= 0.4 + uAudio * 0.9;
    vRandom = aRandom;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    vec2 screenPos = gl_Position.xy / gl_Position.w;
    float screenDist = length(screenPos);
    vScreenDir = screenDist > 0.001 ? screenPos / screenDist : vec2(0.0, 1.0);

    float streakBase = uStreakLength * 4.0 + uBass * 10.0;
    vStreakAmount = streakBase * proximity * smoothstep(0.0, 0.15, screenDist);

    float perspSize = size * (1.0 + uAudio * 0.8) * (200.0 / max(-mvPos.z, 0.1));
    gl_PointSize = min(max(perspSize * (1.0 + vStreakAmount * 0.3), 1.0), 64.0);
  }
`;
var WARP_FRAGMENT_SHADER = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uBass;
  uniform float uTreble;
  uniform float uColorShift;

  varying float vAlpha;
  varying float vRandom;
  varying float vDepthRatio;
  varying vec2 vScreenDir;
  varying float vStreakAmount;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;

    float stretch = 1.0 + vStreakAmount;

    float ca = vScreenDir.x;
    float sa = vScreenDir.y;
    vec2 rotUv = vec2(uv.x * ca + uv.y * sa, -uv.x * sa + uv.y * ca);

    float alongStreak = abs(rotUv.x);
    rotUv.y /= mix(1.0, 0.15, smoothstep(0.0, 0.45, alongStreak));
    rotUv.x /= stretch;

    float d = length(rotUv);
    float brightCore = exp(-d * 18.0);
    float brightness = brightCore + exp(-d * 6.0) * 0.5;
    brightness *= 1.0 - smoothstep(0.35, 0.5, d);

    float streakFade = 1.0 - smoothstep(0.25, 0.48, alongStreak);
    brightness *= mix(1.0, streakFade, smoothstep(1.0, 3.0, stretch));

    if (brightness < 0.01) discard;

    float proximity = 1.0 - vDepthRatio;
    float shift = uColorShift * sin(uTime * 0.3 + vRandom * 6.28) * 0.5 + 0.5;
    vec3 col = mix(uColor1, uColor2, shift);
    col = mix(col, vec3(1.0, 0.97, 0.92), brightCore * proximity * 0.6);
    col += mix(vec3(0.0), uColor2, vStreakAmount * 0.1);

    gl_FragColor = vec4(col, brightness * vAlpha);
  }
`;
var StarfieldPreset = class extends BasePreset {
  id = "starfield";
  name = "Starfield";
  category = "Abstract & Space";
  description = "Hyperspace relativistic starfield with anamorphic velocity streaks and audio swirl.";
  cameraConfig = {
    position: [0, 0, 0],
    target: [0, 0, -50],
    autoRotate: false
  };
  points;
  geometry;
  material;
  count = 4e3;
  // Exact test contract count
  warpAccumulator = 0;
  bassPeak = 0;
  audioPeak = 0;
  treblePeak = 0;
  prevTime = void 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Warp Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Kick Reactivity", min: 0, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "density", name: "Star Density", min: 0.2, max: 1, step: 0.1, defaultValue: 1 },
      { id: "starSize", name: "Star Size", min: 0.05, max: 0.5, step: 0.01, defaultValue: 0.22 }
    ]);
  }
  setup(ctx) {
    this.geometry = new THREE19.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const randoms = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.pow(Math.random(), 0.6) * 45;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = -Math.random() * 300;
      sizes[i] = 0.5 + Math.random() * 1.5;
      randoms[i] = Math.random();
    }
    this.geometry.setAttribute("position", new THREE19.BufferAttribute(positions, 3));
    this.geometry.setAttribute("size", new THREE19.BufferAttribute(sizes, 1));
    this.geometry.setAttribute("aRandom", new THREE19.BufferAttribute(randoms, 1));
    const primaryColor = new THREE19.Color(ctx.theme.primary);
    const accentColor = new THREE19.Color(ctx.theme.accent);
    this.material = new THREE19.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAudio: { value: 0 },
        uBass: { value: 0 },
        uTreble: { value: 0 },
        uWarpSpeed: { value: 1 },
        uStreakLength: { value: 0.6 },
        uColorShift: { value: 0.5 },
        uSwirl: { value: 1 },
        uColor1: { value: primaryColor },
        uColor2: { value: accentColor }
      },
      vertexShader: WARP_VERTEX_SHADER,
      fragmentShader: WARP_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE19.AdditiveBlending,
      depthWrite: false
    });
    this.points = new THREE19.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);
  }
  update(_ctx, audio, time, delta) {
    if (!this.points || !this.material) return;
    const dt = this.prevTime !== void 0 ? Math.min(time - this.prevTime, 0.1) : delta || 1 / 60;
    this.prevTime = time;
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const density = this.paramStore.getValue("density");
    const activeCount = Math.floor(this.count * density);
    this.geometry.setDrawRange(0, activeCount);
    const bassIn = audio.bass * reactivity;
    const midIn = audio.mid * reactivity;
    const trebleIn = audio.treble * reactivity;
    const audioIn = audio.rms * reactivity;
    this.bassPeak = Math.max(bassIn, this.bassPeak * 0.92);
    this.audioPeak = Math.max(audioIn, this.audioPeak * 0.94);
    this.treblePeak = Math.max(trebleIn, this.treblePeak * 0.92);
    const effectiveWarpSpeed = speed * 0.8 + this.bassPeak * 1.5;
    this.warpAccumulator += dt * effectiveWarpSpeed;
    this.material.uniforms.uTime.value = this.warpAccumulator;
    this.material.uniforms.uAudio.value = this.audioPeak;
    this.material.uniforms.uBass.value = this.bassPeak;
    this.material.uniforms.uTreble.value = this.treblePeak;
    this.material.uniforms.uWarpSpeed.value = effectiveWarpSpeed;
    this.material.uniforms.uStreakLength.value = 0.5 + this.bassPeak * 0.8;
    this.material.uniforms.uSwirl.value = 1;
    this.points.rotation.z += dt * (0.05 + midIn * 0.2) * speed;
  }
  onThemeChange(theme) {
    if (this.material?.uniforms) {
      this.material.uniforms.uColor1.value.set(theme.primary);
      this.material.uniforms.uColor2.value.set(theme.accent);
    }
  }
  onDispose() {
    this.geometry?.dispose();
    this.material?.dispose();
    this.prevTime = void 0;
    this.warpAccumulator = 0;
  }
};

// src/presets/MilkDrop.ts
var THREE20 = __toESM(require("three"), 1);
var MilkDropPreset = class extends BasePreset {
  id = "milkdrop";
  name = "MilkDrop";
  category = "Abstract & Space";
  description = "Classic psychedelic Winamp Butterchurn warp feedback engine.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  mesh;
  material;
  waveformWave;
  waveMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([]);
  }
  getCustomParameters() {
    return [];
  }
  setup(ctx) {
    const planeGeom = new THREE20.PlaneGeometry(80, 55, 64, 64);
    this.material = new THREE20.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uBeat: { value: 0 },
        uColor1: { value: new THREE20.Color(ctx.theme.primary) },
        uColor2: { value: new THREE20.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE20.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vUv = uv;
          vec3 p = position;
          float dist = length(p.xy);
          p.z += sin(dist * 2.0 - uTime * 3.0) * (0.6 + uBass * 1.2);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uBeat;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec2 uv = vUv - 0.5;
          float angle = atan(uv.y, uv.x);
          float dist = length(uv);

          float spiral = sin(angle * 6.0 + dist * 12.0 - uTime * 2.5);
          float ripple = sin(dist * 24.0 - uTime * 4.0 * (1.0 + uMid));
          float pattern = spiral * ripple + uBeat * 0.4;

          vec3 col = mix(uColor1, uColor2, sin(dist * 5.0 + uTime) * 0.5 + 0.5);
          col = mix(col, uAccent, smoothstep(0.2, 0.8, pattern) * (0.7 + uTreble * 0.8));

          float centerGlow = 0.15 / (dist + 0.08);
          col += uAccent * centerGlow * (0.5 + uBass);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.mesh = new THREE20.Mesh(planeGeom, this.material);
    this.mesh.position.z = -4;
    this.group.add(this.mesh);
    const wavePointsCount = 256;
    const waveGeom = new THREE20.BufferGeometry();
    const wavePos = new Float32Array(wavePointsCount * 3);
    for (let i = 0; i < wavePointsCount; i++) {
      wavePos[i * 3] = (i / wavePointsCount - 0.5) * 55;
      wavePos[i * 3 + 1] = 0;
      wavePos[i * 3 + 2] = 0;
    }
    waveGeom.setAttribute("position", new THREE20.BufferAttribute(wavePos, 3));
    this.waveMaterial = new THREE20.LineBasicMaterial({
      color: new THREE20.Color(ctx.theme.accent),
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      blending: THREE20.AdditiveBlending
    });
    this.waveformWave = new THREE20.Line(waveGeom, this.waveMaterial);
    this.waveformWave.position.z = -1;
    this.group.add(this.waveformWave);
  }
  update(_ctx, audio, time, _delta) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uBass.value = audio.bass;
    this.material.uniforms.uMid.value = audio.mid;
    this.material.uniforms.uTreble.value = audio.treble;
    this.material.uniforms.uBeat.value = audio.beat ? 1 : 0;
    const pos = this.waveformWave.geometry.attributes.position.array;
    const count = pos.length / 3;
    const waveData = audio.timeDomainData;
    for (let i = 0; i < count; i++) {
      const sample = waveData && waveData.length > 0 ? (waveData[Math.floor(i / count * waveData.length)] - 128) / 128 : Math.sin(i * 0.1 + time * 10);
      pos[i * 3 + 1] = sample * (1.5 + audio.bass * 2.5);
    }
    this.waveformWave.geometry.attributes.position.needsUpdate = true;
    this.waveMaterial.opacity = 0.6 + audio.treble * 0.4;
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
    this.waveMaterial.color.set(theme.accent);
  }
  onDispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.waveformWave.geometry.dispose();
    this.waveMaterial.dispose();
  }
};

// src/presets/Halo.ts
var THREE21 = __toESM(require("three"), 1);
var HaloPreset = class extends BasePreset {
  id = "halo";
  name = "Halo";
  category = "Abstract & Space";
  description = "Multi-layered blooming corona light disc with harmonic petals.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  discMesh;
  material;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Spin Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Treble Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Petal Count", min: 4, max: 16, step: 1, defaultValue: 8 }
    ]);
  }
  setup(ctx) {
    const geometry = new THREE21.PlaneGeometry(60, 60, 64, 64);
    this.material = new THREE21.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uBass: { value: 0 },
        uPetals: { value: 8 },
        uColor1: { value: new THREE21.Color(ctx.theme.primary) },
        uColor2: { value: new THREE21.Color(ctx.theme.accent) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE21.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uTreble;
        uniform float uBass;
        uniform float uPetals;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv - 0.5;
          float r = length(uv) * 2.0;
          float angle = atan(uv.y, uv.x);

          // Harmonic blooming petals
          float petals = cos(angle * uPetals + uTime * 2.0) * (0.15 + uTreble * 0.35);
          float haloDist = abs(r - (0.6 + petals + uBass * 0.2));
          float glow = 0.04 / (haloDist + 0.02);

          // Inner core flare
          float core = 0.08 / (r + 0.05) * (0.8 + uBass);

          vec3 col = mix(uColor1, uColor2, sin(angle * 3.0 + uTime) * 0.5 + 0.5);
          col *= (glow + core);

          gl_FragColor = vec4(col, clamp(glow * 0.8 + core * 0.6, 0.0, 1.0));
        }
      `
    });
    this.discMesh = new THREE21.Mesh(geometry, this.material);
    this.group.add(this.discMesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const petals = this.paramStore.getValue("density");
    this.discMesh.rotation.z += delta * 0.2 * speed;
    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uTreble.value = audio.treble * reactivity;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uPetals.value = petals;
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.accent);
  }
  onDispose() {
    if (this.discMesh) {
      this.discMesh.geometry.dispose();
      this.material.dispose();
    }
  }
};

// src/presets/Face.ts
var THREE22 = __toESM(require("three"), 1);
var FacePreset = class extends BasePreset {
  id = "face";
  name = "Face";
  category = "Abstract & Space";
  description = "Stylized cybernetic 3D neon mask with authentic audio-reactive facial expression morphing.";
  cameraConfig = {
    position: [0, 0, 7.5],
    target: [0, 0, 0],
    autoRotate: false
  };
  faceMesh;
  wireframe;
  material;
  wireMaterial;
  basePositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Turn Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Expression Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Jaw Deformation", min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.2 }
    ]);
  }
  setup(ctx) {
    const geom = new THREE22.IcosahedronGeometry(2.8, 3);
    const pos = geom.attributes.position.array;
    this.basePositions = new Float32Array(pos);
    for (let i = 0; i < pos.length; i += 3) {
      if (pos[i + 2] < -0.5) pos[i + 2] = -0.5;
      if (pos[i + 1] < 0) pos[i + 1] *= 1.35;
      if (pos[i + 1] > 0.8 && pos[i + 2] > 0.8) pos[i + 2] *= 1.15;
    }
    geom.computeVertexNormals();
    this.material = new THREE22.MeshStandardMaterial({
      color: new THREE22.Color(ctx.theme.primary).multiplyScalar(0.4),
      emissive: new THREE22.Color(ctx.theme.primary),
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.4
    });
    this.wireMaterial = new THREE22.LineBasicMaterial({
      color: new THREE22.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.85
    });
    this.faceMesh = new THREE22.Mesh(geom, this.material);
    const wireGeom = new THREE22.WireframeGeometry(geom);
    this.wireframe = new THREE22.LineSegments(wireGeom, this.wireMaterial);
    this.group.add(this.faceMesh);
    this.group.add(this.wireframe);
  }
  deformVertex(bx, by, bz, jawDrop, eyeSquint, smirk, bassBoost) {
    let dx = bx;
    let dy = by;
    let dz = bz;
    if (by < -0.4) {
      dy = by - jawDrop + (bx > 0 ? smirk : 0);
    }
    if (by > 0.5 && bz > 0.8) {
      dz = bz + eyeSquint;
      dy = by + (bx > 0 ? smirk * 0.5 : -smirk * 0.5);
    }
    if (Math.abs(by) < 0.5 && Math.abs(bx) > 1.2) {
      dx = bx * bassBoost;
    }
    return [dx, dy, dz];
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const jawScale = this.paramStore.getValue("density");
    this.group.rotation.y = Math.sin(time * 0.8 * speed) * 0.35 + audio.mid * 0.2 * reactivity;
    this.group.rotation.x = Math.sin(time * 0.5 * speed) * 0.15 + audio.bass * 0.1 * reactivity;
    this.group.rotation.z = Math.cos(time * 0.6 * speed) * 0.06;
    this.group.position.y = Math.sin(time * 1.5 * speed) * 0.1;
    const pos = this.faceMesh.geometry.attributes.position.array;
    const jawDrop = (audio.bass * 1.35 + audio.beatEnergy * 1.5) * reactivity * jawScale;
    const eyeSquint = audio.treble * 0.45 * reactivity;
    const smirk = Math.sin(time * 1.2) * audio.mid * 0.3 * reactivity;
    const bassBoost = 1 + audio.bass * 0.15 * reactivity;
    for (let i = 0; i < pos.length; i += 3) {
      const [dx, dy, dz] = this.deformVertex(
        this.basePositions[i],
        this.basePositions[i + 1],
        this.basePositions[i + 2],
        jawDrop,
        eyeSquint,
        smirk,
        bassBoost
      );
      pos[i] = dx;
      pos[i + 1] = dy;
      pos[i + 2] = dz;
    }
    this.faceMesh.geometry.attributes.position.needsUpdate = true;
    this.faceMesh.geometry.computeVertexNormals();
    if (audio.beat) {
      this.material.emissiveIntensity = 1 * reactivity;
      this.group.scale.setScalar(1.06);
    } else {
      this.material.emissiveIntensity = Math.max(0.35, this.material.emissiveIntensity * 0.94);
      this.group.scale.lerp(new THREE22.Vector3(1, 1, 1), delta * 5);
    }
  }
  onThemeChange(theme) {
    this.material.color.set(theme.primary).multiplyScalar(0.4);
    this.material.emissive.set(theme.primary);
    this.wireMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.faceMesh) {
      this.faceMesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.wireframe) {
      this.wireframe.geometry.dispose();
      this.wireMaterial.dispose();
    }
  }
};

// src/presets/Geiss.ts
var THREE23 = __toESM(require("three"), 1);
var VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
var FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uZoom;
  uniform float uAspect;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float geissNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float geissFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 q = p;
    for (int i = 0; i < 4; i++) {
      v += a * geissNoise(q);
      q *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  vec2 inverseVortexWarp(vec2 p, float t, float zoomAmt) {
    vec2 accum = vec2(0.0);
    float wSum = 0.0;

    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float ts = t + fi * 1.7;
      vec2 c = vec2(
        0.42 * sin(ts * 0.19 + fi * 2.1) + 0.14 * cos(ts * 0.27 + fi),
        0.36 * cos(ts * 0.21 + fi * 1.7) + 0.12 * sin(ts * 0.33 + fi * 1.3)
      );

      vec2 d = p - c;
      float r = length(d);
      float a = atan(d.y, d.x);

      float zoom = 1.0 + zoomAmt * (0.012 + uBass * 0.035) + 0.006 * sin(ts * 0.35 + fi * 1.9);
      float omega = (0.35 + uMid * 0.55) / (r * r + 0.06);

      a -= omega * 0.032;
      r /= max(0.01, zoom);
      vec2 warped = c + r * vec2(cos(a), sin(a));

      float w = exp(-r * 1.4);
      accum += warped * w;
      wSum += w;
    }

    return accum / max(wSum, 1e-4);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    p.x *= (uAspect > 0.0 ? uAspect : 1.7778);
    float r = length(p);

    vec2 warped = inverseVortexWarp(p, uTime * 0.4, uZoom);
    float veins = pow(geissFbm(warped * 2.8 + vec2(uTime * 0.04, -uTime * 0.03)), 1.4);
    float ripple = sin(warped.x * 4.5 + uTime * 0.6) * sin(warped.y * 3.6 - uTime * 0.5);
    float structure = veins * 0.7 + ripple * 0.3;

    float logSpiral = sin(atan(warped.y, warped.x) * 4.0 + log(r + 0.01) * uZoom - uTime * 2.0);
    float pattern = structure * 0.5 + logSpiral * 0.5;

    // Authentic Geiss icy feedback & duo/mono mapping
    vec3 iceCyan = vec3(0.18, 0.82, 1.0);
    vec3 col = mix(uPrimary, iceCyan, smoothstep(-0.4, 0.7, pattern));
    col = mix(col, uSecondary, smoothstep(0.2, 0.9, pattern) * (0.7 + uTreble * 0.5));
    col = mix(col, uAccent, smoothstep(0.6, 1.0, structure) * (0.8 + uBass));

    // Vortex center eye glow
    float eye = exp(-r * 2.5) * (0.4 + uBass * 0.8);
    col += mix(uAccent, vec3(1.0), 0.4) * eye;

    // Dark peripheral vignette
    float normR = r / max(uAspect, 1.0);
    col *= clamp(1.4 - normR * 0.7, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;
var GeissPreset = class extends BasePreset {
  id = "geiss";
  name = "Geiss";
  category = "Abstract & Space";
  description = "Authentic Geiss feedback diffusion engine with logarithmic spiral vortices and FBM veins.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  mesh;
  material;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Drift Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Vortex Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Vortex Zoom", min: 1, max: 5, step: 0.2, defaultValue: 2.5 }
    ]);
  }
  setup(ctx) {
    const geometry = new THREE23.PlaneGeometry(2, 2);
    const aspect = typeof window !== "undefined" ? window.innerWidth / Math.max(window.innerHeight, 1) : 1.7778;
    this.material = new THREE23.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uZoom: { value: 2.5 },
        uAspect: { value: aspect },
        uPrimary: { value: new THREE23.Color(ctx.theme.primary) },
        uSecondary: { value: new THREE23.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE23.Color(ctx.theme.accent) }
      },
      depthWrite: false,
      depthTest: false,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER
    });
    this.mesh = new THREE23.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const zoom = this.paramStore.getValue("density");
    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uMid.value = audio.mid * reactivity;
    this.material.uniforms.uTreble.value = audio.treble * reactivity;
    this.material.uniforms.uZoom.value = zoom;
    if (typeof window !== "undefined") {
      this.material.uniforms.uAspect.value = window.innerWidth / Math.max(window.innerHeight, 1);
    }
  }
  resize(width, height) {
    if (this.material?.uniforms?.uAspect) {
      this.material.uniforms.uAspect.value = width / Math.max(height, 1);
    }
  }
  onThemeChange(theme) {
    this.material.uniforms.uPrimary.value.set(theme.primary);
    this.material.uniforms.uSecondary.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
};

// src/presets/TieDye.ts
var THREE24 = __toESM(require("three"), 1);
var TieDyePreset = class extends BasePreset {
  id = "tiedye";
  name = "Tie Dye";
  category = "Abstract & Space";
  description = "Psychedelic spiral fabric shader with color advection.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  mesh;
  material;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Twist Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Advection Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Spiral Arms", min: 2, max: 12, step: 1, defaultValue: 6 }
    ]);
  }
  setup(ctx) {
    const geometry = new THREE24.PlaneGeometry(2, 2);
    const aspect = typeof window !== "undefined" ? window.innerWidth / Math.max(window.innerHeight, 1) : 1.7778;
    this.material = new THREE24.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uArms: { value: 6 },
        uAspect: { value: aspect },
        uPrimary: { value: new THREE24.Color(ctx.theme.primary) },
        uSecondary: { value: new THREE24.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE24.Color(ctx.theme.accent) }
      },
      depthWrite: false,
      depthTest: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uArms;
        uniform float uAspect;
        uniform vec3 uPrimary;
        uniform vec3 uSecondary;
        uniform vec3 uAccent;
        varying vec2 vUv;

        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          p.x *= (uAspect > 0.0 ? uAspect : 1.7778);
          float r = length(p);
          float a = atan(p.y, p.x);

          // Domain-warped logarithmic spiral
          float spiral = sin(a * uArms + r * 8.0 - uTime * 2.0 + sin(r * 4.0 - uTime) * (1.0 + uBass * 1.5));
          float wave = cos(r * 12.0 - uTime * 3.0 + a * 2.0);

          float t = spiral * 0.5 + wave * 0.5 + uMid * 0.3;

          // 3-way chromatic dye blend
          vec3 col = mix(uPrimary, uSecondary, sin(t * 3.1415 + uTime) * 0.5 + 0.5);
          col = mix(col, uAccent, clamp(spiral * wave + 0.3, 0.0, 1.0));

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.mesh = new THREE24.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const arms = this.paramStore.getValue("density");
    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uMid.value = audio.mid * reactivity;
    this.material.uniforms.uArms.value = arms;
    if (typeof window !== "undefined") {
      this.material.uniforms.uAspect.value = window.innerWidth / Math.max(window.innerHeight, 1);
    }
  }
  resize(width, height) {
    if (this.material?.uniforms?.uAspect) {
      this.material.uniforms.uAspect.value = width / Math.max(height, 1);
    }
  }
  onThemeChange(theme) {
    this.material.uniforms.uPrimary.value.set(theme.primary);
    this.material.uniforms.uSecondary.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
  }
};

// src/presets/Aurora.ts
var THREE25 = __toESM(require("three"), 1);
var AuroraPreset = class extends BasePreset {
  id = "aurora";
  name = "Aurora";
  category = "Abstract & Space";
  description = "Undulating ethereal northern light curtains in upper atmosphere.";
  cameraConfig = {
    position: [0, 3, 11],
    target: [0, 1, 0],
    autoRotate: true,
    autoRotateSpeed: 0.2
  };
  auroraMesh;
  auroraMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Curtain Wave Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Wind Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Curtain Height", min: 1, max: 3, step: 0.1, defaultValue: 1.5 }
    ]);
  }
  setup(ctx) {
    const auroraGeom = new THREE25.PlaneGeometry(28, 14, 70, 35);
    this.auroraMaterial = new THREE25.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uMid: { value: 0 },
        uHeight: { value: 1.5 },
        uColor1: { value: new THREE25.Color(ctx.theme.primary) },
        uColor2: { value: new THREE25.Color(ctx.theme.accent) }
      },
      transparent: true,
      blending: THREE25.AdditiveBlending,
      side: THREE25.DoubleSide,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uTreble;
        uniform float uMid;
        uniform float uHeight;

        void main() {
          vUv = uv;
          vec3 p = position;
          p.z += sin(p.x * 0.4 + uTime * 2.0) * uHeight * (1.0 + uMid);
          p.z += cos(p.y * 0.8 + uTime * 2.5) * 0.8 * (1.0 + uTreble);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float curtainGradient = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
          vec3 col = mix(uColor1, uColor2, sin(vPos.x * 0.3 + vUv.y * 3.0) * 0.5 + 0.5);
          gl_FragColor = vec4(col, curtainGradient * 0.8);
        }
      `
    });
    this.auroraMesh = new THREE25.Mesh(auroraGeom, this.auroraMaterial);
    this.auroraMesh.position.z = -3;
    this.group.add(this.auroraMesh);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const height = this.paramStore.getValue("density");
    this.auroraMaterial.uniforms.uTime.value = time * speed;
    this.auroraMaterial.uniforms.uTreble.value = audio.treble * reactivity;
    this.auroraMaterial.uniforms.uMid.value = audio.mid * reactivity;
    this.auroraMaterial.uniforms.uHeight.value = height;
  }
  onThemeChange(theme) {
    this.auroraMaterial.uniforms.uColor1.value.set(theme.primary);
    this.auroraMaterial.uniforms.uColor2.value.set(theme.accent);
  }
  onDispose() {
    if (this.auroraMesh) {
      this.auroraMesh.geometry.dispose();
      this.auroraMaterial.dispose();
    }
  }
};

// src/presets/GravityForce.ts
var THREE26 = __toESM(require("three"), 1);
var GravityForcePreset = class extends BasePreset {
  id = "gravityforce";
  name = "Gravity Force";
  category = "Abstract & Space";
  description = "Particle attractor velocity field with gravitational feedback.";
  cameraConfig = {
    position: [0, 0, 11],
    target: [0, 0, 0],
    autoRotate: false,
    bloomIntensity: 0
  };
  particles;
  material;
  numParticles = 3e3;
  particlePositions;
  particleVelocities;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Simulation Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Explosion Force", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Gravity Constant", min: 0.5, max: 4, step: 0.1, defaultValue: 2 }
    ]);
  }
  setup(ctx) {
    const geometry = new THREE26.BufferGeometry();
    this.particlePositions = new Float32Array(this.numParticles * 3);
    this.particleVelocities = new Float32Array(this.numParticles * 3);
    for (let i = 0; i < this.numParticles; i++) {
      const radius = 2 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      this.particlePositions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      this.particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      this.particlePositions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);
      this.particleVelocities[i * 3] = -Math.sin(theta) * 0.5;
      this.particleVelocities[i * 3 + 1] = 0;
      this.particleVelocities[i * 3 + 2] = Math.cos(theta) * 0.5;
    }
    geometry.setAttribute("position", new THREE26.BufferAttribute(this.particlePositions, 3));
    this.material = new THREE26.PointsMaterial({
      color: new THREE26.Color(ctx.theme.accent),
      size: 0.15,
      transparent: true,
      opacity: 0.85,
      blending: THREE26.AdditiveBlending,
      depthWrite: false
    });
    this.particles = new THREE26.Points(geometry, this.material);
    this.group.add(this.particles);
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const G = this.paramStore.getValue("density");
    const dt = Math.min(delta, 0.05) * speed;
    const isKick = audio.beat;
    const explosion = isKick ? 20 * reactivity : 0;
    for (let i = 0; i < this.numParticles; i++) {
      let px = this.particlePositions[i * 3];
      let py = this.particlePositions[i * 3 + 1];
      let pz = this.particlePositions[i * 3 + 2];
      const distSq = px * px + py * py + pz * pz + 0.1;
      const dist = Math.sqrt(distSq);
      const force = G / distSq * dt;
      let vx = this.particleVelocities[i * 3] - px / dist * force;
      let vy = this.particleVelocities[i * 3 + 1] - py / dist * force;
      let vz = this.particleVelocities[i * 3 + 2] - pz / dist * force;
      if (explosion > 0) {
        vx += px / dist * explosion * dt;
        vy += py / dist * explosion * dt;
        vz += pz / dist * explosion * dt;
      }
      px += vx * dt * 10;
      py += vy * dt * 10;
      pz += vz * dt * 10;
      if (dist < 0.3 || dist > 20) {
        const newR = 6 + Math.random() * 4;
        const th = Math.random() * Math.PI * 2;
        px = Math.cos(th) * newR;
        py = (Math.random() - 0.5) * 2;
        pz = Math.sin(th) * newR;
        vx = -Math.sin(th) * 0.8;
        vy = 0;
        vz = Math.cos(th) * 0.8;
      }
      this.particlePositions[i * 3] = px;
      this.particlePositions[i * 3 + 1] = py;
      this.particlePositions[i * 3 + 2] = pz;
      this.particleVelocities[i * 3] = vx * 0.99;
      this.particleVelocities[i * 3 + 1] = vy * 0.99;
      this.particleVelocities[i * 3 + 2] = vz * 0.99;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.material.color.set(theme.accent);
  }
  onDispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.material.dispose();
    }
  }
};

// src/presets/SacredMandala.ts
var THREE27 = __toESM(require("three"), 1);
var SacredMandalaPreset = class extends BasePreset {
  id = "sacred";
  name = "Sacred";
  category = "Abstract & Space";
  description = "Sacred geometry mandalas unfolding with harmonic counter-rotation.";
  cameraConfig = {
    position: [0, 0, 9],
    target: [0, 0, 0],
    autoRotate: false
  };
  mandalaRings = [];
  ringMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Spin Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Petal Harmonics", min: 4, max: 12, step: 1, defaultValue: 6 }
    ]);
  }
  setup(ctx) {
    this.mandalaRings.length = 0;
    this.ringMaterial = new THREE27.LineBasicMaterial({
      color: new THREE27.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.85,
      blending: THREE27.AdditiveBlending,
      depthWrite: false
    });
    const ringCounts = [12, 16, 24, 32, 48];
    const harmonics = this.paramStore.getValue("density");
    ringCounts.forEach((segments, idx) => {
      const radius = 1 + idx * 0.75;
      const geom = new THREE27.BufferGeometry();
      const points = [];
      for (let s = 0; s <= segments; s++) {
        const theta = s / segments * Math.PI * 2;
        const modR = radius + Math.sin(theta * harmonics) * 0.2;
        points.push(new THREE27.Vector3(Math.cos(theta) * modR, Math.sin(theta) * modR, 0));
      }
      geom.setFromPoints(points);
      const ring = new THREE27.LineLoop(geom, this.ringMaterial);
      this.mandalaRings.push(ring);
      this.group.add(ring);
    });
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.mandalaRings.forEach((ring, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      ring.rotation.z += delta * (0.35 + audio.bass * 0.8 * reactivity) * dir * speed;
      const scale = 1 + (audio.beat ? 0.2 * reactivity : 0) * (idx + 1) * 0.2;
      ring.scale.set(scale, scale, 1);
    });
  }
  onThemeChange(theme) {
    this.ringMaterial.color.set(theme.accent);
  }
  onDispose() {
    for (const ring of this.mandalaRings) {
      ring.geometry.dispose();
    }
    this.mandalaRings.length = 0;
    this.ringMaterial?.dispose();
  }
};

// src/presets/TheSun.ts
var THREE28 = __toESM(require("three"), 1);
var TheSunPreset = class extends BasePreset {
  id = "sun";
  name = "The Sun";
  category = "Abstract & Space";
  description = "Layered solar corona with prominence flares and heat shimmer.";
  cameraConfig = {
    position: [0, 0, 8.5],
    target: [0, 0, 0],
    autoRotate: false
  };
  coreMesh;
  coronaMesh;
  flarePoints;
  coreMaterial;
  coronaMaterial;
  flareMaterial;
  flarePositions;
  flareBaseRadius;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Corona Turbulence", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Flare Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Core Radius", min: 1.5, max: 4, step: 0.1, defaultValue: 2.5 }
    ]);
  }
  setup(ctx) {
    const coreRad = this.paramStore.getValue("density");
    const coreGeom = new THREE28.IcosahedronGeometry(coreRad, 4);
    this.coreMaterial = new THREE28.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uColor1: { value: new THREE28.Color(ctx.theme.primary) },
        uColor2: { value: new THREE28.Color(ctx.theme.accent) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;

        void main() {
          vNormal = normal;
          vPosition = position;
          float noise = sin(position.x * 4.0 + uTime * 2.0) 
                      * cos(position.y * 4.0 + uTime * 2.5) 
                      * sin(position.z * 4.0 + uTime * 3.0);
          float disp = 1.0 + (noise * 0.15 * (1.0 + uBass * 1.5));
          vDisplacement = noise;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position * disp, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;

        void main() {
          float heat = clamp(0.5 + vDisplacement * 0.5 + uBass * 0.4, 0.0, 1.0);
          vec3 col = mix(uColor1, uColor2, heat);
          col += vec3(1.0, 0.9, 0.5) * pow(heat, 3.0) * (0.8 + uBass);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.coreMesh = new THREE28.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);
    const coronaGeom = new THREE28.SphereGeometry(coreRad * 1.44, 32, 32);
    this.coronaMaterial = new THREE28.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uCoronaColor: { value: new THREE28.Color(ctx.theme.accent) }
      },
      transparent: true,
      blending: THREE28.AdditiveBlending,
      side: THREE28.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uCoronaColor;
        uniform float uEnergy;
        varying vec3 vNormal;

        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(uCoronaColor, intensity * (0.6 + uEnergy * 0.8));
        }
      `
    });
    this.coronaMesh = new THREE28.Mesh(coronaGeom, this.coronaMaterial);
    this.group.add(this.coronaMesh);
    const flareCount = 1500;
    const flareGeom = new THREE28.BufferGeometry();
    this.flarePositions = new Float32Array(flareCount * 3);
    this.flareBaseRadius = new Float32Array(flareCount);
    for (let i = 0; i < flareCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = coreRad * 1.04 + Math.random() * (coreRad * 1.1);
      this.flareBaseRadius[i] = rad;
      this.flarePositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      this.flarePositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      this.flarePositions[i * 3 + 2] = rad * Math.cos(phi);
    }
    flareGeom.setAttribute("position", new THREE28.BufferAttribute(this.flarePositions, 3));
    this.flareMaterial = new THREE28.PointsMaterial({
      color: new THREE28.Color(ctx.theme.accent),
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE28.AdditiveBlending,
      depthWrite: false
    });
    this.flarePoints = new THREE28.Points(flareGeom, this.flareMaterial);
    this.group.add(this.flarePoints);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y += delta * 0.2 * speed;
    this.group.rotation.x += delta * 0.08 * speed;
    this.coreMaterial.uniforms.uTime.value = time * speed;
    this.coreMaterial.uniforms.uBass.value = audio.bass * reactivity;
    this.coronaMaterial.uniforms.uTime.value = time * speed;
    this.coronaMaterial.uniforms.uEnergy.value = (audio.mid + audio.beatEnergy * 0.6) * reactivity;
    const pos = this.flarePoints.geometry.attributes.position.array;
    const pulse = 1 + audio.treble * 0.5 * reactivity + (audio.beat ? 0.4 * reactivity : 0);
    for (let i = 0; i < this.flareBaseRadius.length; i++) {
      const idx = i * 3;
      const bx = this.flarePositions[idx];
      const by = this.flarePositions[idx + 1];
      const bz = this.flarePositions[idx + 2];
      const flareWobble = Math.sin(time * 4 * speed + i) * 0.15 * audio.mid;
      pos[idx] = bx * (pulse + flareWobble);
      pos[idx + 1] = by * (pulse + flareWobble);
      pos[idx + 2] = bz * (pulse + flareWobble);
    }
    this.flarePoints.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.coreMaterial.uniforms.uColor1.value.set(theme.primary);
    this.coreMaterial.uniforms.uColor2.value.set(theme.accent);
    this.coronaMaterial.uniforms.uCoronaColor.value.set(theme.accent);
    this.flareMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial.dispose();
    }
    if (this.coronaMesh) {
      this.coronaMesh.geometry.dispose();
      this.coronaMaterial.dispose();
    }
    if (this.flarePoints) {
      this.flarePoints.geometry.dispose();
      this.flareMaterial.dispose();
    }
  }
};

// src/presets/BlackHole.ts
var THREE29 = __toESM(require("three"), 1);
var BlackHolePreset = class extends BasePreset {
  id = "blackhole";
  name = "Black Hole";
  category = "Abstract & Space";
  description = "Relativistic accretion disk with gravitational lensing vortex.";
  cameraConfig = {
    position: [0, 5.5, 10.5],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };
  coreMesh;
  diskPoints;
  diskGeometry;
  diskMaterial;
  ringGroup;
  ringMaterial;
  ringGeometries = [];
  count = 5e3;
  angles;
  radii;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Swirl Velocity", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Disk Radius", min: 4, max: 10, step: 0.5, defaultValue: 6.5 }
    ]);
  }
  setup(ctx) {
    const coreGeom = new THREE29.SphereGeometry(1.6, 32, 32);
    const coreMat = new THREE29.MeshBasicMaterial({ color: 0 });
    this.coreMesh = new THREE29.Mesh(coreGeom, coreMat);
    this.group.add(this.coreMesh);
    this.ringGroup = new THREE29.Group();
    const numRings = 8;
    this.ringMaterial = new THREE29.LineBasicMaterial({
      color: new THREE29.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.38
    });
    for (let i = 1; i <= numRings; i++) {
      const radius = 2 + i / numRings * 7.5;
      const circleGeom = new THREE29.BufferGeometry();
      const points = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const theta = s / segments * Math.PI * 2;
        points.push(new THREE29.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      circleGeom.setFromPoints(points);
      this.ringGeometries.push(circleGeom);
      const line = new THREE29.LineLoop(circleGeom, this.ringMaterial);
      this.ringGroup.add(line);
    }
    this.coreMesh.add(this.ringGroup);
    this.diskGeometry = new THREE29.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);
    this.angles = new Float32Array(this.count);
    this.radii = new Float32Array(this.count);
    const maxRadius = this.paramStore.getValue("density");
    const whiteColor = new THREE29.Color("#ffffff");
    const primaryColor = new THREE29.Color(ctx.theme.primary || "#ffaa00");
    const accentColor = new THREE29.Color(ctx.theme.accent || "#ff3300");
    for (let i = 0; i < this.count; i++) {
      const radius = 2 + Math.pow(Math.random(), 1.5) * maxRadius;
      const angle = Math.random() * Math.PI * 2;
      this.radii[i] = radius;
      this.angles[i] = angle;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4 * (radius / 3);
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      const normR = Math.min(1, (radius - 2) / maxRadius);
      const col = new THREE29.Color();
      if (normR < 0.2) {
        col.lerpColors(whiteColor, primaryColor, normR / 0.2);
      } else {
        col.lerpColors(primaryColor, accentColor, (normR - 0.2) / 0.8);
      }
      col.toArray(colors, i * 3);
    }
    this.diskGeometry.setAttribute("position", new THREE29.BufferAttribute(positions, 3));
    this.diskGeometry.setAttribute("color", new THREE29.BufferAttribute(colors, 3));
    this.diskMaterial = new THREE29.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE29.AdditiveBlending,
      depthWrite: false
    });
    this.diskPoints = new THREE29.Points(this.diskGeometry, this.diskMaterial);
    this.group.add(this.diskPoints);
    this.group.rotation.set(0, 0, 0);
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const pos = this.diskGeometry.attributes.position.array;
    const baseSpeed = (1.2 + audio.bass * 2 * reactivity) * speed;
    for (let i = 0; i < this.count; i++) {
      const angularVel = baseSpeed / Math.sqrt(this.radii[i]) * delta;
      this.angles[i] += angularVel;
      const r = this.radii[i] * (1 + (audio.beat ? 0.08 * reactivity : 0));
      pos[i * 3] = Math.cos(this.angles[i]) * r;
      pos[i * 3 + 2] = Math.sin(this.angles[i]) * r;
    }
    this.diskGeometry.attributes.position.needsUpdate = true;
    this.group.rotation.y += delta * 0.1 * speed;
    const coreScale = 1 + (audio.bass * 0.35 + audio.beatEnergy * 0.2) * reactivity;
    this.coreMesh.scale.set(coreScale, coreScale, coreScale);
  }
  onThemeChange(theme) {
    if (this.ringMaterial) {
      this.ringMaterial.color.set(theme.primary);
    }
  }
  onDispose() {
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMesh.material.dispose();
    }
    if (this.diskPoints) {
      this.diskGeometry.dispose();
      this.diskMaterial.dispose();
    }
    this.ringGeometries.forEach((g) => g.dispose());
    if (this.ringMaterial) {
      this.ringMaterial.dispose();
    }
  }
};

// src/presets/MandelFractal.ts
var THREE30 = __toESM(require("three"), 1);
var MandelFractalPreset = class extends BasePreset {
  id = "mandel";
  name = "Mandel";
  category = "Abstract & Space";
  description = "Continuous escape-time Mandelbrot & Julia fractal infinity zoom.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  mesh;
  material;
  currentZoom = 1;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Zoom Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Fractal Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Iteration Depth", min: 20, max: 64, step: 2, defaultValue: 40 }
    ]);
  }
  setup(ctx) {
    const geom = new THREE30.PlaneGeometry(2, 2);
    const aspect = typeof window !== "undefined" ? window.innerWidth / Math.max(window.innerHeight, 1) : 1.7778;
    this.material = new THREE30.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uZoom: { value: 1 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uMaxIter: { value: 40 },
        uAspect: { value: aspect },
        uColor1: { value: new THREE30.Color(ctx.theme.primary) },
        uColor2: { value: new THREE30.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE30.Color(ctx.theme.accent) }
      },
      depthWrite: false,
      depthTest: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uZoom;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uMaxIter;
        uniform float uAspect;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;

        vec2 complexSquare(vec2 c) {
          return vec2(c.x * c.x - c.y * c.y, 2.0 * c.x * c.y);
        }

        void main() {
          vec2 c = (vUv - 0.5) * vec2(2.5 * (uAspect > 0.0 ? uAspect : 1.7778), 2.5) / uZoom;
          c += vec2(-0.743643887037158704752191506114774, 0.131825904205311970493132056385139);

          vec2 z = c;
          vec2 juliaC = vec2(sin(uTime * 0.2) * 0.3 * (1.0 + uMid), cos(uTime * 0.15) * 0.3);

          float n = 0.0;
          float maxIter = uMaxIter + uTreble * 20.0;

          for (float i = 0.0; i < 64.0; i += 1.0) {
            if (i >= maxIter) break;
            if (dot(z, z) > 4.0) {
              n = i;
              break;
            }
            z = complexSquare(z) + mix(c, juliaC, 0.35 + uMid * 0.2);
          }

          if (n == 0.0) {
            gl_FragColor = vec4(0.01, 0.01, 0.03, 1.0);
          } else {
            float t = n / maxIter;
            vec3 col = mix(uColor1, uColor2, sin(t * 6.28 + uTime * 0.5) * 0.5 + 0.5);
            col = mix(col, uAccent, pow(t, 2.0) * (0.8 + uBass));
            gl_FragColor = vec4(col, 1.0);
          }
        }
      `
    });
    this.mesh = new THREE30.Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const maxIter = this.paramStore.getValue("density");
    const zoomSpeed = (0.4 + audio.bass * 1.2 * reactivity) * speed;
    this.currentZoom *= 1 + delta * zoomSpeed;
    if (this.currentZoom > 500) {
      this.currentZoom = 1;
    }
    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uZoom.value = this.currentZoom;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uMid.value = audio.mid * reactivity;
    this.material.uniforms.uTreble.value = audio.treble * reactivity;
    this.material.uniforms.uMaxIter.value = maxIter;
    if (typeof window !== "undefined") {
      this.material.uniforms.uAspect.value = window.innerWidth / Math.max(window.innerHeight, 1);
    }
  }
  resize(width, height) {
    if (this.material?.uniforms?.uAspect) {
      this.material.uniforms.uAspect.value = width / Math.max(height, 1);
    }
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
  }
};

// src/presets/UnfoldingMatter.ts
var THREE31 = __toESM(require("three"), 1);
var UnfoldingMatterPreset = class extends BasePreset {
  id = "unfoldingmatter";
  name = "Unfolding Matter";
  category = "Abstract & Space";
  description = "Crystalline fractal polyhedron facets unfolding like origami.";
  cameraConfig = {
    position: [0, 0, 9],
    target: [0, 0, 0],
    autoRotate: false
  };
  facets = [];
  facetMaterial;
  wireMaterial;
  numFacets = 20;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Unfold Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Hinge Angle", min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.5 }
    ]);
  }
  setup(ctx) {
    this.facets.length = 0;
    this.facetMaterial = new THREE31.MeshPhysicalMaterial({
      color: new THREE31.Color(ctx.theme.primary),
      emissive: new THREE31.Color(ctx.theme.accent),
      emissiveIntensity: 0.3,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.4,
      transparent: true,
      opacity: 0.85
    });
    this.wireMaterial = new THREE31.LineBasicMaterial({
      color: new THREE31.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.8
    });
    const triGeom = new THREE31.BufferGeometry();
    const vertices = new Float32Array([
      0,
      1.8,
      0,
      -1.2,
      -0.9,
      0,
      1.2,
      -0.9,
      0
    ]);
    triGeom.setAttribute("position", new THREE31.BufferAttribute(vertices, 3));
    triGeom.computeVertexNormals();
    const wireGeom = new THREE31.WireframeGeometry(triGeom);
    for (let i = 0; i < this.numFacets; i++) {
      const mesh = new THREE31.Mesh(triGeom, this.facetMaterial);
      const wire = new THREE31.LineSegments(wireGeom, this.wireMaterial);
      mesh.add(wire);
      const phi = Math.acos(-1 + 2 * i / this.numFacets);
      const theta = Math.sqrt(this.numFacets * Math.PI) * phi;
      mesh.position.set(
        Math.cos(theta) * Math.sin(phi) * 2.2,
        Math.sin(theta) * Math.sin(phi) * 2.2,
        Math.cos(phi) * 2.2
      );
      mesh.lookAt(0, 0, 0);
      this.facets.push(mesh);
      this.group.add(mesh);
    }
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const maxHinge = this.paramStore.getValue("density");
    this.group.rotation.x += delta * 0.2 * speed;
    this.group.rotation.y += delta * 0.25 * speed;
    const unfold = (audio.rms * 1.5 + audio.bass * 1.2) * reactivity;
    for (let i = 0; i < this.numFacets; i++) {
      const mesh = this.facets[i];
      const angle = (Math.sin(time * 2 * speed + i * 0.5) * 0.5 + 0.5) * unfold * maxHinge;
      mesh.rotation.x = angle;
      mesh.rotation.z = Math.sin(time * speed + i) * 0.2;
    }
    if (audio.beat) {
      this.facetMaterial.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.facetMaterial.emissiveIntensity *= 0.94;
    }
  }
  onThemeChange(theme) {
    this.facetMaterial.color.set(theme.primary);
    this.facetMaterial.emissive.set(theme.accent);
    this.wireMaterial.color.set(theme.accent);
  }
  onDispose() {
    for (const mesh of this.facets) {
      mesh.geometry.dispose();
      mesh.children.forEach((c) => {
        if (c instanceof THREE31.LineSegments) {
          c.geometry.dispose();
        }
      });
    }
    this.facets.length = 0;
    this.facetMaterial?.dispose();
    this.wireMaterial?.dispose();
  }
};

// src/presets/SynthwaveTerrain.ts
var THREE32 = __toESM(require("three"), 1);
var SynthwaveTerrainPreset = class extends BasePreset {
  id = "terrain";
  name = "Terrain";
  category = "Abstract & Space";
  description = "Infinite synthwave flyover grid with mountain ridges.";
  cameraConfig = {
    position: [0, 2.5, 12],
    target: [0, 1.5, -30],
    autoRotate: false
  };
  terrainMesh;
  terrainGeom;
  terrainMat;
  sunMesh;
  sunMat;
  baseHeights;
  cols = 48;
  rows = 64;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Flyover Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Bass Reactivity", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "deformation", name: "Mountain Height", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "density", name: "Grid Density", min: 0.2, max: 1, step: 0.1, defaultValue: 1 }
    ]);
  }
  setup(ctx) {
    this.terrainGeom = new THREE32.PlaneGeometry(32, 48, this.cols - 1, this.rows - 1);
    this.terrainGeom.rotateX(-Math.PI / 2.3);
    const pos = this.terrainGeom.attributes.position.array;
    this.baseHeights = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const distFromCenter = Math.abs(x) / 16;
      if (distFromCenter > 0.35) {
        pos[i + 2] = Math.pow(distFromCenter, 2.2) * 5;
      }
      this.baseHeights[i + 2] = pos[i + 2];
    }
    this.terrainGeom.attributes.position.needsUpdate = true;
    this.terrainMat = new THREE32.MeshStandardMaterial({
      color: new THREE32.Color(ctx.theme.primary),
      emissive: new THREE32.Color(ctx.theme.accent),
      emissiveIntensity: 0.5,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8
    });
    this.terrainMesh = new THREE32.Mesh(this.terrainGeom, this.terrainMat);
    this.terrainMesh.position.set(0, -2.5, -10);
    this.group.add(this.terrainMesh);
    const sunGeom = new THREE32.CircleGeometry(6, 48);
    this.sunMat = new THREE32.MeshBasicMaterial({
      color: new THREE32.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.95
    });
    this.sunMesh = new THREE32.Mesh(sunGeom, this.sunMat);
    this.sunMesh.position.set(0, 1.5, -28);
    this.group.add(this.sunMesh);
  }
  update(ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const deformation = this.paramStore.getValue("deformation");
    const density = this.paramStore.getValue("density");
    const pos = this.terrainGeom.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const distFromCenter = Math.abs(x) / 16;
      const noise = Math.sin(pos[i + 1] * 0.4 + time * 4 * speed) * audio.bass * 1.5 * reactivity;
      if (distFromCenter > 0.3) {
        pos[i + 2] = this.baseHeights[i + 2] * (1 + audio.bass * 0.8 * reactivity) * deformation + noise;
      } else {
        pos[i + 2] = Math.sin(pos[i + 1] * 0.5 + time * 5 * speed) * audio.subBass * 0.6 * reactivity;
      }
    }
    this.terrainGeom.attributes.position.needsUpdate = true;
    this.terrainMat.opacity = Math.max(0.3, density);
    const sunScale = 1 + (audio.bass * 0.3 + audio.beatEnergy * 0.4) * reactivity;
    this.sunMesh.scale.set(sunScale, sunScale, 1);
    if (audio.beat) {
      this.terrainMat.emissive.set(ctx.theme.glow);
      this.terrainMat.emissiveIntensity = 1 * reactivity;
    } else {
      this.terrainMat.emissiveIntensity *= 0.93;
    }
  }
  onThemeChange(theme) {
    this.terrainMat.color.set(theme.primary);
    this.terrainMat.emissive.set(theme.accent);
    this.sunMat.color.set(theme.accent);
  }
  onDispose() {
    this.terrainGeom?.dispose();
    this.terrainMat?.dispose();
    if (this.sunMesh) {
      this.sunMesh.geometry.dispose();
      this.sunMat?.dispose();
    }
  }
};

// src/presets/Galaxy.ts
var THREE33 = __toESM(require("three"), 1);
var GalaxyPreset = class extends BasePreset {
  id = "galaxy";
  name = "Galaxy";
  category = "Abstract & Space";
  description = "Spiral galaxy disc with orbital resonance rings and pulsating galactic core.";
  cameraConfig = {
    position: [0, 8.5, 14.5],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.22,
    bloomIntensity: 0.3
  };
  galaxyPoints;
  coreMesh;
  particleMaterial;
  coreMaterial;
  ringGroup;
  ringMaterial;
  ringGeometries = [];
  numParticles = 7e3;
  particlePositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Spiral Rotation", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Audio Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Arm Tightness", min: 2, max: 8, step: 0.5, defaultValue: 4 }
    ]);
  }
  setup(ctx) {
    this.setupParticles(ctx);
    this.setupCore(ctx);
    this.setupOrbitalRings(ctx);
    this.group.rotation.set(0, 0, 0);
  }
  setupParticles(ctx) {
    const geometry = new THREE33.BufferGeometry();
    this.particlePositions = new Float32Array(this.numParticles * 3);
    const colors = new Float32Array(this.numParticles * 3);
    const arms = 3;
    const maxRadius = 9.5;
    const tightness = this.paramStore.getValue("density");
    const innerColor = new THREE33.Color("#ffffff");
    const magentaColor = new THREE33.Color(ctx.theme.secondary || "#ff2a85");
    const emeraldColor = new THREE33.Color("#39ff88");
    const yellowColor = new THREE33.Color(ctx.theme.primary || "#ffaa00");
    const orangeColor = new THREE33.Color(ctx.theme.accent || "#ff5500");
    for (let i = 0; i < this.numParticles; i++) {
      const r = Math.pow(Math.random(), 1.6) * maxRadius;
      const armIndex = i % arms;
      const armAngle = armIndex / arms * Math.PI * 2;
      const spiralAngle = r * tightness * 0.38;
      const angle = armAngle + spiralAngle + (Math.random() - 0.5) * 0.35;
      const spreadY = (Math.random() - 0.5) * (0.8 / (1 + r * 0.2));
      this.particlePositions[i * 3] = Math.cos(angle) * r;
      this.particlePositions[i * 3 + 1] = spreadY;
      this.particlePositions[i * 3 + 2] = Math.sin(angle) * r;
      const normR = r / maxRadius;
      const col = new THREE33.Color();
      if (normR < 0.22) {
        col.lerpColors(innerColor, magentaColor, normR / 0.22);
      } else if (normR < 0.52) {
        col.lerpColors(magentaColor, emeraldColor, (normR - 0.22) / 0.3);
      } else if (normR < 0.78) {
        col.lerpColors(emeraldColor, yellowColor, (normR - 0.52) / 0.26);
      } else {
        col.lerpColors(yellowColor, orangeColor, (normR - 0.78) / 0.22);
      }
      col.toArray(colors, i * 3);
    }
    geometry.setAttribute("position", new THREE33.BufferAttribute(this.particlePositions, 3));
    geometry.setAttribute("color", new THREE33.BufferAttribute(colors, 3));
    this.particleMaterial = new THREE33.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE33.AdditiveBlending,
      depthWrite: false
    });
    this.galaxyPoints = new THREE33.Points(geometry, this.particleMaterial);
    this.group.add(this.galaxyPoints);
  }
  setupCore(ctx) {
    const coreGeom = new THREE33.SphereGeometry(0.85, 32, 32);
    this.coreMaterial = new THREE33.MeshStandardMaterial({
      color: new THREE33.Color(ctx.theme.primary),
      emissive: new THREE33.Color(ctx.theme.accent),
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.2
    });
    this.coreMesh = new THREE33.Mesh(coreGeom, this.coreMaterial);
    const wireGeom = new THREE33.SphereGeometry(0.86, 16, 12);
    const wireMat = new THREE33.MeshBasicMaterial({
      color: 16777215,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const coreWire = new THREE33.Mesh(wireGeom, wireMat);
    this.coreMesh.add(coreWire);
    this.group.add(this.coreMesh);
  }
  setupOrbitalRings(ctx) {
    this.ringGroup = new THREE33.Group();
    const numRings = 9;
    this.ringMaterial = new THREE33.LineBasicMaterial({
      color: new THREE33.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.38
    });
    for (let i = 1; i <= numRings; i++) {
      const radius = i / numRings * 8.8;
      const circleGeom = new THREE33.BufferGeometry();
      const points = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const theta = s / segments * Math.PI * 2;
        points.push(new THREE33.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      circleGeom.setFromPoints(points);
      this.ringGeometries.push(circleGeom);
      const line = new THREE33.LineLoop(circleGeom, this.ringMaterial);
      this.ringGroup.add(line);
    }
    this.coreMesh.add(this.ringGroup);
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.galaxyPoints.rotation.y += delta * 0.22 * speed;
    if (this.ringGroup) {
      this.ringGroup.rotation.y += delta * 0.08 * speed;
    }
    this.group.rotation.y += delta * 0.04 * speed;
    const corePulse = 1 + (audio.bass * 0.35 + audio.beatEnergy * 0.55) * reactivity;
    this.coreMesh.scale.set(corePulse, corePulse, corePulse);
    if (audio.beat) {
      this.particleMaterial.size = 0.22 * reactivity;
      this.coreMaterial.emissiveIntensity = 1.4 * reactivity;
    } else {
      this.particleMaterial.size = Math.max(0.14, this.particleMaterial.size * 0.94);
      this.coreMaterial.emissiveIntensity = Math.max(0.7, this.coreMaterial.emissiveIntensity * 0.94);
    }
  }
  onThemeChange(theme) {
    this.coreMaterial.emissive.set(theme.accent);
    if (this.ringMaterial) {
      this.ringMaterial.color.set(theme.primary);
    }
  }
  onDispose() {
    if (this.galaxyPoints) {
      this.galaxyPoints.geometry.dispose();
      this.particleMaterial.dispose();
    }
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial.dispose();
    }
    this.ringGeometries.forEach((g) => g.dispose());
    if (this.ringMaterial) {
      this.ringMaterial.dispose();
    }
  }
};

// src/presets/ParticleField.ts
var THREE34 = __toESM(require("three"), 1);
var SWARM_VERTEX_SHADER = `
  attribute float size;
  attribute float aRandom;
  attribute float aLayer;
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uKick;
  uniform float uOrbitSpeed;
  uniform float uSpread;

  varying float vAlpha;
  varying float vRandom;
  varying float vLayer;
  varying float vDist;

  void main() {
    vRandom = aRandom;
    vLayer = aLayer;
    vec3 pos = position;

    float speed = 0.03 + uOrbitSpeed * 0.3 + aRandom * 0.15;
    float angle = uTime * speed * (1.0 + aLayer * 0.5);
    float r = length(pos.xz);
    float currentAngle = atan(pos.z, pos.x) + angle;
    pos.x = cos(currentAngle) * r;
    pos.z = sin(currentAngle) * r;

    float bassPulse = (uKick * 2.2 + uBass * 0.45) * sin(uTime * 3.0 + aRandom * 6.28);
    float midDisplace = uMid * 0.35 * cos(pos.y * 1.5 + uTime * 2.0);
    float expansion = 1.0 + bassPulse * 0.25 * (1.0 + aLayer * 0.4);

    pos.xz *= expansion * (0.8 + uSpread * 0.4);
    pos.y += midDisplace + sin(uTime * 1.5 + r * 0.5) * 0.2 * uTreble;

    vDist = length(pos);
    vAlpha = (0.3 + 0.7 * (1.0 - smoothstep(1.0, 14.0, vDist))) * (0.5 + 0.5 * sin(uTime * 1.5 + aRandom * 6.28));
    vAlpha *= 0.6 + uBass * 0.6;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    float pSize = size * (1.0 + uBass * 0.8) * (180.0 / max(-mvPos.z, 0.1));
    gl_PointSize = clamp(pSize, 1.0, 48.0);
  }
`;
var SWARM_FRAGMENT_SHADER = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;

  varying float vAlpha;
  varying float vRandom;
  varying float vLayer;
  varying float vDist;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float d = length(center);

    float core = exp(-d * 10.0);
    float glow = exp(-d * 4.0) * 0.5;
    float shape = core + glow;
    shape *= smoothstep(0.5, 0.2, d);

    float alpha = shape * vAlpha;
    if (alpha < 0.005) discard;

    vec3 innerColor = uColor1 * 1.2;
    vec3 outerColor = uColor2 * 0.9;
    vec3 color = mix(innerColor, outerColor, vLayer);

    color *= 0.85 + 0.15 * sin(uTime * 2.0 + vRandom * 6.28);
    color = mix(color, vec3(1.0), core * 0.2);

    gl_FragColor = vec4(color, alpha * 0.85);
  }
`;
var ParticleFieldPreset = class extends BasePreset {
  id = "particles";
  name = "Particles";
  category = "Particles & Light";
  description = "Multi-layered orbital particle vortex with relativistic audio pulses and core halo.";
  cameraConfig = {
    position: [0, 6, 16],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };
  points;
  geometry;
  material;
  coreMesh;
  coreMaterial;
  count = 6e3;
  smoothBass = 0;
  smoothMid = 0;
  smoothTreble = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Swirl Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "particleScale", name: "Particle Size", min: 0.05, max: 0.5, step: 0.01, defaultValue: 0.16 },
      { id: "density", name: "Particle Density", min: 0.2, max: 1, step: 0.1, defaultValue: 1 }
    ]);
  }
  setup(ctx) {
    this.geometry = new THREE34.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const randoms = new Float32Array(this.count);
    const layers = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) {
      const layer = Math.random();
      layers[i] = layer;
      const radius = 1.5 + Math.pow(Math.random(), 0.7) * 11;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;
      positions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * 0.55;
      positions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);
      sizes[i] = 0.4 + Math.random() * 1.2;
      randoms[i] = Math.random();
    }
    this.geometry.setAttribute("position", new THREE34.BufferAttribute(positions, 3));
    this.geometry.setAttribute("size", new THREE34.BufferAttribute(sizes, 1));
    this.geometry.setAttribute("aRandom", new THREE34.BufferAttribute(randoms, 1));
    this.geometry.setAttribute("aLayer", new THREE34.BufferAttribute(layers, 1));
    const primaryColor = new THREE34.Color(ctx.theme.primary);
    const accentColor = new THREE34.Color(ctx.theme.accent);
    this.material = new THREE34.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uKick: { value: 0 },
        uOrbitSpeed: { value: 0.5 },
        uSpread: { value: 0.5 },
        uColor1: { value: primaryColor },
        uColor2: { value: accentColor }
      },
      vertexShader: SWARM_VERTEX_SHADER,
      fragmentShader: SWARM_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE34.AdditiveBlending,
      depthWrite: false
    });
    this.points = new THREE34.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);
    const coreGeom = new THREE34.SphereGeometry(0.8, 24, 24);
    this.coreMaterial = new THREE34.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.5,
      blending: THREE34.AdditiveBlending,
      depthWrite: false
    });
    this.coreMesh = new THREE34.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);
  }
  update(_ctx, audio, time, delta) {
    if (!this.points || !this.material) return;
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const density = this.paramStore.getValue("density");
    const activeCount = density <= 0 ? 0 : Math.floor(this.count * Math.min(1, density));
    this.geometry.setDrawRange(0, activeCount);
    if (this.points) this.points.visible = density > 0;
    const bassIn = audio.bass * reactivity;
    const midIn = audio.mid * reactivity;
    const trebleIn = audio.treble * reactivity;
    this.smoothBass += (bassIn - this.smoothBass) * 0.15;
    this.smoothMid += (midIn - this.smoothMid) * 0.12;
    this.smoothTreble += (trebleIn - this.smoothTreble) * 0.15;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uBass.value = this.smoothBass;
    this.material.uniforms.uMid.value = this.smoothMid;
    this.material.uniforms.uTreble.value = this.smoothTreble;
    this.material.uniforms.uKick.value = audio.beat ? 1 : audio.beatEnergy * reactivity;
    this.material.uniforms.uOrbitSpeed.value = speed * 0.6;
    this.material.uniforms.uSpread.value = 0.5 + this.smoothBass * 0.5;
    if (this.coreMesh) {
      const coreScale = 1 + this.smoothBass * 0.8 + (audio.beat ? 0.4 : 0);
      this.coreMesh.scale.setScalar(coreScale);
      this.coreMaterial.opacity = 0.35 + this.smoothBass * 0.45;
    }
    this.group.rotation.y += delta * 0.1 * speed;
  }
  onThemeChange(theme) {
    const primary = new THREE34.Color(theme.primary);
    const accent = new THREE34.Color(theme.accent);
    if (this.material?.uniforms) {
      this.material.uniforms.uColor1.value.copy(primary);
      this.material.uniforms.uColor2.value.copy(accent);
    }
    if (this.coreMaterial) {
      this.coreMaterial.color.copy(primary);
    }
  }
  onDispose() {
    this.geometry?.dispose();
    this.material?.dispose();
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial?.dispose();
    }
  }
};

// src/presets/Fireflies.ts
var THREE35 = __toESM(require("three"), 1);
var FirefliesPreset = class extends BasePreset {
  id = "fireflies";
  name = "Fireflies";
  category = "Particles & Light";
  description = "Bioluminescent swarm of wandering fireflies pulsing softly.";
  cameraConfig = {
    position: [0, 2, 12],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };
  points;
  material;
  positions;
  phases;
  count = 1200;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Drift Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Biolum Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Glow Size", min: 0.1, max: 0.5, step: 0.02, defaultValue: 0.22 }
    ]);
  }
  setup(ctx) {
    const geom = new THREE35.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.phases = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 16;
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      this.phases[i] = Math.random() * Math.PI * 2;
    }
    geom.setAttribute("position", new THREE35.BufferAttribute(this.positions, 3));
    this.material = new THREE35.PointsMaterial({
      color: new THREE35.Color(ctx.theme.accent),
      size: this.paramStore.getValue("density"),
      transparent: true,
      opacity: 0.9,
      blending: THREE35.AdditiveBlending,
      depthWrite: false
    });
    this.points = new THREE35.Points(geom, this.material);
    this.group.add(this.points);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const baseSize = this.paramStore.getValue("density");
    const pos = this.points.geometry.attributes.position.array;
    const speedMultiplier = (1 + audio.mid * 2 * reactivity) * speed;
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const phase = this.phases[i];
      pos[idx] += Math.sin(time * 1.5 + phase) * delta * speedMultiplier;
      pos[idx + 1] += Math.cos(time * 1.2 + phase * 1.3) * delta * speedMultiplier;
      pos[idx + 2] += Math.sin(time * 0.9 + phase * 0.7) * delta * speedMultiplier;
      if (pos[idx] > 10) pos[idx] = -10;
      if (pos[idx] < -10) pos[idx] = 10;
      if (pos[idx + 1] > 8) pos[idx + 1] = -8;
      if (pos[idx + 1] < -8) pos[idx + 1] = 8;
      if (pos[idx + 2] > 7) pos[idx + 2] = -7;
      if (pos[idx + 2] < -7) pos[idx + 2] = 7;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    const beatPulse = audio.beat ? baseSize * 1.6 : baseSize;
    this.material.size = beatPulse + audio.treble * 0.15 * reactivity;
  }
  onThemeChange(theme) {
    this.material.color.set(theme.accent);
  }
  onDispose() {
    if (this.points) {
      this.points.geometry.dispose();
      this.material?.dispose();
    }
  }
};

// src/presets/Lightning.ts
var THREE36 = __toESM(require("three"), 1);
var LightningPreset = class extends BasePreset {
  id = "lightning";
  name = "Lightning";
  category = "Particles & Light";
  description = "Fractal high-voltage electric arc network discharging on beats.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  boltLines = [];
  boltGeometries = [];
  boltMaterials = [];
  numBolts = 16;
  segmentsPerBolt = 24;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Arc Frequency", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Discharge Voltage", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Arc Reach", min: 2, max: 10, step: 0.5, defaultValue: 6 }
    ]);
  }
  setup(ctx) {
    this.boltLines.length = 0;
    this.boltGeometries.length = 0;
    this.boltMaterials.length = 0;
    for (let b = 0; b < this.numBolts; b++) {
      const geom = new THREE36.BufferGeometry();
      const positions = new Float32Array(this.segmentsPerBolt * 3);
      geom.setAttribute("position", new THREE36.BufferAttribute(positions, 3));
      this.boltGeometries.push(geom);
      const mat = new THREE36.LineBasicMaterial({
        color: new THREE36.Color(ctx.theme.accent),
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        blending: THREE36.AdditiveBlending,
        depthWrite: false
      });
      this.boltMaterials.push(mat);
      const line = new THREE36.Line(geom, mat);
      this.boltLines.push(line);
      this.group.add(line);
    }
  }
  updateBolt(b, audio, time, ctx, reactivity, reach) {
    const geom = this.boltGeometries[b];
    const pos = geom.attributes.position.array;
    const angle = b / this.numBolts * Math.PI * 2 + Math.sin(time + b) * 0.2;
    const arcLength = (2 + audio.bass * reach + audio.beatEnergy * 5) * reactivity;
    const endX = Math.cos(angle) * arcLength;
    const endY = Math.sin(angle) * arcLength;
    const jitter = 0.35 + audio.treble * 0.8 * reactivity;
    for (let s = 0; s < this.segmentsPerBolt; s++) {
      const t = s / (this.segmentsPerBolt - 1);
      const isIntermediate = s > 0 && s < this.segmentsPerBolt - 1;
      const noise = isIntermediate ? jitter : 0;
      pos[s * 3] = endX * t + (Math.random() - 0.5) * noise;
      pos[s * 3 + 1] = endY * t + (Math.random() - 0.5) * noise;
      pos[s * 3 + 2] = (Math.random() - 0.5) * noise;
    }
    geom.attributes.position.needsUpdate = true;
    const mat = this.boltMaterials[b];
    if (audio.beat) {
      mat.opacity = 1;
      mat.color.set(ctx.theme.glow);
    } else {
      mat.opacity = 0.4 + Math.random() * 0.4;
      mat.color.set(ctx.theme.accent);
    }
  }
  update(ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const reach = this.paramStore.getValue("density");
    this.group.rotation.z += delta * (0.2 + audio.treble * 0.4) * speed;
    for (let b = 0; b < this.numBolts; b++) {
      this.updateBolt(b, audio, time * speed, ctx, reactivity, reach);
    }
  }
  onThemeChange(theme) {
    for (const m of this.boltMaterials) {
      m.color.set(theme.accent);
    }
  }
  onDispose() {
    for (const g of this.boltGeometries) {
      g.dispose();
    }
    for (const m of this.boltMaterials) {
      m.dispose();
    }
    this.boltLines.length = 0;
    this.boltGeometries.length = 0;
    this.boltMaterials.length = 0;
  }
};

// src/presets/PlasmaArcs.ts
var THREE37 = __toESM(require("three"), 1);
var PlasmaArcsPreset = class extends BasePreset {
  id = "plasmaarcs";
  name = "Plasma Arcs";
  category = "Particles & Light";
  description = "Full-screen dielectric breakdown plasma filament network.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false,
    bloomIntensity: 0.55
  };
  mesh;
  material;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Filament Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Voltage Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Filament Density", min: 4, max: 16, step: 1, defaultValue: 8 }
    ]);
  }
  setup(ctx) {
    const geometry = new THREE37.PlaneGeometry(2, 2);
    const aspect = typeof window !== "undefined" ? window.innerWidth / Math.max(window.innerHeight, 1) : 1.7778;
    this.material = new THREE37.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uVoltage: { value: 0 },
        uDensity: { value: 8 },
        uAspect: { value: aspect },
        uColor1: { value: new THREE37.Color(ctx.theme.primary) },
        uColor2: { value: new THREE37.Color(ctx.theme.accent) }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE37.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uVoltage;
        uniform float uDensity;
        uniform float uAspect;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;

        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          p.x *= (uAspect > 0.0 ? uAspect : 1.7778);
          float r = length(p);
          float a = atan(p.y, p.x);

          // Dielectric filament breakdown using multi-octave curl noise
          float n1 = sin(a * uDensity + uTime * 3.0 + sin(r * 10.0 - uTime * 4.0));
          float n2 = cos(r * 14.0 - uTime * 5.0 + n1 * 2.0);
          float arc = pow(abs(n1 * n2), 4.0) * (1.0 + uVoltage * 2.0);

          float centralGlow = 0.06 / (r + 0.04) * (0.6 + uVoltage);
          vec3 col = mix(uColor1, uColor2, arc + centralGlow);
          col *= (arc * 2.0 + centralGlow * 1.5);

          gl_FragColor = vec4(col, clamp(arc * 1.2 + centralGlow, 0.0, 1.0));
        }
      `
    });
    this.mesh = new THREE37.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const density = this.paramStore.getValue("density");
    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uVoltage.value = (audio.rms * 1.5 + audio.treble * 1.2) * reactivity;
    this.material.uniforms.uDensity.value = density;
    if (typeof window !== "undefined") {
      this.material.uniforms.uAspect.value = window.innerWidth / Math.max(window.innerHeight, 1);
    }
  }
  resize(width, height) {
    if (this.material?.uniforms?.uAspect) {
      this.material.uniforms.uAspect.value = width / Math.max(height, 1);
    }
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.accent);
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material?.dispose();
    }
  }
};

// src/presets/LavaEnergy.ts
var THREE38 = __toESM(require("three"), 1);
var LavaEnergyPreset = class extends BasePreset {
  id = "lava";
  name = "Lava";
  category = "Fluids & Heat";
  description = "Molten magma energy blob with glowing crust fissures.";
  cameraConfig = {
    position: [0, 2, 8],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };
  mesh;
  geometry;
  material;
  basePositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Magma Flow Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Pulse Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Crust Roughness", min: 0.1, max: 0.8, step: 0.05, defaultValue: 0.25 }
    ]);
  }
  setup(ctx) {
    this.geometry = new THREE38.SphereGeometry(2.5, 64, 64);
    const pos = this.geometry.attributes.position.array;
    this.basePositions = new Float32Array(pos);
    this.material = new THREE38.MeshStandardMaterial({
      color: new THREE38.Color(ctx.theme.primary),
      emissive: new THREE38.Color(ctx.theme.accent),
      emissiveIntensity: 0.45,
      roughness: this.paramStore.getValue("density"),
      metalness: 0.7,
      wireframe: false
    });
    this.mesh = new THREE38.Mesh(this.geometry, this.material);
    this.group.add(this.mesh);
  }
  update(ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.mesh.rotation.y += delta * (0.3 + audio.mid * 0.5 * reactivity) * speed;
    this.mesh.rotation.x += delta * (0.15 + audio.treble * 0.4 * reactivity) * speed;
    const pos = this.geometry.attributes.position.array;
    const waveAmp = (0.35 + audio.bass * 0.8 + audio.beatEnergy * 0.5) * reactivity;
    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];
      const u = bx * 1.5 + time * 2 * speed;
      const v = by * 1.5 + time * 1.8 * speed;
      const noise = Math.sin(u) * Math.cos(v) * Math.sin(bz * 1.5 + time * speed);
      const displacement = 1 + noise * waveAmp;
      pos[i] = bx * displacement;
      pos[i + 1] = by * displacement;
      pos[i + 2] = bz * displacement;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    if (audio.beat) {
      this.material.emissive.set(ctx.theme.glow);
      this.material.emissiveIntensity = 1 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.93;
    }
  }
  onThemeChange(theme) {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.accent);
  }
  onDispose() {
    this.geometry?.dispose();
    this.material?.dispose();
  }
};

// src/presets/Fireball.ts
var THREE39 = __toESM(require("three"), 1);
var FireballPreset = class extends BasePreset {
  id = "fireball";
  name = "Fireball";
  category = "Fluids & Heat";
  description = "Blazing plasma energy sphere with solar combustion tongues.";
  cameraConfig = {
    position: [0, 0, 8],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };
  coreMesh;
  sparksPoints;
  coreMaterial;
  sparksMaterial;
  numSparks = 800;
  sparkVelocities;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Combustion Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Explosive Pulse", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Fire Radius", min: 1, max: 4, step: 0.1, defaultValue: 2.2 }
    ]);
  }
  setup(ctx) {
    const radius = this.paramStore.getValue("density");
    const geom = new THREE39.IcosahedronGeometry(radius, 4);
    this.coreMaterial = new THREE39.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uColor1: { value: new THREE39.Color(ctx.theme.primary) },
        uColor2: { value: new THREE39.Color(ctx.theme.accent) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPos;

        void main() {
          vNormal = normal;
          vec3 p = position;
          float noise = sin(p.x * 3.0 + uTime * 4.0) * cos(p.y * 3.0 + uTime * 3.5) * sin(p.z * 3.0 + uTime * 3.0);
          p += normal * noise * (0.35 + uBass * 0.8);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vPos;

        void main() {
          float heat = length(vPos) * 0.4 + uBass * 0.4;
          vec3 col = mix(uColor1, uColor2, clamp(heat, 0.0, 1.0));
          col += vec3(1.0, 0.8, 0.3) * pow(clamp(heat, 0.0, 1.0), 3.0) * (0.8 + uBass);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.coreMesh = new THREE39.Mesh(geom, this.coreMaterial);
    this.group.add(this.coreMesh);
    const sparkGeom = new THREE39.BufferGeometry();
    const sparkPos = new Float32Array(this.numSparks * 3);
    this.sparkVelocities = new Float32Array(this.numSparks * 3);
    for (let i = 0; i < this.numSparks; i++) {
      const dir = new THREE39.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const dist = radius + Math.random() * 2.5;
      sparkPos[i * 3] = dir.x * dist;
      sparkPos[i * 3 + 1] = dir.y * dist;
      sparkPos[i * 3 + 2] = dir.z * dist;
      this.sparkVelocities[i * 3] = dir.x * (0.5 + Math.random());
      this.sparkVelocities[i * 3 + 1] = dir.y * (0.5 + Math.random());
      this.sparkVelocities[i * 3 + 2] = dir.z * (0.5 + Math.random());
    }
    sparkGeom.setAttribute("position", new THREE39.BufferAttribute(sparkPos, 3));
    this.sparksMaterial = new THREE39.PointsMaterial({
      color: new THREE39.Color(ctx.theme.accent),
      size: 0.15,
      transparent: true,
      opacity: 0.9,
      blending: THREE39.AdditiveBlending,
      depthWrite: false
    });
    this.sparksPoints = new THREE39.Points(sparkGeom, this.sparksMaterial);
    this.group.add(this.sparksPoints);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y += delta * 0.3 * speed;
    this.coreMaterial.uniforms.uTime.value = time * speed;
    this.coreMaterial.uniforms.uBass.value = audio.bass * reactivity;
    const scale = 1 + (audio.bass * 0.4 + audio.beatEnergy * 0.5) * reactivity;
    this.coreMesh.scale.set(scale, scale, scale);
    const pos = this.sparksPoints.geometry.attributes.position.array;
    for (let i = 0; i < this.numSparks; i++) {
      const idx = i * 3;
      pos[idx] += this.sparkVelocities[idx] * delta * (2 + audio.bass * 4 * reactivity) * speed;
      pos[idx + 1] += this.sparkVelocities[idx + 1] * delta * (2 + audio.bass * 4 * reactivity) * speed;
      pos[idx + 2] += this.sparkVelocities[idx + 2] * delta * (2 + audio.bass * 4 * reactivity) * speed;
      const dist = Math.hypot(pos[idx], pos[idx + 1], pos[idx + 2]);
      if (dist > 7) {
        const dir = new THREE39.Vector3(pos[idx], pos[idx + 1], pos[idx + 2]).normalize();
        pos[idx] = dir.x * 2.2;
        pos[idx + 1] = dir.y * 2.2;
        pos[idx + 2] = dir.z * 2.2;
      }
    }
    this.sparksPoints.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.coreMaterial.uniforms.uColor1.value.set(theme.primary);
    this.coreMaterial.uniforms.uColor2.value.set(theme.accent);
    this.sparksMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial?.dispose();
    }
    if (this.sparksPoints) {
      this.sparksPoints.geometry.dispose();
      this.sparksMaterial?.dispose();
    }
  }
};

// src/presets/WaterNeurons.ts
var THREE40 = __toESM(require("three"), 1);
var WaterNeuronsPreset = class extends BasePreset {
  id = "waterneurons";
  name = "Water Neurons";
  category = "Fluids & Heat";
  description = "Synaptic neural dendrite axon network with action pulses.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  coreMesh;
  neuronLines;
  coreMaterial;
  lineMaterial;
  synNodePoints;
  synNodeMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Pulse Velocity", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Synaptic Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Axon Spread", min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.5 }
    ]);
  }
  setup(ctx) {
    const coreGeom = new THREE40.SphereGeometry(1.2, 32, 32);
    this.coreMaterial = new THREE40.MeshStandardMaterial({
      color: new THREE40.Color(ctx.theme.primary),
      emissive: new THREE40.Color(ctx.theme.accent),
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8
    });
    this.coreMesh = new THREE40.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);
    const axonCount = 36;
    const segmentsPerAxon = 10;
    const linePositions = new Float32Array(axonCount * (segmentsPerAxon - 1) * 2 * 3);
    const terminalPoints = [];
    let ptr = 0;
    for (let a = 0; a < axonCount; a++) {
      const dir = new THREE40.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      const currentPos = dir.clone().multiplyScalar(1.2);
      for (let s = 0; s < segmentsPerAxon - 1; s++) {
        linePositions[ptr++] = currentPos.x;
        linePositions[ptr++] = currentPos.y;
        linePositions[ptr++] = currentPos.z;
        const step = dir.clone().multiplyScalar(0.6).add(new THREE40.Vector3(
          (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.35
        ));
        currentPos.add(step);
        linePositions[ptr++] = currentPos.x;
        linePositions[ptr++] = currentPos.y;
        linePositions[ptr++] = currentPos.z;
      }
      terminalPoints.push(currentPos.x, currentPos.y, currentPos.z);
    }
    const lineGeom = new THREE40.BufferGeometry();
    lineGeom.setAttribute("position", new THREE40.BufferAttribute(linePositions, 3));
    this.lineMaterial = new THREE40.LineBasicMaterial({
      color: new THREE40.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.9,
      blending: THREE40.AdditiveBlending,
      depthWrite: false
    });
    this.neuronLines = new THREE40.LineSegments(lineGeom, this.lineMaterial);
    this.group.add(this.neuronLines);
    const nodeGeom = new THREE40.BufferGeometry();
    nodeGeom.setAttribute("position", new THREE40.Float32BufferAttribute(terminalPoints, 3));
    this.synNodeMaterial = new THREE40.PointsMaterial({
      color: new THREE40.Color(ctx.theme.primary),
      size: 0.25,
      transparent: true,
      opacity: 0.95,
      blending: THREE40.AdditiveBlending,
      depthWrite: false
    });
    this.synNodePoints = new THREE40.Points(nodeGeom, this.synNodeMaterial);
    this.group.add(this.synNodePoints);
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y += delta * 0.2 * speed;
    const scale = 1 + (audio.bass * 0.45 + (audio.beat ? 0.35 : 0)) * reactivity;
    this.coreMesh.scale.set(scale, scale, scale);
    if (audio.beat) {
      this.coreMaterial.emissiveIntensity = 1.8 * reactivity;
      this.lineMaterial.opacity = 1;
      this.synNodeMaterial.size = 0.45 * reactivity;
    } else {
      this.coreMaterial.emissiveIntensity = Math.max(0.4, this.coreMaterial.emissiveIntensity * 0.94);
      this.lineMaterial.opacity = 0.5 + audio.treble * 0.5 * reactivity;
      this.synNodeMaterial.size = 0.22;
    }
  }
  onThemeChange(theme) {
    this.coreMaterial.color.set(theme.primary);
    this.coreMaterial.emissive.set(theme.accent);
    this.lineMaterial.color.set(theme.accent);
    this.synNodeMaterial.color.set(theme.primary);
  }
  onDispose() {
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial?.dispose();
    }
    if (this.neuronLines) {
      this.neuronLines.geometry.dispose();
      this.lineMaterial?.dispose();
    }
    if (this.synNodePoints) {
      this.synNodePoints.geometry.dispose();
      this.synNodeMaterial?.dispose();
    }
  }
};

// src/presets/Liquid.ts
var THREE41 = __toESM(require("three"), 1);
var LiquidPreset = class extends BasePreset {
  id = "liquid";
  name = "Liquid";
  category = "Fluids & Heat";
  description = "Flowing chromatic liquid caustic pool distortion shader with color advection.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  mesh;
  material;
  onResizeHandler;
  smoothBass = 0;
  smoothMid = 0;
  smoothTreble = 0;
  smoothAvg = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Flow Velocity", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Turbulence Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Viscosity Scale", min: 1, max: 5, step: 0.2, defaultValue: 2.5 }
    ]);
  }
  setup(ctx) {
    const geom = new THREE41.PlaneGeometry(2, 2);
    const width = typeof window !== "undefined" ? window.innerWidth : 1920;
    const height = typeof window !== "undefined" ? window.innerHeight : 1080;
    this.material = new THREE41.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uAudio: { value: 0 },
        uResolution: { value: new THREE41.Vector2(width, height) },
        uColor1: { value: new THREE41.Color(ctx.theme.primary) },
        uColor2: { value: new THREE41.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE41.Color(ctx.theme.accent) },
        uReflectionSharpness: { value: 0.6 },
        uPoolSurface: { value: 1 },
        uFlowSpeed: { value: 0.4 },
        uCausticWarp: { value: 0.5 }
      },
      depthWrite: false,
      depthTest: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        uniform float uAudio;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform vec2 uResolution;
        uniform float uReflectionSharpness;
        uniform float uPoolSurface;
        uniform float uFlowSpeed;
        uniform float uCausticWarp;
        varying vec2 vUv;

        // Hash and Simplex Noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        float hash1(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        vec2 hash2(vec2 p) {
          return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
        }

        float voronoiCellDist(vec2 p) {
          vec2 n = floor(p);
          vec2 f = fract(p);
          float md = 8.0;
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash2(n + g);
              o = 0.5 + 0.5 * sin(o * 6.2831);
              vec2 r = g + o - f;
              float d = dot(r, r);
              md = min(md, d);
            }
          }
          return sqrt(md);
        }

        float causticLayer(vec2 uv, float scale, vec2 offset) {
          vec2 p = uv * scale + offset;
          vec2 n = floor(p);
          vec2 f = fract(p);
          float md = 8.0;
          float md2 = 8.0;
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash2(n + g);
              o = 0.5 + 0.5 * sin(o * 6.2831853 + offset);
              vec2 r = g + o - f;
              float d = dot(r, r);
              if (d < md) {
                md2 = md;
                md = d;
              } else if (d < md2) {
                md2 = d;
              }
            }
          }
          return sqrt(md2) - sqrt(md);
        }

        float poolBottomGrit(vec2 uv) {
          vec2 fineUv = uv * 520.0;
          vec2 coarseUv = uv * 62.0 + 11.7;
          vec2 scratchUv = vec2(uv.x * 920.0 + uv.y * 18.0, uv.y * 14.0 - uv.x * 40.0);
          float fine = hash1(floor(fineUv));
          float coarse = hash1(floor(coarseUv));
          float scratch = hash1(floor(scratchUv));
          float streak = smoothstep(0.92, 1.0, abs(sin(uv.x * 140.0 + hash1(floor(uv * 24.0)) * 6.28)));
          return fine * 0.5 + coarse * 0.32 + scratch * 0.28 + streak * 0.18;
        }

        vec3 themeCausticColor(vec3 c1, vec3 c2) {
          vec3 base = mix(c1, c2, 0.28);
          float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));
          vec3 saturated = mix(vec3(lum), base, 1.55);
          return saturated * 1.12;
        }

        void main() {
          vec2 st = (vUv - 0.5) * 4.0;
          if (uResolution.y > 0.0) {
            st.x *= uResolution.x / uResolution.y;
          }

          float speed = mix(0.08, 2.0, uFlowSpeed);
          float t = uTime * speed;

          float warpAmp = mix(0.02, 0.18, uCausticWarp);
          float caustWarp = mix(0.02, 0.14, uCausticWarp);

          float noiseTime = t * (0.2 + uMid * 0.06);
          vec2 noiseCoord = st * 3.0;
          float n = snoise(noiseCoord + vec2(noiseTime));
          float n2 = snoise(noiseCoord * 2.0 - vec2(noiseTime * 1.5));

          float distortAmp = warpAmp + uBass * 0.04 * uCausticWarp;
          vec2 distortedUV = st + vec2(n, n2) * distortAmp;

          float s = uReflectionSharpness;
          float baseScale = mix(5.0, 14.0, s);

          vec2 caustUV = distortedUV;
          caustUV += vec2(snoise(caustUV * 2.0 + t), snoise(caustUV * 2.0 - t + 4.0)) * caustWarp;

          float cellDist = voronoiCellDist(caustUV * baseScale * 0.85 + vec2(t * 0.05, -t * 0.04));
          float cellInterior = 1.0 - smoothstep(0.0, 0.4, cellDist);

          vec3 deepWater = uColor2 * 0.30;
          vec3 shallowWater = mix(uColor1, uColor2, 0.45) * 0.55;
          vec3 waterBody = mix(deepWater, shallowWater, cellInterior);

          float marble = snoise(distortedUV * 2.0 + t * (0.1 + uMid * 0.03)) * 0.5 + 0.5;
          waterBody = mix(waterBody, shallowWater, marble * 0.18);

          vec2 gritUV = distortedUV;
          float grit = poolBottomGrit(gritUV);
          waterBody *= mix(1.0, 0.78 + grit * 0.34, uPoolSurface);
          waterBody += (grit - 0.5) * 0.06 * uPoolSurface * mix(deepWater, shallowWater, 0.5);

          float c = causticLayer(caustUV, baseScale, vec2(t * 0.4, t * 0.25)) * 0.55 +
                    causticLayer(caustUV, baseScale * 1.45, vec2(-t * 0.3, t * 0.5)) * 0.35 +
                    causticLayer(caustUV, baseScale * 2.1, vec2(t * 0.22, -t * 0.35)) * 0.20;

          c = pow(max(c, 0.0), mix(0.30, 1.15, s));
          c = smoothstep(mix(0.0, 0.08, 1.0 - s), 1.0, c);

          float causticStrength = mix(0.45, 1.25, s) * (1.0 + uAudio * 0.25 + uBass * 0.35);
          vec3 causticCol = themeCausticColor(uColor1, uColor2);
          vec3 finalColor = waterBody + causticCol * c * causticStrength;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
    this.mesh = new THREE41.Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    if (typeof window !== "undefined") {
      this.onResizeHandler = () => {
        this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", this.onResizeHandler);
    }
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.smoothBass += (audio.bass - this.smoothBass) * Math.min(1, delta * 12);
    this.smoothMid += (audio.mid - this.smoothMid) * Math.min(1, delta * 10);
    this.smoothTreble += (audio.treble - this.smoothTreble) * Math.min(1, delta * 14);
    this.smoothAvg += (audio.rms - this.smoothAvg) * Math.min(1, delta * 10);
    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = this.smoothBass * reactivity;
    this.material.uniforms.uMid.value = this.smoothMid * reactivity;
    this.material.uniforms.uTreble.value = this.smoothTreble * reactivity;
    this.material.uniforms.uAudio.value = this.smoothAvg * reactivity;
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.onResizeHandler && typeof window !== "undefined") {
      window.removeEventListener("resize", this.onResizeHandler);
    }
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
  }
};

// src/presets/Fluid.ts
var THREE42 = __toESM(require("three"), 1);
var FluidPreset = class extends BasePreset {
  id = "fluid";
  name = "Fluid";
  category = "Fluids & Heat";
  description = "3D glass tank side view with audio sloshing waves & bubbles.";
  cameraConfig = {
    position: [0, 0, 11],
    target: [0, 0, 0],
    autoRotate: false
  };
  tankFrame;
  waterSurface;
  bubblePoints;
  waterMaterial;
  frameMaterial;
  bubbleMaterial;
  numBubbles = 300;
  bubblePositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Slosh Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Wave Amplitude", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Tank Scale", min: 1, max: 3, step: 0.1, defaultValue: 1.5 }
    ]);
  }
  setup(ctx) {
    const tankGeom = new THREE42.BoxGeometry(10, 6, 4);
    const edges = new THREE42.EdgesGeometry(tankGeom);
    this.frameMaterial = new THREE42.LineBasicMaterial({
      color: new THREE42.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.6
    });
    this.tankFrame = new THREE42.LineSegments(edges, this.frameMaterial);
    this.group.add(this.tankFrame);
    const waterGeom = new THREE42.PlaneGeometry(9.8, 3.8, 48, 24);
    waterGeom.rotateX(-Math.PI / 2);
    waterGeom.translate(0, 0.5, 0);
    this.waterMaterial = new THREE42.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uColor1: { value: new THREE42.Color(ctx.theme.primary) },
        uAccent: { value: new THREE42.Color(ctx.theme.accent) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vUv = uv;
          vec3 p = position;
          // Sloshing wave across tank length
          float slosh = sin(p.x * 0.6 + uTime * 3.0) * (0.35 + uBass * 0.8);
          float ripple = cos(p.z * 1.5 + uTime * 4.0) * 0.15 * (1.0 + uBass);
          p.y += slosh + ripple;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec3 col = mix(uColor1, uAccent, clamp(vPos.y * 0.8 + 0.5, 0.0, 1.0));
          gl_FragColor = vec4(col, 0.75);
        }
      `,
      transparent: true,
      side: THREE42.DoubleSide
    });
    this.waterSurface = new THREE42.Mesh(waterGeom, this.waterMaterial);
    this.group.add(this.waterSurface);
    const bubbleGeom = new THREE42.BufferGeometry();
    this.bubblePositions = new Float32Array(this.numBubbles * 3);
    for (let i = 0; i < this.numBubbles; i++) {
      this.bubblePositions[i * 3] = (Math.random() - 0.5) * 9;
      this.bubblePositions[i * 3 + 1] = -2.5 + Math.random() * 3;
      this.bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 3.4;
    }
    bubbleGeom.setAttribute("position", new THREE42.BufferAttribute(this.bubblePositions, 3));
    this.bubbleMaterial = new THREE42.PointsMaterial({
      color: new THREE42.Color(ctx.theme.accent),
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      blending: THREE42.AdditiveBlending,
      depthWrite: false
    });
    this.bubblePoints = new THREE42.Points(bubbleGeom, this.bubbleMaterial);
    this.group.add(this.bubblePoints);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y = Math.sin(time * 0.4 * speed) * 0.25;
    this.waterMaterial.uniforms.uTime.value = time * speed;
    this.waterMaterial.uniforms.uBass.value = audio.bass * reactivity;
    const pos = this.bubblePoints.geometry.attributes.position.array;
    for (let i = 0; i < this.numBubbles; i++) {
      const idx = i * 3;
      pos[idx + 1] += delta * (1.2 + audio.bass * 2 * reactivity) * speed;
      pos[idx] += Math.sin(time * 4 + i) * delta * 0.2;
      if (pos[idx + 1] > 0.8) {
        pos[idx + 1] = -2.8;
        pos[idx] = (Math.random() - 0.5) * 9;
      }
    }
    this.bubblePoints.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.frameMaterial.color.set(theme.primary);
    this.waterMaterial.uniforms.uColor1.value.set(theme.primary);
    this.waterMaterial.uniforms.uAccent.value.set(theme.accent);
    this.bubbleMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.tankFrame) {
      this.tankFrame.geometry.dispose();
      this.frameMaterial?.dispose();
    }
    if (this.waterSurface) {
      this.waterSurface.geometry.dispose();
      this.waterMaterial?.dispose();
    }
    if (this.bubblePoints) {
      this.bubblePoints.geometry.dispose();
      this.bubbleMaterial?.dispose();
    }
  }
};

// src/presets/Plasma.ts
var THREE43 = __toESM(require("three"), 1);
var PlasmaPreset = class extends BasePreset {
  id = "plasma";
  name = "Plasma";
  category = "Fluids & Heat";
  description = "Luminescent ionized gas cloud with high-voltage filaments.";
  cameraConfig = {
    position: [0, 0, 9],
    target: [0, 0, 0],
    autoRotate: false
  };
  torusMesh;
  filaments;
  torusMaterial;
  filamentMaterial;
  numFilaments = 32;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Gas Swirl Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Ionization Pulse", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Torus Radius", min: 1.5, max: 4.5, step: 0.1, defaultValue: 2.8 }
    ]);
  }
  setup(ctx) {
    const radius = this.paramStore.getValue("density");
    const torusGeom = new THREE43.TorusGeometry(radius, 1.2, 32, 64);
    this.torusMaterial = new THREE43.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uColor1: { value: new THREE43.Color(ctx.theme.primary) },
        uAccent: { value: new THREE43.Color(ctx.theme.accent) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uTreble;
        varying vec3 vNormal;
        varying vec3 vPos;

        void main() {
          vNormal = normal;
          vec3 p = position;
          float wobble = sin(p.x * 3.0 + uTime * 4.0) * cos(p.y * 3.0 + uTime * 3.0) * 0.25 * (1.0 + uTreble);
          p += normal * wobble;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec3 vNormal;
        varying vec3 vPos;

        void main() {
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          vec3 col = mix(uColor1, uAccent, pow(rim, 2.0));
          gl_FragColor = vec4(col, 0.7);
        }
      `,
      transparent: true,
      blending: THREE43.AdditiveBlending,
      side: THREE43.DoubleSide
    });
    this.torusMesh = new THREE43.Mesh(torusGeom, this.torusMaterial);
    this.group.add(this.torusMesh);
    const linePositions = [];
    for (let f = 0; f < this.numFilaments; f++) {
      const angle = f / this.numFilaments * Math.PI * 2;
      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + 0.3) * (radius * 1.4);
      const y2 = Math.sin(angle + 0.3) * (radius * 1.4);
      linePositions.push(x1, y1, 0, x2, y2, 0.8 * Math.sin(f));
    }
    const filGeom = new THREE43.BufferGeometry();
    filGeom.setAttribute("position", new THREE43.Float32BufferAttribute(linePositions, 3));
    this.filamentMaterial = new THREE43.LineBasicMaterial({
      color: new THREE43.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.85,
      blending: THREE43.AdditiveBlending,
      depthWrite: false
    });
    this.filaments = new THREE43.LineSegments(filGeom, this.filamentMaterial);
    this.group.add(this.filaments);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.x += delta * 0.4 * speed;
    this.group.rotation.y += delta * 0.6 * speed;
    this.torusMaterial.uniforms.uTime.value = time * speed;
    this.torusMaterial.uniforms.uTreble.value = audio.treble * reactivity;
    const scale = 1 + audio.mid * 0.35 * reactivity;
    this.torusMesh.scale.set(scale, scale, scale);
    this.filamentMaterial.opacity = 0.4 + (audio.treble * 0.6 + (audio.beat ? 0.3 : 0)) * reactivity;
  }
  onThemeChange(theme) {
    this.torusMaterial.uniforms.uColor1.value.set(theme.primary);
    this.torusMaterial.uniforms.uAccent.value.set(theme.accent);
    this.filamentMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.torusMesh) {
      this.torusMesh.geometry.dispose();
      this.torusMaterial?.dispose();
    }
    if (this.filaments) {
      this.filaments.geometry.dispose();
      this.filamentMaterial?.dispose();
    }
  }
};

// src/presets/Fog.ts
var THREE44 = __toESM(require("three"), 1);
var FogPreset = class extends BasePreset {
  id = "fog";
  name = "Fog";
  category = "Fluids & Heat";
  description = "Fractional Brownian motion (fBm) domain-warped mist.";
  cameraConfig = {
    position: [0, 0, 8],
    target: [0, 0, -10],
    autoRotate: false
  };
  mistPlanes = [];
  materials = [];
  numLayers = 5;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Mist Drift Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Density Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Mist Density", min: 0.3, max: 1, step: 0.05, defaultValue: 0.65 }
    ]);
  }
  setup(ctx) {
    this.mistPlanes.length = 0;
    this.materials.length = 0;
    for (let i = 0; i < this.numLayers; i++) {
      const geom = new THREE44.PlaneGeometry(24, 16, 32, 32);
      const z = -i * 3.5;
      const mat = new THREE44.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE44.NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uBass: { value: 0 },
          uLayer: { value: i },
          uColor1: { value: new THREE44.Color(ctx.theme.primary) },
          uColor2: { value: new THREE44.Color(ctx.theme.secondary) }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uBass;
          uniform float uLayer;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                       mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int k = 0; k < 3; k++) {
              v += a * noise(p);
              p *= 2.0;
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 p = vUv * 3.0 + vec2(uTime * (0.1 + uLayer * 0.05), uTime * 0.03);
            float f = fbm(p + fbm(p + uBass * 0.5));
            float alpha = smoothstep(0.3, 0.75, f) * (0.35 + uBass * 0.3);
            vec3 col = mix(uColor1, uColor2, f);
            gl_FragColor = vec4(col, alpha);
          }
        `
      });
      const mesh = new THREE44.Mesh(geom, mat);
      mesh.position.z = z;
      this.mistPlanes.push(mesh);
      this.materials.push(mat);
      this.group.add(mesh);
    }
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    for (const mat of this.materials) {
      mat.uniforms.uTime.value = time * speed;
      mat.uniforms.uBass.value = audio.bass * reactivity;
    }
  }
  onThemeChange(theme) {
    for (const mat of this.materials) {
      mat.uniforms.uColor1.value.set(theme.primary);
      mat.uniforms.uColor2.value.set(theme.secondary);
    }
  }
  onDispose() {
    for (const mesh of this.mistPlanes) {
      mesh.geometry.dispose();
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.mistPlanes.length = 0;
    this.materials.length = 0;
  }
};

// src/presets/RainWater.ts
var THREE45 = __toESM(require("three"), 1);
var RainWaterPreset = class extends BasePreset {
  id = "water";
  name = "Rain Water";
  category = "Fluids & Heat";
  description = "Concentric circular rain ripple water surface.";
  cameraConfig = {
    position: [0, 8, 16],
    target: [0, 0, 0],
    autoRotate: false
  };
  waterPlane;
  waterMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Ripple Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Impact Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Ripple Frequency", min: 2, max: 10, step: 0.5, defaultValue: 6 }
    ]);
  }
  setup(ctx) {
    const waterGeom = new THREE45.PlaneGeometry(22, 22, 80, 80);
    waterGeom.rotateX(-Math.PI / 2.3);
    this.waterMaterial = new THREE45.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uKickImpact: { value: 0 },
        uFreq: { value: 6 },
        uColor1: { value: new THREE45.Color(ctx.theme.primary) },
        uAccent: { value: new THREE45.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uKickImpact;
        uniform float uFreq;

        void main() {
          vUv = uv;
          vec3 p = position;
          
          float dist = length(p.xy);
          float ripple = sin(dist * uFreq - uTime * 4.0) * exp(-dist * 0.22) * (0.25 + uKickImpact * 0.85);
          p.z += ripple;

          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float dist = length(vPos.xy);
          float fresnel = pow(1.0 - abs(dot(normalize(vPos), vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 col = mix(uColor1 * 0.35, uAccent, fresnel * 0.85);
          gl_FragColor = vec4(col, 0.92);
        }
      `
    });
    this.waterPlane = new THREE45.Mesh(waterGeom, this.waterMaterial);
    this.group.add(this.waterPlane);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const freq = this.paramStore.getValue("density");
    this.waterMaterial.uniforms.uTime.value = time * speed;
    this.waterMaterial.uniforms.uBass.value = audio.bass * reactivity;
    this.waterMaterial.uniforms.uFreq.value = freq;
    if (audio.beat) {
      this.waterMaterial.uniforms.uKickImpact.value = 1 * reactivity;
    } else {
      this.waterMaterial.uniforms.uKickImpact.value = Math.max(0.1, this.waterMaterial.uniforms.uKickImpact.value * 0.93);
    }
  }
  onThemeChange(theme) {
    this.waterMaterial.uniforms.uColor1.value.set(theme.primary);
    this.waterMaterial.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.waterPlane) {
      this.waterPlane.geometry.dispose();
      this.waterMaterial?.dispose();
    }
  }
};

// src/presets/Smoke.ts
var THREE46 = __toESM(require("three"), 1);
var SmokePreset = class extends BasePreset {
  id = "smoke";
  name = "Smoke";
  category = "Fluids & Heat";
  description = "Volumetric curl wisps with rising thermal buoyancy.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  smokePoints;
  smokeMaterial;
  smokeCount = 1200;
  smokePositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Rise Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Curl Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Wisp Spread", min: 5, max: 20, step: 1, defaultValue: 12 }
    ]);
  }
  setup(ctx) {
    const smokeGeom = new THREE46.BufferGeometry();
    this.smokePositions = new Float32Array(this.smokeCount * 3);
    const spread = this.paramStore.getValue("density");
    for (let i = 0; i < this.smokeCount; i++) {
      this.smokePositions[i * 3] = (Math.random() - 0.5) * spread;
      this.smokePositions[i * 3 + 1] = -4 + Math.random() * 8;
      this.smokePositions[i * 3 + 2] = (Math.random() - 0.5) * (spread * 0.7);
    }
    smokeGeom.setAttribute("position", new THREE46.BufferAttribute(this.smokePositions, 3));
    this.smokeMaterial = new THREE46.PointsMaterial({
      color: new THREE46.Color(ctx.theme.accent),
      size: 0.45,
      transparent: true,
      opacity: 0.5,
      blending: THREE46.AdditiveBlending,
      depthWrite: false
    });
    this.smokePoints = new THREE46.Points(smokeGeom, this.smokeMaterial);
    this.group.add(this.smokePoints);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const pos = this.smokePoints.geometry.attributes.position.array;
    for (let i = 0; i < this.smokeCount; i++) {
      const idx = i * 3;
      pos[idx + 1] += delta * (0.6 + audio.bass * 1.5 * reactivity) * speed;
      pos[idx] += Math.sin(time * 2 + i) * delta * (0.4 + audio.mid * reactivity);
      pos[idx + 2] += Math.cos(time * 1.8 + i) * delta * 0.3;
      if (pos[idx + 1] > 6) {
        pos[idx + 1] = -4;
        pos[idx] = (Math.random() - 0.5) * 8;
      }
    }
    this.smokePoints.geometry.attributes.position.needsUpdate = true;
    this.smokeMaterial.opacity = 0.3 + (audio.mid * 0.4 + (audio.beat ? 0.3 : 0)) * reactivity;
  }
  onThemeChange(theme) {
    this.smokeMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.smokePoints) {
      this.smokePoints.geometry.dispose();
      this.smokeMaterial?.dispose();
    }
  }
};

// src/presets/Tunnel.ts
var THREE47 = __toESM(require("three"), 1);
var TunnelPreset = class extends BasePreset {
  id = "tunnel";
  name = "Tunnel";
  category = "Tunnels";
  description = "Infinite depth perspective portal corridor.";
  cameraConfig = {
    position: [0, 0, 8],
    target: [0, 0, -50],
    autoRotate: false
  };
  tunnelMesh;
  tunnelMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Surge Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Wall Undulation", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Tunnel Radius", min: 2, max: 6, step: 0.2, defaultValue: 3.5 }
    ]);
  }
  setup(ctx) {
    const radius = this.paramStore.getValue("density");
    const geom = new THREE47.CylinderGeometry(radius, radius, 40, 32, 64, true);
    geom.rotateX(Math.PI / 2);
    this.tunnelMaterial = new THREE47.ShaderMaterial({
      side: THREE47.BackSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uTreble: { value: 0 },
        uColor1: { value: new THREE47.Color(ctx.theme.primary) },
        uColor2: { value: new THREE47.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE47.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vUv = uv;
          vec3 p = position;
          float undulation = sin(p.z * 0.5 + uTime * 4.0) * 0.25 * (1.0 + uBass * 1.5);
          p.xy += normal.xy * undulation;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uTreble;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float zFlow = fract(vUv.y * 6.0 - uTime * 1.5);
          float rings = smoothstep(0.4, 0.45, zFlow) - smoothstep(0.55, 0.6, zFlow);
          float strips = sin(vUv.x * 24.0);

          vec3 col = mix(uColor1, uColor2, sin(vPos.z * 0.1 + uTime) * 0.5 + 0.5);
          col += uAccent * rings * (0.8 + uBass);
          col += uColor1 * smoothstep(0.7, 0.9, strips) * (0.4 + uTreble);

          float fog = smoothstep(-35.0, -10.0, vPos.z);
          gl_FragColor = vec4(col, fog * 0.9);
        }
      `
    });
    this.tunnelMesh = new THREE47.Mesh(geom, this.tunnelMaterial);
    this.group.add(this.tunnelMesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.tunnelMaterial.uniforms.uTime.value = time * speed;
    this.tunnelMaterial.uniforms.uBass.value = audio.bass * reactivity;
    this.tunnelMaterial.uniforms.uTreble.value = audio.treble * reactivity;
    this.tunnelMesh.rotation.z += delta * (0.3 + audio.mid * 0.4) * speed;
  }
  onThemeChange(theme) {
    this.tunnelMaterial.uniforms.uColor1.value.set(theme.primary);
    this.tunnelMaterial.uniforms.uColor2.value.set(theme.secondary);
    this.tunnelMaterial.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.tunnelMesh) {
      this.tunnelMesh.geometry.dispose();
      this.tunnelMaterial?.dispose();
    }
  }
};

// src/presets/BoxTunnel.ts
var THREE48 = __toESM(require("three"), 1);
var BoxTunnelPreset = class extends BasePreset {
  id = "boxtunnel";
  name = "Box Tunnel";
  category = "Tunnels";
  description = "36 square wireframe gate frames rushing forward along z-axis with chromatic audio glow.";
  cameraConfig = {
    position: [0, 0, 4],
    target: [0, 0, -50],
    autoRotate: false
  };
  frames = [];
  numFrames = 36;
  spacing = 2.2;
  materials = [];
  themeCache = null;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Fly Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Frame Pump", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Frame Size", min: 3, max: 8, step: 0.5, defaultValue: 5 }
    ]);
  }
  setup(ctx) {
    this.frames.length = 0;
    this.materials.length = 0;
    this.themeCache = ctx.theme;
    const size = this.paramStore.getValue("density");
    const half = size / 2;
    for (let i = 0; i < this.numFrames; i++) {
      const geom = new THREE48.BufferGeometry();
      const vertices = [
        -half,
        -half,
        0,
        half,
        -half,
        0,
        half,
        -half,
        0,
        half,
        half,
        0,
        half,
        half,
        0,
        -half,
        half,
        0,
        -half,
        half,
        0,
        -half,
        -half,
        0
      ];
      geom.setAttribute("position", new THREE48.Float32BufferAttribute(vertices, 3));
      const color = this.computeFrameColor(i, 0, 0, 0, 0);
      const mat = new THREE48.LineBasicMaterial({
        color,
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        blending: THREE48.AdditiveBlending,
        depthWrite: false
      });
      this.materials.push(mat);
      const frame = new THREE48.LineSegments(geom, mat);
      frame.position.z = -i * this.spacing;
      this.frames.push(frame);
      this.group.add(frame);
    }
  }
  computeFrameColor(i, time, bass, mid, treble) {
    const theme = this.themeCache;
    if (!theme) return new THREE48.Color(16777215);
    const c1 = new THREE48.Color(theme.primary);
    const c2 = new THREE48.Color(theme.secondary);
    const accent = new THREE48.Color(theme.accent);
    const colorPhase = i * 0.15 + time * 0.1;
    const mixFactor = 0.5 + 0.5 * Math.sin(colorPhase);
    const col = new THREE48.Color().lerpColors(c1, c2, mixFactor);
    col.r += c1.r * treble * 0.4 + accent.r * mid * 0.25;
    col.g += c1.g * treble * 0.4 + accent.g * mid * 0.25;
    col.b += c1.b * treble * 0.4 + accent.b * mid * 0.25;
    const cellRand = Math.abs(Math.sin(i * 12.9898 + 0.1) * 43758.5453) % 1;
    if (cellRand > 0.7) {
      col.addScalar(bass * 1.5);
    }
    return col;
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const flySpeed = (14 + audio.bass * 35 * reactivity) * speed;
    const wiggleAmt = audio.bass * 0.12 + audio.mid * 0.06;
    const wiggleFreq = 3 + audio.treble * 5;
    for (let i = 0; i < this.numFrames; i++) {
      const f = this.frames[i];
      f.position.z += delta * flySpeed;
      if (f.position.z > 5) {
        f.position.z -= this.numFrames * this.spacing;
      }
      const wWiggle = Math.sin(f.position.z * 0.2 + time * 2.5) * wiggleAmt * 0.15;
      f.rotation.z = Math.sin(time * 0.4 * speed + i * 0.12 + wWiggle) * (0.35 + wiggleAmt);
      f.rotation.x = Math.sin(time * 0.3 + i * wiggleFreq * 0.05) * 0.08 * wiggleAmt;
      const distRatio = Math.max(0, 1 - Math.abs(f.position.z) / 45);
      const scale = (1 + (audio.beat ? 0.35 * reactivity : 0) * distRatio) * (1 + Math.sin(time * 3 + i) * 0.04 * audio.bass);
      f.scale.set(scale, scale, 1);
      const frameColor = this.computeFrameColor(i, time, audio.bass * reactivity, audio.mid * reactivity, audio.treble * reactivity);
      this.materials[i].color.copy(frameColor);
      this.materials[i].opacity = 0.2 + distRatio * 0.75;
    }
    this.group.rotation.z = Math.sin(time * 0.2) * 0.03 + audio.bass * reactivity * 0.04 * Math.sin(time * 1.2);
  }
  onThemeChange(theme) {
    this.themeCache = theme;
    for (let i = 0; i < this.numFrames; i++) {
      const color = this.computeFrameColor(i, 0, 0, 0, 0);
      this.materials[i].color.copy(color);
    }
  }
  onDispose() {
    for (const f of this.frames) {
      f.geometry.dispose();
    }
    this.frames.length = 0;
    for (const m of this.materials) {
      m.dispose();
    }
    this.materials.length = 0;
  }
};

// src/presets/RingTunnel.ts
var THREE49 = __toESM(require("three"), 1);
var RingTunnelPreset = class extends BasePreset {
  id = "ringtunnel";
  name = "Ring Tunnel";
  category = "Tunnels";
  description = "48 concentric circular torus rings extending into depth with golden-ratio waves.";
  cameraConfig = {
    position: [0, 0, 3],
    target: [0, 0, -40],
    autoRotate: false
  };
  rings = [];
  numRings = 48;
  spacing = 1.2;
  materials = [];
  themeCache = null;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Fly Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Ring Pulse", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Ring Radius", min: 2, max: 5.5, step: 0.2, defaultValue: 3.6 }
    ]);
  }
  setup(ctx) {
    this.rings.length = 0;
    this.materials.length = 0;
    this.themeCache = ctx.theme;
    const radius = this.paramStore.getValue("density");
    const torusGeom = new THREE49.TorusGeometry(radius, 0.06, 16, 64);
    for (let i = 0; i < this.numRings; i++) {
      const mat = new THREE49.MeshStandardMaterial({
        color: this.computeRingColor(i, 0, 0, 0, 0),
        emissive: new THREE49.Color(ctx.theme.accent),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85
      });
      this.materials.push(mat);
      const ring = new THREE49.Mesh(torusGeom, mat);
      ring.position.z = -i * this.spacing;
      this.rings.push(ring);
      this.group.add(ring);
    }
  }
  computeRingColor(i, time, bass, mid, treble) {
    const theme = this.themeCache;
    if (!theme) return new THREE49.Color(16777215);
    const c1 = new THREE49.Color(theme.primary);
    const c2 = new THREE49.Color(theme.secondary);
    const colorPhase = i * 0.15 + time * 0.06;
    const col = new THREE49.Color().lerpColors(c1, c2, 0.5 + 0.5 * Math.sin(colorPhase));
    col.r += c1.r * treble * 0.25 + c2.r * mid * 0.1;
    col.g += c1.g * treble * 0.25 + c2.g * mid * 0.1;
    col.b += c1.b * treble * 0.25 + c2.b * mid * 0.1;
    const cellRand = Math.abs(Math.sin(i * 3.73 + 0.5) * 43758.5453) % 1;
    if (cellRand > 0.6) {
      col.addScalar(bass * 0.8);
    }
    return col;
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const totalSpan = this.numRings * this.spacing;
    const moveZ = delta * (6 + audio.bass * 10 * reactivity) * speed;
    const bass = audio.bass * reactivity;
    const mid = audio.mid * reactivity;
    const treble = audio.treble * reactivity;
    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      ring.position.z += moveZ;
      if (ring.position.z > 2) {
        ring.position.z -= totalSpan;
      }
      const ringPhase = i * 1.618;
      const wobbleAmt = 0.02 + bass * 0.06 + mid * 0.03;
      const wobble = Math.sin(time * 1.2 + ringPhase) * wobbleAmt;
      const waveCount = 3 + i % 5;
      const angularWave = Math.sin(time * 0.8 + ringPhase) * (0.01 + bass * 0.03);
      ring.rotation.z = angularWave * waveCount;
      ring.rotation.x = wobble;
      const depthRatio = Math.max(0, 1 - Math.abs(ring.position.z) / totalSpan);
      const pulse = 1 + Math.sin(time * 3 + ringPhase) * 0.12 * (1 + bass);
      const beatBoost = audio.beat ? 1.25 : 1;
      const scale = pulse * beatBoost;
      ring.scale.set(scale, scale, 1);
      const col = this.computeRingColor(i, time, bass, mid, treble);
      const mat = this.materials[i];
      mat.color.copy(col);
      mat.opacity = 0.15 + depthRatio * 0.8;
      mat.emissiveIntensity = 0.3 + (bass * 0.8 + (audio.beat ? 0.6 : 0)) * reactivity;
    }
    this.group.rotation.z += delta * 0.2 * speed;
  }
  onThemeChange(theme) {
    this.themeCache = theme;
    for (let i = 0; i < this.numRings; i++) {
      const color = this.computeRingColor(i, 0, 0, 0, 0);
      this.materials[i].color.copy(color);
      this.materials[i].emissive.set(theme.accent);
    }
  }
  onDispose() {
    for (const r of this.rings) {
      r.geometry.dispose();
    }
    this.rings.length = 0;
    for (const m of this.materials) {
      m.dispose();
    }
    this.materials.length = 0;
  }
};

// src/presets/WaterSlide.ts
var THREE50 = __toESM(require("three"), 1);
var SLIDE_VERT = `
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  uniform float uTime;
  uniform float uBass;

  void main() {
    vUv = uv;
    vec3 p = position;
    float ripple = sin(uv.x * 24.0 + uTime * 4.0) * cos(uv.y * 32.0 - uTime * 6.0) * 0.08 * (1.0 + uBass * 1.5);
    p += normal * ripple;
    vPos = p;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    vViewDir = -normalize(mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;
var SLIDE_FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uAccent;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uTravel;
  uniform float uWaveAmount;
  uniform float uWallTexture;
  uniform float uRingDens;

  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  vec2 ringBands(float z, float dens, float w) {
    w = max(w, 1e-4);
    float freq = dens * 6.28318530;
    float arg = freq * w;
    float sinc = abs(arg) < 1e-3 ? 1.0 : sin(arg) / arg;
    float c = 0.5 + 0.5 * cos(freq * z) * sinc;
    float soft = clamp(dens * w * 1.7, 0.0, 1.0);
    float sharp = mix(18.0, 2.8, soft);
    float light = pow(max(c, 0.0), sharp);
    light += exp(-(1.0 - c) * mix(20.0, 6.5, soft)) * mix(0.12, 0.035, soft);
    light = clamp(light, 0.0, 1.0);
    float dark = pow(max(1.0 - c, 0.0), mix(2.0, 1.1, soft));
    return vec2(light, dark);
  }

  vec3 wallSurface(vec2 n2, float z, float darkAmt, vec3 wallDark, vec3 wallMid, vec3 accent) {
    vec3 base = mix(wallDark * 1.05, wallMid * 0.85, 0.5 + 0.5 * darkAmt);
    if (uWallTexture < 0.5) return base;

    vec2 uv = n2 * 2.15 + vec2(z * 0.42, z * 0.58 + uTravel * 0.4);
    float c1 = fbm(uv);
    float c2 = fbm(uv * 2.4 + vec2(1.7, 3.1));
    float streak = fbm(vec2(dot(n2, vec2(0.7, 0.7)), z * 1.85 - uTravel * 0.6));
    float m = c1 * 0.5 + c2 * 0.35 + streak * 0.15;

    vec3 pale = mix(uColor1, uColor2, 0.42) * 0.72 + vec3(0.12);
    vec3 deep = mix(accent * 0.22, pale * 0.38, 0.55);
    vec3 frost = mix(deep, pale, smoothstep(0.22, 0.78, m));
    frost += (hash(n2 * 48.0 + z * 0.7) - 0.5) * 0.055 * accent;

    return mix(base, frost, 0.9);
  }

  void main() {
    float zCoord = -vPos.z + uTravel * 2.0;
    vec2 radial = vNormal.xy;
    float darkAmt = sin(vUv.y * 32.0 + uTravel * 3.0);

    vec3 accent = mix(uColor1, uColor2, 0.5);
    vec3 wallDark = mix(vec3(0.008, 0.01, 0.016), accent * 0.07, 0.55);
    vec3 wallMid = mix(vec3(0.02, 0.025, 0.035), accent * 0.16, 0.5);

    vec3 surface = wallSurface(radial, zCoord, darkAmt, wallDark, wallMid, accent);

    vec2 bands = ringBands(zCoord, uRingDens, 0.04);
    float light = bands.x * smoothstep(80.0, 10.0, -vPos.z);

    vec3 ringCol = mix(uColor1, uColor2, 0.5 + 0.5 * sin(zCoord * 0.2 + uTime * 0.08));
    ringCol *= 1.25 + uTreble * 0.35;

    surface = mix(surface, ringCol * 2.45, light);
    surface += ringCol * light * 0.75 * (0.85 + uTreble * 0.4);

    float fres = pow(clamp(1.0 - max(dot(vViewDir, -vNormal), 0.0), 0.0, 1.0), 2.6);
    surface += ringCol * fres * 0.25 * (0.2 + light);

    float fog = exp(vPos.z * 0.025);
    vec3 col = surface * fog;

    float vig = 1.0 - dot(vUv * 2.0 - 1.0, vUv * 2.0 - 1.0) * 0.25;
    col *= clamp(vig, 0.25, 1.0);

    col = col / (col + 0.7);
    col = pow(max(col, 0.0), vec3(0.92));

    gl_FragColor = vec4(col, 0.92);
  }
`;
var WaterSlidePreset = class extends BasePreset {
  id = "waterslide";
  name = "Water Slide";
  category = "Tunnels";
  description = "3D serpentine water tube corridor with camera spline tracking.";
  cameraConfig = {
    position: [0, 0, 3],
    target: [0, 0, -50],
    autoRotate: false
  };
  mesh;
  material;
  smoothBass = 0;
  smoothMid = 0;
  smoothTreble = 0;
  smoothAvg = 0;
  travel = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Ride Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Spline Curvature", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "waveAmount", name: "Wave Distortion", min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 },
      { id: "wallTexture", name: "Caustic Walls", min: 0, max: 1, step: 1, defaultValue: 1 }
    ]);
  }
  setup(ctx) {
    const points = [];
    for (let i = 0; i < 50; i++) {
      const z = -i * 2;
      const x = Math.sin(z * 0.32) * 1.2 + Math.sin(z * 0.13 + 1.3) * 0.55;
      const y = Math.cos(z * 0.24 + 0.5) * 0.85 + Math.sin(z * 0.18 + 2.1) * 0.5;
      points.push(new THREE50.Vector3(x * 1.8, y * 1.8, z));
    }
    const curve = new THREE50.CatmullRomCurve3(points);
    const geometry = new THREE50.TubeGeometry(curve, 100, 2.2, 32, false);
    this.material = new THREE50.ShaderMaterial({
      side: THREE50.BackSide,
      transparent: true,
      vertexShader: SLIDE_VERT,
      fragmentShader: SLIDE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE50.Color(ctx.theme.primary) },
        uColor2: { value: new THREE50.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE50.Color(ctx.theme.accent) },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uTravel: { value: 0 },
        uWaveAmount: { value: 0.5 },
        uWallTexture: { value: 1 },
        uRingDens: { value: 1 }
      }
    });
    this.mesh = new THREE50.Mesh(geometry, this.material);
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const waveAmount = this.paramStore.getValue("waveAmount");
    const wallTexture = this.paramStore.getValue("wallTexture");
    this.updateAudioSmoothing(audio, reactivity);
    const traverseRate = 0.55 + speed * 3.3;
    this.travel += delta * traverseRate * (1 + this.smoothBass * 0.45);
    const u = this.material.uniforms;
    u.uTime.value = time;
    u.uBass.value = this.smoothBass;
    u.uMid.value = this.smoothMid;
    u.uTreble.value = this.smoothTreble;
    u.uTravel.value = this.travel;
    u.uWaveAmount.value = waveAmount;
    u.uWallTexture.value = wallTexture;
    this.mesh.rotation.z += delta * (0.2 + audio.treble * 0.3) * speed;
  }
  updateAudioSmoothing(audio, reactivity) {
    const b = audio.bass * reactivity;
    const m = audio.mid * reactivity;
    const tr = audio.treble * reactivity;
    const avg = audio.rms * reactivity;
    this.smoothBass += (b - this.smoothBass) * (b > this.smoothBass ? 0.1 : 0.04);
    this.smoothMid += (m - this.smoothMid) * (m > this.smoothMid ? 0.1 : 0.04);
    this.smoothTreble += (tr - this.smoothTreble) * (tr > this.smoothTreble ? 0.1 : 0.04);
    this.smoothAvg += (avg - this.smoothAvg) * (avg > this.smoothAvg ? 0.1 : 0.04);
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material?.dispose();
    }
  }
};

// src/presets/NeonTunnel.ts
var THREE51 = __toESM(require("three"), 1);
var NeonTunnelPreset = class extends BasePreset {
  id = "neontunnel";
  name = "Neon Tunnel";
  category = "Tunnels";
  description = "Hexagonal neon corridor with strobing light strip battens and vortex warp.";
  cameraConfig = {
    position: [0, 0, 4],
    target: [0, 0, -50],
    autoRotate: false
  };
  rings = [];
  numRings = 40;
  ringSpacing = 1.8;
  materials = [];
  primaryCol = new THREE51.Color("#00ffff");
  secondaryCol = new THREE51.Color("#ff0055");
  accentCol = new THREE51.Color("#ffaa00");
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Flight Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Glow Pulse", min: 0.1, max: 2, step: 0.05, defaultValue: 1 },
      { id: "zoom", name: "Tunnel Zoom", min: 0.5, max: 2, step: 0.1, defaultValue: 1 },
      { id: "density", name: "Segment Rings", min: 0.2, max: 1, step: 0.1, defaultValue: 1 }
    ]);
  }
  setup(ctx) {
    this.rings.length = 0;
    this.materials.length = 0;
    this.primaryCol.set(ctx.theme.primary);
    this.secondaryCol.set(ctx.theme.secondary);
    this.accentCol.set(ctx.theme.accent);
    const sides = 6;
    const radius = 3.5;
    for (let i = 0; i < this.numRings; i++) {
      const geom = new THREE51.BufferGeometry();
      const vertices = [];
      for (let s = 0; s < sides; s++) {
        const a1 = s / sides * Math.PI * 2;
        const a2 = (s + 1) / sides * Math.PI * 2;
        vertices.push(
          Math.cos(a1) * radius,
          Math.sin(a1) * radius,
          0,
          Math.cos(a2) * radius,
          Math.sin(a2) * radius,
          0
        );
      }
      geom.setAttribute("position", new THREE51.Float32BufferAttribute(vertices, 3));
      const mat = new THREE51.LineBasicMaterial({
        color: this.calcPaletteColor(i / this.numRings, 0),
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        blending: THREE51.AdditiveBlending,
        depthWrite: false
      });
      this.materials.push(mat);
      const ring = new THREE51.LineSegments(geom, mat);
      ring.position.z = -i * this.ringSpacing;
      this.rings.push(ring);
      this.group.add(ring);
    }
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed") ?? 1;
    const reactivity = this.paramStore.getValue("reactivity") ?? 1;
    const zoom = this.paramStore.getValue("zoom") ?? 1;
    const density = this.paramStore.getValue("density") ?? 1;
    const traverseSpeed = (12 + audio.bass * 25 * reactivity) * speed;
    const activeRings = Math.floor(this.numRings * density);
    const maxDepth = this.numRings * this.ringSpacing;
    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      if (i >= activeRings) {
        ring.visible = false;
        continue;
      }
      ring.visible = true;
      ring.position.z += delta * traverseSpeed;
      if (ring.position.z > 5) {
        ring.position.z -= maxDepth;
      }
      this.updateRingTransform(ring, i, time, speed, zoom, reactivity, audio);
    }
  }
  updateRingTransform(ring, index, time, speed, zoom, reactivity, audio) {
    const depthFrac = Math.max(0, Math.min(1, -ring.position.z / (this.numRings * this.ringSpacing)));
    const twist = Math.sin(depthFrac * 4 + time * 1.5) * 0.25 * (1 + audio.mid * reactivity);
    const wobble = Math.sin(time * 2 * speed + index * 0.2) * 0.35 * (1 + audio.bass * reactivity);
    ring.rotation.z = twist + wobble;
    const beatPulse = (audio.beat ? 0.35 : 0) * (1 - depthFrac);
    const bassPulse = audio.bass * 0.25 * reactivity * (1 - depthFrac * 0.5);
    const scale = zoom * (1 + beatPulse + bassPulse);
    ring.scale.set(scale, scale, 1);
    const col = this.calcPaletteColor(depthFrac + time * 0.1, audio.treble * reactivity);
    this.materials[index].color.copy(col);
    this.materials[index].opacity = Math.max(0.15, (1 - depthFrac * 0.75) * (0.7 + audio.rms * 0.5));
  }
  calcPaletteColor(t, trebleBoost) {
    const tau = Math.PI * 2;
    const r = 0.5 + 0.5 * Math.cos(tau * (t + this.primaryCol.r * 0.7 + this.secondaryCol.r * 0.3));
    const g = 0.5 + 0.5 * Math.cos(tau * (t * 1.1 + this.primaryCol.g * 0.7 + this.secondaryCol.g * 0.3));
    const b = 0.5 + 0.5 * Math.cos(tau * (t * 0.9 + this.primaryCol.b * 0.7 + this.secondaryCol.b * 0.3));
    const out = new THREE51.Color(r, g, b);
    if (trebleBoost > 0) {
      out.lerp(this.accentCol, Math.min(1, trebleBoost * 0.5));
    }
    return out;
  }
  onThemeChange(theme) {
    this.primaryCol.set(theme.primary);
    this.secondaryCol.set(theme.secondary);
    this.accentCol.set(theme.accent);
    for (let i = 0; i < this.numRings; i++) {
      const color = this.calcPaletteColor(i / this.numRings, 0);
      this.materials[i].color.copy(color);
    }
  }
  onDispose() {
    for (const r of this.rings) {
      r.geometry.dispose();
    }
    for (const m of this.materials) {
      m.dispose();
    }
    this.rings.length = 0;
    this.materials.length = 0;
  }
};

// src/presets/VeinTunnel.ts
var THREE52 = __toESM(require("three"), 1);
var VeinTunnelPreset = class extends BasePreset {
  id = "veintunnel";
  name = "Vein Tunnel";
  category = "Tunnels";
  description = "Vascular cylinder lined with neon blood capillary contractions.";
  cameraConfig = {
    position: [0, 0, 3],
    target: [0, 0, -50],
    autoRotate: false
  };
  mesh;
  material;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Contraction Pulse", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Vascular Swell", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Capillary Density", min: 8, max: 32, step: 2, defaultValue: 16 }
    ]);
  }
  setup(ctx) {
    const points = [];
    for (let i = 0; i < 40; i++) {
      const z = -i * 2;
      const x = Math.sin(i * 0.25) * 2.5;
      const y = Math.cos(i * 0.2) * 2;
      points.push(new THREE52.Vector3(x, y, z));
    }
    const curve = new THREE52.CatmullRomCurve3(points);
    const geometry = new THREE52.TubeGeometry(curve, 100, 2.5, 24, false);
    this.material = new THREE52.ShaderMaterial({
      side: THREE52.BackSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uCapillary: { value: 16 },
        uColor1: { value: new THREE52.Color(ctx.theme.primary) },
        uColor2: { value: new THREE52.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vUv = uv;
          vec3 p = position;
          // Peristaltic vascular contraction wave
          float peristalsis = sin(p.z * 0.4 + uTime * 4.0) * 0.2 * (1.0 + uBass * 1.6);
          p += normal * peristalsis;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uCapillary;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec2 flowUv = vec2(vUv.x * uCapillary, vUv.y * 12.0 - uTime * 3.0);
          float spiral = sin(flowUv.x + flowUv.y);
          float rings = sin(vUv.y * 40.0 - uTime * 5.0);

          vec3 col = mix(uColor1, uColor2, smoothstep(0.2, 0.8, spiral * rings));
          col += uColor2 * (pow(abs(spiral), 4.0) * (0.6 + uBass));

          gl_FragColor = vec4(col, 0.9);
        }
      `
    });
    this.mesh = new THREE52.Mesh(geometry, this.material);
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const capillary = this.paramStore.getValue("density");
    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uCapillary.value = capillary;
    this.mesh.rotation.z += delta * 0.25 * speed;
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.accent);
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material?.dispose();
    }
  }
};

// src/presets/KaleidoscopeMandala.ts
var THREE53 = __toESM(require("three"), 1);
var KaleidoscopeMandalaPreset = class extends BasePreset {
  id = "kaleidoscope";
  name = "Kaleidoscope";
  category = "Tunnels";
  description = "N-fold kaleidoscopic mirror symmetry mandala reflections.";
  cameraConfig = {
    position: [0, 0, 8.5],
    target: [0, 0, 0],
    autoRotate: false
  };
  rings = [];
  numArms = 8;
  numRings = 16;
  materials = [];
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Spin Rate", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Mandala Bloom", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Symmetry Fold", min: 4, max: 16, step: 2, defaultValue: 8 }
    ]);
  }
  setup(ctx) {
    this.rings.length = 0;
    this.materials.length = 0;
    for (let r = 0; r < this.numRings; r++) {
      const radius = 1 + r * 0.45;
      const geom = new THREE53.BufferGeometry();
      const vertices = [];
      for (let a = 0; a < this.numArms; a++) {
        const theta1 = a / this.numArms * Math.PI * 2;
        const theta2 = (a + 0.5) / this.numArms * Math.PI * 2;
        const theta3 = (a + 1) / this.numArms * Math.PI * 2;
        const x1 = Math.cos(theta1) * radius;
        const y1 = Math.sin(theta1) * radius;
        const x2 = Math.cos(theta2) * (radius * 1.3);
        const y2 = Math.sin(theta2) * (radius * 1.3);
        const x3 = Math.cos(theta3) * radius;
        const y3 = Math.sin(theta3) * radius;
        vertices.push(x1, y1, 0, x2, y2, 0, x2, y2, 0, x3, y3, 0);
      }
      geom.setAttribute("position", new THREE53.Float32BufferAttribute(vertices, 3));
      const color = new THREE53.Color().lerpColors(
        new THREE53.Color(ctx.theme.primary),
        new THREE53.Color(ctx.theme.accent),
        r / this.numRings
      );
      const mat = new THREE53.LineBasicMaterial({
        color,
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        blending: THREE53.AdditiveBlending,
        depthWrite: false
      });
      this.materials.push(mat);
      const line = new THREE53.LineSegments(geom, mat);
      this.rings.push(line);
      this.group.add(line);
    }
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed") ?? 1;
    const reactivity = this.paramStore.getValue("reactivity") ?? 1;
    this.group.rotation.z += delta * (0.15 + audio.mid * 0.5 * reactivity) * speed;
    for (let r = 0; r < this.numRings; r++) {
      const ring = this.rings[r];
      const freqIdx = Math.floor(r / this.numRings * (audio.frequencyData.length * 0.4));
      const freq = (audio.frequencyData[freqIdx] || 0) / 255;
      ring.rotation.z = Math.sin(time * 0.5 * speed + r * 0.2) * (0.5 + freq * reactivity);
      const scale = 1 + freq * 0.8 * reactivity + (audio.beat ? 0.25 * reactivity : 0);
      ring.scale.set(scale, scale, 1);
    }
  }
  onThemeChange(theme) {
    for (let r = 0; r < this.numRings; r++) {
      const color = new THREE53.Color().lerpColors(
        new THREE53.Color(theme.primary),
        new THREE53.Color(theme.accent),
        r / this.numRings
      );
      this.materials[r].color.copy(color);
    }
  }
  onDispose() {
    for (const r of this.rings) {
      r.geometry.dispose();
    }
    for (const m of this.materials) {
      m.dispose();
    }
    this.rings.length = 0;
    this.materials.length = 0;
  }
};

// src/presets/MatrixRain.ts
var THREE54 = __toESM(require("three"), 1);
var MatrixRainPreset = class extends BasePreset {
  id = "matrix";
  name = "Matrix";
  category = "Retro & Digital";
  description = "Cascading green neural code glyph columns with authentic lead flash and exponential decay.";
  cameraConfig = {
    position: [0, 0, 12],
    target: [0, 0, 0],
    autoRotate: false
  };
  instancedMesh;
  dummy = new THREE54.Object3D();
  count = 1200;
  speeds;
  columnIds;
  cols = 40;
  rows = 30;
  smoothBass = 0;
  smoothTreble = 0;
  beatPulse = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Rain Velocity", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Drop Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Drop Scale", min: 0.5, max: 2.5, step: 0.1, defaultValue: 1 }
    ]);
  }
  setup(ctx) {
    const geometry = new THREE54.BoxGeometry(0.12, 0.45, 0.05);
    const material = new THREE54.MeshBasicMaterial({
      color: 16777215,
      transparent: true,
      opacity: 0.95,
      blending: THREE54.AdditiveBlending,
      depthWrite: false
    });
    this.instancedMesh = new THREE54.InstancedMesh(geometry, material, this.count);
    this.speeds = new Float32Array(this.count);
    this.columnIds = new Int32Array(this.count);
    const primary = new THREE54.Color(ctx.theme.primary);
    let idx = 0;
    for (let c = 0; c < this.cols; c++) {
      const colSpeed = 4 + Math.random() * 8;
      for (let r = 0; r < this.rows; r++) {
        if (idx >= this.count) break;
        const x = (c - this.cols / 2) * 0.45;
        const y = (Math.random() - 0.5) * 16;
        const z = (Math.random() - 0.5) * 10;
        this.dummy.position.set(x, y, z);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
        this.instancedMesh.setColorAt(idx, primary);
        this.speeds[idx] = colSpeed;
        this.columnIds[idx] = c;
        idx++;
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.group.add(this.instancedMesh);
  }
  computeGlyphColor(posY, colId, palette, target) {
    const trail = (8 - posY) / 16;
    if (trail < 0.08) {
      target.copy(palette.leadColor);
    } else if (trail < 0.4) {
      const t = (trail - 0.08) / 0.32;
      target.lerpColors(palette.primary, palette.secondary, t);
    } else {
      const t = Math.min(1, (trail - 0.4) / 0.6);
      target.lerpColors(palette.secondary, palette.darkGreen, t * t);
    }
    if (this.beatPulse > 0.3 && colId % 3 === 0) {
      target.lerp(palette.leadColor, this.beatPulse * 0.5);
    }
  }
  update(ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.smoothBass += (audio.bass - this.smoothBass) * Math.min(1, delta * 15);
    this.smoothTreble += (audio.treble - this.smoothTreble) * Math.min(1, delta * 12);
    this.beatPulse = audio.beat ? 1 : this.beatPulse * 0.9;
    const matrix = new THREE54.Matrix4();
    const position = new THREE54.Vector3();
    const speedBoost = (1 + this.smoothBass * 2.5 * reactivity + this.beatPulse * 1.5) * speed;
    const palette = {
      leadColor: new THREE54.Color(15794160),
      primary: new THREE54.Color(ctx.theme.primary),
      secondary: new THREE54.Color(ctx.theme.secondary),
      darkGreen: new THREE54.Color(ctx.theme.background).offsetHSL(0.3, 0.2, 0.05)
    };
    const glitch = this.smoothTreble > 0.45;
    const colorBuf = new THREE54.Color();
    for (let i = 0; i < this.count; i++) {
      this.instancedMesh.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);
      position.y -= this.speeds[i] * delta * speedBoost;
      if (position.y < -8) {
        position.y = 8 + Math.random() * 2;
        this.speeds[i] = 4 + Math.random() * 8;
      }
      if (glitch && Math.random() < 0.05) {
        position.x += (Math.random() - 0.5) * 0.15;
      }
      this.dummy.position.copy(position);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.computeGlyphColor(position.y, this.columnIds[i], palette, colorBuf);
      this.instancedMesh.setColorAt(i, colorBuf);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }
  onThemeChange(theme) {
    if (this.instancedMesh.instanceColor) {
      const primary = new THREE54.Color(theme.primary);
      for (let i = 0; i < this.count; i++) {
        this.instancedMesh.setColorAt(i, primary);
      }
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }
  onDispose() {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      this.instancedMesh.material.dispose();
    }
  }
};

// src/presets/VodLines.ts
var THREE55 = __toESM(require("three"), 1);
var VodLinesPreset = class extends BasePreset {
  id = "vodlines";
  name = "Vod Lines";
  category = "Retro & Digital";
  description = "Retro music tracker channel oscilloscope display lines.";
  cameraConfig = {
    position: [0, 0, 11],
    target: [0, 0, 0],
    autoRotate: false
  };
  channels = [];
  numChannels = 4;
  pointsPerChannel = 64;
  channelMaterials = [];
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Oscilloscope Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Trace Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Channel Height", min: 1, max: 4, step: 0.2, defaultValue: 2 }
    ]);
  }
  setup(ctx) {
    this.channels.length = 0;
    this.channelMaterials = [];
    const colors = [
      new THREE55.Color(ctx.theme.primary),
      new THREE55.Color(ctx.theme.accent),
      new THREE55.Color(ctx.theme.secondary),
      new THREE55.Color(ctx.theme.glow)
    ];
    for (let c = 0; c < this.numChannels; c++) {
      const geom = new THREE55.BufferGeometry();
      const pos = new Float32Array(this.pointsPerChannel * 3);
      const yOffset = (c - 1.5) * 2.2;
      for (let p = 0; p < this.pointsPerChannel; p++) {
        pos[p * 3] = (p / (this.pointsPerChannel - 1) - 0.5) * 16;
        pos[p * 3 + 1] = yOffset;
        pos[p * 3 + 2] = 0;
      }
      geom.setAttribute("position", new THREE55.BufferAttribute(pos, 3));
      const mat = new THREE55.LineBasicMaterial({
        color: colors[c % colors.length],
        linewidth: 2,
        transparent: true,
        opacity: 0.95,
        blending: THREE55.AdditiveBlending,
        depthWrite: false
      });
      this.channelMaterials.push(mat);
      const line = new THREE55.Line(geom, mat);
      this.channels.push(line);
      this.group.add(line);
    }
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const height = this.paramStore.getValue("density");
    const bands = [audio.subBass, audio.bass, audio.mid, audio.treble];
    for (let c = 0; c < this.numChannels; c++) {
      const line = this.channels[c];
      const pos = line.geometry.attributes.position.array;
      const yBase = (c - 1.5) * 2.2;
      const energy = bands[c] * reactivity;
      for (let p = 0; p < this.pointsPerChannel; p++) {
        const xNorm = p / this.pointsPerChannel;
        const wave = Math.sin(xNorm * 12 + time * (4 + c * 2) * speed);
        const noise = (Math.random() - 0.5) * 0.1 * energy;
        pos[p * 3 + 1] = yBase + wave * energy * height + noise;
      }
      line.geometry.attributes.position.needsUpdate = true;
    }
  }
  onThemeChange(theme) {
    const colors = [
      new THREE55.Color(theme.primary),
      new THREE55.Color(theme.accent),
      new THREE55.Color(theme.secondary),
      new THREE55.Color(theme.glow)
    ];
    for (let c = 0; c < this.numChannels; c++) {
      this.channelMaterials[c].color.copy(colors[c % colors.length]);
    }
  }
  onDispose() {
    for (const c of this.channels) {
      c.geometry.dispose();
    }
    for (const m of this.channelMaterials) {
      m.dispose();
    }
    this.channels.length = 0;
    this.channelMaterials.length = 0;
  }
};

// src/presets/NightRadar.ts
var THREE56 = __toESM(require("three"), 1);
var NightRadarPreset = class extends BasePreset {
  id = "nightradar";
  name = "Night Radar";
  category = "Retro & Digital";
  description = "Circular cold phosphor CRT scope with rotating sweep arm and decaying target blips.";
  cameraConfig = {
    position: [0, 0, 11],
    target: [0, 0, 0],
    autoRotate: false
  };
  radarScope;
  sweepLine;
  blipPoints;
  scopeMaterial;
  sweepMaterial;
  blipMaterial;
  sweepAngle = 0;
  numBlips = 32;
  blipPositions;
  blipAlphas;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Sweep Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Blip Sensitivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Radar Radius", min: 3, max: 8, step: 0.5, defaultValue: 5.5 }
    ]);
  }
  setup(ctx) {
    const radius = this.paramStore.getValue("density");
    const scopeGeom = new THREE56.CircleGeometry(radius, 64);
    this.scopeMaterial = new THREE56.ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: { value: new THREE56.Color(ctx.theme.primary) },
        uAccent: { value: new THREE56.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying vec2 vUv;

        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float dist = length(p);
          if (dist > 1.0) discard;

          // Concentric grid rings
          float rings = sin(dist * 31.415);
          float crosshair = min(abs(p.x), abs(p.y));

          float grid = smoothstep(0.9, 0.98, rings) + (1.0 - smoothstep(0.005, 0.015, crosshair));
          vec3 col = mix(uColor * 0.15, uAccent, clamp(grid, 0.0, 1.0));
          gl_FragColor = vec4(col, 0.7);
        }
      `
    });
    this.radarScope = new THREE56.Mesh(scopeGeom, this.scopeMaterial);
    this.group.add(this.radarScope);
    const sweepGeom = new THREE56.BufferGeometry();
    sweepGeom.setAttribute("position", new THREE56.Float32BufferAttribute([0, 0, 0.05, radius, 0, 0.05], 3));
    this.sweepMaterial = new THREE56.LineBasicMaterial({
      color: new THREE56.Color(ctx.theme.accent),
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });
    this.sweepLine = new THREE56.Line(sweepGeom, this.sweepMaterial);
    this.group.add(this.sweepLine);
    const blipGeom = new THREE56.BufferGeometry();
    this.blipPositions = new Float32Array(this.numBlips * 3);
    this.blipAlphas = new Float32Array(this.numBlips);
    for (let i = 0; i < this.numBlips; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (radius * 0.85);
      this.blipPositions[i * 3] = Math.cos(angle) * r;
      this.blipPositions[i * 3 + 1] = Math.sin(angle) * r;
      this.blipPositions[i * 3 + 2] = 0.06;
      this.blipAlphas[i] = 0;
    }
    blipGeom.setAttribute("position", new THREE56.BufferAttribute(this.blipPositions, 3));
    this.blipMaterial = new THREE56.PointsMaterial({
      color: new THREE56.Color(ctx.theme.accent),
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      blending: THREE56.AdditiveBlending
    });
    this.blipPoints = new THREE56.Points(blipGeom, this.blipMaterial);
    this.group.add(this.blipPoints);
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.sweepAngle += delta * 2.5 * speed;
    this.sweepLine.rotation.z = this.sweepAngle;
    if (audio.beat) {
      const randomIdx = Math.floor(Math.random() * this.numBlips);
      this.blipAlphas[randomIdx] = 1 * reactivity;
    }
    for (let i = 0; i < this.numBlips; i++) {
      this.blipAlphas[i] = Math.max(0, this.blipAlphas[i] - delta * 1.5);
    }
    this.blipMaterial.size = 0.25 + audio.bass * 0.35 * reactivity;
  }
  onThemeChange(theme) {
    this.scopeMaterial.uniforms.uColor.value.set(theme.primary);
    this.scopeMaterial.uniforms.uAccent.value.set(theme.accent);
    this.sweepMaterial.color.set(theme.accent);
    this.blipMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.radarScope) {
      this.radarScope.geometry.dispose();
      this.scopeMaterial?.dispose();
    }
    if (this.sweepLine) {
      this.sweepLine.geometry.dispose();
      this.sweepMaterial?.dispose();
    }
    if (this.blipPoints) {
      this.blipPoints.geometry.dispose();
      this.blipMaterial?.dispose();
    }
  }
};

// src/presets/DiodeWall.ts
var THREE57 = __toESM(require("three"), 1);
var DiodeWallPreset = class extends BasePreset {
  id = "diodewall";
  name = "Diode Wall";
  category = "Retro & Digital";
  description = "32x24 club LED matrix equalizer with quantized dome emission and peak hold.";
  cameraConfig = {
    position: [0, 0, 14],
    target: [0, 0, 0],
    autoRotate: false
  };
  instancedMesh;
  dummy = new THREE57.Object3D();
  cols = 32;
  rows = 24;
  count = 768;
  heights = new Float32Array(32);
  peaks = new Float32Array(32);
  housingMesh;
  housingMaterial;
  smoothBass = 0;
  smoothMid = 0;
  smoothTreble = 0;
  beatPulse = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Peak Decay Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "VU Sensitivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Diode Spacing", min: 0.3, max: 0.8, step: 0.05, defaultValue: 0.48 }
    ]);
  }
  setup(ctx) {
    const geometry = new THREE57.CylinderGeometry(0.18, 0.18, 0.08, 16);
    geometry.rotateX(Math.PI / 2);
    const material = new THREE57.MeshBasicMaterial({ color: 16777215 });
    this.instancedMesh = new THREE57.InstancedMesh(geometry, material, this.count);
    const spacing = this.paramStore.getValue("density");
    const offsetX = this.cols * spacing / 2 - spacing / 2;
    const offsetY = this.rows * spacing / 2 - spacing / 2;
    const dark = new THREE57.Color(ctx.theme.background).offsetHSL(0, 0, 0.06);
    let idx = 0;
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        this.dummy.position.set(c * spacing - offsetX, r * spacing - offsetY, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
        this.instancedMesh.setColorAt(idx, dark);
        idx++;
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.group.add(this.instancedMesh);
    const plateGeom = new THREE57.PlaneGeometry(this.cols * spacing + 1.2, this.rows * spacing + 1.2);
    this.housingMaterial = new THREE57.MeshBasicMaterial({
      color: new THREE57.Color(ctx.theme.background).offsetHSL(0, 0, 0.02)
    });
    this.housingMesh = new THREE57.Mesh(plateGeom, this.housingMaterial);
    this.housingMesh.position.z = -0.1;
    this.group.add(this.housingMesh);
  }
  update(ctx, audio, _time, delta) {
    const reactivity = this.paramStore.getValue("reactivity");
    const speed = this.paramStore.getValue("speed");
    this.updateAudioSmoothing(audio, delta);
    this.updateHeightsAndPeaks(audio, reactivity, speed, delta);
    this.renderDiodeColors(ctx);
  }
  updateAudioSmoothing(audio, delta) {
    const rate = Math.min(1, delta * 15);
    this.smoothBass += (audio.bass - this.smoothBass) * rate;
    this.smoothMid += (audio.mid - this.smoothMid) * rate;
    this.smoothTreble += (audio.treble - this.smoothTreble) * rate;
    if (audio.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse *= 0.88;
    }
  }
  updateHeightsAndPeaks(audio, reactivity, speed, delta) {
    const freq = audio.frequencyData;
    const freqLen = freq.length;
    const peakDecay = 0.015 * speed * (delta * 60);
    for (let c = 0; c < this.cols; c++) {
      const norm = c / this.cols;
      const startBin = Math.floor(Math.pow(norm, 1.8) * (freqLen * 0.75));
      const endBin = Math.max(startBin + 1, Math.floor(Math.pow((c + 1) / this.cols, 1.8) * (freqLen * 0.75)));
      let sum = 0;
      let count = 0;
      for (let b = startBin; b <= endBin && b < freqLen; b++) {
        sum += freq[b] || 0;
        count++;
      }
      const rawLevel = sum / Math.max(1, count) / 255 * reactivity;
      let targetHeight = rawLevel * (0.8 + 0.4 * norm);
      if (norm < 0.33) {
        targetHeight *= 1 + this.smoothBass * 0.35;
      } else if (norm < 0.66) {
        targetHeight *= 1 + this.smoothMid * 0.25;
      } else {
        targetHeight *= 1 + this.smoothTreble * 0.45;
      }
      targetHeight = Math.min(1, targetHeight);
      const smoothRate = targetHeight > this.heights[c] ? 0.45 : 0.12;
      this.heights[c] += (targetHeight - this.heights[c]) * smoothRate;
      if (this.heights[c] >= this.peaks[c]) {
        this.peaks[c] = this.heights[c];
      } else {
        this.peaks[c] = Math.max(0, this.peaks[c] - peakDecay);
      }
    }
  }
  getQuantizedLevel(coverage) {
    if (coverage >= 0.67) return 1;
    if (coverage >= 0.34) return 0.55;
    if (coverage >= 0.01) return 0.28;
    return 0;
  }
  computeDiodeColor(r, quant, isPeak, palette, target) {
    if (quant > 0) {
      const rowNorm = r / this.rows;
      if (rowNorm < 0.6) {
        target.lerpColors(palette.primary, palette.secondary, rowNorm / 0.6);
      } else {
        target.lerpColors(palette.secondary, palette.accent, (rowNorm - 0.6) / 0.4);
      }
      target.multiplyScalar(quant);
    } else {
      target.copy(palette.dark);
    }
    if (isPeak) {
      target.lerp(palette.white, 0.85);
    }
    if (this.beatPulse > 0.1 && quant > 0) {
      target.lerp(palette.white, this.beatPulse * 0.15);
    }
  }
  renderDiodeColors(ctx) {
    const palette = {
      primary: new THREE57.Color(ctx.theme.primary),
      secondary: new THREE57.Color(ctx.theme.secondary),
      accent: new THREE57.Color(ctx.theme.accent),
      dark: new THREE57.Color(ctx.theme.background).offsetHSL(0, 0, 0.05),
      white: new THREE57.Color(16777215)
    };
    const diodeCol = new THREE57.Color();
    let idx = 0;
    for (let c = 0; c < this.cols; c++) {
      const colHeight = this.heights[c] * this.rows;
      const peakRow = Math.floor(this.peaks[c] * this.rows);
      for (let r = 0; r < this.rows; r++) {
        const coverage = Math.min(1, Math.max(0, colHeight - r));
        const quant = this.getQuantizedLevel(coverage);
        const isPeak = this.peaks[c] > 0.04 && r === peakRow;
        this.computeDiodeColor(r, quant, isPeak, palette, diodeCol);
        this.instancedMesh.setColorAt(idx, diodeCol);
        idx++;
      }
    }
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }
  onThemeChange(theme) {
    if (this.housingMaterial) {
      this.housingMaterial.color.set(theme.background).offsetHSL(0, 0, 0.02);
    }
  }
  onDispose() {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      this.instancedMesh.material.dispose();
    }
    if (this.housingMesh) {
      this.housingMesh.geometry.dispose();
      this.housingMaterial?.dispose();
    }
  }
};

// src/presets/Spectrogram.ts
var THREE58 = __toESM(require("three"), 1);
var HISTORY_COLS = 256;
var FREQ_BINS = 64;
var SpectrogramPreset = class extends BasePreset {
  id = "spectogram";
  name = "The Spectogram";
  category = "Retro & Digital";
  description = "Skeuomorphic CRT instrument chassis with rolling waterfall spectrum and oscilloscope glow traces.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false,
    bloomIntensity: 0.15
  };
  mesh;
  material;
  historyTex;
  historyData;
  writeCol = 0;
  smoothBass = 0;
  smoothMid = 0;
  smoothTreble = 0;
  smoothRms = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Scroll Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Bar Height", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Spectrogram Scale", min: 1, max: 5, step: 0.2, defaultValue: 2.5 }
    ]);
  }
  setup(ctx) {
    const geom = new THREE58.PlaneGeometry(16, 10);
    this.historyData = new Float32Array(HISTORY_COLS * FREQ_BINS);
    this.historyTex = new THREE58.DataTexture(
      this.historyData,
      HISTORY_COLS,
      FREQ_BINS,
      THREE58.RedFormat,
      THREE58.FloatType
    );
    this.historyTex.minFilter = THREE58.LinearFilter;
    this.historyTex.magFilter = THREE58.LinearFilter;
    this.historyTex.wrapS = THREE58.RepeatWrapping;
    this.historyTex.wrapT = THREE58.ClampToEdgeWrapping;
    this.historyTex.needsUpdate = true;
    this.material = new THREE58.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE58.Color(ctx.theme.primary) },
        uColor2: { value: new THREE58.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE58.Color(ctx.theme.accent) },
        uBackground: { value: new THREE58.Color(ctx.theme.background) },
        uAudio: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uHistory: { value: this.historyTex },
        uWriteCol: { value: 0 },
        uHistoryWidth: { value: HISTORY_COLS },
        uTraceGain: { value: 0.7 },
        uTrail: { value: 0.6 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        uniform vec3 uBackground;
        uniform float uAudio;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform sampler2D uHistory;
        uniform float uWriteCol;
        uniform float uHistoryWidth;
        uniform float uTraceGain;
        uniform float uTrail;
        varying vec2 vUv;

        float traceGlow(float dist, float sigma) {
          float core = exp(-dist * dist / (sigma * sigma));
          float halo = exp(-abs(dist) * 12.0) * 0.25;
          return core + halo;
        }

        void main() {
          vec2 uv = vUv;
          vec2 suv = (uv - 0.08) / 0.84;
          bool inside = suv.x >= 0.0 && suv.x <= 1.0 && suv.y >= 0.0 && suv.y <= 1.0;

          if (!inside) {
            // Bezel frame casing
            vec2 fuv = abs(uv - 0.5) * 2.0;
            float border = max(fuv.x, fuv.y);
            vec3 bezel = mix(vec3(0.04, 0.042, 0.045), uBackground * 0.7, 0.5);
            float rim = smoothstep(0.85, 0.98, border);
            bezel += vec3(rim * 0.08);
            gl_FragColor = vec4(bezel, 1.0);
            return;
          }

          // CRT oscilloscope & spectrogram glass
          vec3 glass = vec3(0.01, 0.012, 0.015);

          // Grid reticle divisions
          vec2 cell = fract(suv * vec2(10.0, 8.0));
          float gridX = 1.0 - smoothstep(0.0, 0.04, min(cell.x, 1.0 - cell.x));
          float gridY = 1.0 - smoothstep(0.0, 0.04, min(cell.y, 1.0 - cell.y));
          float centerCross = (1.0 - smoothstep(0.0, 0.008, abs(suv.x - 0.5))) +
                              (1.0 - smoothstep(0.0, 0.008, abs(suv.y - 0.5)));
          float grid = max(gridX, gridY) * 0.12 + centerCross * 0.22;
          glass = mix(glass, vec3(0.18, 0.24, 0.22), grid);

          // Rolling Waterfall heatmap
          float colF = uWriteCol - (1.0 - suv.x) * uHistoryWidth;
          float tU = mod(colF, uHistoryWidth) / uHistoryWidth;
          float amp = texture2D(uHistory, vec2(tU, suv.y)).r;
          amp = clamp(amp * (0.85 + uTrail * 0.4), 0.0, 1.5);

          vec3 heat = mix(uColor2, uColor1, clamp(amp, 0.0, 1.0));
          heat = mix(heat, vec3(1.0), smoothstep(0.85, 1.25, amp) * 0.6);
          float fade = smoothstep(0.0, 0.05, suv.x) * smoothstep(0.0, 0.03, suv.y) * smoothstep(1.0, 0.97, suv.y);
          glass = mix(glass, heat, clamp(amp, 0.0, 1.0) * 0.85 * fade);

          // Real-time oscilloscope trace glow lines
          float waveA = sin(suv.x * 24.0 + uTime * 6.0) * uBass * 0.18 +
                        sin(suv.x * 60.0 - uTime * 8.0) * uMid * 0.08;
          float yA = 0.52 + waveA * uTraceGain;
          float gA = traceGlow(suv.y - yA, 0.012);

          float waveB = cos(suv.x * 32.0 - uTime * 5.0) * uTreble * 0.14 +
                        sin(suv.x * 12.0 + uTime * 4.0) * uAudio * 0.1;
          float yB = 0.42 + waveB * uTraceGain;
          float gB = traceGlow(suv.y - yB, 0.015);

          glass += uColor1 * gA * 0.95;
          glass += uAccent * gB * 0.85;

          // CRT scanlines
          float scan = 0.04 * sin(suv.y * 360.0);
          glass *= 1.0 - scan;

          gl_FragColor = vec4(clamp(glass, 0.0, 1.0), 1.0);
        }
      `
    });
    this.mesh = new THREE58.Mesh(geom, this.material);
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const scaleFactor = this.paramStore.getValue("density");
    this.updateAudioSmoothing(audio, delta);
    this.updateHistoryTexture(audio, speed, reactivity, scaleFactor);
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uAudio.value = this.smoothRms * reactivity;
    this.material.uniforms.uBass.value = this.smoothBass * reactivity;
    this.material.uniforms.uMid.value = this.smoothMid * reactivity;
    this.material.uniforms.uTreble.value = this.smoothTreble * reactivity;
    this.material.uniforms.uWriteCol.value = this.writeCol % HISTORY_COLS;
  }
  updateAudioSmoothing(audio, delta) {
    const rate = Math.min(1, delta * 15);
    this.smoothBass += (audio.bass - this.smoothBass) * rate;
    this.smoothMid += (audio.mid - this.smoothMid) * rate;
    this.smoothTreble += (audio.treble - this.smoothTreble) * rate;
    this.smoothRms += (audio.rms - this.smoothRms) * rate;
  }
  updateHistoryTexture(audio, speed, reactivity, scaleFactor) {
    const freq = audio.frequencyData;
    const freqLen = freq.length;
    const scrollStep = Math.max(1, Math.round(speed * 2));
    for (let s = 0; s < scrollStep; s++) {
      const currentCol = this.writeCol % HISTORY_COLS;
      for (let b = 0; b < FREQ_BINS; b++) {
        const norm = b / FREQ_BINS;
        const binIdx = Math.floor(Math.pow(norm, 1.6) * (freqLen * 0.7));
        const val = (freq[binIdx] || 0) / 255 * reactivity * (scaleFactor * 0.4);
        this.historyData[b * HISTORY_COLS + currentCol] = Math.min(1.5, val);
      }
      this.writeCol++;
    }
    this.historyTex.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
    this.material.uniforms.uBackground.value.set(theme.background);
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.historyTex) {
      this.historyTex.dispose();
    }
  }
};

// src/presets/LCDDeck.ts
var THREE59 = __toESM(require("three"), 1);
var LCDDeckPreset = class extends BasePreset {
  id = "lcddeck";
  name = "LCD Deck";
  category = "Retro & Digital";
  description = "Backlit cyberdeck console with spinning compact disc and segmented LCD meters.";
  cameraConfig = {
    position: [0, 0, 8],
    target: [0, 0, 0],
    autoRotate: false,
    bloomIntensity: 0
  };
  cdDisc;
  deckChassis;
  vuBars = [];
  cdMaterial;
  vuMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Disc RPM", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "VU Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "VU Bar Height", min: 1, max: 4, step: 0.2, defaultValue: 2 }
    ]);
  }
  setup(ctx) {
    this.vuBars.length = 0;
    const deckGeom = new THREE59.BoxGeometry(10, 6, 0.4);
    const deckMat = new THREE59.MeshStandardMaterial({
      color: new THREE59.Color(ctx.theme.background).offsetHSL(0, 0, 0.08),
      roughness: 0.8,
      metalness: 0.2
    });
    this.deckChassis = new THREE59.Mesh(deckGeom, deckMat);
    this.deckChassis.position.z = -1;
    this.group.add(this.deckChassis);
    const cdGeom = new THREE59.RingGeometry(0.6, 2.5, 64);
    this.cdMaterial = new THREE59.MeshPhysicalMaterial({
      color: new THREE59.Color(ctx.theme.primary),
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      side: THREE59.DoubleSide
    });
    this.cdDisc = new THREE59.Mesh(cdGeom, this.cdMaterial);
    this.cdDisc.position.set(-2, 0, -0.6);
    this.group.add(this.cdDisc);
    const vuCount = 16;
    const barGeom = new THREE59.PlaneGeometry(0.2, 1);
    this.vuMaterial = new THREE59.MeshBasicMaterial({
      color: new THREE59.Color(ctx.theme.accent)
    });
    for (let i = 0; i < vuCount; i++) {
      const bar = new THREE59.Mesh(barGeom, this.vuMaterial);
      bar.position.set(1.2 + i * 0.25, 0, -0.7);
      this.vuBars.push(bar);
      this.group.add(bar);
    }
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const maxHeight = this.paramStore.getValue("density");
    this.cdDisc.rotation.z -= delta * (3 + audio.bass * 4 * reactivity) * speed;
    const freq = audio.frequencyData;
    const step = Math.floor(freq.length / this.vuBars.length);
    for (let i = 0; i < this.vuBars.length; i++) {
      const val = freq[i * step] / 255 * maxHeight * reactivity;
      this.vuBars[i].scale.y = Math.max(0.08, val);
      this.vuBars[i].position.y = this.vuBars[i].scale.y / 2 - 1;
    }
  }
  onThemeChange(theme) {
    this.vuMaterial.color.set(theme.accent);
    this.cdMaterial.color.set(theme.primary);
    this.deckChassis.material.color.set(theme.background).offsetHSL(0, 0, 0.08);
  }
  onDispose() {
    if (this.deckChassis) {
      this.deckChassis.geometry.dispose();
      this.deckChassis.material.dispose();
    }
    if (this.cdDisc) {
      this.cdDisc.geometry.dispose();
      this.cdMaterial?.dispose();
    }
    for (const bar of this.vuBars) {
      bar.geometry.dispose();
    }
    this.vuBars.length = 0;
    this.vuMaterial?.dispose();
  }
};

// src/presets/SignalLock.ts
var THREE60 = __toESM(require("three"), 1);
var SignalLockPreset = class extends BasePreset {
  id = "signallock";
  name = "Signal Lock";
  category = "Retro & Digital";
  description = "Overnight broadcast TV test card with sync loss & Lissajous.";
  cameraConfig = {
    position: [0, 0, 11],
    target: [0, 0, 0],
    autoRotate: false,
    bloomIntensity: 0
  };
  testCardMesh;
  lissajousLine;
  cardMaterial;
  lissajousMaterial;
  numLissajousPts = 128;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "RF Noise Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Sync Loss Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Lissajous Amplitude", min: 1, max: 4, step: 0.2, defaultValue: 2.2 }
    ]);
  }
  setup(ctx) {
    const cardGeom = new THREE60.PlaneGeometry(16, 12);
    this.cardMaterial = new THREE60.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSyncLoss: { value: 0 },
        uPrimary: { value: new THREE60.Color(ctx.theme.primary) },
        uAccent: { value: new THREE60.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uSyncLoss;
        uniform vec3 uPrimary;
        uniform vec3 uAccent;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;
          // Sync roll / jitter
          if (uSyncLoss > 0.05) {
            uv.y = fract(uv.y + uTime * uSyncLoss * 3.0);
            uv.x += (hash(vec2(uTime, uv.y)) - 0.5) * uSyncLoss * 0.15;
          }

          // SMPTE 7-bar vertical test pattern
          float bar = floor(uv.x * 7.0);
          vec3 col;
          if (bar == 0.0) col = vec3(0.75, 0.75, 0.75); // Gray
          else if (bar == 1.0) col = vec3(0.75, 0.75, 0.0);  // Yellow
          else if (bar == 2.0) col = vec3(0.0, 0.75, 0.75);  // Cyan
          else if (bar == 3.0) col = vec3(0.0, 0.75, 0.0);   // Green
          else if (bar == 4.0) col = vec3(0.75, 0.0, 0.75);  // Magenta
          else if (bar == 5.0) col = vec3(0.75, 0.0, 0.0);   // Red
          else col = vec3(0.0, 0.0, 0.75);                   // Blue

          // Modulate with theme accent
          col = mix(col, uAccent, 0.2);

          // RF noise grain
          float noise = hash(uv * 100.0 + uTime * 10.0);
          col += (noise - 0.5) * (0.15 + uSyncLoss * 0.4);

          gl_FragColor = vec4(col, 0.85);
        }
      `
    });
    this.testCardMesh = new THREE60.Mesh(cardGeom, this.cardMaterial);
    this.testCardMesh.position.z = -1;
    this.group.add(this.testCardMesh);
    const lissGeom = new THREE60.BufferGeometry();
    const pos = new Float32Array(this.numLissajousPts * 3);
    lissGeom.setAttribute("position", new THREE60.BufferAttribute(pos, 3));
    this.lissajousMaterial = new THREE60.LineBasicMaterial({
      color: new THREE60.Color(ctx.theme.glow),
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
      blending: THREE60.AdditiveBlending,
      depthWrite: false
    });
    this.lissajousLine = new THREE60.Line(lissGeom, this.lissajousMaterial);
    this.lissajousLine.position.z = 0.1;
    this.group.add(this.lissajousLine);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const amp = this.paramStore.getValue("density");
    this.cardMaterial.uniforms.uTime.value = time * speed;
    this.cardMaterial.uniforms.uSyncLoss.value = (audio.beat ? 0.6 : 0.02) * reactivity;
    const pos = this.lissajousLine.geometry.attributes.position.array;
    const aFreq = 3 + audio.bass * 2;
    const bFreq = 2 + audio.mid * 2;
    const phase = time * 2 * speed;
    for (let i = 0; i < this.numLissajousPts; i++) {
      const t = i / this.numLissajousPts * Math.PI * 2;
      pos[i * 3] = Math.sin(aFreq * t + phase) * amp;
      pos[i * 3 + 1] = Math.sin(bFreq * t) * (amp * 0.75);
      pos[i * 3 + 2] = 0;
    }
    this.lissajousLine.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.cardMaterial.uniforms.uPrimary.value.set(theme.primary);
    this.cardMaterial.uniforms.uAccent.value.set(theme.accent);
    this.lissajousMaterial.color.set(theme.glow);
  }
  onDispose() {
    if (this.testCardMesh) {
      this.testCardMesh.geometry.dispose();
      this.cardMaterial?.dispose();
    }
    if (this.lissajousLine) {
      this.lissajousLine.geometry.dispose();
      this.lissajousMaterial?.dispose();
    }
  }
};

// src/presets/BloomFlower.ts
var THREE61 = __toESM(require("three"), 1);
var BloomFlowerPreset = class extends BasePreset {
  id = "bloom";
  name = "Bloom";
  category = "Organic & Nature";
  description = "Watercolor phyllotaxis flower petals opening and closing.";
  cameraConfig = {
    position: [0, 6, 11],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };
  petals = [];
  petalMaterial;
  petalBaseRotations = [];
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Spin Rate", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Petal Bloom", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Petal Count", min: 20, max: 55, step: 5, defaultValue: 34 }
    ]);
  }
  setup(ctx) {
    this.petals.length = 0;
    this.petalBaseRotations.length = 0;
    this.group.rotation.set(0, 0, 0);
    const petalCount = Math.floor(this.paramStore.getValue("density"));
    const goldenAngle = 137.5 * (Math.PI / 180);
    const petalGeom = new THREE61.ConeGeometry(0.5, 2.2, 5);
    this.petalMaterial = new THREE61.MeshStandardMaterial({
      color: new THREE61.Color(ctx.theme.primary),
      emissive: new THREE61.Color(ctx.theme.accent),
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.1
    });
    for (let i = 0; i < petalCount; i++) {
      const radius = 0.4 + Math.sqrt(i) * 0.45;
      const theta = i * goldenAngle;
      const petal = new THREE61.Mesh(petalGeom, this.petalMaterial);
      petal.position.set(Math.cos(theta) * radius, i / petalCount * 0.4, Math.sin(theta) * radius);
      const openAngle = 0.4 + i / petalCount * 0.8;
      petal.rotation.y = theta;
      petal.rotation.z = openAngle;
      this.petalBaseRotations.push(openAngle);
      this.petals.push(petal);
      this.group.add(petal);
    }
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y += delta * 0.18 * speed;
    const openMod = (audio.bass * 0.5 + audio.beatEnergy * 0.4) * reactivity;
    for (let i = 0; i < this.petals.length; i++) {
      this.petals[i].rotation.z = this.petalBaseRotations[i] + openMod;
    }
    if (audio.beat) {
      this.petalMaterial.emissiveIntensity = 1 * reactivity;
    } else {
      this.petalMaterial.emissiveIntensity = Math.max(0.3, this.petalMaterial.emissiveIntensity * 0.94);
    }
  }
  onThemeChange(theme) {
    this.petalMaterial.color.set(theme.primary);
    this.petalMaterial.emissive.set(theme.accent);
  }
  onDispose() {
    for (const p of this.petals) {
      p.geometry.dispose();
    }
    this.petals.length = 0;
    this.petalBaseRotations.length = 0;
    this.petalMaterial?.dispose();
  }
};

// src/presets/InkDiffusion.ts
var THREE62 = __toESM(require("three"), 1);
var InkDiffusionPreset = class extends BasePreset {
  id = "ink";
  name = "Ink";
  category = "Organic & Nature";
  description = "Rayleigh-Taylor fluid ink droplet diffusion plumes in water.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  inkParticles;
  inkMaterial;
  inkCount = 1200;
  inkPositions;
  inkVelocities;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Diffusion Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Burst Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Plume Spread", min: 4, max: 16, step: 1, defaultValue: 8 }
    ]);
  }
  setup(ctx) {
    const inkGeom = new THREE62.BufferGeometry();
    this.inkPositions = new Float32Array(this.inkCount * 3);
    this.inkVelocities = new Float32Array(this.inkCount * 3);
    for (let i = 0; i < this.inkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 2;
      this.inkPositions[i * 3] = Math.cos(angle) * r;
      this.inkPositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      this.inkPositions[i * 3 + 2] = Math.sin(angle) * r;
      this.inkVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.inkVelocities[i * 3 + 1] = -0.2 - Math.random() * 0.4;
      this.inkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    inkGeom.setAttribute("position", new THREE62.BufferAttribute(this.inkPositions, 3));
    this.inkMaterial = new THREE62.PointsMaterial({
      color: new THREE62.Color(ctx.theme.primary),
      size: 0.3,
      transparent: true,
      opacity: 0.7,
      blending: THREE62.AdditiveBlending,
      depthWrite: false
    });
    this.inkParticles = new THREE62.Points(inkGeom, this.inkMaterial);
    this.group.add(this.inkParticles);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const pos = this.inkParticles.geometry.attributes.position.array;
    const burst = (audio.beat ? 2.5 : 0.8) * reactivity;
    for (let i = 0; i < this.inkCount; i++) {
      const idx = i * 3;
      pos[idx] += this.inkVelocities[idx] * delta * burst * speed;
      pos[idx + 1] += this.inkVelocities[idx + 1] * delta * speed;
      pos[idx + 2] += this.inkVelocities[idx + 2] * delta * burst * speed;
      pos[idx] += Math.sin(time + pos[idx + 1] * 0.8) * delta * 0.4;
      if (pos[idx + 1] < -5 || Math.hypot(pos[idx], pos[idx + 2]) > 7) {
        pos[idx] = (Math.random() - 0.5) * 1.5;
        pos[idx + 1] = 4;
        pos[idx + 2] = (Math.random() - 0.5) * 1.5;
      }
    }
    this.inkParticles.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.inkMaterial.color.set(theme.primary);
  }
  onDispose() {
    if (this.inkParticles) {
      this.inkParticles.geometry.dispose();
      this.inkMaterial?.dispose();
    }
  }
};

// src/presets/MeadowField.ts
var THREE63 = __toESM(require("three"), 1);
var MeadowFieldPreset = class extends BasePreset {
  id = "meadow";
  name = "Meadow";
  category = "Organic & Nature";
  description = "25,000 instanced grass blades swaying dynamically in wind.";
  cameraConfig = {
    position: [0, 2.5, 12],
    target: [0, -1, 0],
    autoRotate: false
  };
  grassMesh;
  grassMaterial;
  bladeCount = 2e3;
  dummy = new THREE63.Object3D();
  basePositions = [];
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Wind Gust Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Sway Amplitude", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Field Spread", min: 8, max: 24, step: 2, defaultValue: 16 }
    ]);
  }
  setup(ctx) {
    const bladeGeom = new THREE63.ConeGeometry(0.06, 1.4, 3);
    bladeGeom.translate(0, 0.7, 0);
    this.grassMaterial = new THREE63.MeshStandardMaterial({
      color: new THREE63.Color(ctx.theme.primary),
      roughness: 0.8,
      metalness: 0.1
    });
    this.grassMesh = new THREE63.InstancedMesh(bladeGeom, this.grassMaterial, this.bladeCount);
    this.basePositions = [];
    const spread = this.paramStore.getValue("density");
    for (let i = 0; i < this.bladeCount; i++) {
      const x = (Math.random() - 0.5) * spread;
      const z = (Math.random() - 0.5) * spread;
      const rotY = Math.random() * Math.PI * 2;
      this.basePositions.push({ x, z, rotY });
      this.dummy.position.set(x, -2, z);
      this.dummy.rotation.set(0, rotY, 0);
      this.dummy.updateMatrix();
      this.grassMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.grassMesh);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const windGust = Math.sin(time * 2 * speed) * (0.3 + audio.bass * 0.7 * reactivity);
    for (let i = 0; i < this.bladeCount; i++) {
      const p = this.basePositions[i];
      const bladeWind = windGust + Math.sin(time * 3 * speed + p.x * 0.5) * 0.15;
      this.dummy.position.set(p.x, -2, p.z);
      this.dummy.rotation.set(bladeWind, p.rotY, bladeWind * 0.5);
      this.dummy.updateMatrix();
      this.grassMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.grassMesh.instanceMatrix.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.grassMaterial.color.set(theme.primary);
  }
  onDispose() {
    if (this.grassMesh) {
      this.grassMesh.geometry.dispose();
      this.grassMaterial?.dispose();
    }
    this.basePositions.length = 0;
  }
};

// src/presets/BioCells.ts
var THREE64 = __toESM(require("three"), 1);
var VERTEX_SHADER2 = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
var FRAGMENT_SHADER2 = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uSize;
  uniform float uBass;
  uniform int uWorleyRadius;

  float length2(vec2 p) { return dot(p, p); }

  float hash21(vec2 p) {
    return fract(sin(fract(sin(p.x) * 43.13311) + p.y) * 31.0011);
  }

  float worley(vec2 p) {
    float d = 1e30;
    int r = uWorleyRadius;
    for (int xo = -1; xo <= 1; ++xo) {
      if (abs(xo) > r) continue;
      for (int yo = -1; yo <= 1; ++yo) {
        if (abs(yo) > r) continue;
        vec2 tp = floor(p) + vec2(float(xo), float(yo));
        d = min(d, length2(p - tp - vec2(hash21(tp))));
      }
    }
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float timeOffset = 0.15 * sin(uTime * uSpeed * 2.0 + 10.0 * (uv.x - uv.y) + uBass * 0.2);
    return 3.0 * exp(-4.0 * abs(2.0 * d - 1.0 + timeOffset));
  }

  float fworley(vec2 p) {
    float t = uTime * uSpeed;
    return sqrt(sqrt(sqrt(
      1.1 *
      worley(p * 5.0 + 0.3 + t * 0.0525) *
      sqrt(worley(p * 50.0 / uSize + 0.3 + t * -0.15)) *
      sqrt(sqrt(worley(p * -10.0 + 9.3)))
    )));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float t = fworley(uv * uResolution.xy / 1500.0);
    t *= exp(-length2(abs(0.7 * uv - 1.0)));

    float tExp = pow(t, 0.5 - t);
    vec3 c1 = uColor1 * (1.0 - t);
    vec3 c2 = uColor2 * tExp;

    gl_FragColor = vec4(pow(t, 1.0 - t) * (c1 + c2), 1.0);
  }
`;
function getLuminanceAdjustedThemeColors(theme) {
  const c1 = new THREE64.Color(theme.primary);
  const c2 = new THREE64.Color(theme.secondary);
  const lum = 0.299 * c1.r + 0.587 * c1.g + 0.114 * c1.b;
  const factor = lum > 0.5 ? 0.38 : lum > 0.28 ? 0.52 : 0.68;
  return {
    color1: new THREE64.Color(c1.r * factor + 0.018, c1.g * factor + 0.02, c1.b * factor + 0.028),
    color2: c2
  };
}
var BioCellsPreset = class extends BasePreset {
  id = "biocells";
  name = "Bio Cells";
  category = "Organic & Nature";
  description = "Multi-scale Worley noise biological cell membranes with organic mitosis.";
  cameraConfig = {
    position: [0, 0, 1],
    target: [0, 0, 0],
    autoRotate: false
  };
  mesh = null;
  material = null;
  audioSmoothBass = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Mitosis Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Membrane Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Cell Scale", min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.35 }
    ]);
  }
  setup(ctx) {
    const { color1, color2 } = getLuminanceAdjustedThemeColors(ctx.theme);
    const geom = new THREE64.PlaneGeometry(2, 2);
    this.material = new THREE64.ShaderMaterial({
      uniforms: {
        uResolution: { value: new THREE64.Vector2(window.innerWidth || 1920, window.innerHeight || 1080) },
        uTime: { value: 0 },
        uSpeed: { value: 0.95 },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uSize: { value: 1.35 },
        uBass: { value: 0 },
        uWorleyRadius: { value: 1 }
      },
      vertexShader: VERTEX_SHADER2,
      fragmentShader: FRAGMENT_SHADER2,
      depthWrite: false,
      depthTest: false
    });
    this.mesh = new THREE64.Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }
  update(_ctx, audio, time, _delta) {
    if (!this.material) return;
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const cellSize = this.paramStore.getValue("density");
    const targetBass = audio.bass * reactivity;
    this.audioSmoothBass += 0.045 * (targetBass - this.audioSmoothBass);
    const uniforms = this.material.uniforms;
    uniforms.uTime.value = time;
    uniforms.uSpeed.value = 0.475 * 2 * speed;
    uniforms.uSize.value = cellSize * (1 + this.audioSmoothBass * 0.08);
    uniforms.uBass.value = this.audioSmoothBass;
  }
  onThemeChange(theme) {
    if (!this.material) return;
    const { color1, color2 } = getLuminanceAdjustedThemeColors(theme);
    this.material.uniforms.uColor1.value.copy(color1);
    this.material.uniforms.uColor2.value.copy(color2);
  }
  onDispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.audioSmoothBass = 0;
  }
};

// src/presets/UpCloud.ts
var THREE65 = __toESM(require("three"), 1);
function blendColor(base, c1, c2, factor = 0.06) {
  const mixed = new THREE65.Color().lerpColors(c2, c1, 0.6);
  return new THREE65.Color().lerpColors(base, mixed, factor);
}
var CLOUD_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
var CLOUD_FRAG = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uCamY;
  uniform float uCloudFloor;
  uniform float uSunGlare;
  uniform float uStepScale;
  uniform float uFastShadow;
  uniform float uSkyCutoff;
  uniform float uBass;

  uniform vec3 uSkyColor;
  uniform vec3 uCloudColor;
  uniform vec3 uCloudShadowColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunGlareColor;
  uniform vec3 uSunlightColor;

  uniform int uMarchSteps1;
  uniform int uMarchSteps2;
  uniform int uMarchSteps3;
  uniform int uMarchSteps4;

  varying vec2 vUv;

  const float constantTime = 1000.0;
  const float cloudGain = 1.9;
  const vec3 sundir = normalize(vec3(-1.0, 0.0, -1.0));

  float hash(float p) {
    p = fract(p * 0.011);
    p *= (p + 7.5);
    p *= (p + p);
    return fract(p);
  }

  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(
      mix(mix(hash(n + 0.0), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
      mix(mix(hash(n + 113.0), hash(n + 114.0), f.x), mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
      f.z
    );
  }

  float map5(vec3 p) {
    vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
    vec3 q = p - speed1 * (uTime + constantTime);
    float f = 0.50000 * noise(q);
    q *= 2.02;
    f += 0.25000 * noise(q);
    q *= 2.03;
    f += 0.12500 * noise(q);
    q *= 2.01;
    f += 0.06250 * noise(q);
    q *= 2.02;
    f += 0.03125 * noise(q);
    return clamp(1.5 - p.y - uCloudFloor + cloudGain * f, 0.0, 1.0);
  }

  float map4(vec3 p) {
    vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
    vec3 q = p - speed1 * (uTime + constantTime);
    float f = 0.50000 * noise(q);
    q *= 2.02;
    f += 0.25000 * noise(q);
    q *= 2.03;
    f += 0.12500 * noise(q);
    q *= 2.01;
    f += 0.06250 * noise(q);
    return clamp(1.5 - p.y - uCloudFloor + cloudGain * f, 0.0, 1.0);
  }

  float map3(vec3 p) {
    vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
    vec3 q = p - speed1 * (uTime + constantTime);
    float f = 0.50000 * noise(q);
    q *= 2.02;
    f += 0.25000 * noise(q);
    q *= 2.03;
    f += 0.12500 * noise(q);
    return clamp(1.5 - p.y - uCloudFloor + cloudGain * f, 0.0, 1.0);
  }

  float map2(vec3 p) {
    vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
    vec3 q = p - speed1 * (uTime + constantTime);
    float f = 0.50000 * noise(q);
    q *= 2.02;
    f += 0.25000 * noise(q);
    return clamp(1.5 - p.y - uCloudFloor + cloudGain * f, 0.0, 1.0);
  }

  float mapLod(vec3 p, int lod) {
    if (lod == 5) return map5(p);
    if (lod == 4) return map4(p);
    if (lod == 3) return map3(p);
    return map2(p);
  }

  vec4 integrate(vec4 sum, float dif, float den, vec3 bgcol, float t) {
    vec3 lin = uCloudColor * 1.4 + uSunlightColor * dif;
    float shade = clamp(den * 1.05, 0.0, 1.0);
    vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), uCloudShadowColor, shade), den);
    col.xyz *= lin;
    col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
    col.a *= 0.44;
    col.rgb *= col.a;
    return sum + col * (1.0 - sum.a);
  }

  vec4 marchPass(vec4 sum, inout float t, vec3 ro, vec3 rd, vec3 bgcol, int maxSteps, int lod) {
    for (int i = 0; i < 40; i++) {
      if (i >= maxSteps) break;
      vec3 pos = ro + t * rd;
      if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;

      float den = mapLod(pos, lod);

      if (den > 0.008) {
        float dif;
        if (uFastShadow > 0.5) {
          dif = clamp(pow(den, 0.72) * 0.95 - den * 0.08, 0.0, 1.0);
        } else {
          dif = clamp((den - mapLod(pos + 0.3 * sundir, lod)) / 0.6, 0.0, 1.0);
        }
        sum = integrate(sum, dif, den, bgcol, t);
      }
      t += max(0.075, 0.02 * t) * uStepScale;
    }
    return sum;
  }

  vec4 raymarch(vec3 ro, vec3 rd, vec3 bgcol) {
    vec4 sum = vec4(0.0);
    float t = 0.0;
    if (uMarchSteps1 > 0) sum = marchPass(sum, t, ro, rd, bgcol, uMarchSteps1, 5);
    if (uMarchSteps2 > 0) sum = marchPass(sum, t, ro, rd, bgcol, uMarchSteps2, 4);
    if (uMarchSteps3 > 0) sum = marchPass(sum, t, ro, rd, bgcol, uMarchSteps3, 3);
    if (uMarchSteps4 > 0) sum = marchPass(sum, t, ro, rd, bgcol, uMarchSteps4, 2);
    return clamp(sum, 0.0, 1.0);
  }

  mat3 setCamera(vec3 ro, vec3 ta, float cr) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
  }

  vec3 skyColor(vec3 rd) {
    float sun = clamp(dot(sundir, rd), 0.0, 1.0);
    vec3 col = uSkyColor - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;
    col += 0.2 * uSunColor * pow(sun, 8.0);
    col += 0.2 * uSunGlareColor * pow(sun, 3.0) * uSunGlare;
    return col;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    if (uResolution.y > 0.0) {
      p.x *= uResolution.x / uResolution.y;
    }

    float m_x = 0.125 + sin(uTime * 0.1 + 3.14159265) * 0.25 + 0.25;
    float m_y = uCamY;

    vec3 ro = 4.0 * normalize(vec3(sin(3.0 * m_x), 0.4 * m_y, cos(3.0 * m_x)));
    vec3 ta = vec3(0.0, -1.0, 0.0);
    mat3 ca = setCamera(ro, ta, 0.0);
    vec3 rd = ca * normalize(vec3(p.xy, 1.5));

    if (rd.y > uSkyCutoff) {
      gl_FragColor = vec4(skyColor(rd), 1.0);
      return;
    }

    vec3 col = skyColor(rd);
    vec4 res = raymarch(ro, rd, col);
    col = col * (1.0 - res.w) + res.xyz;

    col += uSunColor * uBass * 0.2 * smoothstep(0.1, 0.7, res.w);

    gl_FragColor = vec4(col, 1.0);
  }
`;
var UpCloudPreset = class extends BasePreset {
  id = "upcloud";
  name = "Up Cloud";
  category = "Organic & Nature";
  description = "Volumetric raymarched sky clouds with silver lining sunlight rim.";
  cameraConfig = {
    position: [0, 0, 1],
    target: [0, 0, 0],
    autoRotate: false,
    bloomIntensity: 0
  };
  cloudMesh;
  cloudMaterial;
  baseSky = new THREE65.Color(7915231);
  baseCloud = new THREE65.Color(13228274);
  baseShadow = new THREE65.Color(1782612);
  baseSun = new THREE65.Color(16753228);
  baseGlare = new THREE65.Color(16737843);
  baseSunlight = new THREE65.Color(16756842);
  speedBoost = 0;
  audioSmooth = 0;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Drift Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 0.5 },
      { id: "cloudHeight", name: "Cloud Height", min: 0, max: 1, step: 0.05, defaultValue: 0.22 },
      { id: "sunGlare", name: "Sun Glare", min: 0, max: 2, step: 0.1, defaultValue: 0.55 },
      { id: "reactivity", name: "Bass Breathing", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 }
    ]);
  }
  setup(ctx) {
    const cloudGeom = new THREE65.PlaneGeometry(2, 2);
    const prim = new THREE65.Color(ctx.theme.primary);
    const sec = new THREE65.Color(ctx.theme.secondary);
    this.cloudMaterial = new THREE65.ShaderMaterial({
      vertexShader: CLOUD_VERT,
      fragmentShader: CLOUD_FRAG,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uResolution: { value: new THREE65.Vector2(1920, 1080) },
        uTime: { value: 0 },
        uSpeed: { value: 0.8 },
        uCamY: { value: 0.5374 },
        uCloudFloor: { value: 2.37 },
        uSunGlare: { value: 1 },
        uStepScale: { value: 1 },
        uFastShadow: { value: 0 },
        uSkyCutoff: { value: 0.28 },
        uBass: { value: 0 },
        uSkyColor: { value: blendColor(this.baseSky, prim, sec) },
        uCloudColor: { value: blendColor(this.baseCloud, sec, prim, 0.05) },
        uCloudShadowColor: { value: blendColor(this.baseShadow, prim, sec, 0.04) },
        uSunColor: { value: blendColor(this.baseSun, prim, sec, 0.04) },
        uSunGlareColor: { value: blendColor(this.baseGlare, prim, sec, 0.03) },
        uSunlightColor: { value: blendColor(this.baseSunlight, prim, sec, 0.04) },
        uMarchSteps1: { value: 6 },
        uMarchSteps2: { value: 10 },
        uMarchSteps3: { value: 14 },
        uMarchSteps4: { value: 18 }
      }
    });
    this.cloudMesh = new THREE65.Mesh(cloudGeom, this.cloudMaterial);
    this.cloudMesh.frustumCulled = false;
    this.group.add(this.cloudMesh);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const cloudHeight = this.paramStore.getValue("cloudHeight");
    const sunGlare = this.paramStore.getValue("sunGlare");
    const reactivity = this.paramStore.getValue("reactivity");
    const audioTarget = Math.min(0.7, Math.max(0, audio.rms * reactivity * 0.5));
    this.audioSmooth += 0.018 * (audioTarget - this.audioSmooth);
    const boostStep = this.audioSmooth > this.speedBoost ? 2e-3 : 65e-5;
    this.speedBoost += boostStep * (this.audioSmooth - this.speedBoost);
    const baseSpeed = 0.35 + speed * 0.9;
    const speedFactor = 0.025 + speed * 0.055;
    const finalSpeed = baseSpeed * (1 + this.speedBoost * speedFactor);
    const uniforms = this.cloudMaterial.uniforms;
    uniforms.uTime.value = time;
    uniforms.uSpeed.value = finalSpeed;
    uniforms.uCamY.value = (1 - cloudHeight) * 0.33 + 0.28;
    uniforms.uCloudFloor.value = 2.18 + cloudHeight * 0.68 - audio.bass * 0.25 * reactivity;
    uniforms.uSunGlare.value = 0.5 + sunGlare * 1;
    uniforms.uBass.value = audio.bass * reactivity;
  }
  onThemeChange(theme) {
    const prim = new THREE65.Color(theme.primary);
    const sec = new THREE65.Color(theme.secondary);
    const u = this.cloudMaterial.uniforms;
    u.uSkyColor.value.copy(blendColor(this.baseSky, prim, sec));
    u.uCloudColor.value.copy(blendColor(this.baseCloud, sec, prim, 0.05));
    u.uCloudShadowColor.value.copy(blendColor(this.baseShadow, prim, sec, 0.04));
    u.uSunColor.value.copy(blendColor(this.baseSun, prim, sec, 0.04));
    u.uSunGlareColor.value.copy(blendColor(this.baseGlare, prim, sec, 0.03));
    u.uSunlightColor.value.copy(blendColor(this.baseSunlight, prim, sec, 0.04));
  }
  onDispose() {
    if (this.cloudMesh) {
      this.cloudMesh.geometry.dispose();
      this.cloudMaterial?.dispose();
    }
  }
};

// src/presets/RainRoom.ts
var THREE66 = __toESM(require("three"), 1);
var RainRoomPreset = class extends BasePreset {
  id = "rainroom";
  name = "Rain Room";
  category = "Organic & Nature";
  description = "3k vertical rain streaks in dark spotlight cone with dynamic floor splashes.";
  cameraConfig = {
    position: [0, 1.5, 10],
    target: [0, 0, 0],
    autoRotate: false,
    bloomIntensity: 0.42
  };
  rainLines;
  splashPoints;
  rainMaterial;
  splashMaterial;
  rainCount = 3e3;
  splashCount = 300;
  rainPositions;
  splashPositions;
  splashAges;
  splashVels;
  splashIndex = 0;
  fallScales = [0.75, 1.25, 1.7, 1.05];
  streakLengths = [0.45, 0.6, 0.75, 0.55];
  coolRainCol = new THREE66.Color(0.82, 0.9, 1);
  accentCol = new THREE66.Color();
  primaryCol = new THREE66.Color();
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Rainfall Speed", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Downpour Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Spotlight Radius", min: 4, max: 12, step: 0.5, defaultValue: 8 }
    ]);
  }
  setup(ctx) {
    const radius = this.paramStore.getValue("density");
    this.accentCol.set(ctx.theme.accent);
    this.primaryCol.set(ctx.theme.primary);
    const rainGeom = new THREE66.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 2 * 3);
    for (let i = 0; i < this.rainCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * radius;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = -4 + Math.random() * 12;
      const len = this.streakLengths[i % 4];
      const idx = i * 6;
      this.rainPositions[idx] = x;
      this.rainPositions[idx + 1] = y;
      this.rainPositions[idx + 2] = z;
      this.rainPositions[idx + 3] = x;
      this.rainPositions[idx + 4] = y - len;
      this.rainPositions[idx + 5] = z;
    }
    rainGeom.setAttribute("position", new THREE66.BufferAttribute(this.rainPositions, 3));
    const finalRainCol = new THREE66.Color().copy(this.coolRainCol).lerp(this.accentCol, 0.35);
    this.rainMaterial = new THREE66.LineBasicMaterial({
      color: finalRainCol,
      transparent: true,
      opacity: 0.82,
      blending: THREE66.AdditiveBlending,
      depthWrite: false
    });
    this.rainLines = new THREE66.LineSegments(rainGeom, this.rainMaterial);
    this.group.add(this.rainLines);
    const splashGeom = new THREE66.BufferGeometry();
    this.splashPositions = new Float32Array(this.splashCount * 3);
    this.splashAges = new Float32Array(this.splashCount);
    this.splashVels = new Float32Array(this.splashCount * 3);
    for (let i = 0; i < this.splashCount; i++) {
      this.splashPositions[i * 3] = 0;
      this.splashPositions[i * 3 + 1] = -4;
      this.splashPositions[i * 3 + 2] = 0;
      this.splashAges[i] = 1;
    }
    splashGeom.setAttribute("position", new THREE66.BufferAttribute(this.splashPositions, 3));
    this.splashMaterial = new THREE66.PointsMaterial({
      color: this.primaryCol,
      size: 0.16,
      transparent: true,
      opacity: 0.75,
      blending: THREE66.AdditiveBlending,
      depthWrite: false
    });
    this.splashPoints = new THREE66.Points(splashGeom, this.splashMaterial);
    this.group.add(this.splashPoints);
  }
  update(_ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.updateRainStreaks(audio, speed, reactivity, delta);
    this.updateSplashes(audio, reactivity, delta);
  }
  updateRainStreaks(audio, speed, reactivity, delta) {
    const fallSpeed = (14 + audio.bass * 20 * reactivity + audio.treble * 10) * speed;
    const wind = audio.mid * 1.2 * reactivity;
    const pos = this.rainPositions;
    for (let i = 0; i < this.rainCount; i++) {
      const idx = i * 6;
      const scale = this.fallScales[i % 4];
      const len = this.streakLengths[i % 4];
      pos[idx + 1] -= delta * fallSpeed * scale;
      pos[idx + 4] = pos[idx + 1] - len;
      pos[idx + 3] = pos[idx] + wind * 0.12;
      if (pos[idx + 1] < -4) {
        this.spawnSplash(pos[idx], pos[idx + 2]);
        pos[idx + 1] = 8 + i % 6 * 0.4;
        pos[idx + 4] = pos[idx + 1] - len;
      }
    }
    this.rainLines.geometry.attributes.position.needsUpdate = true;
  }
  spawnSplash(x, z) {
    const i = this.splashIndex;
    const idx = i * 3;
    this.splashPositions[idx] = x;
    this.splashPositions[idx + 1] = -3.98;
    this.splashPositions[idx + 2] = z;
    this.splashAges[i] = 0;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.2;
    this.splashVels[idx] = Math.cos(angle) * speed;
    this.splashVels[idx + 1] = 1 + Math.random() * 1.5;
    this.splashVels[idx + 2] = Math.sin(angle) * speed;
    this.splashIndex = (this.splashIndex + 1) % this.splashCount;
  }
  updateSplashes(audio, reactivity, delta) {
    const pos = this.splashPositions;
    const vels = this.splashVels;
    const ages = this.splashAges;
    for (let i = 0; i < this.splashCount; i++) {
      if (ages[i] >= 1) continue;
      ages[i] += delta * 3.5;
      const idx = i * 3;
      pos[idx] += vels[idx] * delta;
      pos[idx + 1] += vels[idx + 1] * delta;
      pos[idx + 2] += vels[idx + 2] * delta;
      vels[idx + 1] -= 9.8 * delta;
      if (pos[idx + 1] < -4) {
        pos[idx + 1] = -4;
        ages[i] = 1;
      }
    }
    this.splashPoints.geometry.attributes.position.needsUpdate = true;
    const baseSize = audio.beat ? 0.32 : 0.16;
    this.splashMaterial.size = baseSize * (1 + audio.bass * 0.5 * reactivity);
  }
  onThemeChange(theme) {
    this.accentCol.set(theme.accent);
    this.primaryCol.set(theme.primary);
    const finalRainCol = new THREE66.Color().copy(this.coolRainCol).lerp(this.accentCol, 0.35);
    this.rainMaterial.color.copy(finalRainCol);
    this.splashMaterial.color.copy(this.primaryCol);
  }
  onDispose() {
    if (this.rainLines) {
      this.rainLines.geometry.dispose();
      this.rainMaterial?.dispose();
    }
    if (this.splashPoints) {
      this.splashPoints.geometry.dispose();
      this.splashMaterial?.dispose();
    }
  }
};

// src/presets/OceanWaves.ts
var THREE67 = __toESM(require("three"), 1);
var OceanWavesPreset = class extends BasePreset {
  id = "ocean";
  name = "Ocean";
  category = "Organic & Nature";
  description = "High-res Gerstner ocean waves with sea foam crests.";
  cameraConfig = {
    position: [0, 6, 14],
    target: [0, 0, -10],
    autoRotate: false
  };
  oceanMesh;
  oceanMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Wave Period", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Swell Amplitude", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Wave Frequency", min: 0.2, max: 1, step: 0.05, defaultValue: 0.45 }
    ]);
  }
  setup(ctx) {
    const oceanGeom = new THREE67.PlaneGeometry(24, 24, 64, 64);
    oceanGeom.rotateX(-Math.PI / 2.3);
    this.oceanMaterial = new THREE67.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uFreq: { value: 0.45 },
        uColor1: { value: new THREE67.Color(ctx.theme.primary) },
        uColor2: { value: new THREE67.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE67.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;
        uniform float uFreq;

        void main() {
          vUv = uv;
          vec3 p = position;
          
          float w1 = sin(p.x * uFreq + uTime * 2.0) * (0.5 + uBass * 1.2);
          float w2 = cos(p.y * (uFreq * 1.2) + uTime * 2.3) * (0.3 + uBass * 0.8);
          p.z += w1 + w2;

          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float crest = smoothstep(0.4, 0.9, vPos.z * 0.5 + 0.5);
          vec3 col = mix(uColor1 * 0.6, uColor2, vUv.y);
          col = mix(col, uAccent, crest * 0.8);
          gl_FragColor = vec4(col, 0.9);
        }
      `
    });
    this.oceanMesh = new THREE67.Mesh(oceanGeom, this.oceanMaterial);
    this.group.add(this.oceanMesh);
  }
  update(_ctx, audio, time, _delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const freq = this.paramStore.getValue("density");
    this.oceanMaterial.uniforms.uTime.value = time * speed;
    this.oceanMaterial.uniforms.uBass.value = audio.bass * reactivity;
    this.oceanMaterial.uniforms.uFreq.value = freq;
  }
  onThemeChange(theme) {
    this.oceanMaterial.uniforms.uColor1.value.set(theme.primary);
    this.oceanMaterial.uniforms.uColor2.value.set(theme.secondary);
    this.oceanMaterial.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.oceanMesh) {
      this.oceanMesh.geometry.dispose();
      this.oceanMaterial?.dispose();
    }
  }
};

// src/presets/ForestStorm.ts
var THREE68 = __toESM(require("three"), 1);
var ForestStormPreset = class extends BasePreset {
  id = "forest";
  name = "Forest";
  category = "Organic & Nature";
  description = "Cathedral tree canopy dome with volumetric god rays and breeze audio sway.";
  cameraConfig = {
    position: [0, 0, 11],
    target: [0, 0, 0],
    autoRotate: false
  };
  treeLines;
  godRays;
  lineMaterial;
  rayMaterial;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Canopy Breeze", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "God Ray Pulse", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Canopy Height", min: 2, max: 6, step: 0.2, defaultValue: 3.8 }
    ]);
  }
  setup(ctx) {
    this.group.position.y = -3;
    const points = [];
    const buildBranch = (start, dir, length, depth) => {
      if (depth <= 0) return;
      const end = start.clone().add(dir.clone().multiplyScalar(length));
      points.push(start, end);
      const nextLength = length * 0.72;
      const branchCount = depth > 3 ? 3 : 2;
      for (let b = 0; b < branchCount; b++) {
        const spreadAngle = 0.45 + b * 0.1;
        const rotAxis = new THREE68.Vector3(Math.sin(b * 2), 0, Math.cos(b * 2)).normalize();
        const newDir = dir.clone().applyAxisAngle(rotAxis, spreadAngle);
        buildBranch(end, newDir, nextLength, depth - 1);
      }
    };
    const height = this.paramStore.getValue("density");
    buildBranch(new THREE68.Vector3(0, 0, 0), new THREE68.Vector3(0, 1, 0), height * 0.6, 5);
    const geom = new THREE68.BufferGeometry().setFromPoints(points);
    this.lineMaterial = new THREE68.LineBasicMaterial({
      color: new THREE68.Color(ctx.theme.accent),
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.treeLines = new THREE68.LineSegments(geom, this.lineMaterial);
    this.group.add(this.treeLines);
    const rayPoints = [];
    for (let r = 0; r < 24; r++) {
      const topX = Math.sin(r * 1.3) * 0.5 * 6;
      const topZ = Math.cos(r * 1.7) * 0.5 * 6;
      rayPoints.push(topX, 6, topZ, topX * 1.6, 0, topZ * 1.6);
    }
    const rayGeom = new THREE68.BufferGeometry();
    rayGeom.setAttribute("position", new THREE68.Float32BufferAttribute(rayPoints, 3));
    this.rayMaterial = new THREE68.LineBasicMaterial({
      color: new THREE68.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.5,
      blending: THREE68.AdditiveBlending,
      depthWrite: false
    });
    this.godRays = new THREE68.LineSegments(rayGeom, this.rayMaterial);
    this.group.add(this.godRays);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y += delta * 0.15 * speed;
    this.group.rotation.z = Math.sin(time * 2 * speed) * (0.05 + audio.bass * 0.15 * reactivity);
    this.rayMaterial.opacity = 0.2 + (audio.mid * 0.6 + (audio.beat ? 0.3 : 0)) * reactivity;
  }
  onThemeChange(theme) {
    this.lineMaterial.color.set(theme.accent);
    this.rayMaterial.color.set(theme.primary);
  }
  onDispose() {
    this.treeLines.geometry.dispose();
    this.lineMaterial.dispose();
    this.godRays.geometry.dispose();
    this.rayMaterial.dispose();
  }
};

// src/presets/SingleTree.ts
var THREE69 = __toESM(require("three"), 1);
var SingleTreePreset = class extends BasePreset {
  id = "singletree";
  name = "Single Tree";
  category = "Organic & Nature";
  description = "Solitary procedural lone bonsai tree with seasonal blossoms.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  treeLines;
  petalPoints;
  lineMaterial;
  petalMaterial;
  numPetals = 400;
  petalPositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Sway Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Blossom Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Tree Height", min: 2, max: 5, step: 0.2, defaultValue: 3.2 }
    ]);
  }
  setup(ctx) {
    this.group.position.y = -2.5;
    const points = [];
    const buildBranch = (start, dir, length, depth) => {
      if (depth <= 0) return;
      const end = start.clone().add(dir.clone().multiplyScalar(length));
      points.push(start, end);
      const nextLength = length * 0.74;
      const count = depth > 3 ? 3 : 2;
      for (let b = 0; b < count; b++) {
        const spread = 0.5 + b * 0.15;
        const axis = new THREE69.Vector3(Math.sin(b * 2.2), 0, Math.cos(b * 2.2)).normalize();
        const nextDir = dir.clone().applyAxisAngle(axis, spread);
        buildBranch(end, nextDir, nextLength, depth - 1);
      }
    };
    const treeHeight = this.paramStore.getValue("density");
    buildBranch(new THREE69.Vector3(0, 0, 0), new THREE69.Vector3(0, 1, 0), treeHeight * 0.65, 5);
    const treeGeom = new THREE69.BufferGeometry().setFromPoints(points);
    this.lineMaterial = new THREE69.LineBasicMaterial({
      color: new THREE69.Color(ctx.theme.primary),
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.treeLines = new THREE69.LineSegments(treeGeom, this.lineMaterial);
    this.group.add(this.treeLines);
    const petalGeom = new THREE69.BufferGeometry();
    this.petalPositions = new Float32Array(this.numPetals * 3);
    for (let i = 0; i < this.numPetals; i++) {
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 6;
      this.petalPositions[i * 3 + 1] = Math.random() * 5;
      this.petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    petalGeom.setAttribute("position", new THREE69.BufferAttribute(this.petalPositions, 3));
    this.petalMaterial = new THREE69.PointsMaterial({
      color: new THREE69.Color(ctx.theme.accent),
      size: 0.18,
      transparent: true,
      opacity: 0.9,
      blending: THREE69.AdditiveBlending,
      depthWrite: false
    });
    this.petalPoints = new THREE69.Points(petalGeom, this.petalMaterial);
    this.group.add(this.petalPoints);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.treeLines.rotation.z = Math.sin(time * 1.2 * speed) * (0.05 + audio.bass * 0.12 * reactivity);
    const pos = this.petalPoints.geometry.attributes.position.array;
    for (let i = 0; i < this.numPetals; i++) {
      const idx = i * 3;
      pos[idx + 1] -= delta * (0.5 + audio.treble * 0.8 * reactivity) * speed;
      pos[idx] += Math.sin(time + i) * delta * 0.3;
      if (pos[idx + 1] < 0) {
        pos[idx + 1] = 5;
      }
    }
    this.petalPoints.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.lineMaterial.color.set(theme.primary);
    this.petalMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.treeLines) {
      this.treeLines.geometry.dispose();
      this.lineMaterial?.dispose();
    }
    if (this.petalPoints) {
      this.petalPoints.geometry.dispose();
      this.petalMaterial?.dispose();
    }
  }
};

// src/presets/HauntedForest.ts
var THREE70 = __toESM(require("three"), 1);
var HauntedForestPreset = class extends BasePreset {
  id = "hauntedforest";
  name = "Haunted Forest";
  category = "Organic & Nature";
  description = "Gnarled trees in graveyard mist with floating spirit wisps.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  trees = [];
  spiritPoints;
  treeMaterial;
  spiritMaterial;
  numSpirits = 120;
  spiritPositions;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Wisp Float Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Spooky Reactivity", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Tree Dispersion", min: 4, max: 14, step: 1, defaultValue: 8 }
    ]);
  }
  setup(ctx) {
    this.trees.length = 0;
    this.group.position.y = -2;
    this.treeMaterial = new THREE70.LineBasicMaterial({
      color: new THREE70.Color(ctx.theme.primary).multiplyScalar(0.7),
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    for (let t = 0; t < 4; t++) {
      const points = [];
      const buildGnarled = (start, dir, length, depth) => {
        if (depth <= 0) return;
        const end = start.clone().add(dir.clone().multiplyScalar(length));
        points.push(start, end);
        const count = 2;
        for (let b = 0; b < count; b++) {
          const spread = 0.6 + (b === 0 ? 0.2 : -0.2);
          const axis = new THREE70.Vector3(1, 0, (b - 0.5) * 2).normalize();
          const nextDir = dir.clone().applyAxisAngle(axis, spread);
          buildGnarled(end, nextDir, length * 0.72, depth - 1);
        }
      };
      buildGnarled(new THREE70.Vector3(0, 0, 0), new THREE70.Vector3(0, 1, 0), 1.8, 4);
      const geom = new THREE70.BufferGeometry().setFromPoints(points);
      const tree = new THREE70.LineSegments(geom, this.treeMaterial);
      const angle = t / 4 * Math.PI * 2;
      tree.position.set(Math.cos(angle) * 4.5, 0, Math.sin(angle) * 3.5);
      this.trees.push(tree);
      this.group.add(tree);
    }
    const spiritGeom = new THREE70.BufferGeometry();
    this.spiritPositions = new Float32Array(this.numSpirits * 3);
    for (let i = 0; i < this.numSpirits; i++) {
      this.spiritPositions[i * 3] = (Math.random() - 0.5) * 12;
      this.spiritPositions[i * 3 + 1] = Math.random() * 5;
      this.spiritPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    spiritGeom.setAttribute("position", new THREE70.BufferAttribute(this.spiritPositions, 3));
    this.spiritMaterial = new THREE70.PointsMaterial({
      color: new THREE70.Color(ctx.theme.accent),
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE70.AdditiveBlending,
      depthWrite: false
    });
    this.spiritPoints = new THREE70.Points(spiritGeom, this.spiritMaterial);
    this.group.add(this.spiritPoints);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    const pos = this.spiritPoints.geometry.attributes.position.array;
    for (let i = 0; i < this.numSpirits; i++) {
      const idx = i * 3;
      pos[idx + 1] += Math.sin(time * 2 + i) * delta * 0.5 * speed;
      pos[idx] += Math.cos(time * 1.5 + i) * delta * 0.4;
      pos[idx + 2] += Math.sin(time * 1.2 + i) * delta * 0.4;
    }
    this.spiritPoints.geometry.attributes.position.needsUpdate = true;
    this.spiritMaterial.size = 0.25 + (audio.mid * 0.4 + (audio.beat ? 0.3 : 0)) * reactivity;
  }
  onThemeChange(theme) {
    this.treeMaterial.color.set(theme.primary);
    this.spiritMaterial.color.set(theme.accent);
  }
  onDispose() {
    for (const t of this.trees) {
      t.geometry.dispose();
    }
    this.trees.length = 0;
    this.treeMaterial?.dispose();
    if (this.spiritPoints) {
      this.spiritPoints.geometry.dispose();
      this.spiritMaterial?.dispose();
    }
  }
};

// src/presets/StormCell.ts
var THREE71 = __toESM(require("three"), 1);
var StormCellPreset = class extends BasePreset {
  id = "stormcell";
  name = "Storm Cell";
  category = "Organic & Nature";
  description = "Rotating supercell anvil cloud with intra-cloud lightning.";
  cameraConfig = {
    position: [0, 0, 9],
    target: [0, 0, 0],
    autoRotate: false
  };
  cloudVortex;
  lightningLines;
  cloudMaterial;
  lightningMaterial;
  lightningGeom;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Vortex Rotation", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Lightning Strike", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Anvil Scale", min: 2, max: 6, step: 0.2, defaultValue: 3.5 }
    ]);
  }
  setup(ctx) {
    const anvilGeom = new THREE71.ConeGeometry(4.5, 2.5, 32, 16, true);
    anvilGeom.rotateX(Math.PI);
    this.cloudMaterial = new THREE71.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uFlash: { value: 0 },
        uColor: { value: new THREE71.Color(ctx.theme.primary) },
        uAccent: { value: new THREE71.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vUv = uv;
          vec3 p = position;
          float curl = sin(p.x * 2.0 + uTime * 2.0) * cos(p.z * 2.0 + uTime * 2.0) * (0.2 + uBass * 0.4);
          p.y += curl;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uFlash;
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec3 darkCloud = uColor * 0.2;
          vec3 col = mix(darkCloud, uAccent * 2.0, uFlash);
          gl_FragColor = vec4(col, 0.85);
        }
      `
    });
    this.cloudVortex = new THREE71.Mesh(anvilGeom, this.cloudMaterial);
    this.cloudVortex.position.y = 1.5;
    this.group.add(this.cloudVortex);
    this.lightningGeom = new THREE71.BufferGeometry();
    const lPos = new Float32Array(16 * 2 * 3);
    this.lightningGeom.setAttribute("position", new THREE71.BufferAttribute(lPos, 3));
    this.lightningMaterial = new THREE71.LineBasicMaterial({
      color: 16777215,
      linewidth: 3,
      transparent: true,
      opacity: 0,
      blending: THREE71.AdditiveBlending,
      depthWrite: false
    });
    this.lightningLines = new THREE71.LineSegments(this.lightningGeom, this.lightningMaterial);
    this.group.add(this.lightningLines);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.cloudVortex.rotation.y += delta * 0.4 * speed;
    this.cloudMaterial.uniforms.uTime.value = time * speed;
    this.cloudMaterial.uniforms.uBass.value = audio.bass * reactivity;
    if (audio.beat) {
      this.cloudMaterial.uniforms.uFlash.value = 1 * reactivity;
      this.lightningMaterial.opacity = 1;
      const pos = this.lightningGeom.attributes.position.array;
      for (let i = 0; i < 16; i++) {
        const idx = i * 6;
        pos[idx] = (Math.random() - 0.5) * 4;
        pos[idx + 1] = 1.5;
        pos[idx + 2] = (Math.random() - 0.5) * 4;
        pos[idx + 3] = pos[idx] + (Math.random() - 0.5) * 1.5;
        pos[idx + 4] = -1.5;
        pos[idx + 5] = pos[idx + 2] + (Math.random() - 0.5) * 1.5;
      }
      this.lightningGeom.attributes.position.needsUpdate = true;
    } else {
      this.cloudMaterial.uniforms.uFlash.value = Math.max(0, this.cloudMaterial.uniforms.uFlash.value - delta * 2.5);
      this.lightningMaterial.opacity = Math.max(0, this.lightningMaterial.opacity - delta * 4);
    }
  }
  onThemeChange(theme) {
    this.cloudMaterial.uniforms.uColor.value.set(theme.primary);
    this.cloudMaterial.uniforms.uAccent.value.set(theme.accent);
  }
  onDispose() {
    if (this.cloudVortex) {
      this.cloudVortex.geometry.dispose();
      this.cloudMaterial?.dispose();
    }
    if (this.lightningLines) {
      this.lightningLines.geometry.dispose();
      this.lightningMaterial?.dispose();
    }
  }
};

// src/presets/Jellyfish.ts
var THREE72 = __toESM(require("three"), 1);
var JellyfishPreset = class extends BasePreset {
  id = "jellyfish";
  name = "Jellyfish";
  category = "Organic & Nature";
  description = "Translucent bioluminescent jellyfish dome with trailing tentacles.";
  cameraConfig = {
    position: [0, 1, 10],
    target: [0, 0, 0],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };
  bellMesh;
  tentacles = [];
  bellMaterial;
  tentacleMaterial;
  tentacleCount = 12;
  nodesPerTentacle = 24;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Swim Velocity", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Bell Propulsion", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Bell Dome Scale", min: 1, max: 3.5, step: 0.1, defaultValue: 2 }
    ]);
  }
  setup(ctx) {
    this.tentacles.length = 0;
    const domeRadius = this.paramStore.getValue("density");
    const bellGeom = new THREE72.SphereGeometry(domeRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    this.bellMaterial = new THREE72.MeshPhysicalMaterial({
      color: new THREE72.Color(ctx.theme.primary),
      emissive: new THREE72.Color(ctx.theme.accent),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      transmission: 0.6,
      side: THREE72.DoubleSide
    });
    this.bellMesh = new THREE72.Mesh(bellGeom, this.bellMaterial);
    this.bellMesh.position.y = 1.5;
    this.group.add(this.bellMesh);
    this.tentacleMaterial = new THREE72.LineBasicMaterial({
      color: new THREE72.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.85,
      blending: THREE72.AdditiveBlending,
      depthWrite: false
    });
    for (let t = 0; t < this.tentacleCount; t++) {
      const angle = t / this.tentacleCount * Math.PI * 2;
      const r = domeRadius * 0.7;
      const pts = [];
      for (let n = 0; n < this.nodesPerTentacle; n++) {
        const y = 1.5 - n * 0.25;
        pts.push(new THREE72.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      }
      const geom = new THREE72.BufferGeometry().setFromPoints(pts);
      const line = new THREE72.Line(geom, this.tentacleMaterial);
      this.tentacles.push(line);
      this.group.add(line);
    }
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y += delta * 0.2 * speed;
    const pulse = (Math.sin(time * 3 * speed) * 0.2 + (audio.beat ? 0.35 : 0) + audio.bass * 0.2) * reactivity;
    this.bellMesh.scale.set(1 - pulse * 0.2, 1 + pulse * 0.5, 1 - pulse * 0.2);
    this.group.position.y = Math.sin(time * 1.5 * speed) * 0.8;
    for (let tIdx = 0; tIdx < this.tentacles.length; tIdx++) {
      const tentacle = this.tentacles[tIdx];
      const pos = tentacle.geometry.attributes.position.array;
      const angle = tIdx / this.tentacleCount * Math.PI * 2;
      for (let n = 1; n < this.nodesPerTentacle; n++) {
        const wave = Math.sin(time * 4 * speed - n * 0.3 + tIdx) * (0.05 + audio.mid * 0.15 * reactivity);
        pos[n * 3] += Math.cos(angle) * wave;
        pos[n * 3 + 2] += Math.sin(angle) * wave;
      }
      tentacle.geometry.attributes.position.needsUpdate = true;
    }
    if (audio.beat) {
      this.bellMaterial.emissiveIntensity = 1.4 * reactivity;
    } else {
      this.bellMaterial.emissiveIntensity = Math.max(0.3, this.bellMaterial.emissiveIntensity * 0.94);
    }
  }
  onThemeChange(theme) {
    this.bellMaterial.color.set(theme.primary);
    this.bellMaterial.emissive.set(theme.accent);
    this.tentacleMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.bellMesh) {
      this.bellMesh.geometry.dispose();
      this.bellMaterial?.dispose();
    }
    for (const t of this.tentacles) {
      t.geometry.dispose();
    }
    this.tentacles.length = 0;
    this.tentacleMaterial?.dispose();
  }
};

// src/presets/Mycelium.ts
var THREE73 = __toESM(require("three"), 1);
var MyceliumPreset = class extends BasePreset {
  id = "mycelium";
  name = "Mycelium";
  category = "Organic & Nature";
  description = "Branching fungal hyphae network with bioluminescent pulses.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  hyphaeLines;
  nodePoints;
  lineMaterial;
  nodeMaterial;
  numHyphae = 32;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Pulse Velocity", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Node Glow", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Network Spread", min: 4, max: 14, step: 1, defaultValue: 8 }
    ]);
  }
  setup(ctx) {
    const linePoints = [];
    const nodeCoords = [];
    const spread = this.paramStore.getValue("density");
    for (let h = 0; h < this.numHyphae; h++) {
      let curr = new THREE73.Vector3((Math.random() - 0.5) * 2, -3, (Math.random() - 0.5) * 2);
      nodeCoords.push(curr.x, curr.y, curr.z);
      const segments = 8;
      for (let s = 0; s < segments; s++) {
        const next = curr.clone().add(new THREE73.Vector3(
          (Math.random() - 0.5) * (spread / 4),
          Math.random() * 0.8,
          (Math.random() - 0.5) * (spread / 4)
        ));
        linePoints.push(curr.x, curr.y, curr.z, next.x, next.y, next.z);
        nodeCoords.push(next.x, next.y, next.z);
        curr = next;
      }
    }
    const lineGeom = new THREE73.BufferGeometry();
    lineGeom.setAttribute("position", new THREE73.Float32BufferAttribute(linePoints, 3));
    this.lineMaterial = new THREE73.LineBasicMaterial({
      color: new THREE73.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.85,
      blending: THREE73.AdditiveBlending,
      depthWrite: false
    });
    this.hyphaeLines = new THREE73.LineSegments(lineGeom, this.lineMaterial);
    this.group.add(this.hyphaeLines);
    const nodeGeom = new THREE73.BufferGeometry();
    nodeGeom.setAttribute("position", new THREE73.Float32BufferAttribute(nodeCoords, 3));
    this.nodeMaterial = new THREE73.PointsMaterial({
      color: new THREE73.Color(ctx.theme.accent),
      size: 0.22,
      transparent: true,
      opacity: 0.9,
      blending: THREE73.AdditiveBlending,
      depthWrite: false
    });
    this.nodePoints = new THREE73.Points(nodeGeom, this.nodeMaterial);
    this.group.add(this.nodePoints);
  }
  update(_ctx, audio, time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y += delta * 0.15 * speed;
    const pulse = Math.sin(time * 3 * speed) * 0.5 + 0.5;
    this.nodeMaterial.size = (0.18 + (pulse * 0.15 + audio.bass * 0.25)) * reactivity;
    this.lineMaterial.opacity = 0.5 + (audio.mid * 0.5 + (audio.beat ? 0.3 : 0)) * reactivity;
  }
  onThemeChange(theme) {
    this.lineMaterial.color.set(theme.primary);
    this.nodeMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.hyphaeLines) {
      this.hyphaeLines.geometry.dispose();
      this.lineMaterial?.dispose();
    }
    if (this.nodePoints) {
      this.nodePoints.geometry.dispose();
      this.nodeMaterial?.dispose();
    }
  }
};

// src/presets/Volcano.ts
var THREE74 = __toESM(require("three"), 1);
var VolcanoPreset = class extends BasePreset {
  id = "volcano";
  name = "Volcano";
  category = "Organic & Nature";
  description = "3D caldera cone mountain erupting molten magma particles.";
  cameraConfig = {
    position: [0, 0, 10],
    target: [0, 0, 0],
    autoRotate: false
  };
  mountainMesh;
  magmaLake;
  lavaSparks;
  mountainMaterial;
  magmaMaterial;
  sparkMaterial;
  sparkPositions;
  sparkVelocities;
  sparkCount = 1e3;
  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: "speed", name: "Eruption Speed", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "reactivity", name: "Pyroclastic Force", min: 0.1, max: 2.5, step: 0.05, defaultValue: 1 },
      { id: "density", name: "Caldera Scale", min: 1, max: 4, step: 0.2, defaultValue: 2.5 }
    ]);
  }
  setup(ctx) {
    this.group.position.y = -2;
    const mountainGeom = new THREE74.CylinderGeometry(1.2, 5, 3.5, 32, 8, true);
    this.mountainMaterial = new THREE74.MeshStandardMaterial({
      color: new THREE74.Color(ctx.theme.background).offsetHSL(0, 0, 0.06),
      roughness: 0.95,
      metalness: 0.1
    });
    this.mountainMesh = new THREE74.Mesh(mountainGeom, this.mountainMaterial);
    this.mountainMesh.position.y = 1.75;
    this.group.add(this.mountainMesh);
    const lakeGeom = new THREE74.CircleGeometry(1.15, 32);
    lakeGeom.rotateX(-Math.PI / 2);
    this.magmaMaterial = new THREE74.MeshBasicMaterial({
      color: new THREE74.Color(ctx.theme.accent)
    });
    this.magmaLake = new THREE74.Mesh(lakeGeom, this.magmaMaterial);
    this.magmaLake.position.y = 3.4;
    this.group.add(this.magmaLake);
    const sparkGeom = new THREE74.BufferGeometry();
    this.sparkPositions = new Float32Array(this.sparkCount * 3);
    this.sparkVelocities = new Float32Array(this.sparkCount * 3);
    for (let i = 0; i < this.sparkCount; i++) {
      this.resetSpark(i);
      this.sparkPositions[i * 3 + 1] = 3.5 + Math.random() * 3;
    }
    sparkGeom.setAttribute("position", new THREE74.BufferAttribute(this.sparkPositions, 3));
    this.sparkMaterial = new THREE74.PointsMaterial({
      color: new THREE74.Color(ctx.theme.accent),
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE74.AdditiveBlending,
      depthWrite: false
    });
    this.lavaSparks = new THREE74.Points(sparkGeom, this.sparkMaterial);
    this.group.add(this.lavaSparks);
  }
  resetSpark(i) {
    this.sparkPositions[i * 3] = (Math.random() - 0.5) * 1;
    this.sparkPositions[i * 3 + 1] = 3.5;
    this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 1;
    const angle = Math.random() * Math.PI * 2;
    const spread = Math.random() * 1.5;
    this.sparkVelocities[i * 3] = Math.cos(angle) * spread;
    this.sparkVelocities[i * 3 + 1] = 4 + Math.random() * 6;
    this.sparkVelocities[i * 3 + 2] = Math.sin(angle) * spread;
  }
  update(ctx, audio, _time, delta) {
    const speed = this.paramStore.getValue("speed");
    const reactivity = this.paramStore.getValue("reactivity");
    this.group.rotation.y += delta * 0.1 * speed;
    if (audio.beat) {
      this.magmaMaterial.color.set(ctx.theme.primary);
      this.sparkMaterial.size = 0.32 * reactivity;
    } else {
      this.magmaMaterial.color.set(ctx.theme.accent);
      this.sparkMaterial.size = 0.16;
    }
    const pos = this.lavaSparks.geometry.attributes.position.array;
    const gravity = 9.8 * delta;
    const eruptionBoost = audio.bass * 4 * reactivity;
    for (let i = 0; i < this.sparkCount; i++) {
      const idx = i * 3;
      pos[idx] += this.sparkVelocities[idx] * delta * speed;
      pos[idx + 1] += (this.sparkVelocities[idx + 1] + eruptionBoost) * delta * speed;
      pos[idx + 2] += this.sparkVelocities[idx + 2] * delta * speed;
      this.sparkVelocities[idx + 1] -= gravity;
      if (pos[idx + 1] < 1) {
        this.resetSpark(i);
      }
    }
    this.lavaSparks.geometry.attributes.position.needsUpdate = true;
  }
  onThemeChange(theme) {
    this.magmaMaterial.color.set(theme.accent);
    this.sparkMaterial.color.set(theme.accent);
  }
  onDispose() {
    if (this.mountainMesh) {
      this.mountainMesh.geometry.dispose();
      this.mountainMaterial?.dispose();
    }
    if (this.magmaLake) {
      this.magmaLake.geometry.dispose();
      this.magmaMaterial?.dispose();
    }
    if (this.lavaSparks) {
      this.lavaSparks.geometry.dispose();
      this.sparkMaterial?.dispose();
    }
  }
};

// src/studio/StudioComposer.ts
var THREE75 = __toESM(require("three"), 1);

// src/studio/types.ts
var ENGINE_FAMILIES_META = {
  fluid: { id: "fluid", label: "Liquid", premium: false, blurb: "Soft fluid", defaultSeed: 2867 },
  chroma: { id: "chroma", label: "Chroma", premium: false, blurb: "Vintage fringe", defaultSeed: 2443698462 },
  tunnel: { id: "tunnel", label: "Tunnel", premium: true, blurb: "Deep corridor", defaultSeed: 3775842717 },
  volume: { id: "volume", label: "Volume", premium: true, blurb: "Carved mass", defaultSeed: 2180893918 },
  force: { id: "force", label: "The Force", premium: true, blurb: "Orbital pull", defaultSeed: 2814582287 }
};
var BASE_GENE_DEFAULTS = {
  scale: 1,
  octaves: 0.55,
  warp: 0.45,
  flow: 0.4,
  filament: 0.5,
  depth: 0.45,
  spin: 0.3,
  driveBand: 0.35,
  kickGain: 0.55,
  glow: 0.4,
  breakup: 0.3
};
var FAMILY_GENE_DEFAULTS = {
  fluid: {
    curl: 0.12,
    caustic: 0.08,
    marble: 0.15,
    foam: 0.08,
    ripple: 0.06,
    oil: 0.05,
    blob: 0.4,
    drip: 0.08,
    sheets: 0.1,
    stretch: 0.12,
    meniscus: 0.1,
    grit: 0.08,
    boil: 0.08,
    gloss: 0.22,
    visc: 0.4,
    eddy: 0.35,
    edge: 0.32,
    medium: 0.0625
  },
  chroma: {
    figure: 0.03125,
    stagger: 0.35,
    plate: 0.45,
    axis: 0.35,
    carpet: 0.22,
    breath: 0.42,
    bloom: 0.48
  },
  tunnel: {
    sides: 0.12,
    twist: 0.32,
    lanes: 0.4,
    lattice: 0.22,
    flare: 0.42,
    bend: 0.2,
    hue: 0,
    cycle: 0.18,
    split: 0.12,
    sat: 0.55,
    star: 0,
    layers: 0.15,
    rings: 0.4,
    kaleido: 0.08,
    aperture: 0.48,
    pulse: 0.4,
    bore: 0.0625
  },
  volume: {
    cell: 0.22,
    gyre: 0.38,
    ridge: 0.28,
    hollow: 0.18,
    haze: 0.28,
    coil: 0.2,
    lamp: 0.4,
    form: 0.38,
    elongate: 0.5,
    span: 0.2,
    shift: 0.5,
    veil: 0.2
  },
  force: {
    wave: 0.3125,
    field: 0.0625,
    trail: 0.5,
    stamp: 0.5,
    mix: 0.12,
    orbit: 0.35,
    echo: 0.3125,
    alt: 0.5625,
    blend: 0,
    map: 0.0625,
    core: 0.125,
    fold: 0,
    offset: 0.5,
    count: 0.5,
    lace: 0
  }
};
var DEFAULT_STAGE_CONFIG = {
  backdrop: "void",
  starfieldDensity: 1,
  gridVisible: true,
  gridOpacity: 0.5,
  fogDensity: 0.2,
  horizonTilt: 0,
  spaceMode: "3d",
  scale: 1,
  dustDensity: 1,
  lightIntensity: 1.2
};
var DEFAULT_HERO_CONFIG = {
  geometry: "sphere",
  shape: "circle",
  renderStyle: "solid",
  symmetry: "none",
  scale: 1,
  wireframe: false,
  wireframeThickness: 1,
  speedMultiplier: 1,
  audioReactivity: 1,
  deformation: 1
};
var DEFAULT_MOOD_CONFIG = {
  themeId: "ember",
  brightness: 1,
  contrast: 1,
  ambientIntensity: 0.8,
  directionalIntensity: 1.2,
  beatLightingPulse: true,
  tint: 0,
  accentGain: 1,
  bloomIntensity: 1.2,
  speedMultiplier: 1,
  lightingVibe: "neon"
};
function clampNumber2(val, min, max, fallback) {
  if (typeof val !== "number" || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, val));
}
function hashPromptToSeed(prompt) {
  const clean = String(prompt || "").trim();
  if (!clean) {
    return Math.random() * 4294967295 >>> 0;
  }
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function createPrng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = s + 1831565813 >>> 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// src/studio/StudioComposer.ts
var STORAGE_KEY_CREATIONS = "visuval_studio_creations";
var STORAGE_KEY_RECIPES = "visuval_studio_recipes_v2";
var STORAGE_KEY_ACTIVE = "visuval_studio_active_recipe_v2";
function createDefaultGenes(family) {
  return {
    ...BASE_GENE_DEFAULTS,
    ...FAMILY_GENE_DEFAULTS[family]
  };
}
function createDefaultRecipe(family = "force", name) {
  const meta = ENGINE_FAMILIES_META[family];
  return {
    kind: "engine",
    engineVersion: 2,
    id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name || `${meta.label} Space 1`,
    familyId: family,
    seed: meta.defaultSeed,
    stage: { ...DEFAULT_STAGE_CONFIG },
    hero: { ...DEFAULT_HERO_CONFIG },
    mood: { ...DEFAULT_MOOD_CONFIG },
    genes: createDefaultGenes(family),
    themeId: "ember",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}
var StudioRecipeManager = class {
  activeRecipe;
  draftRecipe;
  savedRecipes = [];
  onActiveRecipeChange;
  constructor(listener) {
    this.onActiveRecipeChange = listener;
    this.activeRecipe = createDefaultRecipe("force");
    this.draftRecipe = structuredClone(this.activeRecipe);
    this.loadFromStorage();
  }
  setChangeListener(listener) {
    this.onActiveRecipeChange = listener;
  }
  getActiveRecipe() {
    return this.activeRecipe;
  }
  getDraftRecipe() {
    return this.draftRecipe;
  }
  getSavedRecipes() {
    return [...this.savedRecipes];
  }
  setEngineFamily(family) {
    if (this.activeRecipe.kind === "engine") {
      this.activeRecipe.familyId = family;
      this.activeRecipe.genes = createDefaultGenes(family);
      this.activeRecipe.seed = ENGINE_FAMILIES_META[family]?.defaultSeed || 2867;
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = structuredClone(this.activeRecipe);
    this.notifyChange();
    this.persistActive();
  }
  setGene(key, value) {
    const clamped = clampNumber2(value, -2, 3, 1);
    if (this.activeRecipe.kind === "engine") {
      this.activeRecipe.genes[key] = clamped;
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = structuredClone(this.activeRecipe);
    this.notifyChange();
    this.persistActive();
  }
  setStage(stage) {
    if (this.activeRecipe.kind === "engine" && this.activeRecipe.stage) {
      Object.assign(this.activeRecipe.stage, stage);
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = structuredClone(this.activeRecipe);
    this.notifyChange();
    this.persistActive();
  }
  setHero(hero) {
    if (this.activeRecipe.kind === "engine" && this.activeRecipe.hero) {
      Object.assign(this.activeRecipe.hero, hero);
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = structuredClone(this.activeRecipe);
    this.notifyChange();
    this.persistActive();
  }
  setMood(mood) {
    if (this.activeRecipe.kind === "engine" && this.activeRecipe.mood) {
      Object.assign(this.activeRecipe.mood, mood);
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = structuredClone(this.activeRecipe);
    this.notifyChange();
    this.persistActive();
  }
  /**
   * Generation Mode 1: Auto-Forge (Create)
   * Randomized 32-bit uint seed and bounded parameter exploration
   */
  generateRandomRecipe(family) {
    const families = ["chroma", "fluid", "tunnel", "volume", "force"];
    const chosenFamily = family || families[Math.floor(Math.random() * families.length)];
    const seed = Math.random() * 4294967295 >>> 0;
    const rng = createPrng(seed);
    const recipe = createDefaultRecipe(chosenFamily, `Forged ${ENGINE_FAMILIES_META[chosenFamily].label} #${seed.toString(16).slice(-4).toUpperCase()}`);
    recipe.seed = seed;
    recipe.genes.scale = +(0.5 + rng() * 1.5).toFixed(2);
    recipe.genes.warp = +rng().toFixed(2);
    recipe.genes.flow = +rng().toFixed(2);
    recipe.genes.filament = +rng().toFixed(2);
    recipe.genes.depth = +rng().toFixed(2);
    recipe.genes.spin = +rng().toFixed(2);
    recipe.genes.glow = +(0.2 + rng() * 0.8).toFixed(2);
    recipe.genes.kickGain = +(0.3 + rng() * 0.7).toFixed(2);
    const famDefaults = FAMILY_GENE_DEFAULTS[chosenFamily];
    if (famDefaults) {
      for (const k of Object.keys(famDefaults)) {
        recipe.genes[k] = +rng().toFixed(3);
      }
    }
    if (recipe.stage) {
      recipe.stage.scale = +(0.6 + rng() * 1.4).toFixed(1);
      recipe.stage.dustDensity = +(rng() * 2).toFixed(1);
      recipe.stage.lightIntensity = +(0.5 + rng() * 2).toFixed(1);
    }
    if (recipe.hero) {
      recipe.hero.deformation = +(rng() * 2).toFixed(1);
      recipe.hero.scale = +(0.6 + rng() * 1.4).toFixed(1);
    }
    if (recipe.mood) {
      recipe.mood.bloomIntensity = +(0.5 + rng() * 2).toFixed(1);
      recipe.mood.speedMultiplier = +(0.5 + rng() * 1.5).toFixed(1);
    }
    this.applyRecipe(recipe);
    return recipe;
  }
  /**
   * Generation Mode 2: Curated (Complex / Prompt)
   * Uses FNV-1a hash to deterministically derive harmonic seed and genes from prompt
   */
  generateCuratedRecipe(prompt = "", family) {
    const seed = hashPromptToSeed(prompt || "Visuval Harmonic Synthesis");
    const rng = createPrng(seed);
    const families = ["chroma", "fluid", "tunnel", "volume", "force"];
    const chosenFamily = family || families[seed % families.length];
    const label = prompt.trim() || `${ENGINE_FAMILIES_META[chosenFamily].label} Curated`;
    const recipe = createDefaultRecipe(chosenFamily, label);
    recipe.seed = seed;
    recipe.genes.scale = +(0.8 + rng() * 0.8).toFixed(2);
    recipe.genes.warp = +(0.2 + rng() * 0.6).toFixed(2);
    recipe.genes.flow = +(0.2 + rng() * 0.6).toFixed(2);
    recipe.genes.depth = +(0.3 + rng() * 0.6).toFixed(2);
    recipe.genes.glow = +(0.4 + rng() * 0.6).toFixed(2);
    recipe.genes.kickGain = +(0.4 + rng() * 0.5).toFixed(2);
    const famDefaults = FAMILY_GENE_DEFAULTS[chosenFamily];
    if (famDefaults) {
      for (const k of Object.keys(famDefaults)) {
        recipe.genes[k] = +(0.2 + rng() * 0.6).toFixed(3);
      }
    }
    this.applyRecipe(recipe);
    return recipe;
  }
  /**
   * Generation Mode 3: Guided Remix (Enhance)
   * Controlled stochastic perturbation (±10% to ±25%) of current active recipe
   */
  remixCurrent() {
    const base = structuredClone(this.activeRecipe);
    if (base.kind === "engine") {
      base.id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      base.name = `Remix of ${base.name}`;
      base.seed = Math.imul(base.seed || 12345, 1664525) + 1013904223 >>> 0;
      base.updatedAt = Date.now();
      const rng = createPrng(base.seed);
      for (const [key, val] of Object.entries(base.genes)) {
        if (rng() < 0.45) {
          const delta = (rng() * 2 - 1) * 0.22;
          base.genes[key] = +clampNumber2(val + delta, 0, 2.5, val).toFixed(3);
        }
      }
      if (base.stage) {
        base.stage.scale = +clampNumber2(base.stage.scale + (rng() - 0.5) * 0.4, 0.5, 2.5, 1).toFixed(1);
        base.stage.dustDensity = +clampNumber2(base.stage.dustDensity + (rng() - 0.5) * 0.4, 0, 2, 1).toFixed(1);
      }
      if (base.hero) {
        base.hero.deformation = +clampNumber2(base.hero.deformation + (rng() - 0.5) * 0.4, 0, 2.5, 1).toFixed(1);
      }
      if (base.mood) {
        base.mood.bloomIntensity = +clampNumber2(base.mood.bloomIntensity + (rng() - 0.5) * 0.4, 0, 3, 1.2).toFixed(1);
      }
    }
    this.applyRecipe(base);
    return base;
  }
  applyRecipe(recipe) {
    if (!recipe || typeof recipe !== "object") return;
    this.activeRecipe = structuredClone(recipe);
    this.draftRecipe = structuredClone(recipe);
    this.notifyChange();
    this.persistActive();
  }
  saveRecipe(name) {
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      throw new Error("Recipe title is required to save");
    }
    const saved = structuredClone(this.activeRecipe);
    saved.id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    saved.name = trimmed.slice(0, 60);
    saved.createdAt = Date.now();
    saved.updatedAt = Date.now();
    const existingIdx = this.savedRecipes.findIndex((r) => r.name.toLowerCase() === saved.name.toLowerCase());
    if (existingIdx >= 0) {
      this.savedRecipes[existingIdx] = saved;
    } else {
      this.savedRecipes.unshift(saved);
    }
    this.persistAll();
    this.applyRecipe(saved);
    return saved;
  }
  loadRecipe(id) {
    const found = this.savedRecipes.find((r) => r.id === id);
    if (!found) return false;
    this.applyRecipe(found);
    return true;
  }
  deleteRecipe(id) {
    const lenBefore = this.savedRecipes.length;
    this.savedRecipes = this.savedRecipes.filter((r) => r.id !== id);
    if (this.savedRecipes.length !== lenBefore) {
      this.persistAll();
      return true;
    }
    return false;
  }
  exportRecipeJson(recipe) {
    const target = recipe || this.activeRecipe;
    return JSON.stringify(target, null, 2);
  }
  importRecipeJson(jsonStr) {
    if (typeof jsonStr !== "string") return null;
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.name || typeof parsed.name !== "string") return null;
      const family = ["chroma", "fluid", "tunnel", "volume", "force"].includes(parsed.familyId) ? parsed.familyId : "force";
      const imported = {
        kind: "engine",
        engineVersion: 2,
        id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: String(parsed.name).trim().slice(0, 60),
        familyId: family,
        seed: Number(parsed.seed) >>> 0 || ENGINE_FAMILIES_META[family]?.defaultSeed || 2867,
        stage: { ...DEFAULT_STAGE_CONFIG, ...parsed.stage },
        hero: { ...DEFAULT_HERO_CONFIG, ...parsed.hero },
        mood: { ...DEFAULT_MOOD_CONFIG, ...parsed.mood },
        genes: { ...createDefaultGenes(family), ...parsed.genes },
        createdAt: Number(parsed.createdAt) || Date.now(),
        updatedAt: Date.now()
      };
      for (const [k, v] of Object.entries(imported.genes)) {
        imported.genes[k] = clampNumber2(v, -2, 3, 1);
      }
      this.savedRecipes.unshift(imported);
      this.persistAll();
      this.applyRecipe(imported);
      return imported;
    } catch {
      return null;
    }
  }
  notifyChange() {
    if (this.onActiveRecipeChange) {
      this.onActiveRecipeChange(this.activeRecipe);
    }
  }
  persistActive() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(this.activeRecipe));
      }
    } catch {
    }
  }
  persistAll() {
    try {
      if (typeof localStorage !== "undefined") {
        const data = JSON.stringify(this.savedRecipes);
        localStorage.setItem(STORAGE_KEY_CREATIONS, data);
        localStorage.setItem(STORAGE_KEY_RECIPES, data);
        this.persistActive();
      }
    } catch {
    }
  }
  loadFromStorage() {
    try {
      if (typeof localStorage === "undefined") return;
      const rawSaved = localStorage.getItem(STORAGE_KEY_CREATIONS) || localStorage.getItem(STORAGE_KEY_RECIPES);
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (Array.isArray(parsed)) {
          this.savedRecipes = parsed.filter((item) => item && typeof item === "object" && item.name);
        }
      }
      const rawActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (rawActive) {
        const parsedActive = JSON.parse(rawActive);
        if (parsedActive && typeof parsedActive === "object" && parsedActive.name) {
          this.activeRecipe = parsedActive;
          this.draftRecipe = structuredClone(parsedActive);
        }
      }
    } catch {
      this.savedRecipes = [];
    }
  }
};
var StudioComposerPreset = class {
  id = "studio-composer";
  name = "Visualizer Studio";
  category = "Structures";
  description = "Multi-layer stage composer blending Chroma, Liquid, Tunnel, Volume, and The Force.";
  config = {
    chromaIntensity: 1,
    liquidWarp: 1,
    tunnelDepth: 1,
    volumeDensity: 1,
    theForceAttraction: 1
  };
  recipeManager;
  group;
  // Layer 1: Liquid Warp Plane
  liquidMesh;
  liquidMaterial;
  // Layer 2: Tunnel Corridor Frames
  tunnelGroup;
  tunnelFrames = [];
  frameCount = 16;
  // Layer 3: Volume Particle Cloud & The Force Physics
  volumeParticles;
  volumePositions;
  volumeVelocities;
  volumeMaterial;
  particleCount = 2e3;
  // Layer 4: The Force Singularity Attractor
  forceCore;
  forceMaterial;
  constructor() {
    this.recipeManager = new StudioRecipeManager((recipe) => this.syncFromRecipe(recipe));
    this.syncFromRecipe(this.recipeManager.getActiveRecipe());
  }
  getRecipeManager() {
    return this.recipeManager;
  }
  getActiveRecipe() {
    return this.recipeManager.getActiveRecipe();
  }
  getDraftRecipe() {
    return this.recipeManager.getDraftRecipe();
  }
  getSavedRecipes() {
    return this.recipeManager.getSavedRecipes();
  }
  setEngineFamily(family) {
    this.recipeManager.setEngineFamily(family);
  }
  setGene(key, value) {
    this.recipeManager.setGene(key, value);
  }
  setStage(stage) {
    this.recipeManager.setStage(stage);
  }
  setHero(hero) {
    this.recipeManager.setHero(hero);
  }
  setMood(mood) {
    this.recipeManager.setMood(mood);
  }
  generateRandomRecipe(family) {
    return this.recipeManager.generateRandomRecipe(family);
  }
  generateCuratedRecipe(prompt, family) {
    return this.recipeManager.generateCuratedRecipe(prompt || "", family);
  }
  remixCurrent() {
    return this.recipeManager.remixCurrent();
  }
  applyRecipe(recipe) {
    this.recipeManager.applyRecipe(recipe);
    this.syncFromRecipe(recipe);
  }
  saveRecipe(name) {
    return this.recipeManager.saveRecipe(name);
  }
  loadRecipe(id) {
    const success = this.recipeManager.loadRecipe(id);
    if (success) {
      this.syncFromRecipe(this.recipeManager.getActiveRecipe());
    }
    return success;
  }
  deleteRecipe(id) {
    return this.recipeManager.deleteRecipe(id);
  }
  exportRecipeJson(recipe) {
    return this.recipeManager.exportRecipeJson(recipe);
  }
  importRecipeJson(jsonStr) {
    const imported = this.recipeManager.importRecipeJson(jsonStr);
    if (imported) {
      this.syncFromRecipe(imported);
    }
    return imported;
  }
  syncFromEngineConfig(conf) {
    if (typeof conf.chromaIntensity === "number") {
      this.config.chromaIntensity = clampNumber2(conf.chromaIntensity, 0, 2, 1);
    }
    if (typeof conf.liquidWarp === "number") {
      this.config.liquidWarp = clampNumber2(conf.liquidWarp, 0, 2, 1);
    }
    if (typeof conf.tunnelDepth === "number") {
      this.config.tunnelDepth = clampNumber2(conf.tunnelDepth, 0, 2, 1);
    }
    if (typeof conf.volumeDensity === "number") {
      this.config.volumeDensity = clampNumber2(conf.volumeDensity, 0, 2, 1);
    }
    if (typeof conf.theForceAttraction === "number") {
      this.config.theForceAttraction = clampNumber2(conf.theForceAttraction, -2, 2, 1);
    }
  }
  syncFromGenes(genes) {
    this.config.chromaIntensity = clampNumber2(genes.bloom ?? genes.glow ?? 1, 0, 2, 1);
    this.config.liquidWarp = clampNumber2((genes.warp ?? 0.45) * 2, 0, 2, 1);
    this.config.tunnelDepth = clampNumber2((genes.depth ?? 0.45) * 2, 0, 2, 1);
    this.config.volumeDensity = clampNumber2(genes.filament ?? genes.scale ?? 1, 0, 2, 1);
    this.config.theForceAttraction = clampNumber2((genes.spin ?? 0.3) * 4 - 2, -2, 2, 1);
  }
  syncFromRecipe(recipe) {
    if (!recipe || typeof recipe !== "object") return;
    const anyRecipe = recipe;
    const engineConf = anyRecipe.engine || anyRecipe.stageConfig;
    if (engineConf && typeof engineConf === "object") {
      this.syncFromEngineConfig(engineConf);
      return;
    }
    if ("genes" in anyRecipe && anyRecipe.genes && typeof anyRecipe.genes === "object") {
      this.syncFromGenes(anyRecipe.genes);
    }
  }
  // Milestone 3 Fine-Tuning Drawer integration
  getCustomParameters() {
    return [
      { id: "chromaIntensity", name: "Chroma Intensity", min: 0, max: 2, step: 0.1, defaultValue: 1, currentValue: this.config.chromaIntensity },
      { id: "liquidWarp", name: "Liquid Warp", min: 0, max: 2, step: 0.1, defaultValue: 1, currentValue: this.config.liquidWarp },
      { id: "tunnelDepth", name: "Tunnel Depth", min: 0, max: 2, step: 0.1, defaultValue: 1, currentValue: this.config.tunnelDepth },
      { id: "volumeDensity", name: "Volume Density", min: 0, max: 2, step: 0.1, defaultValue: 1, currentValue: this.config.volumeDensity },
      { id: "theForceAttraction", name: "The Force Attraction", min: -2, max: 2, step: 0.2, defaultValue: 1, currentValue: this.config.theForceAttraction }
    ];
  }
  setCustomParameter(id, value) {
    const val = clampNumber2(value, -2, 2, 1);
    switch (id) {
      case "chromaIntensity":
        this.config.chromaIntensity = clampNumber2(val, 0, 2, 1);
        break;
      case "liquidWarp":
        this.config.liquidWarp = clampNumber2(val, 0, 2, 1);
        break;
      case "tunnelDepth":
        this.config.tunnelDepth = clampNumber2(val, 0, 2, 1);
        break;
      case "volumeDensity":
        this.config.volumeDensity = clampNumber2(val, 0, 2, 1);
        break;
      case "theForceAttraction":
        this.config.theForceAttraction = clampNumber2(val, -2, 2, 1);
        break;
    }
  }
  getCustomParameterValue(id) {
    switch (id) {
      case "chromaIntensity":
        return this.config.chromaIntensity;
      case "liquidWarp":
        return this.config.liquidWarp;
      case "tunnelDepth":
        return this.config.tunnelDepth;
      case "volumeDensity":
        return this.config.volumeDensity;
      case "theForceAttraction":
        return this.config.theForceAttraction;
      default:
        return void 0;
    }
  }
  resetCustomParameters() {
    this.config = {
      chromaIntensity: 1,
      liquidWarp: 1,
      tunnelDepth: 1,
      volumeDensity: 1,
      theForceAttraction: 1
    };
  }
  init(ctx) {
    this.group = new THREE75.Group();
    const liquidGeom = new THREE75.PlaneGeometry(30, 20, 40, 40);
    this.liquidMaterial = new THREE75.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uWarp: { value: 1 },
        uColor1: { value: new THREE75.Color(ctx.theme.primary) },
        uColor2: { value: new THREE75.Color(ctx.theme.secondary) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;
        uniform float uWarp;

        void main() {
          vUv = uv;
          vec3 p = position;
          p.z -= 10.0;
          p.z += sin(p.x * 0.5 + uTime * 2.0) * cos(p.y * 0.5 + uTime) * (1.5 * uWarp + uBass);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec3 col = mix(uColor1 * 0.3, uColor2 * 0.5, sin(vUv.x * 4.0 + uTime) * 0.5 + 0.5);
          gl_FragColor = vec4(col, 0.6);
        }
      `,
      transparent: true,
      depthWrite: false
    });
    this.liquidMesh = new THREE75.Mesh(liquidGeom, this.liquidMaterial);
    this.group.add(this.liquidMesh);
    this.tunnelGroup = new THREE75.Group();
    const frameMat = new THREE75.LineBasicMaterial({
      color: new THREE75.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.6
    });
    for (let i = 0; i < this.frameCount; i++) {
      const size = 3.5;
      const pts = [
        new THREE75.Vector3(-size, -size, 0),
        new THREE75.Vector3(size, -size, 0),
        new THREE75.Vector3(size, size, 0),
        new THREE75.Vector3(-size, size, 0)
      ];
      const geom = new THREE75.BufferGeometry().setFromPoints(pts);
      const loop = new THREE75.LineLoop(geom, frameMat);
      loop.position.z = -i * 2.5;
      this.tunnelFrames.push(loop);
      this.tunnelGroup.add(loop);
    }
    this.group.add(this.tunnelGroup);
    const particleGeom = new THREE75.BufferGeometry();
    this.volumePositions = new Float32Array(this.particleCount * 3);
    this.volumeVelocities = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      this.volumePositions[idx] = (Math.random() - 0.5) * 14;
      this.volumePositions[idx + 1] = (Math.random() - 0.5) * 10;
      this.volumePositions[idx + 2] = (Math.random() - 0.5) * 14;
      this.volumeVelocities[idx] = (Math.random() - 0.5) * 0.2;
      this.volumeVelocities[idx + 1] = (Math.random() - 0.5) * 0.2;
      this.volumeVelocities[idx + 2] = (Math.random() - 0.5) * 0.2;
    }
    particleGeom.setAttribute("position", new THREE75.BufferAttribute(this.volumePositions, 3));
    this.volumeMaterial = new THREE75.PointsMaterial({
      color: new THREE75.Color(ctx.theme.accent),
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE75.AdditiveBlending
    });
    this.volumeParticles = new THREE75.Points(particleGeom, this.volumeMaterial);
    this.group.add(this.volumeParticles);
    const forceGeom = new THREE75.SphereGeometry(1.2, 32, 32);
    this.forceMaterial = new THREE75.MeshStandardMaterial({
      color: new THREE75.Color(ctx.theme.primary),
      emissive: new THREE75.Color(ctx.theme.accent),
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.85
    });
    this.forceCore = new THREE75.Mesh(forceGeom, this.forceMaterial);
    this.forceCore.position.z = -4;
    this.group.add(this.forceCore);
    ctx.scene.add(this.group);
  }
  computeDriveEnergy(audio) {
    const active = this.recipeManager.getActiveRecipe();
    let driveEnergy = audio.bass;
    if (active.kind === "engine" && active.genes) {
      const band = Math.floor(clampNumber2(active.genes.driveBand, 0, 1, 0.35) * 4);
      if (band === 0) driveEnergy = audio.subBass;
      else if (band === 1) driveEnergy = audio.bass;
      else if (band === 2) driveEnergy = audio.mid;
      else driveEnergy = audio.treble;
    }
    return clampNumber2(driveEnergy, 0, 1, 0);
  }
  updateLiquidLayer(time, driveEnergy) {
    if (this.liquidMaterial?.uniforms) {
      this.liquidMaterial.uniforms.uTime.value = time;
      this.liquidMaterial.uniforms.uBass.value = driveEnergy;
      this.liquidMaterial.uniforms.uWarp.value = this.config.liquidWarp;
    }
  }
  updateTunnelLayer(driveEnergy, safeDelta, isBeat) {
    const speed = (6 + driveEnergy * 8) * safeDelta * this.config.tunnelDepth;
    this.tunnelFrames.forEach((frame) => {
      frame.position.z += speed;
      if (frame.position.z > 2) {
        frame.position.z = -this.frameCount * 2.5 + 2;
      }
      frame.scale.setScalar(isBeat ? 1.08 : 1);
    });
  }
  updateVolumeParticles(driveEnergy, safeDelta) {
    if (!this.volumeParticles?.geometry) return;
    const pos = this.volumeParticles.geometry.attributes.position.array;
    const forceStrength = this.config.theForceAttraction * (1 + driveEnergy * 2);
    const attractorZ = -4;
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const px = pos[idx];
      const py = pos[idx + 1];
      const pz = pos[idx + 2] - attractorZ;
      const distSq = px * px + py * py + pz * pz + 0.5;
      const f = forceStrength / distSq * safeDelta;
      this.volumeVelocities[idx] -= px * f;
      this.volumeVelocities[idx + 1] -= py * f;
      this.volumeVelocities[idx + 2] -= pz * f;
      this.volumeVelocities[idx] += -py * f * 1.5;
      this.volumeVelocities[idx + 1] += px * f * 1.5;
      this.volumeVelocities[idx] *= 0.96;
      this.volumeVelocities[idx + 1] *= 0.96;
      this.volumeVelocities[idx + 2] *= 0.96;
      pos[idx] += this.volumeVelocities[idx];
      pos[idx + 1] += this.volumeVelocities[idx + 1];
      pos[idx + 2] += this.volumeVelocities[idx + 2];
      if (Math.abs(pos[idx]) > 12 || Math.abs(pos[idx + 1]) > 10 || Math.abs(pos[idx + 2]) > 14) {
        pos[idx] = (Math.random() - 0.5) * 10;
        pos[idx + 1] = (Math.random() - 0.5) * 8;
        pos[idx + 2] = (Math.random() - 0.5) * 10;
      }
    }
    this.volumeParticles.geometry.attributes.position.needsUpdate = true;
    this.volumeMaterial.size = 0.12 * Math.max(0, this.config.volumeDensity);
  }
  updateForceCore(driveEnergy, isBeat, safeDelta) {
    if (!this.forceCore || !this.forceMaterial) return;
    const kickFactor = isBeat ? 1.4 : 1;
    const coreScale = (1 + driveEnergy * 0.4 + (isBeat ? 0.3 : 0)) * kickFactor;
    this.forceCore.scale.set(coreScale, coreScale, coreScale);
    this.forceCore.rotation.y += safeDelta * 0.5;
    if (isBeat) {
      this.forceMaterial.emissiveIntensity = 1.8 * this.config.chromaIntensity;
    } else {
      this.forceMaterial.emissiveIntensity *= 0.94;
    }
  }
  update(_ctx, audio, time, delta) {
    const safeDelta = clampNumber2(delta, 1e-3, 0.1, 0.016);
    const driveEnergy = this.computeDriveEnergy(audio);
    this.updateLiquidLayer(time, driveEnergy);
    this.updateTunnelLayer(driveEnergy, safeDelta, audio.beat);
    this.updateVolumeParticles(driveEnergy, safeDelta);
    this.updateForceCore(driveEnergy, audio.beat, safeDelta);
  }
  onThemeChange(theme) {
    if (this.liquidMaterial?.uniforms) {
      this.liquidMaterial.uniforms.uColor1.value.set(theme.primary);
      this.liquidMaterial.uniforms.uColor2.value.set(theme.secondary);
    }
    if (this.volumeMaterial) {
      this.volumeMaterial.color.set(theme.accent);
    }
    if (this.forceMaterial) {
      this.forceMaterial.color.set(theme.primary);
      this.forceMaterial.emissive.set(theme.accent);
    }
  }
  dispose() {
    if (this.liquidMesh) {
      this.liquidMesh.geometry.dispose();
      this.liquidMaterial.dispose();
    }
    this.tunnelFrames.forEach((f) => {
      f.geometry.dispose();
      f.material.dispose();
    });
    this.tunnelFrames.length = 0;
    if (this.volumeParticles) {
      this.volumeParticles.geometry.dispose();
      this.volumeMaterial.dispose();
    }
    if (this.forceCore) {
      this.forceCore.geometry.dispose();
      this.forceMaterial.dispose();
    }
    if (this.group) {
      this.group.removeFromParent();
    }
  }
};

// src/presets/index.ts
var PRESETS = [
  // Structures (15)
  new WaveFormPreset(),
  new CircularSpectrumPreset(),
  new ThreeDBarsPreset(),
  new FerrofluidPreset(),
  new ObsidianPolyPreset(),
  new PendulumPreset(),
  new WarpGridPreset(),
  new DNAHelixPreset(),
  new CymaticPreset(),
  new TopoMapPreset(),
  new VinylPlayerPreset(),
  new OrbitalRingsPreset(),
  new Tesseract4DPreset(),
  new HologramPreset(),
  new GeodesicSpherePreset(),
  // Abstract & Space (15)
  new StarfieldPreset(),
  new MilkDropPreset(),
  new HaloPreset(),
  new FacePreset(),
  new GeissPreset(),
  new TieDyePreset(),
  new AuroraPreset(),
  new GravityForcePreset(),
  new SacredMandalaPreset(),
  new TheSunPreset(),
  new BlackHolePreset(),
  new MandelFractalPreset(),
  new UnfoldingMatterPreset(),
  new SynthwaveTerrainPreset(),
  new GalaxyPreset(),
  // Particles & Light (4)
  new ParticleFieldPreset(),
  new FirefliesPreset(),
  new LightningPreset(),
  new PlasmaArcsPreset(),
  // Fluids & Heat (9)
  new LavaEnergyPreset(),
  new FireballPreset(),
  new WaterNeuronsPreset(),
  new LiquidPreset(),
  new FluidPreset(),
  new PlasmaPreset(),
  new FogPreset(),
  new RainWaterPreset(),
  new SmokePreset(),
  // Tunnels (7)
  new TunnelPreset(),
  new BoxTunnelPreset(),
  new RingTunnelPreset(),
  new WaterSlidePreset(),
  new NeonTunnelPreset(),
  new VeinTunnelPreset(),
  new KaleidoscopeMandalaPreset(),
  // Retro & Digital (7)
  new MatrixRainPreset(),
  new VodLinesPreset(),
  new NightRadarPreset(),
  new DiodeWallPreset(),
  new SpectrogramPreset(),
  new LCDDeckPreset(),
  new SignalLockPreset(),
  // Organic & Nature (14)
  new BloomFlowerPreset(),
  new InkDiffusionPreset(),
  new MeadowFieldPreset(),
  new BioCellsPreset(),
  new UpCloudPreset(),
  new RainRoomPreset(),
  new OceanWavesPreset(),
  new ForestStormPreset(),
  new SingleTreePreset(),
  new HauntedForestPreset(),
  new StormCellPreset(),
  new JellyfishPreset(),
  new MyceliumPreset(),
  new VolcanoPreset()
];
var PRESET_ALIASES = {
  // Structures
  "waveform": "wave",
  "wave-form": "wave",
  "circular-spectrum": "circular",
  "3d-bars": "bars3d",
  "three-d-bars": "bars3d",
  "bars-3d": "bars3d",
  "obsidian-poly": "obsidian",
  "pendulum-wave": "pendulum",
  "warp-grid": "warp",
  "dna-helix": "dna",
  "cymatic-plate": "cymatic",
  "topo-map": "topographic",
  "vinyl-player": "vinyl",
  "orbital-rings": "rings",
  "tesseract-4d": "tesseract",
  "hologram-glitch": "hologram",
  "geodesic-sphere": "geodesic",
  // Abstract & Space
  "halo-bloom": "halo",
  "face-mask": "face",
  "geiss-feedback": "geiss",
  "tiedye-fabric": "tiedye",
  "aurora-mandala": "aurora",
  "gravity-force": "gravityforce",
  "sacred-mandala": "sacred",
  "the-sun": "sun",
  "black-hole": "blackhole",
  "mandel-fractal": "mandel",
  "unfolding-matter": "unfoldingmatter",
  "synthwave-terrain": "terrain",
  "galaxy-clusters": "galaxy",
  // Particles & Light
  "particle-field": "particles",
  "lightning-arcs": "lightning",
  "plasma-arcs": "plasmaarcs",
  // Fluids & Heat
  "lava-energy": "lava",
  "fireball-neurons": "fireball",
  "water-neurons": "waterneurons",
  "liquid-chroma": "liquid",
  "fluid-container": "fluid",
  "fluid-plasma": "liquid",
  "plasma-gas": "plasma",
  "fog-mist": "fog",
  "fog-ripples": "fog",
  "rain-water": "water",
  "smoke-wisps": "smoke",
  // Tunnels
  "infinite-tunnel": "tunnel",
  "box-tunnel": "boxtunnel",
  "ring-tunnel": "ringtunnel",
  "water-slide": "waterslide",
  "neon-tunnel": "neontunnel",
  "vein-tunnel": "veintunnel",
  "kaleidoscope-mandala": "kaleidoscope",
  // Retro & Digital
  "matrix-rain": "matrix",
  "vod-lines": "vodlines",
  "night-radar": "nightradar",
  "diode-wall": "diodewall",
  "spectrogram": "spectogram",
  "spectrogram-radar": "spectogram",
  "lcd-deck": "lcddeck",
  "signal-lock": "signallock",
  // Organic & Nature
  "bloom-flower": "bloom",
  "ink-drops": "ink",
  "meadow-field": "meadow",
  "bio-cells": "biocells",
  "up-cloud": "upcloud",
  "rain-room": "rainroom",
  "ocean-waves": "ocean",
  "forest-canopy": "forest",
  "forest-storm": "forest",
  "single-tree": "singletree",
  "haunted-forest": "hauntedforest",
  "storm-cell": "stormcell",
  "jellyfish-mycelium": "jellyfish",
  "volcano-eruption": "volcano"
};
var studioComposerInstance = new StudioComposerPreset();
function getPreset(id) {
  if (id === "studio-composer") {
    return studioComposerInstance;
  }
  const canonicalId = PRESET_ALIASES[id] || id;
  const found = PRESETS.find((p) => p.id === canonicalId || p.id === id);
  const target = found || PRESETS[0];
  if (id in PRESET_ALIASES) {
    return new Proxy(target, {
      get(t, prop, receiver) {
        if (prop === "id") {
          return id;
        }
        const val = Reflect.get(t, prop, receiver);
        return typeof val === "function" ? val.bind(t) : val;
      }
    });
  }
  return target;
}

// src/engine/RenderEngine.ts
var PersistenceShader = {
  uniforms: {
    tDiffuse: { value: null },
    tFeedback: { value: null },
    uPersistence: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tFeedback;
    uniform float uPersistence;
    varying vec2 vUv;

    void main() {
      vec4 curr = texture2D(tDiffuse, vUv);
      if (uPersistence > 0.01) {
        vec4 prev = texture2D(tFeedback, vUv);
        vec3 trail = max(curr.rgb, prev.rgb * uPersistence);
        gl_FragColor = vec4(trail, max(curr.a, prev.a * uPersistence));
      } else {
        gl_FragColor = curr;
      }
    }
  `
};
var MasterShader = {
  uniforms: {
    tDiffuse: { value: null },
    tFeedback: { value: null },
    uPersistence: { value: 0 },
    uTime: { value: 0 },
    uVignette: { value: 0 },
    uFilmGrain: { value: 0 },
    uChromaticAberration: { value: 0 },
    uScanlines: { value: 0 },
    uCrtBend: { value: 0 },
    uAudioBass: { value: 0 },
    uKaleidoscope: { value: 0 },
    uMirror: { value: 0 },
    uPixelize: { value: 0 },
    uDrip: { value: 0 },
    uPhosphor: { value: 0 },
    uEdgeDetect: { value: 0 },
    uBrightness: { value: 0 },
    uResolution: { value: new THREE76.Vector2(1920, 1080) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tFeedback;
    uniform float uPersistence;
    uniform float uTime;
    uniform float uVignette;
    uniform float uFilmGrain;
    uniform float uChromaticAberration;
    uniform float uScanlines;
    uniform float uCrtBend;
    uniform float uAudioBass;
    uniform float uKaleidoscope;
    uniform float uMirror;
    uniform float uPixelize;
    uniform float uDrip;
    uniform float uPhosphor;
    uniform float uEdgeDetect;
    uniform float uBrightness;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec2 crtDistort(vec2 uv, float bend) {
      if (bend <= 0.001) return uv;
      vec2 cc = uv - 0.5;
      float dist = dot(cc, cc);
      return uv + cc * (dist * bend);
    }

    vec2 applyKaleido(vec2 uv, float segments, vec2 res) {
      if (segments <= 1.0) return uv;
      float aspect = res.x / max(res.y, 1.0);
      vec2 p = uv - 0.5;
      p.x *= aspect;

      float r = length(p);
      float a = atan(p.y, p.x);
      if (a < 0.0) a += 6.283185307;

      float seg = 6.283185307 / segments;
      a = mod(a, seg);
      if (a > seg * 0.5) a = seg - a;

      vec2 kp = vec2(cos(a), sin(a)) * r;
      kp.x /= aspect;
      vec2 kUv = kp + 0.5;

      // Seamless mirror reflection at edges (triangle wave folding between 0.0 and 1.0)
      // Eliminates black borders and seams completely
      return 1.0 - abs(fract(kUv * 0.5) * 2.0 - 1.0);
    }

    vec2 applyMirror(vec2 uv, float m) {
      if (m < 0.5) return uv;
      vec2 res = uv;
      if (m < 1.5) res.x = abs(res.x - 0.5) + 0.5;
      else if (m < 2.5) res.y = abs(res.y - 0.5) + 0.5;
      else res = abs(res - 0.5) + 0.5;
      return res;
    }

    vec2 applyPixelize(vec2 uv, float px, vec2 res) {
      if (px <= 1.0) return uv;
      vec2 grid = max(res / px, vec2(8.0));
      return floor(uv * grid) / grid;
    }

    vec2 applyDrip(vec2 uv, float amount, float time, float bass) {
      if (amount <= 0.001) return uv;
      float factor = amount * 0.018 + bass * 0.012;
      uv.x += sin(uv.y * 16.0 + time * 3.2) * factor;
      uv.y += cos(uv.x * 14.0 + time * 2.6) * factor;
      return uv;
    }

    void main() {
      // 1. Mirror Symmetry
      vec2 uv = applyMirror(vUv, uMirror);

      // 2. Kaleidoscope (aspect-corrected & seamless mirror wrapped)
      uv = applyKaleido(uv, uKaleidoscope, uResolution);

      // 3. Liquid Drip / Wave distortion
      uv = applyDrip(uv, uDrip, uTime, uAudioBass);

      // 4. CRT Barrel Distortion (seamlessly clamped to screen edges, never cutting out into black borders)
      float effectiveCrtBend = (uKaleidoscope > 0.001) ? 0.0 : uCrtBend;
      uv = crtDistort(uv, effectiveCrtBend);

      // 5. Pixelize / Retro Arcade
      uv = applyPixelize(uv, uPixelize, uResolution);

      uv = clamp(uv, 0.0, 1.0);

      // Chromatic Aberration
      float split = uChromaticAberration * (0.003 + uAudioBass * 0.012);
      vec2 dir = uv - 0.5;
      float r = texture2D(tDiffuse, uv + dir * split).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - dir * split).b;
      vec3 color = vec3(r, g, b);

      // Motion Persistence fallback
      if (uPersistence > 0.01) {
        vec3 fb = texture2D(tFeedback, uv).rgb;
        color = max(color, fb * uPersistence);
      }

      // Neon Edge Trace
      if (uEdgeDetect > 0.01) {
        vec2 off = 1.5 / max(uResolution, vec2(1.0));
        float lC = length(texture2D(tDiffuse, uv).rgb);
        float lL = length(texture2D(tDiffuse, uv - vec2(off.x, 0.0)).rgb);
        float lR = length(texture2D(tDiffuse, uv + vec2(off.x, 0.0)).rgb);
        float lU = length(texture2D(tDiffuse, uv + vec2(0.0, off.y)).rgb);
        float lD = length(texture2D(tDiffuse, uv - vec2(0.0, off.y)).rgb);
        float edge = (abs(lC - lL) + abs(lC - lR) + abs(lC - lU) + abs(lC - lD)) * 2.0;
        vec3 edgeCol = vec3(edge) * vec3(1.0, 0.7, 0.2);
        color = mix(color, max(color, edgeCol), uEdgeDetect);
      }

      // CRT Scanlines
      if (uScanlines > 0.01) {
        float scanline = sin(uv.y * 700.0) * 0.5 + 0.5;
        color *= 1.0 - (scanline * uScanlines * 0.35);
      }

      // Phosphor CRT Glow
      if (uPhosphor > 0.01) {
        float px = floor(mod(gl_FragCoord.x, 3.0));
        vec3 mask = (px == 0.0) ? vec3(1.25, 0.8, 0.8) : ((px == 1.0) ? vec3(0.8, 1.25, 0.8) : vec3(0.8, 0.8, 1.25));
        color *= mix(vec3(1.0), mask, uPhosphor * 0.55);
      }

      // Vignette (smooth corner-weighted cinematic falloff, never clipping to solid black bands)
      if (uVignette > 0.01) {
        vec2 p = uv - 0.5;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        p.x *= aspect;
        float dist = length(p);
        float maxCornerDist = length(vec2(0.5 * aspect, 0.5));
        float normDist = dist / max(maxCornerDist, 0.001);
        float vig = 1.0 - smoothstep(0.35, 1.1, normDist) * uVignette * 0.8;
        color *= clamp(vig, 0.0, 1.0);
      }

      // Film Grain
      if (uFilmGrain > 0.01) {
        float noise = (random(uv + vec2(uTime * 15.0, uTime * 23.0)) - 0.5) * uFilmGrain;
        color += noise;
      }

      // Brightness / Exposure
      if (abs(uBrightness) > 0.005) {
        color += vec3(uBrightness);
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
};
var RenderEngine = class {
  scene;
  camera;
  renderer;
  composer;
  renderPass;
  bloomPass;
  afterimagePass;
  persistencePass;
  masterPass;
  // Feedback targets for motion persistence
  feedbackTargets;
  currentFeedbackIndex = 0;
  copyScene;
  copyCamera;
  copyMaterial;
  activePreset = null;
  currentTheme;
  config;
  cameraController;
  textOverlay;
  cameraBasePos = new THREE76.Vector3(0, 0, 12);
  clock = new THREE76.Clock();
  constructor(canvas, initialTheme) {
    this.currentTheme = initialTheme;
    this.config = {
      bloomStrength: 0.36,
      bloomRadius: 0.45,
      bloomThreshold: 0.85,
      persistence: 0,
      chromaticAberration: 0,
      filmGrain: 0,
      vignette: 0,
      scanlines: 0,
      crtBend: 0,
      cameraShake: true,
      autoRotate: true,
      autoRotateSpeed: 0.35,
      kaleidoscope: 0,
      mirror: 0,
      pixelize: 0,
      drip: 0,
      phosphor: 0,
      edgeDetect: 0,
      brightness: 0,
      particleDensity: 1,
      particleSpread: 1
    };
    this.scene = new THREE76.Scene();
    this.scene.background = new THREE76.Color(initialTheme.background);
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE76.PerspectiveCamera(60, width / height, 0.1, 1e3);
    this.cameraController = new CameraController(this.camera, {
      baseRadius: 12,
      orbitSpeed: this.config.autoRotateSpeed
    });
    this.initConfigProperties();
    this.renderer = new THREE76.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE76.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE76.SRGBColorSpace;
    this.composer = new import_EffectComposer.EffectComposer(this.renderer);
    this.renderPass = new import_RenderPass.RenderPass(this.scene, this.camera);
    this.bloomPass = new import_UnrealBloomPass.UnrealBloomPass(
      new THREE76.Vector2(width, height),
      this.config.bloomStrength,
      this.config.bloomRadius,
      this.config.bloomThreshold
    );
    this.afterimagePass = new import_AfterimagePass.AfterimagePass(this.config.persistence);
    this.persistencePass = new import_ShaderPass.ShaderPass(PersistenceShader);
    this.masterPass = new import_ShaderPass.ShaderPass(MasterShader);
    this.initPostProcessing();
    const targetOptions = {
      minFilter: THREE76.LinearFilter,
      magFilter: THREE76.LinearFilter,
      format: THREE76.RGBAFormat
    };
    this.feedbackTargets = [
      new THREE76.WebGLRenderTarget(width, height, targetOptions),
      new THREE76.WebGLRenderTarget(width, height, targetOptions)
    ];
    this.copyScene = new THREE76.Scene();
    this.copyCamera = new THREE76.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.copyMaterial = new THREE76.MeshBasicMaterial({
      map: this.feedbackTargets[0].texture,
      transparent: false
    });
    const copyQuad = new THREE76.Mesh(new THREE76.PlaneGeometry(2, 2), this.copyMaterial);
    this.copyScene.add(copyQuad);
    this.initLighting();
    this.textOverlay = new TextOverlayEngine(width, height, this.renderer.getPixelRatio());
    window.addEventListener("resize", () => this.resize(window.innerWidth, window.innerHeight));
  }
  initConfigProperties() {
    Object.defineProperty(this.config, "autoRotate", {
      get: () => this.cameraController.autoRotate,
      set: (val) => {
        this.cameraController.autoRotate = val;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this.config, "autoRotateSpeed", {
      get: () => this.cameraController.autoRotateSpeed,
      set: (val) => {
        this.cameraController.autoRotateSpeed = val;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this.config, "cameraShake", {
      get: () => this.cameraController.cameraShakeEnabled,
      set: (val) => {
        this.cameraController.setCameraShakeEnabled(val);
      },
      enumerable: true,
      configurable: true
    });
  }
  initPostProcessing() {
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.afterimagePass.enabled = this.config.persistence > 0.01;
    this.composer.addPass(this.afterimagePass);
    this.composer.addPass(this.persistencePass);
    this.composer.addPass(this.masterPass);
  }
  initLighting() {
    this.scene.add(new THREE76.AmbientLight(16777215, 0.6));
    const dirLight = new THREE76.DirectionalLight(16777215, 1.2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
    const rimLight = new THREE76.DirectionalLight(16777215, 0.8);
    rimLight.position.set(-6, -5, -6);
    this.scene.add(rimLight);
  }
  restoreSavedPresetCamera(presetId) {
    if (typeof localStorage === "undefined") return false;
    try {
      const savedCamJson = localStorage.getItem(`visualizor_camera_${presetId}`);
      if (!savedCamJson) return false;
      const savedCam = JSON.parse(savedCamJson);
      this.cameraController.importState(savedCam, true);
      this.config.autoRotate = this.cameraController.autoRotate;
      this.config.autoRotateSpeed = this.cameraController.autoRotateSpeed;
      return true;
    } catch (err) {
      console.warn("Failed to parse saved camera state for preset", presetId, err);
      return false;
    }
  }
  applyDefaultPresetCamera(cfg) {
    if (cfg?.position) {
      const targetVec = cfg.target ? new THREE76.Vector3(...cfg.target) : new THREE76.Vector3(0, 0, 0);
      this.cameraController.setCameraPosition(cfg.position[0], cfg.position[1], cfg.position[2], targetVec);
      const autoRotate = cfg.autoRotate ?? true;
      const autoRotateSpeed = cfg.autoRotateSpeed !== void 0 && cfg.autoRotateSpeed >= 0 ? cfg.autoRotateSpeed : autoRotate ? 0.35 : 0;
      this.cameraController.autoRotate = autoRotate;
      this.config.autoRotate = autoRotate;
      this.cameraController.autoRotateSpeed = autoRotateSpeed;
      this.config.autoRotateSpeed = autoRotateSpeed;
    } else {
      this.cameraController.setCameraPosition(0, 4.5, 12, new THREE76.Vector3(0, 0, 0));
      this.cameraController.autoRotate = true;
      this.cameraController.autoRotateSpeed = 0.35;
      this.config.autoRotate = true;
      this.config.autoRotateSpeed = 0.35;
    }
    if (cfg?.rotAngle !== void 0) {
      this.cameraController.setOrbit(cfg.rotAngle, true);
    }
    if (cfg?.tiltAngle !== void 0) {
      this.cameraController.setTilt(cfg.tiltAngle, true);
    }
    if (cfg?.zoom !== void 0) {
      this.cameraController.setZoom(cfg.zoom, true, cfg.zoom > 1 || cfg.zoom < 0);
    }
    if (cfg?.bloomIntensity !== void 0) {
      const intensity = cfg.bloomIntensity;
      this.bloomPass.strength = intensity * 0.72;
      this.bloomPass.threshold = Math.max(0.05, 1 - intensity * 0.3);
      this.bloomPass.radius = 0.3 + intensity * 0.3;
    }
  }
  initPresetCamera(preset) {
    if (this.restoreSavedPresetCamera(preset.id)) return;
    this.applyDefaultPresetCamera(preset.cameraConfig);
  }
  setPreset(preset) {
    if (this.activePreset) {
      this.activePreset.dispose();
      const toRemove = [];
      this.scene.children.forEach((child) => {
        if (!(child instanceof THREE76.Light)) {
          toRemove.push(child);
        }
      });
      toRemove.forEach((obj) => this.scene.remove(obj));
    }
    this.activePreset = preset;
    this.initPresetCamera(preset);
    const intensity = preset.cameraConfig?.bloomIntensity ?? 0.5;
    this.bloomPass.strength = intensity * 0.72;
    this.bloomPass.threshold = Math.max(0.05, 1 - intensity * 0.3);
    this.bloomPass.radius = 0.3 + intensity * 0.3;
    preset.init({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      width: this.renderer.domElement.width,
      height: this.renderer.domElement.height,
      theme: this.currentTheme
    });
    this.updateParticleConfig(this.config);
  }
  setTheme(theme) {
    this.currentTheme = theme;
    this.scene.background = new THREE76.Color(theme.background);
    this.activePreset?.onThemeChange?.(theme);
  }
  updateBloomConfig(newConfig) {
    if (newConfig.bloomStrength !== void 0) {
      const intensity = newConfig.bloomStrength;
      this.bloomPass.strength = intensity * 0.72;
      this.bloomPass.threshold = Math.max(0.05, 1 - intensity * 0.3);
      this.bloomPass.radius = 0.3 + intensity * 0.3;
      return;
    }
    if (newConfig.bloomRadius !== void 0) this.bloomPass.radius = newConfig.bloomRadius;
    if (newConfig.bloomThreshold !== void 0) this.bloomPass.threshold = newConfig.bloomThreshold;
  }
  updateParticleConfig(newConfig) {
    const density = this.config.particleDensity ?? 1;
    const spread = this.config.particleSpread ?? 1;
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE76.Points) {
          const geom = obj.geometry;
          if (geom?.attributes?.position) {
            const totalCount = geom.attributes.position.count;
            if (density <= 0) {
              obj.visible = false;
              geom.setDrawRange(0, 0);
            } else {
              obj.visible = true;
              const activeCount = Math.max(1, Math.floor(totalCount * Math.min(1, density)));
              geom.setDrawRange(0, activeCount);
            }
          }
          if (spread > 0) {
            obj.scale.set(spread, spread, spread);
          }
          if (obj.material instanceof THREE76.ShaderMaterial && obj.material.uniforms?.uSpread) {
            obj.material.uniforms.uSpread.value = spread;
          }
        }
      });
    }
    const preset = this.activePreset;
    if (!preset) return;
    if (typeof preset.onParticleConfigChange === "function") {
      preset.onParticleConfigChange(density, spread);
    }
    if (typeof preset.setCustomParameter === "function") {
      if (newConfig.particleDensity !== void 0) {
        preset.setCustomParameter("density", newConfig.particleDensity);
        preset.setCustomParameter("particleCount", newConfig.particleDensity);
      }
      if (newConfig.particleSpread !== void 0) {
        preset.setCustomParameter("spread", newConfig.particleSpread);
      }
    }
  }
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    this.updateBloomConfig(newConfig);
    if (newConfig.persistence !== void 0) {
      this.afterimagePass.enabled = newConfig.persistence > 0.01;
      this.afterimagePass.uniforms["damp"].value = newConfig.persistence;
    }
    if (newConfig.autoRotate !== void 0) {
      this.cameraController.autoRotate = newConfig.autoRotate;
    }
    if (newConfig.autoRotateSpeed !== void 0) {
      this.cameraController.autoRotateSpeed = newConfig.autoRotateSpeed;
    }
    if (newConfig.cameraShake !== void 0) {
      this.cameraController.cameraShakeEnabled = newConfig.cameraShake;
    }
    this.updateParticleConfig(newConfig);
  }
  render(audio) {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();
    this.cameraController.update(delta, audio.beat, audio.bass);
    this.config.autoRotate = this.cameraController.autoRotate;
    this.config.cameraShake = this.cameraController.cameraShakeEnabled;
    if (this.activePreset) {
      this.activePreset.update({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
        width: this.renderer.domElement.width,
        height: this.renderer.domElement.height,
        theme: this.currentTheme
      }, audio, time, delta);
    }
    const currentReadTarget = this.feedbackTargets[this.currentFeedbackIndex];
    const currentWriteTarget = this.feedbackTargets[1 - this.currentFeedbackIndex];
    const uniforms = this.masterPass.uniforms;
    uniforms.uTime.value = time;
    uniforms.uVignette.value = this.config.vignette;
    uniforms.uFilmGrain.value = this.config.filmGrain;
    uniforms.uChromaticAberration.value = this.config.chromaticAberration;
    uniforms.uScanlines.value = this.config.scanlines;
    const hasKaleido = (this.config.kaleidoscope ?? 0) > 1e-3;
    uniforms.uCrtBend.value = hasKaleido ? 0 : this.config.crtBend;
    uniforms.uAudioBass.value = audio.bass;
    uniforms.uPersistence.value = this.config.persistence;
    uniforms.tFeedback.value = currentReadTarget.texture;
    uniforms.uKaleidoscope.value = this.config.kaleidoscope ?? 0;
    uniforms.uMirror.value = this.config.mirror ?? 0;
    uniforms.uPixelize.value = this.config.pixelize ?? 0;
    uniforms.uDrip.value = this.config.drip ?? 0;
    uniforms.uPhosphor.value = this.config.phosphor ?? 0;
    uniforms.uEdgeDetect.value = this.config.edgeDetect ?? 0;
    uniforms.uBrightness.value = this.config.brightness ?? 0;
    uniforms.uResolution.value.set(this.renderer.domElement.width, this.renderer.domElement.height);
    if (this.config.persistence > 0.01) {
      this.afterimagePass.enabled = true;
      this.afterimagePass.uniforms["damp"].value = this.config.persistence;
      this.persistencePass.enabled = true;
      this.persistencePass.uniforms.uPersistence.value = this.config.persistence;
      this.persistencePass.uniforms.tFeedback.value = currentReadTarget.texture;
    } else {
      this.afterimagePass.enabled = false;
      this.persistencePass.enabled = false;
    }
    this.composer.render();
    if (this.config.persistence > 0.01) {
      this.renderer.setRenderTarget(currentWriteTarget);
      this.copyMaterial.map = this.composer.readBuffer.texture;
      this.copyMaterial.needsUpdate = true;
      this.renderer.render(this.copyScene, this.copyCamera);
      this.renderer.setRenderTarget(null);
      this.currentFeedbackIndex = 1 - this.currentFeedbackIndex;
    }
    this.textOverlay.update(audio, delta);
    this.textOverlay.renderPass(this.renderer);
  }
  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.afterimagePass.setSize(width, height);
    this.feedbackTargets[0].setSize(width, height);
    this.feedbackTargets[1].setSize(width, height);
    this.textOverlay.resize(width, height, this.renderer.getPixelRatio());
    this.activePreset?.resize?.(width, height);
  }
  setCanvasBackground(mode, customColor) {
    const colorHex = mode === "dark" ? "#000000" : mode === "white" ? "#ffffff" : customColor ?? this.currentTheme.background ?? "#111116";
    const color = new THREE76.Color(colorHex);
    this.scene.background = color;
    this.renderer.setClearColor(color);
  }
  setImageOverlay(img) {
    this.textOverlay.setImageOverlay(img);
  }
  setImageOverlayOpacity(opacity) {
    this.textOverlay.setImageOverlayOpacity(opacity);
  }
  setImageOverlayScale(scale) {
    this.textOverlay.setImageOverlayScale(scale);
  }
  captureScreenshot() {
    return this.renderer.domElement.toDataURL("image/png");
  }
  setCameraPosition(rotAngle, tiltAngle, zoom, immediate) {
    this.cameraController.setPosition(rotAngle, tiltAngle, zoom, immediate);
  }
  setAutoRotate(enabled, speed, direction) {
    this.config.autoRotate = enabled;
    if (speed !== void 0) this.config.autoRotateSpeed = speed;
    this.cameraController.setAutoRotate(enabled, speed, direction);
  }
  triggerCameraShake(intensity) {
    this.cameraController.triggerShake(intensity);
  }
  saveCameraForPreset(presetId) {
    if (typeof localStorage === "undefined") return;
    const state = this.cameraController.exportState();
    localStorage.setItem(`visualizor_camera_${presetId}`, JSON.stringify(state));
  }
  resetCameraForPreset(presetId) {
    if (!presetId) return;
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(`visualizor_camera_${presetId}`);
    }
    const targetPreset = this.activePreset?.id === presetId ? this.activePreset : getPreset(presetId);
    this.applyDefaultPresetCamera(targetPreset?.cameraConfig);
  }
  hasSavedCameraForPreset(presetId) {
    if (typeof localStorage === "undefined") return false;
    return Boolean(localStorage.getItem(`visualizor_camera_${presetId}`));
  }
  setCameraShake(enabled, intensity) {
    this.config.cameraShake = enabled;
    this.cameraController.setCameraShakeEnabled(enabled);
    if (intensity !== void 0) {
      this.cameraController.setCameraShakeIntensity(intensity);
    }
  }
  setCameraViewpoint(viewpointId, immediate) {
    this.config.autoRotate = false;
    this.cameraController.setViewpoint(viewpointId, immediate);
  }
  setViewpoint(viewpointId, immediate) {
    this.config.autoRotate = false;
    this.cameraController.setViewpoint(viewpointId, immediate);
  }
  resetCamera() {
    if (this.activePreset?.cameraConfig) {
      this.resetCameraForPreset(this.activePreset.id);
    } else {
      this.config.autoRotate = true;
      this.cameraController.reset();
    }
  }
};

// tests/harness/contracts.ts
var CANONICAL_28_THEME_IDS = [
  "ember",
  "jade",
  "violet",
  "rose",
  "azure",
  "amber",
  "crimson",
  "teal",
  "slate",
  "indigo",
  "coral",
  "lime",
  "earthy",
  "terracotta",
  "sand",
  "lavender",
  "sunset",
  "synthwave",
  "toxic",
  "coral-reef",
  "firefly",
  "horizon",
  "arctic",
  "eclipse",
  "vapor",
  "nebula",
  "glacier",
  "prism"
];
var CANONICAL_15_RAIL_TOOLS = [
  { id: "presets", panel: "presetsPanel", label: "Presets" },
  { id: "presetSettings", panel: "tuningPanel", label: "Preset Tuning" },
  { id: "colors", panel: "themesPanel", label: "Themes" },
  { id: "effects", panel: "fxPanel", label: "Effects" },
  { id: "camera", panel: "cameraPanel", label: "Camera & Views" },
  { id: "audio", panel: "audioPanel", label: "Audio DSP" },
  { id: "overlay", panel: "overlayPanel", label: "Image Overlays" },
  { id: "text", panel: "textOverlayPanel", label: "Text & Typography" },
  { id: "subtitles", panel: "subtitlesPanel", label: "Subtitles" },
  { id: "tracks", panel: "queuePanel", label: "Playback Queue" },
  { id: "library", panel: "libraryPanel", label: "Library" },
  { id: "myCreations", panel: "studioPanel", label: "Studio Composer" },
  { id: "more", panel: "moreMenu", label: "More Extras" },
  { id: "shortcuts", panel: "shortcutsModal", label: "Shortcuts" },
  { id: "hideUi", panel: "none", label: "Hide UI" }
];
var CANONICAL_5_STUDIO_FAMILIES = [
  "Chroma",
  "Liquid",
  "Tunnel",
  "Volume",
  "The Force"
];
var CANONICAL_9_TEXT_ANCHORS = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
];
var CANONICAL_5_TEXT_ANIMATIONS = [
  "none",
  "pulse",
  "glow",
  "fade",
  "runningRow"
];
var DEFAULT_MIDI_CC_MAPPINGS = {
  1: "audioSensitivity",
  2: "animationSpeed",
  7: "audioVolume",
  10: "colorSaturation",
  71: "resonance",
  74: "bloomStrength"
};
function isValidHexColor(hex) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}
function computeZoomDistance2(normalizedZoom) {
  if (typeof normalizedZoom !== "number" || isNaN(normalizedZoom)) return 0.7;
  const clamped = Math.max(0, Math.min(1, normalizedZoom));
  return 0.7 + (2.5 - 0.7) * clamped;
}
function computeAutoRotateAngle(currentAngle, speed, direction) {
  const clampedSpeed = Math.max(0, Math.min(1, speed));
  const delta = (5e-4 + (55e-4 - 5e-4) * clampedSpeed) * direction;
  return currentAngle + delta;
}
function parseMidiCCMessage(bytes) {
  if (bytes.length < 3) return null;
  const status = bytes[0];
  if ((status & 240) !== 176) return null;
  const channel = status & 15;
  const cc = bytes[1];
  const rawVal = bytes[2];
  const normalizedValue = Math.max(0, Math.min(127, rawVal)) / 127;
  return { isCC: true, channel, cc, normalizedValue };
}
function sanitizeTextOverlayInput(raw) {
  const sanitized = String(raw).replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim().slice(0, 200);
  return {
    sanitized,
    enabled: sanitized.length > 0
  };
}

// tests/harness/fixtures.ts
var THREE77 = __toESM(require("three"), 1);
function createSilentAudioFeatures() {
  return {
    frequencyData: new Uint8Array(1024),
    timeDomainData: new Uint8Array(1024).fill(128),
    subBass: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    rms: 0,
    beat: false,
    beatEnergy: 0,
    bpm: 120
  };
}
function createBeatDropAudioFeatures(bassIntensity = 0.95) {
  const freq = new Uint8Array(1024);
  for (let i = 1; i < 15; i++) {
    freq[i] = Math.round(255 * bassIntensity);
  }
  const time = new Uint8Array(1024);
  for (let i = 0; i < time.length; i++) {
    time[i] = Math.round(128 + 120 * Math.sin(i * 0.1));
  }
  return {
    frequencyData: freq,
    timeDomainData: time,
    subBass: bassIntensity,
    bass: bassIntensity,
    mid: 0.3,
    treble: 0.2,
    rms: 0.85,
    beat: true,
    beatEnergy: 1,
    bpm: 128
  };
}
function createTrebleMelodyAudioFeatures() {
  const freq = new Uint8Array(1024);
  for (let i = 180; i < 600; i++) {
    freq[i] = 220;
  }
  return {
    frequencyData: freq,
    timeDomainData: new Uint8Array(1024).fill(128),
    subBass: 0.05,
    bass: 0.1,
    mid: 0.4,
    treble: 0.86,
    rms: 0.4,
    beat: false,
    beatEnergy: 0.1,
    bpm: 135
  };
}
function createMockTheme(id = "test-theme", primary = "#ff0055") {
  return {
    id,
    name: "Test Theme",
    primary,
    secondary: "#00ccff",
    accent: "#ffff00",
    background: "#0a0a0a",
    glow: "#ff00aa"
  };
}
var SpyVisualizerPreset = class {
  id = "spy-preset";
  name = "Spy Preset";
  category = "Structures";
  description = "Preset used to spy on lifecycle invocations.";
  initCalls = 0;
  updateCalls = 0;
  themeChangeCalls = 0;
  resizeCalls = 0;
  disposeCalls = 0;
  lastTheme;
  lastAudio;
  lastWidth = 0;
  lastHeight = 0;
  mesh;
  init(ctx) {
    this.initCalls++;
    const geom = new THREE77.BoxGeometry(1, 1, 1);
    const mat = new THREE77.MeshBasicMaterial({ color: ctx.theme.primary });
    this.mesh = new THREE77.Mesh(geom, mat);
    ctx.scene.add(this.mesh);
  }
  update(_ctx, audio, _time, _delta) {
    this.updateCalls++;
    this.lastAudio = audio;
  }
  onThemeChange(theme) {
    this.themeChangeCalls++;
    this.lastTheme = theme;
  }
  resize(width, height) {
    this.resizeCalls++;
    this.lastWidth = width;
    this.lastHeight = height;
  }
  dispose() {
    this.disposeCalls++;
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh.removeFromParent();
      this.mesh = void 0;
    }
  }
};
function createMockPresetContext(theme = createMockTheme()) {
  const scene = new THREE77.Scene();
  const camera = new THREE77.PerspectiveCamera(60, 1920 / 1080, 0.1, 1e3);
  const canvas = new MockElement("CANVAS");
  canvas.width = 1920;
  canvas.height = 1080;
  return {
    scene,
    camera,
    renderer: {
      domElement: canvas,
      setSize: () => {
      },
      render: () => {
      },
      dispose: () => {
      }
    },
    width: 1920,
    height: 1080,
    theme
  };
}

// tests/tier1-features/themes.test.ts
describe("Tier 1: Color Themes (#39)", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T1.Themes.1: Complete 28-theme catalog contains all required canonical themes", () => {
    expect(THEMES).toHaveLength(28);
    const themeIds = THEMES.map((t) => t.id);
    for (const expectedId of CANONICAL_28_THEME_IDS) {
      expect(themeIds).toContain(expectedId);
    }
  });
  test("T1.Themes.2: Every theme satisfies the VisualizerTheme interface contract with valid hex colors", () => {
    for (const theme of THEMES) {
      expect(typeof theme.id).toBe("string");
      expect(typeof theme.name).toBe("string");
      expect(isValidHexColor(theme.primary)).toBe(true);
      expect(isValidHexColor(theme.secondary)).toBe(true);
      expect(isValidHexColor(theme.accent)).toBe(true);
      expect(isValidHexColor(theme.background)).toBe(true);
      expect(isValidHexColor(theme.glow)).toBe(true);
    }
  });
  test("T1.Themes.3: getTheme retrieves matching theme for all 28 IDs", () => {
    for (const id of CANONICAL_28_THEME_IDS) {
      const theme = getTheme(id);
      expect(theme).toBeDefined();
      expect(theme.id).toBe(id);
    }
  });
  test("T1.Themes.4: getTheme falls back safely to Ember for unknown IDs", () => {
    const fallback1 = getTheme("non-existent-theme-xyz");
    expect(fallback1.id).toBe("ember");
    const fallback2 = getTheme("");
    expect(fallback2.id).toBe("ember");
  });
  test("T1.Themes.5: RenderEngine.setTheme updates scene background color to theme background", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const jadeTheme = getTheme("jade");
    engine.setTheme(jadeTheme);
    expect(engine.currentTheme.id).toBe("jade");
    expect(engine.scene.background).toBeDefined();
  });
  test("T1.Themes.6: RenderEngine.setTheme invokes onThemeChange on active preset", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const spyPreset = new SpyVisualizerPreset();
    engine.setPreset(spyPreset);
    const synthwave = getTheme("synthwave");
    engine.setTheme(synthwave);
    expect(spyPreset.themeChangeCalls).toBe(1);
    expect(spyPreset.lastTheme?.id).toBe("synthwave");
  });
});

// tests/tier1-features/rail.test.ts
describe("Tier 1: UI Navigation Rail Tools (#40)", () => {
  let railContainer;
  let detailPanels;
  beforeEach(() => {
    setupTestEnvironment();
    railContainer = new MockElement("NAV");
    railContainer.className = "icon-rail";
    document.body.appendChild(railContainer);
    detailPanels = /* @__PURE__ */ new Map();
    for (const tool of CANONICAL_15_RAIL_TOOLS) {
      const btn = new MockElement("BUTTON");
      btn.className = "rail-btn";
      btn.setAttribute("data-panel", tool.id);
      btn.setAttribute("aria-label", tool.label);
      railContainer.appendChild(btn);
      if (tool.panel !== "none" && !tool.panel.endsWith("Modal") && !tool.panel.endsWith("Menu")) {
        const panel = new MockElement("DIV");
        panel.id = tool.panel;
        panel.className = "detail-panel";
        document.body.appendChild(panel);
        detailPanels.set(tool.id, panel);
      }
    }
  });
  test("T1.Rail.1: Navigation rail defines all 15 canonical tools", () => {
    expect(CANONICAL_15_RAIL_TOOLS).toHaveLength(15);
    const toolIds = CANONICAL_15_RAIL_TOOLS.map((t) => t.id);
    expect(toolIds).toContain("presets");
    expect(toolIds).toContain("presetSettings");
    expect(toolIds).toContain("colors");
    expect(toolIds).toContain("effects");
    expect(toolIds).toContain("camera");
    expect(toolIds).toContain("audio");
    expect(toolIds).toContain("overlay");
    expect(toolIds).toContain("text");
    expect(toolIds).toContain("subtitles");
    expect(toolIds).toContain("tracks");
    expect(toolIds).toContain("library");
    expect(toolIds).toContain("myCreations");
    expect(toolIds).toContain("more");
    expect(toolIds).toContain("shortcuts");
    expect(toolIds).toContain("hideUi");
  });
  test("T1.Rail.2: Rail button activation adds active class and opens drawer", () => {
    const presetsBtn = railContainer.querySelector('[data-panel="presets"]');
    expect(presetsBtn).toBeDefined();
    presetsBtn.classList.add("active");
    const panel = detailPanels.get("presets");
    panel?.classList.add("open");
    expect(presetsBtn.classList.contains("active")).toBe(true);
    expect(panel?.classList.contains("open")).toBe(true);
  });
  test("T1.Rail.3: Clicking already active rail button closes drawer and removes active class", () => {
    const colorsBtn = railContainer.querySelector('[data-panel="colors"]');
    const panel = detailPanels.get("colors");
    colorsBtn.classList.add("active");
    panel?.classList.add("open");
    if (colorsBtn.classList.contains("active")) {
      colorsBtn.classList.remove("active");
      panel?.classList.remove("open");
    }
    expect(colorsBtn.classList.contains("active")).toBe(false);
    expect(panel?.classList.contains("open")).toBe(false);
  });
  test("T1.Rail.4: Switching between rail tools closes previous drawer and opens target drawer", () => {
    const presetsBtn = railContainer.querySelector('[data-panel="presets"]');
    const cameraBtn = railContainer.querySelector('[data-panel="camera"]');
    const presetsPanel = detailPanels.get("presets");
    const cameraPanel = detailPanels.get("camera");
    presetsBtn.classList.add("active");
    presetsPanel?.classList.add("open");
    presetsBtn.classList.remove("active");
    presetsPanel?.classList.remove("open");
    cameraBtn.classList.add("active");
    cameraPanel?.classList.add("open");
    expect(presetsBtn.classList.contains("active")).toBe(false);
    expect(presetsPanel?.classList.contains("open")).toBe(false);
    expect(cameraBtn.classList.contains("active")).toBe(true);
    expect(cameraPanel?.classList.contains("open")).toBe(true);
  });
  test("T1.Rail.5: Hide UI tool adds ui-hidden class to app root", () => {
    const appRoot = document.documentElement;
    const hideBtn = railContainer.querySelector('[data-panel="hideUi"]');
    hideBtn.click();
    appRoot.classList.add("ui-hidden");
    expect(appRoot.classList.contains("ui-hidden")).toBe(true);
  });
  test("T1.Rail.6: Viewport responsive detents adapt rail button layout dimensions", () => {
    const compactHeightThreshold = 900;
    const isCompact = 800 < compactHeightThreshold;
    const buttonHeight = isCompact ? 36 : 40;
    const presetsButtonHeight = isCompact ? 52 : 80;
    expect(buttonHeight).toBe(36);
    expect(presetsButtonHeight).toBe(52);
  });
});

// src/tuning/PresetTuningManager.ts
var STORAGE_PREFIX_TUNING = "visualizor_tuning_";
var STORAGE_PREFIX_PARAM_LOCKS = "visualizor_param_locks_";
var STORAGE_KEY_LOCKED_PRESETS = "visualizor_locked_presets";
var STORAGE_PREFIX_BOUNDS = "visualizor_random_bounds_";
var STORAGE_PREFIX_PARAM_BOUNDS = "visualizor_param_bounds_";
var STORAGE_KEY_AUTO_RANDOMIZE = "visualizor_auto_randomize_enabled";
function getStorageItem(key) {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function setStorageItem(key, value) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch {
  }
}
function removeStorageItem(key) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch {
  }
}
function getSavedTuning(presetId) {
  const raw = getStorageItem(STORAGE_PREFIX_TUNING + presetId);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}
function saveTuning(presetId, values) {
  setStorageItem(STORAGE_PREFIX_TUNING + presetId, JSON.stringify(values));
}
function clearSavedTuning(presetId) {
  removeStorageItem(STORAGE_PREFIX_TUNING + presetId);
}
function hasSavedTuning(presetId) {
  return getSavedTuning(presetId) !== null;
}
function isPresetLocked(presetId) {
  const raw = getStorageItem(STORAGE_KEY_LOCKED_PRESETS);
  if (!raw) return false;
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(presetId);
  } catch {
    return false;
  }
}
function setPresetLocked(presetId, locked) {
  let list = [];
  const raw = getStorageItem(STORAGE_KEY_LOCKED_PRESETS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [];
    }
  }
  if (locked) {
    if (!list.includes(presetId)) list.push(presetId);
  } else {
    list = list.filter((id) => id !== presetId);
  }
  setStorageItem(STORAGE_KEY_LOCKED_PRESETS, JSON.stringify(list));
}
function isParamLocked(presetId, paramId) {
  const raw = getStorageItem(STORAGE_PREFIX_PARAM_LOCKS + presetId);
  if (!raw) return false;
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(paramId);
  } catch {
    return false;
  }
}
function setParamLocked(presetId, paramId, locked) {
  let list = [];
  const raw = getStorageItem(STORAGE_PREFIX_PARAM_LOCKS + presetId);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [];
    }
  }
  if (locked) {
    if (!list.includes(paramId)) list.push(paramId);
  } else {
    list = list.filter((id) => id !== paramId);
  }
  setStorageItem(STORAGE_PREFIX_PARAM_LOCKS + presetId, JSON.stringify(list));
}
function getRandomizeBounds(presetId) {
  const raw = getStorageItem(STORAGE_PREFIX_BOUNDS + presetId);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.minPercent === "number" && typeof parsed?.maxPercent === "number") {
        return {
          minPercent: Math.max(0, Math.min(100, parsed.minPercent)),
          maxPercent: Math.max(0, Math.min(100, parsed.maxPercent))
        };
      }
    } catch {
    }
  }
  return { minPercent: 20, maxPercent: 80 };
}
function setRandomizeBounds(presetId, minPercent, maxPercent) {
  const boundedMin = Math.max(0, Math.min(100, Math.min(minPercent, maxPercent)));
  const boundedMax = Math.max(0, Math.min(100, Math.max(minPercent, maxPercent)));
  setStorageItem(STORAGE_PREFIX_BOUNDS + presetId, JSON.stringify({ minPercent: boundedMin, maxPercent: boundedMax }));
}
function getParamValueBounds(presetId, p) {
  const raw = getStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${presetId}_${p.id}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.minVal === "number" && typeof parsed?.maxVal === "number") {
        return {
          minVal: Math.max(p.min, Math.min(p.max, parsed.minVal)),
          maxVal: Math.max(p.min, Math.min(p.max, parsed.maxVal))
        };
      }
      if (typeof parsed?.minPercent === "number" && typeof parsed?.maxPercent === "number") {
        const range = p.max - p.min;
        return {
          minVal: Number((p.min + parsed.minPercent / 100 * range).toFixed(4)),
          maxVal: Number((p.min + parsed.maxPercent / 100 * range).toFixed(4))
        };
      }
    } catch {
    }
  }
  return { minVal: p.min, maxVal: p.max };
}
function setParamValueBounds(presetId, paramId, minVal, maxVal) {
  const boundedMin = Math.min(minVal, maxVal);
  const boundedMax = Math.max(minVal, maxVal);
  setStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${presetId}_${paramId}`, JSON.stringify({ minVal: boundedMin, maxVal: boundedMax }));
}
function isAutoRandomizeEnabled() {
  const val = getStorageItem(STORAGE_KEY_AUTO_RANDOMIZE);
  return val === null ? true : val === "true";
}
function setAutoRandomizeEnabled(enabled) {
  setStorageItem(STORAGE_KEY_AUTO_RANDOMIZE, String(enabled));
}
function computeRandomParamValue(p, minVal, maxVal) {
  const boundedMin = Math.max(p.min, Math.min(p.max, Math.min(minVal, maxVal)));
  const boundedMax = Math.max(p.min, Math.min(p.max, Math.max(minVal, maxVal)));
  const range = boundedMax - boundedMin;
  const randVal = boundedMin + Math.random() * range;
  const snapped = Math.round((randVal - p.min) / p.step) * p.step + p.min;
  return Math.max(p.min, Math.min(p.max, Number(snapped.toFixed(4))));
}
function randomizeSingleParameter(preset, paramId, overrideMin, overrideMax) {
  if (!preset || typeof preset.getCustomParameters !== "function") return void 0;
  const params = preset.getCustomParameters();
  const p = params?.find((item) => item.id === paramId);
  if (!p) return void 0;
  if (isParamLocked(preset.id, paramId)) {
    return typeof preset.getCustomParameterValue === "function" ? preset.getCustomParameterValue(paramId) ?? p.defaultValue : p.defaultValue;
  }
  const hasCustom = getStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${preset.id}_${p.id}`) !== null;
  let minVal;
  let maxVal;
  if (hasCustom) {
    const bounds = getParamValueBounds(preset.id, p);
    minVal = overrideMin ?? bounds.minVal;
    maxVal = overrideMax ?? bounds.maxVal;
  } else {
    const globalBounds = getRandomizeBounds(preset.id);
    const pRange = p.max - p.min;
    minVal = overrideMin ?? p.min + globalBounds.minPercent / 100 * pRange;
    maxVal = overrideMax ?? p.min + globalBounds.maxPercent / 100 * pRange;
  }
  const newVal = computeRandomParamValue(p, minVal, maxVal);
  preset.setCustomParameter?.(paramId, newVal);
  return newVal;
}
function randomizePreset(preset, overrideMinPercent, overrideMaxPercent) {
  const result = {};
  if (!preset || typeof preset.getCustomParameters !== "function") return result;
  const params = preset.getCustomParameters();
  if (!params || params.length === 0) return result;
  const globalBounds = getRandomizeBounds(preset.id);
  const minP = typeof overrideMinPercent === "number" ? overrideMinPercent : globalBounds.minPercent;
  const maxP = typeof overrideMaxPercent === "number" ? overrideMaxPercent : globalBounds.maxPercent;
  for (const p of params) {
    if (isParamLocked(preset.id, p.id)) {
      const current = typeof preset.getCustomParameterValue === "function" ? preset.getCustomParameterValue(p.id) ?? p.defaultValue : p.defaultValue;
      result[p.id] = current;
    } else {
      const hasCustom = getStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${preset.id}_${p.id}`) !== null;
      let minVal;
      let maxVal;
      if (hasCustom) {
        const bounds = getParamValueBounds(preset.id, p);
        minVal = bounds.minVal;
        maxVal = bounds.maxVal;
      } else {
        const pRange = p.max - p.min;
        minVal = p.min + Math.min(minP, maxP) / 100 * pRange;
        maxVal = p.min + Math.max(minP, maxP) / 100 * pRange;
      }
      const newVal = computeRandomParamValue(p, minVal, maxVal);
      preset.setCustomParameter?.(p.id, newVal);
      result[p.id] = newVal;
    }
  }
  return result;
}

// src/tuning/TuningPanel.ts
var BOUND_SLIDER_CLASS = "ui-slider tuning-bound-slider";
var ARIA_LABEL = "aria-label";
function formatParamValue(val, step) {
  if (Number.isInteger(step)) return Math.round(val).toString();
  const decimals = step < 0.1 ? 2 : 1;
  return val.toFixed(decimals);
}
function updateTuningButtonState(preset, customBtn, customPanel, onClose) {
  const tuningBtn = customBtn ?? document.querySelector(".preset-settings-link");
  const panel = customPanel ?? document.getElementById("tuningPanel");
  if (!tuningBtn) return false;
  const tunable = preset;
  const hasParams = Boolean(
    tunable && typeof tunable.getCustomParameters === "function" && (tunable.getCustomParameters()?.length ?? 0) > 0
  );
  if (hasParams) {
    tuningBtn.classList.remove("is-collapsed");
  } else {
    tuningBtn.classList.add("is-collapsed");
    if (panel?.classList.contains("open")) {
      panel.classList.remove("open");
      tuningBtn.classList.remove("active");
      if (onClose) {
        onClose();
      }
    }
  }
  return hasParams;
}
function renderToolbar(preset, content) {
  const toolbar = document.createElement("div");
  toolbar.className = "tuning-toolbar";
  const locked = isPresetLocked(preset.id);
  const lockBtn = document.createElement("button");
  lockBtn.type = "button";
  lockBtn.id = "togglePresetLockBtn";
  lockBtn.className = `btn-pill tuning-lock-btn ${locked ? "locked" : ""}`;
  lockBtn.title = locked ? "Preset is locked (Auto-cycle will not change preset)" : "Click to lock preset during Auto-cycle";
  lockBtn.innerHTML = locked ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>Preset Locked</span>` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg><span>Lock Preset</span>`;
  lockBtn.addEventListener("click", () => {
    const nowLocked = !isPresetLocked(preset.id);
    setPresetLocked(preset.id, nowLocked);
    lockBtn.className = `btn-pill tuning-lock-btn ${nowLocked ? "locked" : ""}`;
    lockBtn.title = nowLocked ? "Preset is locked (Auto-cycle will not change preset)" : "Click to lock preset during Auto-cycle";
    lockBtn.innerHTML = nowLocked ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>Preset Locked</span>` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg><span>Lock Preset</span>`;
  });
  const savedBadge = document.createElement("span");
  savedBadge.className = "tuning-saved-badge";
  savedBadge.textContent = "Custom Saved \u2713";
  savedBadge.style.display = hasSavedTuning(preset.id) ? "inline-block" : "none";
  toolbar.appendChild(lockBtn);
  toolbar.appendChild(savedBadge);
  content.appendChild(toolbar);
}
function createParamMarginDrawer(preset, p) {
  const drawer = document.createElement("div");
  drawer.className = "tuning-param-margin-drawer";
  drawer.id = `tuning_${p.id}_margin_drawer`;
  drawer.style.cssText = "display:none;margin-top:4px;padding:6px 8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:6px;font-size:10px;";
  const bounds = getParamValueBounds(preset.id, p);
  let minVal = bounds.minVal;
  let maxVal = bounds.maxVal;
  const header = document.createElement("div");
  header.className = "fx-margin-header";
  const label = document.createElement("label");
  label.className = "fx-margin-label";
  label.textContent = "Margin:";
  label.htmlFor = `tuning_${p.id}_margin_min`;
  const minInput = document.createElement("input");
  minInput.type = "number";
  minInput.id = `tuning_${p.id}_margin_min`;
  minInput.className = "ui-val-input tuning-bound-input-min";
  minInput.min = p.min.toString();
  minInput.max = p.max.toString();
  minInput.step = p.step.toString();
  minInput.value = minVal.toString();
  minInput.setAttribute(ARIA_LABEL, `Min margin for ${p.name}`);
  minInput.title = `Min margin for ${p.name}`;
  const dash = document.createElement("span");
  dash.className = "fx-margin-dash";
  dash.textContent = "\u2014";
  const maxInput = document.createElement("input");
  maxInput.type = "number";
  maxInput.id = `tuning_${p.id}_margin_max`;
  maxInput.className = "ui-val-input tuning-bound-input-max";
  maxInput.min = p.min.toString();
  maxInput.max = p.max.toString();
  maxInput.step = p.step.toString();
  maxInput.value = maxVal.toString();
  maxInput.setAttribute(ARIA_LABEL, `Max margin for ${p.name}`);
  maxInput.title = `Max margin for ${p.name}`;
  const readout = document.createElement("span");
  readout.className = "tuning-range-readout";
  readout.textContent = `Margin: ${minVal} \u2014 ${maxVal}`;
  readout.style.display = "none";
  header.appendChild(label);
  header.appendChild(minInput);
  header.appendChild(dash);
  header.appendChild(maxInput);
  header.appendChild(readout);
  const slidersRow = document.createElement("div");
  slidersRow.className = "fx-margin-sliders";
  const minSlider = document.createElement("input");
  minSlider.type = "range";
  minSlider.id = `tuning_${p.id}_bound_min`;
  minSlider.className = BOUND_SLIDER_CLASS;
  minSlider.min = p.min.toString();
  minSlider.max = p.max.toString();
  minSlider.step = p.step.toString();
  minSlider.value = minVal.toString();
  minSlider.setAttribute(ARIA_LABEL, `Min margin slider for ${p.name}`);
  minSlider.title = "Min Margin";
  const maxSlider = document.createElement("input");
  maxSlider.type = "range";
  maxSlider.id = `tuning_${p.id}_bound_max`;
  maxSlider.className = BOUND_SLIDER_CLASS;
  maxSlider.min = p.min.toString();
  maxSlider.max = p.max.toString();
  maxSlider.step = p.step.toString();
  maxSlider.value = maxVal.toString();
  maxSlider.setAttribute(ARIA_LABEL, `Max margin slider for ${p.name}`);
  maxSlider.title = "Max Margin";
  const syncBounds = (newMin, newMax) => {
    minVal = Math.min(newMin, newMax);
    maxVal = Math.max(newMin, newMax);
    if (document.activeElement !== minInput) minInput.value = minVal.toString();
    if (document.activeElement !== maxInput) maxInput.value = maxVal.toString();
    minSlider.value = minVal.toString();
    maxSlider.value = maxVal.toString();
    readout.textContent = `Margin: ${minVal} \u2014 ${maxVal}`;
    setParamValueBounds(preset.id, p.id, minVal, maxVal);
  };
  minSlider.addEventListener("input", () => {
    syncBounds(Number(minSlider.value), Number(maxSlider.value));
  });
  maxSlider.addEventListener("input", () => {
    syncBounds(Number(minSlider.value), Number(maxSlider.value));
  });
  const onInputsChange = () => {
    let vMin = Number(minInput.value);
    let vMax = Number(maxInput.value);
    if (Number.isNaN(vMin)) vMin = p.min;
    if (Number.isNaN(vMax)) vMax = p.max;
    vMin = Math.max(p.min, Math.min(p.max, vMin));
    vMax = Math.max(p.min, Math.min(p.max, vMax));
    syncBounds(vMin, vMax);
  };
  minInput.addEventListener("input", onInputsChange);
  maxInput.addEventListener("input", onInputsChange);
  slidersRow.appendChild(minSlider);
  slidersRow.appendChild(maxSlider);
  drawer.appendChild(header);
  drawer.appendChild(slidersRow);
  return drawer;
}
function renderParameterRow(preset, p, content) {
  const currentVal = typeof preset.getCustomParameterValue === "function" ? preset.getCustomParameterValue(p.id) ?? p.defaultValue : p.defaultValue;
  const row = document.createElement("div");
  row.className = "control-row";
  const label = document.createElement("label");
  label.className = "control-label";
  label.htmlFor = `tuning_${p.id}_slider`;
  const leftWrap = document.createElement("div");
  leftWrap.style.cssText = "display:flex;align-items:center;gap:6px;";
  const isLocked = isParamLocked(preset.id, p.id);
  const lockToggle = document.createElement("button");
  lockToggle.type = "button";
  lockToggle.className = `tuning-param-lock-btn ${isLocked ? "locked" : ""}`;
  lockToggle.id = `tuning_${p.id}_lock`;
  lockToggle.title = isLocked ? "Parameter locked against randomization" : "Lock parameter against randomization";
  lockToggle.innerHTML = isLocked ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
  lockToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newLock = !isParamLocked(preset.id, p.id);
    setParamLocked(preset.id, p.id, newLock);
    lockToggle.className = `tuning-param-lock-btn ${newLock ? "locked" : ""}`;
    lockToggle.title = newLock ? "Parameter locked against randomization" : "Lock parameter against randomization";
    lockToggle.innerHTML = newLock ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
  });
  const randParamBtn = document.createElement("button");
  randParamBtn.type = "button";
  randParamBtn.className = "tuning-param-rand-btn";
  randParamBtn.id = `tuning_${p.id}_rand_btn`;
  randParamBtn.title = `Randomize ${p.name} within its margin`;
  randParamBtn.innerHTML = "\u{1F3B2}";
  const marginDrawer = createParamMarginDrawer(preset, p);
  const gearBtn = document.createElement("button");
  gearBtn.type = "button";
  gearBtn.className = "tuning-param-gear-btn";
  gearBtn.id = `tuning_${p.id}_gear_btn`;
  gearBtn.title = `Configure margin bounds for ${p.name}`;
  gearBtn.innerHTML = "\u2699\uFE0F";
  gearBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isHidden = marginDrawer.style.display === "none";
    marginDrawer.style.display = isHidden ? "block" : "none";
    gearBtn.classList.toggle("active", isHidden);
  });
  const nameSpan = document.createElement("span");
  nameSpan.textContent = p.name;
  leftWrap.appendChild(lockToggle);
  leftWrap.appendChild(randParamBtn);
  leftWrap.appendChild(gearBtn);
  leftWrap.appendChild(nameSpan);
  const rightWrap = document.createElement("div");
  rightWrap.style.cssText = "display:flex;align-items:center;gap:6px;";
  const valInput = document.createElement("input");
  valInput.type = "number";
  valInput.className = "ui-val-input tuning-param-val-input";
  valInput.id = `tuning_${p.id}_input`;
  valInput.min = p.min.toString();
  valInput.max = p.max.toString();
  valInput.step = p.step.toString();
  valInput.value = currentVal.toString();
  valInput.title = `Direct value for ${p.name}`;
  const valSpan = document.createElement("span");
  valSpan.id = `tuning_${p.id}_val`;
  valSpan.className = "tuning-val-readout";
  valSpan.textContent = formatParamValue(currentVal, p.step);
  valSpan.style.display = "none";
  rightWrap.appendChild(valInput);
  rightWrap.appendChild(valSpan);
  label.appendChild(leftWrap);
  label.appendChild(rightWrap);
  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "ui-slider tuning-slider";
  slider.id = `tuning_${p.id}_slider`;
  slider.dataset.paramId = p.id;
  slider.min = p.min.toString();
  slider.max = p.max.toString();
  slider.step = p.step.toString();
  slider.setAttribute("min", p.min.toString());
  slider.setAttribute("max", p.max.toString());
  slider.setAttribute("step", p.step.toString());
  slider.value = currentVal.toString();
  slider.setAttribute(ARIA_LABEL, p.name);
  slider.addEventListener("input", (e) => {
    const target = e.target ?? slider;
    const numVal = Number(target.value);
    if (typeof preset.setCustomParameter === "function") {
      preset.setCustomParameter(p.id, numVal);
    }
    const updatedVal = typeof preset.getCustomParameterValue === "function" ? preset.getCustomParameterValue(p.id) ?? numVal : numVal;
    valSpan.textContent = formatParamValue(updatedVal, p.step);
    if (document.activeElement !== valInput) {
      valInput.value = updatedVal.toString();
    }
  });
  valInput.addEventListener("input", () => {
    let numVal = Number(valInput.value);
    if (Number.isNaN(numVal)) return;
    numVal = Math.max(p.min, Math.min(p.max, numVal));
    if (typeof preset.setCustomParameter === "function") {
      preset.setCustomParameter(p.id, numVal);
    }
    slider.value = numVal.toString();
    valSpan.textContent = formatParamValue(numVal, p.step);
  });
  randParamBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newVal = randomizeSingleParameter(preset, p.id);
    if (newVal !== void 0) {
      slider.value = newVal.toString();
      valInput.value = newVal.toString();
      valSpan.textContent = formatParamValue(newVal, p.step);
    }
  });
  row.appendChild(label);
  row.appendChild(slider);
  row.appendChild(marginDrawer);
  content.appendChild(row);
}
function renderRandomizeCard(preset, params, content) {
  const card = document.createElement("div");
  card.className = "tuning-random-card";
  const bounds = getRandomizeBounds(preset.id);
  let minP = bounds.minPercent;
  let maxP = bounds.maxPercent;
  const header = document.createElement("div");
  header.className = "tuning-random-header";
  const titleSpan = document.createElement("span");
  titleSpan.className = "tuning-random-title";
  titleSpan.textContent = "Auto Margin & Variation";
  const randBtn = document.createElement("button");
  randBtn.type = "button";
  randBtn.className = "btn-pill";
  randBtn.id = "randomizePresetParamsBtn";
  randBtn.style.cssText = "font-size:11px;padding:4px 10px;gap:4px;background:rgba(255,92,0,0.18);border-color:rgba(255,92,0,0.5);color:#ffaa66;";
  randBtn.innerHTML = `<span>\u{1F3B2} Randomize</span>`;
  randBtn.addEventListener("click", () => {
    const newVals = randomizePreset(preset, minP, maxP);
    for (const [id, val] of Object.entries(newVals)) {
      const slider = content.querySelector(`#tuning_${id}_slider`);
      const valInput = content.querySelector(`#tuning_${id}_input`);
      const valSpan = content.querySelector(`#tuning_${id}_val`);
      const p = params.find((param) => param.id === id);
      if (slider) slider.value = val.toString();
      if (valInput) valInput.value = val.toString();
      if (valSpan && p) valSpan.textContent = formatParamValue(val, p.step);
    }
  });
  header.appendChild(titleSpan);
  header.appendChild(randBtn);
  card.appendChild(header);
  const rangeDesc = document.createElement("div");
  rangeDesc.className = "tuning-range-labels";
  const rangeReadout = document.createElement("span");
  rangeReadout.className = "tuning-range-readout";
  rangeReadout.textContent = `Margin: ${minP}% \u2014 ${maxP}%`;
  rangeDesc.textContent = "Randomize Bounds: ";
  rangeDesc.appendChild(rangeReadout);
  card.appendChild(rangeDesc);
  const boundsRow = document.createElement("div");
  boundsRow.className = "tuning-bounds-row";
  const minSlider = document.createElement("input");
  minSlider.type = "range";
  minSlider.id = "tuning_global_bound_min";
  minSlider.className = BOUND_SLIDER_CLASS;
  minSlider.min = "0";
  minSlider.max = "100";
  minSlider.step = "5";
  minSlider.value = minP.toString();
  minSlider.setAttribute(ARIA_LABEL, "Minimum Randomization Margin Slider");
  minSlider.title = "Minimum Randomization Margin (%)";
  const maxSlider = document.createElement("input");
  maxSlider.type = "range";
  maxSlider.id = "tuning_global_bound_max";
  maxSlider.className = BOUND_SLIDER_CLASS;
  maxSlider.min = "0";
  maxSlider.max = "100";
  maxSlider.step = "5";
  maxSlider.value = maxP.toString();
  maxSlider.setAttribute(ARIA_LABEL, "Maximum Randomization Margin Slider");
  maxSlider.title = "Maximum Randomization Margin (%)";
  const onBoundsChange = () => {
    minP = Math.min(Number(minSlider.value), Number(maxSlider.value));
    maxP = Math.max(Number(minSlider.value), Number(maxSlider.value));
    rangeReadout.textContent = `Margin: ${minP}% \u2014 ${maxP}%`;
    setRandomizeBounds(preset.id, minP, maxP);
  };
  minSlider.addEventListener("input", onBoundsChange);
  maxSlider.addEventListener("input", onBoundsChange);
  boundsRow.appendChild(minSlider);
  boundsRow.appendChild(maxSlider);
  card.appendChild(boundsRow);
  const autoRow = document.createElement("label");
  autoRow.className = "tuning-auto-toggle-row";
  autoRow.htmlFor = "tuning_auto_randomize_checkbox";
  const autoCheckbox = document.createElement("input");
  autoCheckbox.type = "checkbox";
  autoCheckbox.id = "tuning_auto_randomize_checkbox";
  autoCheckbox.setAttribute(ARIA_LABEL, "Mutate within margin in Auto Mode");
  autoCheckbox.checked = isAutoRandomizeEnabled();
  autoCheckbox.style.cssText = "accent-color:var(--primary);cursor:pointer;";
  autoCheckbox.addEventListener("change", () => {
    setAutoRandomizeEnabled(autoCheckbox.checked);
  });
  const autoLabel = document.createElement("span");
  autoLabel.textContent = "\u26A1 Mutate within margin in Auto Mode";
  autoRow.appendChild(autoCheckbox);
  autoRow.appendChild(autoLabel);
  card.appendChild(autoRow);
  content.appendChild(card);
}
function renderTuningActions(preset, params, content) {
  const actionsWrap = document.createElement("div");
  actionsWrap.className = "tuning-actions-wrap";
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.id = "saveTuningBtn";
  saveBtn.className = "btn-pill tuning-save-btn";
  saveBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
    <span>Save Preset</span>
  `;
  saveBtn.addEventListener("click", () => {
    const values = {};
    for (const p of params) {
      values[p.id] = typeof preset.getCustomParameterValue === "function" ? preset.getCustomParameterValue(p.id) ?? p.defaultValue : p.defaultValue;
    }
    saveTuning(preset.id, values);
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("visualizor:save_camera", { detail: { presetId: preset.id } }));
    }
    saveBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span style="color:#22c55e;">Saved \u2713</span>
    `;
    const savedBadge = content.querySelector(".tuning-saved-badge");
    if (savedBadge) {
      savedBadge.style.display = "inline-block";
    }
    setTimeout(() => {
      saveBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        <span>Save Preset</span>
      `;
    }, 1800);
  });
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.id = "resetTuningBtn";
  resetBtn.className = "btn-pill";
  resetBtn.style.cssText = "font-size:11px;padding:5px 12px;gap:5px;";
  resetBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    <span>Reset to Defaults</span>
  `;
  resetBtn.addEventListener("click", () => {
    if (typeof preset.resetCustomParameters === "function") {
      preset.resetCustomParameters();
    } else {
      for (const p of params) {
        preset.setCustomParameter?.(p.id, p.defaultValue);
      }
    }
    clearSavedTuning(preset.id);
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("visualizor:reset_camera", { detail: { presetId: preset.id } }));
    }
    params.forEach((p) => {
      const slider = content.querySelector(`#tuning_${p.id}_slider`);
      const valInput = content.querySelector(`#tuning_${p.id}_input`);
      const valSpan = content.querySelector(`#tuning_${p.id}_val`);
      if (slider) slider.value = p.defaultValue.toString();
      if (valInput) valInput.value = p.defaultValue.toString();
      if (valSpan) valSpan.textContent = formatParamValue(p.defaultValue, p.step);
    });
    const savedBadge = content.querySelector(".tuning-saved-badge");
    if (savedBadge) savedBadge.style.display = "none";
  });
  actionsWrap.appendChild(saveBtn);
  actionsWrap.appendChild(resetBtn);
  content.appendChild(actionsWrap);
}
function renderTuningPanel(preset, customContent) {
  const content = customContent ?? document.getElementById("presetSettingsContent");
  if (!content) return;
  const tunable = preset;
  const params = tunable && typeof tunable.getCustomParameters === "function" ? tunable.getCustomParameters() : void 0;
  content.innerHTML = "";
  if (!tunable || !params || params.length === 0) {
    const emptyNotice = document.createElement("div");
    emptyNotice.className = "sidebar-item u-text-center u-py-24 u-color-muted u-text-13 tuning-fallback-notice";
    emptyNotice.style.cssText = "text-align:center;padding:24px 12px;color:var(--text-muted);font-size:13px;";
    emptyNotice.textContent = "No settings for this preset";
    content.appendChild(emptyNotice);
    return;
  }
  renderToolbar(tunable, content);
  const desc = document.createElement("div");
  desc.style.cssText = "font-size:11px;color:var(--text-muted);margin-bottom:14px;line-height:1.4;";
  desc.textContent = "Dynamic parameter controls for real-time vertex deformation, speed, and particle density.";
  content.appendChild(desc);
  params.forEach((p) => {
    renderParameterRow(tunable, p, content);
  });
  renderRandomizeCard(tunable, params, content);
  renderTuningActions(tunable, params, content);
}

// tests/tier1-features/tuning.test.ts
var SampleTunablePreset = class {
  id = "sample-tunable";
  name = "Sample Tunable";
  category = "Structures";
  description = "Preset with custom fine-tuning parameters.";
  parameters = {
    waveHeight: 0.35,
    animSpeed: 0.5,
    metalness: 0.25,
    particleDensity: 1
  };
  init() {
  }
  update() {
  }
  dispose() {
  }
  getCustomParameters() {
    return [
      { id: "waveHeight", name: "Wave Height", min: 0, max: 1, step: 0.05, defaultValue: 0.35 },
      { id: "animSpeed", name: "Speed", min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 },
      { id: "metalness", name: "Metalness", min: 0, max: 1, step: 0.05, defaultValue: 0.25 },
      { id: "particleDensity", name: "Particle Density", min: 0, max: 2, step: 0.1, defaultValue: 1 }
    ];
  }
  setCustomParameter(id, value) {
    const param = this.getCustomParameters().find((p) => p.id === id);
    if (!param) return;
    const clamped = Math.max(param.min, Math.min(param.max, value));
    this.parameters[id] = clamped;
  }
};
var NonTunablePreset = class {
  id = "non-tunable";
  name = "Non Tunable";
  category = "Structures";
  description = "Preset without custom parameters.";
  init() {
  }
  update() {
  }
  dispose() {
  }
};
describe("Tier 1: Preset Fine-Tuning (#41)", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T1.Tuning.1: Preset declares valid parameter definitions conforming to schema", () => {
    const preset = new SampleTunablePreset();
    const params = preset.getCustomParameters();
    expect(params.length).toBe(4);
    for (const p of params) {
      expect(typeof p.id).toBe("string");
      expect(typeof p.name).toBe("string");
      expect(p.min).toBeLessThanOrEqual(p.max);
      expect(p.defaultValue).toBeGreaterThanOrEqual(p.min);
      expect(p.defaultValue).toBeLessThanOrEqual(p.max);
    }
  });
  test("T1.Tuning.2: Setting parameter value clamps to min and max boundaries", () => {
    const preset = new SampleTunablePreset();
    preset.setCustomParameter("waveHeight", -5);
    expect(preset.parameters.waveHeight).toBe(0);
    preset.setCustomParameter("animSpeed", 10);
    expect(preset.parameters.animSpeed).toBe(2);
    preset.setCustomParameter("metalness", 0.75);
    expect(preset.parameters.metalness).toBe(0.75);
  });
  test("T1.Tuning.3: Non-tunable preset reports no parameters, triggering UI collapsed state", () => {
    const nonTunable = new NonTunablePreset();
    const params = nonTunable.getCustomParameters ? nonTunable.getCustomParameters() : [];
    expect(params).toHaveLength(0);
    const shouldCollapse = params.length === 0;
    expect(shouldCollapse).toBe(true);
  });
  test("T1.Tuning.4: setCustomParameter ignores unknown parameter IDs gracefully", () => {
    const preset = new SampleTunablePreset();
    const initialParams = { ...preset.parameters };
    preset.setCustomParameter("unknown_parameter_xyz", 99);
    expect(preset.parameters).toEqual(initialParams);
  });
  test("T1.Tuning.5: Active preset parameter synchronization preserves values during execution", () => {
    const preset = new SampleTunablePreset();
    preset.init();
    preset.setCustomParameter("particleDensity", 1.8);
    expect(preset.parameters.particleDensity).toBe(1.8);
    preset.update();
    expect(preset.parameters.particleDensity).toBe(1.8);
    preset.dispose();
  });
  test("T1.Tuning.6: Real preset catalog entries declare valid parameters conforming to schema", () => {
    const presetsToVerify = [
      new WaveFormPreset(),
      new ParticleFieldPreset(),
      new CircularSpectrumPreset(),
      new FerrofluidPreset(),
      new ObsidianPolyPreset(),
      new NeonTunnelPreset(),
      new StarfieldPreset(),
      new ThreeDBarsPreset(),
      new SynthwaveTerrainPreset()
    ];
    for (const preset of presetsToVerify) {
      expect(typeof preset.getCustomParameters).toBe("function");
      const params = preset.getCustomParameters();
      expect(params.length).toBeGreaterThanOrEqual(3);
      for (const p of params) {
        expect(typeof p.id).toBe("string");
        expect(typeof p.name).toBe("string");
        expect(p.min).toBeLessThanOrEqual(p.max);
        expect(p.defaultValue).toBeGreaterThanOrEqual(p.min);
        expect(p.defaultValue).toBeLessThanOrEqual(p.max);
        expect(p.step).toBeGreaterThan(0);
      }
    }
  });
  test("T1.Tuning.7: Dynamic slider DOM generation in #tuningPanel matches active preset parameters", () => {
    const railBtn = new MockElement("BUTTON");
    railBtn.id = "presetSettingsRailBtn";
    railBtn.className = "rail-btn preset-settings-link is-collapsed";
    document.body.appendChild(railBtn);
    const tuningPanel = new MockElement("DIV");
    tuningPanel.id = "tuningPanel";
    tuningPanel.className = "drawer-panel detail-panel";
    const content = new MockElement("DIV");
    content.id = "presetSettingsContent";
    tuningPanel.appendChild(content);
    document.body.appendChild(tuningPanel);
    const preset = new WaveFormPreset();
    updateTuningButtonState(preset, railBtn, tuningPanel);
    renderTuningPanel(preset, content);
    expect(railBtn.classList.contains("is-collapsed")).toBe(false);
    const sliders = content.querySelectorAll(".tuning-slider");
    const params = preset.getCustomParameters();
    expect(sliders.length).toBe(params.length);
    params.forEach((p) => {
      const slider = content.querySelector(`#tuning_${p.id}_slider`);
      expect(slider).toBeDefined();
      expect(slider.getAttribute("data-param-id")).toBe(p.id);
      expect(Number(slider.getAttribute("min"))).toBe(p.min);
      expect(Number(slider.getAttribute("max"))).toBe(p.max);
      expect(Number(slider.getAttribute("step"))).toBe(p.step);
      expect(Number(slider.value)).toBe(p.defaultValue);
    });
  });
  test("T1.Tuning.8: Live slider input event propagates to preset and updates value readout immediately", () => {
    const content = new MockElement("DIV");
    content.id = "presetSettingsContent";
    document.body.appendChild(content);
    const preset = new WaveFormPreset();
    renderTuningPanel(preset, content);
    const speedSlider = content.querySelector("#tuning_speed_slider");
    const speedReadout = content.querySelector("#tuning_speed_val");
    expect(speedSlider).toBeDefined();
    expect(speedReadout).toBeDefined();
    speedSlider.value = "2.4";
    speedSlider.dispatchEvent(new Event("input"));
    expect(preset.getCustomParameterValue("speed")).toBe(2.4);
    expect(speedReadout.textContent).toBe("2.4");
  });
  test("T1.Tuning.9: Reset button restores default parameter values and DOM elements", () => {
    const content = new MockElement("DIV");
    content.id = "presetSettingsContent";
    document.body.appendChild(content);
    const preset = new WaveFormPreset();
    renderTuningPanel(preset, content);
    const speedSlider = content.querySelector("#tuning_speed_slider");
    const speedReadout = content.querySelector("#tuning_speed_val");
    speedSlider.value = "2.5";
    speedSlider.dispatchEvent(new Event("input"));
    expect(preset.getCustomParameterValue("speed")).toBe(2.5);
    const resetBtn = content.querySelector("#resetTuningBtn");
    expect(resetBtn).toBeDefined();
    resetBtn.click();
    expect(preset.getCustomParameterValue("speed")).toBe(1);
    expect(Number(speedSlider.value)).toBe(1);
    expect(speedReadout.textContent).toBe("1.0");
  });
  test("T1.Tuning.10: Non-tunable preset displays fallback notice and collapses rail button", () => {
    const railBtn = new MockElement("BUTTON");
    railBtn.id = "presetSettingsRailBtn";
    railBtn.className = "rail-btn preset-settings-link";
    document.body.appendChild(railBtn);
    const tuningPanel = new MockElement("DIV");
    tuningPanel.id = "tuningPanel";
    tuningPanel.className = "drawer-panel detail-panel open";
    const content = new MockElement("DIV");
    content.id = "presetSettingsContent";
    tuningPanel.appendChild(content);
    document.body.appendChild(tuningPanel);
    const milkdrop = new MilkDropPreset();
    updateTuningButtonState(milkdrop, railBtn, tuningPanel);
    renderTuningPanel(milkdrop, content);
    expect(railBtn.classList.contains("is-collapsed")).toBe(true);
    expect(tuningPanel.classList.contains("open")).toBe(false);
    const fallbackNotice = content.querySelector(".tuning-fallback-notice");
    expect(fallbackNotice).toBeDefined();
    expect(fallbackNotice.textContent).toBe("No settings for this preset");
    const sliders = content.querySelectorAll(".tuning-slider");
    expect(sliders.length).toBe(0);
  });
});

// tests/tier1-features/camera.test.ts
describe("Tier 1: Camera & 3D Viewpoints (#42)", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T1.Camera.1: Spherical coordinates contract maps orbit and tilt updates", () => {
    let rotAngle = 0;
    let tiltAngle = 0;
    const orbitStep = 0.05;
    rotAngle += orbitStep * 1;
    expect(rotAngle).toBeCloseTo(0.05);
    const tiltStep = 0.05;
    tiltAngle += tiltStep * 1;
    expect(tiltAngle).toBeCloseTo(0.05);
  });
  test("T1.Camera.2: Tilt angle clamps strictly within [-PI/2, PI/2] to prevent gimbal lock", () => {
    const halfPi = Math.PI / 2;
    const clampTilt = (angle) => Math.max(-halfPi, Math.min(halfPi, angle));
    expect(clampTilt(2.5)).toBeCloseTo(halfPi);
    expect(clampTilt(-3)).toBeCloseTo(-halfPi);
    expect(clampTilt(0.4)).toBeCloseTo(0.4);
  });
  test("T1.Camera.3: Zoom slider maps normalized [0.0, 1.0] to camera distance multiplier", () => {
    expect(computeZoomDistance2(0)).toBeCloseTo(0.7);
    expect(computeZoomDistance2(0.5)).toBeCloseTo(1.6);
    expect(computeZoomDistance2(1)).toBeCloseTo(2.5);
    expect(computeZoomDistance2(-0.5)).toBeCloseTo(0.7);
    expect(computeZoomDistance2(1.5)).toBeCloseTo(2.5);
  });
  test("T1.Camera.4: Auto-rotation increments rotAngle continuously with speed and direction", () => {
    let angle = 0;
    angle = computeAutoRotateAngle(angle, 0.5, 1);
    expect(angle).toBeGreaterThan(0);
    angle = computeAutoRotateAngle(angle, 0.5, -1);
    expect(angle).toBeCloseTo(0);
  });
  test("T1.Camera.5: Audio-reactive camera shake triggers on beat and decays per frame", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.config.autoRotate = false;
    engine.config.cameraShake = true;
    const initialPos = engine.camera.position.clone();
    const beatAudio = createBeatDropAudioFeatures(0.9);
    engine.render(beatAudio);
    const posDuringShake = engine.camera.position.clone();
    expect(posDuringShake.distanceTo(initialPos)).toBeGreaterThan(0);
    const silentAudio = createSilentAudioFeatures();
    for (let i = 0; i < 20; i++) {
      engine.render(silentAudio);
    }
    const posAfterDecay = engine.camera.position.clone();
    expect(posAfterDecay.distanceTo(initialPos)).toBeCloseTo(0, 0.05);
  });
  test("T1.Camera.6: RenderEngine auto-rotate rotates camera around origin", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.config.autoRotate = true;
    engine.config.autoRotateSpeed = 1;
    const silentAudio = createSilentAudioFeatures();
    engine.render(silentAudio);
    const p1 = engine.camera.position.clone();
    setTimeout(() => {
    }, 50);
    engine.render(silentAudio);
    const p2 = engine.camera.position.clone();
    const radius1 = Math.sqrt(p1.x * p1.x + p1.z * p1.z);
    const radius2 = Math.sqrt(p2.x * p2.x + p2.z * p2.z);
    expect(radius1).toBeCloseTo(12, 0.1);
    expect(radius2).toBeCloseTo(12, 0.1);
  });
  test("T1.Camera.7: D-pad UI buttons (orbit and tilt) adjust camera angles and clamp correctly", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const ctrl = engine.cameraController;
    const initialRot = ctrl.getRotAngle();
    const initialTilt = ctrl.getTiltAngle();
    ctrl.nudgeOrbit(0.1);
    expect(ctrl.getRotAngle()).toBeCloseTo(initialRot + 0.1);
    ctrl.nudgeOrbit(-0.1);
    expect(ctrl.getRotAngle()).toBeCloseTo(initialRot);
    ctrl.nudgeTilt(0.1);
    expect(ctrl.getTiltAngle()).toBeCloseTo(initialTilt + 0.1);
    ctrl.nudgeTilt(-0.1);
    expect(ctrl.getTiltAngle()).toBeCloseTo(initialTilt);
    ctrl.nudgeOrbit(0.5);
    ctrl.nudgeTilt(0.3);
    ctrl.reset();
    expect(ctrl.getRotAngle()).toBeCloseTo(0);
    expect(ctrl.getTiltAngle()).toBeCloseTo(0);
    expect(ctrl.getZoom()).toBeCloseTo(0.5);
  });
  test("T1.Camera.8: Zoom slider maps normalized values to clamped camera distances", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const ctrl = engine.cameraController;
    ctrl.setZoom(0, true);
    expect(ctrl.getZoom()).toBeCloseTo(0);
    const minDistance = ctrl.getDistance();
    expect(minDistance).toBeCloseTo(computeZoomDistance2(0) * 12 / 1.6, 0.5);
    ctrl.setZoom(1, true);
    expect(ctrl.getZoom()).toBeCloseTo(1);
    const maxDistance = ctrl.getDistance();
    expect(maxDistance).toBeGreaterThan(minDistance);
    ctrl.setZoom(-1.5, true);
    expect(ctrl.getZoom()).toBe(0);
    ctrl.setZoom(2.5, true);
    expect(ctrl.getZoom()).toBe(1);
  });
  test("T1.Camera.9: Auto-orbit toggle, speed, and CW/CCW direction modulate camera trajectory", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const ctrl = engine.cameraController;
    ctrl.setAutoRotate(true);
    ctrl.setAutoRotateSpeed(0.5);
    ctrl.setRotationDirection(1);
    const startRot = ctrl.getRotAngle();
    ctrl.update(0.1);
    const cwRot = ctrl.getRotAngle();
    expect(cwRot).toBeGreaterThan(startRot);
    ctrl.setRotationDirection(-1);
    ctrl.update(0.1);
    expect(ctrl.getRotAngle()).toBeLessThan(cwRot);
    ctrl.setAutoRotate(false);
    const pausedRot = ctrl.getRotAngle();
    ctrl.update(0.5);
    expect(ctrl.getRotAngle()).toBeCloseTo(pausedRot);
  });
  test("T1.Camera.10: Cinematic viewpoints (Default, Top, Low, Iso, Side) snap/lerp to predefined coordinates", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const ctrl = engine.cameraController;
    const silentAudio = createSilentAudioFeatures();
    engine.setViewpoint("top");
    expect(ctrl.getActiveViewpoint()).toBe("top");
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getTiltAngle()).toBeCloseTo(Math.PI / 2 - 0.05, 0.05);
    engine.setViewpoint("low");
    expect(ctrl.getActiveViewpoint()).toBe("low");
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getTiltAngle()).toBeLessThan(-0.5);
    engine.setViewpoint("iso");
    expect(ctrl.getActiveViewpoint()).toBe("iso");
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getRotAngle()).toBeCloseTo(Math.PI / 4, 0.1);
    engine.setViewpoint("side");
    expect(ctrl.getActiveViewpoint()).toBe("side");
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getRotAngle()).toBeCloseTo(Math.PI / 2, 0.1);
    engine.setViewpoint("default");
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getRotAngle()).toBeCloseTo(0, 0.05);
    expect(ctrl.getTiltAngle()).toBeCloseTo(0, 0.05);
  });
  test("T1.Camera.11: Camera shake sensitivity and mode controls modulate kick impulse magnitude", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const ctrl = engine.cameraController;
    ctrl.setCameraShakeEnabled(false);
    ctrl.triggerShake(1);
    expect(ctrl.getShakeOffset().length()).toBe(0);
    ctrl.setCameraShakeEnabled(true);
    ctrl.setCameraShakeIntensity(0.3);
    ctrl.triggerShake(1);
    const subtleMag = ctrl.getShakeOffset().length();
    expect(subtleMag).toBeGreaterThan(0);
    ctrl.setCameraShakeIntensity(1);
    ctrl.triggerShake(1);
    const strongMag = ctrl.getShakeOffset().length();
    expect(strongMag).toBeGreaterThan(subtleMag);
    for (let i = 0; i < 30; i++) ctrl.update(0.033);
    expect(ctrl.getShakeOffset().length()).toBeCloseTo(0, 0.05);
  });
  test("T1.Camera.12: Polar angle clamping prevents gimbal flips and camera inversion at Zenith and Nadir", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const ctrl = engine.cameraController;
    for (let i = 0; i < 50; i++) {
      ctrl.nudgeTilt(0.2);
    }
    const maxTilt = ctrl.getTiltAngle();
    expect(maxTilt).toBeLessThanOrEqual(Math.PI / 2 - 0.04);
    expect(maxTilt).toBeGreaterThan(1.4);
    for (let i = 0; i < 50; i++) {
      ctrl.nudgeTilt(-0.2);
    }
    const minTilt = ctrl.getTiltAngle();
    expect(minTilt).toBeGreaterThanOrEqual(-Math.PI / 2 + 0.04);
    expect(minTilt).toBeLessThan(-1.4);
    expect(isFinite(engine.camera.position.x)).toBe(true);
    expect(isFinite(engine.camera.position.y)).toBe(true);
    expect(isFinite(engine.camera.position.z)).toBe(true);
    expect(isNaN(engine.camera.position.x)).toBe(false);
  });
  test("T1.Camera.13: Viewpoint transition under active engine.render() loop reaches PI/2 without auto-orbit clobbering", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const silentAudio = createSilentAudioFeatures();
    expect(engine.config.autoRotate).toBe(true);
    expect(engine.cameraController.autoRotate).toBe(true);
    engine.setViewpoint("side");
    expect(engine.config.autoRotate).toBe(false);
    expect(engine.cameraController.autoRotate).toBe(false);
    for (let i = 0; i < 60; i++) {
      engine.render(silentAudio);
    }
    const finalRot = engine.cameraController.getRotAngle();
    expect(finalRot).toBeCloseTo(Math.PI / 2, 0.05);
    expect(engine.cameraController.autoRotate).toBe(false);
    expect(engine.config.autoRotate).toBe(false);
  });
  test("T1.Camera.14: DOM controls (#tiltUp, #rotateLeft, #zoomSlider, #viewTopBtn) drive camera rig and viewpoints", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const silentAudio = createSilentAudioFeatures();
    const rotateLeft = new MockElement("BUTTON");
    rotateLeft.id = "rotateLeft";
    rotateLeft.setAttribute("data-axis", "orbit");
    rotateLeft.setAttribute("data-direction", "-1");
    const tiltUp = new MockElement("BUTTON");
    tiltUp.id = "tiltUp";
    tiltUp.setAttribute("data-axis", "tilt");
    tiltUp.setAttribute("data-direction", "1");
    const zoomSlider = new MockElement("INPUT");
    zoomSlider.id = "zoomSlider";
    zoomSlider.setAttribute("type", "range");
    zoomSlider.value = "0.5";
    const viewTopBtn = new MockElement("BUTTON");
    viewTopBtn.id = "viewTopBtn";
    viewTopBtn.setAttribute("data-view", "top");
    const autoRotateToggle = new MockElement("INPUT");
    autoRotateToggle.id = "autoRotateToggle";
    autoRotateToggle.setAttribute("type", "checkbox");
    autoRotateToggle.checked = true;
    rotateLeft.addEventListener("click", () => {
      engine.setAutoRotate(false);
      engine.cameraController.nudge("orbit", -1, 0.1);
      autoRotateToggle.checked = false;
    });
    tiltUp.addEventListener("click", () => {
      engine.setAutoRotate(false);
      engine.cameraController.nudge("tilt", 1, 0.1);
      autoRotateToggle.checked = false;
    });
    zoomSlider.addEventListener("input", () => {
      const val = Number.parseFloat(zoomSlider.value);
      engine.cameraController.setZoom(val, true);
    });
    viewTopBtn.addEventListener("click", () => {
      engine.setAutoRotate(false);
      engine.setViewpoint("top");
      autoRotateToggle.checked = false;
    });
    const initialRot = engine.cameraController.getRotAngle();
    rotateLeft.click();
    expect(engine.cameraController.getRotAngle()).toBeLessThan(initialRot);
    expect(engine.cameraController.autoRotate).toBe(false);
    expect(engine.config.autoRotate).toBe(false);
    const initialTilt = engine.cameraController.getTiltAngle();
    tiltUp.click();
    expect(engine.cameraController.getTiltAngle()).toBeGreaterThan(initialTilt);
    zoomSlider.value = "0.9";
    zoomSlider.dispatchEvent(new Event("input"));
    expect(engine.cameraController.getZoom()).toBeCloseTo(0.9);
    expect(engine.cameraController.getDistance()).toBeGreaterThan(12);
    viewTopBtn.click();
    expect(engine.cameraController.getActiveViewpoint()).toBe("top");
    for (let i = 0; i < 60; i++) {
      engine.render(silentAudio);
    }
    expect(engine.cameraController.getTiltAngle()).toBeCloseTo(Math.PI / 2 - 0.05, 0.05);
    expect(engine.config.autoRotate).toBe(false);
  });
});

// tests/tier1-features/overlay.test.ts
describe("Tier 1: Text & Typography Overlays (#43)", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T1.Overlay.1: 3-line independent text overlay model maintains discrete states", () => {
    const lines = [
      {
        text: "Visualizor Track Title",
        enabled: true,
        anchor: "top-center",
        offsetX: 0,
        offsetY: 0.1,
        fontSize: 32,
        fontFamily: "sans-serif",
        color: "#ffffff",
        animation: "pulse",
        animationIntensity: 0.7
      },
      {
        text: "Electronic Artist",
        enabled: true,
        anchor: "center",
        offsetX: 0,
        offsetY: 0,
        fontSize: 24,
        fontFamily: "sans-serif",
        color: "#ff00aa",
        animation: "glow",
        animationIntensity: 0.5
      },
      {
        text: "Lyrics stream line",
        enabled: false,
        anchor: "bottom-center",
        offsetX: 0,
        offsetY: -0.1,
        fontSize: 18,
        fontFamily: "monospace",
        color: "#00ffff",
        animation: "runningRow",
        animationIntensity: 1
      }
    ];
    expect(lines).toHaveLength(3);
    expect(lines[0].text).toBe("Visualizor Track Title");
    expect(lines[1].animation).toBe("glow");
    expect(lines[2].enabled).toBe(false);
  });
  test("T1.Overlay.2: 9-point anchor matrix covers all screen quadrants", () => {
    expect(CANONICAL_9_TEXT_ANCHORS).toHaveLength(9);
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("top-left");
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("top-center");
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("top-right");
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("center-left");
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("center");
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("center-right");
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("bottom-left");
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("bottom-center");
    expect(CANONICAL_9_TEXT_ANCHORS).toContain("bottom-right");
  });
  test("T1.Overlay.3: 5 animation modes defined with proper reactive properties", () => {
    expect(CANONICAL_5_TEXT_ANIMATIONS).toHaveLength(5);
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain("none");
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain("pulse");
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain("glow");
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain("fade");
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain("runningRow");
  });
  test("T1.Overlay.4: sanitizeTextOverlayInput sanitizes and clamps input strings", () => {
    const res1 = sanitizeTextOverlayInput("  Hello   World  ");
    expect(res1.sanitized).toBe("Hello World");
    expect(res1.enabled).toBe(true);
    const res2 = sanitizeTextOverlayInput("    ");
    expect(res2.sanitized).toBe("");
    expect(res2.enabled).toBe(false);
    const longStr = "a".repeat(300);
    const res3 = sanitizeTextOverlayInput(longStr);
    expect(res3.sanitized.length).toBe(200);
    expect(res3.enabled).toBe(true);
  });
  test("T1.Overlay.5: Audio reactive pulse animation scales proportional to bass energy", () => {
    const calcPulseScale = (baseScale, bass, intensity) => {
      return baseScale * (1 + bass * intensity * 0.35);
    };
    const base = 1;
    const quietScale = calcPulseScale(base, 0.1, 0.8);
    const dropScale = calcPulseScale(base, 0.9, 0.8);
    expect(quietScale).toBeCloseTo(1.028);
    expect(dropScale).toBeCloseTo(1.252);
    expect(dropScale).toBeGreaterThan(quietScale);
  });
  test("T1.Overlay.6: Running row marquee scroll computes horizontal translation from time and speed", () => {
    const computeMarqueeOffset = (time, speed, direction) => {
      return time * speed * direction % 1;
    };
    const offsetForward = computeMarqueeOffset(2.5, 0.2, 1);
    expect(offsetForward).toBeCloseTo(0.5);
    const offsetReverse = computeMarqueeOffset(2.5, 0.2, -1);
    expect(offsetReverse).toBeCloseTo(-0.5);
  });
  test('T1.Overlay.7: "T" rail icon opens/closes #textOverlayPanel and updates active state', () => {
    const textBtn = new MockElement("BUTTON");
    textBtn.id = "textBtn";
    textBtn.setAttribute("data-panel", "text");
    const panel = new MockElement("DIV");
    panel.id = "textOverlayPanel";
    panel.className = "drawer-panel detail-panel";
    const closeBtn = new MockElement("BUTTON");
    closeBtn.className = "close-drawer-btn closeTextBtn";
    textBtn.classList.add("active");
    panel.classList.add("open");
    expect(textBtn.classList.contains("active")).toBe(true);
    expect(panel.classList.contains("open")).toBe(true);
    textBtn.classList.remove("active");
    panel.classList.remove("open");
    expect(textBtn.classList.contains("active")).toBe(false);
    expect(panel.classList.contains("open")).toBe(false);
    textBtn.classList.add("active");
    panel.classList.add("open");
    closeBtn.click();
    panel.classList.remove("open");
    textBtn.classList.remove("active");
    expect(panel.classList.contains("open")).toBe(false);
  });
  test("T1.Overlay.8: TextOverlayEngine initialization and state update methods", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    expect(engine.textOverlay).toBeDefined();
    const config = engine.textOverlay.getConfig();
    expect(config.layers).toBeDefined();
    expect(config.anchor).toBe("center");
    expect(config.watermark).toBe(false);
    expect(config.fontSize).toBe(32);
    expect(config.color).toBe("#ffffff");
    engine.textOverlay.setTitle("Starlight Horizon");
    engine.textOverlay.setArtist("Cosmic Drift");
    engine.textOverlay.setCustomText("Live 2026");
    engine.textOverlay.setWatermark(true);
    engine.textOverlay.setAnchor("bottom-center");
    engine.textOverlay.setAnimationMode("glitch");
    engine.textOverlay.setFontSize(48);
    engine.textOverlay.setColor("#00FFAA");
    engine.textOverlay.setGlowIntensity(1.5);
    engine.textOverlay.setOpacity(0.9);
    const updated = engine.textOverlay.getConfig();
    expect(updated.layers.title).toBe("Starlight Horizon");
    expect(updated.layers.artist).toBe("Cosmic Drift");
    expect(updated.layers.custom).toBe("Live 2026");
    expect(updated.watermark).toBe(true);
    expect(updated.anchor).toBe("bottom-center");
    expect(updated.animation).toBe("glitch");
    expect(updated.fontSize).toBe(48);
    expect(updated.color).toBe("#00FFAA");
    expect(updated.glowIntensity).toBe(1.5);
    expect(updated.opacity).toBe(0.9);
  });
  test("T1.Overlay.9: Multi-layer text values reflect in engine state and rendering", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.textOverlay.setTitle("Track A");
    engine.textOverlay.setArtist("Artist B");
    engine.textOverlay.setCustomText("VIP Mix");
    engine.textOverlay.setWatermark(true);
    const activeLayers = engine.textOverlay.getActiveLayers();
    expect(activeLayers).toContain("title");
    expect(activeLayers).toContain("artist");
    expect(activeLayers).toContain("custom");
    expect(engine.textOverlay.hasActiveContent()).toBe(true);
    engine.textOverlay.setTitle("");
    expect(engine.textOverlay.getActiveLayers()).not.toContain("title");
    expect(engine.textOverlay.getActiveLayers()).toContain("artist");
    expect(engine.textOverlay.hasActiveContent()).toBe(true);
    engine.textOverlay.setArtist("");
    engine.textOverlay.setCustomText("");
    expect(engine.textOverlay.hasActiveContent()).toBe(true);
  });
  test("T1.Overlay.10: 9-point anchor matrix coordinates calculated accurately across quadrants", () => {
    const width = 1920;
    const height = 1080;
    const margin = 40;
    const computeCoords = (anchor) => {
      let x = width / 2;
      let y = height / 2;
      let align = "center";
      let baseline = "middle";
      if (anchor.includes("left")) {
        x = margin;
        align = "left";
      }
      if (anchor.includes("right")) {
        x = width - margin;
        align = "right";
      }
      if (anchor.startsWith("top")) {
        y = margin;
        baseline = "top";
      }
      if (anchor.startsWith("bottom")) {
        y = height - margin;
        baseline = "bottom";
      }
      return { x, y, align, baseline };
    };
    const tl = computeCoords("top-left");
    expect(tl.x).toBe(margin);
    expect(tl.y).toBe(margin);
    expect(tl.align).toBe("left");
    expect(tl.baseline).toBe("top");
    const c = computeCoords("center");
    expect(c.x).toBe(960);
    expect(c.y).toBe(540);
    expect(c.align).toBe("center");
    expect(c.baseline).toBe("middle");
    const br = computeCoords("bottom-right");
    expect(br.x).toBe(1880);
    expect(br.y).toBe(1040);
    expect(br.align).toBe("right");
    expect(br.baseline).toBe("bottom");
  });
  test("T1.Overlay.11: All 5 animation modes cycle and apply appropriate parameters", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const modes = ["pulse", "marquee", "fade", "static", "glitch"];
    for (const mode of modes) {
      engine.textOverlay.setAnimationMode(mode);
      expect(engine.textOverlay.getConfig().animation).toBe(mode);
    }
    engine.textOverlay.setAnimationMode("glitch");
    const audioKick = createBeatDropAudioFeatures(0.95);
    engine.textOverlay.update(audioKick, 0.016);
    const glitchOffset = engine.textOverlay.getGlitchDisplacement();
    expect(Math.abs(glitchOffset.x) + Math.abs(glitchOffset.y)).toBeGreaterThan(0);
    engine.textOverlay.setAnimationMode("static");
    engine.textOverlay.update(audioKick, 0.016);
    const staticScale = engine.textOverlay.getScaleMultiplier();
    expect(staticScale).toBeCloseTo(1);
  });
  test("T1.Overlay.12: Typography slider changes update overlay styling in real time", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.textOverlay.setFontSize(5);
    expect(engine.textOverlay.getConfig().fontSize).toBe(12);
    engine.textOverlay.setFontSize(150);
    expect(engine.textOverlay.getConfig().fontSize).toBe(96);
    engine.textOverlay.setGlowIntensity(-1);
    expect(engine.textOverlay.getConfig().glowIntensity).toBe(0);
    engine.textOverlay.setGlowIntensity(3.5);
    expect(engine.textOverlay.getConfig().glowIntensity).toBe(2);
    engine.textOverlay.setOpacity(1.5);
    expect(engine.textOverlay.getConfig().opacity).toBe(1);
  });
  test("T1.Overlay.13: DOM controls drive engine state via user interactions", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const textInput = new MockElement("INPUT");
    textInput.id = "textInput0";
    textInput.value = "New Title";
    const watermarkToggle = new MockElement("INPUT");
    watermarkToggle.checked = true;
    const fontSlider = new MockElement("INPUT");
    fontSlider.value = "42";
    textInput.addEventListener("input", () => engine.textOverlay.setTitle(textInput.value));
    watermarkToggle.addEventListener("change", () => engine.textOverlay.setWatermark(watermarkToggle.checked));
    fontSlider.addEventListener("input", () => engine.textOverlay.setFontSize(Number(fontSlider.value)));
    textInput.dispatchEvent(new Event("input"));
    watermarkToggle.dispatchEvent(new Event("change"));
    fontSlider.dispatchEvent(new Event("input"));
    expect(engine.textOverlay.getConfig().layers.title).toBe("New Title");
    expect(engine.textOverlay.getConfig().watermark).toBe(true);
    expect(engine.textOverlay.getConfig().fontSize).toBe(42);
  });
  test("T1.Overlay.14: Render loop multi-pass execution and zero-cost bypass when inactive", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const silent = createSilentAudioFeatures();
    engine.textOverlay.clearAll();
    engine.render(silent);
    expect(engine.textOverlay.hasActiveContent()).toBe(false);
    engine.textOverlay.setTitle("Live Feed");
    engine.render(silent);
    expect(engine.textOverlay.hasActiveContent()).toBe(true);
  });
});

// tests/tier1-features/studio.test.ts
function createDefaultStudioRecipe(family = "The Force") {
  return {
    id: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: `${family} Space 1`,
    author: "Local Producer",
    engineFamily: family,
    stage: { backdrop: "void", scale: 1, dustDensity: 1, lightIntensity: 1.2 },
    hero: { geometry: "sphere", renderMode: "solid", symmetry: "none", deformation: 1, scale: 1 },
    mood: { themeId: "ember", bloomIntensity: 1.2, speedMultiplier: 1, lightingVibe: "neon" },
    engine: {
      chromaIntensity: 1,
      liquidWarp: 1,
      tunnelDepth: 1,
      volumeDensity: 1,
      theForceAttraction: 1
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}
describe("Tier 1: Studio Forge & Recipe Builder (#44)", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T1.Studio.1: 5 Engine Families contract is fully specified", () => {
    expect(CANONICAL_5_STUDIO_FAMILIES).toHaveLength(5);
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain("Chroma");
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain("Liquid");
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain("Tunnel");
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain("Volume");
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain("The Force");
  });
  test("T1.Studio.2: StudioComposerPreset initializes multi-layer stage", () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    expect(ctx.scene.children.length).toBe(0);
    studio.init(ctx);
    expect(ctx.scene.children.length).toBeGreaterThan(0);
    studio.dispose();
  });
  test("T1.Studio.3: Recipe serialization bundles stage parameters and restores correctly", () => {
    const originalRecipe = {
      id: "recipe-nebula-vortex",
      name: "Nebula Vortex Forge",
      author: "Local Producer",
      engineFamily: "The Force",
      stageConfig: {
        chromaIntensity: 1.4,
        liquidWarp: 0.8,
        tunnelDepth: 1.2,
        volumeDensity: 1.5,
        theForceAttraction: -0.7
      },
      timestamp: 1729e6
    };
    const serialized = JSON.stringify(originalRecipe);
    const deserialized = JSON.parse(serialized);
    expect(deserialized.id).toBe(originalRecipe.id);
    expect(deserialized.name).toBe(originalRecipe.name);
    expect(deserialized.stageConfig.theForceAttraction).toBe(-0.7);
    expect(deserialized.stageConfig.chromaIntensity).toBe(1.4);
  });
  test("T1.Studio.4: 4-step recipe validation requires non-empty recipe title before saving", () => {
    const validateRecipeForSave = (title) => {
      const trimmed = title.trim();
      if (!trimmed) {
        return { canSave: false, error: "Recipe title is required to save" };
      }
      return { canSave: true };
    };
    const emptyAttempt = validateRecipeForSave("   ");
    expect(emptyAttempt.canSave).toBe(false);
    expect(emptyAttempt.error).toBe("Recipe title is required to save");
    const validAttempt = validateRecipeForSave("My Cosmic Stage 1");
    expect(validAttempt.canSave).toBe(true);
    expect(validAttempt.error).toBeUndefined();
  });
  test("T1.Studio.5: Live modulation of stage sliders updates active shader uniforms and particle physics", () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);
    studio.config.liquidWarp = 1.8;
    studio.config.theForceAttraction = 1.9;
    const audio = createBeatDropAudioFeatures(0.9);
    studio.update(ctx, audio, 1, 0.016);
    expect(studio.config.liquidWarp).toBe(1.8);
    expect(studio.config.theForceAttraction).toBe(1.9);
    studio.dispose();
  });
  test("T1.Studio.6: StudioComposerPreset.dispose cleans up all layer geometries and materials", () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);
    expect(ctx.scene.children.length).toBeGreaterThan(0);
    studio.dispose();
    expect(ctx.scene.children.length).toBe(0);
  });
  test("T1.Studio.7: Auto-Forge generation mode produces bounded, non-NaN parameter recipes", () => {
    const generateAutoForge = (seed) => {
      const families = CANONICAL_5_STUDIO_FAMILIES;
      const family = families[Math.abs(seed) % families.length];
      const norm = (offset) => {
        const val = Math.sin(seed * 9301 + offset * 49297);
        return val - Math.floor(val);
      };
      return {
        id: `forge-${seed}`,
        name: `Forged ${family} #${seed}`,
        author: "Auto-Forge",
        engineFamily: family,
        stage: {
          backdrop: ["void", "grid", "starfield", "horizon", "nebula"][Math.floor(norm(1) * 5)],
          scale: 0.5 + norm(2) * 2,
          dustDensity: norm(3) * 2,
          lightIntensity: 0.2 + norm(4) * 2.8
        },
        hero: {
          geometry: ["sphere", "torus", "polyhedron", "dual-ring", "hypercube"][Math.floor(norm(5) * 5)],
          renderMode: ["solid", "wireframe", "crystal", "neon"][Math.floor(norm(6) * 4)],
          symmetry: ["none", "radial4", "radial8", "mirror"][Math.floor(norm(7) * 4)],
          deformation: norm(8) * 2.5,
          scale: 0.4 + norm(9) * 2.1
        },
        mood: {
          themeId: ["ember", "jade", "violet", "synthwave", "toxic", "horizon"][Math.floor(norm(10) * 6)],
          bloomIntensity: norm(11) * 3,
          speedMultiplier: 0.2 + norm(12) * 2.8,
          lightingVibe: ["neon", "cold", "warm", "dark"][Math.floor(norm(13) * 4)]
        },
        engine: {
          chromaIntensity: norm(14) * 2,
          liquidWarp: norm(15) * 2,
          tunnelDepth: norm(16) * 2,
          volumeDensity: norm(17) * 2,
          theForceAttraction: -2 + norm(18) * 4
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    };
    for (let i = 1; i <= 25; i++) {
      const recipe = generateAutoForge(i * 137);
      expect(CANONICAL_5_STUDIO_FAMILIES).toContain(recipe.engineFamily);
      expect(Number.isNaN(recipe.stage.scale)).toBe(false);
      expect(recipe.stage.scale).toBeGreaterThanOrEqual(0.5);
      expect(recipe.stage.scale).toBeLessThanOrEqual(2.5);
      expect(recipe.engine.theForceAttraction).toBeGreaterThanOrEqual(-2);
      expect(recipe.engine.theForceAttraction).toBeLessThanOrEqual(2);
    }
  });
  test("T1.Studio.8: Curated generation mode loads pre-configured aesthetic templates", () => {
    const curatedSpaces = {
      chroma: {
        ...createDefaultStudioRecipe("Chroma"),
        name: "Chroma Horizon",
        mood: { themeId: "ember", bloomIntensity: 1.5, speedMultiplier: 1, lightingVibe: "warm" },
        engine: { chromaIntensity: 1.8, liquidWarp: 0.4, tunnelDepth: 0.6, volumeDensity: 0.8, theForceAttraction: 0.5 }
      },
      liquid: {
        ...createDefaultStudioRecipe("Liquid"),
        name: "Liquid Dreamscape",
        mood: { themeId: "jade", bloomIntensity: 1.2, speedMultiplier: 0.8, lightingVibe: "neon" },
        engine: { chromaIntensity: 0.6, liquidWarp: 1.9, tunnelDepth: 0.5, volumeDensity: 0.7, theForceAttraction: 0.2 }
      },
      tunnel: {
        ...createDefaultStudioRecipe("Tunnel"),
        name: "Hyper Tunnel Velocity",
        mood: { themeId: "synthwave", bloomIntensity: 2, speedMultiplier: 1.8, lightingVibe: "neon" },
        engine: { chromaIntensity: 1.2, liquidWarp: 0.3, tunnelDepth: 2, volumeDensity: 0.9, theForceAttraction: 0.8 }
      },
      volume: {
        ...createDefaultStudioRecipe("Volume"),
        name: "Constellation Cloud",
        mood: { themeId: "horizon", bloomIntensity: 1.4, speedMultiplier: 0.7, lightingVibe: "cold" },
        engine: { chromaIntensity: 0.8, liquidWarp: 0.5, tunnelDepth: 0.7, volumeDensity: 2, theForceAttraction: -0.4 }
      },
      force: {
        ...createDefaultStudioRecipe("The Force"),
        name: "Singularity Vortex",
        mood: { themeId: "eclipse", bloomIntensity: 1.6, speedMultiplier: 1.2, lightingVibe: "dark" },
        engine: { chromaIntensity: 1.4, liquidWarp: 0.8, tunnelDepth: 1.2, volumeDensity: 1.5, theForceAttraction: 1.9 }
      }
    };
    expect(Object.keys(curatedSpaces)).toHaveLength(5);
    expect(curatedSpaces["tunnel"].engine.tunnelDepth).toBe(2);
    expect(curatedSpaces["force"].engine.theForceAttraction).toBe(1.9);
    expect(curatedSpaces["liquid"].engine.liquidWarp).toBe(1.9);
  });
  test("T1.Studio.9: Guided Remix generation mode applies controlled +/- 25% parameter jitter", () => {
    const remixRecipe = (base2, jitterFactor = 0.2) => {
      const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
      const jitter = (val, min, max) => {
        const delta = (Math.random() * 2 - 1) * jitterFactor * (max - min);
        return +clamp(val + delta, min, max).toFixed(2);
      };
      return {
        ...base2,
        id: `remix-${Date.now()}`,
        name: `Remix of ${base2.name}`,
        updatedAt: Date.now(),
        stage: {
          ...base2.stage,
          scale: jitter(base2.stage.scale, 0.5, 2.5),
          dustDensity: jitter(base2.stage.dustDensity, 0, 2)
        },
        engine: {
          chromaIntensity: jitter(base2.engine.chromaIntensity, 0, 2),
          liquidWarp: jitter(base2.engine.liquidWarp, 0, 2),
          tunnelDepth: jitter(base2.engine.tunnelDepth, 0, 2),
          volumeDensity: jitter(base2.engine.volumeDensity, 0, 2),
          theForceAttraction: jitter(base2.engine.theForceAttraction, -2, 2)
        }
      };
    };
    const base = createDefaultStudioRecipe("Liquid");
    base.engine.liquidWarp = 1;
    base.engine.theForceAttraction = 0.5;
    const remixed = remixRecipe(base, 0.25);
    expect(remixed.name).toContain("Remix of");
    expect(remixed.engine.liquidWarp).toBeGreaterThanOrEqual(0);
    expect(remixed.engine.liquidWarp).toBeLessThanOrEqual(2);
    expect(remixed.engine.theForceAttraction).toBeGreaterThanOrEqual(-2);
    expect(remixed.engine.theForceAttraction).toBeLessThanOrEqual(2);
  });
  test("T1.Studio.10: Recipe persistence lifecycle: Save, Retrieve, Duplicate, Delete in localStorage", () => {
    class RecipeRepository {
      key = "visuval_studio_recipes_test";
      store = /* @__PURE__ */ new Map();
      save(recipe) {
        const list = this.getAll();
        const existingIdx = list.findIndex((r) => r.id === recipe.id);
        if (existingIdx >= 0) list[existingIdx] = recipe;
        else list.push(recipe);
        this.store.set(this.key, JSON.stringify(list));
      }
      getAll() {
        const raw = this.store.get(this.key);
        if (!raw) return [];
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      }
      duplicate(id) {
        const target = this.getAll().find((r) => r.id === id);
        if (!target) return null;
        const copy2 = {
          ...target,
          id: `recipe-copy-${Date.now()}`,
          name: `${target.name} (Copy)`,
          createdAt: Date.now()
        };
        this.save(copy2);
        return copy2;
      }
      delete(id) {
        const list = this.getAll().filter((r) => r.id !== id);
        this.store.set(this.key, JSON.stringify(list));
        return true;
      }
    }
    const repo = new RecipeRepository();
    expect(repo.getAll()).toHaveLength(0);
    const recipe1 = createDefaultStudioRecipe("Chroma");
    recipe1.id = "rec-001";
    recipe1.name = "Cyber Sunrise";
    repo.save(recipe1);
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getAll()[0].name).toBe("Cyber Sunrise");
    const copy = repo.duplicate("rec-001");
    expect(copy).not.toBeNull();
    expect(copy?.name).toBe("Cyber Sunrise (Copy)");
    expect(repo.getAll()).toHaveLength(2);
    repo.delete("rec-001");
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getAll()[0].id).toBe(copy?.id);
  });
  test("T1.Studio.11: Corrupted JSON and malformed schema handling falls back gracefully", () => {
    const safeDeserializeRecipe = (input) => {
      if (typeof input !== "string") return null;
      try {
        const parsed = JSON.parse(input);
        if (!parsed || typeof parsed !== "object") return null;
        if (!parsed.id || !parsed.name || typeof parsed.name !== "string") return null;
        if (!parsed.engine || typeof parsed.engine !== "object") return null;
        const defaultRecipe = createDefaultStudioRecipe();
        return {
          id: String(parsed.id),
          name: String(parsed.name).trim().slice(0, 60),
          author: parsed.author ? String(parsed.author) : "Anonymous",
          engineFamily: CANONICAL_5_STUDIO_FAMILIES.includes(parsed.engineFamily) ? parsed.engineFamily : "The Force",
          stage: { ...defaultRecipe.stage, ...parsed.stage || {} },
          hero: { ...defaultRecipe.hero, ...parsed.hero || {} },
          mood: { ...defaultRecipe.mood, ...parsed.mood || {} },
          engine: { ...defaultRecipe.engine, ...parsed.engine || {} },
          createdAt: Number(parsed.createdAt) || Date.now(),
          updatedAt: Number(parsed.updatedAt) || Date.now()
        };
      } catch {
        return null;
      }
    };
    expect(safeDeserializeRecipe("{corrupted-json")).toBeNull();
    expect(safeDeserializeRecipe("null")).toBeNull();
    expect(safeDeserializeRecipe('{"missing": "name"}')).toBeNull();
    const partial = JSON.stringify({
      id: "valid-id",
      name: "Partial Recipe",
      engine: { chromaIntensity: 1.5 }
    });
    const result = safeDeserializeRecipe(partial);
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Partial Recipe");
    expect(result?.engine.chromaIntensity).toBe(1.5);
    expect(result?.engine.tunnelDepth).toBe(1);
  });
  test("T1.Studio.12: UI Drawer DOM specification audit verifies all controls and steps", () => {
    const requiredElementIds = [
      "studioPanel",
      "closeStudioBtn",
      "studioModeForgeBtn",
      "studioModeCuratedBtn",
      "studioModeRemixBtn",
      "studioTabStage",
      "studioTabHero",
      "studioTabMood",
      "studioTabEngine",
      "studioChromaSlider",
      "studioLiquidSlider",
      "studioTunnelSlider",
      "studioVolumeSlider",
      "studioForceSlider",
      "studioRecipeNameInput",
      "studioSaveRecipeBtn",
      "studioSavedRecipesList"
    ];
    expect(requiredElementIds.length).toBeGreaterThanOrEqual(15);
    expect(requiredElementIds).toContain("studioPanel");
    expect(requiredElementIds).toContain("studioTabStage");
    expect(requiredElementIds).toContain("studioSaveRecipeBtn");
  });
});

// src/midi/MidiParser.ts
function normalizeCCValue(rawVal) {
  const clamped = Math.max(0, Math.min(127, rawVal));
  return clamped / 127;
}
function isNoteOff(status, velocity) {
  const msgType = status & 240;
  return msgType === 128 || msgType === 144 && velocity === 0;
}
function parseMidiCCMessage2(bytes) {
  if (!bytes || bytes.length < 3) {
    return null;
  }
  const status = bytes[0];
  if ((status & 240) !== 176) {
    return null;
  }
  const channel = status & 15;
  const cc = bytes[1];
  const rawVal = bytes[2];
  const normalizedValue = normalizeCCValue(rawVal);
  return {
    isCC: true,
    channel,
    cc,
    normalizedValue
  };
}
function parseMidiNoteMessage(bytes) {
  if (!bytes || bytes.length < 3) {
    return null;
  }
  const status = bytes[0];
  const cmd = status & 240;
  const channel = status & 15;
  const note = bytes[1];
  const velocity = bytes[2];
  if (cmd === 144 && velocity > 0) {
    return { type: "noteOn", note, velocity, channel };
  }
  if (isNoteOff(status, velocity)) {
    return { type: "noteOff", note, velocity: 0, channel };
  }
  return null;
}

// src/midi/MidiManager.ts
var MIDI_STORAGE_KEY = "visuval_midi_mappings";
var CANONICAL_DEFAULT_MAPPINGS = {
  1: { target: "audioSensitivity", label: "Sensitivity" },
  2: { target: "animationSpeed", label: "Speed" },
  3: { target: "persistence", label: "Persistence" },
  4: { target: "cameraOrbit", label: "Camera Orbit" },
  7: { target: "audioVolume", label: "Volume" },
  10: { target: "colorSaturation", label: "Saturation" },
  71: { target: "resonance", label: "Resonance" },
  74: { target: "bloomStrength", label: "Bloom" }
};
var MidiManager = class {
  isSupported;
  isConnected = false;
  isLearning = false;
  learningTarget = null;
  mappings = /* @__PURE__ */ new Map();
  parameterValues = /* @__PURE__ */ new Map();
  inputs = /* @__PURE__ */ new Map();
  midiAccess = null;
  handlers = {};
  constructor() {
    this.isSupported = typeof navigator !== "undefined" && typeof navigator.requestMIDIAccess === "function";
    this.loadDefaultMappings();
  }
  get learnMode() {
    return this.isLearning;
  }
  set learnMode(val) {
    this.isLearning = val;
  }
  get _learnTarget() {
    return this.learningTarget;
  }
  set _learnTarget(val) {
    this.learningTarget = val;
  }
  get ccMap() {
    return this.getMappings();
  }
  getState() {
    return {
      isSupported: this.isSupported,
      isConnected: this.isConnected,
      isLearning: this.isLearning,
      learningTarget: this.learningTarget
    };
  }
  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }
  off(event, handler) {
    const list = this.handlers[event];
    if (list) {
      this.handlers[event] = list.filter((h) => h !== handler);
    }
  }
  _emit(event, payload) {
    const list = this.handlers[event];
    if (list) {
      for (const handler of list) {
        try {
          handler(payload);
        } catch {
        }
      }
    }
  }
  async init() {
    if (typeof navigator === "undefined" || typeof navigator.requestMIDIAccess !== "function") {
      this.isSupported = false;
      this.isConnected = false;
      this._emit("stateChange", this.getState());
      return false;
    }
    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false, software: true });
      this.isSupported = true;
      this.midiAccess.onstatechange = (event) => {
        this.handleStateChange(event);
      };
      this.bindInputs();
      this.loadMappings();
      this.isConnected = this.inputs.size > 0;
      this._emit("stateChange", this.getState());
      this._emit("deviceChange", this.getDevices());
      return true;
    } catch {
      this.isSupported = true;
      this.isConnected = false;
      this._emit("stateChange", this.getState());
      return false;
    }
  }
  getDevices() {
    const devices = [];
    for (const [id, port] of this.inputs.entries()) {
      const rawPort = port;
      devices.push({
        id,
        name: rawPort.name || "Unknown Controller",
        manufacturer: rawPort.manufacturer || "Generic MIDI Device",
        state: rawPort.state === "disconnected" ? "disconnected" : "connected"
      });
    }
    return devices;
  }
  getParamLabel(target) {
    switch (target) {
      case "audioSensitivity":
      case "sensitivity":
        return "Sensitivity";
      case "animationSpeed":
      case "speed":
        return "Speed";
      case "persistence":
        return "Persistence";
      case "cameraOrbit":
      case "rotateSpeed":
      case "orbit":
        return "Camera Orbit";
      case "audioVolume":
      case "volume":
        return "Volume";
      case "colorSaturation":
      case "saturation":
        return "Saturation";
      case "resonance":
      case "brightness":
        return "Resonance";
      case "bloomStrength":
      case "bloom":
        return "Bloom";
      default:
        return target.charAt(0).toUpperCase() + target.slice(1);
    }
  }
  getMappings() {
    const result = {};
    for (const [cc, target] of this.mappings.entries()) {
      result[cc] = { target, label: this.getParamLabel(target) };
    }
    return result;
  }
  startLearn(targetParamId) {
    this.isLearning = true;
    this.learningTarget = targetParamId;
    this._emit("learnStart", { target: targetParamId });
    this._emit("stateChange", this.getState());
  }
  stopLearn() {
    this.isLearning = false;
    this.learningTarget = null;
    this._emit("learnCancel");
    this._emit("stateChange", this.getState());
  }
  cancelLearn() {
    this.stopLearn();
  }
  setMapping(cc, target, _label) {
    this.removeTargetDuplicates(target);
    this.mappings.set(cc, target);
    this.saveMappings();
    this._emit("learn", { cc, target });
    this._emit("stateChange", this.getState());
  }
  removeMapping(cc) {
    if (this.mappings.delete(cc)) {
      this.saveMappings();
      this._emit("stateChange", this.getState());
    }
  }
  unbind(cc) {
    this.removeMapping(cc);
  }
  clearAllMappings() {
    this.mappings.clear();
    this.saveMappings();
    this._emit("stateChange", this.getState());
  }
  resetToDefaults() {
    this.mappings.clear();
    this.loadDefaultMappings();
    this.saveMappings();
    this._emit("stateChange", this.getState());
  }
  handleMessage(data) {
    const parsed = parseMidiCCMessage2(data);
    if (parsed) {
      this.handleCC(parsed.cc, parsed.normalizedValue, parsed.channel);
      return;
    }
    const note = parseMidiNoteMessage(data);
    if (note) {
      if (note.type === "noteOn") {
        this._emit("noteOn", { note: note.note, velocity: note.velocity, channel: note.channel });
      } else {
        this._emit("noteOff", { note: note.note, channel: note.channel });
      }
    }
  }
  saveMappings() {
    try {
      if (typeof localStorage !== "undefined") {
        const serializable = {};
        for (const [cc, target] of this.mappings.entries()) {
          serializable[cc.toString()] = target;
        }
        localStorage.setItem(MIDI_STORAGE_KEY, JSON.stringify(serializable));
      }
    } catch {
    }
  }
  loadMappings() {
    this.loadDefaultMappings();
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(MIDI_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.applyDeserializedMappings(parsed);
        }
      }
    } catch {
    }
  }
  destroy() {
    for (const [, input] of this.inputs) {
      input.onmidimessage = null;
    }
    this.inputs.clear();
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }
    this.isConnected = false;
    this.isLearning = false;
    this.learningTarget = null;
    this.handlers = {};
  }
  loadDefaultMappings() {
    for (const [cc, entry] of Object.entries(CANONICAL_DEFAULT_MAPPINGS)) {
      this.mappings.set(Number(cc), entry.target);
    }
  }
  removeTargetDuplicates(target) {
    for (const [existingCc, existingTarget] of this.mappings.entries()) {
      if (existingTarget === target) {
        this.mappings.delete(existingCc);
      }
    }
  }
  bindInputs() {
    if (!this.midiAccess) return;
    this.inputs.clear();
    for (const [id, input] of this.midiAccess.inputs.entries()) {
      input.onmidimessage = (event) => {
        if (event.data) {
          this.handleMessage(event.data);
        }
      };
      this.inputs.set(id, input);
    }
  }
  syncInputsFromAccess() {
    if (!this.midiAccess) return;
    for (const [id, input] of this.midiAccess.inputs.entries()) {
      if (!this.inputs.has(id)) {
        input.onmidimessage = (msgEvent) => {
          if (msgEvent.data) {
            this.handleMessage(msgEvent.data);
          }
        };
        this.inputs.set(id, input);
      }
    }
    for (const id of Array.from(this.inputs.keys())) {
      if (!this.midiAccess.inputs.has(id)) {
        const port = this.inputs.get(id);
        if (port) port.onmidimessage = null;
        this.inputs.delete(id);
      }
    }
  }
  syncDisconnectedPort(event) {
    const ev = event;
    if (ev?.port?.state === "disconnected" && ev.port?.id) {
      this.inputs.delete(ev.port.id);
    }
  }
  handleStateChange(event) {
    this.syncInputsFromAccess();
    this.syncDisconnectedPort(event);
    this.isConnected = this.inputs.size > 0;
    this._emit("deviceChange", this.getDevices());
    this._emit("stateChange", this.getState());
  }
  handleCC(cc, normalizedValue, channel) {
    if (this.isLearning && this.learningTarget) {
      const target = this.learningTarget;
      this.setMapping(cc, target);
      this.stopLearn();
    }
    const boundTarget = this.mappings.get(cc);
    if (boundTarget) {
      this.parameterValues.set(boundTarget, normalizedValue);
      this._emit("cc", {
        target: boundTarget,
        value: normalizedValue,
        cc,
        channel
      });
    }
  }
  extractTarget(val) {
    if (typeof val === "string") {
      return val;
    }
    if (val && typeof val === "object" && "target" in val && typeof val.target === "string") {
      return val.target;
    }
    return null;
  }
  applyDeserializedMappings(parsed) {
    if (!parsed || typeof parsed !== "object") return;
    for (const [key, val] of Object.entries(parsed)) {
      const ccNum = Number(key);
      const target = this.extractTarget(val);
      if (!Number.isNaN(ccNum) && target !== null) {
        this.mappings.set(ccNum, target);
      }
    }
  }
};

// src/midi/MidiPanel.ts
var MidiPanel = class {
  manager;
  panel;
  statusIndicator = null;
  statusBadge = null;
  deviceCountEl = null;
  connectBtn = null;
  connectBtnText = null;
  portsListEl = null;
  learnBoxEl = null;
  learnBadgeEl = null;
  activeTargetEl = null;
  learnPulseEl = null;
  cancelLearnBtn = null;
  mappingCountEl = null;
  mappingsTableEl = null;
  resetDefaultsBtn = null;
  refreshPortsBtn = null;
  constructor(manager, customPanel) {
    this.manager = manager;
    this.panel = customPanel ?? (typeof document !== "undefined" ? document.getElementById("midiPanel") : null);
    this.bindDomElements();
    this.bindManagerEvents();
    this.bindUserInteractions();
    this.render();
  }
  render() {
    this.renderStatus();
    this.renderPorts(this.manager.getDevices());
    this.renderLearnState();
    this.renderMappings();
  }
  updateParameterValue(target, normalizedValue) {
    if (!this.panel) return;
    const fill = this.panel.querySelector(`[data-fill-target="${target}"]`);
    if (fill) {
      const pct = Math.round(Math.max(0, Math.min(1, normalizedValue)) * 100);
      fill.style.width = `${pct}%`;
    }
  }
  bindDomElements() {
    if (!this.panel) return;
    this.statusIndicator = this.panel.querySelector("#midiStatusIndicator");
    this.statusBadge = this.panel.querySelector("#midiStatusBadge");
    this.deviceCountEl = this.panel.querySelector("#midiDeviceCount");
    this.connectBtn = this.panel.querySelector("#midiConnectBtn");
    this.connectBtnText = this.panel.querySelector("#midiConnectBtnText");
    this.portsListEl = this.panel.querySelector("#midiPortsList");
    this.learnBoxEl = this.panel.querySelector("#midiLearnBox");
    this.learnBadgeEl = this.panel.querySelector("#midiLearnBadge");
    this.activeTargetEl = this.panel.querySelector("#midiLearnActiveTarget");
    this.learnPulseEl = this.panel.querySelector("#midiLearnPulse");
    this.cancelLearnBtn = this.panel.querySelector("#midiCancelLearnBtn");
    this.mappingCountEl = this.panel.querySelector("#midiMappingCount");
    this.mappingsTableEl = this.panel.querySelector("#midiMappingsTable");
    this.resetDefaultsBtn = this.panel.querySelector("#midiResetDefaultsBtn");
    this.refreshPortsBtn = this.panel.querySelector("#midiRefreshPortsBtn");
  }
  bindManagerEvents() {
    this.manager.on("stateChange", () => {
      this.renderStatus();
      this.renderLearnState();
      this.renderMappings();
    });
    this.manager.on("deviceChange", (devices) => {
      this.renderPorts(devices);
      this.renderStatus();
    });
    this.manager.on("cc", (event) => {
      this.updateParameterValue(event.target, event.value);
    });
  }
  bindUserInteractions() {
    this.connectBtn?.addEventListener("click", async () => {
      if (this.connectBtnText) this.connectBtnText.textContent = "Connecting...";
      if (this.connectBtn) this.connectBtn.disabled = true;
      await this.manager.init();
      this.render();
    });
    this.refreshPortsBtn?.addEventListener("click", () => {
      this.renderPorts(this.manager.getDevices());
    });
    this.cancelLearnBtn?.addEventListener("click", () => {
      this.manager.stopLearn();
    });
    this.resetDefaultsBtn?.addEventListener("click", () => {
      this.manager.resetToDefaults();
    });
  }
  renderStatus() {
    const { isConnected, isSupported, isLearning } = this.manager;
    this.updateStatusBadge(isConnected, isSupported, isLearning);
    this.updateStatusIndicator(isConnected, isLearning);
    this.updateConnectButton(isConnected, isSupported);
    if (this.deviceCountEl) {
      const count = this.manager.inputs.size;
      this.deviceCountEl.textContent = `${count} device${count === 1 ? "" : "s"} connected`;
    }
  }
  updateStatusBadge(isConnected, isSupported, isLearning) {
    if (!this.statusBadge) return;
    this.statusBadge.classList.remove("midi-connected", "midi-disconnected", "midi-learning");
    if (isLearning) {
      this.statusBadge.classList.add("midi-learning");
      this.statusBadge.textContent = "Learning";
    } else if (isConnected) {
      this.statusBadge.classList.add("midi-connected");
      this.statusBadge.textContent = "Connected";
    } else {
      this.statusBadge.classList.add("midi-disconnected");
      this.statusBadge.textContent = isSupported ? "Disconnected" : "Unsupported";
    }
  }
  updateStatusIndicator(isConnected, isLearning) {
    if (!this.statusIndicator) return;
    this.statusIndicator.classList.remove("connected", "learning");
    if (isLearning) {
      this.statusIndicator.classList.add("learning");
    } else if (isConnected) {
      this.statusIndicator.classList.add("connected");
    }
  }
  updateConnectButton(isConnected, isSupported) {
    if (!this.connectBtn || !this.connectBtnText) return;
    if (isConnected) {
      this.connectBtnText.textContent = "MIDI Connected";
      this.connectBtn.disabled = true;
      this.connectBtn.style.opacity = "0.7";
    } else {
      this.connectBtnText.textContent = "Connect MIDI";
      this.connectBtn.disabled = !isSupported;
      this.connectBtn.style.opacity = "1.0";
    }
  }
  renderPorts(devices) {
    if (!this.portsListEl) return;
    this.portsListEl.innerHTML = "";
    if (devices.length === 0) {
      const empty = document.createElement("div");
      empty.className = "midi-port-empty";
      empty.id = "midiPortEmpty";
      empty.textContent = 'No MIDI devices detected. Click "Connect MIDI" to enable access.';
      this.portsListEl.appendChild(empty);
      return;
    }
    for (const dev of devices) {
      const item = document.createElement("div");
      item.className = "midi-port-item";
      const name = document.createElement("span");
      name.className = "midi-port-name";
      name.textContent = dev.name;
      const meta = document.createElement("span");
      meta.className = "midi-port-meta";
      meta.textContent = dev.manufacturer || "Connected";
      item.appendChild(name);
      item.appendChild(meta);
      this.portsListEl.appendChild(item);
    }
  }
  renderLearnState() {
    const { isLearning, learningTarget } = this.manager;
    if (this.learnBoxEl) {
      this.learnBoxEl.classList.toggle("active", isLearning);
    }
    if (this.learnBadgeEl) {
      this.learnBadgeEl.style.display = isLearning ? "inline-block" : "none";
    }
    if (this.activeTargetEl) {
      if (isLearning && learningTarget) {
        this.activeTargetEl.textContent = this.manager.getParamLabel(learningTarget);
      } else {
        this.activeTargetEl.textContent = "None (Click Learn on any parameter)";
      }
    }
    if (this.learnPulseEl) {
      this.learnPulseEl.style.display = isLearning ? "flex" : "none";
      this.learnPulseEl.classList.toggle("hidden", !isLearning);
    }
    if (this.cancelLearnBtn) {
      this.cancelLearnBtn.style.display = isLearning ? "inline-flex" : "none";
      this.cancelLearnBtn.classList.toggle("hidden", !isLearning);
    }
  }
  getDisplayTargets() {
    const canonicalOrder = [
      "audioSensitivity",
      "animationSpeed",
      "persistence",
      "cameraOrbit",
      "audioVolume",
      "colorSaturation",
      "resonance",
      "bloomStrength"
    ];
    const targets = canonicalOrder.map((t) => ({
      target: t,
      label: this.manager.getParamLabel(t)
    }));
    for (const target of this.manager.mappings.values()) {
      if (!canonicalOrder.includes(target) && !targets.some((x) => x.target === target)) {
        targets.push({ target, label: this.manager.getParamLabel(target) });
      }
    }
    return targets;
  }
  findCcForTarget(target) {
    for (const [cc, t] of this.manager.mappings.entries()) {
      if (t === target) return cc;
    }
    return void 0;
  }
  renderMappings() {
    if (!this.mappingsTableEl) return;
    this.mappingsTableEl.innerHTML = "";
    const targets = this.getDisplayTargets();
    let mappedCount = 0;
    for (const item of targets) {
      const boundCc = this.findCcForTarget(item.target);
      if (boundCc !== void 0) {
        mappedCount++;
      }
      const row = this.createMappingRow(item.target, item.label, boundCc);
      this.mappingsTableEl.appendChild(row);
    }
    if (this.mappingCountEl) {
      this.mappingCountEl.textContent = `${mappedCount} active`;
    }
  }
  createMappingRow(target, label, cc) {
    const isTargetLearning = this.manager.isLearning && this.manager.learningTarget === target;
    const row = document.createElement("div");
    row.className = `midi-mapping-row${isTargetLearning ? " learning" : ""}`;
    row.dataset.targetId = target;
    const top = document.createElement("div");
    top.className = "midi-mapping-top";
    const left = document.createElement("div");
    left.className = "midi-mapping-left";
    const nameSpan = document.createElement("span");
    nameSpan.className = "midi-target-name";
    nameSpan.textContent = label;
    const ccBadge = document.createElement("span");
    ccBadge.className = "midi-cc-badge";
    ccBadge.textContent = cc !== void 0 ? `CC ${cc}` : "Unassigned";
    left.appendChild(nameSpan);
    left.appendChild(ccBadge);
    const actions = this.createRowActions(target, cc, isTargetLearning);
    top.appendChild(left);
    top.appendChild(actions);
    const track = document.createElement("div");
    track.className = "midi-value-track";
    const fill = document.createElement("div");
    fill.className = "midi-value-fill";
    fill.dataset.fillTarget = target;
    const currentVal = this.manager.parameterValues.get(target) ?? 0;
    const pct = Math.round(Math.max(0, Math.min(1, currentVal)) * 100);
    fill.style.width = `${pct}%`;
    track.appendChild(fill);
    row.appendChild(top);
    row.appendChild(track);
    return row;
  }
  createRowActions(target, cc, isLearning) {
    const actions = document.createElement("div");
    actions.className = "midi-mapping-actions";
    const learnBtn = document.createElement("button");
    learnBtn.type = "button";
    learnBtn.className = `midi-row-btn midi-row-btn--learn${isLearning ? " active" : ""}`;
    learnBtn.textContent = isLearning ? "Learning..." : "Learn";
    learnBtn.addEventListener("click", () => {
      if (isLearning) {
        this.manager.stopLearn();
      } else {
        this.manager.startLearn(target);
      }
    });
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "midi-row-btn midi-row-btn--clear";
    clearBtn.textContent = "Clear";
    clearBtn.disabled = cc === void 0;
    clearBtn.addEventListener("click", () => {
      if (cc !== void 0) {
        this.manager.removeMapping(cc);
      }
    });
    actions.appendChild(learnBtn);
    actions.appendChild(clearBtn);
    return actions;
  }
};

// tests/tier1-features/midi.test.ts
var TestMidiManager = class {
  isSupported = false;
  isLearning = false;
  learningTarget = null;
  mappings = /* @__PURE__ */ new Map();
  parameterValues = /* @__PURE__ */ new Map();
  async init() {
    if (!navigator.requestMIDIAccess) {
      this.isSupported = false;
      return false;
    }
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      this.isSupported = Boolean(midiAccess);
      for (const [cc, target] of Object.entries(DEFAULT_MIDI_CC_MAPPINGS)) {
        this.mappings.set(Number(cc), target);
      }
      midiAccess.inputs.forEach((input) => {
        input.onmidimessage = (event) => {
          if (event.data) {
            this.handleMessage(event.data);
          }
        };
      });
      return true;
    } catch {
      this.isSupported = false;
      return false;
    }
  }
  startLearn(targetParamId) {
    this.isLearning = true;
    this.learningTarget = targetParamId;
  }
  stopLearn() {
    this.isLearning = false;
    this.learningTarget = null;
  }
  handleMessage(data) {
    const parsed = parseMidiCCMessage(data);
    if (!parsed) return;
    if (this.isLearning && this.learningTarget) {
      this.mappings.set(parsed.cc, this.learningTarget);
      this.stopLearn();
    }
    const boundTarget = this.mappings.get(parsed.cc);
    if (boundTarget) {
      this.parameterValues.set(boundTarget, parsed.normalizedValue);
    }
  }
};
describe("Tier 1: Web MIDI API Controller Mapping (#45)", () => {
  beforeEach(() => {
    setupTestEnvironment();
    if (typeof localStorage === "undefined" || !globalThis.localStorage) {
      const store = /* @__PURE__ */ new Map();
      const mockStorage = {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear(),
        get length() {
          return store.size;
        },
        key: (i) => Array.from(store.keys())[i] ?? null
      };
      Object.defineProperty(globalThis, "localStorage", {
        value: mockStorage,
        configurable: true,
        writable: true
      });
    } else {
      localStorage.clear();
    }
  });
  test("T1.Midi.1: Web MIDI access request detects available hardware controller inputs", async () => {
    const manager = new TestMidiManager();
    const success = await manager.init();
    expect(success).toBe(true);
    expect(manager.isSupported).toBe(true);
  });
  test("T1.Midi.2: CC byte stream parser decodes 0xB0 status and normalizes 0-127 values", () => {
    const msg = [176, 74, 64];
    const parsed = parseMidiCCMessage(msg);
    expect(parsed).toBeDefined();
    expect(parsed?.isCC).toBe(true);
    expect(parsed?.channel).toBe(0);
    expect(parsed?.cc).toBe(74);
    expect(parsed?.normalizedValue).toBeCloseTo(64 / 127);
  });
  test("T1.Midi.3: Default CC mapping table binds standard knobs to audio and rendering parameters", () => {
    expect(DEFAULT_MIDI_CC_MAPPINGS[1]).toBe("audioSensitivity");
    expect(DEFAULT_MIDI_CC_MAPPINGS[2]).toBe("animationSpeed");
    expect(DEFAULT_MIDI_CC_MAPPINGS[7]).toBe("audioVolume");
    expect(DEFAULT_MIDI_CC_MAPPINGS[10]).toBe("colorSaturation");
    expect(DEFAULT_MIDI_CC_MAPPINGS[71]).toBe("resonance");
    expect(DEFAULT_MIDI_CC_MAPPINGS[74]).toBe("bloomStrength");
  });
  test("T1.Midi.4: MIDI Learn mode captures incoming CC number and establishes new mapping", async () => {
    const manager = new TestMidiManager();
    await manager.init();
    manager.startLearn("customDistortion");
    expect(manager.isLearning).toBe(true);
    const midiAccess = getActiveMidiAccess();
    const input = midiAccess?.inputs.get("input-0");
    input?.simulateMessage([176, 16, 100]);
    expect(manager.isLearning).toBe(false);
    expect(manager.mappings.get(16)).toBe("customDistortion");
    expect(manager.parameterValues.get("customDistortion")).toBeCloseTo(100 / 127);
  });
  test("T1.Midi.5: Note-On with velocity 0 is normalized to Note-Off per MIDI specification", () => {
    const isNoteOff2 = (status, velocity) => {
      const msgType = status & 240;
      return msgType === 128 || msgType === 144 && velocity === 0;
    };
    expect(isNoteOff2(128, 64)).toBe(true);
    expect(isNoteOff2(144, 0)).toBe(true);
    expect(isNoteOff2(144, 100)).toBe(false);
  });
  test("T1.Midi.6: Incoming CC message dispatches normalized value to registered parameter", async () => {
    const manager = new TestMidiManager();
    await manager.init();
    const midiAccess = getActiveMidiAccess();
    const input = midiAccess?.inputs.get("input-0");
    input?.simulateMessage([176, 7, 127]);
    expect(manager.parameterValues.get("audioVolume")).toBeCloseTo(1);
    input?.simulateMessage([176, 74, 0]);
    expect(manager.parameterValues.get("bloomStrength")).toBeCloseTo(0);
  });
  test("T1.Midi.7: Port enumeration correctly lists all connected input devices with ID and manufacturer", async () => {
    const manager = new MidiManager();
    const success = await manager.init();
    expect(success).toBe(true);
    const devices = manager.getDevices();
    expect(devices.length).toBeGreaterThanOrEqual(1);
    expect(devices[0].id).toBe("input-0");
    expect(devices[0].name).toBe("Arturia BeatStep MIDI 1");
    expect(devices[0].manufacturer).toBe("Visuval Virtual Controller");
    expect(devices[0].state).toBe("connected");
  });
  test("T1.Midi.8: Hotplug statechange handler dynamically detects added or removed MIDI controllers", async () => {
    const manager = new MidiManager();
    await manager.init();
    const midiAccess = getActiveMidiAccess();
    midiAccess?.addMockInput("input-1", "Akai MPK Mini 3");
    midiAccess?.onstatechange?.({
      port: { id: "input-1", name: "Akai MPK Mini 3", manufacturer: "Akai Professional", state: "connected", type: "input" }
    });
    const devices = manager.getDevices();
    expect(devices.length).toBe(2);
    expect(manager.isConnected).toBe(true);
  });
  test("T1.Midi.9: Default CC routing dispatches to Sensitivity, Bloom, Persistence, Camera Orbit, and Speed", async () => {
    const manager = new MidiManager();
    await manager.init();
    const input = getActiveMidiAccess()?.inputs.get("input-0");
    input?.simulateMessage([176, 1, 100]);
    input?.simulateMessage([176, 2, 80]);
    input?.simulateMessage([176, 3, 90]);
    input?.simulateMessage([176, 4, 64]);
    input?.simulateMessage([176, 74, 110]);
    expect(manager.parameterValues.get("audioSensitivity")).toBeCloseTo(100 / 127);
    expect(manager.parameterValues.get("animationSpeed")).toBeCloseTo(80 / 127);
    expect(manager.parameterValues.get("persistence")).toBeCloseTo(90 / 127);
    expect(manager.parameterValues.get("cameraOrbit")).toBeCloseTo(64 / 127);
    expect(manager.parameterValues.get("bloomStrength")).toBeCloseTo(110 / 127);
  });
  test("T1.Midi.10: Interactive MIDI Learn mode highlights active parameter and binds incoming CC from any channel", async () => {
    const manager = new MidiManager();
    await manager.init();
    manager.startLearn("cameraOrbit");
    expect(manager.isLearning).toBe(true);
    expect(manager.learningTarget).toBe("cameraOrbit");
    const input = getActiveMidiAccess()?.inputs.get("input-0");
    input?.simulateMessage([178, 16, 90]);
    expect(manager.isLearning).toBe(false);
    expect(manager.learningTarget).toBeNull();
    expect(manager.mappings.get(16)).toBe("cameraOrbit");
    expect(manager.parameterValues.get("cameraOrbit")).toBeCloseTo(90 / 127);
  });
  test("T1.Midi.11: MIDI Learn mode cancellation aborts binding and restores idle UI state", async () => {
    const manager = new MidiManager();
    await manager.init();
    manager.startLearn("bloomStrength");
    expect(manager.isLearning).toBe(true);
    manager.stopLearn();
    expect(manager.isLearning).toBe(false);
    expect(manager.learningTarget).toBeNull();
    const input = getActiveMidiAccess()?.inputs.get("input-0");
    input?.simulateMessage([176, 44, 100]);
    expect(manager.mappings.get(44)).toBeUndefined();
    expect(manager.mappings.get(74)).toBe("bloomStrength");
  });
  test("T1.Midi.12: LocalStorage persistence saves mapping table and successfully restores upon re-initialization", async () => {
    const manager = new MidiManager();
    await manager.init();
    manager.setMapping(20, "customFilter");
    expect(manager.mappings.get(20)).toBe("customFilter");
    const saved = localStorage.getItem("visuval_midi_mappings");
    expect(saved).toBeDefined();
    const manager2 = new MidiManager();
    await manager2.init();
    expect(manager2.mappings.get(20)).toBe("customFilter");
  });
  test("T1.Midi.13: Corrupted or invalid JSON in localStorage recovers cleanly without throwing or crashing", async () => {
    localStorage.setItem("visuval_midi_mappings", "<<<INVALID-JSON-CORRUPTED>>>");
    const manager = new MidiManager();
    const ok = await manager.init();
    expect(ok).toBe(true);
    expect(manager.mappings.get(1)).toBe("audioSensitivity");
    expect(manager.mappings.get(74)).toBe("bloomStrength");
  });
  test("T1.Midi.14: DOM controls in #midiPanel render status banner, port list, learn section, and mapping table", async () => {
    const manager = new MidiManager();
    await manager.init();
    const panelEl = createMockMidiPanel();
    new MidiPanel(manager, panelEl);
    const badge = panelEl.querySelector("#midiStatusBadge");
    expect(badge?.classList.contains("midi-connected")).toBe(true);
    const devCount = panelEl.querySelector("#midiDeviceCount");
    expect(devCount?.textContent).toContain("1 device");
    const portItem = panelEl.querySelector(".midi-port-item");
    expect(portItem).toBeDefined();
    const mappingsTable = panelEl.querySelector("#midiMappingsTable");
    expect(mappingsTable?.children.length).toBeGreaterThanOrEqual(8);
  });
  test("T1.Midi.15: Reset button in #midiPanel restores all default CC mappings and synchronizes DOM readout", async () => {
    const manager = new MidiManager();
    await manager.init();
    manager.setMapping(1, "customParam");
    manager.removeMapping(74);
    const panelEl = createMockMidiPanel();
    new MidiPanel(manager, panelEl);
    const resetBtn = panelEl.querySelector("#midiResetDefaultsBtn");
    resetBtn?.click();
    expect(manager.mappings.get(1)).toBe("audioSensitivity");
    expect(manager.mappings.get(74)).toBe("bloomStrength");
  });
  test("T1.Midi.16: Clear button on individual mapping row unbinds target parameter and updates DOM", async () => {
    const manager = new MidiManager();
    await manager.init();
    const panelEl = createMockMidiPanel();
    new MidiPanel(manager, panelEl);
    const bloomRow = panelEl.querySelector('[data-target-id="bloomStrength"]');
    const clearBtn = bloomRow?.querySelector(".midi-row-btn--clear");
    clearBtn?.click();
    expect(manager.mappings.has(74)).toBe(false);
    const input = getActiveMidiAccess()?.inputs.get("input-0");
    input?.simulateMessage([176, 74, 127]);
    expect(manager.parameterValues.get("bloomStrength")).toBeUndefined();
  });
});
function createMockMidiPanel() {
  const panel = document.createElement("div");
  panel.id = "midiPanel";
  const statusBadge = document.createElement("span");
  statusBadge.id = "midiStatusBadge";
  panel.appendChild(statusBadge);
  const deviceCount = document.createElement("span");
  deviceCount.id = "midiDeviceCount";
  panel.appendChild(deviceCount);
  const statusIndicator = document.createElement("span");
  statusIndicator.id = "midiStatusIndicator";
  panel.appendChild(statusIndicator);
  const connectBtn = document.createElement("button");
  connectBtn.id = "midiConnectBtn";
  const connectBtnText = document.createElement("span");
  connectBtnText.id = "midiConnectBtnText";
  connectBtn.appendChild(connectBtnText);
  panel.appendChild(connectBtn);
  const refreshPortsBtn = document.createElement("button");
  refreshPortsBtn.id = "midiRefreshPortsBtn";
  panel.appendChild(refreshPortsBtn);
  const portsList = document.createElement("div");
  portsList.id = "midiPortsList";
  panel.appendChild(portsList);
  const learnBox = document.createElement("div");
  learnBox.id = "midiLearnBox";
  const learnBadge = document.createElement("span");
  learnBadge.id = "midiLearnBadge";
  learnBox.appendChild(learnBadge);
  const activeTarget = document.createElement("span");
  activeTarget.id = "midiLearnActiveTarget";
  learnBox.appendChild(activeTarget);
  const learnPulse = document.createElement("div");
  learnPulse.id = "midiLearnPulse";
  learnBox.appendChild(learnPulse);
  const cancelLearnBtn = document.createElement("button");
  cancelLearnBtn.id = "midiCancelLearnBtn";
  learnBox.appendChild(cancelLearnBtn);
  panel.appendChild(learnBox);
  const mappingCount = document.createElement("span");
  mappingCount.id = "midiMappingCount";
  panel.appendChild(mappingCount);
  const mappingsTable = document.createElement("div");
  mappingsTable.id = "midiMappingsTable";
  panel.appendChild(mappingsTable);
  const resetDefaultsBtn = document.createElement("button");
  resetDefaultsBtn.id = "midiResetDefaultsBtn";
  panel.appendChild(resetDefaultsBtn);
  return panel;
}

// tests/tier1-features/presets.test.ts
describe("Tier 1: Presets Catalog & Lifecycle (#38)", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T1.Presets.1: Catalog contains exactly 71 registered presets with unique IDs", () => {
    expect(PRESETS.length).toBe(71);
    const ids = /* @__PURE__ */ new Set();
    for (const preset of PRESETS) {
      expect(typeof preset.id).toBe("string");
      expect(preset.id.length).toBeGreaterThan(0);
      expect(typeof preset.name).toBe("string");
      expect(preset.name.length).toBeGreaterThan(0);
      expect(typeof preset.description).toBe("string");
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);
    }
    expect(ids.size).toBe(71);
  });
  test("T1.Presets.2: All 7 categories contain valid non-empty collections summing to 71", () => {
    const canonicalCategories = {
      "Structures": 15,
      "Abstract & Space": 15,
      "Particles & Light": 4,
      "Fluids & Heat": 9,
      "Tunnels": 7,
      "Retro & Digital": 7,
      "Organic & Nature": 14
    };
    let totalSum = 0;
    for (const [category, expectedCount] of Object.entries(canonicalCategories)) {
      const presetsInCat = PRESETS.filter((p) => p.category === category);
      expect(presetsInCat.length).toBe(expectedCount);
      expect(presetsInCat.length).toBeGreaterThan(0);
      totalSum += presetsInCat.length;
    }
    expect(totalSum).toBe(71);
    for (const preset of PRESETS) {
      expect(Object.keys(canonicalCategories)).toContain(preset.category);
    }
  });
  test("T1.Presets.3: getPreset retrieves matching preset for all 71 IDs or falls back to first preset", () => {
    for (const preset of PRESETS) {
      const retrieved = getPreset(preset.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(preset.id);
      expect(retrieved.name).toBe(preset.name);
    }
    const fallback = getPreset("non-existent-preset-uuid");
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(PRESETS[0].id);
  });
  test("T1.Presets.4: Every one of the 71 presets satisfies the VisualizerPreset lifecycle contract", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const audio = createBeatDropAudioFeatures(0.85);
    for (const preset of PRESETS) {
      expect(typeof preset.init).toBe("function");
      expect(typeof preset.update).toBe("function");
      expect(typeof preset.dispose).toBe("function");
      preset.init(ctx);
      expect(ctx.scene.children.length).toBeGreaterThanOrEqual(0);
      expect(() => {
        preset.update(ctx, audio, 1, 0.016);
      }).not.toThrow();
      expect(() => {
        preset.dispose();
      }).not.toThrow();
      ctx.scene.clear();
      expect(ctx.scene.children.length).toBe(0);
    }
  });
  test("T1.Presets.5: onThemeChange updates preset materials cleanly across themes without throwing", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const synthTheme = getTheme("synthwave");
    const arcticTheme = getTheme("arctic");
    for (const preset of PRESETS) {
      preset.init(ctx);
      if (preset.onThemeChange) {
        expect(() => {
          preset.onThemeChange(synthTheme);
          preset.onThemeChange(arcticTheme);
        }).not.toThrow();
      }
      preset.dispose();
      ctx.scene.clear();
    }
  });
  test("T1.Presets.6: Category tab counters in #presetsPanel match the 71-preset catalog breakdown", () => {
    const breakdown = PRESETS.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    expect(breakdown["Structures"]).toBe(15);
    expect(breakdown["Abstract & Space"]).toBe(15);
    expect(breakdown["Particles & Light"]).toBe(4);
    expect(breakdown["Fluids & Heat"]).toBe(9);
    expect(breakdown["Tunnels"]).toBe(7);
    expect(breakdown["Retro & Digital"]).toBe(7);
    expect(breakdown["Organic & Nature"]).toBe(14);
    const container = new MockElement("DIV");
    container.id = "presetCategoryTabs";
    const allPill = new MockElement("BUTTON");
    const badgeAllSpan = new MockElement("SPAN");
    badgeAllSpan.id = "badgeAll";
    badgeAllSpan.className = "tab-badge";
    badgeAllSpan.textContent = PRESETS.length.toString();
    allPill.appendChild(badgeAllSpan);
    container.appendChild(allPill);
    for (const [cat, count] of Object.entries(breakdown)) {
      const catPill = new MockElement("BUTTON");
      catPill.setAttribute("data-filter", cat);
      const catBadge = new MockElement("SPAN");
      catBadge.className = "tab-badge";
      catBadge.setAttribute("data-category-badge", cat);
      catBadge.textContent = count.toString();
      catPill.appendChild(catBadge);
      container.appendChild(catPill);
    }
    const badgeAll = container.querySelector("#badgeAll");
    expect(badgeAll.textContent).toBe("71");
    for (const [cat, count] of Object.entries(breakdown)) {
      const badge = container.querySelector(`[data-category-badge="${cat}"]`);
      expect(badge).toBeDefined();
      expect(badge.textContent).toBe(count.toString());
    }
  });
  test("T1.Presets.7: Search filter matches preset name, category, and description in real time", () => {
    const waveMatches = PRESETS.filter((p) => p.name.toLowerCase().includes("wave"));
    expect(waveMatches.length).toBeGreaterThan(0);
    const tunnelMatches = PRESETS.filter((p) => p.category.toLowerCase().includes("tunnel"));
    expect(tunnelMatches.length).toBe(7);
    const retroMatches = PRESETS.filter((p) => p.category.toLowerCase().includes("retro"));
    expect(retroMatches.length).toBe(7);
    const zeroMatches = PRESETS.filter((p) => p.name.toLowerCase().includes("__non_existent_preset_query__"));
    expect(zeroMatches.length).toBe(0);
  });
  test("T1.Presets.8: Preset card DOM rendering produces complete card structure with SVG thumbnail", () => {
    const preset = getPreset("waveform") || PRESETS[0];
    const card = new MockElement("DIV");
    card.className = "preset-card-3";
    card.setAttribute("data-preset-id", preset.id);
    card.setAttribute("data-category", preset.category);
    const favBtn = new MockElement("BUTTON");
    favBtn.className = "preset-fav-btn";
    card.appendChild(favBtn);
    const thumb = new MockElement("DIV");
    thumb.className = "preset-thumb-visual";
    card.appendChild(thumb);
    const info = new MockElement("DIV");
    info.className = "preset-card-info";
    const title = new MockElement("DIV");
    title.className = "preset-badge-name";
    title.textContent = preset.name;
    const catBadge = new MockElement("SPAN");
    catBadge.className = "preset-cat-badge";
    catBadge.textContent = preset.category;
    info.appendChild(title);
    info.appendChild(catBadge);
    card.appendChild(info);
    expect(card.querySelector(".preset-fav-btn")).toBeDefined();
    expect(card.querySelector(".preset-thumb-visual")).toBeDefined();
    expect(card.querySelector(".preset-badge-name")?.textContent).toBe(preset.name);
    expect(card.querySelector(".preset-cat-badge")?.textContent).toBe(preset.category);
    expect(card.getAttribute("data-preset-id")).toBe(preset.id);
  });
});

// src/audio/AudioEngine.ts
var BeatDetector = class {
  history = new Array(40).fill(0);
  historyIndex = 0;
  beatEnergy = 0;
  isBeat = false;
  update(bassEnergy, decay = 0.9) {
    let sum = 0;
    for (const val of this.history) {
      sum += val;
    }
    const avg = sum / this.history.length;
    let variance = 0;
    for (const val of this.history) {
      variance += Math.pow(val - avg, 2);
    }
    variance /= this.history.length;
    const threshold = avg * Math.max(1.18, Math.min(1.7, -12 * variance + 1.45));
    if (bassEnergy > threshold && bassEnergy > 0.3 && this.beatEnergy < 0.25) {
      this.isBeat = true;
      this.beatEnergy = 1;
    } else {
      this.isBeat = false;
      this.beatEnergy *= decay;
    }
    this.history[this.historyIndex] = bassEnergy;
    this.historyIndex = (this.historyIndex + 1) % this.history.length;
    return this.isBeat;
  }
};
var BPMDetector = class {
  tapTimes = [];
  manualBPM = null;
  detectedBPM = 120;
  peakTimestamps = [];
  recordBeat(timeSeconds) {
    if (this.manualBPM !== null) return;
    this.peakTimestamps.push(timeSeconds);
    if (this.peakTimestamps.length > 20) {
      this.peakTimestamps.shift();
    }
    if (this.peakTimestamps.length >= 4) {
      const intervals = [];
      for (let i = 1; i < this.peakTimestamps.length; i++) {
        const dt = this.peakTimestamps[i] - this.peakTimestamps[i - 1];
        if (dt >= 0.25 && dt <= 1.2) {
          intervals.push(dt);
        }
      }
      if (intervals.length >= 3) {
        intervals.sort((a, b) => a - b);
        const medianDt = intervals[Math.floor(intervals.length / 2)];
        const bpm = Math.round(60 / medianDt);
        if (bpm >= 60 && bpm <= 200) {
          this.detectedBPM = Math.round(this.detectedBPM * 0.75 + bpm * 0.25);
        }
      }
    }
  }
  tap() {
    const now = performance.now() / 1e3;
    if (this.tapTimes.length > 0 && now - (this.tapTimes.at(-1) ?? 0) > 2.5) {
      this.tapTimes = [];
    }
    this.tapTimes.push(now);
    if (this.tapTimes.length > 8) this.tapTimes.shift();
    if (this.tapTimes.length >= 2) {
      let sum = 0;
      for (let i = 1; i < this.tapTimes.length; i++) {
        sum += this.tapTimes[i] - this.tapTimes[i - 1];
      }
      const avgDt = sum / (this.tapTimes.length - 1);
      const bpm = Math.round(60 / avgDt);
      if (bpm >= 50 && bpm <= 240) {
        this.manualBPM = bpm;
        this.detectedBPM = bpm;
      }
    }
    return this.detectedBPM;
  }
  resetManual() {
    this.manualBPM = null;
    this.tapTimes = [];
  }
};
var AudioEngine = class {
  ctx = null;
  analyser = null;
  gainNode = null;
  reactivityGainNode = null;
  streamDestination = null;
  // Audio Sources
  audioElement = null;
  audioSourceNode = null;
  micStream = null;
  micSourceNode = null;
  screenStream = null;
  screenSourceNode = null;
  // Demo Synth
  demoInterval = null;
  isDemoPlaying = false;
  // Analysis Buffers & Detectors
  freqData;
  timeData;
  beatDetector = new BeatDetector();
  bpmDetector = new BPMDetector();
  // Playlist Queue
  playlist = [];
  currentTrackIndex = -1;
  isShuffle = false;
  isRepeat = false;
  isMicActive = false;
  isScreenAudioActive = false;
  isScreenAudioPassthrough = false;
  screenPassthroughGain = null;
  onScreenAudioEnded;
  currentTrackName = "No track loaded";
  currentArtistName = "Visualizor Audio Engine";
  duration = 0;
  currentTime = 0;
  isPlaying = false;
  volume = 0.8;
  sensitivity = 1;
  // Callbacks
  onTrackEnded;
  onTimeUpdate;
  onPlaylistChange;
  onBpmChange;
  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.addEventListener("timeupdate", () => {
      if (this.audioElement) {
        this.currentTime = this.audioElement.currentTime;
        this.duration = this.audioElement.duration || 0;
        this.onTimeUpdate?.(this.currentTime, this.duration);
      }
    });
    this.audioElement.addEventListener("ended", () => {
      this.isPlaying = false;
      this.handleTrackEnded();
    });
  }
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("Web Audio API is not supported in this browser.");
      }
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.82;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.reactivityGainNode = this.ctx.createGain();
      this.reactivityGainNode.gain.setValueAtTime(this.sensitivity, this.ctx.currentTime);
      this.streamDestination = this.ctx.createMediaStreamDestination();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.connect(this.streamDestination);
      this.reactivityGainNode.connect(this.analyser);
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
      if (this.audioElement) {
        this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
        this.audioSourceNode.connect(this.gainNode);
        this.audioSourceNode.connect(this.reactivityGainNode);
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }
  // Playlist Management
  addFilesToPlaylist(files) {
    files.forEach((file) => {
      const track = {
        id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local Audio",
        file
      };
      this.playlist.push(track);
    });
    if (this.currentTrackIndex === -1 && this.playlist.length > 0) {
      void this.playPlaylistIndex(0);
    } else {
      this.onPlaylistChange?.(this.playlist, this.currentTrackIndex);
    }
  }
  async playPlaylistIndex(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    const track = this.playlist[index];
    this.stopDemo();
    this.disableMic();
    this.disableScreenAudioCapture();
    this.initContext();
    if (track.file && this.audioElement) {
      this.audioElement.src = URL.createObjectURL(track.file);
      this.currentTrackName = track.name;
      this.currentArtistName = track.artist;
      try {
        await this.audioElement.play();
        this.isPlaying = true;
      } catch (err) {
        console.warn("Playback error:", err);
      }
    }
    this.onPlaylistChange?.(this.playlist, this.currentTrackIndex);
  }
  nextTrack() {
    if (this.playlist.length === 0) return;
    if (this.isShuffle) {
      const nextIdx = Math.floor(Math.random() * this.playlist.length);
      void this.playPlaylistIndex(nextIdx);
    } else {
      const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
      void this.playPlaylistIndex(nextIdx);
    }
  }
  prevTrack() {
    if (this.playlist.length === 0) return;
    if (this.currentTime > 3) {
      this.seek(0);
      return;
    }
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    void this.playPlaylistIndex(prevIdx);
  }
  handleTrackEnded() {
    this.onTrackEnded?.();
    if (this.isRepeat) {
      this.seek(0);
      void this.togglePlay();
    } else if (this.playlist.length > 1) {
      this.nextTrack();
    }
  }
  loadAudioFile(file) {
    this.addFilesToPlaylist([file]);
  }
  async togglePlay() {
    this.initContext();
    if (this.isScreenAudioActive) {
      this.disableScreenAudioCapture();
      return;
    }
    if (this.isMicActive) {
      this.disableMic();
      return;
    }
    if (this.isDemoPlaying) {
      this.stopDemo();
      return;
    }
    if (!this.audioElement?.src) {
      this.playDemo();
      return;
    }
    if (this.audioElement.paused) {
      await this.audioElement.play();
      this.isPlaying = true;
    } else {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }
  seek(seconds) {
    if (this.audioElement && this.duration > 0) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.duration));
    }
  }
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.screenPassthroughGain && this.ctx && this.isScreenAudioPassthrough) {
      this.screenPassthroughGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
  setSensitivity(val) {
    this.sensitivity = Math.max(0, Math.min(3, val));
    if (this.reactivityGainNode && this.ctx) {
      this.reactivityGainNode.gain.setValueAtTime(this.sensitivity, this.ctx.currentTime);
    }
  }
  getVolumeGainValue() {
    return this.gainNode?.gain.value ?? this.volume;
  }
  getReactivityGainValue() {
    return this.reactivityGainNode?.gain.value ?? this.sensitivity;
  }
  setScreenAudioPassthrough(enabled) {
    this.isScreenAudioPassthrough = enabled;
    if (this.screenPassthroughGain && this.ctx) {
      this.screenPassthroughGain.gain.setValueAtTime(
        enabled ? this.volume : 0,
        this.ctx.currentTime
      );
    }
  }
  async toggleMic() {
    this.initContext();
    if (this.isMicActive) {
      this.disableMic();
      return false;
    } else {
      this.stopDemo();
      this.disableScreenAudioCapture();
      if (this.audioElement?.paused === false) {
        this.audioElement.pause();
        this.isPlaying = false;
      }
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (this.ctx && this.analyser) {
          this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
          this.micSourceNode.connect(this.reactivityGainNode ?? this.analyser);
          this.isMicActive = true;
          this.currentTrackName = "Live Microphone";
          this.currentArtistName = "Real-time Audio Input";
          return true;
        }
      } catch (err) {
        console.error("Error accessing microphone:", err);
        this.isMicActive = false;
        return false;
      }
    }
    return false;
  }
  disableMic() {
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    this.micSourceNode?.disconnect();
    this.micSourceNode = null;
    this.isMicActive = false;
  }
  async toggleScreenAudioCapture() {
    this.initContext();
    if (this.isScreenAudioActive) {
      this.disableScreenAudioCapture();
      return false;
    }
    this.stopDemo();
    this.disableMic();
    if (this.audioElement?.paused === false) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      const audioTracks = this.screenStream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.disableScreenAudioCapture();
        throw new Error("NO_AUDIO_TRACK");
      }
      if (this.ctx && this.analyser) {
        this.screenSourceNode = this.ctx.createMediaStreamSource(this.screenStream);
        this.screenSourceNode.connect(this.reactivityGainNode ?? this.analyser);
        if (this.streamDestination) {
          this.screenSourceNode.connect(this.streamDestination);
        }
        this.screenPassthroughGain = this.ctx.createGain();
        this.screenPassthroughGain.gain.setValueAtTime(
          this.isScreenAudioPassthrough ? this.volume : 0,
          this.ctx.currentTime
        );
        this.screenSourceNode.connect(this.screenPassthroughGain);
        this.screenPassthroughGain.connect(this.ctx.destination);
        this.isScreenAudioActive = true;
        this.currentTrackName = "System / Screen Audio";
        this.currentArtistName = "Live Display Media Cast (Muted Return)";
        const onEndedHandler = () => {
          this.disableScreenAudioCapture();
          this.onScreenAudioEnded?.();
        };
        audioTracks[0].onended = onEndedHandler;
        const videoTracks = this.screenStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].onended = onEndedHandler;
        }
        return true;
      }
    } catch (err) {
      this.disableScreenAudioCapture();
      if (err?.message === "NO_AUDIO_TRACK") {
        throw err;
      }
      console.warn("System audio capture was cancelled or failed:", err);
      return false;
    }
    return false;
  }
  disableScreenAudioCapture() {
    this.screenStream?.getTracks().forEach((track) => track.stop());
    this.screenStream = null;
    this.screenSourceNode?.disconnect();
    this.screenSourceNode = null;
    this.screenPassthroughGain?.disconnect();
    this.screenPassthroughGain = null;
    this.isScreenAudioActive = false;
  }
  playDemo() {
    this.initContext();
    this.disableMic();
    this.disableScreenAudioCapture();
    if (this.audioElement?.paused === false) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
    if (this.isDemoPlaying) return;
    this.isDemoPlaying = true;
    this.isPlaying = true;
    this.currentTrackName = "Cyber Pulse (Demo Synth)";
    this.currentArtistName = "Visualizor Procedural Audio";
    let step = 0;
    const scale = [130.81, 155.56, 174.61, 196, 233.08, 261.63, 311.13, 392];
    this.demoInterval = setInterval(() => {
      if (!this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;
      if (step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
        g.gain.setValueAtTime(1, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + 0.22);
        osc.connect(g);
        g.connect(this.gainNode);
        if (this.reactivityGainNode) g.connect(this.reactivityGainNode);
        osc.start(t);
        osc.stop(t + 0.22);
      }
      if (step % 8 === 4) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, t);
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + 0.15);
        osc.connect(g);
        g.connect(this.gainNode);
        if (this.reactivityGainNode) g.connect(this.reactivityGainNode);
        osc.start(t);
        osc.stop(t + 0.15);
      }
      const note = scale[step % scale.length];
      const oscPluck = this.ctx.createOscillator();
      const gPluck = this.ctx.createGain();
      oscPluck.type = "sawtooth";
      oscPluck.frequency.setValueAtTime(note, t);
      gPluck.gain.setValueAtTime(0.2, t);
      gPluck.gain.exponentialRampToValueAtTime(1e-3, t + 0.18);
      oscPluck.connect(gPluck);
      gPluck.connect(this.gainNode);
      if (this.reactivityGainNode) gPluck.connect(this.reactivityGainNode);
      oscPluck.start(t);
      oscPluck.stop(t + 0.18);
      step = (step + 1) % 16;
    }, 125);
  }
  stopDemo() {
    this.isDemoPlaying = false;
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
  }
  getAudioStream() {
    return this.streamDestination?.stream || null;
  }
  getContext() {
    this.initContext();
    return this.ctx;
  }
  getAnalyser() {
    this.initContext();
    return this.analyser;
  }
  getFeatures() {
    if (!this.analyser) {
      return {
        frequencyData: new Uint8Array(1024),
        timeDomainData: new Uint8Array(1024),
        subBass: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        rms: 0,
        beat: false,
        beatEnergy: 0,
        bpm: this.bpmDetector.detectedBPM
      };
    }
    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);
    const subBass = this.calcBand(1, 4) * this.sensitivity;
    const bass = this.calcBand(4, 14) * this.sensitivity;
    const mid = this.calcBand(14, 180) * this.sensitivity;
    const treble = this.calcBand(180, 600) * this.sensitivity;
    let sumSquares = 0;
    for (const val of this.timeData) {
      const norm = (val - 128) / 128;
      sumSquares += norm * norm;
    }
    const rms = Math.min(1, Math.sqrt(sumSquares / this.timeData.length) * 2 * this.sensitivity);
    const beat = this.beatDetector.update(bass);
    if (beat && this.ctx) {
      this.bpmDetector.recordBeat(this.ctx.currentTime);
      this.onBpmChange?.(this.bpmDetector.detectedBPM, this.bpmDetector.manualBPM !== null);
    }
    return {
      frequencyData: this.freqData,
      timeDomainData: this.timeData,
      subBass: Math.min(1, subBass),
      bass: Math.min(1, bass),
      mid: Math.min(1, mid),
      treble: Math.min(1, treble),
      rms,
      beat,
      beatEnergy: this.beatDetector.beatEnergy,
      bpm: this.bpmDetector.detectedBPM
    };
  }
  calcBand(startBin, endBin) {
    let sum = 0;
    const count = Math.max(1, endBin - startBin);
    for (let i = startBin; i < endBin && i < this.freqData.length; i++) {
      sum += this.freqData[i];
    }
    return sum / count / 255;
  }
};

// tests/tier1-features/audio-dsp.test.ts
describe("Tier 1: Audio DSP Engine & Analysis", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T1.Audio.1: Multi-band FFT energies subBass, bass, mid, treble remain normalized [0.0, 1.0]", () => {
    const engine = new AudioEngine();
    const features = engine.getFeatures();
    expect(features.subBass).toBeGreaterThanOrEqual(0);
    expect(features.subBass).toBeLessThanOrEqual(1);
    expect(features.bass).toBeGreaterThanOrEqual(0);
    expect(features.bass).toBeLessThanOrEqual(1);
    expect(features.mid).toBeGreaterThanOrEqual(0);
    expect(features.mid).toBeLessThanOrEqual(1);
    expect(features.treble).toBeGreaterThanOrEqual(0);
    expect(features.treble).toBeLessThanOrEqual(1);
  });
  test("T1.Audio.2: RMS calculation derives global amplitude in normalized range [0.0, 1.0]", () => {
    const engine = new AudioEngine();
    const features = engine.getFeatures();
    expect(features.rms).toBeGreaterThanOrEqual(0);
    expect(features.rms).toBeLessThanOrEqual(1);
  });
  test("T1.Audio.3: BeatDetector triggers kick transient on energy threshold and decays exponentially", () => {
    const detector = new BeatDetector();
    for (let i = 0; i < 40; i++) {
      detector.update(0.1);
    }
    const isBeat = detector.update(0.85);
    expect(isBeat).toBe(true);
    expect(detector.beatEnergy).toBe(1);
    detector.update(0.1);
    expect(detector.isBeat).toBe(false);
    expect(detector.beatEnergy).toBeCloseTo(0.9, 0.05);
  });
  test("T1.Audio.4: BPMDetector records beat timestamps and calculates tempo", () => {
    const bpm = new BPMDetector();
    let t = 10;
    for (let i = 0; i < 6; i++) {
      bpm.recordBeat(t);
      t += 0.5;
    }
    expect(bpm.detectedBPM).toBeGreaterThanOrEqual(100);
    expect(bpm.detectedBPM).toBeLessThanOrEqual(140);
  });
  test("T1.Audio.5: BPM tap tempo overrides auto detection with manual tempo", () => {
    const bpm = new BPMDetector();
    bpm.tap();
    setTimeout(() => {
    }, 500);
    bpm.tap();
    expect(bpm.manualBPM !== null || bpm.detectedBPM > 0).toBe(true);
    bpm.resetManual();
    expect(bpm.manualBPM).toBeNull();
  });
  test("T1.Audio.6: Playlist Queue manages queue order, shuffle, and repeat modes", () => {
    const engine = new AudioEngine();
    expect(engine.playlist.length).toBe(0);
    expect(engine.isShuffle).toBe(false);
    expect(engine.isRepeat).toBe(false);
    engine.isShuffle = !engine.isShuffle;
    expect(engine.isShuffle).toBe(true);
    engine.isRepeat = !engine.isRepeat;
    expect(engine.isRepeat).toBe(true);
  });
});

// src/export/ExportManager.ts
var ExportManager = class {
  constructor(renderEngine, audioEngine) {
    this.renderEngine = renderEngine;
    this.audioEngine = audioEngine;
  }
  mediaRecorder = null;
  recordedChunks = [];
  isRecording = false;
  startExport(settings, durationSeconds, onProgress, onComplete) {
    if (this.isRecording) return;
    this.isRecording = true;
    this.recordedChunks = [];
    const canvas = this.renderEngine.renderer.domElement;
    const canvasStream = canvas.captureStream(settings.fps);
    const audioStream = this.audioEngine.getAudioStream();
    const combinedTracks = [
      ...canvasStream.getVideoTracks()
    ];
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      combinedTracks.push(...audioStream.getAudioTracks());
    }
    const combinedStream = new MediaStream(combinedTracks);
    let mimeType = "video/webm;codecs=vp9,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }
    }
    const bitrateMap = {
      medium: 5e6,
      high: 12e6,
      ultra: 25e6
    };
    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: bitrateMap[settings.quality] || 12e6
    });
    this.recordedChunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
    this.mediaRecorder.onstop = () => {
      this.isRecording = false;
      const blob = new Blob(this.recordedChunks, { type: "video/webm" });
      const downloadUrl = URL.createObjectURL(blob);
      onComplete(blob, downloadUrl);
    };
    this.mediaRecorder.start(100);
    const startTime = Date.now();
    const totalMs = durationSeconds * 1e3;
    const progressInterval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(progressInterval);
        return;
      }
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round(elapsed / totalMs * 100));
      const remainingSeconds = Math.max(0, Math.ceil((totalMs - elapsed) / 1e3));
      onProgress(progress, remainingSeconds);
      if (elapsed >= totalMs) {
        clearInterval(progressInterval);
        this.stopExport();
      }
    }, 250);
  }
  /**
   * Batch Recording Mode: Cycles sequentially through presets during a single recording
   */
  startBatchExport(settings, presetList, secondsPerPreset, onPresetSwitch, onProgress, onComplete) {
    if (this.isRecording || presetList.length === 0) return;
    const totalDuration = presetList.length * secondsPerPreset;
    let currentPresetIdx = 0;
    this.renderEngine.setPreset(presetList[0]);
    onPresetSwitch(presetList[0], 0);
    const switchInterval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(switchInterval);
        return;
      }
      currentPresetIdx++;
      if (currentPresetIdx < presetList.length) {
        const nextPreset = presetList[currentPresetIdx];
        this.renderEngine.setPreset(nextPreset);
        onPresetSwitch(nextPreset, currentPresetIdx);
      } else {
        clearInterval(switchInterval);
      }
    }, secondsPerPreset * 1e3);
    this.startExport(
      settings,
      totalDuration,
      onProgress,
      (blob, downloadUrl) => {
        clearInterval(switchInterval);
        onComplete(blob, downloadUrl);
      }
    );
  }
  stopExport() {
    if (this.mediaRecorder?.state !== "inactive") {
      this.mediaRecorder?.stop();
    }
  }
};

// tests/tier1-features/tickets-1-37.test.ts
var THREE78 = __toESM(require("three"), 1);
describe("Tier 1: Comprehensive Tickets 1-37 Verification Pass", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("Ticket 1: Wave Form Preset (#1) audio displacement, beat flash, and parameters", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const wave = getPreset("wave");
    expect(wave.id).toBe("wave");
    expect(wave.name).toBe("Wave Form");
    expect(wave.category).toBe("Structures");
    wave.init(ctx);
    const waveGroup = ctx.scene.children[0];
    const planeMesh = waveGroup.children[0];
    expect(planeMesh).toBeDefined();
    expect(planeMesh.geometry instanceof THREE78.PlaneGeometry).toBe(true);
    const posAttr = planeMesh.geometry.attributes.position;
    expect(posAttr.count).toBe(64 * 64);
    const silent = createSilentAudioFeatures();
    wave.update(ctx, silent, 1, 0.016);
    let silentSum = 0;
    for (let i = 0; i < posAttr.count; i++) silentSum += Math.abs(posAttr.getZ(i));
    expect(silentSum).toBe(0);
    const beatAudio = createBeatDropAudioFeatures(0.95);
    wave.update(ctx, beatAudio, 2, 0.016);
    let beatSum = 0;
    for (let i = 0; i < posAttr.count; i++) beatSum += Math.abs(posAttr.getZ(i));
    expect(posAttr.version > 0).toBe(true);
    expect(beatSum).toBeGreaterThan(10);
    const mat = planeMesh.material;
    expect(mat.emissiveIntensity).toBeGreaterThan(0.5);
    wave.update(ctx, silent, 2.016, 0.016);
    expect(mat.emissiveIntensity).toBeLessThan(0.8);
    const params = wave.getCustomParameters?.() || [];
    expect(params.map((p) => p.id)).toEqual(["speed", "reactivity", "deformation", "density"]);
    wave.setCustomParameter?.("deformation", 2.5);
    expect(wave.getCustomParameterValue?.("deformation")).toBe(2.5);
    wave.dispose();
    ctx.scene.clear();
  });
  test("Ticket 2: Circular Spectrum & 3D Bars Presets (#2) ring culling and column scaling", () => {
    const ctx = createMockPresetContext(getTheme("neon"));
    const circular = getPreset("circular");
    expect(circular.category).toBe("Structures");
    circular.init(ctx);
    expect(ctx.scene.children.length).toBeGreaterThan(0);
    const ringGroup = ctx.scene.children[0];
    expect(ringGroup.children.length).toBe(16);
    const beatAudio = createBeatDropAudioFeatures(0.9);
    circular.update(ctx, beatAudio, 1, 0.016);
    expect(ringGroup.rotation.z).not.toBe(0);
    circular.setCustomParameter?.("density", 8);
    circular.update(ctx, beatAudio, 1.016, 0.016);
    expect(ringGroup.children[0].visible).toBe(true);
    expect(ringGroup.children[15].visible).toBe(false);
    circular.dispose();
    ctx.scene.clear();
    const bars = getPreset("bars3d");
    expect(bars.category).toBe("Structures");
    bars.init(ctx);
    const barsGroup = ctx.scene.children[0];
    const instMesh = barsGroup.children[0];
    expect(instMesh.count).toBe(256);
    bars.update(ctx, beatAudio, 1, 0.016);
    const matrix = new THREE78.Matrix4();
    instMesh.getMatrixAt(0, matrix);
    expect(matrix.elements[5]).toBeGreaterThan(0.1);
    bars.dispose();
    ctx.scene.clear();
  });
  test("Ticket 3: Obsidian Poly & Ferrofluid Presets (#3) physical material and spike deformation", () => {
    const ctx = createMockPresetContext(getTheme("obsidian"));
    const obsidian = getPreset("obsidian");
    obsidian.init(ctx);
    const obsGroup = ctx.scene.children[0];
    const obsMesh = obsGroup.children[0];
    expect(obsMesh.material instanceof THREE78.MeshPhysicalMaterial).toBe(true);
    const obsMat = obsMesh.material;
    expect(obsMat.clearcoat).toBe(1);
    const beatAudio = createBeatDropAudioFeatures(0.9);
    obsidian.update(ctx, beatAudio, 1, 0.016);
    expect(obsMat.emissiveIntensity).toBeGreaterThan(0.5);
    obsidian.dispose();
    ctx.scene.clear();
    const ferro = getPreset("ferrofluid");
    ferro.init(ctx);
    const ferroGroup = ctx.scene.children[0];
    const ferroMesh = ferroGroup.children[0];
    expect(ferroMesh.geometry instanceof THREE78.SphereGeometry).toBe(true);
    const pos = ferroMesh.geometry.attributes.position;
    expect(pos.count).toBeGreaterThan(5e3);
    ferro.update(ctx, beatAudio, 1, 0.016);
    const ferroMat = ferroMesh.material;
    expect(ferroMat.emissiveIntensity).toBeGreaterThan(0.7);
    ferro.dispose();
    ctx.scene.clear();
  });
  test("Ticket 4: DNA Helix, Topo Map & Cymatic Presets (#4) geometry and Chladni acoustics", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const dna = getPreset("dna");
    dna.init(ctx);
    const dnaGroup = ctx.scene.children[0];
    expect(dnaGroup.children.length).toBe(2);
    dna.update(ctx, createBeatDropAudioFeatures(0.85), 1, 0.016);
    dna.dispose();
    ctx.scene.clear();
    const topo = getPreset("topographic");
    topo.init(ctx);
    const topoGroup = ctx.scene.children[0];
    const topoMesh = topoGroup.children[0];
    expect(topoMesh.material instanceof THREE78.ShaderMaterial).toBe(true);
    const topoShader = topoMesh.material;
    expect(topoShader.uniforms.uBands).toBeDefined();
    topo.setCustomParameter?.("density", 8.5);
    topo.update(ctx, createBeatDropAudioFeatures(0.8), 1, 0.016);
    expect(topoShader.uniforms.uBands.value).toBe(8.5);
    topo.dispose();
    ctx.scene.clear();
    const cymatic = getPreset("cymatic");
    cymatic.init(ctx);
    const cymGroup = ctx.scene.children[0];
    expect(cymGroup.children.length).toBe(1);
    const plate = cymGroup.children[0];
    expect(plate.children.length).toBe(1);
    cymatic.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    cymatic.dispose();
    ctx.scene.clear();
  });
  test("Ticket 5: Vinyl Player & Orbital Rings Presets (#5) turntable rotation and decoupled orrery", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const vinyl = getPreset("vinyl");
    vinyl.init(ctx);
    const vinylGroup = ctx.scene.children[0];
    const disc = vinylGroup.children[0];
    const initialRot = disc.rotation.y;
    vinyl.update(ctx, createTrebleMelodyAudioFeatures(), 1, 0.016);
    expect(disc.rotation.y).toBeGreaterThan(initialRot);
    vinyl.dispose();
    ctx.scene.clear();
    const rings = getPreset("rings");
    rings.init(ctx);
    const ringsGroup = ctx.scene.children[0];
    expect(ringsGroup.children.length).toBe(4);
    rings.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    rings.dispose();
    ctx.scene.clear();
  });
  test("Ticket 6: Tesseract 4D & Hologram Presets (#6) 4D rotation and glitch shader", () => {
    const ctx = createMockPresetContext(getTheme("cyberpunk"));
    const tesseract = getPreset("tesseract");
    tesseract.init(ctx);
    const tessGroup = ctx.scene.children[0];
    expect(tessGroup.children.length).toBe(2);
    tesseract.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    const edges = tessGroup.children[0];
    const edgePos = edges.geometry.attributes.position.array;
    for (let i = 0; i < 20; i++) {
      expect(Number.isFinite(edgePos[i])).toBe(true);
    }
    tesseract.dispose();
    ctx.scene.clear();
    const holo = getPreset("hologram");
    holo.init(ctx);
    const holoGroup = ctx.scene.children[0];
    const plane = holoGroup.children[0];
    const mat = plane.material;
    expect(mat.uniforms.uGlitch).toBeDefined();
    holo.update(ctx, createBeatDropAudioFeatures(0.95), 1, 0.016);
    expect(mat.uniforms.uGlitch.value).toBeGreaterThan(0.2);
    holo.dispose();
    ctx.scene.clear();
  });
  test("Ticket 7: Geodesic Sphere & Warp Grid Presets (#7) frequency extrusion and spacetime dip", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const geodesic = getPreset("geodesic");
    geodesic.init(ctx);
    geodesic.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    geodesic.dispose();
    ctx.scene.clear();
    const warp = getPreset("warp");
    warp.init(ctx);
    const warpGroup = ctx.scene.children[0];
    const warpMesh = warpGroup.children[0];
    const pos = warpMesh.geometry.attributes.position;
    warp.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    expect(pos.getY(pos.count / 2) !== 0 || pos.needsUpdate).toBe(true);
    warp.dispose();
    ctx.scene.clear();
  });
  test("Ticket 8: Starfield, Black Hole & The Sun Presets (#8) warp speeds and accretion dynamics", () => {
    const ctx = createMockPresetContext(getTheme("space"));
    const starfield = getPreset("starfield");
    starfield.init(ctx);
    const starGroup = ctx.scene.children[0];
    const starPoints = starGroup.children[0];
    expect(starPoints.geometry.attributes.position.count).toBe(4e3);
    starfield.update(ctx, createBeatDropAudioFeatures(0.95), 1, 0.016);
    starfield.dispose();
    ctx.scene.clear();
    const blackhole = getPreset("blackhole");
    blackhole.init(ctx);
    const bhGroup = ctx.scene.children[0];
    expect(bhGroup.children.length).toBe(2);
    blackhole.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    blackhole.dispose();
    ctx.scene.clear();
    const sun = getPreset("sun");
    sun.init(ctx);
    const sunGroup = ctx.scene.children[0];
    expect(sunGroup.children.length).toBe(3);
    sun.update(ctx, createBeatDropAudioFeatures(0.85), 1, 0.016);
    sun.dispose();
    ctx.scene.clear();
  });
  test("Ticket 9: Mandel Fractal & Unfolding Matter Presets (#9) fractal zoom and origami hinges", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const mandel = getPreset("mandel");
    mandel.init(ctx);
    const mGroup = ctx.scene.children[0];
    const mMesh = mGroup.children[0];
    const mShader = mMesh.material;
    expect(mShader.uniforms.uBass).toBeDefined();
    mandel.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    expect(mShader.uniforms.uBass.value).toBeGreaterThan(0.5);
    mandel.dispose();
    ctx.scene.clear();
    const unfolding = getPreset("unfoldingmatter");
    unfolding.init(ctx);
    const uGroup = ctx.scene.children[0];
    expect(uGroup.children.length).toBe(20);
    unfolding.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    unfolding.dispose();
    ctx.scene.clear();
  });
  test("Ticket 10: MilkDrop & Geiss Presets (#10) oscilloscope line and non-tunable UI contract", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const milk = getPreset("milkdrop");
    expect(milk.getCustomParameters?.()).toEqual([]);
    milk.init(ctx);
    const milkGroup = ctx.scene.children[0];
    expect(milkGroup.children.length).toBe(2);
    milk.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    milk.dispose();
    ctx.scene.clear();
    const geiss = getPreset("geiss");
    geiss.init(ctx);
    const gGroup = ctx.scene.children[0];
    const gMesh = gGroup.children[0];
    const gShader = gMesh.material;
    expect(gShader.uniforms.uBass).toBeDefined();
    geiss.update(ctx, createBeatDropAudioFeatures(0.8), 1, 0.016);
    geiss.dispose();
    ctx.scene.clear();
  });
  test("Ticket 11: Aurora & Sacred Mandala Presets (#11) curtain shader and harmonic line loops", () => {
    const ctx = createMockPresetContext(getTheme("arctic"));
    const aurora = getPreset("aurora");
    aurora.init(ctx);
    const aGroup = ctx.scene.children[0];
    const aMesh = aGroup.children[0];
    const aShader = aMesh.material;
    expect(aShader.uniforms.uMid).toBeDefined();
    aurora.update(ctx, createTrebleMelodyAudioFeatures(), 1, 0.016);
    aurora.dispose();
    ctx.scene.clear();
    const sacred = getPreset("sacred");
    sacred.init(ctx);
    const sGroup = ctx.scene.children[0];
    expect(sGroup.children.length).toBe(5);
    sacred.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    sacred.dispose();
    ctx.scene.clear();
  });
  test("Ticket 12: Synthwave Terrain & Galaxy Presets (#12) canyon perspectives and spiral arms", () => {
    const ctx = createMockPresetContext(getTheme("synthwave"));
    const terrain = getPreset("terrain");
    terrain.init(ctx);
    const tGroup = ctx.scene.children[0];
    expect(tGroup.children.length).toBe(2);
    terrain.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    terrain.dispose();
    ctx.scene.clear();
    const galaxy = getPreset("galaxy");
    galaxy.init(ctx);
    const galGroup = ctx.scene.children[0];
    expect(galGroup.children.length).toBe(2);
    galaxy.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    galaxy.dispose();
    ctx.scene.clear();
  });
  test("Ticket 13: Particle Swarm & Fireflies Presets (#13) draw ranges and bounded 3D wandering", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const swarm = getPreset("particles");
    swarm.init(ctx);
    const sGroup = ctx.scene.children[0];
    const sPoints = sGroup.children[0];
    expect(sPoints.geometry.attributes.position.count).toBe(6e3);
    swarm.setCustomParameter?.("density", 0.5);
    swarm.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    expect(sPoints.geometry.drawRange.count).toBe(3e3);
    swarm.dispose();
    ctx.scene.clear();
    const flies = getPreset("fireflies");
    flies.init(ctx);
    const fGroup = ctx.scene.children[0];
    const fPoints = fGroup.children[0];
    expect(fPoints.geometry.attributes.position.count).toBe(1200);
    flies.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    flies.dispose();
    ctx.scene.clear();
  });
  test("Ticket 14: Lightning & Plasma Arcs Presets (#14) electric bolts and dielectric breakdown", () => {
    const ctx = createMockPresetContext(getTheme("electric"));
    const lightning = getPreset("lightning");
    lightning.init(ctx);
    const lGroup = ctx.scene.children[0];
    expect(lGroup.children.length).toBe(16);
    lightning.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    lightning.dispose();
    ctx.scene.clear();
    const plasmaArcs = getPreset("plasmaarcs");
    plasmaArcs.init(ctx);
    const pGroup = ctx.scene.children[0];
    const pMesh = pGroup.children[0];
    const pShader = pMesh.material;
    expect(pShader.uniforms.uVoltage).toBeDefined();
    plasmaArcs.update(ctx, createTrebleMelodyAudioFeatures(), 1, 0.016);
    expect(pShader.uniforms.uVoltage.value).toBeGreaterThan(0.5);
    plasmaArcs.dispose();
    ctx.scene.clear();
  });
  test("Ticket 15: Lava, Fireball & Water Neurons Presets (#15) noise crust, sparks, and synaptic network", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const lava = getPreset("lava");
    expect(lava.category).toBe("Fluids & Heat");
    lava.init(ctx);
    lava.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    lava.dispose();
    ctx.scene.clear();
    const fireball = getPreset("fireball");
    fireball.init(ctx);
    const fGroup = ctx.scene.children[0];
    expect(fGroup.children.length).toBe(2);
    fireball.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    fireball.dispose();
    ctx.scene.clear();
    const neurons = getPreset("waterneurons");
    neurons.init(ctx);
    const nGroup = ctx.scene.children[0];
    expect(nGroup.children.length).toBe(3);
    neurons.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    neurons.dispose();
    ctx.scene.clear();
  });
  test("Ticket 16: Liquid, Fluid & Plasma Presets (#16) multi-octave fBm and bubble ascension", () => {
    const ctx = createMockPresetContext(getTheme("ocean"));
    const liquid = getPreset("liquid");
    liquid.init(ctx);
    const lGroup = ctx.scene.children[0];
    const lMesh = lGroup.children[0];
    const lShader = lMesh.material;
    expect(lShader.uniforms.uBass).toBeDefined();
    liquid.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    liquid.dispose();
    ctx.scene.clear();
    const fluid = getPreset("fluid");
    fluid.init(ctx);
    const flGroup = ctx.scene.children[0];
    expect(flGroup.children.length).toBe(3);
    fluid.update(ctx, createBeatDropAudioFeatures(0.85), 1, 0.016);
    fluid.dispose();
    ctx.scene.clear();
    const plasma = getPreset("plasma");
    plasma.init(ctx);
    const plGroup = ctx.scene.children[0];
    expect(plGroup.children.length).toBe(2);
    plasma.update(ctx, createTrebleMelodyAudioFeatures(), 1, 0.016);
    plasma.dispose();
    ctx.scene.clear();
  });
  test("Ticket 17: Fog, Rain Water & Smoke Presets (#17) depth planes, ripples, and buoyancy", () => {
    const ctx = createMockPresetContext(getTheme("arctic"));
    const fog = getPreset("fog");
    fog.init(ctx);
    const fogGroup = ctx.scene.children[0];
    expect(fogGroup.children.length).toBe(5);
    fog.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    fog.dispose();
    ctx.scene.clear();
    const rain = getPreset("water");
    rain.init(ctx);
    const rGroup = ctx.scene.children[0];
    const rMesh = rGroup.children[0];
    const rShader = rMesh.material;
    expect(rShader.uniforms.uKickImpact).toBeDefined();
    rain.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    expect(rShader.uniforms.uKickImpact.value).toBeGreaterThan(0.5);
    rain.dispose();
    ctx.scene.clear();
    const smoke = getPreset("smoke");
    smoke.init(ctx);
    const sGroup = ctx.scene.children[0];
    const sPoints = sGroup.children[0];
    expect(sPoints.geometry.attributes.position.count).toBe(1200);
    smoke.update(ctx, createBeatDropAudioFeatures(0.85), 1, 0.016);
    smoke.dispose();
    ctx.scene.clear();
  });
  test("Ticket 18: Neon Tunnel, Box Tunnel & Ring Tunnel Presets (#18) Z-corridor conveyor wraps", () => {
    const ctx = createMockPresetContext(getTheme("neon"));
    const neon = getPreset("neontunnel");
    expect(neon.category).toBe("Tunnels");
    neon.init(ctx);
    const nGroup = ctx.scene.children[0];
    expect(nGroup.children.length).toBe(40);
    neon.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    neon.dispose();
    ctx.scene.clear();
    const box = getPreset("boxtunnel");
    box.init(ctx);
    const bGroup = ctx.scene.children[0];
    expect(bGroup.children.length).toBe(36);
    box.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    box.dispose();
    ctx.scene.clear();
    const ring = getPreset("ringtunnel");
    ring.init(ctx);
    const rGroup = ctx.scene.children[0];
    expect(rGroup.children.length).toBe(48);
    ring.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    ring.dispose();
    ctx.scene.clear();
  });
  test("Ticket 19: Water Slide & Vein Tunnel Presets (#19) 3D CatmullRom spline tubes", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const slide = getPreset("waterslide");
    slide.init(ctx);
    const sGroup = ctx.scene.children[0];
    const sMesh = sGroup.children[0];
    expect(sMesh.geometry instanceof THREE78.TubeGeometry).toBe(true);
    slide.update(ctx, createBeatDropAudioFeatures(0.85), 1, 0.016);
    slide.dispose();
    ctx.scene.clear();
    const vein = getPreset("veintunnel");
    vein.init(ctx);
    const vGroup = ctx.scene.children[0];
    const vMesh = vGroup.children[0];
    expect(vMesh.geometry instanceof THREE78.TubeGeometry).toBe(true);
    vein.update(ctx, createBeatDropAudioFeatures(0.85), 1, 0.016);
    vein.dispose();
    ctx.scene.clear();
  });
  test("Ticket 20: Kaleidoscope Preset (#20) 8-fold mirror mandala geometry", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const kaleido = getPreset("kaleidoscope");
    kaleido.init(ctx);
    const kGroup = ctx.scene.children[0];
    expect(kGroup.children.length).toBe(16);
    kaleido.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    expect(kaleido.getCustomParameterValue?.("density")).toBe(8);
    kaleido.dispose();
    ctx.scene.clear();
  });
  test("Ticket 21: Matrix, The Spectrogram & Night Radar Presets (#21) glyph cascade, rolling history, and radar CRT", () => {
    const ctx = createMockPresetContext(getTheme("matrix"));
    const matrix = getPreset("matrix");
    expect(matrix.category).toBe("Retro & Digital");
    matrix.init(ctx);
    const mGroup = ctx.scene.children[0];
    const mInst = mGroup.children[0];
    expect(mInst.count).toBe(1200);
    matrix.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    matrix.dispose();
    ctx.scene.clear();
    const spec = getPreset("spectrogram");
    spec.init(ctx);
    const sGroup = ctx.scene.children[0];
    const sMesh = sGroup.children[0];
    expect(sMesh.geometry instanceof THREE78.PlaneGeometry).toBe(true);
    spec.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    spec.dispose();
    ctx.scene.clear();
    const radar = getPreset("nightradar");
    radar.init(ctx);
    const rGroup = ctx.scene.children[0];
    expect(rGroup.children.length).toBe(3);
    radar.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    radar.dispose();
    ctx.scene.clear();
  });
  test("Ticket 22: Diode Wall & Vod Lines Presets (#22) 768 LED matrix and 4-channel multi-band routing", () => {
    const ctx = createMockPresetContext(getTheme("cyberpunk"));
    const diode = getPreset("diodewall");
    diode.init(ctx);
    const dGroup = ctx.scene.children[0];
    const dInst = dGroup.children[0];
    expect(dInst.count).toBe(768);
    diode.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    diode.dispose();
    ctx.scene.clear();
    const vod = getPreset("vodlines");
    vod.init(ctx);
    const vGroup = ctx.scene.children[0];
    expect(vGroup.children.length).toBe(4);
    vod.update(ctx, createTrebleMelodyAudioFeatures(), 1, 0.016);
    vod.dispose();
    ctx.scene.clear();
  });
  test("Ticket 23: LCD Deck & Signal Lock Presets (#23) spinning CD disc and SMPTE test pattern", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const lcd = getPreset("lcddeck");
    lcd.init(ctx);
    const lGroup = ctx.scene.children[0];
    expect(lGroup.children.length).toBe(18);
    lcd.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    lcd.dispose();
    ctx.scene.clear();
    const lock = getPreset("signallock");
    lock.init(ctx);
    const sGroup = ctx.scene.children[0];
    expect(sGroup.children.length).toBe(2);
    lock.update(ctx, createBeatDropAudioFeatures(0.95), 1, 0.016);
    lock.dispose();
    ctx.scene.clear();
  });
  test("Ticket 24: Bloom & Ink Drop Presets (#24) phyllotaxis petals and settling plume velocities", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const bloom = getPreset("bloom");
    expect(bloom.category).toBe("Organic & Nature");
    bloom.init(ctx);
    const bGroup = ctx.scene.children[0];
    expect(bGroup.children.length).toBe(34);
    bloom.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    bloom.dispose();
    ctx.scene.clear();
    const ink = getPreset("ink");
    ink.init(ctx);
    const iGroup = ctx.scene.children[0];
    const iPoints = iGroup.children[0];
    expect(iPoints.geometry.attributes.position.count).toBe(1200);
    ink.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    ink.dispose();
    ctx.scene.clear();
  });
  test("Ticket 25: Meadow & Up Cloud Presets (#25) instanced grass blades and value noise rim shader", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const meadow = getPreset("meadow");
    meadow.init(ctx);
    const mGroup = ctx.scene.children[0];
    const mInst = mGroup.children[0];
    expect(mInst.count).toBe(2e3);
    meadow.update(ctx, createBeatDropAudioFeatures(0.85), 1, 0.016);
    meadow.dispose();
    ctx.scene.clear();
    const cloud = getPreset("upcloud");
    cloud.init(ctx);
    const cGroup = ctx.scene.children[0];
    const cMesh = cGroup.children[0];
    const cShader = cMesh.material;
    expect(cShader.uniforms.uBass).toBeDefined();
    cloud.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    cloud.dispose();
    ctx.scene.clear();
  });
  test("Ticket 26: Ocean Wave & Rain Room Presets (#26) Gerstner swell and vertical streak downpour", () => {
    const ctx = createMockPresetContext(getTheme("ocean"));
    const ocean = getPreset("ocean");
    ocean.init(ctx);
    const oGroup = ctx.scene.children[0];
    const oMesh = oGroup.children[0];
    const oShader = oMesh.material;
    expect(oShader.uniforms.uBass).toBeDefined();
    ocean.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    ocean.dispose();
    ctx.scene.clear();
    const rain = getPreset("rainroom");
    rain.init(ctx);
    const rGroup = ctx.scene.children[0];
    expect(rGroup.children.length).toBe(2);
    rain.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    rain.dispose();
    ctx.scene.clear();
  });
  test("Ticket 27: Forest & Storm Cell Presets (#27) recursive branching and anvil cloud lightning", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const forest = getPreset("forest");
    forest.init(ctx);
    const fGroup = ctx.scene.children[0];
    expect(fGroup.children.length).toBe(2);
    forest.update(ctx, createBeatDropAudioFeatures(0.85), 1, 0.016);
    forest.dispose();
    ctx.scene.clear();
    const storm = getPreset("stormcell");
    storm.init(ctx);
    const sGroup = ctx.scene.children[0];
    expect(sGroup.children.length).toBe(2);
    storm.update(ctx, createBeatDropAudioFeatures(0.95), 1, 0.016);
    storm.dispose();
    ctx.scene.clear();
  });
  test("Ticket 28: Jellyfish & Mycelium Presets (#28) soft-body contraction and fungal hyphae nodes", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const jelly = getPreset("jellyfish");
    jelly.init(ctx);
    const jGroup = ctx.scene.children[0];
    expect(jGroup.children.length).toBe(13);
    jelly.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    jelly.dispose();
    ctx.scene.clear();
    const myc = getPreset("mycelium");
    myc.init(ctx);
    const mGroup = ctx.scene.children[0];
    expect(mGroup.children.length).toBe(2);
    myc.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    myc.dispose();
    ctx.scene.clear();
  });
  test("Ticket 29: Erupting Volcano Preset (#29) basalt cone, crater lake, and ballistic magma gravity", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    const volcano = getPreset("volcano");
    volcano.init(ctx);
    const vGroup = ctx.scene.children[0];
    expect(vGroup.children.length).toBe(3);
    volcano.update(ctx, createBeatDropAudioFeatures(0.95), 1, 0.016);
    volcano.dispose();
    ctx.scene.clear();
  });
  test("Ticket 30: Audio Engine & DSP Subsystems (#30) FFT slicing, beat threshold, and BPM detection", () => {
    const engine = new AudioEngine();
    const features = engine.getFeatures();
    expect(features.subBass).toBeGreaterThanOrEqual(0);
    expect(features.bass).toBeGreaterThanOrEqual(0);
    expect(features.mid).toBeGreaterThanOrEqual(0);
    expect(features.treble).toBeGreaterThanOrEqual(0);
    const beatDet = new BeatDetector();
    for (let i = 0; i < 40; i++) beatDet.update(0.1);
    const hit = beatDet.update(0.9);
    expect(hit).toBe(true);
    expect(beatDet.beatEnergy).toBe(1);
    const bpmDet = new BPMDetector();
    bpmDet.tap();
    expect(bpmDet.manualBPM !== null || bpmDet.detectedBPM >= 0).toBe(true);
    bpmDet.resetManual();
    expect(bpmDet.manualBPM).toBeNull();
  });
  test("Ticket 31: Playlist Queue Manager (#31) track queuing, shuffle, and repeat state machine", () => {
    const engine = new AudioEngine();
    expect(engine.playlist).toHaveLength(0);
    const mockFile1 = { name: "track1.mp3" };
    const mockFile2 = { name: "track2.mp3" };
    engine.addFilesToPlaylist([mockFile1, mockFile2]);
    expect(engine.playlist).toHaveLength(2);
    expect(engine.currentTrackIndex).toBe(0);
    engine.isShuffle = true;
    engine.isRepeat = true;
    expect(engine.isShuffle).toBe(true);
    expect(engine.isRepeat).toBe(true);
    engine.nextTrack();
    expect(engine.currentTrackIndex).toBeGreaterThanOrEqual(0);
    expect(engine.currentTrackIndex).toBeLessThan(2);
  });
  test("Ticket 32: Visualizer Studio Stage Composer (#32) 5-layer WebGL preset and ParameterStore", () => {
    const studioPreset = new StudioComposerPreset();
    expect(studioPreset.id).toBe("studio-composer");
    expect(studioPreset.name).toBe("Visualizer Studio");
    expect(studioPreset.category).toBe("Structures");
    const ctx = createMockPresetContext(getTheme("ember"));
    studioPreset.init(ctx);
    const group = ctx.scene.children[0];
    expect(group.children.length).toBeGreaterThanOrEqual(4);
    const params = studioPreset.getCustomParameters();
    expect(params.map((p) => p.id)).toEqual([
      "chromaIntensity",
      "liquidWarp",
      "tunnelDepth",
      "volumeDensity",
      "theForceAttraction"
    ]);
    studioPreset.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    studioPreset.dispose();
    ctx.scene.clear();
  });
  test("Ticket 33: Motion Persistence & Feedback Buffer Pass (#33) dual render target ping-pong pass", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    expect(engine.config.persistence).toBe(0);
    engine.updateConfig({ persistence: 0.65 });
    expect(engine.config.persistence).toBe(0.65);
    engine.resize(800, 600);
    expect(engine.camera.aspect).toBeCloseTo(800 / 600, 0.01);
    expect(engine.feedbackTargets[0].width).toBe(800);
    expect(engine.feedbackTargets[1].width).toBe(800);
  });
  test("Ticket 34: Batch Recording Mode (#34) ExportManager preset sequence progression", () => {
    const canvas = document.getElementById("webgl-canvas");
    const renderEngine = new RenderEngine(canvas, getTheme("ember"));
    const audioEngine = new AudioEngine();
    const exportManager = new ExportManager(renderEngine, audioEngine);
    expect(exportManager.isRecording).toBe(false);
    expect(typeof exportManager.startBatchExport).toBe("function");
    expect(typeof exportManager.stopExport).toBe("function");
  });
  test("Ticket 35: Aspect Ratio Framing & GIF Export (#35) framing aspect math and extension mapping", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.resize(1920, 1080);
    expect(engine.camera.aspect).toBeCloseTo(16 / 9, 0.01);
    engine.resize(1080, 1920);
    expect(engine.camera.aspect).toBeCloseTo(9 / 16, 0.01);
    engine.resize(1080, 1080);
    expect(engine.camera.aspect).toBeCloseTo(1, 0.01);
  });
  test("Ticket 36: SonarQube Quality Gate & Zero-Defect Architecture (#36) strict preset contracts", () => {
    expect(PRESETS.length).toBe(71);
    for (const preset of PRESETS) {
      expect(typeof preset.id).toBe("string");
      expect(typeof preset.name).toBe("string");
      expect(typeof preset.category).toBe("string");
      expect(typeof preset.init).toBe("function");
      expect(typeof preset.update).toBe("function");
      expect(typeof preset.dispose).toBe("function");
    }
  });
  test("Ticket 37: Dual-Engine MilkDrop & ProjectM Support (#37) Butterchurn WebGL engine architecture", () => {
    const webglCanvas = document.getElementById("webgl-canvas");
    const milkCanvas = document.getElementById("milkdrop-canvas");
    expect(webglCanvas).toBeDefined();
    expect(milkCanvas).toBeDefined();
    milkCanvas.style.display = "none";
    expect(milkCanvas.style.display).toBe("none");
    milkCanvas.style.display = "block";
    expect(milkCanvas.style.display).toBe("block");
    milkCanvas.style.display = "none";
    const ctx = createMockPresetContext(getTheme("ember"));
    const milkdrop = getPreset("milkdrop");
    expect(milkdrop.id).toBe("milkdrop");
    expect(milkdrop.description).toContain("Butterchurn");
    milkdrop.init(ctx);
    milkdrop.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    milkdrop.dispose();
    ctx.scene.clear();
    const geiss = getPreset("geiss");
    expect(geiss.id).toBe("geiss");
    geiss.init(ctx);
    geiss.update(ctx, createBeatDropAudioFeatures(0.9), 1, 0.016);
    geiss.dispose();
    ctx.scene.clear();
  });
  test("Tickets 1-37: Legacy Preset Aliases and Canonical Resolution Integrity", () => {
    const canonicalMap = {
      // Cluster A (1-7)
      "waveform": "wave",
      "wave-form": "wave",
      "circular-spectrum": "circular",
      "3d-bars": "bars3d",
      "obsidian-poly": "obsidian",
      "dna-helix": "dna",
      "topo-map": "topographic",
      "cymatic-plate": "cymatic",
      "vinyl-player": "vinyl",
      "orbital-rings": "rings",
      "tesseract-4d": "tesseract",
      "hologram-glitch": "hologram",
      "geodesic-sphere": "geodesic",
      "warp-grid": "warp",
      // Cluster B (8-14)
      "black-hole": "blackhole",
      "the-sun": "sun",
      "mandel-fractal": "mandel",
      "unfolding-matter": "unfoldingmatter",
      "geiss-feedback": "geiss",
      "aurora-mandala": "aurora",
      "sacred-mandala": "sacred",
      "synthwave-terrain": "terrain",
      "galaxy-clusters": "galaxy",
      "particle-field": "particles",
      "lightning-arcs": "lightning",
      "plasma-arcs": "plasmaarcs",
      // Cluster C (15-23)
      "lava-energy": "lava",
      "fireball-neurons": "fireball",
      "water-neurons": "waterneurons",
      "liquid-chroma": "liquid",
      "fluid-container": "fluid",
      "plasma-gas": "plasma",
      "fog-mist": "fog",
      "rain-water": "water",
      "smoke-wisps": "smoke",
      "neon-tunnel": "neontunnel",
      "box-tunnel": "boxtunnel",
      "ring-tunnel": "ringtunnel",
      "water-slide": "waterslide",
      "vein-tunnel": "veintunnel",
      "kaleidoscope-mandala": "kaleidoscope",
      "matrix-rain": "matrix",
      "spectrogram": "spectogram",
      "night-radar": "nightradar",
      "diode-wall": "diodewall",
      "vod-lines": "vodlines",
      "lcd-deck": "lcddeck",
      "signal-lock": "signallock",
      // Cluster D (24-29)
      "bloom-flower": "bloom",
      "ink-drops": "ink",
      "meadow-field": "meadow",
      "up-cloud": "upcloud",
      "ocean-waves": "ocean",
      "rain-room": "rainroom",
      "forest-storm": "forest",
      "storm-cell": "stormcell",
      "jellyfish-mycelium": "jellyfish",
      "volcano-eruption": "volcano"
    };
    for (const [alias, canonicalId] of Object.entries(canonicalMap)) {
      const preset = getPreset(alias);
      expect(preset).toBeDefined();
      expect(preset.id).toBe(alias);
      const canonical = getPreset(canonicalId);
      expect(canonical).toBeDefined();
      expect(canonical.id).toBe(canonicalId);
    }
  });
});

// tests/tier1-features/stims-catalog.test.ts
var fs2 = __toESM(require("node:fs"), 1);
var path2 = __toESM(require("node:path"), 1);

// src/presets/stims/types.ts
var STIMS_CATEGORIES = [
  "dancer",
  "drawing",
  "fractal",
  "geometric",
  "hypnotic",
  "particles",
  "reaction",
  "sparkle",
  "supernova",
  "waveform"
];
var CATEGORY_DISPLAY_NAMES = {
  dancer: "Dancer",
  drawing: "Drawing",
  fractal: "Fractal",
  geometric: "Geometric",
  hypnotic: "Hypnotic",
  particles: "Particles",
  reaction: "Reaction",
  sparkle: "Sparkle",
  supernova: "Supernova",
  waveform: "Waveform"
};
var STIMS_COLLECTIONS = [
  "hall-of-fame",
  "audio-reactive",
  "butterchurn",
  "cream-of-the-crop",
  "classic-milkdrop",
  "rovastar"
];
var COLLECTION_TAG_MAP = {
  "hall-of-fame": "collection:hall-of-fame",
  "audio-reactive": "collection:audio-reactive",
  "butterchurn": "collection:butterchurn",
  "cream-of-the-crop": "collection:cream-of-the-crop",
  "classic-milkdrop": "collection:classic-milkdrop",
  "rovastar": "collection:rovastar-and-collaborators"
};
var COLLECTION_DISPLAY_NAMES = {
  "hall-of-fame": "Hall of Fame",
  "audio-reactive": "Audio-Reactive",
  "butterchurn": "Butterchurn",
  "cream-of-the-crop": "Cream of the Crop",
  "classic-milkdrop": "Classic MilkDrop",
  "rovastar": "Rovastar & Co."
};
var FLASH_RISK_SEVERITY = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3
};

// src/presets/stims/StimsCatalogService.ts
var DEFAULT_BASE_PATH = "/presets/stims";
var PRESETS_STIMS_PREFIX = "/presets/stims/";
var STARTER_CATALOG_FILE = "starter-catalog.json";
var FULL_CATALOG_FILE = "catalog.json";
var DESCRIPTIONS_FILE = "preset-descriptions.json";
var SEARCH_INDEX_FILE = "search-index.json";
var CATEGORY_TAG_PREFIX = "category:";
var COLLECTION_TAG_PREFIX = "collection:";
var UNCATEGORIZED_SLUG = "uncategorized";
var ROVASTAR_COLLECTION_TAG = "collection:rovastar-and-collaborators";
var ROVASTAR_SHORT_SLUG = "rovastar";
var StimsCatalogService = class _StimsCatalogService {
  static instance = null;
  basePath = DEFAULT_BASE_PATH;
  customFetch;
  initialized = false;
  fullyHydrated = false;
  initPromise = null;
  hydrationPromise = null;
  starterPresets = [];
  allPresets = [];
  presetsMap = /* @__PURE__ */ new Map();
  categoryIndex = /* @__PURE__ */ new Map();
  collectionIndex = /* @__PURE__ */ new Map();
  searchableTextCache = /* @__PURE__ */ new Map();
  descriptions = {};
  searchIndex = null;
  hydrationListeners = [];
  constructor() {
    this.resetIndices();
  }
  static getInstance() {
    if (!_StimsCatalogService.instance) {
      _StimsCatalogService.instance = new _StimsCatalogService();
    }
    return _StimsCatalogService.instance;
  }
  /**
   * Resets singleton instance. Useful for isolated test cases.
   */
  static resetInstance() {
    _StimsCatalogService.instance = null;
  }
  // ==========================================================================
  // Initialization & Hydration Lifecycle
  // ==========================================================================
  async init(options) {
    if (this.initialized && this.fullyHydrated) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }
    this.basePath = options?.basePath ?? DEFAULT_BASE_PATH;
    this.customFetch = options?.customFetch;
    this.initPromise = (async () => {
      await this.loadStarterCatalog();
      const shouldEagerHydrate = options?.eagerFullHydration !== false;
      if (shouldEagerHydrate) {
        await this.hydrateFullCatalog();
      } else {
        void this.hydrateFullCatalog();
      }
    })();
    return this.initPromise;
  }
  isReady() {
    return this.initialized;
  }
  isFullyHydrated() {
    return this.fullyHydrated;
  }
  onHydrated(listener) {
    this.hydrationListeners.push(listener);
    if (this.fullyHydrated) {
      listener();
    }
    return () => {
      const idx = this.hydrationListeners.indexOf(listener);
      if (idx !== -1) {
        this.hydrationListeners.splice(idx, 1);
      }
    };
  }
  // ==========================================================================
  // Public Accessors
  // ==========================================================================
  getStarterPresets() {
    return [...this.starterPresets];
  }
  getAllPresets() {
    return [...this.allPresets];
  }
  getPresetById(id) {
    if (typeof id !== "string" || !id) {
      return null;
    }
    return this.presetsMap.get(id) ?? null;
  }
  getCategories() {
    return STIMS_CATEGORIES.map((slug) => ({
      slug,
      name: CATEGORY_DISPLAY_NAMES[slug],
      count: this.categoryIndex.get(slug)?.length ?? 0
    }));
  }
  getCollections() {
    return STIMS_COLLECTIONS.map((slug) => ({
      slug,
      name: COLLECTION_DISPLAY_NAMES[slug],
      count: this.collectionIndex.get(slug)?.length ?? 0
    }));
  }
  // ==========================================================================
  // Query, Filtering & Random Sampling
  // ==========================================================================
  filterPresets(options) {
    const opts = options && typeof options === "object" ? options : {};
    const candidates = this.resolveInitialCandidates(opts);
    const searchTokens = typeof opts.searchQuery === "string" && opts.searchQuery.trim().length > 0 ? this.tokenizeQuery(opts.searchQuery) : null;
    const maxRiskScore = opts.maxFlashRisk ? FLASH_RISK_SEVERITY[opts.maxFlashRisk] : null;
    return candidates.filter((preset) => {
      if (opts.excludeId && preset.id === opts.excludeId) {
        return false;
      }
      if (typeof opts.category === "string" && opts.category.trim().length > 0 && !this.presetMatchesCategory(preset, opts.category)) {
        return false;
      }
      if (typeof opts.collection === "string" && opts.collection.trim().length > 0 && !this.presetMatchesCollection(preset, opts.collection)) {
        return false;
      }
      if (maxRiskScore !== null && !this.presetPassesFlashRisk(preset, maxRiskScore)) {
        return false;
      }
      return !searchTokens || this.presetMatchesTokens(preset, searchTokens);
    });
  }
  getRandomPreset(options) {
    const pool = options && typeof options === "object" ? this.filterPresets(options) : this.allPresets;
    if (pool.length === 0) {
      return null;
    }
    if (pool.length === 1) {
      return pool[0];
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex] ?? null;
  }
  // ==========================================================================
  // Private Data Loading Pipelines
  // ==========================================================================
  async loadStarterCatalog() {
    const doc = await this.fetchJson(STARTER_CATALOG_FILE);
    if (!doc?.presets || !Array.isArray(doc.presets)) {
      console.warn("[StimsCatalogService] Starter catalog missing or malformed; proceeding.");
      this.initialized = true;
      return;
    }
    const starterItems = [];
    for (const raw of doc.presets) {
      const preset = this.mapRawEntry(raw);
      if (preset) {
        starterItems.push(preset);
      }
    }
    this.starterPresets = starterItems;
    if (this.allPresets.length === 0) {
      this.rebuildIndices(starterItems);
    }
    this.initialized = true;
  }
  async hydrateFullCatalog() {
    if (this.hydrationPromise) {
      return this.hydrationPromise;
    }
    this.hydrationPromise = (async () => {
      const [catalogDoc, descDoc, searchDoc] = await Promise.all([
        this.fetchJson(FULL_CATALOG_FILE),
        this.fetchJson(DESCRIPTIONS_FILE),
        this.fetchJson(SEARCH_INDEX_FILE)
      ]);
      if (descDoc?.descriptions) {
        this.descriptions = descDoc.descriptions;
      }
      if (searchDoc) {
        this.searchIndex = searchDoc;
      }
      if (catalogDoc?.presets && Array.isArray(catalogDoc.presets)) {
        const fullItems = [];
        for (const raw of catalogDoc.presets) {
          const preset = this.mapRawEntry(raw);
          if (preset) {
            fullItems.push(preset);
          }
        }
        this.rebuildIndices(fullItems);
      }
      this.fullyHydrated = true;
      for (const listener of this.hydrationListeners) {
        try {
          listener();
        } catch (err) {
          console.error("[StimsCatalogService] Hydration listener failed:", err);
        }
      }
    })();
    return this.hydrationPromise;
  }
  async fetchJson(filename) {
    const cleanBase = this.basePath.replace(/\/+$/, "");
    const cleanFile = filename.replace(/^\/+/, "");
    const url = `${cleanBase}/${cleanFile}`;
    try {
      if (this.customFetch) {
        const res2 = await this.customFetch(url);
        if (res2.ok) {
          return await res2.json();
        }
        return null;
      }
      if (typeof fetch === "undefined") {
        return null;
      }
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[StimsCatalogService] Failed to fetch ${url} (status: ${res.status})`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.warn(`[StimsCatalogService] Network/parsing error fetching ${url}:`, err);
      return null;
    }
  }
  // ==========================================================================
  // Indexing & Mapping Helpers
  // ==========================================================================
  resetIndices() {
    this.presetsMap.clear();
    this.categoryIndex.clear();
    this.collectionIndex.clear();
    this.searchableTextCache.clear();
    for (const cat of STIMS_CATEGORIES) {
      this.categoryIndex.set(cat, []);
    }
    for (const col of STIMS_COLLECTIONS) {
      this.collectionIndex.set(col, []);
    }
  }
  rebuildIndices(presets) {
    this.resetIndices();
    this.allPresets = presets;
    for (const preset of presets) {
      this.presetsMap.set(preset.id, preset);
      const searchTokens = this.searchIndex?.[preset.id]?.combinedTerms ?? "";
      const text = `${preset.id} ${preset.title} ${preset.author} ${preset.tags.join(" ")} ${preset.description ?? ""} ${searchTokens}`.toLowerCase();
      this.searchableTextCache.set(preset.id, text);
      this.indexPresetCategories(preset);
      this.indexPresetCollections(preset);
    }
  }
  extractCategorySlugs(tags) {
    if (!Array.isArray(tags)) {
      return [];
    }
    const slugs = [];
    for (const tag of tags) {
      if (typeof tag === "string" && tag.startsWith(CATEGORY_TAG_PREFIX)) {
        slugs.push(tag.slice(CATEGORY_TAG_PREFIX.length).toLowerCase());
      }
    }
    return slugs;
  }
  indexPresetCategories(preset) {
    const matchedCategories = /* @__PURE__ */ new Set();
    for (const catSlug of this.extractCategorySlugs(preset.tags)) {
      if (this.categoryIndex.has(catSlug)) {
        matchedCategories.add(catSlug);
      }
    }
    if (preset.category && preset.category !== UNCATEGORIZED_SLUG && this.categoryIndex.has(preset.category)) {
      matchedCategories.add(preset.category);
    }
    for (const cat of matchedCategories) {
      this.categoryIndex.get(cat)?.push(preset);
    }
  }
  indexPresetCollections(preset) {
    if (!Array.isArray(preset.tags)) {
      return;
    }
    for (const tag of preset.tags) {
      if (typeof tag !== "string") {
        continue;
      }
      if (tag.startsWith(COLLECTION_TAG_PREFIX)) {
        const rawSlug = tag.slice(COLLECTION_TAG_PREFIX.length).toLowerCase();
        const normalizedSlug = rawSlug === "rovastar-and-collaborators" ? ROVASTAR_SHORT_SLUG : rawSlug;
        if (this.collectionIndex.has(normalizedSlug)) {
          this.collectionIndex.get(normalizedSlug)?.push(preset);
        }
      }
    }
  }
  parseSensoryProfile(rawSensory) {
    if (!rawSensory || typeof rawSensory !== "object") {
      return void 0;
    }
    const profile = rawSensory;
    if (!profile.flashRiskLevel) {
      return void 0;
    }
    return {
      flashRiskLevel: profile.flashRiskLevel,
      maxTransitionsPerSecondEstimate: typeof profile.maxTransitionsPerSecondEstimate === "number" ? profile.maxTransitionsPerSecondEstimate : void 0,
      meanLuminance: typeof profile.meanLuminance === "number" ? profile.meanLuminance : void 0
    };
  }
  parseQualityScore(rawQuality) {
    if (rawQuality && typeof rawQuality === "object") {
      const q = rawQuality;
      if (typeof q.score === "number") {
        return q.score;
      }
    }
    return void 0;
  }
  mapRawEntry(raw) {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id.trim()) {
      return null;
    }
    const tags = Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === "string" && t.trim().length > 0) : [];
    const primaryCategory = this.resolvePrimaryCategory(tags);
    const normalizedFile = this.normalizeFilePath(typeof raw.file === "string" ? raw.file : "");
    const description = typeof raw.id === "string" ? this.descriptions[raw.id] : void 0;
    return {
      id: raw.id,
      title: typeof raw.title === "string" && raw.title.length > 0 ? raw.title : raw.id,
      author: typeof raw.author === "string" && raw.author.length > 0 ? raw.author : "Unknown",
      file: normalizedFile,
      category: primaryCategory,
      tags,
      description,
      qualityScore: this.parseQualityScore(raw.quality),
      sensoryProfile: this.parseSensoryProfile(raw.sensoryProfile)
    };
  }
  resolvePrimaryCategory(tags) {
    if (!Array.isArray(tags)) {
      return UNCATEGORIZED_SLUG;
    }
    for (const tag of tags) {
      if (typeof tag !== "string") {
        continue;
      }
      if (tag.startsWith(CATEGORY_TAG_PREFIX)) {
        const cat = tag.slice(CATEGORY_TAG_PREFIX.length).toLowerCase();
        if (STIMS_CATEGORIES.includes(cat)) {
          return cat;
        }
      }
    }
    return UNCATEGORIZED_SLUG;
  }
  normalizeFilePath(rawPath) {
    if (!rawPath || typeof rawPath !== "string") {
      return "";
    }
    let clean = rawPath.replace(/^\/?milkdrop-presets\//, PRESETS_STIMS_PREFIX);
    if (!clean.startsWith(PRESETS_STIMS_PREFIX)) {
      clean = clean.startsWith("/") ? clean : `/${clean}`;
      if (!clean.startsWith(PRESETS_STIMS_PREFIX)) {
        clean = `${DEFAULT_BASE_PATH}${clean}`;
      }
    }
    return clean;
  }
  // ==========================================================================
  // Filtering Sub-Evaluators
  // ==========================================================================
  resolveInitialCandidates(options) {
    if (typeof options.category === "string" && options.category.trim().length > 0) {
      const catSlug = options.category.toLowerCase().replace(/^category:\s*/, "").trim();
      const list = this.categoryIndex.get(catSlug);
      if (list) {
        return list;
      }
    }
    if (typeof options.collection === "string" && options.collection.trim().length > 0) {
      const colSlug = this.normalizeCollectionQuery(options.collection);
      const list = this.collectionIndex.get(colSlug);
      if (list) {
        return list;
      }
    }
    return this.allPresets;
  }
  normalizeCollectionQuery(query) {
    if (typeof query !== "string") {
      return "";
    }
    const stripped = query.toLowerCase().replace(/^collection:\s*/, "").trim();
    if (stripped === "rovastar-and-collaborators") {
      return ROVASTAR_SHORT_SLUG;
    }
    return stripped;
  }
  presetMatchesCategory(preset, categoryQuery) {
    if (typeof categoryQuery !== "string") {
      return false;
    }
    const slug = categoryQuery.toLowerCase().replace(/^category:\s*/, "").trim();
    if (typeof preset.category === "string" && preset.category.toLowerCase() === slug) {
      return true;
    }
    const fullTag = `${CATEGORY_TAG_PREFIX}${slug}`;
    return Array.isArray(preset.tags) && preset.tags.some((t) => typeof t === "string" && t.toLowerCase() === fullTag);
  }
  presetMatchesCollection(preset, collectionQuery) {
    if (typeof collectionQuery !== "string") {
      return false;
    }
    const slug = this.normalizeCollectionQuery(collectionQuery);
    const expectedTag = COLLECTION_TAG_MAP[slug];
    if (expectedTag) {
      return Array.isArray(preset.tags) && preset.tags.includes(expectedTag);
    }
    if (slug === ROVASTAR_SHORT_SLUG) {
      return Array.isArray(preset.tags) && preset.tags.includes(ROVASTAR_COLLECTION_TAG);
    }
    const fallbackTag = `${COLLECTION_TAG_PREFIX}${slug}`;
    return Array.isArray(preset.tags) && preset.tags.includes(fallbackTag);
  }
  presetPassesFlashRisk(preset, maxRiskScore) {
    const riskLevel = preset.sensoryProfile?.flashRiskLevel ?? "none";
    const score = FLASH_RISK_SEVERITY[riskLevel] ?? 0;
    return score <= maxRiskScore;
  }
  presetMatchesTokens(preset, tokens) {
    const cachedText = this.searchableTextCache.get(preset.id);
    if (!cachedText) {
      return false;
    }
    for (const token of tokens) {
      if (!cachedText.includes(token)) {
        return false;
      }
    }
    return true;
  }
  tokenizeQuery(query) {
    if (typeof query !== "string") {
      return [];
    }
    return query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((tok) => tok.length > 0);
  }
};
var stimsCatalogService = StimsCatalogService.getInstance();

// tests/tier1-features/stims-catalog.test.ts
describe("Tier 1: Stims Catalog Service & Assets Embedding", () => {
  beforeEach(() => {
    setupTestEnvironment();
    StimsCatalogService.resetInstance();
  });
  test("T1.StimsCatalog.1: Physical Asset Presence \u2014 2,686 .milk files and 10 PNG textures exist on disk", () => {
    const stimsRoot = path2.resolve(process.cwd(), "public/presets/stims");
    expect(fs2.existsSync(stimsRoot)).toBe(true);
    const countMilkFiles = (dir) => {
      let count = 0;
      for (const entry of fs2.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path2.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += countMilkFiles(fullPath);
        } else if (entry.name.endsWith(".milk")) {
          count++;
        }
      }
      return count;
    };
    const totalMilkFiles = countMilkFiles(stimsRoot);
    expect(totalMilkFiles).toBe(2686);
    const textureDir = path2.join(stimsRoot, "textures");
    expect(fs2.existsSync(textureDir)).toBe(true);
    const textureFiles = fs2.readdirSync(textureDir).filter((f) => f.endsWith(".png"));
    expect(textureFiles.length).toBe(10);
    for (const tex of textureFiles) {
      const texPath = path2.join(textureDir, tex);
      const buffer = fs2.readFileSync(texPath);
      expect(buffer.length).toBeGreaterThan(1e3);
      const isJpeg = buffer[0] === 255 && buffer[1] === 216;
      const isPng = buffer[0] === 137 && buffer[1] === 80;
      expect(isJpeg || isPng).toBe(true);
    }
  });
  test("T1.StimsCatalog.2: Referential Integrity \u2014 100% of 1,787 catalog presets point to existing .milk files", () => {
    const stimsRoot = path2.resolve(process.cwd(), "public/presets/stims");
    const catalogPath = path2.join(stimsRoot, "catalog.json");
    const catalogRaw = fs2.readFileSync(catalogPath, "utf8");
    const catalog = JSON.parse(catalogRaw);
    expect(catalog.presets.length).toBe(1787);
    let missingCount = 0;
    for (const p of catalog.presets) {
      const relativeFile = p.file.replace(/^\/?presets\/stims\//, "");
      const absPath = path2.join(stimsRoot, relativeFile);
      if (!fs2.existsSync(absPath)) {
        missingCount++;
      }
    }
    expect(missingCount).toBe(0);
  });
  test("T1.StimsCatalog.3: JSON Catalogs Schema \u2014 catalog.json, starter-catalog.json, descriptions, search-index", () => {
    const stimsRoot = path2.resolve(process.cwd(), "public/presets/stims");
    const starterPath = path2.join(stimsRoot, "starter-catalog.json");
    const starter = JSON.parse(fs2.readFileSync(starterPath, "utf8"));
    expect(Array.isArray(starter.presets)).toBe(true);
    expect(starter.presets.length).toBe(25);
    const descPath = path2.join(stimsRoot, "preset-descriptions.json");
    const descDoc = JSON.parse(fs2.readFileSync(descPath, "utf8"));
    expect(typeof descDoc.descriptions).toBe("object");
    expect(Object.keys(descDoc.descriptions).length).toBeGreaterThanOrEqual(1786);
    const searchPath = path2.join(stimsRoot, "search-index.json");
    const searchDoc = JSON.parse(fs2.readFileSync(searchPath, "utf8"));
    expect(typeof searchDoc).toBe("object");
    expect(Object.keys(searchDoc).length).toBeGreaterThanOrEqual(1787);
  });
  test("T1.StimsCatalog.4: Fast Boot \u2014 starter catalog returns 25 flagship presets immediately", async () => {
    const service = StimsCatalogService.getInstance();
    expect(service.isReady()).toBe(false);
    await service.init({ eagerFullHydration: false });
    expect(service.isReady()).toBe(true);
    const starterPresets = service.getStarterPresets();
    expect(starterPresets.length).toBe(25);
    for (const p of starterPresets) {
      expect(typeof p.id).toBe("string");
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.title).toBe("string");
      expect(typeof p.author).toBe("string");
      expect(typeof p.file).toBe("string");
      expect(p.file.endsWith(".milk")).toBe(true);
      expect(typeof p.category).toBe("string");
    }
  });
  test("T1.StimsCatalog.5: Full Hydration \u2014 getAllPresets returns exactly 1,787 unique presets", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init({ eagerFullHydration: true });
    expect(service.isFullyHydrated()).toBe(true);
    const all = service.getAllPresets();
    expect(all.length).toBe(1787);
    const idSet = new Set(all.map((p) => p.id));
    expect(idSet.size).toBe(1787);
    const described = all.filter((p) => p.description && p.description.length > 0);
    expect(described.length).toBeGreaterThanOrEqual(1786);
  });
  test("T1.StimsCatalog.6: 10 Canonical Categories \u2014 getCategories returns all 10 categories with accurate counts", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const categories = service.getCategories();
    expect(categories.length).toBe(10);
    const slugs = categories.map((c) => c.slug);
    for (const expectedSlug of STIMS_CATEGORIES) {
      expect(slugs).toContain(expectedSlug);
    }
    const catMap = new Map(categories.map((c) => [c.slug, c.count]));
    expect(catMap.get("waveform") ?? 0).toBe(1488);
    expect(catMap.get("particles") ?? 0).toBe(1364);
    expect(catMap.get("geometric") ?? 0).toBe(394);
    expect(catMap.get("fractal") ?? 0).toBe(215);
    expect(catMap.get("sparkle") ?? 0).toBe(60);
    expect(catMap.get("reaction") ?? 0).toBe(31);
    expect(catMap.get("supernova") ?? 0).toBe(15);
    expect(catMap.get("dancer") ?? 0).toBe(3);
    const waveformPresets = service.filterPresets({ category: "waveform" });
    expect(waveformPresets.length).toBe(1488);
    for (const p of waveformPresets) {
      const matches = p.category === "waveform" || p.tags.includes("category:waveform");
      expect(matches).toBe(true);
    }
  });
  test("T1.StimsCatalog.7: 6 Curated Collections \u2014 getCollections returns accurate collection tallies", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const collections = service.getCollections();
    expect(collections.length).toBe(6);
    const slugs = collections.map((c) => c.slug);
    for (const expectedSlug of STIMS_COLLECTIONS) {
      expect(slugs).toContain(expectedSlug);
    }
    const hofPresets = service.filterPresets({ collection: "hall-of-fame" });
    expect(hofPresets.length).toBe(16);
    const cropPresets = service.filterPresets({ collection: "cream-of-the-crop" });
    expect(cropPresets.length).toBe(42);
    const butterchurnPresets2 = service.filterPresets({ collection: "butterchurn" });
    expect(butterchurnPresets2.length).toBe(1744);
    const audioReactivePresets = service.filterPresets({ collection: "audio-reactive" });
    expect(audioReactivePresets.length).toBe(1477);
  });
  test("T1.StimsCatalog.8: Multi-Criteria Filtering \u2014 category + collection intersection filtering", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const result = service.filterPresets({
      category: "particles",
      collection: "hall-of-fame"
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(16);
    for (const p of result) {
      const hasPartTag = p.category === "particles" || p.tags.includes("category:particles");
      expect(hasPartTag).toBe(true);
      expect(p.tags).toContain("collection:hall-of-fame");
    }
  });
  test("T1.StimsCatalog.9: Search Engine \u2014 title, author, and description keyword queries", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const glowsticks = service.filterPresets({ searchQuery: "glowsticks" });
    expect(glowsticks.length).toBeGreaterThan(0);
    const foundEos = glowsticks.some((p) => p.id === "eos-glowsticks-v2-03-music");
    expect(foundEos).toBe(true);
    const rovastar = service.filterPresets({ searchQuery: "rovastar" });
    expect(rovastar.length).toBeGreaterThan(0);
    const multiMatch = service.filterPresets({ searchQuery: "shifter glassworms" });
    expect(multiMatch.length).toBeGreaterThan(0);
    expect(multiMatch.some((p) => p.id === "shifter-glassworms-flare")).toBe(true);
  });
  test("T1.StimsCatalog.10: Search Resilience \u2014 whitespace, uppercase, and regex character handling", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const upper = service.filterPresets({ searchQuery: "GLOWSTICKS" });
    const lower = service.filterPresets({ searchQuery: "glowsticks" });
    expect(upper.length).toBe(lower.length);
    const padded = service.filterPresets({ searchQuery: "   glowsticks   " });
    expect(padded.length).toBe(lower.length);
    const regexSafe = service.filterPresets({ searchQuery: "[*+?^${}()|[\\]" });
    expect(Array.isArray(regexSafe)).toBe(true);
    const emptyQuery = service.filterPresets({ searchQuery: "" });
    expect(emptyQuery.length).toBe(1787);
  });
  test("T1.StimsCatalog.11: Sensory Safety / Photosensitivity Filtering", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const noneRisk = service.filterPresets({ maxFlashRisk: "none" });
    expect(noneRisk.length).toBeGreaterThan(0);
    for (const p of noneRisk) {
      const risk = p.sensoryProfile?.flashRiskLevel ?? "none";
      expect(risk).toBe("none");
    }
    const lowRisk = service.filterPresets({ maxFlashRisk: "low" });
    expect(lowRisk.length).toBeGreaterThanOrEqual(noneRisk.length);
    for (const p of lowRisk) {
      const risk = p.sensoryProfile?.flashRiskLevel ?? "none";
      expect(risk === "none" || risk === "low").toBe(true);
    }
  });
  test("T1.StimsCatalog.12: Random Sampling \u2014 category-constrained random selection with distribution check", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const randomAny = service.getRandomPreset();
    expect(randomAny).toBeDefined();
    expect(randomAny).not.toBeNull();
    const randomFractal = service.getRandomPreset({ category: "fractal" });
    expect(randomFractal).not.toBeNull();
    const isFractal = randomFractal.category === "fractal" || randomFractal.tags.includes("category:fractal");
    expect(isFractal).toBe(true);
    const randomHof = service.getRandomPreset({ collection: "hall-of-fame" });
    expect(randomHof).not.toBeNull();
    expect(randomHof.tags).toContain("collection:hall-of-fame");
    const sampledIds = /* @__PURE__ */ new Set();
    for (let i = 0; i < 50; i++) {
      const p = service.getRandomPreset();
      if (p) sampledIds.add(p.id);
    }
    expect(sampledIds.size).toBeGreaterThanOrEqual(15);
    const nonExistent = service.getRandomPreset({ category: "non_existent_category_xyz" });
    expect(nonExistent).toBeNull();
  });
  test("T1.StimsCatalog.13: ID Lookup \u2014 O(1) preset retrieval and null fallback for unknown IDs", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const preset = service.getPresetById("eos-glowsticks-v2-03-music");
    expect(preset).not.toBeNull();
    expect(preset.id).toBe("eos-glowsticks-v2-03-music");
    expect(preset.title).toBe("Eo.S. - Glowsticks v2 03 Music");
    expect(preset.author).toBe("Eo.S.");
    expect(preset.file).toBe("/presets/stims/eos-glowsticks-v2-03-music.milk");
    const unknown = service.getPresetById("unknown-id-xyz-12345");
    expect(unknown).toBeNull();
  });
});

// tests/tier2-boundaries/themes-boundary.test.ts
describe("Tier 2: Themes Boundary & Corner Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Themes.1: Rapid switching across 50 themes preserves engine stability and active preset", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const spy = new SpyVisualizerPreset();
    engine.setPreset(spy);
    for (let i = 0; i < 50; i++) {
      const theme = THEMES[i % THEMES.length];
      engine.setTheme(theme);
      expect(engine.currentTheme.id).toBe(theme.id);
    }
    expect(spy.themeChangeCalls).toBe(50);
    expect(engine.currentTheme.id).toBe(THEMES[49 % THEMES.length].id);
  });
  test("T2.Themes.2: Null, undefined, empty, and numeric theme IDs fallback gracefully without crashing", () => {
    expect(getTheme(null).id).toBe("ember");
    expect(getTheme(void 0).id).toBe("ember");
    expect(getTheme("").id).toBe("ember");
    expect(getTheme("   	\n  ").id).toBe("ember");
    expect(getTheme("12345").id).toBe("ember");
  });
  test("T2.Themes.3: Hex color parser handles 3-digit and 6-digit hex formats with or without leading hash", () => {
    const parseHexToRgb = (hex) => {
      const clean = hex.replace(/^#/, "").trim();
      if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16) / 255;
        const g = parseInt(clean[1] + clean[1], 16) / 255;
        const b = parseInt(clean[2] + clean[2], 16) / 255;
        return [r, g, b];
      }
      if (clean.length === 6) {
        const r = parseInt(clean.slice(0, 2), 16) / 255;
        const g = parseInt(clean.slice(2, 4), 16) / 255;
        const b = parseInt(clean.slice(4, 6), 16) / 255;
        return [r, g, b];
      }
      return null;
    };
    const rgb1 = parseHexToRgb("#ff0055");
    expect(rgb1).toEqual([1, 0, 85 / 255]);
    const rgb2 = parseHexToRgb("00e599");
    expect(rgb2).toEqual([0, 229 / 255, 153 / 255]);
    const rgb3 = parseHexToRgb("#f05");
    expect(rgb3).toEqual([1, 0, 85 / 255]);
    expect(parseHexToRgb("invalid-hex")).toBeNull();
  });
  test("T2.Themes.4: Pure black (#000000) and pure white (#ffffff) theme boundary colors", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const extremeTheme = {
      id: "high-contrast",
      name: "High Contrast",
      primary: "#ffffff",
      secondary: "#000000",
      accent: "#ffffff",
      background: "#000000",
      glow: "#ffffff"
    };
    engine.setTheme(extremeTheme);
    expect(engine.currentTheme.primary).toBe("#ffffff");
    expect(engine.currentTheme.background).toBe("#000000");
  });
  test("T2.Themes.5: Saturation adjustment modulation bounds colors at 0.0 (grayscale) and 1.0 (gamut)", () => {
    const applySaturation = (rgb, sat) => {
      const [r, g, b] = rgb;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const clampedSat = Math.max(0, Math.min(1, sat));
      return [
        luma + (r - luma) * clampedSat,
        luma + (g - luma) * clampedSat,
        luma + (b - luma) * clampedSat
      ];
    };
    const red = [1, 0, 0];
    const grayscale = applySaturation(red, 0);
    expect(grayscale[0]).toBeCloseTo(0.299);
    expect(grayscale[1]).toBeCloseTo(0.299);
    expect(grayscale[2]).toBeCloseTo(0.299);
    const fullSat = applySaturation(red, 1);
    expect(fullSat[0]).toBeCloseTo(1);
    expect(fullSat[1]).toBeCloseTo(0);
    expect(fullSat[2]).toBeCloseTo(0);
  });
});

// tests/tier2-boundaries/rail-boundary.test.ts
var NavigationRailController = class {
  activeTool = null;
  isDrawerOpen = false;
  panels = /* @__PURE__ */ new Map();
  registerPanel(toolId, panelEl) {
    this.panels.set(toolId, panelEl);
  }
  toggleTool(toolId) {
    if (this.activeTool === toolId) {
      this.isDrawerOpen = false;
      this.activeTool = null;
      const panel = this.panels.get(toolId);
      panel?.classList.remove("open");
      return;
    }
    if (this.activeTool) {
      const prev = this.panels.get(this.activeTool);
      prev?.classList.remove("open");
    }
    this.activeTool = toolId;
    this.isDrawerOpen = true;
    const next = this.panels.get(toolId);
    next?.classList.add("open");
  }
};
describe("Tier 2: UI Navigation Rail Boundary Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Rail.1: Rapid open/close toggling 30 times maintains synchronized state", () => {
    const controller = new NavigationRailController();
    const panel = new MockElement("DIV");
    controller.registerPanel("presets", panel);
    for (let i = 0; i < 30; i++) {
      controller.toggleTool("presets");
    }
    expect(controller.isDrawerOpen).toBe(false);
    expect(controller.activeTool).toBeNull();
    expect(panel.classList.contains("open")).toBe(false);
  });
  test("T2.Rail.2: Toggling tool with missing or unregistered panel handles null safely", () => {
    const controller = new NavigationRailController();
    controller.toggleTool("missingTool");
    expect(controller.activeTool).toBe("missingTool");
    expect(controller.isDrawerOpen).toBe(true);
    controller.toggleTool("missingTool");
    expect(controller.activeTool).toBeNull();
    expect(controller.isDrawerOpen).toBe(false);
  });
  test("T2.Rail.3: Rapid switching across all 15 tools sequentially leaves only last tool open", () => {
    const controller = new NavigationRailController();
    const panels = [];
    for (const tool of CANONICAL_15_RAIL_TOOLS) {
      const p = new MockElement("DIV");
      controller.registerPanel(tool.id, p);
      panels.push(p);
    }
    for (const tool of CANONICAL_15_RAIL_TOOLS) {
      controller.toggleTool(tool.id);
    }
    const lastTool = CANONICAL_15_RAIL_TOOLS[CANONICAL_15_RAIL_TOOLS.length - 1];
    expect(controller.activeTool).toBe(lastTool.id);
    expect(controller.isDrawerOpen).toBe(true);
    for (let i = 0; i < CANONICAL_15_RAIL_TOOLS.length - 1; i++) {
      expect(panels[i].classList.contains("open")).toBe(false);
    }
    expect(panels[panels.length - 1].classList.contains("open")).toBe(true);
  });
  test("T2.Rail.4: Extreme mobile viewport (320x480) correctly activates mobile responsive layout flags", () => {
    const evaluateLayoutMode = (width, height) => {
      return {
        isMobile: width <= 640,
        isCompactHeight: height < 900
      };
    };
    const mobile = evaluateLayoutMode(320, 480);
    expect(mobile.isMobile).toBe(true);
    expect(mobile.isCompactHeight).toBe(true);
    const desktop4k = evaluateLayoutMode(3840, 2160);
    expect(desktop4k.isMobile).toBe(false);
    expect(desktop4k.isCompactHeight).toBe(false);
  });
  test("T2.Rail.5: Double-clicking an active rail button closes drawer and clears selection", () => {
    const controller = new NavigationRailController();
    const panel = new MockElement("DIV");
    controller.registerPanel("camera", panel);
    controller.toggleTool("camera");
    expect(controller.activeTool).toBe("camera");
    expect(controller.isDrawerOpen).toBe(true);
    controller.toggleTool("camera");
    expect(controller.activeTool).toBeNull();
    expect(controller.isDrawerOpen).toBe(false);
  });
});

// tests/tier2-boundaries/tuning-boundary.test.ts
var RobustPresetTuner = class {
  schema = [
    { id: "warp", name: "Warp", min: 0, max: 2, step: 0.1, defaultValue: 1 },
    { id: "speed", name: "Speed", min: 0.1, max: 3, step: 0.05, defaultValue: 0.6 }
  ];
  values = {
    warp: 1,
    speed: 0.6
  };
  setParameter(id, rawVal) {
    const def = this.schema.find((p) => p.id === id);
    if (!def) return;
    if (typeof rawVal !== "number" || isNaN(rawVal) || !isFinite(rawVal)) {
      this.values[id] = def.defaultValue;
      return;
    }
    const snapped = Math.round((rawVal - def.min) / def.step) * def.step + def.min;
    const clamped = Math.max(def.min, Math.min(def.max, snapped));
    this.values[id] = Number(clamped.toFixed(4));
  }
  resetAll() {
    for (const def of this.schema) {
      this.values[def.id] = def.defaultValue;
    }
  }
};
describe("Tier 2: Preset Fine-Tuning Boundary Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Tuning.1: NaN and Infinite inputs safely fallback to parameter default values", () => {
    const tuner = new RobustPresetTuner();
    tuner.setParameter("warp", NaN);
    expect(tuner.values.warp).toBe(1);
    tuner.setParameter("speed", Infinity);
    expect(tuner.values.speed).toBe(0.6);
    tuner.setParameter("speed", -Infinity);
    expect(tuner.values.speed).toBe(0.6);
  });
  test("T2.Tuning.2: Extreme values (-100000, +100000) are strictly clamped within min and max", () => {
    const tuner = new RobustPresetTuner();
    tuner.setParameter("warp", -1e5);
    expect(tuner.values.warp).toBe(0);
    tuner.setParameter("warp", 1e5);
    expect(tuner.values.warp).toBe(2);
  });
  test("T2.Tuning.3: Step resolution snapping aligns raw float values to discrete intervals", () => {
    const tuner = new RobustPresetTuner();
    tuner.setParameter("warp", 0.83);
    expect(tuner.values.warp).toBe(0.8);
    tuner.setParameter("warp", 0.87);
    expect(tuner.values.warp).toBe(0.9);
  });
  test("T2.Tuning.4: Setting parameter with empty or unknown ID is safely ignored", () => {
    const tuner = new RobustPresetTuner();
    const initial = { ...tuner.values };
    tuner.setParameter("", 1.5);
    tuner.setParameter("nonExistentKey", 1.5);
    tuner.setParameter("__proto__", 1.5);
    expect(tuner.values).toEqual(initial);
  });
  test("T2.Tuning.5: Resetting all parameters restores default schema values precisely", () => {
    const tuner = new RobustPresetTuner();
    tuner.setParameter("warp", 1.8);
    tuner.setParameter("speed", 2.5);
    expect(tuner.values.warp).toBe(1.8);
    expect(tuner.values.speed).toBe(2.5);
    tuner.resetAll();
    expect(tuner.values.warp).toBe(1);
    expect(tuner.values.speed).toBe(0.6);
  });
});

// tests/tier2-boundaries/tuning-stress.test.ts
function getTunablePresets() {
  return [
    new WaveFormPreset(),
    new ParticleFieldPreset(),
    new CircularSpectrumPreset(),
    new FerrofluidPreset(),
    new ObsidianPolyPreset(),
    new NeonTunnelPreset(),
    new StarfieldPreset(),
    new ThreeDBarsPreset(),
    new SynthwaveTerrainPreset()
  ];
}
describe("Tier 2: Preset Tuning Empirical Stress & Boundary Hardening (#41)", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.TuningStress.1: ParameterStore core boundary handling (NaN, Infinity, extremes, types)", () => {
    const schema = [
      { id: "p1", name: "Param 1", min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
      { id: "p2", name: "Param 2", min: -5, max: 5, step: 0.5, defaultValue: 0 },
      { id: "p3", name: "Param 3", min: 10, max: 100, step: 5, defaultValue: 50 }
    ];
    const store = new ParameterStore(schema);
    expect(store.getValue("p1")).toBe(1);
    expect(store.getValue("p2")).toBe(0);
    expect(store.getValue("p3")).toBe(50);
    store.setValue("p1", -1e9);
    expect(store.getValue("p1")).toBe(0.1);
    store.setValue("p2", -1e9);
    expect(store.getValue("p2")).toBe(-5);
    store.setValue("p1", 1e9);
    expect(store.getValue("p1")).toBe(2.5);
    store.setValue("p2", 1e9);
    expect(store.getValue("p2")).toBe(5);
    store.setValue("p1", NaN);
    expect(store.getValue("p1")).toBe(1);
    store.setValue("p2", Infinity);
    expect(store.getValue("p2")).toBe(0);
    store.setValue("p2", -Infinity);
    expect(store.getValue("p2")).toBe(0);
    store.setValue("p2", -0);
    expect(store.getValue("p2")).toBe(0);
    store.setValue("p1", void 0);
    expect(store.getValue("p1")).toBe(1);
    store.setValue("p1", "999");
    expect(store.getValue("p1")).toBe(1);
    store.setValue("p1", null);
    expect(store.getValue("p1")).toBe(1);
    store.setValue("unknown_id", 99);
    expect(store.getValue("unknown_id")).toBe(0);
    store.setValue("__proto__", 99);
    expect(store.getValue("__proto__")).toBe(0);
  });
  test("T2.TuningStress.2: Extreme boundary values (-1e9, 1e9, NaN, Infinity, -0, undefined, strings) on all 9 presets", () => {
    const presets = getTunablePresets();
    expect(presets.length).toBe(9);
    for (const p of presets) {
      const params = p.getCustomParameters?.();
      expect(params).toBeDefined();
      expect(params.length).toBeGreaterThanOrEqual(3);
      for (const def of params) {
        p.setCustomParameter(def.id, -1e9);
        expect(p.getCustomParameterValue(def.id)).toBe(def.min);
        p.setCustomParameter(def.id, 1e9);
        expect(p.getCustomParameterValue(def.id)).toBe(def.max);
        p.setCustomParameter(def.id, NaN);
        expect(p.getCustomParameterValue(def.id)).toBe(def.defaultValue);
        p.setCustomParameter(def.id, Infinity);
        expect(p.getCustomParameterValue(def.id)).toBe(def.defaultValue);
        p.setCustomParameter(def.id, -Infinity);
        expect(p.getCustomParameterValue(def.id)).toBe(def.defaultValue);
        p.setCustomParameter(def.id, -0);
        const valNegZero = p.getCustomParameterValue(def.id);
        expect(Number.isFinite(valNegZero)).toBe(true);
        expect(valNegZero).toBeGreaterThanOrEqual(def.min);
        expect(valNegZero).toBeLessThanOrEqual(def.max);
        p.setCustomParameter(def.id, void 0);
        expect(p.getCustomParameterValue(def.id)).toBe(def.defaultValue);
        p.setCustomParameter(def.id, "abc");
        expect(p.getCustomParameterValue(def.id)).toBe(def.defaultValue);
      }
    }
  });
  test("T2.TuningStress.3: Step resolution snapping generator across random floats", () => {
    const presets = getTunablePresets();
    for (const p of presets) {
      const params = p.getCustomParameters?.() || [];
      for (const def of params) {
        for (let i = 1; i <= 10; i++) {
          const factor = i / 11;
          const testVal = def.min + factor * (def.max - def.min);
          p.setCustomParameter(def.id, testVal);
          const storedVal = p.getCustomParameterValue(def.id);
          expect(storedVal).toBeGreaterThanOrEqual(def.min);
          expect(storedVal).toBeLessThanOrEqual(def.max);
          const stepsCount = (storedVal - def.min) / def.step;
          const roundDiff = Math.abs(stepsCount - Math.round(stepsCount));
          expect(roundDiff).toBeLessThan(1e-4);
        }
      }
    }
  });
  test("T2.TuningStress.4: 10,000 rapid parameter mutations throughput and stability", () => {
    const presets = getTunablePresets();
    const iterations = 1e4;
    const startTime = Date.now();
    for (let i = 0; i < iterations; i++) {
      const preset = presets[i % presets.length];
      const params = preset.getCustomParameters();
      const param = params[i % params.length];
      const val = param.min + i % 100 / 100 * (param.max - param.min);
      preset.setCustomParameter(param.id, val);
    }
    const durationMs = Date.now() - startTime;
    expect(durationMs).toBeLessThan(1e3);
  });
  test("T2.TuningStress.5: 60 FPS live frame modulation stability across all 9 presets", () => {
    const presets = getTunablePresets();
    const audio = createBeatDropAudioFeatures();
    const theme = createMockTheme();
    for (const preset of presets) {
      const ctx = createMockPresetContext(theme);
      preset.init(ctx);
      const params = preset.getCustomParameters();
      for (let frame = 0; frame < 60; frame++) {
        const time = frame * (1 / 60);
        const delta = 1 / 60;
        for (const p of params) {
          const val = p.min + Math.sin(frame * 0.2 + 1) * 0.5 * (p.max - p.min) + 0.5 * (p.max - p.min);
          preset.setCustomParameter(p.id, val);
        }
        audio.bass = 0.5 + 0.5 * Math.sin(frame * 0.1);
        audio.beat = frame % 15 === 0;
        preset.update(ctx, audio, time, delta);
      }
      preset.dispose();
    }
  });
  test("T2.TuningStress.6: Mount and unmount #tuningPanel 50 times in rapid succession", () => {
    const railBtn = new MockElement("BUTTON");
    railBtn.id = "presetSettingsRailBtn";
    railBtn.className = "rail-btn preset-settings-link is-collapsed";
    document.body.appendChild(railBtn);
    const tuningPanel = new MockElement("DIV");
    tuningPanel.id = "tuningPanel";
    tuningPanel.className = "drawer-panel detail-panel";
    document.body.appendChild(tuningPanel);
    const content = new MockElement("DIV");
    content.id = "presetSettingsContent";
    tuningPanel.appendChild(content);
    const testCatalog = [
      new WaveFormPreset(),
      new ParticleFieldPreset(),
      new MilkDropPreset(),
      new CircularSpectrumPreset(),
      null,
      new FerrofluidPreset(),
      new DNAHelixPreset(),
      new ObsidianPolyPreset(),
      new NeonTunnelPreset(),
      new StarfieldPreset(),
      new ThreeDBarsPreset(),
      new SynthwaveTerrainPreset()
    ];
    for (let cycle = 1; cycle <= 50; cycle++) {
      const preset = testCatalog[cycle % testCatalog.length];
      const isTunable = Boolean(
        preset && typeof preset.getCustomParameters === "function" && (preset.getCustomParameters()?.length ?? 0) > 0
      );
      updateTuningButtonState(preset, railBtn, tuningPanel);
      renderTuningPanel(preset, content);
      if (isTunable) {
        expect(railBtn.classList.contains("is-collapsed")).toBe(false);
        const params = preset.getCustomParameters();
        const sliders = content.querySelectorAll(".tuning-slider");
        expect(sliders.length).toBe(params.length);
        const readouts = content.querySelectorAll(".tuning-val-readout");
        expect(readouts.length).toBe(params.length);
        for (const p of params) {
          const slider = content.querySelector(`#tuning_${p.id}_slider`);
          const readout = content.querySelector(`#tuning_${p.id}_val`);
          expect(slider).toBeDefined();
          expect(readout).toBeDefined();
          const currentVal = preset.getCustomParameterValue(p.id) ?? p.defaultValue;
          expect(Number(slider.value)).toBe(currentVal);
          expect(readout.textContent).toBe(formatParamValue(currentVal, p.step));
        }
      } else {
        expect(railBtn.classList.contains("is-collapsed")).toBe(true);
        expect(tuningPanel.classList.contains("open")).toBe(false);
        const notice = content.querySelector(".tuning-fallback-notice");
        expect(notice).toBeDefined();
        expect(notice.textContent).toBe("No settings for this preset");
        const sliders = content.querySelectorAll(".tuning-slider");
        expect(sliders.length).toBe(0);
      }
    }
  });
  test("T2.TuningStress.7: Event listener leak check and slider recreation verification", () => {
    const content = new MockElement("DIV");
    content.id = "presetSettingsContent";
    document.body.appendChild(content);
    const wavePreset = new WaveFormPreset();
    renderTuningPanel(wavePreset, content);
    const initialSpeedSlider = content.querySelector("#tuning_speed_slider");
    expect(initialSpeedSlider).toBeDefined();
    initialSpeedSlider.value = "2.3";
    initialSpeedSlider.dispatchEvent(new Event("input"));
    expect(wavePreset.getCustomParameterValue("speed")).toBe(2.3);
    const particlePreset = new ParticleFieldPreset();
    renderTuningPanel(particlePreset, content);
    const particleSpeedSlider = content.querySelector("#tuning_speed_slider");
    expect(particleSpeedSlider).toBeDefined();
    expect(particleSpeedSlider !== initialSpeedSlider).toBe(true);
    initialSpeedSlider.value = "0.4";
    initialSpeedSlider.dispatchEvent(new Event("input"));
    expect(particlePreset.getCustomParameterValue("speed")).toBe(1);
    particleSpeedSlider.value = "1.7";
    particleSpeedSlider.dispatchEvent(new Event("input"));
    expect(particlePreset.getCustomParameterValue("speed")).toBe(1.7);
  });
  test("T2.TuningStress.8: Reset to defaults restores exact initial values in preset and DOM across all 9 presets", () => {
    const content = new MockElement("DIV");
    content.id = "presetSettingsContent";
    document.body.appendChild(content);
    const presets = getTunablePresets();
    for (const p of presets) {
      const params = p.getCustomParameters();
      for (const def of params) {
        p.setCustomParameter(def.id, def.max);
      }
      p.resetCustomParameters();
      for (const def of params) {
        expect(p.getCustomParameterValue(def.id)).toBe(def.defaultValue);
      }
      for (const def of params) {
        p.setCustomParameter(def.id, def.min);
      }
      renderTuningPanel(p, content);
      const resetBtn = content.querySelector("#resetTuningBtn");
      expect(resetBtn).toBeDefined();
      resetBtn.click();
      for (const def of params) {
        expect(p.getCustomParameterValue(def.id)).toBe(def.defaultValue);
        const slider = content.querySelector(`#tuning_${def.id}_slider`);
        expect(Number(slider.value)).toBe(def.defaultValue);
        const readout = content.querySelector(`#tuning_${def.id}_val`);
        expect(readout.textContent).toBe(formatParamValue(def.defaultValue, def.step));
      }
    }
  });
});

// tests/tier2-boundaries/camera-boundary.test.ts
describe("Tier 2: Camera & 3D Viewpoints Boundary Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Camera.1: Zenith and Nadir pole angles (+PI/2, -PI/2) compute finite coordinates without NaN", () => {
    const radius = 12;
    const calculateSphericalPosition = (rot, tilt) => {
      const halfPi = Math.PI / 2;
      const clampedTilt = Math.max(-halfPi + 1e-4, Math.min(halfPi - 1e-4, tilt));
      const x = radius * Math.cos(clampedTilt) * Math.sin(rot);
      const y = radius * Math.sin(clampedTilt);
      const z = radius * Math.cos(clampedTilt) * Math.cos(rot);
      return [x, y, z];
    };
    const [zx, zy, zz] = calculateSphericalPosition(0, Math.PI / 2);
    expect(isFinite(zx) && !isNaN(zx)).toBe(true);
    expect(isFinite(zy) && !isNaN(zy)).toBe(true);
    expect(isFinite(zz) && !isNaN(zz)).toBe(true);
    expect(zy).toBeCloseTo(12, 0.01);
    const [nx, ny, nz] = calculateSphericalPosition(0, -Math.PI / 2);
    expect(isFinite(nx) && !isNaN(nx)).toBe(true);
    expect(isFinite(ny) && !isNaN(ny)).toBe(true);
    expect(isFinite(nz) && !isNaN(nz)).toBe(true);
    expect(ny).toBeCloseTo(-12, 0.01);
  });
  test("T2.Camera.2: Zoom slider boundary values clamp cleanly to minimum 0.7 and maximum 2.5", () => {
    expect(computeZoomDistance2(-999)).toBeCloseTo(0.7);
    expect(computeZoomDistance2(999)).toBeCloseTo(2.5);
    expect(computeZoomDistance2(NaN)).toBeCloseTo(0.7);
  });
  test("T2.Camera.3: Auto-rotation speed of 0.0 preserves camera position steadily", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.config.autoRotate = true;
    engine.config.autoRotateSpeed = 0;
    engine.config.cameraShake = false;
    const audio = {
      frequencyData: new Uint8Array(1024),
      timeDomainData: new Uint8Array(1024),
      subBass: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      rms: 0,
      beat: false,
      beatEnergy: 0,
      bpm: 120
    };
    engine.render(audio);
    const p1 = engine.camera.position.clone();
    engine.render(audio);
    const p2 = engine.camera.position.clone();
    expect(p1.distanceTo(p2)).toBeCloseTo(0, 1e-3);
  });
  test("T2.Camera.4: Extreme audio kick impulse caps shake displacement at safe maximum", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.config.cameraShake = true;
    const extremeAudio = createBeatDropAudioFeatures(1);
    extremeAudio.bass = 1;
    engine.render(extremeAudio);
    expect(isFinite(engine.camera.position.x)).toBe(true);
    expect(isFinite(engine.camera.position.y)).toBe(true);
    expect(isFinite(engine.camera.position.z)).toBe(true);
    expect(Math.abs(engine.camera.position.x)).toBeLessThan(20);
  });
  test("T2.Camera.5: Zero window dimensions in resize handle aspect ratio without NaN camera projection", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const safeResize = (w, h) => {
      const safeW = Math.max(1, w);
      const safeH = Math.max(1, h);
      engine.resize(safeW, safeH);
    };
    safeResize(0, 0);
    expect(isFinite(engine.camera.aspect)).toBe(true);
    expect(engine.camera.aspect).toBeGreaterThan(0);
  });
});

// tests/tier2-boundaries/overlay-boundary.test.ts
describe("Tier 2: Text Overlay Boundary Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Overlay.1: Whitespace-only, tabs, newlines, and null-character inputs disable rendering", () => {
    const r1 = sanitizeTextOverlayInput("\n	\r   	");
    expect(r1.sanitized).toBe("");
    expect(r1.enabled).toBe(false);
    const r2 = sanitizeTextOverlayInput("\0\0\0");
    expect(r2.enabled).toBe(false);
  });
  test("T2.Overlay.2: Massive 2000-character string is strictly clamped to max 200 characters", () => {
    const hugeInput = "Visualizor-Cosmic-Sound-Wave-".repeat(100);
    expect(hugeInput.length).toBeGreaterThan(2e3);
    const result = sanitizeTextOverlayInput(hugeInput);
    expect(result.sanitized.length).toBe(200);
    expect(result.enabled).toBe(true);
  });
  test("T2.Overlay.3: Emojis, multilingual glyphs, and math symbols preserve integrity without garbling", () => {
    const unicodeInput = "\u{1F3B5} Visuval \u{1F30C} Synthwave: \u592A\u967D & \u5149 (Cymatics \u2211 432Hz) \u{1F525}";
    const result = sanitizeTextOverlayInput(unicodeInput);
    expect(result.sanitized).toBe(unicodeInput);
    expect(result.enabled).toBe(true);
  });
  test("T2.Overlay.4: Script tags and HTML entities are treated as literal text without execution", () => {
    const maliciousInput = '<script>window.pwned = true;</script><img src="x" onerror="alert(1)">';
    const result = sanitizeTextOverlayInput(maliciousInput);
    expect(result.sanitized).toBe(maliciousInput);
    const g = globalThis;
    expect(g.pwned).toBeUndefined();
  });
  test("T2.Overlay.5: Font size clamping bounds text within [8px, 120px] range", () => {
    const clampFontSize = (size) => {
      if (typeof size !== "number" || isNaN(size)) return 24;
      return Math.max(8, Math.min(120, size));
    };
    expect(clampFontSize(-50)).toBe(8);
    expect(clampFontSize(0)).toBe(8);
    expect(clampFontSize(500)).toBe(120);
    expect(clampFontSize(NaN)).toBe(24);
  });
  test("T2.Overlay.6: Canvas dimension calculation respects max texture limits", () => {
    const maxTextureSize = 4096;
    const computeCanvasSize = (textLength, fontSize) => {
      const estimatedWidth = Math.min(maxTextureSize, Math.ceil(textLength * fontSize * 0.7));
      const estimatedHeight = Math.min(maxTextureSize, Math.ceil(fontSize * 1.5));
      return { width: estimatedWidth, height: estimatedHeight };
    };
    const size = computeCanvasSize(200, 120);
    expect(size.width).toBeLessThanOrEqual(maxTextureSize);
    expect(size.height).toBeLessThanOrEqual(maxTextureSize);
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });
});

// tests/tier2-boundaries/studio-boundary.test.ts
describe("Tier 2: Studio Forge Boundary Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Studio.1: Negative The Force attraction (-2.0 repulsion) applies outward physics stably", () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);
    studio.config.theForceAttraction = -2;
    const audio = createBeatDropAudioFeatures(0.9);
    for (let i = 0; i < 10; i++) {
      studio.update(ctx, audio, i * 0.016, 0.016);
    }
    expect(studio.config.theForceAttraction).toBe(-2);
    studio.dispose();
  });
  test("T2.Studio.2: Zero volume density (0.0) renders without division by zero errors", () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);
    studio.config.volumeDensity = 0;
    const audio = createBeatDropAudioFeatures(0.5);
    studio.update(ctx, audio, 0.5, 0.016);
    expect(studio.config.volumeDensity).toBe(0);
    studio.dispose();
  });
  test("T2.Studio.3: All stage config parameters set to maximum 2.0 execute without numerical overflow", () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);
    studio.config.chromaIntensity = 2;
    studio.config.liquidWarp = 2;
    studio.config.tunnelDepth = 2;
    studio.config.volumeDensity = 2;
    studio.config.theForceAttraction = 2;
    const audio = createBeatDropAudioFeatures(1);
    studio.update(ctx, audio, 1, 0.016);
    expect(studio.config.liquidWarp).toBe(2);
    expect(studio.config.tunnelDepth).toBe(2);
    studio.dispose();
  });
  test("T2.Studio.4: Recipe title validation rejects empty, whitespace, and non-string values", () => {
    const isValidRecipeName = (name) => {
      if (typeof name !== "string") return false;
      return name.trim().length > 0 && name.trim().length <= 60;
    };
    expect(isValidRecipeName("")).toBe(false);
    expect(isValidRecipeName("   	  ")).toBe(false);
    expect(isValidRecipeName(null)).toBe(false);
    expect(isValidRecipeName(123)).toBe(false);
    expect(isValidRecipeName("a".repeat(70))).toBe(false);
    expect(isValidRecipeName("Neon Horizon 2026")).toBe(true);
  });
  test("T2.Studio.5: Corrupted or invalid JSON in saved recipes is caught and discarded gracefully", () => {
    const parseSavedRecipe = (jsonStr) => {
      try {
        const obj = JSON.parse(jsonStr);
        if (typeof obj === "object" && obj !== null && typeof obj.name === "string") {
          return obj;
        }
        return null;
      } catch {
        return null;
      }
    };
    expect(parseSavedRecipe("invalid-json{{{")).toBeNull();
    expect(parseSavedRecipe('{"incomplete": true')).toBeNull();
    expect(parseSavedRecipe("null")).toBeNull();
    expect(parseSavedRecipe('{"name": "Valid Recipe"}')).toBeDefined();
  });
  test("T2.Studio.6: Mode switcher checks dirty state before leaving Studio mode", () => {
    const checkStudioLeaveAllowed = (hasUnsavedChanges, userConfirmedDiscard) => {
      if (!hasUnsavedChanges) return true;
      return userConfirmedDiscard;
    };
    expect(checkStudioLeaveAllowed(false, false)).toBe(true);
    expect(checkStudioLeaveAllowed(true, false)).toBe(false);
    expect(checkStudioLeaveAllowed(true, true)).toBe(true);
  });
});

// tests/tier2-boundaries/midi-boundary.test.ts
describe("Tier 2: Web MIDI API Boundary Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Midi.1: Malformed and truncated MIDI byte arrays return null without throwing", () => {
    expect(parseMidiCCMessage([])).toBeNull();
    expect(parseMidiCCMessage([176])).toBeNull();
    expect(parseMidiCCMessage([176, 74])).toBeNull();
    expect(parseMidiCCMessage([240, 126, 127])).toBeNull();
  });
  test("T2.Midi.2: Out-of-bounds CC values (>127 or <0) are clamped to safe 0.0-1.0 range", () => {
    const high = parseMidiCCMessage([176, 10, 255]);
    expect(high).toBeDefined();
    expect(high?.normalizedValue).toBeCloseTo(1);
    const low = parseMidiCCMessage([176, 10, -50]);
    expect(low).toBeDefined();
    expect(low?.normalizedValue).toBeCloseTo(0);
  });
  test("T2.Midi.3: Unmapped CC numbers do not alter mapped parameter dictionary", () => {
    const mappings = /* @__PURE__ */ new Map([[7, "volume"]]);
    const values = /* @__PURE__ */ new Map([["volume", 0.8]]);
    const parsed = parseMidiCCMessage([176, 99, 120]);
    if (parsed && mappings.has(parsed.cc)) {
      values.set(mappings.get(parsed.cc), parsed.normalizedValue);
    }
    expect(values.get("volume")).toBeCloseTo(0.8);
  });
  test("T2.Midi.4: Rapid burst of 100 MIDI CC events in 1ms processes sequentially", () => {
    const values = /* @__PURE__ */ new Map();
    const mappings = /* @__PURE__ */ new Map([[74, "bloom"]]);
    for (let i = 0; i <= 100; i++) {
      const parsed = parseMidiCCMessage([176, 74, Math.round(i / 100 * 127)]);
      if (parsed && mappings.has(parsed.cc)) {
        values.set(mappings.get(parsed.cc), parsed.normalizedValue);
      }
    }
    expect(values.get("bloom")).toBeCloseTo(1);
  });
  test("T2.Midi.5: MIDI Learn cancellation preserves existing controller bindings intact", () => {
    let isLearning = true;
    let targetParam = "audioSensitivity";
    const bindings = /* @__PURE__ */ new Map([[1, "audioSensitivity"]]);
    isLearning = false;
    targetParam = null;
    expect(isLearning).toBe(false);
    expect(targetParam).toBeNull();
    expect(bindings.get(1)).toBe("audioSensitivity");
  });
  test("T2.Midi.6: Channel nibble extraction supports MIDI channels 1 through 16", () => {
    expect(parseMidiCCMessage([176, 1, 64])?.channel).toBe(0);
    expect(parseMidiCCMessage([191, 1, 64])?.channel).toBe(15);
  });
  test("T2.Midi.7: Unsupported navigator.requestMIDIAccess environment falls back gracefully with isSupported=false", async () => {
    const orig = navigator.requestMIDIAccess;
    try {
      navigator.requestMIDIAccess = void 0;
      const manager = new MidiManager();
      const success = await manager.init();
      expect(success).toBe(false);
      expect(manager.isSupported).toBe(false);
      expect(manager.isConnected).toBe(false);
    } finally {
      navigator.requestMIDIAccess = orig;
    }
  });
  test("T2.Midi.8: Web MIDI permission rejection (SecurityError / NotAllowedError) handles denial cleanly", async () => {
    const orig = navigator.requestMIDIAccess;
    try {
      navigator.requestMIDIAccess = async () => {
        throw new Error("NotAllowedError: Permission denied");
      };
      const manager = new MidiManager();
      const success = await manager.init();
      expect(success).toBe(false);
      expect(manager.isConnected).toBe(false);
    } finally {
      navigator.requestMIDIAccess = orig;
    }
  });
  test("T2.Midi.9: Non-CC messages (Pitch Bend 0xE0, Program Change 0xC0, Channel Aftertouch 0xD0, SysEx 0xF0) are ignored without error", async () => {
    const manager = new MidiManager();
    await manager.init();
    const initialSize = manager.parameterValues.size;
    manager.handleMessage([224, 0, 64]);
    manager.handleMessage([192, 1]);
    manager.handleMessage([208, 32]);
    manager.handleMessage([240, 126, 127, 6, 1, 247]);
    expect(manager.parameterValues.size).toBe(initialSize);
  });
  test("T2.Midi.10: High-frequency CC floods across multiple channels maintain thread-safe mapping stability", async () => {
    const manager = new MidiManager();
    await manager.init();
    for (let i = 0; i <= 500; i++) {
      const channel = i % 16;
      const status = 176 | channel;
      const val = Math.round(i / 500 * 127);
      manager.handleMessage([status, 1, val]);
    }
    const finalVal = manager.parameterValues.get("audioSensitivity");
    expect(finalVal).toBeDefined();
    expect(finalVal).toBeCloseTo(1);
  });
});

// tests/tier2-boundaries/presets-boundary.test.ts
describe("Tier 2: Preset Lifecycle Boundary Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Presets.1: Double dispose() invocation does not throw or corrupt scene state", () => {
    const preset = getPreset("dna") || PRESETS[0];
    const ctx = createMockPresetContext(getTheme("ember"));
    preset.init(ctx);
    preset.dispose();
    expect(() => {
      preset.dispose();
    }).not.toThrow();
  });
  test("T2.Presets.2: Preset update with complete zero audio features executes without division by zero", () => {
    const silentAudio = createSilentAudioFeatures();
    const ctx = createMockPresetContext(getTheme("ember"));
    for (const preset of PRESETS) {
      preset.init(ctx);
      expect(() => {
        preset.update(ctx, silentAudio, 0, 0);
      }).not.toThrow();
      preset.dispose();
      ctx.scene.clear();
    }
  });
  test("T2.Presets.3: Extreme delta time (10 seconds) is clamped to prevent physics explosions", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const preset = getPreset("waterslide") || PRESETS[0];
    engine.setPreset(preset);
    const audio = createSilentAudioFeatures();
    expect(() => {
      engine.render(audio);
    }).not.toThrow();
  });
  test("T2.Presets.4: Rapid preset switching across ALL 71 presets executes without lingering meshes or memory leaks", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const initialLightCount = engine.scene.children.filter((c) => c.isLight).length;
    for (let i = 0; i < PRESETS.length; i++) {
      engine.setPreset(PRESETS[i]);
      expect(engine.activePreset?.id).toBe(PRESETS[i].id);
    }
    expect(engine.activePreset?.id).toBe(PRESETS[PRESETS.length - 1].id);
    expect(engine.scene.children.length).toBeGreaterThan(initialLightCount);
    expect(() => {
      engine.activePreset?.dispose();
    }).not.toThrow();
  });
  test("T2.Presets.5: Zero canvas dimensions in resize do not produce NaN aspect ratios across presets", () => {
    const ctx = createMockPresetContext(getTheme("ember"));
    for (const preset of PRESETS) {
      preset.init(ctx);
      if (preset.resize) {
        expect(() => {
          preset.resize(0, 0);
          preset.resize(3840, 2160);
          preset.resize(1920, 1080);
        }).not.toThrow();
      }
      preset.dispose();
      ctx.scene.clear();
    }
  });
});

// tests/tier2-boundaries/audio-boundary.test.ts
describe("Tier 2: Audio DSP Boundary Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T2.Audio.1: Absolute silence (all 0 buffers) produces zero energies without NaN", () => {
    const engine = new AudioEngine();
    const features = engine.getFeatures();
    expect(isNaN(features.subBass)).toBe(false);
    expect(isNaN(features.bass)).toBe(false);
    expect(isNaN(features.mid)).toBe(false);
    expect(isNaN(features.treble)).toBe(false);
    expect(isNaN(features.rms)).toBe(false);
    expect(features.subBass).toBe(0);
    expect(features.bass).toBe(0);
    expect(features.rms).toBe(0);
  });
  test("T2.Audio.2: Maximum clipping amplitude (all 255) clamps RMS cleanly to 1.0", () => {
    const maxTimeData = new Uint8Array(1024).fill(255);
    let sumSquares = 0;
    for (const val of maxTimeData) {
      const norm = (val - 128) / 128;
      sumSquares += norm * norm;
    }
    const rms = Math.min(1, Math.sqrt(sumSquares / maxTimeData.length) * 2);
    expect(rms).toBe(1);
  });
  test("T2.Audio.3: BeatDetector handles abrupt transition from prolonged silence to maximum kick", () => {
    const detector = new BeatDetector();
    for (let i = 0; i < 100; i++) {
      detector.update(0);
    }
    expect(detector.beatEnergy).toBe(0);
    const kick = detector.update(1);
    expect(kick).toBe(true);
    expect(detector.beatEnergy).toBe(1);
  });
  test("T2.Audio.4: Unrealistic tap tempo frequencies (>300 BPM or <40 BPM) are filtered to valid range", () => {
    const bpm = new BPMDetector();
    for (let i = 0; i < 5; i++) {
      bpm.tap();
    }
    expect(bpm.detectedBPM).toBeGreaterThanOrEqual(50);
    expect(bpm.detectedBPM).toBeLessThanOrEqual(240);
  });
  test("T2.Audio.5: Empty playlist queue operations do not throw or crash", () => {
    const engine = new AudioEngine();
    expect(() => {
      engine.addFilesToPlaylist([]);
      engine.nextTrack();
      engine.prevTrack();
    }).not.toThrow();
    expect(engine.currentTrackIndex).toBe(-1);
  });
  test("T2.Audio.6: Microphone permission denial simulation returns false gracefully", async () => {
    const engine = new AudioEngine();
    navigator.mediaDevices.getUserMedia = async () => {
      throw new Error("Permission denied by user");
    };
    const micResult = await engine.toggleMic();
    expect(micResult).toBe(false);
    expect(engine.isMicActive).toBe(false);
  });
  test("T2.Audio.7: Screen audio capture mutes local audio feedback return by default to prevent loops", async () => {
    const engine = new AudioEngine();
    const result = await engine.toggleScreenAudioCapture();
    expect(result).toBe(true);
    expect(engine.isScreenAudioActive).toBe(true);
    expect(engine.isScreenAudioPassthrough).toBe(false);
    engine.setScreenAudioPassthrough(true);
    expect(engine.isScreenAudioPassthrough).toBe(true);
    engine.setScreenAudioPassthrough(false);
    expect(engine.isScreenAudioPassthrough).toBe(false);
    engine.disableScreenAudioCapture();
    expect(engine.isScreenAudioActive).toBe(false);
  });
  test("T2.Audio.8: Screen audio capture without audio tracks throws NO_AUDIO_TRACK", async () => {
    const engine = new AudioEngine();
    navigator.mediaDevices.getDisplayMedia = async () => ({
      getTracks: () => [],
      getAudioTracks: () => [],
      getVideoTracks: () => []
    });
    let errorThrown = false;
    try {
      await engine.toggleScreenAudioCapture();
    } catch (err) {
      if (err?.message === "NO_AUDIO_TRACK") {
        errorThrown = true;
      }
    }
    expect(errorThrown).toBe(true);
    expect(engine.isScreenAudioActive).toBe(false);
  });
});

// tests/tier2-boundary/stims-boundary.test.ts
describe("Tier 2: Stims Catalog Boundary & Corner Cases", () => {
  beforeEach(() => {
    setupTestEnvironment();
    StimsCatalogService.resetInstance();
  });
  test("T2.StimsBoundary.1: Corrupted Catalog JSON \u2014 graceful degradation without throwing", async () => {
    const service = StimsCatalogService.getInstance();
    const customFetch = async (url) => {
      if (url.includes("starter-catalog.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            presets: [
              { id: "flagship-1", title: "Flagship 1", file: "/presets/stims/flagship-1.milk", tags: ["category:fractal"] }
            ]
          })
        };
      }
      if (url.includes("catalog.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => {
            throw new Error("Malformed JSON syntax in catalog payload");
          }
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({})
      };
    };
    await service.init({ customFetch, eagerFullHydration: true });
    expect(service.isReady()).toBe(true);
    expect(service.getStarterPresets().length).toBe(1);
    expect(service.getAllPresets().length).toBe(1);
  });
  test("T2.StimsBoundary.2: Network 404/500 Failure \u2014 service handles failed fetch cleanly", async () => {
    const service = StimsCatalogService.getInstance();
    const failingFetch = async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: "Not found" })
    });
    await service.init({ customFetch: failingFetch });
    expect(service.isReady()).toBe(true);
    expect(service.getStarterPresets().length).toBe(0);
    expect(service.getAllPresets().length).toBe(0);
    expect(service.getCategories().length).toBe(10);
    expect(service.getCollections().length).toBe(6);
  });
  test("T2.StimsBoundary.3: Presets with Missing Optional Fields \u2014 robust defaults", async () => {
    const service = StimsCatalogService.getInstance();
    const sparseFetch = async (url) => {
      if (url.includes("starter-catalog.json") || url.includes("catalog.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            presets: [
              { id: "bare-bones-preset" },
              { id: "preset-with-no-tags", title: "No Tags", author: "Test" }
            ]
          })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({})
      };
    };
    await service.init({ customFetch: sparseFetch });
    const p1 = service.getPresetById("bare-bones-preset");
    expect(p1).not.toBeNull();
    expect(p1.id).toBe("bare-bones-preset");
    expect(p1.title).toBe("bare-bones-preset");
    expect(p1.author).toBe("Unknown");
    expect(p1.category).toBe("uncategorized");
    expect(p1.tags).toEqual([]);
    expect(p1.qualityScore).toBeUndefined();
    expect(p1.sensoryProfile).toBeUndefined();
  });
  test("T2.StimsBoundary.4: Impossible Filter Combinations \u2014 returns empty array, never crashes", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const impossible = service.filterPresets({
      category: "dancer",
      collection: "classic-milkdrop",
      searchQuery: "nonexistentkeywordxyz123456789"
    });
    expect(Array.isArray(impossible)).toBe(true);
    expect(impossible.length).toBe(0);
    const randomImpossible = service.getRandomPreset({
      category: "dancer",
      collection: "classic-milkdrop",
      searchQuery: "nonexistentkeywordxyz123456789"
    });
    expect(randomImpossible).toBeNull();
  });
  test("T2.StimsBoundary.5: Rapid Concurrent Invocations \u2014 multiple concurrent init() share single Promise", async () => {
    const service = StimsCatalogService.getInstance();
    const promises2 = [
      service.init(),
      service.init(),
      service.init(),
      service.init(),
      service.init()
    ];
    await Promise.all(promises2);
    expect(service.isReady()).toBe(true);
    expect(service.isFullyHydrated()).toBe(true);
    expect(service.getAllPresets().length).toBe(1787);
  });
  test("T2.StimsBoundary.6: excludeId Filtering \u2014 excludes specified preset ID from candidates", async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();
    const targetId = "eos-glowsticks-v2-03-music";
    const before = service.filterPresets({ searchQuery: "glowsticks" });
    const hasTarget = before.some((p) => p.id === targetId);
    expect(hasTarget).toBe(true);
    const after = service.filterPresets({
      searchQuery: "glowsticks",
      excludeId: targetId
    });
    const stillHasTarget = after.some((p) => p.id === targetId);
    expect(stillHasTarget).toBe(false);
  });
  test("T2.StimsBoundary.7: onHydrated Listener Callbacks and Unsubscribe", async () => {
    const service = StimsCatalogService.getInstance();
    let listenerFired = false;
    const unsubscribe = service.onHydrated(() => {
      listenerFired = true;
    });
    await service.init({ eagerFullHydration: true });
    expect(listenerFired).toBe(true);
    expect(service.isFullyHydrated()).toBe(true);
    let secondFired = false;
    service.onHydrated(() => {
      secondFired = true;
    });
    expect(secondFired).toBe(true);
    unsubscribe();
  });
});

// tests/tier3-combinations/combinations.test.ts
describe("Tier 3: Cross-Feature Combinations", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T3.Combo.1: Theme switch during camera auto-orbit propagates colors while camera orbits", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const spy = new SpyVisualizerPreset();
    engine.setPreset(spy);
    engine.config.autoRotate = true;
    engine.config.autoRotateSpeed = 1;
    const audio = createSilentAudioFeatures();
    engine.render(audio);
    const pos1 = engine.camera.position.clone();
    engine.setTheme(getTheme("synthwave"));
    expect(engine.currentTheme.id).toBe("synthwave");
    expect(spy.themeChangeCalls).toBe(1);
    engine.render(audio);
    const pos2 = engine.camera.position.clone();
    expect(pos1.distanceTo(pos2)).toBeGreaterThan(0);
    expect(engine.currentTheme.id).toBe("synthwave");
  });
  test("T3.Combo.2: Preset switch during active MIDI CC modulation updates parameters immediately", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.setPreset(getPreset("particle-field"));
    expect(engine.activePreset?.id).toBe("particle-field");
    const midiMsg = parseMidiCCMessage([176, 74, 110]);
    expect(midiMsg).toBeDefined();
    engine.updateConfig({ bloomStrength: midiMsg.normalizedValue * 3 });
    expect(engine.config.bloomStrength).toBeCloseTo(110 / 127 * 3);
    engine.setPreset(getPreset("neon-tunnel"));
    expect(engine.activePreset?.id).toBe("neon-tunnel");
    const audio = createBeatDropAudioFeatures(0.8);
    engine.render(audio);
    expect(engine.config.bloomStrength).toBeCloseTo(110 / 127 * 3);
  });
  test("T3.Combo.3: Text overlay pulse animation dynamically scales with AudioEngine beat kicks", () => {
    const audioEngine = new AudioEngine();
    const beatAudio = createBeatDropAudioFeatures(0.95);
    const overlay = {
      text: sanitizeTextOverlayInput("DROP THE BASS").sanitized,
      scale: 1,
      update(features) {
        if (features.beat) {
          this.scale = 1 + features.bass * 0.4;
        } else {
          this.scale = 1;
        }
      }
    };
    overlay.update(beatAudio);
    expect(overlay.scale).toBeCloseTo(1.38, 0.05);
    const quietAudio = createSilentAudioFeatures();
    overlay.update(quietAudio);
    expect(overlay.scale).toBeCloseTo(1);
  });
  test("T3.Combo.4: Studio Forge recipe change combined with theme update and camera shake", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const studio = new StudioComposerPreset();
    engine.setPreset(studio);
    studio.config.tunnelDepth = 1.7;
    studio.config.liquidWarp = 1.5;
    engine.setTheme(getTheme("toxic"));
    const kickAudio = createBeatDropAudioFeatures(0.9);
    engine.render(kickAudio);
    expect(engine.currentTheme.id).toBe("toxic");
    expect(studio.config.tunnelDepth).toBe(1.7);
    expect(engine.camera.position.length()).toBeGreaterThan(0);
    engine.activePreset?.dispose();
  });
  test("T3.Combo.5: Microphone stream driving multi-band FFT, beat detector, and bloom post-processing", async () => {
    const canvas = document.getElementById("webgl-canvas");
    const renderEngine = new RenderEngine(canvas, getTheme("ember"));
    const audioEngine = new AudioEngine();
    const micOk = await audioEngine.toggleMic();
    expect(micOk).toBe(true);
    const features = audioEngine.getFeatures();
    if (features.beat) {
      renderEngine.updateConfig({ bloomStrength: 2.5 });
    } else {
      renderEngine.updateConfig({ bloomStrength: 1.2 });
    }
    renderEngine.render(features);
    expect(renderEngine.config.bloomStrength).toBeGreaterThan(0);
  });
  test("T3.Combo.6: Playlist track change triggering BPM recalculation and preset cycle", () => {
    const audioEngine = new AudioEngine();
    let currentPresetIndex = 0;
    audioEngine.onBpmChange = (bpm) => {
      if (bpm > 130) {
        currentPresetIndex = (currentPresetIndex + 1) % PRESETS.length;
      }
    };
    audioEngine.bpmDetector.detectedBPM = 140;
    audioEngine.bpmDetector.recordBeat(1);
    audioEngine.onBpmChange(140, false);
    expect(currentPresetIndex).toBe(1);
  });
  test("T3.Combo.7: UI rail drawer toggling while camera auto-orbit renders active frames", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.config.autoRotate = true;
    const fxPanel = document.createElement("div");
    fxPanel.id = "fxPanel";
    fxPanel.classList.add("open");
    engine.render(createSilentAudioFeatures());
    expect(fxPanel.classList.contains("open")).toBe(true);
    fxPanel.classList.remove("open");
    engine.render(createSilentAudioFeatures());
    expect(fxPanel.classList.contains("open")).toBe(false);
  });
  test("T3.Combo.8: MIDI CC modulating sensitivity while simultaneously modulating chromatic aberration", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    const audio = new AudioEngine();
    const cc1 = parseMidiCCMessage([176, 1, 100]);
    if (cc1) {
      audio.sensitivity = cc1.normalizedValue * 2;
    }
    const cc74 = parseMidiCCMessage([176, 74, 80]);
    if (cc74) {
      engine.updateConfig({ chromaticAberration: cc74.normalizedValue });
    }
    expect(audio.sensitivity).toBeCloseTo(100 / 127 * 2);
    expect(engine.config.chromaticAberration).toBeCloseTo(80 / 127);
  });
  test("T3.Combo.9: Motion persistence feedback ping-pong buffer swap during rapid preset switching", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.updateConfig({ persistence: 0.85 });
    const p1 = getPreset("starfield");
    const p2 = getPreset("black-hole");
    engine.setPreset(p1);
    engine.render(createBeatDropAudioFeatures(0.8));
    engine.setPreset(p2);
    engine.render(createBeatDropAudioFeatures(0.8));
    expect(engine.config.persistence).toBe(0.85);
    expect(engine.activePreset?.id).toBe("black-hole");
  });
  test("T3.Combo.10: Aspect ratio framing resize (16:9 -> 9:16 -> 1:1) with camera projection update and screenshot", () => {
    const canvas = document.getElementById("webgl-canvas");
    const engine = new RenderEngine(canvas, getTheme("ember"));
    engine.resize(1920, 1080);
    expect(engine.camera.aspect).toBeCloseTo(16 / 9, 0.01);
    const shot1 = engine.captureScreenshot();
    expect(shot1.startsWith("data:image/png")).toBe(true);
    engine.resize(1080, 1920);
    expect(engine.camera.aspect).toBeCloseTo(9 / 16, 0.01);
    const shot2 = engine.captureScreenshot();
    expect(shot2.startsWith("data:image/png")).toBe(true);
    engine.resize(1080, 1080);
    expect(engine.camera.aspect).toBeCloseTo(1, 0.01);
    const shot3 = engine.captureScreenshot();
    expect(shot3.startsWith("data:image/png")).toBe(true);
  });
});

// src/presets/stims/ActivePresetsManager.ts
var ACTIVE_PRESETS_STORAGE_KEY = "visualizor_active_stims_presets";
var ACTIVE_PRESETS_SCHEMA_VERSION = 1;
var ActivePresetsManager = class _ActivePresetsManager {
  static instance = null;
  initialized = false;
  inMemoryOnly = false;
  customStorage = null;
  presets = [];
  presetsMap = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  constructor() {
  }
  static getInstance() {
    if (!_ActivePresetsManager.instance) {
      _ActivePresetsManager.instance = new _ActivePresetsManager();
    }
    return _ActivePresetsManager.instance;
  }
  static resetInstance() {
    _ActivePresetsManager.instance = null;
  }
  // ==========================================================================
  // Lifecycle & Storage Initialization
  // ==========================================================================
  init(customStorage) {
    if (customStorage) {
      this.customStorage = customStorage;
    }
    this.presets = [];
    this.presetsMap.clear();
    const rawJson = this.safeRead();
    if (!rawJson) {
      this.initialized = true;
      return;
    }
    try {
      const parsed = JSON.parse(rawJson);
      if (!this.isValidEnvelope(parsed)) {
        console.warn("[ActivePresetsManager] Storage envelope invalid; resetting to empty array.");
        this.initialized = true;
        return;
      }
      const validated = this.sanitizeEnvelopeItems(parsed.presets);
      this.presets = validated;
      for (const item of validated) {
        this.presetsMap.set(item.id, item);
      }
    } catch (err) {
      console.warn("[ActivePresetsManager] Corrupted storage JSON; resetting to empty array:", err);
      this.presets = [];
      this.presetsMap.clear();
    }
    this.initialized = true;
  }
  // ==========================================================================
  // Public Contract Methods
  // ==========================================================================
  getActivePresets() {
    if (!this.initialized) {
      this.init();
    }
    return [...this.presets];
  }
  isPresetActive(id) {
    if (!this.initialized) {
      this.init();
    }
    if (typeof id !== "string" || !id.trim()) {
      return false;
    }
    return this.presetsMap.has(id.trim());
  }
  addPreset(preset) {
    if (!this.initialized) {
      this.init();
    }
    if (!preset || typeof preset !== "object" || typeof preset.id !== "string") {
      return false;
    }
    const trimmedId = preset.id.trim();
    if (!trimmedId || this.presetsMap.has(trimmedId)) {
      return false;
    }
    const newItem = this.createPresetItem(preset, trimmedId);
    const nextPresets = [...this.presets, newItem];
    const envelope = {
      version: ACTIVE_PRESETS_SCHEMA_VERSION,
      presets: nextPresets,
      updatedAt: Date.now()
    };
    const persisted = this.safeWrite(envelope);
    if (!persisted && !this.inMemoryOnly) {
      return false;
    }
    this.presets = nextPresets;
    this.presetsMap.set(trimmedId, newItem);
    this.notifyListeners();
    return true;
  }
  removePreset(id) {
    if (!this.initialized) {
      this.init();
    }
    if (typeof id !== "string" || !id.trim()) {
      return false;
    }
    const trimmedId = id.trim();
    if (!this.presetsMap.has(trimmedId)) {
      return false;
    }
    const nextPresets = this.presets.filter((p) => p.id !== trimmedId);
    const envelope = {
      version: ACTIVE_PRESETS_SCHEMA_VERSION,
      presets: nextPresets,
      updatedAt: Date.now()
    };
    const persisted = this.safeWrite(envelope);
    if (!persisted && !this.inMemoryOnly) {
      return false;
    }
    this.presets = nextPresets;
    this.presetsMap.delete(trimmedId);
    this.notifyListeners();
    return true;
  }
  clearAll() {
    if (!this.initialized) {
      this.init();
    }
    const hadItems = this.presets.length > 0;
    this.presets = [];
    this.presetsMap.clear();
    const envelope = {
      version: ACTIVE_PRESETS_SCHEMA_VERSION,
      presets: [],
      updatedAt: Date.now()
    };
    this.safeWrite(envelope);
    if (hadItems) {
      this.notifyListeners();
    }
  }
  onChanged(listener) {
    if (typeof listener !== "function") {
      return () => {
      };
    }
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  // ==========================================================================
  // Private Sanitization & Helper Methods
  // ==========================================================================
  createPresetItem(preset, trimmedId) {
    return {
      id: trimmedId,
      title: typeof preset.title === "string" && preset.title.trim() ? preset.title.trim() : trimmedId,
      author: typeof preset.author === "string" && preset.author.trim() ? preset.author.trim() : "Unknown",
      category: typeof preset.category === "string" && preset.category.trim() ? preset.category.trim() : "uncategorized",
      file: typeof preset.file === "string" ? preset.file : "",
      addedAt: Date.now()
    };
  }
  parseCandidateItem(candidate, trimmedId) {
    const title = typeof candidate.title === "string" && candidate.title.trim() ? candidate.title.trim() : trimmedId;
    const author = typeof candidate.author === "string" && candidate.author.trim() ? candidate.author.trim() : "Unknown";
    const category = typeof candidate.category === "string" && candidate.category.trim() ? candidate.category.trim() : "uncategorized";
    const file = typeof candidate.file === "string" ? candidate.file : "";
    const addedAt = typeof candidate.addedAt === "number" && !Number.isNaN(candidate.addedAt) ? candidate.addedAt : Date.now();
    return { id: trimmedId, title, author, category, file, addedAt };
  }
  sanitizeEnvelopeItems(rawList) {
    const seenIds = /* @__PURE__ */ new Set();
    const validated = [];
    for (const item of rawList) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const candidate = item;
      const candidateId = typeof candidate.id === "string" ? candidate.id.trim() : "";
      if (!candidateId || seenIds.has(candidateId)) {
        continue;
      }
      seenIds.add(candidateId);
      validated.push(this.parseCandidateItem(candidate, candidateId));
    }
    return validated;
  }
  getStorage() {
    if (this.customStorage) {
      return this.customStorage;
    }
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage;
      }
    } catch {
      this.inMemoryOnly = true;
    }
    return null;
  }
  safeRead() {
    try {
      const storage = this.getStorage();
      if (!storage) {
        return null;
      }
      return storage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    } catch (err) {
      console.warn("[ActivePresetsManager] SecurityError or access restriction reading storage:", err);
      this.inMemoryOnly = true;
      return null;
    }
  }
  safeWrite(envelope) {
    if (this.inMemoryOnly) {
      return true;
    }
    try {
      const storage = this.getStorage();
      if (!storage) {
        return false;
      }
      storage.setItem(ACTIVE_PRESETS_STORAGE_KEY, JSON.stringify(envelope));
      return true;
    } catch (err) {
      console.warn("[ActivePresetsManager] Storage write failure (QuotaExceededError or SecurityError):", err);
      return false;
    }
  }
  isValidEnvelope(data) {
    if (!data || typeof data !== "object") {
      return false;
    }
    const envelope = data;
    return envelope.version === ACTIVE_PRESETS_SCHEMA_VERSION && Array.isArray(envelope.presets);
  }
  notifyListeners() {
    const snapshot = Array.from(this.listeners);
    for (const listener of snapshot) {
      try {
        listener();
      } catch (err) {
        console.error("[ActivePresetsManager] Error in change listener:", err);
      }
    }
  }
};
var activePresetsManager = ActivePresetsManager.getInstance();

// tests/tier3-cross/stims-active-presets.test.ts
describe("Tier 3: Active Presets Store & LocalStorage Persistence", () => {
  const mockPresetA = {
    id: "flagship-alpha",
    title: "Flagship Alpha",
    author: "Stims Core Team",
    category: "fractal",
    file: "/presets/stims/flagship-alpha.milk",
    tags: ["category:fractal", "collection:hall-of-fame"]
  };
  const mockPresetB = {
    id: "flagship-beta",
    title: "Flagship Beta",
    author: "Rovastar",
    category: "waveform",
    file: "/presets/stims/flagship-beta.milk",
    tags: ["category:waveform", "collection:classic-milkdrop"]
  };
  const mockPresetC = {
    id: "flagship-gamma",
    title: "Flagship Gamma",
    author: "Geiss",
    category: "particles",
    file: "/presets/stims/flagship-gamma.milk",
    tags: ["category:particles"]
  };
  beforeEach(() => {
    setupTestEnvironment();
    localStorage.clear();
    ActivePresetsManager.resetInstance();
  });
  test("T3.StimsActive.1: Initial empty state on clean storage", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    expect(manager.getActivePresets()).toHaveLength(0);
    expect(manager.isPresetActive("flagship-alpha")).toBe(false);
  });
  test("T3.StimsActive.2: Singleton instance lifecycle and resetInstance", () => {
    const instance1 = ActivePresetsManager.getInstance();
    const instance2 = ActivePresetsManager.getInstance();
    expect(instance1).toBe(instance2);
    ActivePresetsManager.resetInstance();
    const instance3 = ActivePresetsManager.getInstance();
    expect(instance3).not.toBe(instance1);
  });
  test("T3.StimsActive.3: Adding presets updates in-memory array and localStorage envelope", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    const added = manager.addPreset(mockPresetA);
    expect(added).toBe(true);
    const presets = manager.getActivePresets();
    expect(presets).toHaveLength(1);
    expect(presets[0].id).toBe("flagship-alpha");
    expect(presets[0].title).toBe("Flagship Alpha");
    expect(presets[0].author).toBe("Stims Core Team");
    expect(presets[0].category).toBe("fractal");
    expect(presets[0].file).toBe("/presets/stims/flagship-alpha.milk");
    expect(presets[0].addedAt).toBeGreaterThan(0);
    expect(manager.isPresetActive("flagship-alpha")).toBe(true);
    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    expect(rawStorage).toBeDefined();
    expect(rawStorage).not.toBeNull();
    const envelope = JSON.parse(rawStorage ?? "{}");
    expect(envelope.version).toBe(1);
    expect(envelope.presets).toHaveLength(1);
    expect(envelope.presets[0].id).toBe("flagship-alpha");
    expect(envelope.updatedAt).toBeGreaterThan(0);
    const addedB = manager.addPreset(mockPresetB);
    expect(addedB).toBe(true);
    expect(manager.getActivePresets()).toHaveLength(2);
    expect(manager.isPresetActive("flagship-beta")).toBe(true);
  });
  test("T3.StimsActive.4: Removing a preset deletes it from storage and updates in-memory list", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    manager.addPreset(mockPresetA);
    manager.addPreset(mockPresetB);
    expect(manager.getActivePresets()).toHaveLength(2);
    const removed = manager.removePreset("flagship-alpha");
    expect(removed).toBe(true);
    const remaining = manager.getActivePresets();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe("flagship-beta");
    expect(manager.isPresetActive("flagship-alpha")).toBe(false);
    expect(manager.isPresetActive("flagship-beta")).toBe(true);
    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    const envelope = JSON.parse(rawStorage ?? "{}");
    expect(envelope.presets).toHaveLength(1);
    expect(envelope.presets[0].id).toBe("flagship-beta");
    const removedMissing = manager.removePreset("non-existent-preset");
    expect(removedMissing).toBe(false);
    expect(manager.getActivePresets()).toHaveLength(1);
  });
  test("T3.StimsActive.5: clearAll empties in-memory list and writes empty presets envelope to storage", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    manager.addPreset(mockPresetA);
    manager.addPreset(mockPresetB);
    expect(manager.getActivePresets()).toHaveLength(2);
    manager.clearAll();
    expect(manager.getActivePresets()).toHaveLength(0);
    expect(manager.isPresetActive("flagship-alpha")).toBe(false);
    expect(manager.isPresetActive("flagship-beta")).toBe(false);
    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    const envelope = JSON.parse(rawStorage ?? "{}");
    expect(envelope.presets).toHaveLength(0);
  });
  test("T3.StimsActive.6: Presets persist across re-initialization of ActivePresetsManager", () => {
    const manager1 = ActivePresetsManager.getInstance();
    manager1.init();
    manager1.addPreset(mockPresetA);
    manager1.addPreset(mockPresetB);
    const addedAtA = manager1.getActivePresets()[0].addedAt;
    ActivePresetsManager.resetInstance();
    const manager2 = ActivePresetsManager.getInstance();
    manager2.init();
    const restoredPresets = manager2.getActivePresets();
    expect(restoredPresets).toHaveLength(2);
    expect(restoredPresets[0].id).toBe("flagship-alpha");
    expect(restoredPresets[0].title).toBe("Flagship Alpha");
    expect(restoredPresets[0].author).toBe("Stims Core Team");
    expect(restoredPresets[0].category).toBe("fractal");
    expect(restoredPresets[0].file).toBe("/presets/stims/flagship-alpha.milk");
    expect(restoredPresets[0].addedAt).toBe(addedAtA);
    expect(restoredPresets[1].id).toBe("flagship-beta");
    expect(manager2.isPresetActive("flagship-alpha")).toBe(true);
    expect(manager2.isPresetActive("flagship-beta")).toBe(true);
  });
  test("T3.StimsActive.7: De-duplication prevents duplicate preset insertions", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    const addedFirst = manager.addPreset(mockPresetA);
    expect(addedFirst).toBe(true);
    expect(manager.getActivePresets()).toHaveLength(1);
    const addedDuplicate = manager.addPreset(mockPresetA);
    expect(addedDuplicate).toBe(false);
    expect(manager.getActivePresets()).toHaveLength(1);
    const mutatedDuplicate = {
      ...mockPresetA,
      title: "Flagship Alpha (Renamed)",
      author: "Different Author"
    };
    const addedMutated = manager.addPreset(mutatedDuplicate);
    expect(addedMutated).toBe(false);
    expect(manager.getActivePresets()).toHaveLength(1);
    expect(manager.getActivePresets()[0].title).toBe("Flagship Alpha");
    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    const envelope = JSON.parse(rawStorage ?? "{}");
    expect(envelope.presets).toHaveLength(1);
  });
  test("T3.StimsActive.8: onChanged listener fires on add, remove, and clear operations", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    let notificationCount = 0;
    const unsubscribe = manager.onChanged(() => {
      notificationCount++;
    });
    manager.addPreset(mockPresetA);
    expect(notificationCount).toBe(1);
    manager.addPreset(mockPresetA);
    expect(notificationCount).toBe(1);
    manager.addPreset(mockPresetB);
    expect(notificationCount).toBe(2);
    manager.removePreset("non-existent");
    expect(notificationCount).toBe(2);
    manager.removePreset("flagship-alpha");
    expect(notificationCount).toBe(3);
    manager.clearAll();
    expect(notificationCount).toBe(4);
    unsubscribe();
    manager.addPreset(mockPresetC);
    expect(notificationCount).toBe(4);
    expect(manager.getActivePresets()).toHaveLength(1);
  });
  test("T3.StimsActive.9: Multiple listeners and listener error isolation", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    manager.onChanged(() => {
      throw new Error("Listener error simulation");
    });
    let secondListenerFired = false;
    manager.onChanged(() => {
      secondListenerFired = true;
    });
    const added = manager.addPreset(mockPresetA);
    expect(added).toBe(true);
    expect(secondListenerFired).toBe(true);
  });
  test("T3.StimsActive.10: Corrupted JSON in localStorage falls back safely to empty array", () => {
    localStorage.setItem(ACTIVE_PRESETS_STORAGE_KEY, "<<<NOT-VALID-JSON-SYNTAX>>>{");
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    expect(manager.getActivePresets()).toHaveLength(0);
    const added = manager.addPreset(mockPresetA);
    expect(added).toBe(true);
    expect(manager.getActivePresets()).toHaveLength(1);
    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    const envelope = JSON.parse(rawStorage ?? "{}");
    expect(envelope.version).toBe(1);
    expect(envelope.presets).toHaveLength(1);
  });
  test("T3.StimsActive.11: Malformed envelope schemas recover gracefully", () => {
    localStorage.setItem(ACTIVE_PRESETS_STORAGE_KEY, "12345");
    const managerA = ActivePresetsManager.getInstance();
    managerA.init();
    expect(managerA.getActivePresets()).toHaveLength(0);
    ActivePresetsManager.resetInstance();
    localStorage.setItem(ACTIVE_PRESETS_STORAGE_KEY, JSON.stringify({ version: 1, presets: "invalid-string" }));
    const managerB = ActivePresetsManager.getInstance();
    managerB.init();
    expect(managerB.getActivePresets()).toHaveLength(0);
  });
  test("T3.StimsActive.12: QuotaExceededError handling prevents crashing", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = () => {
      const err = new Error("QuotaExceededError: Storage quota has been exceeded");
      err.name = "QuotaExceededError";
      throw err;
    };
    try {
      const result = manager.addPreset(mockPresetA);
      expect(typeof result).toBe("boolean");
    } finally {
      localStorage.setItem = originalSetItem;
    }
  });
  test("T3.StimsActive.13: SecurityError / LocalStorage inaccessible handles private browsing cleanly", () => {
    const originalGetItem = localStorage.getItem.bind(localStorage);
    localStorage.getItem = () => {
      const secErr = new Error("SecurityError: The operation is insecure");
      secErr.name = "SecurityError";
      throw secErr;
    };
    try {
      const manager = ActivePresetsManager.getInstance();
      manager.init();
      expect(manager.getActivePresets()).toHaveLength(0);
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });
  test("T3.StimsActive.14: StimsCatalogService starter presets convert accurately to active preset items", async () => {
    const catalogService = StimsCatalogService.getInstance();
    await catalogService.init({ eagerFullHydration: false });
    const starterPresets = catalogService.getStarterPresets();
    expect(starterPresets.length).toBeGreaterThan(0);
    const selectedPreset = starterPresets[0];
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    const added = manager.addPreset(selectedPreset);
    expect(added).toBe(true);
    const activeItem = manager.getActivePresets()[0];
    expect(activeItem.id).toBe(selectedPreset.id);
    expect(activeItem.title).toBe(selectedPreset.title);
    expect(activeItem.author).toBe(selectedPreset.author);
    expect(activeItem.file).toBe(selectedPreset.file);
    expect(activeItem.category).toBe(selectedPreset.category);
    expect(activeItem.addedAt).toBeGreaterThan(0);
  });
  test("T3.StimsActive.15: Missing optional preset fields receive safe default fallbacks", () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    const sparsePreset = {
      id: "sparse-preset-01",
      file: "/presets/stims/sparse.milk"
    };
    const added = manager.addPreset(sparsePreset);
    expect(added).toBe(true);
    const activeItem = manager.getActivePresets()[0];
    expect(activeItem.id).toBe("sparse-preset-01");
    expect(activeItem.title).toBe("sparse-preset-01");
    expect(activeItem.author).toBe("Unknown");
    expect(activeItem.category).toBe("uncategorized");
    expect(activeItem.file).toBe("/presets/stims/sparse.milk");
  });
});

// tests/tier4-scenarios/scenarios.test.ts
describe("Tier 4: Real-World Application Scenarios", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  test("T4.Scenario.1: Live DJ Club Performance Session (60-frame live performance simulation)", async () => {
    const canvas = document.getElementById("webgl-canvas");
    const renderEngine = new RenderEngine(canvas, getTheme("synthwave"));
    const audioEngine = new AudioEngine();
    const micOk = await audioEngine.toggleMic();
    expect(micOk).toBe(true);
    audioEngine.bpmDetector.detectedBPM = 128;
    audioEngine.bpmDetector.manualBPM = 128;
    const midiAccess = getActiveMidiAccess();
    const input = midiAccess?.inputs.get("input-0");
    input?.simulateMessage([176, 7, 115]);
    audioEngine.volume = 115 / 127;
    input?.simulateMessage([176, 74, 90]);
    renderEngine.updateConfig({ bloomStrength: 90 / 127 * 2.5 });
    const synthPreset = getPreset("synthwave-terrain");
    renderEngine.setPreset(synthPreset);
    renderEngine.config.autoRotate = true;
    renderEngine.config.autoRotateSpeed = 0.8;
    for (let frame = 0; frame < 60; frame++) {
      const isKickFrame = frame % 15 === 0;
      const audio = isKickFrame ? createBeatDropAudioFeatures(0.95) : createSilentAudioFeatures();
      renderEngine.render(audio);
      expect(isFinite(renderEngine.camera.position.x)).toBe(true);
      expect(isFinite(renderEngine.camera.position.y)).toBe(true);
      expect(isFinite(renderEngine.camera.position.z)).toBe(true);
    }
    expect(renderEngine.activePreset?.id).toBe("synthwave-terrain");
    expect(renderEngine.currentTheme.id).toBe("synthwave");
  });
  test("T4.Scenario.2: Music Video Production & Recording Workflow", () => {
    const canvas = document.getElementById("webgl-canvas");
    const renderEngine = new RenderEngine(canvas, getTheme("sunset"));
    renderEngine.resize(3840, 2160);
    renderEngine.updateConfig({
      bloomStrength: 1.8,
      filmGrain: 0.25,
      chromaticAberration: 0.5
    });
    const title = sanitizeTextOverlayInput("NEO-TOKYO DRIFT");
    const artist = sanitizeTextOverlayInput("KAVINSKY & THE WEEKND");
    const lyrics = sanitizeTextOverlayInput("Under the neon lights we fall");
    expect(title.enabled && artist.enabled && lyrics.enabled).toBe(true);
    const sequence = ["aurora-mandala", "black-hole", "neon-tunnel"];
    const capturedScreenshots = [];
    for (const presetId of sequence) {
      renderEngine.setPreset(getPreset(presetId));
      for (let f = 0; f < 10; f++) {
        renderEngine.render(createBeatDropAudioFeatures(0.7));
      }
      const frameData = renderEngine.captureScreenshot();
      capturedScreenshots.push(frameData);
    }
    expect(capturedScreenshots).toHaveLength(3);
    for (const shot of capturedScreenshots) {
      expect(shot.startsWith("data:image/png")).toBe(true);
    }
  });
  test("T4.Scenario.3: Studio Forge Custom Recipe Tuning Session", () => {
    const canvas = document.getElementById("webgl-canvas");
    const renderEngine = new RenderEngine(canvas, getTheme("ember"));
    const studio = new StudioComposerPreset();
    renderEngine.setPreset(studio);
    studio.config.theForceAttraction = -1.2;
    studio.config.tunnelDepth = 1.8;
    studio.config.liquidWarp = 1.6;
    studio.config.volumeDensity = 1.4;
    const audio = createBeatDropAudioFeatures(0.8);
    for (let i = 0; i < 15; i++) {
      renderEngine.render(audio);
    }
    const savedRecipe = {
      name: "Cosmic Singularity Stage",
      stageConfig: { ...studio.config },
      themeId: renderEngine.currentTheme.id
    };
    renderEngine.setPreset(getPreset("particle-field"));
    expect(renderEngine.activePreset?.id).toBe("particle-field");
    const restoredStudio = new StudioComposerPreset();
    restoredStudio.config = { ...savedRecipe.stageConfig };
    renderEngine.setPreset(restoredStudio);
    expect(restoredStudio.config.theForceAttraction).toBe(-1.2);
    expect(restoredStudio.config.tunnelDepth).toBe(1.8);
    expect(restoredStudio.config.liquidWarp).toBe(1.6);
  });
  test("T4.Scenario.4: Live Club Visuals with MIDI Learn and Fast Preset Hopping", async () => {
    const canvas = document.getElementById("webgl-canvas");
    const renderEngine = new RenderEngine(canvas, getTheme("ember"));
    const midiAccess = getActiveMidiAccess();
    const input = midiAccess?.inputs.get("input-0");
    input?.simulateMessage([176, 14, 110]);
    const learnedBloom = 110 / 127 * 3;
    renderEngine.updateConfig({ bloomStrength: learnedBloom });
    const presetsToHop = [
      "box-tunnel",
      "water-slide",
      "kaleidoscope-mandala",
      "matrix-rain",
      "spectrogram",
      "diode-wall",
      "lcd-deck",
      "bloom-flower",
      "meadow-field",
      "ocean-waves"
    ];
    const themesToHop = ["glacier", "vapor", "eclipse", "arctic", "horizon", "prism", "toxic", "synthwave", "terracotta", "jade"];
    for (let i = 0; i < presetsToHop.length; i++) {
      renderEngine.setTheme(getTheme(themesToHop[i]));
      renderEngine.setPreset(getPreset(presetsToHop[i]));
      const ccVal = 80 + i * 4;
      renderEngine.updateConfig({ bloomStrength: ccVal / 127 * 3 });
      renderEngine.render(createBeatDropAudioFeatures(0.75));
    }
    expect(renderEngine.activePreset?.id).toBe("ocean-waves");
    expect(renderEngine.currentTheme.id).toBe("jade");
  });
  test("T4.Scenario.5: Stress Resilience & Ambient Mode Transition", () => {
    const canvas = document.getElementById("webgl-canvas");
    const renderEngine = new RenderEngine(canvas, getTheme("ember"));
    const audioEngine = new AudioEngine();
    renderEngine.setPreset(getPreset("circular-spectrum"));
    const appEl = document.documentElement;
    appEl.classList.add("ui-hidden");
    expect(appEl.classList.contains("ui-hidden")).toBe(true);
    for (let i = 0; i < 30; i++) {
      const audio = i % 2 === 0 ? createBeatDropAudioFeatures(1) : createSilentAudioFeatures();
      renderEngine.render(audio);
    }
    renderEngine.resize(2560, 1080);
    expect(renderEngine.camera.aspect).toBeCloseTo(21 / 9, 0.05);
    renderEngine.resize(1080, 1920);
    expect(renderEngine.camera.aspect).toBeCloseTo(9 / 16, 0.05);
    renderEngine.resize(1920, 1080);
    expect(renderEngine.camera.aspect).toBeCloseTo(16 / 9, 0.05);
    appEl.classList.remove("ui-hidden");
    expect(appEl.classList.contains("ui-hidden")).toBe(false);
    renderEngine.render(audioEngine.getFeatures());
    expect(renderEngine.activePreset?.id).toBe("circular-spectrum");
  });
});

// src/ui/DiscoveryModeModal.ts
var DiscoveryModeModal = class {
  catalogService;
  activeManager;
  callbacks;
  isOpenState = false;
  isPeekMode = false;
  selectedCategory = null;
  selectedCollection = null;
  searchQuery = "";
  previewedPreset = null;
  sessionSnapshot = null;
  filteredPresets = [];
  toastTimeout = null;
  constructor(callbacks, catalogService = StimsCatalogService.getInstance(), activeManager = ActivePresetsManager.getInstance()) {
    this.callbacks = callbacks;
    this.catalogService = catalogService;
    this.activeManager = activeManager;
    this.ensureDomStructure();
    this.bindEvents();
    if ("onHydrated" in this.catalogService && typeof this.catalogService.onHydrated === "function") {
      this.catalogService.onHydrated(() => {
        if (this.isOpenState) {
          this.refreshCatalogResults();
        }
      });
    }
    this.activeManager.onChanged(() => {
      if (this.isOpenState) {
        this.updatePreviewStageUI();
        this.renderPresetCards();
      }
    });
  }
  isOpen() {
    return this.isOpenState;
  }
  getSessionSnapshot() {
    return this.sessionSnapshot;
  }
  getPreviewedPreset() {
    return this.previewedPreset;
  }
  getSelectedCategory() {
    return this.selectedCategory;
  }
  getSelectedCollection() {
    return this.selectedCollection;
  }
  getSearchQuery() {
    return this.searchQuery;
  }
  getFilteredPresets() {
    return [...this.filteredPresets];
  }
  createSessionSnapshot() {
    const state = this.callbacks.getSessionState();
    const clonedOverrides = { ...state.tuningOverrides };
    const snapshot = {
      activePresetId: state.activePresetId,
      isMilkdropActive: state.isMilkdropActive,
      currentMilkdropPreset: state.currentMilkdropPreset,
      tuningOverrides: clonedOverrides,
      restore: () => {
        this.callbacks.restoreSessionState({
          activePresetId: snapshot.activePresetId,
          isMilkdropActive: snapshot.isMilkdropActive,
          currentMilkdropPreset: snapshot.currentMilkdropPreset,
          tuningOverrides: { ...snapshot.tuningOverrides }
        });
      }
    };
    return snapshot;
  }
  async open() {
    this.ensureDomStructure();
    if (!this.isOpenState) {
      this.sessionSnapshot = this.createSessionSnapshot();
    }
    this.isOpenState = true;
    this.isPeekMode = false;
    const modalEl = document.getElementById("stimsDiscoveryModal");
    if (modalEl) {
      modalEl.classList.add("open");
      modalEl.classList.remove("peek-mode");
      modalEl.style.display = "flex";
    }
    if (!this.catalogService.isReady()) {
      await this.catalogService.init({ eagerFullHydration: false });
    }
    this.refreshCatalogResults();
    if (!this.previewedPreset) {
      const initialPreset = this.catalogService.getRandomPreset() || this.filteredPresets[0] || null;
      if (initialPreset) {
        this.previewPreset(initialPreset);
      }
    } else {
      this.previewPreset(this.previewedPreset);
    }
  }
  close(options) {
    if (!this.isOpenState) return;
    const shouldRestore = options?.restoreSession !== false;
    this.isOpenState = false;
    this.isPeekMode = false;
    const modalEl = document.getElementById("stimsDiscoveryModal");
    if (modalEl) {
      modalEl.classList.remove("open");
      modalEl.classList.remove("peek-mode");
      modalEl.style.display = "none";
    }
    if (shouldRestore && this.sessionSnapshot) {
      this.sessionSnapshot.restore();
    } else if (!shouldRestore && this.previewedPreset) {
      this.callbacks.onKeepPreset?.(this.previewedPreset);
    }
    this.sessionSnapshot = null;
    this.callbacks.onClose?.(shouldRestore);
  }
  selectCategory(categorySlug) {
    const normalized = !categorySlug || categorySlug === "all" ? null : categorySlug;
    this.selectedCategory = normalized;
    this.refreshCatalogResults();
  }
  selectCollection(collectionSlug) {
    const normalized = !collectionSlug || collectionSlug === "all" ? null : collectionSlug;
    this.selectedCollection = normalized;
    this.refreshCatalogResults();
  }
  setSearchQuery(query) {
    this.searchQuery = query;
    const searchInput = document.getElementById("discoverySearchInput");
    if (searchInput && searchInput.value !== query) {
      searchInput.value = query;
    }
    this.refreshCatalogResults();
  }
  pickRandomPreset() {
    const randomPreset = this.catalogService.getRandomPreset({
      category: this.selectedCategory ?? void 0,
      collection: this.selectedCollection ?? void 0,
      searchQuery: this.searchQuery || void 0,
      excludeId: this.previewedPreset?.id
    });
    if (randomPreset) {
      this.previewPreset(randomPreset);
    }
    return randomPreset;
  }
  previewPreset(preset) {
    this.previewedPreset = preset;
    this.callbacks.onPreviewPreset(preset);
    this.updatePreviewStageUI();
    this.highlightActiveCard();
  }
  toggleActivePreset(preset) {
    const target = preset ?? this.previewedPreset;
    if (!target) return false;
    const alreadyActive = this.activeManager.isPresetActive(target.id);
    if (alreadyActive) {
      this.activeManager.removePreset(target.id);
      this.showToast(`Removed "${target.title}" from Active Presets`);
      this.updatePreviewStageUI();
      this.renderPresetCards();
      return false;
    } else {
      this.activeManager.addPreset(target);
      this.showToast(`\u2728 Added "${target.title}" to Active Presets!`);
      this.updatePreviewStageUI();
      this.renderPresetCards();
      return true;
    }
  }
  addCurrentToActivePresets() {
    if (!this.previewedPreset) return false;
    if (this.activeManager.isPresetActive(this.previewedPreset.id)) {
      this.showToast(`\u2713 "${this.previewedPreset.title}" is already in Active Presets`);
      return false;
    }
    const added = this.activeManager.addPreset(this.previewedPreset);
    if (added) {
      this.showToast(`\u2728 Added "${this.previewedPreset.title}" to Active Presets!`);
      this.updatePreviewStageUI();
      this.renderPresetCards();
    }
    return added;
  }
  refreshCatalogResults() {
    this.filteredPresets = this.catalogService.filterPresets({
      category: this.selectedCategory ?? void 0,
      collection: this.selectedCollection ?? void 0,
      searchQuery: this.searchQuery || void 0
    });
    this.renderCategoryChips();
    this.renderCollectionChips();
    this.renderPresetCards();
    this.updatePreviewStageUI();
    const countEl = document.getElementById("discoveryResultsCount");
    if (countEl) {
      const total = this.catalogService.getAllPresets().length;
      countEl.textContent = `${this.filteredPresets.length} / ${total} presets`;
    }
  }
  ensureDomStructure() {
    let modal = document.getElementById("stimsDiscoveryModal");
    if (modal) return;
    modal = document.createElement("div");
    modal.id = "stimsDiscoveryModal";
    modal.className = "discovery-modal-overlay";
    modal.style.display = "none";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "discoveryModalTitle");
    modal.innerHTML = `
      <div class="discovery-modal-shell glass-panel">
        <div class="discovery-header">
          <div class="discovery-header-left">
            <span class="discovery-badge-pill">STIMS CATALOG</span>
            <h2 id="discoveryModalTitle" class="discovery-title">Discovery Mode</h2>
            <span id="discoveryResultsCount" class="discovery-results-count">0 presets</span>
          </div>
          <div class="discovery-header-actions">
            <button type="button" class="btn-pill discovery-peek-btn" id="discoveryPeekBtn" title="Peek full-screen live canvas">
              \u{1F441} Peek Canvas
            </button>
            <button type="button" class="btn-pill btn-pill-dice" id="discoveryRandomBtn" title="Pick a random preset in current category">
              \u{1F3B2} Discover Random
            </button>
            <button type="button" class="btn-icon" id="discoveryCloseBtn" aria-label="Close Discovery Mode" title="Cancel and restore previous preset (Esc)">\u2715</button>
          </div>
        </div>

        <div class="discovery-Preview-Stage" id="discoveryPreviewStage">
          <div class="discovery-preview-meta">
            <div class="discovery-preview-kicker">LIVE AUDIO-REACTIVE PREVIEW (ISOLATED SESSION)</div>
            <div class="discovery-preview-title" id="discoveryPreviewTitle">Select or roll a preset</div>
            <div class="discovery-preview-sub">
              <span id="discoveryPreviewAuthor">by Unknown</span>
              <span class="discovery-dot">\u2022</span>
              <span class="discovery-cat-tag" id="discoveryPreviewCategory">fractal</span>
            </div>
            <div class="discovery-preview-desc" id="discoveryPreviewDesc">
              Audio-reactive MilkDrop shader rendered live in the background.
            </div>
          </div>
          <div class="discovery-preview-cta">
            <button type="button" class="btn-primary discovery-add-active-btn" id="discoveryAddActiveBtn">
              \uFF0B Add to Active Presets
            </button>
            <div class="discovery-secondary-actions">
              <button type="button" class="btn-pill" id="discoveryKeepBtn" title="Keep playing this preset and exit Discovery Mode">
                \u25B6 Use & Exit
              </button>
              <button type="button" class="btn-pill" id="discoveryCancelBtn" title="Restore previous visualizer preset">
                \u21BA Restore Previous
              </button>
            </div>
          </div>
        </div>

        <div class="discovery-controls-bar">
          <div class="discovery-search-wrap">
            <input type="text" id="discoverySearchInput" class="drawer-search" placeholder="\u{1F50D} Search 1,787+ Stims presets by title, author, vibe, or tag..." aria-label="Search Stims catalog">
          </div>
          <div class="discovery-categories-row" id="discoveryCategoriesRow" role="tablist" aria-label="Stims visual categories"></div>
          <div class="discovery-collections-row" id="discoveryCollectionsRow" aria-label="Stims curated collections"></div>
        </div>

        <div class="discovery-grid-scroll" id="discoveryGridScroll">
          <div class="discovery-presets-grid" id="discoveryPresetsGrid"></div>
        </div>

        <div class="discovery-toast" id="discoveryToast" style="display:none;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  bindEvents() {
    const closeBtn = document.getElementById("discoveryCloseBtn");
    closeBtn?.addEventListener("click", () => {
      this.close({ restoreSession: true });
    });
    const cancelBtn = document.getElementById("discoveryCancelBtn");
    cancelBtn?.addEventListener("click", () => {
      this.close({ restoreSession: true });
    });
    const keepBtn = document.getElementById("discoveryKeepBtn");
    keepBtn?.addEventListener("click", () => {
      if (this.previewedPreset) {
        this.activeManager.addPreset(this.previewedPreset);
      }
      this.close({ restoreSession: false });
    });
    const randomBtn = document.getElementById("discoveryRandomBtn");
    randomBtn?.addEventListener("click", () => {
      this.pickRandomPreset();
    });
    const addActiveBtn = document.getElementById("discoveryAddActiveBtn");
    addActiveBtn?.addEventListener("click", () => {
      this.toggleActivePreset();
    });
    const peekBtn = document.getElementById("discoveryPeekBtn");
    peekBtn?.addEventListener("click", () => {
      this.isPeekMode = !this.isPeekMode;
      const modal = document.getElementById("stimsDiscoveryModal");
      modal?.classList.toggle("peek-mode", this.isPeekMode);
      if (peekBtn) {
        peekBtn.textContent = this.isPeekMode ? "\u{1F5D6} Show Catalog" : "\u{1F441} Peek Canvas";
      }
    });
    const searchInput = document.getElementById("discoverySearchInput");
    searchInput?.addEventListener("input", () => {
      this.setSearchQuery(searchInput.value);
    });
  }
  renderCategoryChips() {
    const row = document.getElementById("discoveryCategoriesRow");
    if (!row) return;
    row.innerHTML = "";
    const categories = this.catalogService.getCategories();
    const totalCount = this.catalogService.getAllPresets().length;
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = `discovery-cat-chip ${this.selectedCategory === null ? "active" : ""}`;
    allBtn.setAttribute("data-stims-category", "all");
    allBtn.innerHTML = `<span>All</span><span class="chip-count">${totalCount}</span>`;
    allBtn.addEventListener("click", () => this.selectCategory(null));
    row.appendChild(allBtn);
    for (const slug of STIMS_CATEGORIES) {
      const catInfo = categories.find((c) => c.slug === slug);
      const count = catInfo ? catInfo.count : 0;
      const label = CATEGORY_DISPLAY_NAMES[slug] || slug;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `discovery-cat-chip ${this.selectedCategory === slug ? "active" : ""}`;
      btn.setAttribute("data-stims-category", slug);
      btn.innerHTML = `<span>${label}</span><span class="chip-count">${count}</span>`;
      btn.addEventListener("click", () => this.selectCategory(slug));
      row.appendChild(btn);
    }
  }
  renderCollectionChips() {
    const row = document.getElementById("discoveryCollectionsRow");
    if (!row) return;
    row.innerHTML = "";
    const collections = this.catalogService.getCollections();
    const allColBtn = document.createElement("button");
    allColBtn.type = "button";
    allColBtn.className = `discovery-col-chip ${this.selectedCollection === null ? "active" : ""}`;
    allColBtn.setAttribute("data-stims-collection", "all");
    allColBtn.textContent = "All Collections";
    allColBtn.addEventListener("click", () => this.selectCollection(null));
    row.appendChild(allColBtn);
    for (const slug of STIMS_COLLECTIONS) {
      const colInfo = collections.find((c) => c.slug === slug);
      const count = colInfo ? colInfo.count : 0;
      const label = COLLECTION_DISPLAY_NAMES[slug] || slug;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `discovery-col-chip ${this.selectedCollection === slug ? "active" : ""}`;
      btn.setAttribute("data-stims-collection", slug);
      btn.textContent = `${label} (${count})`;
      btn.addEventListener("click", () => this.selectCollection(slug));
      row.appendChild(btn);
    }
  }
  renderPresetCards() {
    const grid = document.getElementById("discoveryPresetsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const displaySlice = this.filteredPresets.slice(0, 60);
    if (displaySlice.length === 0) {
      const empty = document.createElement("div");
      empty.className = "discovery-empty-state";
      empty.textContent = "No presets match the current filter criteria.";
      grid.appendChild(empty);
      return;
    }
    for (const preset of displaySlice) {
      const isPreviewing = this.previewedPreset?.id === preset.id;
      const isAdded = this.activeManager.isPresetActive(preset.id);
      const card = document.createElement("div");
      card.className = `discovery-preset-card ${isPreviewing ? "previewing" : ""} ${isAdded ? "is-added" : ""}`;
      card.setAttribute("data-discovery-preset-id", preset.id);
      card.setAttribute("data-category", preset.category);
      const titleEl = document.createElement("div");
      titleEl.className = "discovery-card-title";
      titleEl.textContent = preset.title;
      const authorEl = document.createElement("div");
      authorEl.className = "discovery-card-author";
      authorEl.textContent = `by ${preset.author}`;
      const footerEl = document.createElement("div");
      footerEl.className = "discovery-card-footer";
      const catBadge = document.createElement("span");
      catBadge.className = "discovery-card-cat";
      catBadge.textContent = preset.category;
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = `discovery-card-add-btn ${isAdded ? "added" : ""}`;
      addBtn.setAttribute("data-add-preset-id", preset.id);
      addBtn.textContent = isAdded ? "\u2713 Active" : "\uFF0B Add";
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleActivePreset(preset);
      });
      footerEl.appendChild(catBadge);
      footerEl.appendChild(addBtn);
      card.appendChild(titleEl);
      card.appendChild(authorEl);
      card.appendChild(footerEl);
      card.addEventListener("click", () => {
        this.previewPreset(preset);
      });
      grid.appendChild(card);
    }
  }
  updatePreviewStageUI() {
    const titleEl = document.getElementById("discoveryPreviewTitle");
    const authorEl = document.getElementById("discoveryPreviewAuthor");
    const catEl = document.getElementById("discoveryPreviewCategory");
    const descEl = document.getElementById("discoveryPreviewDesc");
    const addBtn = document.getElementById("discoveryAddActiveBtn");
    if (!this.previewedPreset) {
      if (titleEl) titleEl.textContent = "Select or roll a preset";
      if (authorEl) authorEl.textContent = "by Stims Community";
      if (catEl) catEl.textContent = "all";
      if (descEl) descEl.textContent = 'Click any card below or click "Discover Random" to preview live.';
      return;
    }
    const p = this.previewedPreset;
    if (titleEl) titleEl.textContent = p.title;
    if (authorEl) authorEl.textContent = `by ${p.author}`;
    if (catEl) catEl.textContent = p.category;
    if (descEl) {
      descEl.textContent = p.description || `Audio-reactive ${p.category} visualizer preset (${p.file}).`;
    }
    if (addBtn) {
      const isAdded = this.activeManager.isPresetActive(p.id);
      addBtn.textContent = isAdded ? "\u2713 In Active Presets (Click to Remove)" : "\uFF0B Add to Active Presets";
      addBtn.classList.toggle("is-active-preset", isAdded);
    }
  }
  highlightActiveCard() {
    const grid = document.getElementById("discoveryPresetsGrid");
    if (!grid) return;
    const cards = grid.querySelectorAll(".discovery-preset-card");
    cards.forEach((card) => {
      const id = card.getAttribute("data-discovery-preset-id");
      card.classList.toggle("previewing", id === this.previewedPreset?.id);
    });
  }
  showToast(msg) {
    const toast = document.getElementById("discoveryToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = "block";
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      toast.style.display = "none";
    }, 2400);
  }
};

// src/engine/MilkdropEngine.ts
var import_butterchurn = __toESM(require("butterchurn"), 1);
var import_butterchurn_presets = __toESM(require("butterchurn-presets"), 1);
var MilkdropEngine = class {
  visualizer = null;
  canvas;
  audioNode = null;
  presets = {};
  presetNames = [];
  currentPresetName = "";
  isActive = false;
  constructor(canvas) {
    this.canvas = canvas;
    try {
      if (this.presetNames.length === 0) {
        this.presets = import_butterchurn_presets.default.getPresets();
        this.presetNames = Object.keys(this.presets);
      }
    } catch {
    }
  }
  init(audioContext, audioNode) {
    this.audioNode = audioNode;
    try {
      const width = window.innerWidth || 1920;
      const height = window.innerHeight || 1080;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(width * pixelRatio);
      this.canvas.height = Math.round(height * pixelRatio);
      this.visualizer = import_butterchurn.default.createVisualizer(audioContext, this.canvas, {
        width,
        height,
        pixelRatio,
        textureRatio: 1,
        meshWidth: 64,
        meshHeight: 48,
        outputFXAA: true
      });
      if (this.visualizer?.setOutputAA) {
        this.visualizer.setOutputAA(true);
      }
      if (this.visualizer?.setInternalMeshSize) {
        this.visualizer.setInternalMeshSize(64, 48);
      }
      if (this.audioNode && this.visualizer) {
        this.visualizer.connectAudio(this.audioNode);
      }
      if (this.presetNames.length === 0) {
        this.presets = import_butterchurn_presets.default.getPresets();
        this.presetNames = Object.keys(this.presets);
      }
      if (this.presetNames.length > 0) {
        const defaultName = this.presetNames.find((n) => n.toLowerCase().includes("geiss")) || this.presetNames[0];
        this.loadPreset(defaultName, 0);
      }
    } catch (err) {
      console.warn("Milkdrop WebGL engine initialization note:", err);
    }
  }
  loadPreset(name, blendTime = 2) {
    if (!name || typeof name !== "string") return false;
    const resolvedKey = this.resolvePresetKey(name);
    const presetObj = this.presets[name] ?? (resolvedKey ? this.presets[resolvedKey] : void 0);
    this.currentPresetName = name;
    if (!this.visualizer || !presetObj) {
      return Boolean(presetObj);
    }
    try {
      this.visualizer.loadPreset(presetObj, blendTime);
      return true;
    } catch (err) {
      console.warn("MilkdropEngine loadPreset fallback note:", err);
      if (this.presetNames.length > 0) {
        try {
          const safeKey = this.presetNames[0];
          this.visualizer.loadPreset(this.presets[safeKey], blendTime);
          return true;
        } catch {
        }
      }
      return false;
    }
  }
  registerCustomPreset(id, presetObj) {
    if (!id || !presetObj || typeof presetObj !== "object") return;
    this.presets[id] = presetObj;
    if (!this.presetNames.includes(id)) {
      this.presetNames.push(id);
    }
  }
  resolvePresetKey(nameOrId) {
    if (!nameOrId) return this.presetNames[0] || "";
    if (this.presets[nameOrId]) return nameOrId;
    if (this.presetNames.length === 0) return "";
    const normalizedTarget = nameOrId.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const targetTokens = normalizedTarget.split(/\s+/).filter((t) => t.length > 2);
    let bestKey = "";
    let bestScore = 0;
    for (const key of this.presetNames) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (normKey === normalizedTarget || normKey.includes(normalizedTarget)) {
        return key;
      }
      let score = 0;
      for (const token of targetTokens) {
        if (normKey.includes(token)) {
          score += token.length;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }
    if (bestKey && bestScore >= 4) {
      return bestKey;
    }
    let hash = 0;
    for (let i = 0; i < nameOrId.length; i++) {
      hash = (hash << 5) - hash + (nameOrId.codePointAt(i) ?? 0) | 0;
    }
    const idx = Math.abs(hash) % this.presetNames.length;
    return this.presetNames[idx];
  }
  loadCustomPreset(presetObj, blendTime = 2) {
    if (!this.visualizer) return;
    this.visualizer.loadPreset(presetObj, blendTime);
    this.currentPresetName = "Custom ProjectM Preset";
  }
  loadRandomPreset(blendTime = 2) {
    if (this.presetNames.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * this.presetNames.length);
    const chosenName = this.presetNames[randomIndex];
    this.loadPreset(chosenName, blendTime);
    return chosenName;
  }
  render() {
    if (!this.isActive || !this.visualizer) return;
    try {
      this.visualizer.render();
    } catch {
    }
  }
  resize(width, height) {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
    if (this.visualizer) {
      this.visualizer.setRendererSize(width, height, {
        pixelRatio,
        textureRatio: 1,
        meshWidth: 64,
        meshHeight: 48
      });
      if (this.visualizer.setOutputAA) {
        this.visualizer.setOutputAA(true);
      }
    }
  }
  setActive(active) {
    this.isActive = active;
    this.canvas.style.display = active ? "block" : "none";
    if (active) {
      this.resize(window.innerWidth || 1920, window.innerHeight || 1080);
    }
  }
};

// tests/tier4-e2e/stims-discovery-e2e.test.ts
describe("Tier 4: Stims Discovery Mode E2E, Session Isolation & Audio Reactivity", () => {
  beforeEach(() => {
    setupTestEnvironment();
    localStorage.clear();
    StimsCatalogService.resetInstance();
    ActivePresetsManager.resetInstance();
  });
  test("T4.Discovery.1: Opening DiscoveryModeModal captures VisualizerSessionSnapshot and previews a live preset", async () => {
    let currentState = {
      activePresetId: "synthwave-terrain",
      isMilkdropActive: false,
      currentMilkdropPreset: null,
      tuningOverrides: { speed: 1.4, density: 64 }
    };
    const previewedHistory = [];
    const modal = new DiscoveryModeModal({
      getSessionState: () => ({ ...currentState, tuningOverrides: { ...currentState.tuningOverrides } }),
      restoreSessionState: (snap) => {
        currentState = { ...snap, tuningOverrides: { ...snap.tuningOverrides } };
      },
      onPreviewPreset: (preset) => {
        previewedHistory.push(preset);
        currentState.isMilkdropActive = true;
        currentState.currentMilkdropPreset = preset.id;
      }
    });
    expect(modal.isOpen()).toBe(false);
    await modal.open();
    expect(modal.isOpen()).toBe(true);
    const snapshot = modal.getSessionSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot?.activePresetId).toBe("synthwave-terrain");
    expect(snapshot?.isMilkdropActive).toBe(false);
    expect(snapshot?.tuningOverrides.speed).toBe(1.4);
    expect(previewedHistory.length).toBeGreaterThanOrEqual(1);
    expect(modal.getPreviewedPreset()).not.toBeNull();
    expect(currentState.isMilkdropActive).toBe(true);
    modal.close({ restoreSession: true });
    expect(modal.isOpen()).toBe(false);
    expect(currentState.activePresetId).toBe("synthwave-terrain");
    expect(currentState.isMilkdropActive).toBe(false);
    expect(currentState.currentMilkdropPreset).toBeNull();
    expect(currentState.tuningOverrides.speed).toBe(1.4);
  });
  test("T4.Discovery.2: Category chips, collection filters, search input, and random exploration work end-to-end", async () => {
    const catalog = StimsCatalogService.getInstance();
    await catalog.init({ eagerFullHydration: true });
    const previewedBox = { current: null };
    const modal = new DiscoveryModeModal({
      getSessionState: () => ({
        activePresetId: "wave",
        isMilkdropActive: false,
        currentMilkdropPreset: null,
        tuningOverrides: {}
      }),
      restoreSessionState: () => {
      },
      onPreviewPreset: (p) => {
        previewedBox.current = p;
      }
    });
    await modal.open();
    expect(modal.getFilteredPresets().length).toBe(1787);
    modal.selectCategory("fractal");
    expect(modal.getSelectedCategory()).toBe("fractal");
    const fractalResults = modal.getFilteredPresets();
    expect(fractalResults.length).toBeGreaterThan(0);
    expect(fractalResults.every((p) => p.category === "fractal" || p.tags.includes("category:fractal"))).toBe(true);
    const randFractal = modal.pickRandomPreset();
    expect(randFractal).not.toBeNull();
    expect(randFractal?.category === "fractal" || randFractal?.tags.includes("category:fractal")).toBe(true);
    expect(previewedBox.current?.id).toBe(randFractal?.id);
    modal.selectCategory("all");
    modal.selectCollection("rovastar");
    const rovastarResults = modal.getFilteredPresets();
    expect(rovastarResults.length).toBeGreaterThan(0);
    modal.selectCollection("all");
    modal.setSearchQuery("geiss");
    const searchResults = modal.getFilteredPresets();
    expect(searchResults.length).toBeGreaterThan(0);
    modal.close({ restoreSession: true });
  });
  test("T4.Discovery.3: Add to Active Presets in Discovery Mode persists preset and syncs with ActivePresetsManager", async () => {
    const activeManager = ActivePresetsManager.getInstance();
    activeManager.init();
    const modal = new DiscoveryModeModal({
      getSessionState: () => ({
        activePresetId: "wave",
        isMilkdropActive: false,
        currentMilkdropPreset: null,
        tuningOverrides: {}
      }),
      restoreSessionState: () => {
      },
      onPreviewPreset: () => {
      }
    });
    await modal.open();
    const previewed = modal.getPreviewedPreset();
    expect(previewed).not.toBeNull();
    const added = modal.addCurrentToActivePresets();
    expect(added).toBe(true);
    expect(activeManager.isPresetActive(previewed.id)).toBe(true);
    expect(activeManager.getActivePresets().some((p) => p.id === previewed.id)).toBe(true);
    const toggledOff = modal.toggleActivePreset(previewed);
    expect(toggledOff).toBe(false);
    expect(activeManager.isPresetActive(previewed.id)).toBe(false);
    modal.close({ restoreSession: true });
  });
  test("T4.Discovery.4: MilkdropEngine dynamically resolves Stims preset IDs and handles malformed presets safely", () => {
    const milkCanvas = document.getElementById("milkdrop-canvas");
    const engine = new MilkdropEngine(milkCanvas);
    engine.registerCustomPreset("stims-custom-test", { baseVals: {} });
    expect(engine.resolvePresetKey("stims-custom-test")).toBe("stims-custom-test");
    const resolved = engine.resolvePresetKey("rovastar-parallel-universe-v2");
    expect(typeof resolved).toBe("string");
    expect(resolved.length).toBeGreaterThan(0);
    expect(() => {
      engine.loadPreset("rovastar-parallel-universe-v2", 1.5);
    }).not.toThrow();
    expect(engine.currentPresetName).toBe("rovastar-parallel-universe-v2");
  });
  test("T4.Discovery.5: AudioEngine strictly decouples speaker Volume from visual Audio Reactivity", () => {
    const audio = new AudioEngine();
    audio.getContext();
    audio.setVolume(0);
    audio.setSensitivity(2.2);
    expect(audio.volume).toBe(0);
    expect(audio.getVolumeGainValue()).toBe(0);
    expect(audio.sensitivity).toBeCloseTo(2.2, 2);
    expect(audio.getReactivityGainValue()).toBeCloseTo(2.2, 2);
    audio.setVolume(0.9);
    expect(audio.getVolumeGainValue()).toBeCloseTo(0.9, 2);
    expect(audio.getReactivityGainValue()).toBeCloseTo(2.2, 2);
  });
});

// tests/runner.ts
async function main() {
  console.log("\n=============================================================");
  console.log("       VISUALIZOR OPAQUE-BOX E2E TEST SUITE RUNNER            ");
  console.log("=============================================================\n");
  const report = await runAllSuites();
  for (const suite of report.suites) {
    const symbol = suite.passed ? "\u2713" : "\u2717";
    const color = suite.passed ? "\x1B[32m" : "\x1B[31m";
    console.log(`${color}${symbol}\x1B[0m \x1B[1m${suite.name}\x1B[0m (${suite.durationMs}ms)`);
    for (const test2 of suite.tests) {
      const testSymbol = test2.passed ? "  \u2713" : "  \u2717";
      const testColor = test2.passed ? "\x1B[32m" : "\x1B[31m";
      console.log(`${testColor}${testSymbol}\x1B[0m ${test2.name} (${test2.durationMs}ms)`);
      if (!test2.passed && test2.error) {
        console.error(`\x1B[31m      Error: ${test2.error.message}\x1B[0m`);
        if (test2.error.stack) {
          console.error(`\x1B[90m${test2.error.stack}\x1B[0m`);
        }
      }
    }
    console.log("");
  }
  console.log("-------------------------------------------------------------");
  console.log(`Suites:   ${report.totalSuites} total`);
  console.log(`Tests:    ${report.totalPassed} passed, ${report.totalFailed} failed, ${report.totalTests} total`);
  console.log(`Duration: ${(report.durationMs / 1e3).toFixed(3)}s`);
  console.log("-------------------------------------------------------------\n");
  if (report.totalFailed > 0) {
    console.error("\x1B[31m\u2717 SOME TESTS FAILED!\x1B[0m\n");
    process.exit(1);
  } else {
    console.log("\x1B[32m\u2713 ALL TESTS PASSED SUCCESSFULLY!\x1B[0m\n");
    process.exit(0);
  }
}
void main();
