let ENV;
const importUrlMap = new Map();
const context = [importModule];
async function importModule (url, reImport = false) {
  if (!reImport && importUrlMap.has(url)) return importUrlMap.get(url);
  if (!url.startsWith('data:') && !url.startsWith('http') && ENV?.[0]?.getResourceUrl) url = await ENV[0].getResourceUrl(url);
  let ret = await import(url);
  ret = ret?.default ?? ret;
  if (ret instanceof Function) ret = ret.apply(ret, context);
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
      break;
    case 'CHANNEL':
    {
      const channel = new (await importModule(e.data[1]))(self);
      channel.onenv = env => {
        ENV = env;
        ENV[0].Channel = channel;
        context.push(...ENV);
      };
      break;
    }
  }
  postMessage([e.data[1]]);
};
console.debug('[BLUL] Worker is ready.');
