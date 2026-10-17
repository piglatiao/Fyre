# 流萤动态博客 · Linux 部署文档

适用系统：Ubuntu 22.04 / Debian 12 / CentOS Stream 9 等常见发行版；示例站点目录为 `/srv/firefly`，域名为 `blog.example.com`。
部署方式：不使用 Docker，直接使用 `pnpm build` + `next start`，由 systemd（或 PM2）守护进程，Nginx 反向代理并签发 HTTPS 证书。

## 一、环境要求

| 组件 | 版本要求 | 说明 |
| --- | --- | --- |
| Node.js | 24.x（≥ 20.9） | `node -v` 校验 |
| pnpm | 10.x | `corepack enable && corepack prepare pnpm@10.12.4 --activate` |
| MySQL | 8.0 及以上 | 字符集 `utf8mb4` |
| Nginx | 1.18 及以上 | 反向代理与 HTTPS |
| certbot | 最新版 | 申请 Let's Encrypt 证书 |

## 二、创建数据库与账号

```bash
mysql -uroot -p
```

```sql
CREATE DATABASE firefly_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'firefly'@'localhost' IDENTIFIED BY '换成强密码';
GRANT ALL PRIVILEGES ON firefly_blog.* TO 'firefly'@'localhost';
FLUSH PRIVILEGES;
```

> 生产环境不要直接使用 root 账号；账号密码只写入服务器上的 `.env`，不要提交到代码仓库。

## 三、获取代码与安装依赖

```bash
sudo mkdir -p /srv/firefly && sudo chown "$USER":"$USER" /srv/firefly
git clone <你的仓库地址> /srv/firefly
cd /srv/firefly
pnpm install --frozen-lockfile
```

## 四、配置 .env

```bash
cp .env.example .env
```

按下表填写（**保存为 UTF-8**）：

| 变量 | 生产环境取值示例 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | `mysql://firefly:密码@127.0.0.1:3306/firefly_blog` | 上一步创建的独立账号 |
| `AUTH_SECRET` | 随机 32 字节十六进制 | 用 `openssl rand -hex 32` 生成，**必须与开发环境不同** |
| `AUTH_URL` | `https://blog.example.com` | 对外访问地址 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / 强密码 | 仅在首次执行 seed 时使用 |
| `SITE_URL` | `https://blog.example.com` | 用于 RSS、sitemap 与绝对地址 |
| `UPLOAD_DIR` | `/srv/firefly/data/uploads` | 相对路径基于启动目录解析，生产建议写绝对路径 |
| `CRON_SECRET` | 随机字符串 | 定时发布接口密钥，`openssl rand -hex 16` |

```bash
chmod 600 /srv/firefly/.env
```

## 五、初始化数据库

```bash
cd /srv/firefly
pnpm db:generate       # 生成 Prisma 客户端到 src/generated/prisma（该目录不入库，必须先生成）
pnpm db:deploy         # 应用 prisma/migrations 下的全部迁移（生产统一用 migrate deploy）
pnpm db:seed           # 首次部署创建管理员与站点默认设置（幂等，可重复执行）
```

## 六、构建与启动

```bash
pnpm build             # 生成 .next 产物
```

### 方式一：systemd（推荐）

```bash
sudo mkdir -p /var/log/firefly && sudo chown -R www-data:www-data /var/log/firefly
sudo cp deploy/linux/firefly.service /etc/systemd/system/firefly.service
sudo vi /etc/systemd/system/firefly.service   # 修改 WorkingDirectory / User / ExecStart 路径
sudo systemctl daemon-reload
sudo systemctl enable --now firefly
sudo systemctl status firefly
```

上传目录需要允许服务账号写入：

```bash
sudo mkdir -p /srv/firefly/data/uploads
sudo chown -R www-data:www-data /srv/firefly/data /var/log/firefly
```

### 方式二：PM2

```bash
sudo npm i -g pm2
cd /srv/firefly
pm2 start "node_modules/next/dist/bin/next" --name firefly-blog -- start -p 3000
pm2 save
pm2 startup            # 按提示执行输出的命令，实现开机自启
```

## 七、Nginx 反向代理与 HTTPS

```bash
sudo cp deploy/linux/nginx-firefly.conf /etc/nginx/conf.d/firefly.conf
sudo vi /etc/nginx/conf.d/firefly.conf   # 修改 server_name
sudo nginx -t && sudo systemctl reload nginx
```

签发证书并自动改写为 443 监听：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d blog.example.com
sudo systemctl list-timers | grep certbot   # 确认自动续期定时器存在
```

## 八、定时任务

```bash
chmod +x /srv/firefly/scripts/*.sh
sudo crontab -e            # 或将 deploy/linux/crontab.example 内容追加到站点用户 crontab
```

`crontab.example` 包含三项：

1. `*/5 * * * *` 调用 `scripts/publish-due.sh`，把到期的定时文章转为已发布（兜底）；
2. `0 3 * * *` 调用 `scripts/backup-db.sh`，每日备份数据库并保留 14 天；
3. `0 4 * * 0` 打包 `data/uploads`，每周备份一次上传文件（可选）。

> 到点发布在读取入口也会惰性触发一次，Cron 只是兜底；服务器与站点时区不一致不影响发布判定（时间以 UTC 存储）。

## 九、上线自检

逐项执行 `docs/go-live-checklist.md` 中的清单，最低限度确认：

```bash
curl -I https://blog.example.com
curl -s https://blog.example.com/rss.xml | head -n 5
curl -s https://blog.example.com/robots.txt
curl -s -H "x-cron-secret: $CRON_SECRET" https://blog.example.com/api/tasks/publish-due
```

## 十、升级与回滚

见 `docs/operations.md`：升级 = 拉取代码 → `pnpm install` → `pnpm db:generate` → `pnpm db:deploy` → `pnpm build` → 重启服务；回滚 = 切回上一个 tag/commit 后重复构建与重启流程。
