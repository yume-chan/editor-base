import { OnChange } from './event';
import { UndoManager } from './undo';

export interface CowChangedEventHandler {
  (property: PropertyKey, oldValue: any, newValue: any): void;
}

export interface CowValuePath {
  parent: CowProxyState<any>;

  key: PropertyKey;
}

export interface CowProxyState<T> {
  undoManager: UndoManager;

  target: T;

  pathes: Set<CowValuePath>;

  children: Map<PropertyKey, CowProxyState<any>>;
}

export function removeChild(parent: CowProxyState<any>, key: PropertyKey): void {
  const child = parent.children.get(key);
  if (child) {
    parent.children.delete(key);
    for (const path of child.pathes) {
      if (path.parent === parent && path.key === key) {
        child.pathes.delete(path);
        break;
      }
    }
  }
}

export function addChild(parent: CowProxyState<any>, key: PropertyKey, child: CowProxyState<any>): void {
  child.pathes.add({ parent, key });
  parent.children.set(key, child);
}

export const CowStateSymbol = Symbol.for('cow-state');

export interface CowProxyExtension<T> {
  [CowStateSymbol]: CowProxyState<T>;
  [OnChange](handler: () => void): () => void;
}

export type CowProxy<T> = T &
  (T extends object ? CowProxyExtension<T> : never);
