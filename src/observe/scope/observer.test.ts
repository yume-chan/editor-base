import { ScopeManager } from ".";
import { DependencyTree, ObserverState } from "./observer";

describe('Scope', () => {
  describe('Observer', () => {
    it('should add observer to ActionManager', () => {
      const manager = new ScopeManager();
      manager.observerManager.execute(() => {
        manager.observerManager.addDependency(['test']);
      });
      expect((manager.actionManager as any).current.observers.size).toBe(1);
    });
  });
});
