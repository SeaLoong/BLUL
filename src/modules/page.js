/* global $ */
export default async function (importModule, BLUL, GM) {
  const div = $('<div class="aside-area p-absolute" style="border: 0px; background-color: #FFF;"></div>');
  const headerDiv = $('<div></div>');

  const cssTopItem = `${BLUL.NAME}-page-top-item`;
  const cssTopItemSelected = `${BLUL.NAME}-page-top-item-selected`;
  const cssClickable = `${BLUL.NAME}-page-clickable`;
  const cssContentItemDiv = `${BLUL.NAME}-page-content-item`;
  await GM.addStyle(`
  .${cssTopItem} { display: inline-block; margin: 2px 8px; padding: 2px 4px; }
  .${cssTopItemSelected} { text-decoration: underline; color: gold; font-weight: bold; }
  .${cssClickable} { cursor: pointer; }
  .${cssContentItemDiv} { width: 100%; height: calc(100% - 20px); overflow: auto; }
  `);

  const itemMap = new Map();
  let lastItem = null;

  const addTopItem = (name, onselect, onclick) => {
    const item = $(`<div class="${cssTopItem} ${cssClickable}">${name}</div>`);
    itemMap.set(item.get(0), onselect);
    if (typeof onselect === 'function') {
      item.click(function () {
        if (lastItem === this) return;
        if (lastItem) {
          $(lastItem).removeClass(cssTopItemSelected);
          itemMap.get(lastItem).call(lastItem, false);
        }
        $(this).addClass(cssTopItemSelected);
        itemMap.get(this).call(lastItem, true);
        lastItem = this;
      });
    }
    if (typeof onclick === 'function') {
      item.click(onclick);
    }
    headerDiv.append(item);
    if (!lastItem) {
      item.click();
    }
    return item;
  };

  const addContentItem = (element = '') => {
    const contentItemDiv = $(`<div class="${cssContentItemDiv}"></div>`);
    div.append(contentItemDiv);
    contentItemDiv.append(element);
    return contentItemDiv;
  };

  const vm = $('#aside-area-vm');
  vm.before(div);
  div.append(headerDiv);
  div.append(vm);
  vm[0].style = 'top: 20px;';

  addTopItem('弹幕', (select) => {
    if (select) {
      vm.show();
    } else {
      vm.hide();
    }
  });

  BLUL.Page = {
    addTopItem,
    addContentItem
  };

  BLUL.debug('Module Loaded: Page', BLUL.Page);

  return BLUL.Page;
}
