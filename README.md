# Bilibili Live Userscript Library

B站直播区用户脚本库

此脚本需要作为 ***前置*** 使用（单独使用也能跑，但无实际功能）

-----------------------------------------

## 开源许可证

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?longCache=true)](https://github.com/SeaLoong/BLUL/blob/master/LICENSE)

+ 本项目中使用到的库
  + [jQuery](https://jquery.com/) - [![MIT License](https://img.shields.io/badge/License-MIT-green.svg?longCache=true)](https://github.com/jquery/jquery/blob/master/LICENSE.txt)
  + [Lodash](https://lodash.com/) - [![MIT License](https://img.shields.io/badge/License-MIT-green.svg?longCache=true)](https://github.com/lodash/lodash/blob/master/LICENSE)
  + [toastr](https://github.com/CodeSeven/toastr) - [![MIT License](https://img.shields.io/badge/License-MIT-green.svg?longCache=true)](https://github.com/CodeSeven/toastr/blob/master/LICENSE)
  + [SparkMD5](https://github.com/satazor/js-spark-md5) - [![WTFPL License](https://img.shields.io/badge/License-WTFPL-green.svg?longCache=true)](https://github.com/satazor/js-spark-md5/blob/master/LICENSE)

-----------------------------------------

## **安装**

如果你会修改使用我写的 `build.js` ，只需要在你的 **元信息** 中加入

```javascript
// @require      https://raw.githubusercontent.com/SeaLoong/BLUL/dist/require.github.js
```

即可，然后用 node.js 跑一下 `build.js` 就能生成能直接使用的脚本。

否则请在你的用户脚本元信息中加入以下 **元信息** ：

```javascript
// @include      /^https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+.*$/
// @connect      bilibili.com
// @connect      *
// @grant        unsafeWindow
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.getResourceUrl
// @grant        GM.xmlHttpRequest
// @grant        GM.addStyle
// @grant        GM.getResourceText
// @grant        GM.registerMenuCommand
// @grant        GM.unregisterMenuCommand
// @run-at       document-start
// @license      MIT License
// @require      https://raw.githubusercontent.com/SeaLoong/BLUL/dist/require.github.js
```

如果因网络不畅等原因导致不能正常加载，你可以使用 **本地加载** 的方式。只需要再加入以下 **元信息** ：

```javascript
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.19/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     Toast https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/toast.js
// @resource     Util https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/util.js
// @resource     Dialog https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/dialog.js
// @resource     Page https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/page.js
// @resource     Logger https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/logger.js
// @resource     Config https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/config.js
// @resource     Request https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/request.js
// @resource     Worker https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker.js
// @resource     Worker/env https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker/env.js
// @resource     Worker/channel https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker/channel.js
// @resource     AppToken https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/apptoken.js
```

然后启用脚本并打开受支持的页面，你应当会看到在偏右上方有 **弹幕**、**日志**、**设置** 等选项

+ 由于部分网站获取js文件时的MIME是 `text/plain` 而不是 `text/javascript`，因此只能使用本地加载的方法来使用
+ 例如在脚本设置 `自定义源` 中把 `BLUL根目录` 设置成 `https://raw.githubusercontent.com/SeaLoong/BLUL/dist` 会导致不能加载，但在 `//@resource` 中加入各个模块的Github链接是可以正常加载的

-----------------------------------------

## **使用例子**

+ 可行的例子A

```javascript
(async function () {
  BLUL.NAME = 'BLRHH';
  // 设置自己脚本的根目录，如果是本地模式则可以不设置
  BLUL.setBase('https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src');
  // 加载自己的模块
  const importModule = BLUL.importModule;
  importModule('MyModule'); // 此时返回值无意义
  /*
  做一些其他的前置操作
  */
  // 执行 BLUL ，参数含义参见后文
  if (!await BLUL.run({ debug: true, slient: false, unique: true, login: true, EULA: '' })) {
    console.error('[BLRHH] BLUL加载失败');
    return;
  }
  /*
  一般来说这里已经没有需要执行代码的地方，因为各个模块应当在 run 事件中执行模块功能
  */
})();
```

+ 可行的例子B

```javascript
(async function () {
  BLUL.NAME = 'BLRHH';
  /*
  做一些前置操作
  */
  // 执行 BLUL ，参数含义参见后文
  if (!await BLUL.run({ debug: true, slient: false, unique: true, login: true, EULA: '' })) {
    console.error('[BLRHH] BLUL加载失败');
    return;
  }
  // 设置自己脚本的根目录，如果是本地模式则可以不设置
  BLUL.setBase('https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src');
  // 加载自己的模块
  const importModule = BLUL.importModule;
  importModule('MyModule'); // 你可以加上 await 保证先后顺序，因为现在这是一个异步函数，此时返回值为模块返回的内容
  /*
  一般来说这里已经没有需要执行代码的地方，因为各个模块应当在 run 事件中执行模块功能
  */
})();
```

-----------------------------------------

## **API**

本库分为几个模块，各个模块提供的接口有不同的使用方式，以下按照模块来分别说明用法。

其中在函数声明前带有 `async` 的说明这个函数应当配合 `await` 使用，否则可能导致不可预计的后果。

参数/样例的函数声明前带 `async` 的说明这个参数兼容异步函数，并且会等待异步函数执行完成和使用其返回值作为实际参数值（如果需要的话）。

-----------------------------------------

### **主脚本**

#### `BLUL.onupgrade` 事件

在脚本发生版本更新时触发，这是最早触发的事件。

```javascript
BLUL.onupgrade(async (BLUL, GM) => {});
```

#### `BLUL.onpreinit` 事件

在脚本判断是否发生版本更新之后触发（不论是否触发 `BLUL.onupgrade`）。

```javascript
BLUL.onpreinit(async (BLUL, GM) => {});
```

#### `BLUL.oninit` 事件

在 `BLUL.onpreinit` 之后触发。

```javascript
BLUL.oninit(async (BLUL, GM) => {});
```

#### `BLUL.onpostinit` 事件

在 `BLUL.oninit` 之后触发。

```javascript
BLUL.onpostinit(async (BLUL, GM) => {});
```

#### `BLUL.onrun` 事件

在 `BLUL.onpostinit` 之后触发，这是最晚触发的事件。其命名也说明了这个事件应当是模块主要逻辑开始执行的入口。

```javascript
BLUL.onrun(async (BLUL, GM) => {});
```

#### 初始信息

```javascript
BLUL.NAME;
BLUL.ENVIRONMENT;
BLUL.ENVIRONMENT_VERSION;
BLUL.VERSION;
BLUL.INFO;
BLUL.INFO.CSRF;
BLUL.INFO.UID;
BLUL.INFO.ROOMID;
BLUL.INFO.ANCHOR_UID;
BLUL.INFO.SHORT_ROOMID;
BLUL.INFO.VISIT_ID;
```

#### `async BLUL.addResource(name, urls, [displayName=name])`

增加一个脚本加载源，可以使用 await 来保证读取到配置项中的源。

+ 参数

> **name** ***(string)***: 设置项在路径中的名称，注意不要有特殊字符，此项会作为键值对的键使用。
>  
> **urls** ***(string|Array)***: URL字符串或可选URL的数组。
>  
> **[displayName=name]** ***(string)***: 设置项显示给用户的名称，默认与 `name` 相同。

#### `BLUL.setBase(urls)`

设置脚本加载源的根目录，该函数只能执行一次。

+ 参数

> **urls** ***(string|Array)***: URL字符串或可选URL的数组。

#### `async BLUL.importModule(name)`

加载模块，在 `run` 执行结束后可以使用 await 来保证加载顺序。

+ 参数

> **name** ***(string)***: 模块名。

+ 返回

> ***(\*)***: 模块返回的内容。

#### `async BLUL.run([options={}])`

+ 参数

> **[options={}]** ***(Object)***: 选项对象。
>  
> **[options.debug]** ***(boolean)***: 设置是否为调试模式。
>  
> **[options.slient]** ***(boolean)***: 设置是否为静默模式，静默模式下不会显示在加载过程中的浮动提示。
>  
> **[options.local]** ***(boolean)***: 设置是否为本地模式。
>  
> **[options.loadInSpecial]** ***(boolean)***: 设置是否在特殊直播间启用脚本（注意：这指的是是否执行外层脚本，在默认状态下外层脚本自动判断是否执行）。
>  
> **[options.unique]** ***(boolean)***: 设置是否不允许脚本多开。
>  
> **[options.login]** ***(boolean)***: 设置是否需要登录才能使用。
>  
> **[options.EULA]** ***(string)***: 设置在首次执行前的提示的“最终用户许可协议”中的协议内容。
>  
> **[options.EULA_VERSION]** ***(string)***: 设置“最终用户许可协议”的版本，如果版本发生更新会再次显示“最终用户许可协议”。

+ 返回

> ***(boolean)***: 表示是否成功加载。

-----------------------------------------

### **Config**

#### `BLUL.Config.onload` 事件

在从存储中读取配置的时候触发。

```javascript
BLUL.Config.onload(async function (BLUL) {
  console.assert(this === BLUL.Config);
});
```

#### `BLUL.Config.get(path)`

获取配置项。

+ 参数

> **path** ***(string)***: 需要读取的配置项的路径。

#### `async BLUL.Config.set(path, value)`

设置配置项，如果对应的配置项设置了 *corrector* ，那么会调用 *corrector* 并把返回值作为实际写入的值。

+ 参数

> **path** ***(string)***: 需要设置的配置项的路径。
>  
> **value** ***(\*)***: 需要设置的配置项的值。

#### `async BLUL.Config.load()`

从存储中读取配置。

#### `async BLUL.Config.save()`

保存配置到存储中。

#### `async BLUL.Config.reset([path=''], [sub=false])`

恢复默认配置项，并保存到存储中。

+ 参数

> **[path]** ***(string)***: 需要恢复默认配置项的路径，为空则指定全部配置。
>  
> **[sub]** ***(boolean)***: 指定是否需要把路径下的子配置项也恢复默认配置。

#### `BLUL.Config.upgrade()`

检查配置项是否发生升级（指出现配置项的实际类型和预计类型不一致）。

+ 返回

> ***(number)***: 指发生升级配置项的个数。

#### `BLUL.Config.addItem(path, name, defaultValue, [options={}])`

+ 参数

> **path** ***(string)***: 配置项的路径。
>  
> **name** ***(string)***: 配置项的名称。
>  
> **defaultValue** ***(\*)***: 配置项的默认值。
>  
> **[options={}]** ***(Object)***: 选项对象。
>  
> **[options.tag]** ***(string|Function)***: 配置项的HTML标签，一般为 `input` 、 `select` 。若参数类型为 `Function` ，则实际参数是函数返回值。
>  
> **[options.title]** ***(string|Function)***: 配置项的 [\<label\>](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/label) 标签的 `title` 属性。若参数类型为 `Function` ，则实际参数是函数返回值。
>  
> **[options.help]** ***(string|Function)***: 配置项的帮助说明。若参数类型为 `Function` ，则实际参数是函数返回值。
>  
> **[options.onclick]** ***(Function)***: 配置项被点击时的回调，应当用在 *radio/checkbox* 上，其函数声明为 `async function (checked) {}` ，返回值*会*传递到下一个处理函数。
>  
> **[options.list]** ***(Array|Function)***: 配置项的选择列表，应当用在 *select*或*类文本框* 上。若参数类型为 `Function` ，则实际参数是函数返回值。
>  
> **[options.corrector]** ***(Function)***: 配置项的数值修正函数，其返回值会作为对应配置项的实际值。
>  
> **[options.attribute]** ***(Object|Function)***: 配置项的的HTML标签的属性，其中的所有对象会应用到对应标签上。详见 [\<input\>](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input) 和 [\<select\>](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/select)。若参数类型为 `Function` ，则实际参数是函数返回值。

#### `BLUL.Config.removeItem(path)`

+ 参数

> **path** ***(string)***: 需要移除的配置项的路径。

-----------------------------------------

### **Dialog**

#### `BLUL.Dialog([content], [title])`

对话框(Dialog)的构造函数，应当使用 `new` 关键字。

+ 参数

> **[content]** ***(\*)***: 对话框的内容，默认为空字符串。
>  
> **[title]** ***(string)***: 对话框的标题，默认为 `提示`。

#### `Dialog.setTitle([title])`

设置对话框的标题。

+ 参数

> **[title]** ***(string)***: 对话框的标题，默认为 `提示`。

+ 返回

> ***(Dialog)***: 对话框对象自身。

#### `Dialog.addContent([content])`

添加对话框的内容。

+ 参数

> **[content]** ***(\*)***: 对话框的内容，默认为空字符串。

+ 返回

> ***(Dialog)***: 对话框对象自身。

#### `Dialog.removeContent([index])`

移除对话框的内容。

+ 参数

> **[index]** ***(number)***: 对话框的内容的索引，默认为最后一个内容的索引。

+ 返回

> ***(Dialog)***: 对话框对象自身。

#### `Dialog.addButton(text, onclick, [style])`

添加对话框的按钮。

+ 参数

> **text** ***(string)***: 按钮的文本。
>  
> **onclick** ***(Function)***: 按钮点击时的回调函数。
>  
> **[style]** ***(number)***: 按钮的样式，可选样式有 `0, 1` 。 默认为 `0` ，其他值也视为 `0`。

+ 返回

> ***(Dialog)***: 对话框对象自身。

#### `Dialog.removeButton([index])`

移除对话框的按钮。

+ 参数

> **[index]** ***(number)***: 对话框的按钮的索引，默认为最后一个按钮的索引。

+ 返回

> ***(Dialog)***: 对话框对象自身。

#### `async Dialog.show()`

显示对话框。

+ 返回

> ***(\*)***: 对话框被关闭时提供的值。

#### `Dialog.close([...returnValues])`

关闭对话框，并设定 `show` 的返回值。

+ 参数

> **...[...returnValues]** ***(\*)***: 提供给 `show` 的返回值。

-----------------------------------------

### **Logger**

#### `BLUL.Logger.log(msg, [type='success'])`

显示一条日志，日志等级为 `warn` 或 `error` 时会同时调用 `BLUL.Toast.warn` 或 `BLUL.Toast.error`。

+ 参数

> **msg** ***(\*)***: 日志显示的内容。
>  
> **[type='success']** ***(string)***: 日志等级，可选值有 `success` `info` `warn` `error` 。默认为 `success`。

#### `BLUL.Logger.success(...msgs)`

显示一条日志，日志等级为 `success`。

+ 参数

> **...msgs** ***(\*)***: 日志显示的内容，其中每个参数之间会用空格连接。

#### `BLUL.Logger.info(...msgs)`

显示一条日志，日志等级为 `info`。

+ 参数

> **...msgs** ***(\*)***: 日志显示的内容，其中每个参数之间会用空格连接。

#### `BLUL.Logger.warn(...msgs)`

显示一条日志，日志等级为 `warn`，同时会调用 `BLUL.Toast.warn`。

+ 参数

> **...msgs** ***(\*)***: 日志显示的内容，其中每个参数之间会用空格连接。

#### `BLUL.Logger.error(...msgs)`

显示一条日志，日志等级为 `error`，同时会调用 `BLUL.Toast.error`。

+ 参数

> **...msgs** ***(\*)***: 日志显示的内容，其中每个参数之间会用空格连接。

-----------------------------------------

### **Page**

#### `BLUL.Page.addTopItem(name, [onselect], [onclick])`

增加一个顶部条目。

+ 参数

> **name** ***(string)***: 条目标题。
>  
> **[onselect]** ***(Function)***: 条目*被选择/被取消选择*时的回调函数。
>  
> **[onclick]** ***(Function)***: 条目*被点击*时的回调函数。

+ 返回

> ***(jQuery)***: 条目的jQuery对象。

#### `BLUL.Page.addContentItem([element=''])`

增加一个内容条目。

+ 参数

> **[element='']** ***(\*)***: 需要被加入的元素。

+ 返回

> ***(jQuery)***: 条目的jQuery对象。

-----------------------------------------

### **Request**

#### `async BLUL.Request.monkey(options)`

调用油猴的 `GM.xmlHttpRequest` 方法来进行网络请求，详见 [GM.xmlHttpRequest](https://wiki.greasespot.net/GM.xmlHttpRequest) 或 [Tampermonkey](http://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest)/[Violentmonkey](https://violentmonkey.github.io/api/gm/#gm_xmlhttprequest)。

+ 参数

> **options** ***(string|Object)***: URL字符串或选项对象。
>  
> **[options.method='GET']** ***(string)***: 请求方式。
>  
> **[options.url]** ***(string)***: 请求URL。
>  
> **[options.search]** ***(Object)***: 请求的查询对象。
>  
> **[options.headers]** ***(Object)***: 请求头。
>  
> **[options.data]** ***(Object)***: POST请求的传递数据。
>  
> **[options.*]** ***(\*)***: 剩余参数，取决于用户环境，详见文档。

+ 返回

> ***(类XMLHttpRequest)***: 取决于用户环境，详见文档。

#### `async BLUL.Request.fetch(options)`

调用 `Fetch_API` 的 `fetch` 方法来进行网络请求。详见 [fetch](https://developer.mozilla.org/zh-CN/docs/Web/API/WindowOrWorkerGlobalScope/fetch)。

+ 参数

> **options** ***(string|Object)***: URL字符串或选项对象。
>  
> **[options.method='GET']** ***(string)***: 请求方式。
>  
> **[options.url]** ***(string)***: 请求URL。
>  
> **[options.search]** ***(Object)***: 请求的查询对象。
>  
> **[options.headers]** ***(Object)***: 请求头。
>  
> **[options.data]** ***(Object)***: POST请求的传递数据。
>  
> **[options.*]** ***(\*)***: 剩余参数，详见文档。

+ 返回

> ***(Response)***: 详见 [Response](https://developer.mozilla.org/zh-CN/docs/Web/API/Response) 文档 。

-----------------------------------------

### **Toast**

#### `BLUL.Toast.success(...msgs)`

显示一个浮动提示，等级为 `success`。

+ 参数

> **...msgs** ***(\*)***: 显示的内容，其中每个参数之间会用 `<br>` 连接。

#### `BLUL.Toast.info(...msgs)`

显示一个浮动提示，等级为 `info`。

+ 参数

> **...msgs** ***(\*)***: 显示的内容，其中每个参数之间会用 `<br>` 连接。

#### `BLUL.Toast.warn(...msgs)`

显示一个浮动提示，等级为 `warn`，同时会调用 `BLUL.Logger.warn`。

+ 参数

> **...msgs** ***(\*)***: 显示的内容，其中每个参数之间会用 `<br>` 连接。

#### `BLUL.Toast.error(...msgs)`

显示一个浮动提示，等级为 `error`，同时会调用 `BLUL.Logger.error`。

+ 参数

> **...msgs** ***(\*)***: 显示的内容，其中每个参数之间会用 `<br>` 连接。

-----------------------------------------

### **Util**

#### `BLUL.Util.getGlobalScope()`

获取当前全局作用域的名称。

+ 返回

> ***(string)***: 当前全局作用域的名称。

#### `async BLUL.Util.sleep(ms)`

等待（需要配合 `await` 使用）。

+ 参数

> **ms** ***(number)***: 等待的时间，单位毫秒。

#### `async BLUL.Util.result(value, [thisArg], [...args])`

如果 `value` 是函数，则返回调用后的结果，否则返回本身。

+ 参数

> **value** ***(\*)***: 值。
>  
> **[thisArg]** ***(\*)***: 调用时传入的this参数。
>  
> **[...args]** ***(\*)***: 调用时传入的参数。

+ 返回

> ***(\*)***: `value` 本身或调用后的结果。

#### `BLUL.Util.codeToURL(code)`

生成一个URL，其中内容是这个JavaScript代码。可用于动态执行代码。

+ 参数

> **code** ***(string)***: JavaScript代码。

+ 返回

> ***(string)***: 对应代码文件的URL。

#### `BLUL.Util.toURLSearchParamString(search)`

转换为查询字符串，参数可以是 字符串/对象 及其他 `URLSearchParams()` 支持的参数。

+ 参数

> **search** ***(\*)***: 要被转换的参数。

+ 返回

> ***(string)***: 转换得到的查询字符串。

#### `BLUL.Util.getCookie(key)`

获取Cookie。

+ 参数

> **key** ***(string)***: Cookie的键。

+ 返回

> ***(string)***: Cookie的值。

#### `BLUL.Util.compareVersion(version1, version2)`

比较版本号的大小。

+ 参数

> **version1** ***(string)***: 要比较的版本字符串1。
>  
> **version2** ***(string)***: 要比较的版本字符串2。

+ 返回

> ***(number)***: 比较的结果：version1 > version2 返回大于的数0；version1 === version2 返回0；version1 < version2 返回小于的数0。

#### `BLUL.Util.beforeNow(ts, [range=86400e3], [offset=60e3])`

判断给定的时间戳是不是在当前时间的前一段时间到当前时间之间，为了方便使用，实际用于判断的时间减去了offset。

+ 参数

> **ts** ***(number)***: 时间戳。
>  
> **[range=86400e3]** ***(number)***: 时间范围，默认为1天，单位毫秒。
>  
> **[offset=60e3]** ***(number)***: 允许的时间误差，默认为1分钟，单位毫秒。

+ 返回

> ***(boolean)***: 判断的结果。

#### `BLUL.Util.isToday(ts)`

判断给定的时间戳是不是在当日，以UTC+8为标准（经过时区修正）。

+ 参数

> **ts** ***(number)***: 时间戳。

+ 返回

> ***(boolean)***: 判断的结果。

#### `BLUL.Util.atTime([ts=Date.now()], [hours=0], [min=1], [sec=0], [ms=0])`

计算并返回在给定时间戳下，下一次时间对应的时间戳（经过时区修正）。

+ 参数

> **[ts=Date.now()]** ***(number)***: 时间戳。
>  
> **[hours=0]** ***(number)***: 小时。
>  
> **[min=1]** ***(number)***: 分钟。
>  
> **[sec=0]** ***(number)***: 秒。
>  
> **[ms=0]** ***(number)***: 毫秒。

+ 返回

> ***(number)***: 下次时间对应的时间戳。

#### `BLUL.Util.isAtTime([ts=Date.now()], [hours=0], [min=1], [sec=0], [ms=0])`

判断 `atTime(ts, hours, min, sec, ms)` 返回的时间戳是否小于当前时间戳（经过时区修正）。

等价于 `return atTime(ts, hours, min, sec, ms) <= Date.now()`。

+ 参数

> **[ts=Date.now()]** ***(number)***: 时间戳。
>  
> **[hours=0]** ***(number)***: 小时。
>  
> **[min=1]** ***(number)***: 分钟。
>  
> **[sec=0]** ***(number)***: 秒。
>  
> **[ms=0]** ***(number)***: 毫秒。

+ 返回

> ***(boolean)***: 判断结果。

#### `BLUL.Util.callAtTime(f, [hours=0], [min=1], [sec=0], [ms=0])`

在指定的时间（与日期无关）执行给定的函数，以UTC+8为标准（经过时区修正）。

在下一次到达指定的时间时执行，因此可能会在当天或次日执行。

+ 参数

> **f** ***(Function)***: 待执行的函数。
>  
> **[hours=0]** ***(number)***: 小时。
>  
> **[min=1]** ***(number)***: 分钟。
>  
> **[sec=0]** ***(number)***: 秒。
>  
> **[ms=0]** ***(number)***: 毫秒。

+ 返回

> ***(Promise)***: 等待过程的Promise。

#### `BLUL.Util.cancelCallAtTime(f)`

取消在指定的时间执行给定的函数。

+ 参数

> **f** ***(Function)***: 待取消执行的函数。

#### `BLUL.Util.sortByKey(obj, [compareFn], [reverse=false])`

对对象中的每个键值对按照键的排序顺序来排序。

+ 参数

> **obj** ***(Object)***: 对象。
>  
> **[compareFn]** ***(Function)***: 比较函数，将会被传递到 `sort()` 函数中。
>  
> **[reverse=false]** ***(\*)***: 是否倒序。

+ 返回

> ***(Object)***: 排序后的对象。

#### `async BLUL.Util.mapAndWait(array, f, [thisArg])`

对数组中的每个元素执行给定的函数，并等待异步结果。

+ 参数

> **array** ***(Array)***: 数组。
>  
> **f** ***(Function)***: 要执行的函数，其函数声明为 `async function (element, index, array) {}`。
>  
> **[thisArg]** ***(\*)***: 调用时传入的this参数。

+ 返回

> ***(Array)***: 所有结果组成的数组。

#### `async BLUL.Util.mapKeysAndWait(object, f, [thisArg])`

对对象中的每个键值对执行给定的函数，并等待异步结果，并且将返回值作为键值对的新键。

+ 参数

> **object** ***(Object)***: 数组。
>  
> **f** ***(Function)***: 要执行的函数，其函数声明为 `async function (value, key, object) {}`。
>  
> **[thisArg]** ***(\*)***: 调用时传入的this参数。

+ 返回

> ***(Object)***: 所有结果组成的对象。

#### `async BLUL.Util.mapValuesAndWait(object, f, [thisArg])`

对对象中的每个键值对执行给定的函数，并等待异步结果，并且将返回值作为键值对的新值。

+ 参数

> **object** ***(Object)***: 数组。
>  
> **f** ***(Function)***: 要执行的函数，其函数声明为 `async function (value, key, object) {}`。
>  
> **[thisArg]** ***(\*)***: 调用时传入的this参数。

+ 返回

> ***(Object)***: 所有结果组成的对象。

#### `async BLUL.Util.callEachAndWait(funcs, [thisArg], [...args])`

**分别**调用函数数组的每个函数，并等待异步结果。

+ 参数

> **funcs** ***(Array)***: 函数数组。
>  
> **[thisArg]** ***(\*)***: 调用时传入的this参数。
>  
> **[...args]** ***(\*)***: 调用时传入的参数。

+ 返回

> ***(Array)***: 所有结果组成的数组。

#### `async BLUL.Util.callChainAndWait(funcs, [thisArg], [...args])`

**链式**调用函数数组的每个函数，前一个函数的返回值作为后一个函数的第一个参数，并等待异步结果。

+ 参数

> **funcs** ***(Array)***: 函数数组。
>  
> **[thisArg]** ***(\*)***: 调用时传入的this参数。
>  
> **[...args]** ***(\*)***: 调用时传入的参数。

+ 返回

> ***(Array)***: 所有结果组成的数组。

#### `async BLUL.Util.callUntilTrue(f, [interval=50], [thisArg], [...args])`

**持续**调用函数，并等待异步结果，直到返回被认为 `true` 的结果。

+ 参数

> **f** ***(Function)***: 要执行的函数。
>  
> **[interval=50]** ***(\*)***: 调用等待间隔，默认50ms。
>  
> **[thisArg]** ***(\*)***: 调用时传入的this参数。
>  
> **[...args]** ***(\*)***: 调用时传入的参数。

+ 返回

> ***(\*)***: 调用函数返回的结果。

#### `BLUL.Util.retry(f)`

在一定时间后调用给定的函数，每次调用后会使得下一次调用的等待时间翻倍，最长为 1 小时。

+ 参数

> **f** ***(Function)***: 待执行的函数。

+ 返回

> ***(Promise)***: 等待过程的Promise。

#### `BLUL.Util.cancelRetry(f)`

取消调用给定的函数，并清空等待时间。

+ 参数

> **f** ***(Function)***: 待取消执行的函数。

-----------------------------------------

### **Worker**

#### `async BLUL.Worker.importModule(name)`

在 Worker 中加载模块。

+ 参数

> **name** ***(string)***: 模块名。

+ 返回

> ***(\*)***: 模块返回的内容。
