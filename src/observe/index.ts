import { createObservableObject } from './object';
import { UndoManager } from './undo';

export * from './undo';

export function isObservable(target: any): target is object {
  if (target === undefined || target === null) {
    return false;
  }

  if (typeof target !== 'object' && typeof target !== 'function') {
    return false;
  }

  if (Array.isArray(target)) {
    return true;
  }

  const prototype = Object.getPrototypeOf(target);
  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }

  return true;
}

export function createObservable<T extends object>(
  target: T,
  undoManager: UndoManager,
): T {
  if (target instanceof Map) {
    throw new Error('Map is not supported');
  }

  // if (target instanceof Set) {
  //   throw new Error('Set is not supported');
  // }

  return createObservableObject(target as unknown as object, undoManager) as unknown as T;
}
