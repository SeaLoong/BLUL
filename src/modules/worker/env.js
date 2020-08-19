let BLUL;
let GM;
let importModule;
const context = [importModule];
const importMap = new Map();
async function importModuleFromUrl (url, reImport = false) {
  try {
    if (!reImport && importMap.has(url)) return importMap.get(url);
    if (!url.startsWith('data:') && !url.startsWith('http') && BLUL?.getResourceUrl) url = await BLUL.getResourceUrl(url);
    let ret = await import(url);
    ret = ret?.default ?? ret;
    if (ret instanceof Function) ret = ret.apply(ret, context);
    ret = await ret;
    importMap.set(url, ret);
    return ret;
  } catch (error) {
    await ((BLUL?.Logger ?? console).error('[BLUL][Worker]模块导入失败', error, url));
  }
}
async function importModuleFromCode (code, reImport = false) {
  try {
    if (!reImport && importMap.has(code)) return importMap.get(code);
    if (BLUL?.getResourceText) code = await BLUL.getResourceText(code) ?? code;
    code = code.replace('export default', 'const exports =') + ';\n if (typeof exports !== "undefined") return exports;';
    const fn = Function(code); // eslint-disable-line no-new-func
    let ret = fn.apply(fn, context);
    if (ret instanceof Function) ret = ret.apply(ret, context);
    ret = await ret;
    importMap.set(code, ret);
    return ret;
  } catch (error) {
    await ((BLUL?.Logger ?? console).error('[BLUL][Worker]模块导入失败', error, code));
  }
}
importModule = importModuleFromUrl; // 默认方式
// 1. METHOD IMPORT/CODE
// 2. IMPORT loadash
// 3. CHANNEL
// 4. ENV
onmessage = async e => {
  if (!(e.data instanceof Array)) return;
  const [id, op, data] = e.data;
  try {
    switch (op) {
      case 'METHOD':
        if (data === 'IMPORT') {
          importModule = importModuleFromUrl;
        } else if (data === 'CODE') {
          importModule = importModuleFromCode;
        }
        context[0] = importModule;
        break;
      case 'IMPORT':
        await importModule(data);
        break;
      case 'CHANNEL':
      {
        const channel = new (await importModule(data))(self);
        channel.onenv = (env, name) => {
          if (name === 'BLUL') BLUL = env;
          else if (name === 'GM') GM = env;
          if (BLUL) BLUL.Channel = channel;
          context.push(BLUL, GM);
        };
        break;
      }
    }
    postMessage([id, 'OK']);
  } catch (error) {
    await ((BLUL?.Logger ?? console).error('[BLUL][Worker]', error, e));
    postMessage([id, 'ERROR', e.data]);
  }
};
console.debug('[BLUL] Worker is ready.');
