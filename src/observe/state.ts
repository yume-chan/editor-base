import { ScopeManager } from './scope';

export type Path = PropertyKey[];

export interface ObserveProxyState<T> {
  scopeManager: ScopeManager;

  root: unknown;

  target: T;

  path: Path;

  children: Map<PropertyKey, ObserveProxy<unknown>>;

  dispose: () => void;
}

export const ObserveProxyStateSymbol = Symbol.for('proxy-state');

export interface ObserveProxyExtension<T> {
  [ObserveProxyStateSymbol]: ObserveProxyState<T>;
}

export type ObserveProxy<T> = T & ObserveProxyExtension<T>;
