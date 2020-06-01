const config = {
  maxLog: 1000,
  showDateTime: true,
  outputConsole: false
};
export default async function (importModule, BLUL, GM) {
  const cssLogger = `${BLUL.NAME}-logger`;
  const cssLoggerItem = `${BLUL.NAME}-logger-item`;
  const cssLoggerDateTime = `${BLUL.NAME}-logger-datetime`;
  await GM.addStyle(`
  .${cssLogger} { background-color: #f9f9f9; border-radius: 12px; }
  .${cssLoggerItem} { margin: 8px; padding: 8px; border: 1px solid transparent; border-radius: 6px; vertical-align: middle; line-height: 1.5; text-align: center; word-break: break-all; }
  .${cssLoggerItem}.success { border-color: #47d279; background-color: #ecfaf1; }
  .${cssLoggerItem}.info { border-color: #48bbf8; background-color: #daf1fd; }
  .${cssLoggerItem}.warn { border-color: #ffb243; border-width: 2px; background-color: #fcf8db; }
  .${cssLoggerItem}.error { border-color: #ff6464; border-width: 2px; background-color: #ffe0e0; }
  .${cssLoggerDateTime} { display: block; }
  `);

  let divLogger;

  const dateTimeFormat = new Intl.DateTimeFormat('zh', { dateStyle: 'short', timeStyle: 'long', hour12: false });

  const logs = [];
  let keepScroll = true;

  function log (msg, type = 'success') {
    try {
      while (logs.length >= config.maxLog) {
        logs.shift().remove();
      }
      const element = $(`<div class="${cssLoggerItem} ${type}"></div>`);
      let dateTime;
      if (config.showDateTime) {
        dateTime = dateTimeFormat.format(Date.now());
        element.append($(`<span class="${cssLoggerDateTime}">${dateTime}</span>`));
      }
      element.append(msg);
      logs.push(element);
      divLogger.append(element);
      // 滚动到最底部
      if (keepScroll) {
        divLogger.scrollTop(divLogger.prop('scrollHeight') - divLogger.prop('clientHeight'));
      }
      if (this !== BLUL.Toast && (type === 'error' || type === 'warn')) {
        BLUL.Toast[type].call(BLUL.Logger, msg);
      }
      if (config.outputConsole || type === 'error' || type === 'warn') {
        msg = msg.replace('<br>', ' ');
        console[type === 'success' ? 'log' : type].call(this, dateTime ? `[${BLUL.NAME}][${dateTime}]${msg}` : `[${dateTime}]${msg}`);
      }
    } catch (error) {
      console.error(`[${BLUL.NAME}]`, error);
    }
  }

  function success (...msgs) {
    return log.call(this, msgs.join('<br>'), 'success');
  }

  function info (...msgs) {
    return log.call(this, msgs.join('<br>'), 'info');
  }

  function warn (...msgs) {
    return log.call(this, msgs.join('<br>'), 'warn');
  }

  function error (...msgs) {
    return log.call(this, msgs.join('<br>'), 'error');
  }

  BLUL.onpreinit.push(() => {
    BLUL.Page.addTopItem('日志', function (select) {
      if (select) {
        divLogger.show();
      } else {
        divLogger.hide();
        keepScroll = true;
      }
    });

    divLogger = BLUL.Page.addContentItem();
    divLogger.addClass(cssLogger);
    divLogger.scroll(function () {
      // 滚动条接近底部
      keepScroll = (divLogger.scrollTop() + divLogger.prop('clientHeight') + 30 >= divLogger.prop('scrollHeight'));
    });

    BLUL.Config.addItem('logger', '日志设置', false, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('logger.showDateTime', '显示日期时间', config.showDateTime, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('logger.maxLog', '日志上限', config.maxLog, { tag: 'input', help: '最多显示多少条日志，数值过大可能会导致性能问题', attribute: { type: 'number', min: 10, max: 10000, step: 100 } });
    BLUL.Config.addItem('logger.outputConsole', '同时输出到控制台', config.outputConsole, { tag: 'input', attribute: { type: 'checkbox' } });

    BLUL.Config.onload.push(() => {
      config.showDateTime = BLUL.Config.get('logger.showDateTime');
      config.maxLog = BLUL.Config.get('logger.maxLog');
      config.outputConsole = BLUL.Config.get('logger.outputConsole');
    });
  });

  BLUL.Logger = {
    log,
    success,
    info,
    warn,
    error
  };

  BLUL.debug('Module Loaded: Logger', BLUL.Logger);

  return BLUL.Logger;
}
