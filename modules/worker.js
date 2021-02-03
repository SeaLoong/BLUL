export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  let channel;
  const init = async () => {
    try {
      const worker = new Worker(Util.codeToURL(`importScripts('${await BLUL.getResourceUrl('Worker/env')}');`), { type: 'classic', credentials: 'include', name: BLUL.NAME + '-Worker' });

      const waitingMap = new Map();
      worker.onerror = worker.onmessageerror = e => BLUL.Logger.error('Worker执行时出现错误', e);
      worker.onmessage = async e => {
        if (!(e.data instanceof Array)) return;
        const [id, status] = e.data;
        if (waitingMap.has(id)) {
          const { resolve, reject } = waitingMap.get(id);
          waitingMap.delete(id);
          if (status === 'OK') {
            resolve();
          } else {
            reject();
          }
        }
      };

      let id = 0;
      const post = (op, data) => {
        while (waitingMap.has(id)) id++;
        return new Promise((resolve, reject) => {
          waitingMap.set(id, { resolve, reject });
          worker.postMessage([id, op, data]);
        });
      };

      await post('METHOD', 'CODE');
      await post('IMPORT', await BLUL.getResourceText('lodash'));
      await post('CHANNEL', await BLUL.getResourceText('Worker/channel'));

      channel = new (await importModule('Worker/channel'))(worker);
      channel.env.BLUL = BLUL;
      channel.env.GM = GM;
      await channel.postENV(BLUL, 'BLUL');
      await channel.postENV(GM, 'GM');
    } catch (error) {
      BLUL.Logger.error('Worker加载失败，请检查是否出现插件冲突', '已知冲突的插件有:', 'pakku：哔哩哔哩弹幕过滤器', error);
    }
  };

  BLUL.Worker = {
    importModule: async (name) => {
      try {
        if (!channel) {
          await init();
        }
        return channel.postIMPORT(name);
      } catch (error) {
        BLUL.Logger.error(`通过Worker加载模块 ${name} 失败`, error);
      }
    }
  };

  BLUL.debug('Module Loaded: Worker', BLUL.Worker);

  return BLUL.Worker;
}
