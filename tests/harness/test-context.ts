export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export interface SuiteResult {
  name: string;
  tests: TestResult[];
  passed: boolean;
  durationMs: number;
}

export interface RunnerReport {
  totalSuites: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  durationMs: number;
  suites: SuiteResult[];
}

type TestFn = () => void | Promise<void>;
type HookFn = () => void | Promise<void>;

interface TestCase {
  name: string;
  fn: TestFn;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeEachHooks: HookFn[];
  afterEachHooks: HookFn[];
}

const suites: TestSuite[] = [];
let currentSuite: TestSuite | null = null;

export function describe(name: string, fn: () => void): void {
  const suite: TestSuite = {
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

export function test(name: string, fn: TestFn): void {
  if (!currentSuite) {
    describe('Default Suite', () => {
      currentSuite?.tests.push({ name, fn });
    });
    return;
  }
  currentSuite.tests.push({ name, fn });
}

export const it = test;

export function beforeEach(fn: HookFn): void {
  if (currentSuite) {
    currentSuite.beforeEachHooks.push(fn);
  }
}

export function afterEach(fn: HookFn): void {
  if (currentSuite) {
    currentSuite.afterEachHooks.push(fn);
  }
}

export class ExpectationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpectationError';
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
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

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }
  return true;
}

export class Matcher<T> {
  private readonly actual: T;
  private isNot = false;

  constructor(actual: T) {
    this.actual = actual;
  }

  get not(): Matcher<T> {
    const inverted = new Matcher<T>(this.actual);
    inverted.isNot = !this.isNot;
    return inverted;
  }

  toBe(expected: unknown): void {
    const pass = Object.is(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to be' : 'to be'} ${JSON.stringify(expected)}`
      );
    }
  }

  toEqual(expected: unknown): void {
    const pass = deepEqual(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to equal' : 'to equal'} ${JSON.stringify(expected)}`
      );
    }
  }

  toBeCloseTo(expected: number, delta = 0.005): void {
    if (typeof this.actual !== 'number') {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const diff = Math.abs(this.actual - expected);
    const pass = diff <= delta;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected ${this.actual} ${this.isNot ? 'not to be close to' : 'to be close to'} ${expected} (diff: ${diff}, delta: ${delta})`
      );
    }
  }

  toBeGreaterThan(expected: number): void {
    if (typeof this.actual !== 'number') {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const pass = this.actual > expected;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${this.actual} ${this.isNot ? 'not to be >' : 'to be >'} ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected: number): void {
    if (typeof this.actual !== 'number') {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const pass = this.actual >= expected;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${this.actual} ${this.isNot ? 'not to be >=' : 'to be >='} ${expected}`);
    }
  }

  toBeLessThan(expected: number): void {
    if (typeof this.actual !== 'number') {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const pass = this.actual < expected;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${this.actual} ${this.isNot ? 'not to be <' : 'to be <'} ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected: number): void {
    if (typeof this.actual !== 'number') {
      throw new ExpectationError(`Expected number, received ${typeof this.actual}`);
    }
    const pass = this.actual <= expected;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${this.actual} ${this.isNot ? 'not to be <=' : 'to be <='} ${expected}`);
    }
  }

  toBeTruthy(): void {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${String(this.actual)} ${this.isNot ? 'not to be truthy' : 'to be truthy'}`);
    }
  }

  toBeFalsy(): void {
    const pass = !this.actual;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${String(this.actual)} ${this.isNot ? 'not to be falsy' : 'to be falsy'}`);
    }
  }

  toBeNull(): void {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${String(this.actual)} ${this.isNot ? 'not to be null' : 'to be null'}`);
    }
  }

  toBeUndefined(): void {
    const pass = this.actual === undefined;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected ${String(this.actual)} ${this.isNot ? 'not to be undefined' : 'to be undefined'}`);
    }
  }

  toBeDefined(): void {
    const pass = this.actual !== undefined;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected value ${this.isNot ? 'not to be defined' : 'to be defined'}`);
    }
  }

  toContain(item: unknown): void {
    let pass = false;
    if (typeof this.actual === 'string' && typeof item === 'string') {
      pass = this.actual.includes(item);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.some(el => deepEqual(el, item));
    } else if (this.actual instanceof Set) {
      pass = this.actual.has(item);
    }
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to contain' : 'to contain'} ${JSON.stringify(item)}`
      );
    }
  }

  toHaveLength(expectedLength: number): void {
    const length = (this.actual as { length?: number })?.length;
    const pass = length === expectedLength;
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(
        `Expected length ${this.isNot ? 'not to be' : 'to be'} ${expectedLength}, got ${length}`
      );
    }
  }

  toMatch(regex: RegExp): void {
    if (typeof this.actual !== 'string') {
      throw new ExpectationError(`Expected string for regex matching, got ${typeof this.actual}`);
    }
    const pass = regex.test(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new ExpectationError(`Expected "${this.actual}" ${this.isNot ? 'not to match' : 'to match'} ${regex}`);
    }
  }

  toThrow(expectedMessageOrClass?: string | RegExp): void {
    if (typeof this.actual !== 'function') {
      throw new ExpectationError(`Expected function, received ${typeof this.actual}`);
    }
    let threw = false;
    let caughtError: unknown = null;
    try {
      (this.actual as () => unknown)();
    } catch (err) {
      threw = true;
      caughtError = err;
    }

    if (this.isNot ? threw : !threw) {
      throw new ExpectationError(`Expected function ${this.isNot ? 'not to throw' : 'to throw'}`);
    }

    if (threw && expectedMessageOrClass) {
      const msg = caughtError instanceof Error ? caughtError.message : String(caughtError);
      if (typeof expectedMessageOrClass === 'string' && !msg.includes(expectedMessageOrClass)) {
        throw new ExpectationError(`Expected error message containing "${expectedMessageOrClass}", got "${msg}"`);
      }
      if (expectedMessageOrClass instanceof RegExp && !expectedMessageOrClass.test(msg)) {
        throw new ExpectationError(`Expected error message to match ${expectedMessageOrClass}, got "${msg}"`);
      }
    }
  }
}

export function expect<T>(actual: T): Matcher<T> {
  return new Matcher<T>(actual);
}

export async function runAllSuites(): Promise<RunnerReport> {
  const startTotal = Date.now();
  const suiteResults: SuiteResult[] = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    const suiteStart = Date.now();
    const testResults: TestResult[] = [];
    let suitePassed = true;

    for (const testCase of suite.tests) {
      totalTests++;
      const testStart = Date.now();
      let passed = true;
      let error: Error | undefined;

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

export function clearSuites(): void {
  suites.length = 0;
  currentSuite = null;
}
