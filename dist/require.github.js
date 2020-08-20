// ==UserScript==
// @name         BLUL
// @namespace    SeaLoong
// @version      1.0.1
// @description  Bilibili Live Userscript Library
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/BLUL
// @supportURL   https://github.com/SeaLoong/BLUL/issues
// @updateURL    https://raw.githubusercontent.com/SeaLoong/BLUL/master/dist/require.github.js
// @include      /^https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+.*$/
// @connect      bilibili.com
// @connect      *
// @grant        unsafeWindow
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.getResourceUrl
// @grant        GM.xmlHttpRequest
// @grant        GM.addStyle
// @grant        GM.getResourceText
// @grant        GM.registerMenuCommand
// @grant        GM.unregisterMenuCommand
// @run-at       document-start
// @license      MIT License
// @incompatible chrome 不支持内核低于80的版本
// @incompatible firefox 不支持内核低于72的版本
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.19/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     Toast https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/toast.js
// @resource     Util https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/util.js
// @resource     Dialog https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/dialog.js
// @resource     Page https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/page.js
// @resource     Logger https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/logger.js
// @resource     Config https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/config.js
// @resource     Request https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/request.js
// @resource     Worker https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker.js
// @resource     Worker/env https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker/env.js
// @resource     Worker/channel https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker/channel.js
// @resource     AppToken https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/apptoken.js
// ==/UserScript==

