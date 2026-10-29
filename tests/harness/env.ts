// Headless DOM, WebGL, Web Audio, and Web MIDI environment harness for Visualizor

export class MockDOMTokenList {
  private readonly tokens = new Set<string>();

  constructor(initialTokens: string[] = []) {
    initialTokens.forEach(t => this.tokens.add(t));
  }

  add(...tokens: string[]): void {
    tokens.forEach(t => this.tokens.add(t));
  }

  remove(...tokens: string[]): void {
    tokens.forEach(t => this.tokens.delete(t));
  }

  toggle(token: string, force?: boolean): boolean {
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

  contains(token: string): boolean {
    return this.tokens.has(token);
  }

  toString(): string {
    return Array.from(this.tokens).join(' ');
  }
}

export type EventListenerFn = (event: Event) => void;

export class MockElement {
  public tagName: string;
  public id = '';
  public classList = new MockDOMTokenList();
  private _className = '';

  get className(): string {
    return this._className;
  }

  set className(value: string) {
    this._className = value;
    this.classList = new MockDOMTokenList(value.split(' ').filter(Boolean));
  }
  public dataset: Record<string, string> = {};
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentElement: MockElement | null = null;
  public textContent = '';
  public value = '';
  public width = 1920;
  public height = 1080;
  private _innerHTML = '';

  get innerHTML(): string {
    return this._innerHTML;
  }

