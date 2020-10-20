import { ObjectProxyState } from './object';

export class ArrayHooks<T extends unknown[]> {
  private state: ObjectProxyState<T>;

  public constructor(state: ObjectProxyState<T>) {
    this.state = state;
  }

  public splice = (start: number, deleteCount: number, ...items: any[]): any[] => {
    const deletedItems = this.state.target.splice(start, deleteCount, ...items);
    this.state.scopeManager.actionManager.addDiff({
      type: 'Array.splice',
      path: this.state.path,
      apply: () => this.state.target.splice(start, deleteCount, ...items),
      undo: () => {
        this.state.target.splice(start, items.length);
        this.state.target.splice(start, 0, ...deletedItems);
      },
    });
    return deletedItems;
  };
}
