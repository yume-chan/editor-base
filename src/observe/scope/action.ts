import { ScopeManager } from ".";
import { Diff, mergeDiff } from "../diff";
import { Path } from "../state";
import { DependencyTree, Observer, ObserverManager, ObserverState } from "./observer";

interface ActionState {
  global: boolean;

  diffList: Diff[];

  observers: Set<ObserverState>;
}

function invokeObserversByDependency(
  observers: Set<ObserverState>,
  paths: Path[],
  observerManager: ObserverManager
) {
  let invoked = new Set<Observer>();
  for (const observer of observers) {
    if (invoked.has(observer.callback)) {
      continue;
    }

    for (const path of paths) {
      if (observer.dependencies.has(path)) {
        observerManager.rerun(observer);
        invoked.add(observer.callback);
        break;
      }
    }
  }
}

export class ActionManager {
  private scopeManager: ScopeManager;

  private stack: ActionState[] = [];

  private current: ActionState = {
    global: true,
    observers: new Set(),
    diffList: [],
  };

  public constructor(scopeManager: ScopeManager) {
    this.scopeManager = scopeManager;
  }

  public begin() {
    this.stack.push(this.current);

    const state: ActionState = {
      global: false,
      diffList: [],
      observers: new Set(),
    };
    this.current = state;

    return () => {
      if (this.current !== state) {
        throw new Error('transaction must end in reverse order');
      }

      this.current = this.stack.pop()!;

      if (this.current.global && state.diffList.length) {
        this.scopeManager.undoManager.push(state.diffList);
      }

      if (state.diffList.length && this.current.observers.size) {
        invokeObserversByDependency(
          this.current.observers,
          state.diffList.map(diff => diff.path),
          this.scopeManager.observerManager
        );
      }

      for (const observer of state.observers) {
        this.current.observers.add(observer);
      }
    };
  }

  public execute<T>(executor: () => T): T {
    const end = this.begin();
    try {
      return executor();
    } finally {
      end();
    }
  }

  /** @internal */ addObserver(observer: ObserverState) {
    this.current.observers.add(observer);
  }

  /** @internal */ deleteObserver(observer: ObserverState) {
    for (const observer of this.current.observers) {

    }
  }

  /** @internal */ addDiff(diff: Diff) {
    if (this.current.global) {
      throw new Error('Can not modify object outside actions');
    }

    this.current.diffList = mergeDiff(this.current.diffList, diff);
    invokeObserversByDependency(
      this.current.observers,
      [diff.path],
      this.scopeManager.observerManager
    );
  }
}
