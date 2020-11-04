import { PathTrie } from './pathTrie';

describe('PathTrie', () => {
  describe('add', () => {
    it('add multiple items', () => {
      const trie = new PathTrie();
      trie.add(['foo']);
      expect(trie.toArray()).toEqual(['foo']);

      trie.add(['bar']);
      expect(trie.toArray()).toEqual(['foo', 'bar']);
    });

    it('add same item twice', () => {
      const trie = new PathTrie();

      trie.add(['foo']);
      expect(trie.toArray()).toEqual(['foo']);

      trie.add(['foo']);
      expect(trie.toArray()).toEqual(['foo']);
    });

    it('add child items', () => {
      const trie = new PathTrie();

      trie.add(['foo']);
      expect(trie.toArray()).toEqual(['foo']);

      trie.add(['foo', 'bar']);
      expect(trie.toArray()).toEqual(['foo.bar']);

      trie.add(['foo', 'baz']);
      expect(trie.toArray()).toEqual(['foo.bar', 'foo.baz']);

      trie.add(['foo', 'bar', 'baz']);
      expect(trie.toArray()).toEqual(['foo.bar.baz', 'foo.baz']);
    });

    describe('collapse mode', () => {
      it('add child item', () => {
        const trie = new PathTrie();
        trie.add(['foo']);
        trie.add(['foo', 'bar'], true);
        expect(trie.toArray()).toEqual(['foo']);
      });

      it('add parent item', () => {
        const trie = new PathTrie();
        trie.add(['foo', 'bar'], true);
        trie.add(['foo'], true);
        expect(trie.toArray()).toEqual(['foo']);
      });
    });
  });

  it('clear', () => {
    const trie = new PathTrie();

    trie.add(['foo']);
    expect(trie.toArray()).toEqual(['foo']);

    trie.clear();
    expect(trie.toArray()).toEqual([]);
  });

  describe('isSameOrAncestorOf', () => {
    it('same tries', () => {
      const a = new PathTrie();
      a.add(['foo']);

      const b = new PathTrie();
      b.add(['foo']);

      expect(a.isSameOrAncestorOf(b)).toBe(true);
      expect(b.isSameOrAncestorOf(a)).toBe(true);
    });

    it('ancestor', () => {
      const a = new PathTrie();
      a.add(['foo']);

      const b = new PathTrie();
      b.add(['foo', 'bar']);

      expect(a.isSameOrAncestorOf(b)).toBe(true);
      expect(b.isSameOrAncestorOf(a)).toBe(false);
    });

    it('no relation', () => {
      const a = new PathTrie();
      a.add(['foo']);

      const b = new PathTrie();
      b.add(['bar']);

      expect(a.isSameOrAncestorOf(b)).toBe(false);
      expect(b.isSameOrAncestorOf(a)).toBe(false);
    });
  });
});
