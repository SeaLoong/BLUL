/* global _ */
const NAME = 'App客户端';
const accessKey = '';
const defaultParams = {
  actionKey: 'appkey',
  appkey: '1d8b6e7d45233436',
  build: '6010600',
  channel: 'bili',
  device: 'android',
  mobi_app: 'android',
  platform: 'android'
};
const config = {
  appClient: false,
  userNumber: 1,
  params: false,
  appSecret: '560c52ccd288fed045859ed18bffd973',
  users: [],
  usernames: [],
  passwords: [],
  data: []
};
export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;
  await importModule('spark-md5');
  const SparkMD5 = window.SparkMD5;
  window.SparkMD5 = undefined;
  await importModule('jsencrypt');
  const JSEncrypt = window.JSEncrypt;
  window.JSEncrypt = undefined;

  const sign = (params) => {
    const _params = _.defaultsDeep({}, params);
    _.defaultsDeep(_params, defaultParams);
    _params.ts = Math.round(Date.now() / 1e3);
    const str = Util.toURLSearchParamString(Util.sortByKey(_params)) + config.appSecret;
    _params.sign = SparkMD5.hash(str);
    return _params;
  };

  const crypt = () => {
  };

  class AppClient {
    constructor (index) {
      this.index = index;
    }

    async getKey () {

    }

    async login () {
      const username = config.usernames[this.index];
      let response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://passport.bilibili.com/api/oauth2/getKey',
        data: sign({ appkey: 'bca7e84c2d947ac6' })
      });
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(response.data.key);
      const password = btoa(encrypt.encrypt(response.data.hash + config.passwords[this.index]));
      response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://passport.bilibili.com/api/v3/oauth2/login',
        data: sign({
          appkey: 'bca7e84c2d947ac6',
          username,
          password,
          captcha: ''
        })
      });
      config.data[this.index] = response.data;
    }
  }

  BLUL.onpreinit.push(() => {
    BLUL.addResource('spark-md5', ['https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js', 'https://cdn.jsdelivr.net/npm/spark-md5@3.0.1/spark-md5.min.js']);
    BLUL.addResource('jsencrypt', ['https://cdn.bootcdn.net/ajax/libs/jsencrypt/3.0.0-rc.1/jsencrypt.min.js', 'https://cdn.jsdelivr.net/npm/jsencrypt@3.0.0-rc.1/bin/jsencrypt.min.js']);

    BLUL.Config.addItem('appClient', 'App客户端设置', config.appClient, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('appClient.userNumber', '用户数', config.userNumber, { tag: 'input', attribute: { type: 'number', min: 1, max: 8 } });
    for (let i = 0; i < config.userNumber; ++i) {
      BLUL.Config.addItem(`appClient.users.${i}`, `用户${i}`, config.users[i] ?? false, { tag: 'input', attribute: { type: 'checkbox' } });
      BLUL.Config.addItem(`appClient.usernames.${i}`, '用户名', config.usernames[i] ?? '', { tag: 'input', attribute: { type: 'text' } });
      BLUL.Config.addItem(`appClient.passwords.${i}`, '密码', config.passwords[i] ?? '', { tag: 'input', attribute: { type: 'password' } });
      BLUL.Config.addItem(`appClient.data.${i}`, '数据', JSON.stringify(config.data[i] ?? '{}'), { tag: 'input', attribute: { type: 'text', readonly: true } });
    }
    BLUL.Config.addItem('appClient.params', '参数设置', config.params, { tag: 'input', attribute: { type: 'checkbox' } });
    for (const key in defaultParams) {
      BLUL.Config.addItem(`appClient.params.${key}`, key, defaultParams[key], { tag: 'input', attribute: { type: 'text' } });
    }
    BLUL.Config.addItem('appClient.params.appSecret', 'appSecret', config.appSecret, { tag: 'input', attribute: { type: 'text' } });

    BLUL.Config.onload.push(() => {
      config.appClient = BLUL.Config.get('appClient');
      config.userNumber = BLUL.Config.get('appClient.userNumber');
      for (let i = 0; i < config.userNumber; ++i) {
        config.users[i] = BLUL.Config.get(`appClient.users.${i}`) ?? false;
        config.usernames[i] = BLUL.Config.get(`appClient.usernames.${i}`) ?? '';
        config.passwords[i] = BLUL.Config.get(`appClient.passwords.${i}`) ?? '';
        config.data[i] = JSON.parse(BLUL.Config.get(`appClient.data.${i}`) ?? '{}');
      }
      config.params = BLUL.Config.get('appClient.params');
      for (const key in defaultParams) {
        defaultParams[key] = BLUL.Config.get(`appClient.params.${key}`);
      }
      config.appSecret = BLUL.Config.get('appClient.params.appSecret');
    });
  });

  BLUL.debug('Module Loaded: AppClient', BLUL.AppClient);

  return BLUL.AppClient;
}
