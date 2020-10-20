export * from './scope';
export * from './object';

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
