import { ScopeManager } from ".";
import { Diff, mergeDiff } from "../diff";
import { Observer, ObserverCallback } from "./observer";
import { ObjectPaths } from "./pathTrie";

interface ActionState {
  global: boolean;

  diffList: Diff[];

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
    diffPaths: new ObjectPaths(),
  };

  public constructor(scopeManager: ScopeManager) {
    this.scopeManager = scopeManager;
  }

  public begin(isUndo = false) {
    this.stack.push(this.current);

    const state: ActionState = {
      global: false,
      diffList: [],
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
        console.log(state.diffList);
        console.group('action diff');
        for (const item of state.diffPaths.toArray()) {
          console.log(item[0], item[1]);
        }
        console.groupEnd();

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

      if (!isUndo && this.current.global && state.diffList.length) {
        this.scopeManager.undoManager.push(state.diffList);
      }
    };
  }

  public execute<T>(executor: () => T, isUndo = false): T {
    const end = this.begin(isUndo);
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