'use strict';
var BLUL;
(function () {
  try {
    ((0, eval)('(null ?? 1) && (({a: 1})?.a)')); // eslint-disable-line no-eval
  } catch (error) {
    console.error('[BLUL]不支持当前浏览器，请使用内核不低于Chromium80或Firefox72的浏览器', error);
    return;
  }

  if (typeof unsafeWindow !== 'undefined') {
    const safeWindow = window;
    window = unsafeWindow; // eslint-disable-line no-global-assign
    window.safeWindow = safeWindow;
  }

  if (window.BLUL) {
    console.warn('[BLUL]检测到BLUL已存在，本脚本将不再初始化BLUL，脚本行为可能会出现异常');
    BLUL = window.BLUL;
    return;
  }
  BLUL = window.BLUL = {
    debug: () => {},
    NAME: 'BLUL',
    ENVIRONMENT: GM.info.scriptHandler,
    ENVIRONMENT_VERSION: GM.info.version,
    VERSION: GM.info.script.version,
    RESOURCE: {},
    BLUL_MODULE_NAMES: ['Toast', 'Util', 'Dialog', 'Page', 'Logger', 'Config', 'Request', 'Worker', 'Worker/env', 'Worker/channel', 'AppToken'],
    INFO: {}
  };

  BLUL.lazyFn = function (...args) {
    let object = BLUL;
    let name;
    let promise = false;
    if (args.length >= 3) [object, name, promise] = args;
    else if (args.length === 2) [object, name] = args;
    else [name] = args;
    const list = [];
    let fn;
    Object.defineProperty(object, name, {
      configurable: true,
      get: () => fn ?? ((...args) => promise ? new Promise(resolve => list.push({ args, resolve })) : list.push({ args })),
      set: f => {
        fn = f;
        if (fn instanceof Function) {
          for (const { resolve, args } of list) {
            const v = fn.apply(object, args);
            if (resolve) resolve(v);
          }
        }
      }
    });
  };

  BLUL.getResourceUrl = async (name) => await GM.getResourceUrl(name) ?? BLUL.RESOURCE[name] ?? ((BLUL.BLUL_MODULE_NAMES.includes(name) ? BLUL.RESOURCE.BLULBase : BLUL.RESOURCE.base) + '/modules/' + name.toLowerCase() + '.js');

  BLUL.getResourceText = async (name) => {
    let ret = await GM.getResourceText(name);
    if (ret === undefined || ret === null) {
      ret = (await window.fetch(await BLUL.getResourceUrl(name))).text();
    }
    return ret;
  };

  BLUL.createImportModuleFunc = function (context, keepContext = false) {
    /**
     * 如果需要上下文, Module 应当返回(export default)一个 Function/AsyncFunction, 其参数表示上下文, 且第一个参数是importModule
     * 在不需要上下文的情况下可以返回任意
     */
    const importUrlMap = new Map();
    async function importModule (name, reImport = false) {
      try {
        if (!reImport && importUrlMap.has(name)) return importUrlMap.get(name);
        const url = await BLUL.getResourceUrl(name);
        try {
          let ret = await import(url);
          ret = ret?.default ?? ret;
          if (ret instanceof Function) ret = ret.apply(window, context);
          ret = await ret;
          importUrlMap.set(name, ret);
          return ret;
        } catch (error) {
          (BLUL.Logger ?? console).error(`模块 ${name} 导入失败，尝试使用script标签加载`, error);
          return new Promise((resolve, reject) => {
            const elem = document.createElement('script');
            elem.onerror = reject;
            elem.onload = () => {
              importUrlMap.set(name, undefined);
              resolve();
            };
            document.body.appendChild(elem);
            elem.src = url;
          });
        }
      } catch (error) {
        (BLUL.Logger ?? console).error(`使用script标签加载模块 ${name} 失败`, error);
      }
    }
    if (!keepContext) context.unshift(importModule);
    return importModule;
  };

  BLUL.createImportModuleFromCodeFunc = function (context, keepContext = false) {
    /**
     * 如果需要上下文, Module 应当返回(const exports = )一个 Function/AsyncFunction, 其参数表示上下文, 且第一个参数是importModule
     * 在不需要上下文的情况下可以返回任意
     * 这种方式不兼容 export 语法
     */
    const importCodeMap = new Map();
    async function importModule (code, reImport = false) {
      try {
        if (!reImport && importCodeMap.has(code)) return importCodeMap.get(code);
        code = (await BLUL.getResourceText(code) ?? code);
        code = code.replace('export default', 'const exports =') + ';\nif (typeof exports !== "undefined") return exports;';
        const fn = Function(code); // eslint-disable-line no-new-func
        let ret = fn.apply(window, context);
        if (ret instanceof Function) ret = ret.apply(window, context);
        ret = await ret;
        importCodeMap.set(code, ret);
        return ret;
      } catch (error) {
        (BLUL.Logger ?? console).error('模块导入失败', error, code);
      }
    }
    if (!keepContext) context.unshift(importModule);
    return importModule;
  };

  BLUL.lazyFn('__addResourceConfig');
  BLUL.lazyFn('setBase');
  BLUL.lazyFn('importModule');
  BLUL.lazyFn('onupgrade');
  BLUL.lazyFn('onpreinit');
  BLUL.lazyFn('oninit');
  BLUL.lazyFn('onpostinit');
  BLUL.lazyFn('onrun');

  BLUL.addResource = async function (name, urls, displayName) {
    if (BLUL.RESOURCE[name] !== undefined) return;
    BLUL.RESOURCE[name] = urls instanceof Array ? urls[0] : urls;
    BLUL.__addResourceConfig(name, urls, displayName);
    if (await GM.getValue('resetResource')) return;
    const resource = (await GM.getValue('config'))?.resource;
    if (!resource) return;
    if (resource[name]?.__VALUE__) BLUL.RESOURCE[name] = resource[name]?.__VALUE__;
  };

  let hasRun = false;
  BLUL.run = async (options) => {
    if (hasRun) return true;
    hasRun = true;
    const { debug, slient, loadInSpecial, unique, login, EULA, EULA_VERSION, NOTICE } = options ?? {};
    if (debug) {
      BLUL.debug = console.debug;
      BLUL.GM = GM;
      BLUL.debug(BLUL);
    }
    window.top[BLUL.NAME] = BLUL;

    // 特殊直播间页面，如 6 55 76
    if (!loadInSpecial && document.getElementById('player-ctnr')) return false;

    const resetResourceMenuCmdId = await GM.registerMenuCommand?.('恢复默认源', async () => {
      await GM.setValue('resetResource', true);
      window.location.reload(true);
    });
    const unregisterMenuCmd = async () => {
      BLUL.debug('unregisterMenuCmd');
      if (await GM.getValue('resetResource')) {
        await BLUL.Config.reset('resource', true);
        await GM.deleteValue('resetResource');
      }
      await GM.unregisterMenuCommand?.(resetResourceMenuCmdId); // eslint-disable-line no-unused-expressions
    };

    await BLUL.addResource('BLULBase', ['https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src'], 'BLUL根目录');
    await BLUL.addResource('lodash', ['https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.15/lodash.min.js', 'https://cdn.jsdelivr.net/npm/lodash@4.17.15/lodash.min.js']);
    await BLUL.addResource('toastr', ['https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js', 'https://cdn.jsdelivr.net/npm/toastr@2.1.4/toastr.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js']);
    await BLUL.addResource('jquery', ['https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js', 'https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js', 'https://code.jquery.com/jquery-3.5.1.min.js']);

    BLUL.onpostinit(unregisterMenuCmd);

    const importModule = BLUL.createImportModuleFromCodeFunc([BLUL, GM]);

    await importModule('jquery');
    await importModule('Toast');

    if (unique) {
      const mark = 'running';
      // 检查重复运行
      if (await (async () => {
        const running = parseInt(await GM.getValue(mark) ?? 0);
        const ts = Date.now();
        return (ts - running >= 0 && ts - running <= 5e3);
      })()) {
        if (!slient) {
          BLUL.Toast.warn('已经有其他页面正在运行脚本了哟~');
        }
        await unregisterMenuCmd();
        return false;
      }
      // 标记运行中
      await GM.setValue(mark, Date.now());
      const uniqueCheckInterval = setInterval(async () => {
        await GM.setValue(mark, Date.now());
      }, 4e3);
      window.addEventListener('unload', async () => {
        clearInterval(uniqueCheckInterval);
        await GM.deleteValue(mark);
      });
    }
    await importModule('lodash'); /* global _ */
    const Util = BLUL.Util = await importModule('Util');

    await Util.callUntilTrue(() => window.BilibiliLive?.ROOMID && window.__statisObserver);

    if (login) {
      BLUL.INFO.CSRF = Util.getCookie('bili_jct');
      if (!BLUL.INFO.CSRF) {
        if (!slient) {
          BLUL.Toast.warn('你还没有登录呢~');
        }
        await unregisterMenuCmd();
        return false;
      }
    }
    await importModule('Dialog');

    if (EULA) {
      if (Util.compareVersion(EULA_VERSION, await GM.getValue('eulaVersion')) > 0) {
        await GM.setValue('eula', false);
      }
      if (!await GM.getValue('eula')) {
        const dialog = new BLUL.Dialog(await Util.result(EULA), '最终用户许可协议');
        dialog.addButton('我同意', () => dialog.close(true));
        dialog.addButton('我拒绝', () => dialog.close(false), 1);
        if (!await dialog.show()) {
          await unregisterMenuCmd();
          return false;
        }
        await GM.setValue('eula', true);
        await GM.setValue('eulaVersion', EULA_VERSION);
      }
    }

    await importModule('Page');
    await importModule('Logger');
    await importModule('Config');
    await importModule('Request');
    await importModule('Worker');
    await importModule('AppToken');

    BLUL.Config.addItem('resource', '自定义源', false, { tag: 'input', help: '该设置项下的各设置项只在没有设置对应的 @resource 时有效。<br>此项直接影响脚本的加载，URL不正确或访问速度太慢均可能导致不能正常加载。<br>需要重置源可点击油猴图标再点击此脚本下的"恢复默认源"来重置。', attribute: { type: 'checkbox' } });

    BLUL.__addResourceConfig = (name, urls, displayName = name) => {
      BLUL.Config.addItem(`resource.${name}`, displayName, BLUL.RESOURCE[name], {
        tag: 'input',
        list: urls instanceof Array ? urls : undefined,
        corrector: v => {
          const i = v.trim().search(/\/+$/);
          return i > -1 ? v.substring(0, i) : v;
        },
        attribute: { type: 'url' }
      });
      BLUL.Config.onload(() => {
        BLUL.RESOURCE[name] = BLUL.Config.get(`resource.${name}`);
      });
    };

    BLUL.setBase = _.once(urls => BLUL.addResource('base', urls, '根目录'));

    BLUL.importModule = importModule;

    BLUL.INFO.UID = window.BilibiliLive.UID;
    BLUL.INFO.ROOMID = window.BilibiliLive.ROOMID;
    BLUL.INFO.ANCHOR_UID = window.BilibiliLive.ANCHOR_UID;
    BLUL.INFO.SHORT_ROOMID = window.BilibiliLive.SHORT_ROOMID;
    BLUL.INFO.VISIT_ID = window.__statisObserver.__visitId ?? '';
    BLUL.INFO.__NEPTUNE_IS_MY_WAIFU__ = window.__NEPTUNE_IS_MY_WAIFU__; // 包含B站自己请求返回的一些数据，当然也可以自行请求获取

    const callHandler = f => {
      try {
        return f.apply(BLUL.load, [BLUL, GM]);
      } catch (error) {
        (BLUL.Logger ?? console).error(error);
      }
    };
    if (Util.compareVersion(BLUL.VERSION, await GM.getValue('version')) > 0) {
      await GM.setValue('version', BLUL.VERSION);
      if (NOTICE) {
        const dialog = new BLUL.Dialog(await Util.result(NOTICE), '更新说明-' + BLUL.VERSION);
        dialog.addButton('知道了', () => dialog.close());
        dialog.show();
      }
      BLUL.onupgrade = callHandler;
    }
    BLUL.onpreinit = callHandler;
    BLUL.oninit = callHandler;
    BLUL.onpostinit = callHandler;
    BLUL.onrun = callHandler;
    return true;
  };
})();

