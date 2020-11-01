// ==UserScript==
// @name          BLUL
// @namespace     SeaLoong
// @version       1.0.3
// @description   Bilibili Live Userscript Library
// @author        SeaLoong
// @homepageURL   https://github.com/SeaLoong/BLUL
// @supportURL    https://github.com/SeaLoong/BLUL/issues
// @updateURL     ./require.{replace}.js
// @include       /^https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+.*$/
// @connect       bilibili.com
// @connect       *
// @grant         unsafeWindow
// @grant         GM.getValue
// @grant         GM.setValue
// @grant         GM.deleteValue
// @grant         GM.listValues
// @grant         GM.getResourceUrl
// @grant         GM.xmlHttpRequest
// @grant         GM.addStyle
// @grant         GM.getResourceText
// @grant         GM.registerMenuCommand
// @grant         GM.unregisterMenuCommand
// @run-at        document-start
// @license       MIT License
// @incompatible  chrome 不支持内核低于80的版本
// @incompatible  firefox 不支持内核低于72的版本
// @require       ./main.js
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.19/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     Toast ./modules/toast.js
// @resource     Util ./modules/util.js
// @resource     Dialog ./modules/dialog.js
// @resource     Page ./modules/page.js
// @resource     Logger ./modules/logger.js
// @resource     Config ./modules/config.js
// @resource     Request ./modules/request.js
// @resource     Worker ./modules/worker.js
// @resource     Worker/env ./modules/worker/env.js
// @resource     Worker/channel ./modules/worker/channel.js
// @resource     AppToken ./modules/apptoken.js
// ==/UserScript==
