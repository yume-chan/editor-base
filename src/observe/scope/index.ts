import { ActionManager } from "./action";
import { ObserverManager } from "./observer";
import { UndoManager } from "./undo";

export * from './action';
export * from './observer';
export * from './undo';

export class ScopeManager {
  public undoManager = new UndoManager(this);

  public actionManager = new ActionManager(this);

  public observerManager = new ObserverManager(this);
}
