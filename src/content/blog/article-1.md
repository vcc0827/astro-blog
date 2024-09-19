---
title: "Let's start writing blog!"
description: "mpxjs开发记录---搭建项目"
pubDate: "Jun 8 2024"
heroImage: "/blog-placeholder-4.jpg"
---
## 前言
为了能实现小程序的多端通用，项目组决定使用mpxjs框架去重新构建当前的小程序。

## mpxjs 介绍
<a ref="https://mpxjs.cn/">官网</a> | <a ref="https://github.com/didi/mpx">github</a>

## 项目开始

### 搭建项目
#### 这部分内容可以参考官网的教程
```
// 创建项目-方式1
// 安装脚手架
npm i -g @mpxjs/cli

mpx create mpx-project

// 创建项目-方式2 推荐
npx @mpxjs/cli create mpx-project

// 初始化，安装依赖
npm i

// 启动项目(使用小程序开发者工具打开dist下对应平台的目录夹，即可进行调试)
npm run serve
```
#### 这是我在安装时的选择,可以根据自己的需求进行选择
```
npx @mpxjs/cli create mpx-project
? 请选择小程序项目所属平台（目前仅微信下支持跨平台输出） wx
? 是否需要跨小程序平台 Yes
? 是否需要 web ssr No
? 是否需要typescript Yes
? 是否需要使用原子类 No
? 是否需要单元测试 Yes
? 是否需要自动化测试 Yes
? 项目描述 a mpx refactor project
// 选择wx平台后还会需要有一个小程序AppID。
// 官网给出的原因：创建插件项目由于微信限制必须填写插件的AppID，创建普通项目无强制要求。
```

### 项目搭建完成后的结构
```
mpx-project
├─ .cache
├─ .e2erc.js
├─ .editorconfig
├─ .eslintrc.js
├─ .gitignore
├─ README.md
├─ babel.config.json
├─ e2e
│  ├─ components
│  │  └─ list.spec.ts
│  └─ screenshot
│     └─ README.md
├─ jest-e2e.config.js
├─ jest.config.js
├─ package.json
├─ postcss.config.js
├─ public
│  └─ index.html
├─ src
│  ├─ app.mpx
│  ├─ components
│  │  └─ list.mpx
│  ├─ global.d.ts
│  └─ pages
│     └─ index.mpx
├─ static
│  ├─ ali
│  │  └─ mini.project.json
│  ├─ dd
│  │  └─ project.config.json
│  ├─ swan
│  │  └─ project.swan.json
│  ├─ tt
│  │  └─ project.config.json
│  └─ wx
│     └─ project.config.json
├─ test
│  ├─ components
│  │  └─ list.spec.js
│  └─ setup.js
├─ tsconfig.json
├─ vue.config.js
└─ yarn.lock
```
