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
          device: 'phone',
          device_id: '6af82d29422982bda3ba3de391be4ad62020060405093983ec5f72835be75236',
          device_meta: 'DFB0571BDD29DB8573E2953CEE5780C4D30314723FCB8C6E450C01C4FEA75BEA6186CB935F64CF7294029CCDF5D5217C2CB1529881633F23ED031C28A3F8354E31366149B47F97A4B68E7E06DAA5C2264A24C863479136B81700B6725F897A57D9D007BCCA010205508868FC5C02B5F8727614AB6A8776934AE0644EE7FF4F4801E98840E4F44C0AE1ABD08F8A01ADF4247796749285B98E2913D034AAEDC82234F6DCCD6D37A2728FA976EA2938D9A9E230EB98CB73BF9E649FC430E9B8086D7B4E91EDE6FE9605BC22EE934FC1A0E1968A7106600E818A8710C294E46F8447606A927AA04F971293BD11E6BD5F1398CF13673777923760AADB5A1E6E4EA12345E808B2A1596AE0860B2AB89B053FB4B2A63BC7E081252C9994679A4F48341ACF6F32BF4FBAD181885F8B9E41938FCD6AD61AD6AEA38D14CE379AD89AFE57799392FBC5BD15028414DF3D693CD50C2C4F0D7129222D1A6AC02B22C3A2977814EF5F98ADCAED523A3A7DFD936951C65D8AA90E738FA312E13D52B538B38DA15CE2BE6937C97D60CF1CC8F9B714961E535AC16CAA0330AC850DBDA45FD3BA299972114C1CB1598390A42B4D6BB2B5964E5E673EAF92232D4135D669E3B80CF6DD14068ACA467F8C8CCCB4247F377B53DC1D416C0799C640EFE33FF2B1EFB9008C46C0497782A8F4198B70EE53C19A98939A6AA7BA8D8DCE4E849E6CF0FF5B74FD3FAC38A5AE11B45B59F802451C6231C4830B97D56859E64C0A8831257642EA39',
          device_name: 'NeteaseMuMu',
          device_platform: 'Android6.0.1NeteaseMuMu',
          local_id: 'XZB06D6BECF9575A7078795E91F615160606E'
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
