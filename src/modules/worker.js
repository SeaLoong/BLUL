export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  let worker;
  try {
    worker = new Worker(Util.codeToURL(`importScripts('${await BLUL.getResourceUrl('Worker/env')}');`), { type: 'classic', credentials: 'include', name: BLUL.NAME + '-Worker' });
  } catch (error) {
    BLUL.Toast.error('Worker加载失败，请检查是否出现插件冲突', '已知冲突的插件有:', 'pakku：哔哩哔哩弹幕过滤器', error);
    return;
  }

  const initUrlMap = new Map();

  worker.onerror = worker.onmessageerror = e => BLUL.Toast.error('Worker执行时出现错误', e);

  worker.onmessage = async e => {
    if (!(e.data instanceof Array) || e.data.length < 1) return;
    if (initUrlMap.has(e.data[0])) {
      const resolve = initUrlMap.get(e.data[0]);
      initUrlMap.delete(e.data[0]);
      resolve();
    }
  };

  const initImport = async (name, op = 'IMPORT') => {
    const url = await BLUL.getResourceUrl(name);
    worker.postMessage([op, url]);
    return new Promise(resolve => initUrlMap.set(url, resolve));
  };

  await initImport('lodash');
  await initImport('Worker/channel', 'CHANNEL');

  const channel = new (await importModule('Worker/channel'))(worker);
  await channel.postENV(BLUL, GM);

  BLUL.Worker = {
    importModule: async (name) => {
      return channel.postIMPORT(await BLUL.getResourceUrl(name));
    }
  };

  BLUL.debug('Module Loaded: Worker', BLUL.Worker);

  return BLUL.Worker;
}
