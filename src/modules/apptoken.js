/* global _ */
const NAME = 'AppToken';
const config = {
  buvid: '',
  device_id: '',
  fingerprint: '',
  access_token: '',
  refresh_token: '',
  ts: Date.now()
};
const appSecret = {
  '1d8b6e7d45233436': '560c52ccd288fed045859ed18bffd973',
  bb3101000e232e27: '36efcfed79309338ced0380abd824ac1',
  '07da50c9a0bf829f': '25bdede4e1581c836cab73a48790ca6e',
  '4409e2ce8ffd12b8': '59b43e04ad6965f34319062b478f83dd'
};
export default async function (importModule, BLUL, GM) {
  await BLUL.addResource('spark-md5', ['https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js', 'https://cdn.jsdelivr.net/npm/spark-md5@3.0.1/spark-md5.min.js']);

  const Util = BLUL.Util;
  await importModule('spark-md5');
  const SparkMD5 = window.SparkMD5;

  function format (ts = Date.now()) {
    const t = new Date(ts);
    return Util.int2str(t.getFullYear(), 4) + Util.int2str(t.getMonth(), 2) + Util.int2str(t.getDate(), 2) + Util.int2str(t.getHours(), 2) + Util.int2str(t.getMinutes(), 2) + Util.int2str(t.getSeconds(), 2) + Util.int2str(t.getMilliseconds(), 3) + Util.int2str(Math.floor(Math.random() * 99999), 5) + Util.randomID(40).toLowerCase();
  }
  config.buvid = Util.randomID(37);
  config.device_id = Util.randomID(34);
  config.fingerprint = format();

  const defaultParams = {
    appkey: '4409e2ce8ffd12b8',
    bili_local_id: config.device_id,
    build: '102800',
    buvid: config.buvid,
    channel: 'master',
    device: 'Xiaomi',
    device_id: config.device_id,
    device_name: 'RedmiK30',
    device_platform: 'Android10XiaomiRedmiK30',
    fingerprint: config.fingerprint,
    guid: config.buvid,
    local_fingerprint: config.fingerprint,
    local_id: config.buvid,
    mobi_app: 'android_tv_yst',
    networkstate: 'wifi',
    platform: 'android',
    sys_ver: 23
  };

  const headers = {
    Buvid: config.buvid,
    env: 'prod',
    'App-Key': 'android_tv_yst',
    'User-Agent': 'Mozilla/5.0 BiliTV/1.2.8 os/android mobi_app/android_tv_yst build/102800 channel/master innerVer/102800 osVer/9 network/2'
  };

  const sign = (params) => {
    let p = _.defaultsDeep({}, params);
    _.defaultsDeep(p, defaultParams);
    p.ts = Math.round(Date.now() / 1e3);
    p = Util.sortByKey(p);
    const pStr = Util.toURLSearchParamString(p);
    return pStr + '&sign=' + SparkMD5.hash(pStr + appSecret[p.appkey]);
  };

  /* eslint-disable camelcase */
  const qrcode = {
    auth_code: async () => {
      const r = await BLUL.Request.monkey({
        method: 'POST',
        url: 'https://passport.bilibili.com/x/passport-tv-login/qrcode/auth_code',
        headers: headers,
        data: sign({ gourl: '' })
      });
      return r.json();
    },
    poll: async (auth_code) => {
      const r = await BLUL.Request.monkey({
        method: 'POST',
        url: 'https://passport.bilibili.com/x/passport-tv-login/qrcode/poll',
        headers: headers,
        data: sign({ auth_code })
      });
      return r.json();
    },
    confirm: async (auth_code, csrf) => {
      const r = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://passport.bilibili.com/x/passport-tv-login/h5/qrcode/confirm',
        data: { auth_code, csrf }
      });
      return r.json();
    }
  };
  const oauth2 = {
    info: async (access_key) => {
      const r = await BLUL.Request.fetch({
        method: 'GET',
        url: 'https://passport.bilibili.com/x/passport-login/oauth2/info',
        search: sign({ access_key })
      });
      return r.json();
    },
    refresh_token: async (access_key, refresh_token) => {
      const r = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://passport.bilibili.com/x/passport-login/oauth2/refresh_token',
        data: sign({ access_key, refresh_token })
      });
      return r.json();
    }
  };

  async function getNewAccessToken () {
    BLUL.debug(NAME, 'getNewAccessToken');
    let obj = await qrcode.auth_code();
    if (obj.code !== 0) {
      BLUL.Logger.error(`获取新accessToken失败(code=${obj.code})`, obj.message);
      return;
    }
    // obj.data.url 可用于生成二维码扫码登录，等同于完成了下面这一步
    const auth_code = obj.data.auth_code;
    obj = await qrcode.confirm(auth_code, BLUL.INFO.CSRF);
    if (obj.code !== 0) {
      BLUL.Logger.error(`获取新accessToken失败(code=${obj.code})`, obj.message);
      return;
    }
    let cnt = 5;
    while (cnt--) {
      await Util.sleep(800);
      obj = await qrcode.poll(auth_code);
      if (obj.code === 0) {
        config.access_token = obj?.data?.access_token;
        config.refresh_token = obj?.data?.refresh_token;
        config.ts = Date.now() + (obj?.data?.expires_in ?? 864000) * 500;
        await BLUL.Config.set('appToken.access_token', config.access_token);
        await BLUL.Config.set('appToken.refresh_token', config.refresh_token);
        await BLUL.Config.set('appToken.ts', config.ts);
        await BLUL.Config.save();
        return config.access_token;
      }
    }
    BLUL.Logger.error(`获取新accessToken失败(code=${obj.code})`, obj.message);
  }

  async function refreshAccessToken () {
    BLUL.debug(NAME, 'refreshAccessToken');
    const obj = await oauth2.refresh_token(config.access_token, config.refresh_token);
    if (obj.code === 0 && obj.data?.status === 0) {
      const token_info = obj.data.token_info;
      config.access_token = token_info.access_token;
      config.refresh_token = token_info.refresh_token;
      config.ts = Date.now() + (token_info.expires_in ?? 864000) * 500;
      await BLUL.Config.set('appToken.access_token', config.access_token);
      await BLUL.Config.set('appToken.refresh_token', config.refresh_token);
      await BLUL.Config.set('appToken.ts', config.ts);
      await BLUL.Config.save();
      return config.access_token;
    }
  }

  async function getAccessToken () {
    BLUL.debug(NAME, 'getAccessToken');
    if (config.access_token) {
      if (Date.now() < config.ts) return config.access_token;
      const obj = await oauth2.info(config.access_token);
      if (obj.code === 0) {
        config.access_token = obj?.data?.access_token;
        config.ts = Date.now() + (obj?.data?.expires_in ?? 864000) * 500;
        await BLUL.Config.set('appToken.access_token', config.access_token);
        await BLUL.Config.set('appToken.ts', config.ts);
        await BLUL.Config.save();
        return config.access_token;
      }
      if (config.refresh_token) {
        const token = await refreshAccessToken();
        if (token) return token;
      }
    }
    return getNewAccessToken();
  }
  /* eslint-enable camelcase */

  BLUL.onpreinit(() => {
    BLUL.Config.addItem('appToken', 'AppToken设置', false, {
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
    BLUL.Config.addItem('appToken.buvid', 'buvid', config.buvid, { tag: 'input', attribute: { type: 'text' } });
    BLUL.Config.addItem('appToken.device_id', 'device_id', config.device_id, { tag: 'input', attribute: { type: 'text' } });
    BLUL.Config.addItem('appToken.fingerprint', 'fingerprint', config.fingerprint, { tag: 'input', attribute: { type: 'text' } });
    BLUL.Config.addItem('appToken.access_token', 'access_token', config.access_token, { tag: 'input', help: '此项只用于存储和显示数据', attribute: { type: 'text', readonly: true } });
    BLUL.Config.addItem('appToken.refresh_token', 'refresh_token', config.refresh_token, { tag: 'input', help: '此项只用于存储和显示数据', attribute: { type: 'text', readonly: true } });
    BLUL.Config.addItem('appToken.ts', '过期时间戳', config.ts, { tag: 'input', help: () => '此项只用于存储和显示数据<br>' + new Date(BLUL.Config.get('appToken.ts')).toLocaleString(), attribute: { type: 'text', readonly: true } });

    BLUL.Config.onload(() => {
      config.buvid = BLUL.Config.get('appToken.buvid');
      config.device_id = BLUL.Config.get('appToken.device_id');
      config.fingerprint = BLUL.Config.get('appToken.fingerprint');
      config.access_token = BLUL.Config.get('appToken.access_token');
      config.refresh_token = BLUL.Config.get('appToken.refresh_token');
      config.ts = BLUL.Config.get('appToken.ts');

      defaultParams.buvid = config.buvid;
      defaultParams.guid = config.buvid;
      defaultParams.local_id = config.buvid;
      defaultParams.bili_local_id = config.device_id;
      defaultParams.device_id = config.device_id;
      defaultParams.fingerprint = config.fingerprint;
      defaultParams.local_fingerprint = config.fingerprint;

      headers.buvid = defaultParams.buvid;
    });
  });

  BLUL.AppToken = {
    headers,
    sign,
    getNewAccessToken,
    refreshAccessToken,
    getAccessToken
  };

  BLUL.debug('Module Loaded: AppToken', BLUL.AppToken);

  return BLUL.AppToken;
}
