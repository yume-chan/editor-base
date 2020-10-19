import { CowObjectProxyState } from './object';

export class ArrayHooks<T extends unknown[]> {
  private state: CowObjectProxyState<T>;

  public constructor(state: CowObjectProxyState<T>) {
    this.state = state;
  }

  public splice = (start: number, deleteCount: number, ...items: any[]): any[] => {
    const deletedItems = this.state.target.splice(start, deleteCount, ...items);
    this.state.undoManager.addPatch({
      type: 'array.splice',
      info: {
        pathes: this.state.pathes,
      },
      apply: () => this.state.target.splice(start, deleteCount, ...items),
      undo: () => {
        this.state.target.splice(start, items.length);
        this.state.target.splice(start, 0, ...deletedItems);
      },
    });
    return deletedItems;
  };
}
