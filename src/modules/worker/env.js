let BLUL;
let GM;
const importUrlMap = new Map();
const context = [importModule];
async function importModule (url, reImport = false) {
  try {
    if (!reImport && importUrlMap.has(url)) return importUrlMap.get(url);
    if (!url.startsWith('data:') && !url.startsWith('http') && BLUL?.getResourceUrl) url = await BLUL.getResourceUrl(url);
    let ret = await import(url);
    ret = ret?.default ?? ret;
    if (ret instanceof Function) ret = ret.apply(ret, context);
    ret = await ret;
    importUrlMap.set(url, ret);
    return ret;
  } catch (error) {
    await ((BLUL?.Logger ?? console).error('[BLUL][Worker]模块导入失败', error, url));
  }
}

// 1. IMPORT loadash
// 2. CHANNEL
// 3. ENV
onmessage = async e => {
  try {
    if (!(e.data instanceof Array)) return;
    switch (e.data[0]) {
      case 'IMPORT':
        await importModule(e.data[1]);
        break;
      case 'CHANNEL':
      {
        const channel = new (await importModule(e.data[1]))(self);
        channel.onenv = env => {
          [BLUL, GM] = env;
          BLUL.Channel = channel;
          context.push(BLUL, GM);
        };
        break;
      }
    }
    postMessage(['OK', e.data[1]]);
  } catch (error) {
    await ((BLUL?.Logger ?? console).error('[BLUL][Worker]', error, e));
    postMessage(['ERROR', e.data[1]]);
  }
};
console.debug('[BLUL] Worker is ready.');
