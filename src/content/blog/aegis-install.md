---
title: "腾讯云Aegis接入"
description: "小程序性能优化工具"
pubDate: "Sep 25 2024"
heroImage: "/blog-placeholder-2.jpg"
---

### 前言

接入前端性能监控（Real User Monitoring，RUM）- Aegis 的目的是为了实现前端性能监控，及时发现问题并定位问题。

### 小程序接入指南

可参考 <a href="https://cloud.tencent.com/document/product/1464/58566">官方小程序场景安装和初始化</a>

#### 安装SDK
执行下列命令，在项目里安装 aegis-mp-sdk。
```
npm i --save aegis-mp-sdk
```
#### 初始化SDK
参考下列步骤新建一个 Aegis 实例，传入相应的配置，初始化 SDK。<br>
这里的引入方式我都没有成功，原因是小程序需要构建npm。
```
// 引入方式一
import Aegis from 'aegis-mp-sdk';

// 引入方式二
import * as Aegis from 'aegis-mp-sdk';

// 引入方式三
const Aegis = require('aegis-mp-sdk')

const aegis = new Aegis({
  id: "pGUVFTCZyewxxxxx", // RUM 上申请的上报 key
  uin: 'xxx', // 用户唯一 ID（可选）
  reportApiSpeed: true, // 接口测速
  reportAssetSpeed: true, // 静态资源测速
  hostUrl: 'https://rumt-zh.com', // 上报域名，中国大陆 rumt-zh.com
  spa: true, // 页面切换的时候上报 pv
})
```
#### 接入过程中遇到的一些问题

1. 在 app.js 中 使用 import Aegis from 'aegis-mp-sdk'后<br>
   小程序报错: Error: module 'aegis-mp-sdk.js' is not defined<br>
   <image src="/install-error.png" /><br>
   说明引入失败。<br>
   **解决办法**: 使用微信开发着工具的构建 npm，在构建完成后，引入 miniprogram_npm 中的 aegis 即可
2. 在使用 aegis.info()方法时报错: aegis.info(...) is not a function<br>
   **解决办法**: 先判断实例 aegis 是否存在，然后再去调用方法。
   ```
    // 方法一
    <!--省略实例化的代码-->
    aegis?.info('test')
    
    // 方法二(如果不支持使用方法一的可选链)
    if(aegis) {
      aegis.info('test')
    }
   ```
