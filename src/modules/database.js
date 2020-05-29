/*
export default async function (importModule, BLUL, GM) {
  if (!window.indexedDB) {
    BLUL.Toast.warn('浏览器不支持indexedDB，相关功能将会失效');
    return;
  }

  const open = () => {
    const req = window.indexedDB.open(BLUL.NAME, 1);
    req.onupgradeneeded = event => {
      BLUL.Toast.info('数据库版本更新', event.oldVersion, '=>', event.newVersion);
    };
    req.onblocked = event => {
      BLUL.Toast.warn('打开数据库被阻止，可能脚本重复运行，相关功能将会失效');
    };
    req.onsuccess = event => {
      event.target.result;
    };
    req.onerror = event => {
      BLUL.Toast.warn('数据库打开失败，相关功能将会失效');
    };
  };

  BLUL.Database = {
    open
  };
}
*/
