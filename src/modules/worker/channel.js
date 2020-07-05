/* global _ */
const recurse = (value, path = '', callFn) => {
  if (!callFn && value instanceof Function) {
    return '[CALL]' + path;
  }
  if (callFn && typeof value === 'string' && value.startsWith('[CALL]')) {
    return callFn(value.substring(6));
  }
  value = _.clone(value);
  if (_.isPlainObject(value)) {
    for (const key in value) {
      value[key] = recurse(value[key], path ? path + '.' + key : key, callFn);
    }
  } else if (value instanceof Array) {
    for (let i = 0; i < value.length; i++) {
      value[i] = recurse(value[i], path ? path + `[${i}]` : `[${i}]`, callFn);
    }
  }
  return value;
};
export default function (importModule) {
  return class Channel {
    env = [];
    worker;
    onenv;
    waitingMap = new Map();
    constructor (worker) {
      this.worker = worker;
      worker.onmessage = async e => {
        switch (e.data[0]) {
          case 'IMPORT':
          {
            const ret = await importModule(e.data[1]);
            if (ret?.NAME) this.env[ret.NAME] = ret;
            worker.postMessage(['IMPORTED', e.data[1], recurse(ret, ret?.NAME)]);
            break;
          }
          case 'IMPORTED':
          {
            const url = e.data[1];
            if (this.waitingMap.has(url)) {
              const resolve = this.waitingMap.get(url);
              this.waitingMap.delete(url);
              resolve(recurse(e.data[2], '', (path) => (...args) => this.postCALL(path, args)));
            }
            break;
          }
          case 'ENV':
          {
            const callFn = (path) => (...args) => this.postCALL(path, args);
            this.env[0] = recurse(e.data[1][0], 'BLUL', callFn);
            this.env[1] = recurse(e.data[1][1], 'GM', callFn);
            if (this.onenv instanceof Function) this.onenv(this.env);
            worker.postMessage(['ENVED']);
            break;
          }
          case 'ENVED':
          {
            if (this.waitingMap.has('ENV')) {
              const resolve = this.waitingMap.get('ENV');
              this.waitingMap.delete('ENV');
              resolve();
            }
            break;
          }
          case 'CALL':
          {
            const ret = _.get(this.env, e.data[1])?.apply(this, e.data[3]);
            if (ret instanceof Promise) {
              ret.then(value => worker.postMessage(['RETURN', e.data[1], e.data[2], recurse(value)]),
                reason => worker.postMessage(['ERROR', e.data[1], e.data[2], reason.toString()]));
            } else {
              try {
                worker.postMessage(['RETURN', e.data[1], e.data[2], recurse(ret)]);
              } catch (error) {
                worker.postMessage(['ERROR', e.data[1], e.data[2], error.toString()]);
              }
            }
            break;
          }
          case 'RETURN':
          {
            const key = e.data[1] + e.data[2];
            if (this.waitingMap.has(key)) {
              const { resolve } = this.waitingMap.get(key);
              this.waitingMap.delete(key);
              resolve(e.data[3]);
            }
            break;
          }
          case 'ERROR':
          {
            const key = e.data[1] + e.data[2];
            if (this.waitingMap.has(key)) {
              const { reject } = this.waitingMap.get(key);
              this.waitingMap.delete(key);
              reject(e.data[3]);
            }
            break;
          }
        }
      };
    }

    postENV (...envs) {
      return new Promise(resolve => {
        this.waitingMap.set('ENV', resolve);
        this.worker.postMessage(['ENV', recurse(envs)]);
      });
    }

    postIMPORT (url) {
      return new Promise(resolve => {
        this.waitingMap.set(url, resolve);
        this.worker.postMessage(['IMPORT', url]);
      });
    }

    postCALL (path, args) {
      return new Promise((resolve, reject) => {
        let i = 0;
        while (this.waitingMap.has(path + i)) i++;
        this.waitingMap.set(path + i, { resolve, reject });
        this.worker.postMessage(['CALL', path, i, args]);
      });
    }
  };
}
