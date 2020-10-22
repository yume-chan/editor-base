import { ObjectProxyState } from './object';
import { ObserveProxyStateSymbol } from './state';

export class ArrayHooks<T extends unknown[]> {
  private state: ObjectProxyState<T>;

  public constructor(state: ObjectProxyState<T>) {
    this.state = state;
  }

  public push = (...items: any[]) => {
    if (!items.length) {
      return;
    }

    const index = this.state.target.length;
    this.state.target.push(...items);
    this.state.scopeManager.actionManager.addDiff({
      target: this.state.root,
      type: 'Array.push',
      path: this.state.path,
      apply: () => this.push(...items),
      undo: () => this.splice(index, items.length),
    });
  };

  public splice = (start: number, deleteCount: number, ...items: any[]): any[] => {
    if (!deleteCount && !items.length) {
      return [];
    }

    for (let i = start; i < this.state.target.length; i++) {
      this.state.children.get(i.toString())?.[ObserveProxyStateSymbol].dispose();
      this.state.children.delete(i.toString());
    }

    const deletedItems = this.state.target.splice(start, deleteCount, ...items);
    this.state.scopeManager.actionManager.addDiff({
      target: this.state.root,
      type: 'Array.splice',
      path: this.state.path,
      apply: () => this.splice(start, deleteCount, ...items),
      undo: () => {
        this.splice(start, items.length);
        this.splice(start, 0, ...deletedItems);
      },
    });
    return deletedItems;
  };
}
