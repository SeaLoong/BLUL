/* global _ */
const NAME = 'App客户端';
const defaultParams = {
  appkey: '1d8b6e7d45233436',
  build: '6010600',
  channel: 'bili',
  device: 'android',
  mobi_app: 'android',
  platform: 'android',
  statistics: '{"appId":1,"platform":3,"version":"6.1.0","abtest":""}'
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
  await (async () => {
    BLUL.RESOURCE['spark-md5'] = 'https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js';
    BLUL.RESOURCE.jsencrypt = 'https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/libs/jsencrypt.min.js';
    if (await GM.getValue('resetResource')) return;
    const resource = (await GM.getValue('config'))?.resource;
    if (!resource) return;
    if (resource['spark-md5']?.__VALUE__) BLUL.RESOURCE['spark-md5'] = resource['spark-md5'].__VALUE__;
    if (resource.jsencrypt?.__VALUE__) BLUL.RESOURCE.jsencrypt = resource.jsencrypt.__VALUE__;
  })();

  const Util = BLUL.Util;
  await importModule('spark-md5');
  const SparkMD5 = window.SparkMD5;
  window.SparkMD5 = undefined;
  await importModule('jsencrypt');
  const JSEncrypt = window.JSEncrypt;
  window.JSEncrypt = undefined;

  const sign = (params) => {
    let _params = _.defaultsDeep({}, params);
    _.defaultsDeep(_params, defaultParams);
    _params.ts = Math.round(Date.now() / 1e3);
    _params = Util.sortByKey(_params);
    console.log(_params);
    const str = Util.toURLSearchParamString(_params) + config.appSecret;
    _params.sign = SparkMD5.hash(str);
    return _params;
  };

  class AppClient {
    constructor (index) {
      this.index = index;
      this.username = config.usernames[index];
      this.password = config.passwords[index];
    }

    async ensureValid () {

    }

    async getKey () {
      const response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://passport.bilibili.com/api/oauth2/getKey',
        data: sign({ appkey: 'bca7e84c2d947ac6' })
      });
      this.publicKey = response.data.key;
      this.hash = response.data.hash;
    }

    async login () {
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(this.oauth2.publicKey);
      const password = btoa(encrypt.encrypt(this.oauth2.hash + this.password));
      const username = this.username;
      const response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://passport.bilibili.com/api/v3/oauth2/login',
        data: sign({
          appkey: 'bca7e84c2d947ac6',
          username,
          password,
          captcha: ''
        })
      });
      this.updateLoginData(response.data);
    }

    async checkAccessKey () {
      const response = await BLUL.Request.fetch({
        url: 'https://passport.bilibili.com/api/v3/oauth2/info',
        data: sign(_.assign({
          appkey: 'bca7e84c2d947ac6',
          access_key: this.accessKey
        }, this.cookieObject))
      });
      return (!response.code && response.data?.mid);
    }

    async refresh () {
      const response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://passport.bilibili.com/api/v2/oauth2/refresh_token',
        data: sign(_.assign({
          appkey: 'bca7e84c2d947ac6',
          access_key: this.accessKey,
          refresh_token: this.refreshToken
        }, this.cookieObject))
      });
      this.updateLoginData(response.data);
    }

    async logout () {
      const response = await BLUL.Request.fetch({
        url: 'https://passport.bilibili.com/login?act=exit',
        data: sign(_.assign({
          appkey: 'bca7e84c2d947ac6',
          access_key: this.accessKey,
          refresh_token: this.refreshToken
        }, this.cookieObject))
      });
    }

    updateLoginData (data) {
      config.data[this.index] = data;
      this.accessKey = data.token_info.access_token;
      this.refreshToken = data.token_info.refresh_token;
      this.cookieObject = {};
      for (const o of data.cookie_info.cookies) {
        this.cookieObject[o.name] = o.value;
        switch (o.name) {
          case 'bili_jct':
            this.csrf = o.value;
            break;
          case 'DedeUserID':
            this.uid = o.value;
        }
      }
    }
  }

  BLUL.onpreinit.push(() => {
    BLUL.addResource('spark-md5', [BLUL.RESOURCE['spark-md5'], 'https://cdn.jsdelivr.net/npm/spark-md5@3.0.1/spark-md5.min.js']);
    BLUL.addResource('jsencrypt', [BLUL.RESOURCE.jsencrypt]);

    BLUL.Config.addItem('appClient', 'App客户端设置', config.appClient, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('appClient.params', '参数设置', config.params, {
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
    for (const key in defaultParams) {
      BLUL.Config.addItem(`appClient.params.${key}`, key, defaultParams[key], { tag: 'input', attribute: { type: 'text' } });
    }
    BLUL.Config.addItem('appClient.params.appSecret', 'appSecret', config.appSecret, { tag: 'input', attribute: { type: 'text' } });
    BLUL.Config.addItem('appClient.userNumber', '用户数', config.userNumber, { tag: 'input', help: '此项需要在保存并重新打开设置界面后才会生效，会在下方显示多名用户的设置项。<br>取值范围为0~8。', attribute: { type: 'number', min: 0, max: 8 } });
    for (let i = 0; i < config.userNumber; ++i) {
      BLUL.Config.addItem(`appClient.user${i}`, () => config.usernames[i] ?? `用户 ${i + 1}`, config.users[i] ?? false, { tag: 'input', attribute: { type: 'checkbox' } });
      BLUL.Config.addItem(`appClient.user${i}.username`, '账号', config.usernames[i] ?? '', { tag: 'input', attribute: { type: 'text' } });
      BLUL.Config.addItem(`appClient.user${i}.password`, '密码', config.passwords[i] ?? '', { tag: 'input', attribute: { type: 'password' } });
      BLUL.Config.addItem(`appClient.user${i}.data`, '数据', JSON.stringify(config.data[i] ?? {}), { tag: 'input', help: '此项只用于存储和显示数据', attribute: { type: 'text', readonly: true } });
    }

    BLUL.Config.onload.push(() => {
      config.appClient = BLUL.Config.get('appClient');
      config.params = BLUL.Config.get('appClient.params');
      for (const key in defaultParams) {
        defaultParams[key] = BLUL.Config.get(`appClient.params.${key}`);
      }
      config.appSecret = BLUL.Config.get('appClient.params.appSecret');
      const userNumber = config.userNumber;
      config.userNumber = BLUL.Config.get('appClient.userNumber');
      const minUserNumber = Math.min(userNumber, config.userNumber);
      for (let i = 0; i < minUserNumber; ++i) {
        config.users[i] = BLUL.Config.get(`appClient.user${i}`) ?? false;
        config.usernames[i] = BLUL.Config.get(`appClient.user${i}.username`) ?? '';
        config.passwords[i] = BLUL.Config.get(`appClient.user${i}.password`) ?? '';
        config.data[i] = JSON.parse(BLUL.Config.get(`appClient.user${i}.data`) ?? '{}');
      }
      for (let i = userNumber; i < config.userNumber; ++i) {
        BLUL.Config.addItem(`appClient.user${i}`, () => config.usernames[i] ? config.usernames[i] : `用户 ${i + 1}`, config.users[i] ?? false, { tag: 'input', attribute: { type: 'checkbox' } });
        BLUL.Config.addItem(`appClient.user${i}.username`, '账号', config.usernames[i] ?? '', { tag: 'input', attribute: { type: 'text' } });
        BLUL.Config.addItem(`appClient.user${i}.password`, '密码', config.passwords[i] ?? '', { tag: 'input', attribute: { type: 'password' } });
        BLUL.Config.addItem(`appClient.user${i}.data`, '数据', JSON.stringify(config.data[i] ?? {}), { tag: 'input', help: '此项只用于存储和显示数据', attribute: { type: 'text', readonly: true } });
      }
      for (let i = config.userNumber; i < userNumber; ++i) {
        BLUL.Config.removeItem(`appClient.user${i}`);
        BLUL.Config.removeItem(`appClient.user${i}.username`);
        BLUL.Config.removeItem(`appClient.user${i}.password`);
        BLUL.Config.removeItem(`appClient.user${i}.data`);
      }
    });
  });

  BLUL.AppClient = AppClient;

  BLUL.debug('Module Loaded: AppClient', BLUL.AppClient);

  return BLUL.AppClient;
}
