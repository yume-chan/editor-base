import { ScopeManager } from ".";
import { observe } from "./object";

describe('Object', () => {
  it('should add dependency when get()', () => {
    const manager = new ScopeManager();
    const object = observe({ foo: 42 }, manager);

    const callback = jest.fn();
    const observer = manager.observerManager.createObserver(callback);

    observer.track(() => {
      const foo = object.foo;
    });
    expect(observer.dependencies.toArray()).toEqual([[object, 'foo']]);

    manager.actionManager.execute(() => {
      object.foo = 84;
    }, true);
    expect(callback).toBeCalledTimes(1);

    manager.undoManager.undo();
    expect(callback).toBeCalledTimes(2);

    JSON.stringify(observe({ foo: [] }, manager));
  });
});
