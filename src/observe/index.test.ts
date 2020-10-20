import { isObservable } from '.';

interface Page {
  title: string;

  children: Component[];
}

interface Component {
  type: string;

  children: Component[];
}

const value: Component = {
  type: 'image',
  children: [{
    type: 'text',
    children: [],
  }],
};

describe('Observable', () => {
  describe('isObservable', () => {
    it('should return `false` for `undefined`', () => {
      expect(isObservable(undefined)).toBe(false);
    });

    it('should return `false` for `null`', () => {
      expect(isObservable(null)).toBe(false);
    });

    it('should return `false` for number', () => {
      expect(isObservable(42)).toBe(false);
    });

    it('should return `false` for string', () => {
      expect(isObservable('foo')).toBe(false);
    });

    it('should return `false` for boolean', () => {
      expect(isObservable(true)).toBe(false);
    });

    it('should return `false` for Date', () => {
      expect(isObservable(new Date())).toBe(false);
    });

    it('should return `false` for RegExp', () => {
      expect(isObservable(/foo/i)).toBe(false);
    });

    it('should return `false` for Map', () => {
      expect(isObservable(new Map())).toBe(false);
    });

    it('should return `false` for Set', () => {
      expect(isObservable(new Set())).toBe(false);
    });

    it('should return `false` for class', () => {
      expect(isObservable(new class { }())).toBe(false);
    });

    it('should return `true` for plain object', () => {
      expect(isObservable({ foo: 42 })).toBe(true);
    });

    it('should return `true` for object without prototype', () => {
      expect(isObservable(Object.create(null))).toBe(true);
    });

    it('should return `true` for array', () => {
      expect(isObservable([42])).toBe(true);
    });
  });
});
