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
    env = {};
    id = 0;
    worker;
    onenv;
    waitingMap = new Map();
    constructor (worker) {
      this.worker = worker;
      const callFn = path => (...args) => this.postCALL(path, args);
      worker.onmessage = async e => {
        const [id, op, data] = e.data;
        switch (op) {
          case 'IMPORT':
          {
            const ret = await importModule(data);
            if (ret?.NAME) this.env[ret.NAME] = ret;
            this.post(id, 'IMPORTED', recurse(ret, ret?.NAME));
            break;
          }
          case 'IMPORTED':
            this.resolvePost(id, recurse(data, '', callFn));
            break;
          case 'ENV':
          {
            const [env, name] = data;
            this.env[name] = recurse(env, name, callFn);
            if (this.onenv instanceof Function) this.onenv(env, name);
            this.post(id, 'ENVED');
            break;
          }
          case 'ENVED':
            this.resolvePost(id);
            break;
          case 'CALL':
          {
            const [path, args] = data;
            try {
              const ret = _.get(this.env, path)?.apply(this, args);
              if (ret instanceof Promise) {
                ret.then(value => this.post(id, 'RETURN', recurse(value)),
                  reason => this.post(id, 'ERROR', reason.toString()));
              } else {
                this.post(id, 'RETURN', recurse(ret));
              }
            } catch (error) {
              this.post(id, 'ERROR', error.toString());
            }
            break;
          }
          case 'RETURN':
            this.resolvePost(id, data);
            break;
          case 'ERROR':
            this.rejectPost(id, data);
            break;
        }
      };
    }

    post (id, op, data) {
      this.worker.postMessage([id, op, data]);
    }

    postAndWait (op, data) {
      while (this.waitingMap.has(this.id)) this.id++;
      return new Promise((resolve, reject) => {
        this.waitingMap.set(this.id, { resolve, reject });
        this.post(this.id, op, data);
      });
    }

    resolvePost (id, value) {
      if (this.waitingMap.has(id)) {
        const { resolve } = this.waitingMap.get(id);
        this.waitingMap.delete(id);
        return resolve(value);
      }
    }

    rejectPost (id, value) {
      if (this.waitingMap.has(id)) {
        const { reject } = this.waitingMap.get(id);
        this.waitingMap.delete(id);
        return reject(value);
      }
    }

    postIMPORT (res) {
      return this.postAndWait('IMPORT', res);
    }

    postENV (env, name) {
      return this.postAndWait('ENV', [recurse(env), name]);
    }

    postCALL (path, args) {
      return this.postAndWait('CALL', [path, args]);
    }
  };
}
