import { ScopeManager } from '.';
import { Diff } from '../diff';

interface UndoNode {
  prev?: UndoNode;

  next?: UndoNode;

  patches: Diff[];
}

export class UndoManager {
  private scopeManager: ScopeManager;

  private undoState?: UndoNode;

  public constructor(scopeManager: ScopeManager) {
    this.scopeManager = scopeManager;
  }

  public get canUndo() {
    return !!this.undoState;
  }

  public get canRedo() {
    return !!this.undoState?.next;
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
  }

  public undo() {
    const { undoState: current } = this;
    if (!current) {
      return;
    }

    this.scopeManager.actionManager.execute(() => {
      const { patches } = current;
      for (let i = patches.length - 1; i >= 0; i -= 1) {
        patches[i].undo();
      }
    });

    this.undoState = this.undoState?.prev;
  }

  public redo() {
    const next = this.undoState?.next;
    if (!next) {
      return;
    }

    this.scopeManager.actionManager.execute(() => {
      for (const patch of next.patches) {
        patch.apply();
      }
    });

    this.undoState = this.undoState!.next;
  }
}
