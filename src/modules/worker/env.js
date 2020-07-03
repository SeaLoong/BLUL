let BLUL;
let GM;
const importUrlMap = new Map();
const CONTEXT = [importModule];
async function importModule (url, reImport = false) {
  if (!reImport && importUrlMap.has(url)) return importUrlMap.get(url);
  if (!url.startsWith('http') && BLUL?.getModuleUrl) url = await BLUL.getModuleUrl(url);
  let ret = await import(url);
  const def = ret.default;
  if (def instanceof Function) ret = def.apply(def, CONTEXT);
  ret = await ret;
  importUrlMap.set(url, ret);
  return ret;
}

// 1. IMPORT loadash
// 2. CHANNEL
// 3. ENV
onmessage = async e => {
  if (!(e.data instanceof Array)) return;
  switch (e.data[0]) {
    case 'IMPORT':
      await importModule(e.data[1]);
      postMessage(['IMPORTED', e.data[1]]);
      break;
    case 'CHANNEL':
    {
      const channel = new (await importModule(e.data[1]))(self);
      channel.onenv = env => {
        [BLUL, GM] = env;
        BLUL.Channel = channel;
        CONTEXT.push(BLUL, GM);
      };
      channel.onregister = (envi, path) => {};
      postMessage(['CHANNEL']);
      break;
    }
  }
};
console.debug('[BLUL] Worker is ready.');
