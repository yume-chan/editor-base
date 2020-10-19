import { CowValuePath } from './state';

export interface CowPatchInfo {
  pathes: Set<CowValuePath>;
}

export interface CowPatch {
  info: CowPatchInfo;

  type: string;

  undo(): void;

  apply(): void;

  merge?(patch: CowPatch): CowPatch | undefined;
}

export interface CowValuePatchInfo<T> {
  oldValue: T;

  newValue: T;
}

export interface CowObjectPatchInfo<TTarget extends object, TKey extends keyof TTarget>
  extends CowPatchInfo,
  CowValuePatchInfo<TTarget[TKey]> {
  key: TKey;
}

export interface CowArrayPatchInfo<TItem>
  extends CowPatchInfo {
  addedItems: TItem[];

  deletedItems: TItem[];

  changedItems: { [index: number]: CowValuePatchInfo<TItem>; };
}

export function mergePatches(patches: CowPatch[], patch: CowPatch): CowPatch[] {
  const result: CowPatch[] = [];
  for (const item of patches) {
    const merged = patch.merge?.(item);
    if (merged) {
      patch = merged;
      continue;
    }
    result.push(item);
  }
  result.push(patch);
  return result;
}

export function notifyPatches(patches: CowPatch[]) {
  for (const patch of patches) {

  }
}

export function notifyUndoPatches(patches: CowPatch[]) {

}
