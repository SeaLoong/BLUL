/* eslint-disable no-unused-vars */
const RESOURCE = {
  base: '',
  blulBase: 'https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src',
  lodash: 'https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.15/lodash.min.js',
  toastr: 'https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js',
  jquery: 'https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js'
};

const BLUL_MODULES_NAME = ['Toast', 'Util', 'Dialog', 'Page', 'Logger', 'Config', 'Request'];
for (const key in RESOURCE) {
  if (key === 'base' || key === 'blulBase') continue;
  BLUL_MODULES_NAME.push(RESOURCE[key]);
}

function createImportModuleFunc (context, keepContext = false) {
  /**
   * 如果需要上下文, Module 应当返回(export default)一个 Function/AsyncFunction, 其参数表示上下文, 且第一个参数是importModule
   * 在不需要上下文的情况下可以返回任意
   */
  const importUrlMap = new Map();
  async function importModule (url, reImport = false) {
    try {
      if (!reImport && importUrlMap.has(url)) return importUrlMap.get(url);
      let ret = await import(url);
      const def = ret.default;
      if (def instanceof Function) ret = def.apply(def, context);
      ret = await ret;
      importUrlMap.set(url, ret);
      return ret;
    } catch (error) {
      console.error('[BLUL]模块导入失败', error);
    }
  }
  if (!keepContext) context.unshift(importModule);
  return importModule;
}

function createImportModuleFromResourceFunc (context, keepContext = false) {
  const rawImportModule = createImportModuleFunc(context, true);
  async function importModule (name, reImport) {
    return rawImportModule(RESOURCE[name] ?? ((BLUL_MODULES_NAME.includes(name) ? RESOURCE.blulBase : (RESOURCE.base ?? RESOURCE.blulBase)) + '/modules/' + name.toLowerCase() + '.js'), reImport);
  }
  if (!keepContext) context.unshift(importModule);
  return importModule;
}

function createImportModuleFromGMFunc (context, keepContext = false) {
  const rawImportModule = createImportModuleFunc(context, true);
  async function importModule (name, reImport) {
    return rawImportModule(await GM.getResourceUrl(name), reImport);
  }
  if (!keepContext) context.unshift(importModule);
  return importModule;
}

function createImportModuleFromCodeFunc (context, keepContext = false) {
  /**
   * 如果需要上下文, Module 应当返回(const exports = )一个 Function/AsyncFunction, 其参数表示上下文, 且第一个参数是importModule
   * 在不需要上下文的情况下可以返回任意
   * 这种方式不兼容 export 语法
   */
  const importCodeMap = new Map();
  async function importModule (code, reImport = false) {
    try {
      if (!reImport && importCodeMap.has(code)) return importCodeMap.get(code);
      // eslint-disable-next-line no-new-func
      const fn = Function(`${code};\n if (typeof exports !== "undefined") return exports;`);
      let ret = fn.apply(fn, context);
      if (ret instanceof Function) ret = ret.apply(ret, context);
      ret = await ret;
      importCodeMap.set(code, ret);
      return ret;
    } catch (error) {
      console.error('[BLUL]模块导入失败', error);
    }
  }
  if (!keepContext) context.unshift(importModule);
  return importModule;
}

function createImportModuleFromCodeGMFunc (context, keepContext = false) {
  const rawImportModule = createImportModuleFromCodeFunc(context, true);
  async function importModule (name, reImport) {
    return rawImportModule(await GM.getResourceText(name), reImport);
  }
  if (!keepContext) context.unshift(importModule);
  return importModule;
}

function isLocalResource () {
  return GM.info.script.resources.some(o => o.url.endsWith('.js'));
}

async function checkResetResource () {
  // eslint-disable-next-line no-unused-expressions
  GM.registerMenuCommand?.('恢复默认源', async () => {
    await GM.setValue('resetResource', true);
    window.location.reload(true);
  });
  if (await GM.getValue('resetResource')) return;
  const resource = (await GM.getValue('config'))?.resource;
  if (!resource) return;
  for (const key in RESOURCE) {
    if (resource[key]) RESOURCE[key] = resource[key].__VALUE__;
  }
}

function preinitImport (BLUL) {
  BLUL.Config.addItem('resource', '自定义源', false, { tag: 'input', title: '该设置项只在非本地模式下有效', help: '此项直接影响脚本的加载，URL不正确或访问速度太慢均可能导致不能正常加载。<br>需要重置源可点击油猴图标再点击此脚本下的"恢复默认源"来重置。', attribute: { type: 'checkbox' } });
  BLUL.addResource('blulBase', [RESOURCE.blulBase, 'https://raw.githubusercontent.com/SeaLoong/BLUL/master/src'], 'BLUL根目录');
  BLUL.addResource('lodash', [RESOURCE.lodash, 'https://cdn.jsdelivr.net/npm/lodash@4.17.15/lodash.min.js', 'https://raw.githubusercontent.com/lodash/lodash/4.17.15/dist/lodash.js']);
  BLUL.addResource('toastr', [RESOURCE.toastr, 'https://cdn.jsdelivr.net/npm/toastr@2.1.4/toastr.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js']);
  BLUL.addResource('jquery', [RESOURCE.jquery, 'https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js', 'https://code.jquery.com/jquery-3.5.1.min.js']);
}

async function initImport (BLUL) {
  if (await GM.getValue('resetResource')) {
    await BLUL.Config.reset('resource', true);
    await GM.deleteValue('resetResource');
  }
}


