// createBlogPost.mjs

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建 readline 接口来读取用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问文件名和内容
rl.question('请输入博客文章的文件名（不包含扩展名）：', (fileName) => {
  rl.question('title:', (title) => {
    rl.question('description:', (description) => {
      // 定义文件路径
      const dirPath = path.join(__dirname, 'src', 'description', 'blog');
      const filePath = path.join(dirPath, `${fileName}.md`);

      // 定义 Markdown 文件的内容
      const fileContent = `---
title: "${title}"
description: "${description}"
pubDate: "${new Date().toISOString()}"
---
`;

      // 确保目录存在，如果不存在则创建
      fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) {
          console.error('创建目录时出错:', err);
          rl.close();
          return;
        }

        // 写入文件
        fs.writeFile(filePath, fileContent, (err) => {
          if (err) {
            console.error('写入文件时出错:', err);
          } else {
            console.log(`文件已成功创建: ${filePath}`);
          }
          // 关闭 readline 接口
          rl.close();
        });
      });
    });
  });
});
