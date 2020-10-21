import { isObservable } from '.';
import { ArrayHooks } from './array';
import { ScopeManager } from './scope';
import { CowProxy, ProxyState, StateSymbol } from './state';

export interface ObjectProxyState<T>
  extends ProxyState<T> {
  hooks?: any;
}

export function observe<T extends object>(
  target: T,
  scopeManager: ScopeManager
): CowProxy<T> {
  const state: ObjectProxyState<T> = {
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
      state.children.get(p)?.dispose();
      state.children.delete(p);

      const oldValue = state.target[p];
      delete state.target[p];

      state.scopeManager.actionManager.addDiff({
        path: [...state.path, p],
        type: 'Object.set',
        apply() { handler.deleteProperty!(state, p); },
        undo() { handler.set!(state, p, oldValue, undefined); }
      });
      return true;
    },
    get(state, p: keyof T | typeof StateSymbol) {
      if (p === StateSymbol) {
        return state;
      }

      state.scopeManager.observerManager.addDependency([...state.path, p]);

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
        for (const segment of state.path) {
          newChild[StateSymbol].path.push(segment);
        }
        newChild[StateSymbol].path.push(p);
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
      state.children.get(p)?.dispose();
      state.children.delete(p);

      if (value?.[StateSymbol]) {
        value = value[StateSymbol].value;
      }

      const oldValue = state.target[p];
      state.target[p] = value;

      state.scopeManager.actionManager.addDiff({
        path: [...state.path, p],
        type: 'Object.set',
        apply() { handler.set!(state, p, value, undefined); },
        undo() { handler.set!(state, p, oldValue, undefined); }
      });
      return true;
    },
    setPrototypeOf(_target, _v) {
      throw new Error('can not set prototype of a proxy');
    },
  };
  const { proxy, revoke } = Proxy.revocable(state, handler);

  state.dispose = revoke;
  return proxy as unknown as CowProxy<T>;
}
