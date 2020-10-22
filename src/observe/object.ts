import { isObservable } from '.';
import { ArrayHooks } from './array';
import { ScopeManager } from './scope';
import { ObserveProxy, ObserveProxyState, ObserveProxyStateSymbol } from './state';

export interface ObjectProxyState<T>
  extends ObserveProxyState<T> {
  hooks?: any;
}

export function observe<T extends object>(
  target: T,
  scopeManager: ScopeManager
): ObserveProxy<T> {
  const state: ObjectProxyState<T> = {
    root: target,
    scopeManager,
    target,
    path: [],
    children: new Map(),
    dispose: undefined as any,
  };

  if (Array.isArray(target)) {
    state.hooks = new ArrayHooks(state as any);
  }

  const handler: ProxyHandler<ObjectProxyState<T>> = {
    defineProperty(_target, _p) {
      throw new Error('');
    },
    deleteProperty(state, p: keyof T) {
      state.children.get(p)?.[ObserveProxyStateSymbol].dispose();
      state.children.delete(p);

      const oldValue = state.target[p];
      delete state.target[p];

      state.scopeManager.actionManager.addDiff({
        target: state.root,
        path: [...state.path, p],
        type: 'Object.set',
        apply() { handler.deleteProperty!(state, p); },
        undo() { handler.set!(state, p, oldValue, undefined); }
      });
      return true;
    },
    get(state, p: keyof T | typeof ObserveProxyStateSymbol) {
      if (p === ObserveProxyStateSymbol) {
        return state;
      }

      state.scopeManager.observerManager.addDependency(state.root, [...state.path, p]);

      if (state.hooks) {
        if (p in state.hooks) {
          return state.hooks[p];
        }
      }

      const child = state.children.get(p);
      if (child) {
        return child;
      }

      const value = state.target[p];
      if (isObservable(value)) {
        const newChild = observe(value, state.scopeManager);
        newChild[ObserveProxyStateSymbol].root = state.root;
        newChild[ObserveProxyStateSymbol].path = state.path.slice();
        newChild[ObserveProxyStateSymbol].path.push(p);
        state.children.set(p, newChild);
        return newChild;
      }

      return value;
    },
    getOwnPropertyDescriptor(state, p) {
      return Reflect.getOwnPropertyDescriptor(state.target, p);
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
      const hasOldValue = p in state.target;
      if (hasOldValue) {
        state.children.get(p)?.[ObserveProxyStateSymbol].dispose();
        state.children.delete(p);
      }

      if (value?.[ObserveProxyStateSymbol]) {
        value = value[ObserveProxyStateSymbol].value;
      }

      const oldValue = state.target[p];
      state.target[p] = value;

      state.scopeManager.actionManager.addDiff({
        target: state.root,
        path: [...state.path, p],
        type: 'Object.set',
        apply() { handler.set!(state, p, value, undefined); },
        undo() {
          if (hasOldValue) {
            handler.set!(state, p, oldValue, undefined);
          } else {
            handler.deleteProperty!(state, p);
          }
        }
      });
      return true;
    },
    setPrototypeOf(_target, _v) {
      throw new Error('can not set prototype of a proxy');
    },
  };
  const { proxy, revoke } = Proxy.revocable(state, handler);

  state.dispose = revoke;
  return proxy as unknown as ObserveProxy<T>;
}
