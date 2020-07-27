function getGlobalScope () {
  /* eslint-disable no-undef, no-constant-condition */
  if (typeof Window !== 'undefined') return 'Window';
  if (typeof DedicatedWorkerGlobalScope !== 'undefined') return 'Worker';
  if (typeof SharedWorkerGlobalScope !== 'undefined') return 'SharedWorker';
  if (typeof ServiceWorkerGlobalScope !== 'undefined') return 'ServiceWorker';
  return null;
  /* eslint-enable no-undef, no-constant-condition */
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function result (value, thisArg, ...args) {
  return value instanceof Function ? value.apply(thisArg, args) : value;
}

function codeToURL (code) {
  return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
}

function dataURL2Blob (dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function blob2DataURL (blob) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(blob);
  });
}

function toURLSearchParamString (search) {
  return (search instanceof URLSearchParams ? search : new URLSearchParams(search)).toString();
}

function getCookie (sKey) {
  return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
}

const keyEqualValueReg = /(?<=^|;)\s*([^=]+)\s*=\s*([^;]*)\s*(?=;|$)/g;
function cookieStr2Object (s) {
  const obj = {};
  let r;
  while ((r = keyEqualValueReg.exec(s))) {
    obj[decodeURIComponent(r[1])] = decodeURIComponent(r[2]);
  }
  return obj;
}

const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function randomID (length) {
  let ret = chars[Math.floor(Math.random() * 26) + 10];
  while (--length > 0) ret += chars[Math.floor(Math.random() * 61)];
  return ret;
}

function int2str (x, length) {
  const s = x.toString();
  if (length > s.length) {
    return '0'.repeat(length - s.length) + s;
  }
  return s;
}

// version1 > version2 返回大于0的数
// version1 === version2 返回0
// version1 < version2 返回小于0的数
function compareVersion (version1, version2) {
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

function beforeNow (ts, range = 86400e3, offset = 60e3) {
  return (Date.now() - ts < range - offset);
}

function isToday (ts) {
  const d = new Date();
  const offset = d.getTimezoneOffset() + 480;
  d.setMinutes(d.getMinutes() + offset);
  const t = new Date(ts);
  t.setMinutes(t.getMinutes() + offset);
  t.setHours(0, 0, 0, 0);
  return (d - t < 86400e3);
}

// 返回一个不小于 ts 的在指定时间的时间戳
function atTime (ts, hours = 0, min = 1, sec = 0, ms = 0) {
  ts = ts ?? Date.now();
  const t = new Date(ts);
  t.setHours(hours, min + t.getTimezoneOffset() + 480, sec, ms);
  if (t < ts) {
    t.setDate(t.getDate() + 1);
  }
  return t;
}

function isAtTime (ts, hours, min, sec, ms) {
  return atTime(ts, hours, min, sec, ms) <= Date.now();
}

const callAtTimeMap = new Map();

function callAtTime (f, hours, min, sec, ms) {
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

function cancelCallAtTime (f) {
  if (!callAtTimeMap.has(f)) return;
  const { timeout, resolve } = callAtTimeMap.get(f);
  callAtTimeMap.delete(f);
  clearTimeout(timeout);
  resolve();
}

function sortByKey (obj, compareFn, reverse = false) {
  let keys = Object.keys(obj).sort(compareFn);
  if (reverse) keys = keys.reverse();
  const ret = {};
  for (const key of keys) {
    ret[key] = obj[key];
  }
  return ret;
}

function mapAndWait (array, f, thisArg) {
  array = array ?? [];
  f = f ?? (x => x);
  return Promise.all(array.map(f, thisArg));
}

async function mapKeysAndWait (object, f, thisArg) {
  object = object ?? {};
  f = f ?? (x => x);
  const ret = {};
  for (const key in object) {
    ret[await result(f, thisArg, object[key], key, object)] = object[key];
  }
  return ret;
}

async function mapValuesAndWait (object, f, thisArg) {
  object = object ?? {};
  f = f ?? (x => x);
  const ret = {};
  for (const key in object) {
    ret[key] = await result(f, thisArg, object[key], key, object);
  }
  return ret;
}

function callEachAndWait (funcs, thisArg, ...args) {
  return mapAndWait(funcs, f => f.apply?.(thisArg, args));
}

async function callChainAndWait (funcs, thisArg, ...args) {
  funcs = funcs ?? [];
  for (const f of funcs) {
    args = [await f.apply(thisArg, args)];
  }
  return args[0];
}

async function callUntilTrue (f, interval = 50, timeout = 30e3, thisArg, ...args) {
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

function retry (f) {
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

function cancelRetry (f) {
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
  dataURL2Blob,
  blob2DataURL,
  toURLSearchParamString,
  getCookie,
  cookieStr2Object,
  randomID,
  int2str,
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
  callChainAndWait,
  callUntilTrue,
  retry,
  cancelRetry
};
