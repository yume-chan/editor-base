import { ScopeManager } from '.';
import { Diff } from '../diff';

interface UndoNode {
  prev?: UndoNode;

  next?: UndoNode;

  patches: Diff[];
}

export class UndoManager {
  private scopeManager: ScopeManager;

  private undoState: UndoNode = { patches: [] };

  public constructor(scopeManager: ScopeManager) {
    this.scopeManager = scopeManager;
  }

  public get canUndo() {
    this.scopeManager.observerManager.addDependency(this, ['canUndo']);
    return this.undoState.prev;
  }

  public get canRedo() {
    this.scopeManager.observerManager.addDependency(this, ['canRedo']);
    return this.undoState.next;
  }

  public push(patches: Diff[]) {
    const node: UndoNode = {
      patches,
    };

    if (this.undoState) {
      this.undoState.next = node;
      node.prev = this.undoState;
    }

    this.undoState = node;
    this.scopeManager.actionManager.notifyUndoStateChange();
  }

  public undo() {
    if (!this.canUndo) {
      return;
    }

    const { undoState: { patches } } = this;
    this.scopeManager.actionManager.execute(() => {
      for (let i = patches.length - 1; i >= 0; i -= 1) {
        patches[i].undo();
      }
    }, true);

    this.undoState = this.undoState.prev!;
    this.scopeManager.actionManager.notifyUndoStateChange();
  }

  public redo() {
    if (!this.canRedo) {
      return;
    }

    const next = this.undoState.next!;
    if (!next) {
      return;
    }

    this.scopeManager.actionManager.execute(() => {
      for (const patch of next.patches) {
        patch.apply();
      }
    }, true);

    this.undoState = next;
    this.scopeManager.actionManager.notifyUndoStateChange();
  }
}
