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
  user: 0,
  params: false,
  appSecret: {
    '1d8b6e7d45233436': '560c52ccd288fed045859ed18bffd973',
    bca7e84c2d947ac6: '60698ba2f68e01ce44738920a0ffe768',
    '57263273bc6b67f6': 'a0488e488d1567960d3a765e8d129f90'
  },
  users: [],
  usernames: [],
  passwords: [],
  data: []
};
export default async function (importModule, BLUL, GM) {
  await BLUL.addResource('spark-md5', ['https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js', 'https://cdn.jsdelivr.net/npm/spark-md5@3.0.1/spark-md5.min.js']);
  await BLUL.addResource('jsencrypt', ['https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/libs/jsencrypt.min.js']);

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
    const str = Util.toURLSearchParamString(_params) + config.appSecret[_params.appkey];
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
      const obj = await response.json();
      this.publicKey = obj.data.key;
      this.hash = obj.data.hash;
    }

    async login () {
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(this.publicKey);
      const password = btoa(encrypt.encrypt(this.hash + this.password));
      const username = this.username;
      const response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://passport.bilibili.com/api/v3/oauth2/login',
        data: sign({
          appkey: 'bca7e84c2d947ac6',
          buvid: 'XZB06D6BECF9575A7078795E91F615160606E',
          username,
          password,
          captcha: '',
          device: 'phone'
        })
      });
      const obj = await response.json();
      this.updateLoginData(obj.data);
    }

    async checkAccessKey () {
      const response = await BLUL.Request.fetch({
        url: 'https://passport.bilibili.com/api/v3/oauth2/info',
        data: sign(_.assign({
          appkey: 'bca7e84c2d947ac6',
          access_key: this.accessKey
        }, this.cookieObject))
      });
      const obj = await response.json();
      return (!obj.code && obj.data?.mid);
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
      const obj = await response.json();
      this.updateLoginData(obj.data);
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
      const obj = await response.json();
    }

    async updateLoginData (data) {
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
      try {
        await BLUL.Config.set(`appClient.user.${this.index}.data`, JSON.stringify(config.data[this.index]));
        await BLUL.Config.save();
      } catch (error) {
        BLUL.Logger.error(NAME, `${this.index}: ${this.username}`, '登录数据保存失败', error);
      }
    }
  }

  BLUL.onpreinit(() => {
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
    BLUL.Config.addItem('appClient.params.appSecret', 'appSecret', JSON.stringify(config.appSecret), { tag: 'input', attribute: { type: 'text' } });
    BLUL.Config.addItem('appClient.user', '用户数', config.user, { tag: 'input', help: '此项需要在保存并重新打开设置界面后才会生效，会在下方显示多名用户的设置项。<br>取值范围为0~8。', attribute: { type: 'number', min: 0, max: 8 } });
    const addUser = (i) => {
      BLUL.Config.addItem(`appClient.user.${i}`, () => config.usernames[i] ? config.usernames[i] : `用户 ${i + 1}`, config.users[i] ?? false, { tag: 'input', attribute: { type: 'checkbox' } });
      BLUL.Config.addItem(`appClient.user.${i}.username`, '账号', config.usernames[i] ?? '', { tag: 'input', attribute: { type: 'text' } });
      BLUL.Config.addItem(`appClient.user.${i}.password`, '密码', config.passwords[i] ?? '', { tag: 'input', attribute: { type: 'password' } });
      BLUL.Config.addItem(`appClient.user.${i}.data`, '数据', JSON.stringify(config.data[i] ?? {}), { tag: 'input', help: '此项只用于存储和显示数据', attribute: { type: 'text', readonly: true } });
      config.users.push(BLUL.Config.get(`appClient.user.${i}`));
      config.usernames.push(BLUL.Config.get(`appClient.user.${i}.username`));
      config.passwords.push(BLUL.Config.get(`appClient.user.${i}.password`));
      config.data.push(BLUL.Config.get(`appClient.user.${i}.data`));
    };
    for (let i = 0; i < config.user; i++) {
      addUser(i);
    }
    BLUL.Config.onload(() => {
      config.appClient = BLUL.Config.get('appClient');
      config.params = BLUL.Config.get('appClient.params');
      for (const key in defaultParams) {
        defaultParams[key] = BLUL.Config.get(`appClient.params.${key}`);
      }
      try {
        const appSecret = JSON.parse(BLUL.Config.get('appClient.params.appSecret'));
        if (_.isPlainObject(appSecret)) {
          config.appSecret = appSecret;
        }
      } catch (error) {
      }
      BLUL.Config.set('appClient.params.appSecret', JSON.stringify(config.appSecret));
      const user = config.user;
      config.user = BLUL.Config.get('appClient.user');
      const minUser = Math.min(user, config.user);
      for (let i = 0; i < minUser; i++) {
        config.users[i] = BLUL.Config.get(`appClient.user.${i}`);
        config.usernames[i] = BLUL.Config.get(`appClient.user.${i}.username`);
        config.passwords[i] = BLUL.Config.get(`appClient.user.${i}.password`);
      }
      for (let i = user; i < config.user; i++) {
        addUser(i);
      }
      for (let i = user - 1; i >= config.user; i--) {
        config.users.pop();
        config.usernames.pop();
        config.passwords.pop();
        config.data.pop();
        BLUL.Config.removeItem(`appClient.user.${i}`);
        BLUL.Config.removeItem(`appClient.user.${i}.username`);
        BLUL.Config.removeItem(`appClient.user.${i}.password`);
        BLUL.Config.removeItem(`appClient.user.${i}.data`);
      }
    });
  });

  BLUL.AppClient = AppClient;

  BLUL.debug('Module Loaded: AppClient', BLUL.AppClient);

  return BLUL.AppClient;
}
