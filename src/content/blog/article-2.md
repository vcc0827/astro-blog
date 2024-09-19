---
title: "mpxjs开发记录2——文件结构"
description: "mpxjs开发记录"
pubDate: "Sep 19 2024"
heroImage: "/blog-placeholder-3.jpg"
---
### mpx文件
mpx采用了SFC结构，把wxml/wxss/js都放在同一个文件中进行开发。
| \<template></template>标签中的内容对应wxml,\<style></style>标签中的内容对应wxss,\<script type="application/json" ></script>中的内容对应json, \<script lang="ts"></script>中的内容对应js。
```
// 以上文创建的项目中 src/pages/index.mpx文件为例
<template>
  <list></list>
</template>

<script lang="ts">
import { createPage } from '@mpxjs/core'

createPage({
  onLoad() {
    //
  }
})
</script>

<script type="application/json">
  {
    "usingComponents": {
      "list": "../components/list"
    }
  }
</script>
```
