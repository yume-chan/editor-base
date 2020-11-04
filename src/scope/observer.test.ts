import { ScopeManager } from ".";

describe('Scope', () => {
  describe('Observer', () => {
    it('should add observer to ActionManager', () => {
      const manager = new ScopeManager();
      const observer = manager.observerManager.createObserver(() => { });
      const object = {};
      observer.track(() => {
        manager.observerManager.addDependency(object, ['foo']);
      });
      expect(observer.dependencies.toArray()).toEqual([[object, 'foo']]);
    });
  });
});
