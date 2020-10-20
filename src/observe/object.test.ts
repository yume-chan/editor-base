import { ScopeManager } from ".";
import { observe } from "./object";
import { DependencyTree } from "./scope/observer";

describe('Object', () => {
  it('should add dependency when get()', () => {
    const manager = new ScopeManager();
    const object = observe({ foo: 42 }, manager);

    let foo!: number;
    manager.observerManager.execute(() => {
      foo = object.foo;
    });
    expect(foo).toBe(42);

    manager.actionManager.execute(() => {
      object.foo = 84;
    });
    expect(foo).toBe(84);

    manager.undoManager.undo();
    expect(foo).toBe(42);
  });
});
