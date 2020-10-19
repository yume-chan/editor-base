import { CowPatch, mergePatches, notifyPatches, notifyUndoPatches } from './patch';

interface UndoNode {
  prev?: UndoNode;

  next?: UndoNode;

  patches: CowPatch[];
}

interface TransactionState {
  patches: CowPatch[];
}

export class UndoManager {
  private undoState?: UndoNode;

  private transactionStack: TransactionState[] = [];

  private currentTransaction: TransactionState | undefined;

  public get canUndo() {
    return !!this.undoState;
  }

  public get canRedo() {
    return !!this.undoState?.next;
  }

  private push(patches: CowPatch[]) {
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

    const { currentTransaction } = this;
    this.currentTransaction = undefined;
    const { patches } = current;
    for (let i = patches.length - 1; i !== 0; i -= 1) {
      patches[i].undo();
    }
    this.currentTransaction = currentTransaction;
    notifyUndoPatches(patches);

    this.undoState = this.undoState?.prev;
  }

  public redo() {
    const next = this.undoState?.next;
    if (!next) {
      return;
    }

    for (const patch of next.patches) {
      patch.apply();
    }
    notifyPatches(next.patches);

    this.undoState = this.undoState!.next;
  }

  public beginTransaction() {
    const state: TransactionState = {
      patches: [],
    };
    this.transactionStack.push(state);
    this.currentTransaction = state;

    return () => {
      if (this.transactionStack[this.transactionStack.length - 1] !== state) {
        throw new Error('transaction must end in reverse order');
      }

      this.transactionStack.pop();
      this.currentTransaction = this.transactionStack[this.transactionStack.length - 1];

      if (state.patches.length) {
        this.push(state.patches);
        notifyPatches(state.patches);
      }
    };
  }

  public executeTransaction<T>(executor: () => T): T {
    const end = this.beginTransaction();
    try {
      return executor();
    } finally {
      end();
    }
  }

  /** @internal */ addPatch(patch: CowPatch) {
    if (this.currentTransaction) {
      this.currentTransaction.patches = mergePatches(this.currentTransaction.patches, patch);
    } else {
      notifyPatches([patch]);
    }
  }
}
