import { ScopeManager } from ".";

describe('Scope', () => {
  describe('ActionManager', () => {
    it('should reject change in global scope', () => {
      const manager = new ScopeManager();
      expect(() => manager.actionManager.addDiff({
        apply() { },
        path: [],
        undo() { },
        type: ''
      })).toThrowError();
    });

    it('should invoke scope local observers', () => {

    });
  });
});