  set innerHTML(val: string) {
    this._innerHTML = val;
    if (val === '') {
      this.children = [];
    }
  }
  private readonly listeners: Map<string, Set<EventListenerFn>> = new Map();

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
    if (name === 'id') this.id = value;
    if (name === 'class') {
      this.className = value;
      this.classList = new MockDOMTokenList(value.split(' ').filter(Boolean));
    }
    if (name.startsWith('data-')) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, c) => (c as string).toUpperCase());
      this.dataset[prop] = value;
    }
  }

  getAttribute(name: string): string | null {
    if (name === 'id') return this.id || null;
    if (name === 'class') return this.classList.toString() || null;
    if (name.startsWith('data-')) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, c) => (c as string).toUpperCase());
      return this.dataset[prop] ?? null;
    }
    return this.attributes[name] ?? null;
  }

  removeAttribute(name: string): void {
    delete this.attributes[name];
    if (name === 'id') this.id = '';
    if (name === 'class') {
      this.className = '';
      this.classList = new MockDOMTokenList();
    }
    if (name.startsWith('data-')) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, c) => (c as string).toUpperCase());
      delete this.dataset[prop];
    }
  }

  appendChild<T extends MockElement>(child: T): T {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild<T extends MockElement>(child: T): T {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parentElement = null;
      this.children.splice(idx, 1);
    }
    return child;
  }

  addEventListener(type: string, listener: EventListenerFn): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListenerFn): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    if (!('target' in event) || !(event as { target?: unknown }).target) {
      Object.defineProperty(event, 'target', { value: this, configurable: true });
    }
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(h => h(event));
    }
    return true;
  }

  querySelector(selector: string): MockElement | null {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];

    const matches = (el: MockElement): boolean => {
      if (selector.startsWith('#') && el.id === selector.slice(1)) return true;
      if (selector.startsWith('.') && el.classList.contains(selector.slice(1))) return true;
      if (selector.toUpperCase() === el.tagName) return true;
      if (selector.includes('[data-')) {
        const match = /\[data-([^=\]]+)(?:="([^"]+)")?\]/.exec(selector);
        if (match) {
          const key = match[1].replace(/-([a-z])/g, (_, c) => (c as string).toUpperCase());
          const val = match[2];
          if (val !== undefined) {
            return el.dataset[key] === val;
          }
          return key in el.dataset;
        }
      }
      return false;
    };

    const traverse = (el: MockElement): void => {
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

  click(): void {
    this.dispatchEvent(new Event('click'));
  }

  toDataURL(format = 'image/png'): string {
    return `data:${format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }

  getContext(type: string): unknown {
    if (type === '2d') {
      return createMockCanvas2DContext();
    }
    if (type === 'webgl' || type === 'webgl2') {
      return createMockWebGLContext();
    }
    return null;
  }
}

export function createMockCanvas2DContext(): Record<string, unknown> {
  return {
    canvas: null,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '16px sans-serif',
    textAlign: 'center',
    textBaseline: 'middle',
    shadowColor: 'transparent',
    shadowBlur: 0,
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: (text: string) => ({ width: text.length * 8 }),
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    roundRect: () => {}
  };
}

const WEBGL_CONSTANTS: Record<string, number> = {
  VERSION: 0x1f02,
  VENDOR: 0x1f00,
  RENDERER: 0x1f01,
  SHADING_LANGUAGE_VERSION: 0x8df8,
  MAX_TEXTURE_SIZE: 0x0d33,
  MAX_CUBE_MAP_TEXTURE_SIZE: 0x851c,
  MAX_VERTEX_ATTRIBS: 0x8872,
  MAX_VERTEX_UNIFORM_VECTORS: 0x8869,
  MAX_VARYING_VECTORS: 0x8dfa,
  MAX_FRAGMENT_UNIFORM_VECTORS: 0x8dfb,
  MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8871,
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
  MAX_TEXTURE_IMAGE_UNITS: 0x8872,
  MAX_RENDERBUFFER_SIZE: 0x8073,
  MAX_COLOR_ATTACHMENTS: 0x8cdf,
  MAX_DRAW_BUFFERS: 0x8824,
  SAMPLE_BUFFERS: 0x8069,
  SAMPLES: 0x80a8,
  RED_BITS: 0x8d57,
  GREEN_BITS: 0x8d58,
  BLUE_BITS: 0x8d59,
  ALPHA_BITS: 0x8d5a,
  DEPTH_BITS: 0x8d56,
  STENCIL_BITS: 0x8d55,
  MAX_TEXTURE_LOD_BIAS: 0x84e2,
  ALIASED_LINE_WIDTH_RANGE: 0x8b49,
  ALIASED_POINT_SIZE_RANGE: 0x846d,
  VERTEX_SHADER: 0x8b31,
  FRAGMENT_SHADER: 0x8b30,
  HIGH_FLOAT: 0x8df2,
  MEDIUM_FLOAT: 0x8df1,
  LOW_FLOAT: 0x8df0,
  HIGH_INT: 0x8df5,
  MEDIUM_INT: 0x8df4,
  LOW_INT: 0x8df3,
  FRAMEBUFFER: 0x8d40,
  RENDERBUFFER: 0x8d41,
  RGBA: 0x1908,
  UNSIGNED_BYTE: 0x1401,
  COLOR_ATTACHMENT0: 0x8ce0,
  DEPTH_ATTACHMENT: 0x8d00,
  STENCIL_ATTACHMENT: 0x8d20,
  FRAMEBUFFER_COMPLETE: 0x8cd5,
  TEXTURE_2D: 0x0de1,
  TEXTURE_CUBE_MAP: 0x8513,
  LINEAR: 0x2601,
  NEAREST: 0x2600,
  REPEAT: 0x2901,
  CLAMP_TO_EDGE: 0x812f
};

export function createMockWebGLContext(): Record<string, unknown> {
  const target: Record<string, unknown> = {
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
      powerPreference: 'high-performance'
    }),
    getExtension: (name: string) => {
      if (name === 'WEBGL_depth_texture') return {};
      if (name === 'OES_texture_float') return {};
      if (name === 'OES_texture_half_float') return {};
      if (name === 'OES_standard_derivatives') return {};
      if (name === 'EXT_texture_filter_anisotropic') return { MAX_TEXTURE_MAX_ANISOTROPY_EXT: 16 };
      if (name === 'WEBGL_draw_buffers') return {};
      return {};
    },
    getParameter: (p: number | string) => {
      if (p === 0x1f02 || p === 1 || p === '1' || p === 'VERSION') return 'WebGL 2.0 (Mock)';
      if (p === 0x1f00 || p === 'VENDOR') return 'WebKit';
      if (p === 0x1f01 || p === 'RENDERER') return 'WebKit WebGL';
      if (p === 0x8df8 || p === 'SHADING_LANGUAGE_VERSION') return 'WebGL GLSL ES 3.00 (Mock)';
      switch (p) {
        case 0x0d33: return 16384; // MAX_TEXTURE_SIZE
        case 0x851c: return 16384; // MAX_CUBE_MAP_TEXTURE_SIZE
        case 0x8872: return 16; // MAX_VERTEX_ATTRIBS
        case 0x8869: return 1024; // MAX_VERTEX_UNIFORM_VECTORS
        case 0x8dfa: return 30; // MAX_VARYING_VECTORS
        case 0x8dfb: return 1024; // MAX_FRAGMENT_UNIFORM_VECTORS
        case 0x8871: return 32; // MAX_COMBINED_TEXTURE_IMAGE_UNITS
        case 0x8b4c: return 16; // MAX_VERTEX_TEXTURE_IMAGE_UNITS
        case 0x8073: return 16384; // MAX_RENDERBUFFER_SIZE
        case 0x8cdf: return 8; // MAX_COLOR_ATTACHMENTS
        case 0x8824: return 8; // MAX_DRAW_BUFFERS
        case 0x8069: return 0; // SAMPLE_BUFFERS
        case 0x80a8: return 0; // SAMPLES
        case 0x8d57: return 8; // RED_BITS
        case 0x8d58: return 8; // GREEN_BITS
        case 0x8d59: return 8; // BLUE_BITS
        case 0x8d5a: return 8; // ALPHA_BITS
        case 0x8d56: return 24; // DEPTH_BITS
        case 0x8d55: return 8; // STENCIL_BITS
        case 0x84e2: return 2; // MAX_TEXTURE_LOD_BIAS
        case 0x8b49: return new Float32Array([1, 1]); // ALIASED_LINE_WIDTH_RANGE
        case 0x846d: return new Float32Array([1, 1024]); // ALIASED_POINT_SIZE_RANGE
        default: return 0;
      }
    },
    getShaderPrecisionFormat: (_shaderType: number, _precisionType: number) => ({
      precision: 23,
      rangeMin: 127,
      rangeMax: 127
    }),
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => '',
    getProgramParameter: (_program: unknown, param: number) => {
      if (param === 0x8b86) return 0; // ACTIVE_UNIFORMS
      if (param === 0x8b89) return 0; // ACTIVE_ATTRIBUTES
      if (param === 0x8b84) return 0; // ATTACHED_SHADERS
      if (param === 0x8b87) return 0; // ACTIVE_UNIFORM_MAX_LENGTH
      if (param === 0x8b8a) return 0; // ACTIVE_ATTRIBUTE_MAX_LENGTH
      return true; // LINK_STATUS, etc.
    },
    getProgramInfoLog: () => '',
    getActiveUniform: (_program: unknown, _index: number) => ({
      name: 'uMock',
      size: 1,
      type: 0x8b50
    }),
    getActiveAttrib: (_program: unknown, _index: number) => ({
      name: 'aMock',
      size: 1,
      type: 0x8b50
    }),
    useProgram: () => {},
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    bufferSubData: () => {},
    enable: () => {},
    disable: () => {},
    clear: () => {},
    clearColor: () => {},
    clearDepth: () => {},
    clearStencil: () => {},
    viewport: () => {},
    createTexture: () => ({}),
    bindTexture: () => {},
    texParameteri: () => {},
    texImage2D: () => {},
    pixelStorei: () => {},
    generateMipmap: () => {},
    createFramebuffer: () => ({}),
    bindFramebuffer: () => {},
    framebufferTexture2D: () => {},
    checkFramebufferStatus: () => 0x8cd5, // FRAMEBUFFER_COMPLETE
    createRenderbuffer: () => ({}),
    bindRenderbuffer: () => {},
    renderbufferStorage: () => {},
    renderbufferStorageMultisample: () => {},
    framebufferRenderbuffer: () => {},
    getUniformLocation: () => ({}),
    getAttribLocation: () => 0,
    enableVertexAttribArray: () => {},
    disableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    drawArrays: () => {},
    drawElements: () => {},
    drawArraysInstanced: () => {},
    drawElementsInstanced: () => {},
    activeTexture: () => {},
    cullFace: () => {},
    frontFace: () => {},
    depthFunc: () => {},
    depthMask: () => {},
    depthRange: () => {},
    colorMask: () => {},
    scissor: () => {},
    stencilFunc: () => {},
    stencilOp: () => {},
    stencilMask: () => {},
    blendFunc: () => {},
    blendFuncSeparate: () => {},
    blendEquation: () => {},
    blendEquationSeparate: () => {},
    deleteShader: () => {},
    deleteProgram: () => {},
    deleteTexture: () => {},
    deleteBuffer: () => {},
    deleteFramebuffer: () => {},
    deleteRenderbuffer: () => {}
  };

  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) {
        return obj[prop as string];
      }
      if (typeof prop === 'string') {
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

export class MockAudioParam {
  public value: number;

  constructor(initial = 0) {
    this.value = initial;
  }

  setValueAtTime(val: number, _time: number): void {
    this.value = val;
  }

  linearRampToValueAtTime(val: number, _time: number): void {
    this.value = val;
  }

  exponentialRampToValueAtTime(val: number, _time: number): void {
    this.value = val;
  }
}

export class MockAudioNode {
  public context: MockAudioContext;

  constructor(ctx: MockAudioContext) {
    this.context = ctx;
  }

  connect<T extends MockAudioNode>(dest: T): T {
    return dest;
  }

  disconnect(): void {}
}

export class MockGainNode extends MockAudioNode {
  public gain: MockAudioParam;

  constructor(ctx: MockAudioContext, initialGain = 1.0) {
    super(ctx);
    this.gain = new MockAudioParam(initialGain);
  }
}

export class MockAnalyserNode extends MockAudioNode {
  public fftSize = 2048;
  public frequencyBinCount = 1024;
  public smoothingTimeConstant = 0.82;
  public minDecibels = -100;
  public maxDecibels = -30;
  public mockFreqData: Uint8Array = new Uint8Array(1024);
  public mockTimeData: Uint8Array = new Uint8Array(1024).fill(128);

  getByteFrequencyData(arr: Uint8Array): void {
    arr.set(this.mockFreqData.subarray(0, arr.length));
  }

  getByteTimeDomainData(arr: Uint8Array): void {
    arr.set(this.mockTimeData.subarray(0, arr.length));
  }
}

export class MockOscillatorNode extends MockAudioNode {
  public frequency = new MockAudioParam(440);
  public type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine';

  start(_time?: number): void {}
  stop(_time?: number): void {}
}

export class MockMediaStreamAudioDestinationNode extends MockAudioNode {
  public stream: MediaStream = {} as unknown as MediaStream;
}

export class MockAudioContext {
  public state: 'suspended' | 'running' | 'closed' = 'running';
  public currentTime = 0;
  public destination = new MockAudioNode(this);

  createAnalyser(): MockAnalyserNode {
    return new MockAnalyserNode(this);
  }

  createGain(): MockGainNode {
    return new MockGainNode(this);
  }

  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode(this);
  }

  createMediaStreamDestination(): MockMediaStreamAudioDestinationNode {
    return new MockMediaStreamAudioDestinationNode(this);
  }

  createMediaElementSource(_audio: unknown): MockAudioNode {
    return new MockAudioNode(this);
  }

  createMediaStreamSource(_stream: unknown): MockAudioNode {
    return new MockAudioNode(this);
  }

  async resume(): Promise<void> {
    this.state = 'running';
  }

  async suspend(): Promise<void> {
    this.state = 'suspended';
  }

  async close(): Promise<void> {
    this.state = 'closed';
  }
}

export class MockMIDIInput {
  public id: string;
  public name: string;
  public manufacturer: string;
  public onmidimessage: ((event: { data: Uint8Array }) => void) | null = null;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.manufacturer = 'Visuval Virtual Controller';
  }

  simulateMessage(bytes: number[]): void {
    if (this.onmidimessage) {
      this.onmidimessage({ data: new Uint8Array(bytes) });
    }
  }
}

export class MockMIDIAccess {
  public inputs = new Map<string, MockMIDIInput>();
  public outputs = new Map<string, unknown>();
  public onstatechange: ((event: unknown) => void) | null = null;

  addMockInput(id: string, name: string): MockMIDIInput {
    const input = new MockMIDIInput(id, name);
    this.inputs.set(id, input);
    return input;
  }
}

let activeMidiAccess: MockMIDIAccess | null = null;

export function setupTestEnvironment(): void {
  const doc = new MockElement('HTML');
  const body = new MockElement('BODY');
  const head = new MockElement('HEAD');
  doc.appendChild(head);
  doc.appendChild(body);

  const canvas = new MockElement('CANVAS');
  canvas.id = 'webgl-canvas';
  body.appendChild(canvas);

  const milkCanvas = new MockElement('CANVAS');
  milkCanvas.id = 'milkdrop-canvas';
  body.appendChild(milkCanvas);

  activeMidiAccess = new MockMIDIAccess();
  activeMidiAccess.addMockInput('input-0', 'Arturia BeatStep MIDI 1');

  const mockWindow = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: () => {},
    removeEventListener: () => {},
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext
  };

  const mockDocument = {
    documentElement: doc,
    body,
    head,
    createElement: (tag: string) => new MockElement(tag),
    getElementById: (id: string) => doc.querySelector(`#${id}`),
    querySelector: (sel: string) => doc.querySelector(sel),
    querySelectorAll: (sel: string) => doc.querySelectorAll(sel),
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const mockNavigator = {
    userAgent: 'Node.js Test Agent (Headless)',
    mediaDevices: {
      getUserMedia: async () => ({
        getTracks: () => [{ stop: () => {} }]
      })
    },
    requestMIDIAccess: async () => activeMidiAccess
  };

  class MockAudio {
    crossOrigin = 'anonymous';
    currentTime = 0;
    duration = 180;
    paused = true;
    play = async () => { this.paused = false; };
    pause = () => { this.paused = true; };
    addEventListener = () => {};
    removeEventListener = () => {};
  }

  Object.defineProperty(globalThis, 'window', {
    value: mockWindow,
    configurable: true,
    writable: true
  });

  Object.defineProperty(globalThis, 'document', {
    value: mockDocument,
    configurable: true,
    writable: true
  });

  Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    configurable: true,
    writable: true
  });

  Object.defineProperty(globalThis, 'Audio', {
    value: MockAudio,
    configurable: true,
    writable: true
  });

  Object.defineProperty(globalThis, 'HTMLCanvasElement', {
    value: MockElement,
    configurable: true,
    writable: true
  });

  Object.defineProperty(globalThis, 'AudioContext', {
    value: MockAudioContext,
    configurable: true,
    writable: true
  });
}

export function getActiveMidiAccess(): MockMIDIAccess | null {
  return activeMidiAccess;
}
