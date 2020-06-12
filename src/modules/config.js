/* global $, _ */
const NAME = '设置';
const CONFIG = {};
const CONFIG_DEFAULT = {};
const optionsMap = new Map();
const innerElementMap = new Map();
const innerOnClickMap = new Map();
export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;
  const cssConfigItem = `${BLUL.NAME}-config-item`;
  const cssConfigGroupItem = `${BLUL.NAME}-config-group-item`;
  const cssSelect = `${BLUL.NAME}-config-select`;
  const cssInputButton = `${BLUL.NAME}-config-input-button`;
  const cssInputCheckbox = `${BLUL.NAME}-config-input-checkbox`;
  const cssInputTextbox = `${BLUL.NAME}-config-input-textbox`;
  const cssInputSlider = `${BLUL.NAME}-config-input-slider`;
  const cssHelpButton = `${BLUL.NAME}-config-help-button`;
  await GM.addStyle(`
  .${cssConfigItem} { margin: 8px; font-size: 14px; }
  .${cssConfigGroupItem} { padding: 0 8px 4px 8px; border: 1px solid #c8c8c8; border-top: none; }
  .${cssSelect} { margin: -1px 0 -1px 8px; }
  .${cssInputButton} {  }
  .${cssInputCheckbox} { vertical-align: bottom; margin: 0 8px 0 0; height: 16px; width: 16px; }
  .${cssInputTextbox} { margin: -1px 0 -1px 8px; padding: 0; height: 19px; }
  .${cssInputTextbox}.number { width: 80px; }
  .${cssInputTextbox}.tel { width: 80px; }
  .${cssInputTextbox}.text { width: 240px; }
  .${cssInputTextbox}.password { width: 240px; }
  .${cssInputTextbox}.url { width: 600px; }
  .${cssInputSlider} { width: 200px; }
  .${cssHelpButton} { margin: 0 4px; cursor: pointer; text-decoration: underline; color: #0080c6; display: inline; }
  `);

  // 返回与 config 对应的一个DOM树(jQuery对象)
  const generate = async (config = CONFIG_DEFAULT, path = '') => {
    if (!path) {
      innerElementMap.clear();
      innerOnClickMap.clear();
      const divElement = $('<div/>');
      for (const key in config) {
        divElement.append(await generate(config[key], key));
      }
      return $('<form/>').append(divElement);
    }
    let { tag, name, title, help, onclick, list, attribute } = optionsMap.get(path) ?? {};
    tag = await Util.result(tag);
    name = (await Util.result(name)) ?? path;
    title = (await Util.result(title)) ?? name;
    help = await Util.result(help);
    list = await Util.result(list);
    attribute = (await Util.mapValuesAndWait(await Util.result(attribute))) ?? {};
    let type = attribute.type;
    const itemElement = $(`<div class="${cssConfigItem}"></div>`);
    const labelElement = $(`<label title="${title}"></label>`);
    itemElement.append(labelElement);
    let innerElement, listElement;
    let cssStyle;
    let rightToLeft = false;
    switch (tag) {
      case 'select':
        innerElement = $('<select/>');
        if (list) {
          listElement = innerElement;
        }
        cssStyle = cssSelect;
        break;
      case 'input':
        innerElement = $('<input/>');
        if (list) {
          attribute.list = `${BLUL.NAME}-config-datalist-${path}`;
          listElement = $(`<datalist id="${attribute.list}"/>`);
          itemElement.append(listElement);
        }
        switch (type) {
          case 'button':
          case 'color':
          case 'file':
            cssStyle = cssInputButton;
            break;
          case 'checkbox':
          case 'radio':
            cssStyle = cssInputCheckbox;
            rightToLeft = true;
            break;
          case 'date':
          case 'datetime-local':
          case 'email':
          case 'month':
          case 'number':
          case 'password':
          case 'search':
          case 'tel':
          case 'text':
          case 'time':
          case 'url':
          case 'week':
            cssStyle = cssInputTextbox;
            break;
          case 'range':
            cssStyle = cssInputSlider;
            break;
          default:
            type = 'text';
            cssStyle = cssInputTextbox;
        }
        break;
      case 'button':
        innerElement = $('<button/>');
        cssStyle = cssInputButton;
    }
    if (listElement) {
      for (const o of list) {
        if (_.isPlainObject(o)) {
          listElement.append($(`<option value="${o.value}">${o.text}</option>`));
        } else {
          listElement.append($(`<option>${o}</option>`));
        }
      }
    }
    if (innerElement) {
      innerElement.attr(attribute);
      innerElement.addClass(cssStyle);
      if (type) {
        innerElement.addClass(type);
      }
      if (rightToLeft) {
        labelElement.append(innerElement);
        labelElement.append(name);
      } else {
        labelElement.append(name);
        labelElement.append(innerElement);
      }
    } else {
      labelElement.append(name);
    }
    if (help) {
      const helpElement = $(`<span class="${cssHelpButton}">?</span>`);
      helpElement.click(() => {
        if (BLUL.Dialog) {
          const dialog = new BLUL.Dialog(help, '帮助');
          dialog.addButton('知道了', dialog.close);
          dialog.show();
        } else {
          alert(help);
        }
      });
      itemElement.append(helpElement);
    }
    let groupElement;
    for (const key in config) {
      if (key.startsWith('_')) continue;
      if (!groupElement) groupElement = $(`<div class="${cssConfigGroupItem}"></div>`);
      groupElement.append(await generate(config[key], path + '.' + key));
    }
    if (groupElement) {
      itemElement.append(groupElement);
    }
    if (innerElement) {
      const onclicks = [];
      if (onclick instanceof Function) {
        onclicks.push(function (...args) {
          try {
            return onclick.apply(this, args);
          } catch (error) {
            BLUL.Logger.error(NAME, error);
          }
        });
      }
      if (groupElement && (type === 'checkbox' || type === 'radio')) {
        const innerOnClick = checked => {
          innerElement.prop('checked', checked);
          if (checked) groupElement.show();
          else groupElement.hide();
        };
        innerOnClickMap.set(innerElement, innerOnClick);
        onclicks.push(innerOnClick);
      }
      if (onclicks.length > 0) {
        if (type === 'checkbox' || type === 'radio') {
          innerElement.click(() => Util.callChainAndWait(onclicks, innerElement, innerElement.prop('checked')));
        } else {
          innerElement.click(() => Util.callChainAndWait(onclicks, innerElement));
        }
      }
      innerElementMap.set(path, innerElement);
    }
    return itemElement;
  };

  const get = (path) => {
    const defaultValue = _.get(CONFIG_DEFAULT, path)?.__VALUE__;
    return defaultValue === undefined ? null : (_.get(CONFIG, path)?.__VALUE__ ?? defaultValue);
  };

  const set = async (path, value) => {
    const defaultValue = _.get(CONFIG_DEFAULT, path)?.__VALUE__;
    if (defaultValue === undefined) return;
    const corrector = optionsMap.get(path)?.corrector;
    value = corrector instanceof Function ? await corrector(value) : value;
    _.set(CONFIG, path + '.__VALUE__', value);
  };

  const load = async () => {
    let value = await GM.getValue('config');
    if (!_.isPlainObject(value)) {
      value = {};
    }
    _.assignIn(CONFIG, value);
    await (BLUL.Config.onload = f => f.call(BLUL.Config, BLUL));
  };

  const save = async () => GM.setValue('config', CONFIG);

  const reset = async (path = '', sub = false) => {
    let config = CONFIG_DEFAULT;
    if (path) {
      if (!sub) {
        path += '.__VALUE__';
      }
      _.set(CONFIG, path, _.get(CONFIG_DEFAULT, path));
      config = CONFIG;
    } else {
      Object.assign(CONFIG, CONFIG_DEFAULT);
    }
    return GM.setValue('config', config);
  };

  const upgrade = (path = '') => {
    let ret = 0;
    if (!path) {
      for (const key in CONFIG_DEFAULT) {
        ret += upgrade(key);
      }
      return ret;
    }
    const object = _.get(CONFIG_DEFAULT, path);
    const defaultValue = object.__VALUE__;
    const value = _.get(CONFIG, path)?.__VALUE__;
    if ($.type(value) !== $.type(defaultValue)) {
      _.set(CONFIG, path + '.__VALUE__', defaultValue);
      ret = 1;
    }
    for (const key in object) {
      if (key.startsWith('_')) continue;
      ret += upgrade(path + '.' + key);
    }
    return ret;
  };

  const loadToContext = async (path = '') => {
    try {
      if (!path) {
        let ret = 0;
        for (const key in CONFIG_DEFAULT) {
          ret += await loadToContext(key);
        }
        return ret;
      }
      const tag = optionsMap.get(path)?.tag;
      const innerElement = innerElementMap.get(path);
      const object = _.get(CONFIG_DEFAULT, path);
      const defaultValue = object.__VALUE__;
      let value = _.get(CONFIG, path)?.__VALUE__ ?? defaultValue;
      switch ($.type(defaultValue)) {
        case 'boolean':
          innerElement.prop('checked', value);
          break;
        case 'number':
        case 'string':
          innerElement.val(value);
          break;
        case 'array':
          if (tag !== 'select') {
            value = value.join(',');
          }
          innerElement.val(value);
          break;
        case 'object':
          innerElement.val(JSON.stringify(value));
          break;
      }
      let ret = 0;
      for (const key in object) {
        if (key.startsWith('_')) continue;
        ret += await loadToContext(path + '.' + key);
      }
      innerOnClickMap.get(innerElement)?.call(innerElement, value); // eslint-disable-line no-unused-expressions
      return ret;
    } catch (error) {
      return 1;
    }
  };

  const saveFromContext = async (path = '') => {
    try {
      if (!path) {
        let ret = 0;
        for (const key in CONFIG_DEFAULT) {
          ret += await saveFromContext(key);
        }
        return ret;
      }
      const tag = optionsMap.get(path)?.tag;
      const innerElement = innerElementMap.get(path);
      const object = _.get(CONFIG_DEFAULT, path);
      const defaultValue = object.__VALUE__;
      let value;
      switch ($.type(defaultValue)) {
        case 'boolean':
          value = innerElement.prop('checked');
          break;
        case 'number':
          value = parseFloat(innerElement.val());
          break;
        case 'string':
          value = innerElement.val();
          break;
        case 'array':
          value = innerElement.val();
          if (tag !== 'select') {
            value = value.replace?.split(',');
          }
          break;
        case 'object':
          value = JSON.parse(innerElement.val());
          break;
      }
      value = _.defaultTo(value, defaultValue);
      let ret = 0;
      for (const key in object) {
        if (key.startsWith('_')) continue;
        ret += await saveFromContext(path + '.' + key);
      }
      await set(path, value);
      return ret;
    } catch (error) {
      return 1;
    }
  };
  // options = {tag, name, title, help, onclick, list, corrector, attribute: { type, disabled, min, max, step, minlength, maxlength, placeholder, pattern, ... } }
  // attribute 会直接应用到对应input元素的属性上
  const addItem = (path, name, defaultValue, options) => {
    options = options ?? {};
    options.name = name;
    optionsMap.set(path, options);
    return _.set(CONFIG_DEFAULT, path, { __VALUE__: defaultValue });
  };

  const removeItem = (path) => {
    optionsMap.delete(path);
    return _.unset(CONFIG_DEFAULT, path);
  };

  BLUL.onpostinit(async () => {
    await load();
    const upgradeCount = upgrade();
    if (upgradeCount) {
      await save();
      BLUL.Logger.warn(NAME, `有 ${upgradeCount} 个设置项发生更新，请检查你的设置以确保符合你的要求`);
      await load();
    }
    const btnResetClick = async () => {
      const dialog = new BLUL.Dialog('真的要恢复默认设置吗?', '提示');
      dialog.addButton('确定', () => dialog.close(true));
      dialog.addButton('取消', () => dialog.close(false), 1);
      if (await dialog.show()) {
        await reset();
        window.location.reload(true);
      }
    };
    const btnClearCacheClick = async () => {
      const dialog = new BLUL.Dialog('确定清除缓存?', '提示');
      dialog.addButton('确定', () => dialog.close(true));
      dialog.addButton('取消', () => dialog.close(false), 1);
      if (await dialog.show()) {
        await Util.mapAndWait(await GM.listValues(), v => v.startsWith('timestamp') && GM.deleteValue(v));
        window.location.reload(true);
      }
    };
    const btnClick = async () => {
      const div = await generate();
      if (await loadToContext()) {
        BLUL.Logger.warn(NAME, '加载设置时出错，部分设置项未正确显示');
      }
      const dialog = new BLUL.Dialog(div, '设置');
      dialog.addButton('确定', () => dialog.close(true));
      dialog.addButton('恢复默认设置', btnResetClick, 1);
      dialog.addButton('清除缓存', btnClearCacheClick, 1);
      dialog.addButton('取消', () => dialog.close(false), 1);
      if (await dialog.show()) {
        if (await saveFromContext()) {
          BLUL.Logger.warn(NAME, '保存设置时出错，部分设置项未正确保存');
        }
        await save();
        BLUL.Logger.success(NAME, '保存完成');
        await load();
      }
    };
    BLUL.Page.addTopItem('设置', null, btnClick);
    /* eslint-disable no-unused-expressions */
    await GM.registerMenuCommand?.('设置', btnClick);
    await GM.registerMenuCommand?.('恢复默认设置', btnResetClick);
    await GM.registerMenuCommand?.('清除缓存', btnClearCacheClick);
    /* eslint-enable no-unused-expressions */
  });

  BLUL.Config = {
    get,
    set,
    load,
    save,
    reset,
    upgrade,
    addItem,
    removeItem
  };
  BLUL.lazyFn('onload', BLUL.Config);

  BLUL.debug('Module Loaded: Config', BLUL.Config);

  return BLUL.Config;
}
