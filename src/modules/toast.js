const config = {
  hideToast: false
};
export default async function (importModule, BLUL, GM) {
  await importModule('toastr');
  await GM.addStyle(await GM.getResourceText('toastr.css'));

  const toastr = window.toastr;
  window.toastr = undefined;
  toastr.options = {
    closeButton: false,
    debug: false,
    newestOnTop: true,
    progressBar: false,
    positionClass: 'toast-top-right',
    preventDuplicates: true,
    showDuration: '200',
    hideDuration: '200',
    timeOut: '6000',
    extendedTimeOut: '2000',
    showEasing: 'swing',
    hideEasing: 'swing',
    showMethod: 'slideDown',
    hideMethod: 'slideUp'
  };

  function toast (msg, type = 'success') {
    try {
      if (config.hideToast) return;
      if (this !== BLUL.Logger) {
        const logger = BLUL.Logger ?? console;
        logger[type === 'success' ? 'log' : type].call(BLUL.Toast, logger === console ? msg.replace('<br>', ' ') : msg);
      }
      toastr[type === 'warn' ? 'warning' : type].call(this, msg);
    } catch (error) {
      console.error(`[${BLUL.NAME}]`, error);
    }
  }

  function success (...msgs) {
    return toast.call(this, msgs.join('<br>'), 'success');
  }

  function info (...msgs) {
    return toast.call(this, msgs.join('<br>'), 'info');
  }

  function warn (...msgs) {
    return toast.call(this, msgs.join('<br>'), 'warn');
  }

  function error (...msgs) {
    return toast.call(this, msgs.join('<br>'), 'error');
  }

  BLUL.onpreinit.push(() => {
    BLUL.Config.addItem('hideToast', '隐藏浮动提示', config.hideToast, { help: '浮动提示就是会在右上角显示的那个框框' });

    BLUL.Config.onload.push(() => {
      config.hideToast = BLUL.Config.get('hideToast');
    });
  });

  BLUL.Toast = {
    success,
    info,
    warn,
    error
  };

  BLUL.debug('Module Loaded: Toast', BLUL.Toast);

  return BLUL.Toast;
}
