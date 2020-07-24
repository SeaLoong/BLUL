/* global _ */
/*
请求的options标准格式：
{
  method: 'GET',
  url: 'https://example.com',
  search: {}, // 查询字符串
  headers: {},
  data: {} // POST用，fetch下会自动转换为 URLSearchParam ，monkeyx想类型取决于 Content-type
  /// 剩余参数取决于所选择的实现
}
 */
const config = {
  interval: 50,
  maxRequesting: 8
};
export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  let requesting = 0;

  const monkey = async (options) => {
    if (_.isString(options)) options = { url: options };
    const details = _.defaultsDeep({}, options);
    _.defaultsDeep(details, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        Cookie: document.cookie
      },
      responseType: 'json'
    });
    if (!_.isEmpty(details.search)) {
      details.url += '?' + Util.toURLSearchParamString(details.search);
    }
    if (details.method === 'POST' && !_.isEmpty(details.data)) {
      _.defaultsDeep(details, { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' } });
    }
    const responseType = details.responseType;
    // eslint-disable-next-line no-unmodified-loop-condition
    while (requesting >= config.maxRequesting) {
      await Util.sleep(config.interval);
    }
    return new Promise((resolve, reject) => {
      requesting++;
      details.onload = response => {
        requesting--;
        response.arrayBuffer = async function () {
          if (responseType === 'arraybuffer') return response.response;
          throw new TypeError('Invalid responseType ' + responseType);
        };
        response.blob = async function () {
          if (responseType === 'blob') return response.response;
          throw new TypeError('Invalid responseType ' + responseType);
        };
        response.json = async function () {
          if (responseType === 'json') return response.response;
          try {
            if (responseType === 'text' || responseType === '') return JSON.parse(response.response);
          } catch (error) {
            throw new TypeError('Invalid responseType ' + responseType);
          }
        };
        response.text = async function () {
          if (responseType === 'text' || responseType === '') return response.response;
          throw new TypeError('Invalid responseType ' + responseType);
        };
        BLUL.debug('Request.monkey:', details, response);
        return resolve(response);
      };
      details.ontimeout = response => {
        requesting--;
        BLUL.debug('Request.monkey:', details, response);
        return reject(response);
      };
      GM.xmlHttpRequest(details);
    });
  };

  const fetch = async (options) => {
    if (_.isString(options)) options = { url: options };
    const init = _.defaultsDeep({}, options);
    _.defaultsDeep(init, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*'
      },
      credentials: 'include',
      referrer: ''
    });
    if (!_.isEmpty(init.search)) {
      init.url += '?' + Util.toURLSearchParamString(init.search);
    }
    if (init.method === 'POST' && !_.isEmpty(init.data)) {
      _.defaultsDeep(init, { headers: { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' } });
      if (init.headers?.['content-type']?.includes('application/x-www-form-urlencoded')) {
        init.body = Util.toURLSearchParamString(init.data);
      } else {
        init.body = init.data;
      }
    }
    // eslint-disable-next-line no-unmodified-loop-condition
    while (requesting >= config.maxRequesting) {
      await Util.sleep(config.interval);
    }
    return new Promise((resolve, reject) => {
      requesting++;
      const req = new Request(init.url, init);
      window.fetch(req).then(response => {
        requesting--;
        BLUL.debug('Request.fetch:', req, response);
        return resolve(response);
      }, reason => {
        requesting--;
        BLUL.debug('Request.fetch:', req, reason);
        return reject(reason);
      });
    });
  };

  BLUL.onpreinit(() => {
    BLUL.Config.addItem('request', '网络请求设置', false, {
      tag: 'input',
      title: '如果你不明白这是什么，请不要修改此设置项。',
      help: '如果你不明白这是什么，请不要修改此设置项。',
      onclick: (checked) => {
        if (!checked) return;
        const dialog = new BLUL.Dialog('如果你不明白这是什么，请不要修改此设置项。确定要继续？', '警告');
        dialog.addButton('确定', () => dialog.close(true));
        dialog.addButton('取消', () => dialog.close(false), 1);
        return dialog.show();
      },
      attribute: { type: 'checkbox' }
    });
    BLUL.Config.addItem('request.interval', '请求间隔', config.interval, { tag: 'input', attribute: { type: 'number', placeholder: '单位(ms)', min: 1 } });
    BLUL.Config.addItem('request.maxRequesting', '最大并发数', config.maxRequesting, { tag: 'input', attribute: { type: 'number', min: 1 } });

    BLUL.Config.onload(() => {
      config.interval = BLUL.Config.get('request.interval');
      config.maxRequesting = BLUL.Config.get('request.maxRequesting');
    });
  });

  BLUL.Request = {
    monkey,
    fetch
  };

  BLUL.debug('Module Loaded: Request', BLUL.Request);

  return BLUL.Request;
}
