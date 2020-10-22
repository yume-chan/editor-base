import { ScopeManager } from ".";
import { Path } from "../state";
import { ObjectPaths } from "./pathTrie";

export type ObserverCallback = () => void;

export interface Observer {
  dependencies: ObjectPaths;

  callback: ObserverCallback;

  track<T>(fn: () => T): T;

  dispose(): void;
}

export class ObserverManager {
  private scopeManager: ScopeManager;

  private stack: Observer[] = [];

  private current: Observer | undefined;

  public constructor(scopeManager: ScopeManager) {
    this.scopeManager = scopeManager;
  }

  public createObserver(callback: ObserverCallback): Observer {
    const observer: Observer = {
      dependencies: new ObjectPaths(),
      callback,
      track: <T extends unknown>(fn: () => T) => {
        return this.track(observer, fn);
      },
      dispose: () => {
        this.scopeManager.actionManager.deleteObserver(observer);
      },
    };
    return observer;
  }

  private track<T>(state: Observer, fn: () => T): T {
    if (this.current) {
      this.stack.push(this.current);
    }

    state.dependencies.clear();
    this.current = state;

    try {
      return fn();
    } finally {
      if (state.dependencies.size) {
        // console.group('track finished:', (fn as any).displayName);
        // for (const item of state.dependencies.toArray()) {
        //   console.log(item[0], item[1]);
        // }
        // console.groupEnd();

        this.scopeManager.actionManager.addObserver(state);
      } else {
        this.scopeManager.actionManager.deleteObserver(state);
      }

      this.current = this.stack.pop();
    }
  }

  /** @internal */ addDependency(object: unknown, path: Path) {
    this.current?.dependencies.add(object, path);
  }
}
