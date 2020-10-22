export class PathTrie {
  private map = new Map<PropertyKey, PathTrie>();

  public get size() {
    return this.map.size;
  }

  public add(path: PropertyKey[], collapse = false) {
    const [first, ...rest] = path;

    if (collapse &&
      rest.length &&
      this.map.has(first) &&
      !this.map.get(first)!.size) {
      return;
    }

    let child = this.map.get(first);
    if (!child) {
      child = new PathTrie();
      this.map.set(first, child);
    }

    if (rest.length) {
      child.add(rest);
    } else if (collapse) {
      child.clear();
    }
  }

  public clear() {
    this.map.clear();
  }

  public isSameOrAncestorOf(other: PathTrie): boolean {
    for (const [key, child] of this.map.entries()) {
      const otherChild = other.map.get(key);
      if (otherChild) {
        if (child.size === 0) {
          return true;
        }

        return child.isSameOrAncestorOf(otherChild);
      }
    }

    return false;
  }

  public toArray(): string[] {
    return Array.from(this.map.entries(), ([key, child]) => {
      if (child.size === 0) {
        return [key.toString()];
      }

      return child.toArray().map(item => `${key.toString()}.${item}`);
    }).flat();
  }
}

export class ObjectPaths {
  private map = new Map<unknown, PathTrie>();

  public get size() {
    return this.map.size;
  }

  public add(object: unknown, path: PropertyKey[], collapse = false) {
    let trie = this.map.get(object);
    if (!trie) {
      trie = new PathTrie();
      this.map.set(object, trie);
    }
    trie.add(path, collapse);
  }

  public clear() {
    this.map.clear();
  }

  public isSameOrAncestorOf(other: ObjectPaths): boolean {
    for (const [object, trie] of this.map.entries()) {
      const otherTrie = other.map.get(object);
      if (otherTrie && trie.isSameOrAncestorOf(otherTrie)) {
        return true;
      }
    }

    return false;
  }

  public toArray(): [object: unknown, path: string][] {
    return Array.from(this.map.entries(), ([object, trie]) => {
      return trie.toArray().map(item => [object, item] as [unknown, string]);
    }).flat();
  }
}
