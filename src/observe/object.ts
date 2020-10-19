import { createObservable, isObservable } from '.';
import { ArrayHooks } from './array';
import { OnChange } from './event';
import { addChild, CowChangedEventHandler, CowProxy, CowProxyState, CowStateSymbol, removeChild } from './state';
import { UndoManager } from './undo';

export interface CowObjectProxyState<T>
  extends CowProxyState<T> {
  events: Set<CowChangedEventHandler>;

  hooks?: any;
}

export function createObservableObject<T extends object>(
  target: T,
  undoManager: UndoManager
): CowProxy<T> {
  const state: CowObjectProxyState<T> = {
    undoManager,
    target,
    pathes: new Set(),
    children: new Map(),
    events: new Set(),
  };

  if (Array.isArray(target)) {
    state.hooks = new ArrayHooks(state as any);
  }

  const proxy = new Proxy(state, {
    defineProperty(_target, _p) {
      throw new Error('');
    },
    deleteProperty(state, p: keyof T) {
      removeChild(state, p);
      delete state.target[p];
      return true;
    },
    get(state, p: keyof T | typeof CowStateSymbol) {
      if (p === CowStateSymbol) {
        return state;
      }

      if (p === OnChange) {
        return (handler: CowChangedEventHandler) => {
          state.events.add(handler);
          return () => {
            state.events.delete(handler);
          };
        };
      }

      if (state.hooks) {
        if (p in state.hooks) {
          return state.hooks[p];
        }
      }

      const oldProxy = state.children.get(p);
      if (oldProxy) {
        return oldProxy;
      }

      const value = state.target[p];
      if (isObservable(value)) {
        const newChild = createObservableObject(value, state.undoManager);
        addChild(state, p, newChild[CowStateSymbol]);
        return newChild;
      }

      return value;
    },
    getOwnPropertyDescriptor(state, p) {
      return Reflect.getOwnPropertyDescriptor(state, p);
    },
    getPrototypeOf(state) {
      return Reflect.getPrototypeOf(state.target);
    },
    has(state, p) {
      return p in state.target;
    },
    ownKeys(state) {
      return Reflect.ownKeys(state.target);
    },
    set(state, p: keyof T, value) {
      // const oldValue = state.target[p];
      removeChild(state, p);

      if (value[CowStateSymbol]) {
        addChild(state, p, value[CowStateSymbol]);
        state.target[p] = value[CowStateSymbol].value;
      } else {
        state.target[p] = value;
      }

      // state.undoManager.addPatch({
      //   apply() { state.target[p] = value; },
      //   undo() {
      //     proxy[p] = oldValue;
      //   },
      // });

      return true;
    },
    setPrototypeOf(_target, _v) {
      throw new Error('can not set prototype of a cow object');
    },
  }) as unknown as CowProxy<T>;

  return proxy;
}
