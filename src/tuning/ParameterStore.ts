import { ParameterDefinition } from '../types';

export class ParameterStore {
  private readonly schema: ParameterDefinition[];
  private readonly values = new Map<string, number>();

  constructor(schema: ParameterDefinition[]) {
    this.schema = schema;
    this.reset();
  }

  public getDefinitions(): ParameterDefinition[] {
    return this.schema.map(def => ({
      ...def,
      currentValue: this.getValue(def.id)
    }));
  }

  public getValue(id: string): number {
    const val = this.values.get(id);
    if (val !== undefined) {
      return val;
    }
    const def = this.schema.find(p => p.id === id);
    return def ? def.defaultValue : 0;
  }

  public get(id: string): number {
    return this.getValue(id);
  }

  public setValue(id: string, rawVal: number): void {
    const def = this.schema.find(p => p.id === id);
    if (!def) return;

    if (typeof rawVal !== 'number' || Number.isNaN(rawVal) || !Number.isFinite(rawVal)) {
      this.values.set(id, def.defaultValue);
      return;
    }

    const snapped = Math.round((rawVal - def.min) / def.step) * def.step + def.min;
    const clamped = Math.max(def.min, Math.min(def.max, snapped));
    this.values.set(id, Number(clamped.toFixed(4)));
  }

  public set(id: string, rawVal: number): void {
    this.setValue(id, rawVal);
  }

  public reset(): void {
    for (const def of this.schema) {
      this.values.set(def.id, def.defaultValue);
    }
  }

  public resetAll(): void {
    this.reset();
  }

  public toRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const def of this.schema) {
      record[def.id] = this.getValue(def.id);
    }
    return record;
  }
}
