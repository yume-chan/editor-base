import { ScopeManager } from './scope';

export type Path = PropertyKey[];

export interface ProxyState<T> {
  scopeManager: ScopeManager;

  target: T;

  path: Path;

  children: Map<PropertyKey, ProxyState<any>>;

  dispose: () => void;
}

export const StateSymbol = Symbol.for('cow-state');

export interface ProxyExtension<T> {
  [StateSymbol]: ProxyState<T>;
}

export type CowProxy<T> = T &
  (T extends object ? ProxyExtension<T> : never);
