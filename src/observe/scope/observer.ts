import { ScopeManager } from ".";
import { Path } from "../state";

export type Observer = () => void;

export class DependencyTree<T> {
  private map = new Map<T, DependencyTree<T>>();

  public get size() {
    return this.map.size;
  }

  public add(list: T[]) {
    const [first, ...rest] = list;

    let child = this.map.get(first);
    if (!child) {
      child = new DependencyTree<T>();
      this.map.set(first, child);
    }

    if (rest.length !== 0) {
      child.add(rest);
    }
  }

  public has(list: T[]): boolean {
    const [first, ...rest] = list;

    if (rest.length === 0) {
      return this.map.has(first);
    }

    let child = this.map.get(first);
    if (!child) {
      return false;
    }
    return child.has(rest);
  }
}

export interface ObserverState {
  dependencies: DependencyTree<PropertyKey>;

  callback: Observer;
}

export class ObserverManager {
  private scopeManager: ScopeManager;

  private stack: ObserverState[] = [];

  private current: ObserverState | undefined;

  public constructor(scopeManager: ScopeManager) {
    this.scopeManager = scopeManager;
  }

  /** @internal */ rerun(state: ObserverState) {
    if (this.current) {
      this.stack.push(this.current);
    }

    state.dependencies = new DependencyTree();
    this.current = state;

    try {
      state.callback();
    } finally {
      if (state.dependencies.size) {
        this.scopeManager.actionManager.addObserver(state);
      } else {
        this.scopeManager.actionManager.deleteObserver(state);
      }

      this.current = this.stack.pop();
    }

    return () => {
      this.scopeManager.actionManager.deleteObserver(state);
    };
  }

  public execute(observer: Observer) {
    return this.rerun({
      dependencies: undefined as unknown as DependencyTree<string>,
      callback: observer,
    });
  }

  /** @internal */ addDependency(dependency: Path) {
    if (!this.current) {
      return;
    }

    this.current.dependencies.add(dependency);
  }
}
