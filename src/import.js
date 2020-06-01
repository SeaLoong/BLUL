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
  BLUL.Config.addItem('resource.blulBase', 'BLUL根目录', RESOURCE.blulBase, {
    tag: 'input',
    help: 'https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src<br>https://raw.githubusercontent.com/SeaLoong/BLUL/master/src',
    corrector: v => {
      const i = v.trim().search(/\/+$/);
      return i > -1 ? v.substring(0, i) : v;
    },
    list: [
      'http://127.0.0.1:8080/src',
      'https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src',
      'https://raw.githubusercontent.com/SeaLoong/BLUL/master/src'
    ],
    attribute: { type: 'url' }
  });
  for (const name of ['jquery', 'toastr', 'lodash']) {
    BLUL.Config.addItem(`resource.${name}`, name, RESOURCE[name], { tag: 'input', attribute: { type: 'url' } });
  }
}

async function initImport (BLUL) {
  if (await GM.getValue('resetResource')) {
    await BLUL.Config.reset('resource', true);
    await GM.deleteValue('resetResource');
  }
  BLUL.Config.onload.push(() => {
    RESOURCE.blulBase = BLUL.Config.get('resource.blulBase');
    for (const name of ['jquery', 'toastr', 'lodash']) {
      RESOURCE[name] = BLUL.Config.get(`resource.${name}`);
    }
  });
}
