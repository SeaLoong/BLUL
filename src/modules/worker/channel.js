/* global _ */
const clone = value => _.cloneDeepWith(value, v => {
  if (v instanceof Function) return 'function';
});
export default function (importModule) {
  return class Channel {
    ENV = [];
    worker;
    onenv = () => {};
    onregister = () => {};
    waitingMap = new Map();
    constructor (worker) {
      const registerFunction = (envi, path = '', entry = this.ENV[envi]) => {
        if (_.isPlainObject(entry)) {
          for (const key in entry) {
            const p = path ? path + '.' + key : key;
            entry[key] = registerFunction(envi, p, entry[key]);
          }
          return entry;
        } else if (entry instanceof Array) {
          entry.forEach((v, i) => {
            const p = path ? path + `[${i}]` : `[${i}]`;
            entry[i] = registerFunction(envi, p, entry[i]);
          });
          return entry;
        } else if (entry === 'function') {
          return (...args) => this.postCALL(envi, path, args);
        }
      };
      this.worker = worker;
      worker.onmessage = async e => {
        switch (e.data[0]) {
          case 'IMPORT':
            await importModule(e.data[1]);
            worker.postMessage(['IMPORTED', e.data[1]]);
            break;
          case 'IMPORTED':
          {
            const url = e.data[1];
            if (this.waitingMap.has(url)) {
              const { resolve } = this.waitingMap.get(url);
              this.waitingMap.delete(url);
              resolve(url);
            }
            break;
          }
          case 'ENV':
          {
            for (let i = 1; i < e.data.length; i++) {
              this.ENV.push(e.data[i]);
            }
            this.ENV.forEach((v, i) => {
              this.ENV[i] = registerFunction(i);
            });
            this.onenv(this.ENV);
            break;
          }
          case 'CALL':
          {
            const ret = _.get(this.ENV[e.data[1]], e.data[2]).apply(this, e.data[4]);
            if (ret instanceof Promise) {
              ret.then(value => worker.postMessage(['RETURN', e.data[1], e.data[2], e.data[3], clone(value)]),
                reason => worker.postMessage(['ERROR', e.data[1], e.data[2], e.data[3], reason.toString()]));
            } else {
              try {
                worker.postMessage(['RETURN', e.data[1], e.data[2], e.data[3], clone(ret)]);
              } catch (error) {
                worker.postMessage(['ERROR', e.data[1], e.data[2], e.data[3], error.toString()]);
              }
            }
            break;
          }
          case 'RETURN':
          {
            const key = e.data[1] + e.data[2] + e.data[3];
            if (this.waitingMap.has(key)) {
              const { resolve } = this.waitingMap.get(key);
              this.waitingMap.delete(key);
              resolve(e.data[4]);
            }
            break;
          }
          case 'ERROR':
          {
            const key = e.data[1] + e.data[2] + e.data[3];
            if (this.waitingMap.has(key)) {
              const { reject } = this.waitingMap.get(key);
              this.waitingMap.delete(key);
              reject(e.data[4]);
            }
            break;
          }
          case 'REGISTER':
          {
            _.set(this.ENV[e.data[1]], e.data[2], registerFunction(e.data[1], e.data[2], e.data[3]));
            this.onregister(e.data[1], e.data[2]);
            break;
          }
        }
      };
    }

    postENV (...envs) {
      return this.worker.postMessage(['ENV', ...clone(envs)]);
    }

    postIMPORT (url) {
      return new Promise((resolve, reject) => {
        this.waitingMap.set(url, { resolve, reject });
        this.worker.postMessage(['IMPORT', url]);
      });
    }

    postCALL (envi, path, args) {
      return new Promise((resolve, reject) => {
        let i = 0;
        while (this.waitingMap.has(envi + path + i)) i++;
        this.waitingMap.set(envi + path + i, { resolve, reject });
        this.worker.postMessage(['CALL', envi, path, i, args]);
      });
    }

    postREGISTER (envi, path, entry) {
      return this.worker.postMessage(['REGISTER', envi, path, clone(entry)]);
    }
  };
}
