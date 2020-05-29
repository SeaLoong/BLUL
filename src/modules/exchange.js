const NAME = '兑换';
const config = {
  exchange: false,
  silver2coin: false,
  coin2silver: false,
  quantity: 0
};
export default async function (importModule, BLUL, GM) {
  const NAME_SILVER2COIN = NAME + '-银瓜子兑换硬币';
  async function silver2coin () {
    BLUL.debug('Exchange.silver2coin');
    if (!config.silver2coin) return;
    try {
      const response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://api.live.bilibili.com/pay/v1/Exchange/silver2coin',
        data: {
          platform: 'pc',
          csrf: BLUL.INFO.CSRF,
          csrf_token: BLUL.INFO.CSRF,
          visit_id: BLUL.INFO.VISIT_ID
        }
      });
      const obj = await response.json();
      if (obj.code === 0) {
        BLUL.Logger.success(NAME_SILVER2COIN, obj.message);
        return BLUL.Util.removeRetry(silver2coin);
      } else if (obj.message.includes('最多')) {
        BLUL.Logger.info(NAME_SILVER2COIN, obj.message);
        return BLUL.Util.removeRetry(silver2coin);
      }
      BLUL.Logger.warn(NAME_SILVER2COIN, obj.message);
    } catch (error) {
      BLUL.Logger.error(NAME_SILVER2COIN, error);
    }
    return BLUL.Util.retry(silver2coin);
  }

  const NAME_COIN2SILVER = NAME + '-硬币兑换银瓜子';
  async function coin2silver () {
    BLUL.debug('Exchange.coin2silver');
    if (!config.coin2silver) return;
    try {
      const response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://api.live.bilibili.com/pay/v1/Exchange/coin2silver',
        data: {
          num: config.quantity,
          platform: 'pc',
          csrf: BLUL.INFO.CSRF,
          csrf_token: BLUL.INFO.CSRF,
          visit_id: BLUL.INFO.VISIT_ID
        }
      });
      const obj = await response.json();
      if (obj.code === 0) {
        BLUL.Logger.success(NAME_COIN2SILVER, obj.message);
        return BLUL.Util.removeRetry(coin2silver);
      } else if (obj.message.includes('最多')) {
        BLUL.Logger.info(NAME_COIN2SILVER, obj.message);
        return BLUL.Util.removeRetry(coin2silver);
      }
      BLUL.Logger.warn(NAME_COIN2SILVER, obj.message);
    } catch (error) {
      BLUL.Logger.error(NAME_COIN2SILVER, error);
    }
    return BLUL.Util.retry(coin2silver);
  }

  const timestampName = 'exchangeTimestamp';

  async function run () {
    BLUL.debug('Exchange.run');
    if (!config.exchange) return;
    if (!BLUL.Util.isToday(await GM.getValue(timestampName) ?? 0)) {
      await Promise.all([silver2coin(), coin2silver()]);
      await GM.setValue(timestampName, Date.now());
    }
    BLUL.Util.callTomorrow(run);
    if (this !== BLUL.Config) {
      BLUL.Logger.info(NAME, '今日已进行过兑换，等待下次兑换');
    }
  }

  BLUL.onupgrade.push(() => GM.deleteValue(timestampName));

  BLUL.oninit.push(() => {
    BLUL.Config.addObjectItem('exchange', NAME, config.exchange);
    BLUL.Config.addItem('exchange.silver2coin', '银瓜子兑换硬币', config.silver2coin, { help: '700银瓜子=1硬币，每天最多兑换1次' });
    BLUL.Config.addObjectItem('exchange.coin2silver', '硬币兑换银瓜子', config.coin2silver, { help: '1硬币=450银瓜子（老爷或大会员500银瓜子）普通用户每天兑换上限25硬币；老爷或大会员每天兑换上限50硬币。' });
    BLUL.Config.addItem('exchange.coin2silver.quantity', '兑换数量', config.quantity, {
      placeholder: '默认为1',
      validator: v => v > 0 ? v : 1
    });
    BLUL.Config.onload.push(() => {
      config.exchange = BLUL.Config.get('exchange');
      config.silver2coin = BLUL.Config.get('exchange.silver2coin');
      config.coin2silver = BLUL.Config.get('exchange.coin2silver');
      config.quantity = BLUL.Config.get('exchange.coin2silver.quantity');
    });
  });
  BLUL.onrun.push(run);

  BLUL.Exchange = {
    run,
    silver2coin,
    coin2silver
  };

  BLUL.debug('Module Loaded: Exchange', BLUL.Exchange);

  return BLUL.Exchange;
}
