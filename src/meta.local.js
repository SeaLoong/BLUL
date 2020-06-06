// ==UserScript==
// @name         BLUL
// @namespace    SeaLoong
// @version      1.0.0
// @description  Bilibili Live Userscript Library
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/BLUL
// @supportURL   https://github.com/SeaLoong/BLUL/issues
// @include      /^https?:\/\/live\.bilibili\.com\/\d+.*$/
// @include      /^https?:\/\/live\.bilibili\.com\/blanc\/\d+.*$/
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
// @require      https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/main.js
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.15/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     jsencrypt https://cdn.jsdelivr.net/npm/jsencrypt@3.0.0-rc.1/bin/jsencrypt.min.js
// @resource     Toast https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/toast.js
// @resource     Util https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/util.js
// @resource     Dialog https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/dialog.js
// @resource     Page https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/page.js
// @resource     Logger https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/logger.js
// @resource     Config https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/config.js
// @resource     Request https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/request.js
// ==/UserScript==
