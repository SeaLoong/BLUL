/* global RESOURCE */
'use strict';
if (typeof unsafeWindow !== 'undefined') {
  const safeWindow = window;
  window = unsafeWindow; // eslint-disable-line no-global-assign
  window.safeWindow = safeWindow;
}
const BLUL = window.BLUL = {
  debug: () => {},
  NAME: 'BLUL',
  ENVIRONMENT: GM.info.scriptHandler,
  ENVIRONMENT_VERSION: GM.info.version,
  VERSION: GM.info.script.version,
  RESOURCE: RESOURCE,
  INFO: {},
  load: undefined,
  onupgrade: [],
  onpreinit: [],
  oninit: [],
  onpostinit: [],
  onrun: []
};
// 返回 true 表示BLUL应当符合要求、符合逻辑地执行完毕，否则返回 false
BLUL.load = async (options) => {
  const { debug, slient, local, loadInSpecial, unique, login } = options;
  if (await debug) {
    localStorage.setItem('videoVolume', 0);
    window.top.BLUL = BLUL;
    BLUL.GM = GM;
    BLUL.debug = console.debug;
    BLUL.debug(BLUL);
  }

  await checkResetResource(); // eslint-disable-line no-undef

  // 特殊直播间页面，如 6 55 76
  if (!loadInSpecial && document.getElementById('player-ctnr')) return true;

  const importModule = (local ?? isLocalResource()) ? createImportModuleFromGMFunc([BLUL, GM]) : createImportModuleFromResourceFunc([BLUL, GM]); // eslint-disable-line no-undef

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

  /*
  if (await (async () => {
    const dialog = new BLUL.Dialog('这是协议内容', '最终用户许可协议');
    dialog.addButton('我同意', () => dialog.close(false));
    dialog.addButton('我拒绝', () => dialog.close(true), 1);
    return dialog.show();
  })()) return;
  */

  await importModule('Page');
  await importModule('Logger');
  await importModule('Config');
  await importModule('Request');

  /* eslint-disable no-undef */
  BLUL.onpreinit.push(preinitImport);
  BLUL.oninit.push(initImport);
  /* eslint-enable no-undef */

  await Util.callUntilTrue(() => window.BilibiliLive?.ROOMID && window.__statisObserver && window.__NEPTUNE_IS_MY_WAIFU__);

  BLUL.INFO.UID = window.BilibiliLive.UID;
  BLUL.INFO.ROOMID = window.BilibiliLive.ROOMID;
  BLUL.INFO.ANCHOR_UID = window.BilibiliLive.ANCHOR_UID;
  BLUL.INFO.SHORT_ROOMID = window.BilibiliLive.SHORT_ROOMID;
  BLUL.INFO.VISIT_ID = window.__statisObserver.__visitId ?? '';
  BLUL.INFO.__NEPTUNE_IS_MY_WAIFU__ = window.__NEPTUNE_IS_MY_WAIFU__; // 包含B站自己请求返回的一些数据，当然也自行请求获取

  if (Util.compareVersion(BLUL.VERSION, await GM.getValue('version')) > 0) {
    await Util.callEachAndWait(BLUL.onupgrade, BLUL, BLUL, GM);
    await GM.setValue('version', BLUL.VERSION);
  }
  await Util.callEachAndWait(BLUL.onpreinit, BLUL, BLUL, GM);
  await Util.callEachAndWait(BLUL.oninit, BLUL, BLUL, GM);
  await Util.callEachAndWait(BLUL.onpostinit, BLUL, BLUL, GM);
  await Util.callEachAndWait(BLUL.onrun, BLUL, BLUL, GM);
  return true;
};
