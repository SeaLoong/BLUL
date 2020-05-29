/*
// 接收方
export default async function (importModule, BLUL, GM) {
  Channel: {
    worker: undefined,
    id: 1,
    waitingCallback: new Map(),
    init: worker => {
      BLUL.Channel.worker = worker;
      BLUL.Channel.worker.onmessage = BLUL.Channel.onmessage;
    },
    onmessage: event => {
      const get = BLUL.Channel.get;
      const success = BLUL.Channel.post.success;
      const fail = BLUL.Channel.post.fail;
      const d = event.data;
      const op = d[0];
      switch (op) {
        case 'INIT': {
          DEBUGMODE = d[1];
          CONFIG = d[2];
          CACHE = d[3];
          INFO = d[4];
          init(); // eslint-disable-line no-undef
          break;
        }
        case 'SUCCESS': {
          const id = d[1];
          const data = d[2];
          if (BLUL.Channel.waitingCallback.has(id)) {
            BLUL.Channel.waitingCallback.get(id)[0](data);
          }
          break;
        }
        case 'FAIL': {
          const id = d[1];
          const data = d[2];
          if (BLUL.Channel.waitingCallback.has(id)) {
            BLUL.Channel.waitingCallback.get(id)[1](data);
          }
          break;
        }
        case 'UPDATE': {
          const name = d[1];
          const value = d[2];
          switch (name) {
            case 'CONFIG':
              CONFIG = value;
              break;
            case 'CACHE':
              CACHE = value;
              break;
            case 'INFO':
              INFO = value;
              break;
          }
          break;
        }
        case 'CALL': {
          const id = d[1];
          const path = d[2];
          const args = d[3];
          const ret = get(path, BLUL)(...args);
          if (ret instanceof Promise) {
            ret.then(value => {
              success(id, value);
            }).catch(reason => {
              fail(id, reason);
            });
          } else {
            success(id, ret);
          }
          break;
        }
        case 'API': {
          const id = d[1];
          const path = d[2];
          const args = d[3];
          const ret = get(path, API)(...args); // eslint-disable-line no-undef
          if (ret instanceof Promise) {
            ret.then(value => {
              success(id, value);
            }).catch(reason => {
              fail(id, reason);
            });
          } else {
            success(id, ret);
          }
          break;
        }
      }
    },
    post: {
      init: (debugmode, config, cache, info) => {
        BLUL.Channel.worker.postMessage(['INIT', debugmode, config, cache, info]);
      },
      success: (id, data) => {
        BLUL.Channel.worker.postMessage(['SUCCESS', id, data]);
      },
      fail: (id, data) => {
        BLUL.Channel.worker.postMessage(['FAIL', id, data]);
      },
      update: (name, value) => {
        if (BLUL.Channel.worker) { BLUL.Channel.worker.postMessage(['UPDATE', name, value]); }
      },
      call: (path, ...args) => {
        return new Promise((resolve, reject) => {
          if (BLUL.Channel.worker) {
            const id = BLUL.Channel.id++;
            BLUL.Channel.worker.postMessage(['CALL', id, path, args]);
            BLUL.Channel.waitingCallback.set(id, [resolve, reject]);
          } else {
            resolve();
          }
        });
      },
      api: (path, ...args) => {
        return new Promise((resolve, reject) => {
          if (BLUL.Channel.worker) {
            const id = BLUL.Channel.id++;
            BLUL.Channel.worker.postMessage(['API', id, path, args]);
            BLUL.Channel.waitingCallback.set(id, [resolve, reject]);
          } else {
            resolve();
          }
        });
      }
    }
  }
}
*/
