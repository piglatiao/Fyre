# 流萤动态博客 · Windows Server 部署文档

适用系统：Windows Server 2019 / 2022；示例站点目录为 `C:\firefly`，域名为 `blog.example.com`。
部署方式：不使用 Docker，使用 `pnpm build` + `next start`，由 PM2 守护进程，Nginx（Windows 版）或 IIS + ARR 反向代理。

## 一、环境要求

| 组件 | 版本要求 | 安装方式 |
| --- | --- | --- |
| Node.js | 24.x（≥ 20.9） | 官网 LTS 安装包，安装时勾选 Add to PATH |
| pnpm | 10.x | `corepack enable` 后执行 `corepack prepare pnpm@10.12.4 --activate` |
| MySQL | 8.0 及以上 | MySQL Installer，字符集 `utf8mb4` |
| PM2 | 最新版 | `npm i -g pm2 pm2-windows-startup` |
| Nginx / IIS | 最新版 | Nginx Windows 版，或 IIS + ARR + URL Rewrite |

## 二、创建数据库与账号

以管理员身份打开 MySQL 命令行：

```sql
CREATE DATABASE firefly_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'firefly'@'localhost' IDENTIFIED BY '换成强密码';
GRANT ALL PRIVILEGES ON firefly_blog.* TO 'firefly'@'localhost';
FLUSH PRIVILEGES;
```

## 三、获取代码与安装依赖

```powershell
New-Item -ItemType Directory -Force -Path C:\firefly | Out-Null
cd C:\firefly
git clone <你的仓库地址> .
pnpm install --frozen-lockfile
```

## 四、配置 .env

```powershell
Copy-Item .env.example .env
```

变量含义与 Linux 部署一致（见 `docs/deploy-linux.md` 第四节），Windows 示例：

```dotenv
DATABASE_URL="mysql://firefly:密码@127.0.0.1:3306/firefly_blog"
AUTH_SECRET="openssl rand -hex 32 生成的随机值"
AUTH_URL="https://blog.example.com"
SITE_URL="https://blog.example.com"
UPLOAD_DIR="C:/firefly/data/uploads"
CRON_SECRET="随机字符串"
```

> 文件必须保存为 UTF-8（PowerShell 中用 `Set-Content -Encoding utf8`），避免中文设置项乱码。
> 数据库密码请避免包含 `"` 与 `\`，以免备份脚本的临时配置文件解析异常。

## 五、初始化数据库

```powershell
cd C:\firefly
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

## 六、构建与启动（PM2）

```powershell
pnpm build
pm2 start deploy\windows\ecosystem.config.cjs
pm2 save
pm2-startup install        # 注册开机自启（计划任务形式）
pm2 status
```

PM2 日志默认写入 `C:\firefly\logs`，可执行 `pm2 logs firefly-blog` 查看。

## 七、反向代理

### 方式一：Nginx for Windows

```powershell
# 将配置并入 Nginx 安装目录 conf/nginx.conf 的 http {} 段，或放入 conf/conf.d 并 include
C:\nginx\nginx.exe -t
C:\nginx\nginx.exe -s reload
```

配置文件模板见 `deploy/windows/nginx-firefly.conf`。

### 方式二：IIS + ARR

1. 安装 IIS，并安装 Application Request Routing（ARR）与 URL Rewrite 模块；
2. 在 IIS 管理器中启用 ARR 的代理功能（Server Proxy Settings → Enable proxy）；
3. 新建站点，绑定域名，并在该站点下添加 URL Rewrite 反向代理规则，目标地址填 `http://127.0.0.1:3000/{R:0}`；
4. HTTPS 证书可通过 IIS 的「服务器证书 → 导入/申请」完成，并绑定 443 端口。

> 防火墙只需放行 80 / 443；3000 端口仅本机使用，不要对公网开放。

## 八、计划任务（定时发布与备份）

以管理员身份运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\windows\register-scheduled-tasks.ps1 `
  -MysqldumpPath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
```

脚本会注册两个计划任务（可重复执行，同名覆盖）：

- `FireflyPublishDue`：每 5 分钟调用 `scripts\publish-due.ps1`，兜底发布定时文章；
- `FireflyDbBackup`：每天 03:00 调用 `scripts\backup-db.ps1`，备份数据库并保留 14 天。

## 九、上线自检

```powershell
Invoke-WebRequest -Uri https://blog.example.com -Method Head
Invoke-RestMethod -Uri https://blog.example.com/api/tasks/publish-due -Headers @{ "x-cron-secret" = "你的 CRON_SECRET" }
Start-ScheduledTask -TaskName FireflyPublishDue, FireflyDbBackup
```

随后逐项核对 `docs/go-live-checklist.md`。

## 十、升级与回滚

见 `docs/operations.md`：升级 = 拉取代码 → `pnpm install` → `pnpm db:generate` → `pnpm db:deploy` → `pnpm build` → `pm2 restart firefly-blog`；回滚 = 切回上一个 tag/commit 后重复构建与重启流程。
