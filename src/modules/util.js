export function getGlobalScope () {
  /* eslint-disable no-undef, no-constant-condition */
  if (typeof Window !== 'undefined') return 'Window';
  if (typeof DedicatedWorkerGlobalScope !== 'undefined') return 'Worker';
  if (typeof SharedWorkerGlobalScope !== 'undefined') return 'SharedWorker';
  if (typeof ServiceWorkerGlobalScope !== 'undefined') return 'ServiceWorker';
  return null;
  /* eslint-enable no-undef, no-constant-condition */
}

export function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function result (value, thisArg, ...args) {
  return value instanceof Function ? value.apply(thisArg, args) : value;
}

export function codeToURL (code) {
  return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
}

export function toURLSearchParamString (search) {
  return (search instanceof URLSearchParams ? search : new URLSearchParams(search)).toString();
}

export function getCookie (sKey) {
  return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
}

// version1 > version2 返回大于0的数
// version1 === version2 返回0
// version1 < version2 返回小于0的数
export function compareVersion (version1, version2) {
  version1 = version1 ?? '';
  version2 = version2 ?? '';
  const v1Arr = version1.split('.');
  const v2Arr = version2.split('.');
  const n = Math.min(v1Arr.length, v2Arr.length);
  for (let i = 0; i < n; i++) {
    let num1 = parseInt(v1Arr[i], 10);
    let num2 = parseInt(v2Arr[i], 10);
    if (isNaN(num1)) num1 = 0;
    if (isNaN(num2)) num2 = 0;
    if (num1 === num2) {
      const m = Math.min(v1Arr[i].length, v2Arr[i].length);
      for (let j = 0; j < m; j++) {
        const c1 = v1Arr[i].charCodeAt(j);
        const c2 = v2Arr[i].charCodeAt(j);
        if (c1 !== c2) return c1 - c2;
      }
      if (v1Arr[i].length !== v2Arr[i].length) return v1Arr[i].length - v2Arr[i].length;
    } else {
      return num1 - num2;
    }
  }
  return v1Arr.length - v2Arr.length;
}

export function beforeNow (ts, range = 86400e3, offset = 60e3) {
  return (Date.now() - ts < range - offset);
}

export function isToday (ts) {
  const d = new Date();
  const offset = d.getTimezoneOffset() + 480;
  d.setMinutes(d.getMinutes() + offset);
  const t = new Date(ts);
  t.setMinutes(t.getMinutes() + offset);
  t.setHours(0, 0, 0, 0);
  return (d - t < 86400e3);
}

export function atTime (ts, hours = 0, min = 1, sec = 0, ms = 0) {
  ts = ts ?? Date.now();
  const t = new Date(ts);
  t.setHours(hours, min + t.getTimezoneOffset() + 480, sec, ms);
  if (t < ts) {
    t.setDate(t.getDate() + 1);
  }
  return t;
}

export function isAtTime (ts, hours, min, sec, ms) {
  return atTime(ts, hours, min, sec, ms) <= Date.now();
}

const callAtTimeMap = new Map();

export function callAtTime (f, hours, min, sec, ms) {
  if (callAtTimeMap.has(f)) return callAtTimeMap.get(f).promise;
  const obj = {};
  const promise = new Promise(resolve => {
    const timeout = setTimeout(() => {
      callAtTimeMap.delete(f);
      resolve(result(f));
    }, atTime(Date.now(), hours, min, sec, ms) - Date.now());
    obj.timeout = timeout;
    obj.resolve = resolve;
  });
  obj.promise = promise;
  callAtTimeMap.set(f, obj);
  return promise;
}

export function cancelCallAtTime (f) {
  if (!callAtTimeMap.has(f)) return;
  const { timeout, resolve } = callAtTimeMap.get(f);
  callAtTimeMap.delete(f);
  clearTimeout(timeout);
  resolve();
}

export function sortByKey (obj, compareFn, reverse = false) {
  let keys = Object.keys(obj).sort(compareFn);
  if (reverse) keys = keys.reverse();
  const ret = {};
  for (const key of keys) {
    ret[key] = obj[key];
  }
  return ret;
}

export function mapAndWait (array, f, thisArg) {
  array = array ?? [];
  f = f ?? (x => x);
  return Promise.all(array.map(f, thisArg));
}

export async function mapKeysAndWait (object, f, thisArg) {
  object = object ?? {};
  f = f ?? (x => x);
  const ret = {};
  for (const key in object) {
    ret[await result(f, thisArg, object[key], key, object)] = object[key];
  }
  return ret;
}

export async function mapValuesAndWait (object, f, thisArg) {
  object = object ?? {};
  f = f ?? (x => x);
  const ret = {};
  for (const key in object) {
    ret[key] = await result(f, thisArg, object[key], key, object);
  }
  return ret;
}

export function callEachAndWait (funcs, thisArg, ...args) {
  return mapAndWait(funcs, f => f.apply?.(thisArg, args));
}

export async function callChainAndWait (funcs, thisArg, ...args) {
  funcs = funcs ?? [];
  for (const f of funcs) {
    args = [await f.apply(thisArg, args)];
  }
  return args[0];
}

export async function callUntilTrue (f, interval = 50, timeout = 30e3, thisArg, ...args) {
  if (!(f instanceof Function)) return f;
  let timeup = false;
  const t = setTimeout(() => (timeup = true), timeout);
  while (true) {
    const r = await f.apply(thisArg, args);
    if (r || timeup) {
      clearTimeout(t);
      return r;
    }
    await sleep(interval);
  }
}

const retryTimeMap = new Map();
const retryMap = new Map();

export function retry (f) {
  if (retryMap.has(f)) return retryMap.get(f).promise;
  const ms = retryTimeMap.get(f) ?? 5e3;
  const obj = {};
  const promise = new Promise(resolve => {
    const timeout = setTimeout(() => {
      retryMap.delete(f);
      resolve(result(f));
    }, ms);
    obj.timeout = timeout;
    obj.resolve = resolve;
  });
  obj.promise = promise;
  retryMap.set(f, obj);
  retryTimeMap.set(f, Math.min(ms * 2, 3600e3));
  return promise;
}

export function cancelRetry (f) {
  if (!retryMap.has(f)) return;
  const { timeout, resolve } = retryMap.get(f);
  retryMap.delete(f);
  retryTimeMap.delete(f);
  clearTimeout(timeout);
  resolve();
}

export default {
  getGlobalScope,
  sleep,
  result,
  codeToURL,
  toURLSearchParamString,
  getCookie,
  compareVersion,
  beforeNow,
  isToday,
  atTime,
  isAtTime,
  callAtTime,
  cancelCallAtTime,
  sortByKey,
  mapAndWait,
  mapKeysAndWait,
  mapValuesAndWait,
  callEachAndWait,
  callUntilTrue,
  retry,
  cancelRetry
};
