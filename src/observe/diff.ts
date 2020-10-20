import { Path } from './state';

export interface Diff {
  path: Path;

  type: string;

  undo(): void;

  apply(): void;

  merge?(patch: Diff): Diff | undefined;
}

export function mergeDiff(list: Diff[], next: Diff): Diff[] {
  const result: Diff[] = [];
  for (const item of list) {
    const merged = next.merge?.(item);
    if (merged) {
      next = merged;
      continue;
    }
    result.push(item);
  }
  result.push(next);
  return result;
}
