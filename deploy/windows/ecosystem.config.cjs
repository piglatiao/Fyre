// 流萤动态博客 PM2 配置示例（Windows Server）
// 使用步骤：
//   1. npm i -g pm2 pm2-windows-startup
//   2. pm2 start deploy/windows/ecosystem.config.cjs
//   3. pm2 save && pm2-startup install   （实现开机自启）
// 说明：cwd 自动解析为项目根目录，无需手改路径；应用配置从项目根目录 .env 读取。
const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "firefly-blog",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: path.resolve(__dirname, "../.."),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      out_file: "logs/pm2-out.log",
      error_file: "logs/pm2-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
