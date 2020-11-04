import { ScopeManager } from ".";
import { Diff, mergeDiff } from "../diff";
import { Observer, ObserverCallback } from "./observer";
import { ObjectPaths } from "./pathTrie";

interface ActionState {
  global: boolean;

  diffList: Diff[];

  trackUndo: boolean;

  undoList: Diff[];

  diffPaths: ObjectPaths;

  observers: Set<Observer>;
}

function invokeObserversByDependency(
  observers: Set<Observer>,
  diffPaths: ObjectPaths
) {
  let invoked = new Set<ObserverCallback>();
  for (const observer of observers) {
    if (invoked.has(observer.callback)) {
      continue;
    }

    if (diffPaths.isSameOrAncestorOf(observer.dependencies)) {
      observer.callback();
      invoked.add(observer.callback);
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
    trackUndo: false,
    undoList: [],
    diffPaths: new ObjectPaths(),
  };

  public constructor(scopeManager: ScopeManager) {
    this.scopeManager = scopeManager;
  }

  public begin(trackUndo = false) {
    this.stack.push(this.current);

    const state: ActionState = {
      global: false,
      diffList: [],
      trackUndo,
      undoList: [],
      observers: new Set(),
      diffPaths: new ObjectPaths(),
    };
    this.current = state;

    return () => {
      if (this.current !== state) {
        throw new Error('transaction must end in reverse order');
      }

      this.current = this.stack.pop()!;

      if (state.diffPaths.size && this.current.observers.size) {
        invokeObserversByDependency(
          this.current.observers,
          state.diffPaths
        );
      }

      for (const observer of state.observers) {
        this.current.observers.add(observer);
      }

      if (!this.current.global) {
        for (const diff of state.diffList) {
          this.addDiff(diff);
        }
      }

      if (trackUndo && this.current.global && state.undoList.length) {
        this.scopeManager.undoManager.push(state.undoList);
      }
    };
  }

  public execute<T>(executor: () => T, trackUndo = false): T {
    const end = this.begin(trackUndo);
    try {
      return executor();
    } finally {
      end();
    }
  }

  /** @internal */ addObserver(observer: Observer) {
    this.current.observers.add(observer);
  }

  /** @internal */ deleteObserver(observer: Observer) {
    this.current.observers.delete(observer);
  }

  /** @internal */ addDiff(diff: Diff) {
    if (this.current.global) {
      throw new Error('Can not modify object outside actions');
    }

    this.current.diffList = mergeDiff(this.current.diffList, diff);
    this.current.diffPaths.add(diff.target, diff.path, true);

    if (this.current.trackUndo) {
      this.current.undoList = mergeDiff(this.current.undoList, diff);
    }

    const paths = new ObjectPaths();
    paths.add(diff.target, diff.path);
    invokeObserversByDependency(
      this.current.observers,
      paths
    );
  }

  /** @internal */ notifyUndoStateChange() {
    const paths = new ObjectPaths();
    paths.add(this.scopeManager.undoManager, ['canUndo']);
    paths.add(this.scopeManager.undoManager, ['canRedo']);
    invokeObserversByDependency(
      this.current.observers,
      paths
    );
  }
}
