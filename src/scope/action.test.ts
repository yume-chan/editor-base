import { ScopeManager } from ".";

describe('Scope', () => {
  describe('ActionManager', () => {
    it('should reject change in global scope', () => {
      const manager = new ScopeManager();
      expect(() => manager.actionManager.addDiff({
        type: '',
        target: undefined,
        path: [],
        apply() { },
        undo() { },
      })).toThrowError();
    });

    it('should invoke scope local observers', () => {

    });
  });
});