/* global RESOURCE, _ */
'use strict';
if (typeof unsafeWindow !== 'undefined') {
  const safeWindow = window;
  window = unsafeWindow; // eslint-disable-line no-global-assign
  window.safeWindow = safeWindow;
}
const BLUL = window.BLUL = {
  debug: () => {},
  GM: GM,
  NAME: 'BLUL',
  ENVIRONMENT: GM.info.scriptHandler,
  ENVIRONMENT_VERSION: GM.info.version,
  VERSION: GM.info.script.version,
  RESOURCE: RESOURCE,
  INFO: {},
  onupgrade: [],
  onpreinit: [],
  oninit: [],
  onpostinit: [],
  onrun: []
};
// 返回 true 表示BLUL应当符合要求、符合逻辑地执行完毕，否则返回 false
BLUL.preload = async (options) => {
  const { debug, slient, local, loadInSpecial, unique, login, EULA, EULA_VERSION } = options ?? {};
  if (debug) {
    BLUL.debug = console.debug;
    BLUL.debug(BLUL);
  }

  /* eslint-disable no-undef */
  if (!(local ?? isLocalResource())) {
    await checkResetResource();
  }
  BLUL.onpreinit.push(preinitImport);
  BLUL.oninit.push(initImport);
  /* eslint-enable no-undef */

  // 特殊直播间页面，如 6 55 76
  if (!loadInSpecial && document.getElementById('player-ctnr')) return true;

  const importModule = BLUL.importModule = (local ?? isLocalResource()) ? createImportModuleFromGMFunc([BLUL, GM]) : createImportModuleFromResourceFunc([BLUL, GM]); // eslint-disable-line no-undef

  await importModule('jquery');
  await importModule('Toast');

  if (unique) {
    const mark = 'running';
    // 检查重复运行
    if (await (async () => {
      const running = parseInt(await GM.getValue(mark) ?? 0);
      const ts = Date.now();
      return (ts - running >= 0 && ts - running <= 15e3);
    })()) {
      if (!slient) {
        BLUL.Toast.warn('已经有其他页面正在运行脚本了哟~');
      }
      return false;
    }
    // 标记运行中
    await GM.setValue(mark, Date.now());
    const uniqueCheckInterval = setInterval(async () => {
      await GM.setValue(mark, Date.now());
    }, 10e3);
    window.addEventListener('unload', async () => {
      clearInterval(uniqueCheckInterval);
      await GM.deleteValue(mark);
    });
  }
  await importModule('lodash');
  const Util = BLUL.Util = await importModule('Util');

  if (login) {
    BLUL.INFO.CSRF = Util.getCookie('bili_jct');
    if (!BLUL.INFO.CSRF) {
      if (!slient) {
        BLUL.Toast.warn('你还没有登录呢~');
      }
      return false;
    }
  }
  await importModule('Dialog');

  if (EULA && Util.compareVersion(EULA_VERSION, await GM.getValue('eulaVersion')) > 0) {
    if (!await GM.getValue('eula') && await (async () => {
      const dialog = new BLUL.Dialog(await Util.result(EULA), '最终用户许可协议');
      dialog.addButton('我同意', () => dialog.close(true));
      dialog.addButton('我拒绝', () => dialog.close(false), 1);
      return !dialog.show();
    })()) return;
    await GM.setValue('eula', true);
    await GM.setValue('eulaVersion', EULA_VERSION);
  }

  await importModule('Page');
  await importModule('Logger');
  await importModule('Config');
  await importModule('Request');

  BLUL.addResource = (name, urls, displayName) => {
    const url = urls instanceof Array ? urls[0] : urls;
    BLUL.RESOURCE[name] = url;
    BLUL.Config.addItem(`resource.${name}`, displayName ?? name, url, {
      tag: 'input',
      list: urls instanceof Array ? urls : undefined,
      corrector: v => {
        const i = v.trim().search(/\/+$/);
        return i > -1 ? v.substring(0, i) : v;
      },
      attribute: { type: 'url' }
    });
    BLUL.Config.onload.push(() => {
      BLUL.RESOURCE[name] = BLUL.Config.get(`resource.${name}`);
    });
  };

  BLUL.setBase = _.once(urls => BLUL.addResource('base', urls, '根目录'));

  BLUL.load = _.once(async () => {
    if (debug) {
      window.top[BLUL.NAME] = BLUL;
    }
    await Util.callUntilTrue(() => window.BilibiliLive?.ROOMID && window.__statisObserver && window.__NEPTUNE_IS_MY_WAIFU__);

    BLUL.INFO.UID = window.BilibiliLive.UID;
    BLUL.INFO.ROOMID = window.BilibiliLive.ROOMID;
    BLUL.INFO.ANCHOR_UID = window.BilibiliLive.ANCHOR_UID;
    BLUL.INFO.SHORT_ROOMID = window.BilibiliLive.SHORT_ROOMID;
    BLUL.INFO.VISIT_ID = window.__statisObserver.__visitId ?? '';
    BLUL.INFO.__NEPTUNE_IS_MY_WAIFU__ = window.__NEPTUNE_IS_MY_WAIFU__; // 包含B站自己请求返回的一些数据，当然也自行请求获取

    if (Util.compareVersion(BLUL.VERSION, await GM.getValue('version')) > 0) {
      await Util.callEachAndWait(BLUL.onupgrade, BLUL.load, BLUL, GM);
      await GM.setValue('version', BLUL.VERSION);
    }
    await Util.callEachAndWait(BLUL.onpreinit, BLUL.preload, BLUL, GM);
    await Util.callEachAndWait(BLUL.oninit, BLUL.load, BLUL, GM);
    await Util.callEachAndWait(BLUL.onpostinit, BLUL.load, BLUL, GM);
    await Util.callEachAndWait(BLUL.onrun, BLUL.load, BLUL, GM);
    return true;
  });

  return true;
};



