---
title: "批量格式化scss文件"
description: "减少机械化的工作内容"
pubDate: 'Jul 19 2024'
heroImage: "/blog-placeholder-4.jpg"
---

要实现一个Node脚本，用于批量格式化SCSS文件，并根据一定规则对类的内容进行排序，可以使用以下步骤：


1. 读取文件：读取SCSS文件内容。
2. 解析内容：使用解析器将SCSS内容解析成抽象语法树（AST）。
3. 排序内容：根据特定规则对AST中的类进行排序。
4. 生成文件：将排序后的AST重新生成SCSS文件内容。
5. 写入文件：将格式化后的内容写回文件。
   
> 我们可以使用 node-sass 和 postcss 等库来辅助实现这个功能。示例脚本见文末。

#### 使用步骤：

1. 安装依赖：
```
npm install postcss postcss-scss sort-css-media-queries
```
2. 修改脚本中的路径：
> 将 directoryPath 修改为你存储 SCSS 文件的目录路径。

3. 运行脚本：
```
node script.js
```
> 这个脚本会递归遍历指定目录下的所有 SCSS 文件，读取文件内容，使用 PostCSS 解析器解析为 AST，对类进行排序，然后重新生成并写回文件。你可以根据实际需求修改 sortRules 函数中的排序逻辑。

#### 示例脚本：
```
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');

// 读取文件内容
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// 写入文件内容
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// 定义属性顺序
const propertyOrder = [
  // 定位
  'position', 'top', 'right', 'bottom', 'left', 'z-index',
  // 盒模型
  'display', 'flex', 'flex-direction', 'justify-content', 'align-items', 'align-content',
  'width', 'height', 'margin', 'padding', 'border', 'border-radius', 'box-sizing',
  // 背景
  'background', 'background-color', 'background-image', 'background-position', 'background-size', 'background-repeat',
  // 字体和文本样式
  'font', 'font-size', 'font-weight', 'line-height', 'text-align', 'text-decoration', 'color',
  // 其他视觉样式
  'opacity', 'visibility', 'overflow', 'transform', 'transition'
];

// 排序规则函数
function sortRules(rules) {
  return rules.sort((a, b) => {
    const aIndex = propertyOrder.indexOf(a.prop);
    const bIndex = propertyOrder.indexOf(b.prop);

    if (aIndex === -1 && bIndex === -1) {
      return a.prop.localeCompare(b.prop);
    }
    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }
    return aIndex - bIndex;
  });
}

// 格式化SCSS内容
function formatScss(content) {
  const root = postcss.parse(content, { syntax: postcssScss });
  
  root.walkRules(rule => {
    const declarations = rule.nodes.filter(node => node.type === 'decl');
    const otherNodes = rule.nodes.filter(node => node.type !== 'decl');
    const sortedDeclarations = sortRules(declarations);

    rule.removeAll();
    rule.append(sortedDeclarations);
    rule.append(otherNodes);
  });

  return root.toString();
}

// 处理单个文件
function processFile(filePath) {
  const content = readFile(filePath);
  const formattedContent = formatScss(content);

  // 生成新的文件路径
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const newFilePath = path.join(dir, `${baseName}-formatted${ext}`);
  
  writeFile(newFilePath, formattedContent);
}

// 批量处理目录下的所有SCSS文件
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (path.extname(file) === '.scss') {
      processFile(filePath);
    }
  });
}

// 执行脚本
const directoryPath = 'path/to/your/scss/files';
processDirectory(directoryPath);

console.log('SCSS files have been formatted.');
```
