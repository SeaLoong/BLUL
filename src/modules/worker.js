export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  let worker;
  try {
    worker = new Worker(Util.codeToURL(`importScripts('${await BLUL.getModuleUrl('Worker/env')}');`), { type: 'classic', credentials: 'include', name: BLUL.NAME + '-Worker' });
  } catch (error) {
    BLUL.Toast.error('Worker加载失败，请检查是否出现插件冲突', '已知冲突的插件有:', 'pakku：哔哩哔哩弹幕过滤器', error);
    return;
  }
  let channel;

  worker.onerror = worker.onmessageerror = e => BLUL.Toast.error('Worker执行时出现错误', e);

  worker.onmessage = async e => {
    if (!(e.data instanceof Array)) return;
    switch (e.data[0]) {
      case 'IMPORTED':
        worker.postMessage(['CHANNEL', await BLUL.getModuleUrl('Worker/channel')]);
        break;
      case 'CHANNEL':
        channel = new (await importModule('Worker/channel'))(worker);
        channel.postENV(BLUL, GM);
        break;
    }
  };

  worker.postMessage(['IMPORT', await BLUL.getModuleUrl('lodash')]);

  BLUL.Worker = {
    importModule: async (name) => {
      return channel.postIMPORT(await BLUL.getModuleUrl(name));
    }
  };

  BLUL.debug('Module Loaded: Worker', BLUL.Worker);

  return BLUL.Worker;
}
