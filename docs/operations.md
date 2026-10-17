# 流萤动态博客 · 运维手册

覆盖日常运维所需的定时任务、备份恢复、升级回滚、日志排障与管理员账号维护，Linux 与 Windows Server 通用（命令分别标注）。

## 一、运行期目录

| 路径 | 作用 | 是否需备份 |
| --- | --- | --- |
| `.env` | 数据库、密钥、站点地址等配置 | 建议单独保管（含密钥，不要入库） |
| `data/uploads` | 上传的图片与文件（按 年/月 分目录） | 需要 |
| `backups` | 备份脚本输出目录（默认保留 14 天） | 可同步到异地 |
| `logs`（Windows，PM2 输出） | 运行日志 | 否 |

## 二、定时任务

### 1. 定时发布兜底任务

文章状态为「定时发布」时，读取入口会惰性把到期文章转为已发布；服务器定时任务用于兜底，保证无人访问时也能按时生效。

```bash
# Linux
/srv/firefly/scripts/publish-due.sh
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File C:\firefly\scripts\publish-due.ps1
```

两个脚本都会读取 `.env` 中的 `SITE_URL` 与 `CRON_SECRET`，并请求 `GET /api/tasks/publish-due`，成功返回示例：`{"ok":true,"data":{"published":2}}`。

手动验证（不依赖脚本）：

```bash
curl -s -H "x-cron-secret: $CRON_SECRET" https://blog.example.com/api/tasks/publish-due
```

### 2. 计划任务注册

- Linux：把 `deploy/linux/crontab.example` 的内容追加到 `crontab -e`，并执行 `chmod +x scripts/*.sh`；
- Windows：以管理员身份运行 `deploy/windows/register-scheduled-tasks.ps1`。

## 三、备份

### 1. 数据库备份

```bash
# Linux：输出 backups/firefly_blog-YYYYmmdd-HHmmss.sql.gz
/srv/firefly/scripts/backup-db.sh
```

```powershell
# Windows：输出 backups\firefly_blog-YYYYmmdd-HHmmss.sql.zip
powershell -ExecutionPolicy Bypass -File C:\firefly\scripts\backup-db.ps1 `
  -MysqldumpPath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
```

常用参数：`BACKUP_DIR` / `-BackupDir` 指定输出目录，`KEEP_DAYS` / `-KeepDays` 指定保留天数（默认 14 天），`-SkipCompress`（仅 Windows）保留原始 `.sql`。

### 2. 上传文件备份

```bash
# Linux：每周打包一次上传目录
tar -czf /var/backups/firefly/uploads-$(date +%Y%m%d).tar.gz -C /srv/firefly data/uploads
```

```powershell
# Windows：压缩上传目录
Compress-Archive -Path C:\firefly\data\uploads\* -DestinationPath "C:\backups\uploads-$(Get-Date -Format yyyyMMdd).zip" -Force
```

### 3. 备份策略建议

1. 数据库每日备份、上传目录每周备份，至少保留 14 天；
2. 每周把 `backups` 与上传目录包同步到异地（对象存储或另一台机器）；
3. 每次升级前先手动执行一次备份（见第四节升级流程）。

## 四、恢复

### 1. 恢复数据库（Linux）

```bash
gunzip -c /srv/firefly/backups/firefly_blog-20261016-030000.sql.gz | \
  mysql --default-character-set=utf8mb4 -ufirefly -p firefly_blog
```

### 2. 恢复数据库（Windows）

```powershell
Expand-Archive -LiteralPath "C:\firefly\backups\firefly_blog-20261016-030000.sql.zip" -DestinationPath "C:\firefly\backups\tmp" -Force
mysql.exe --default-character-set=utf8mb4 -ufirefly -p firefly_blog < "C:\firefly\backups\tmp\firefly_blog-20261016-030000.sql"
```

### 3. 恢复上传文件

```bash
mkdir -p /srv/firefly/data && tar -xzf uploads-20261016.tar.gz -C /srv/firefly
sudo chown -R www-data:www-data /srv/firefly/data
```

### 4. 恢复演练建议

1. 在本机或测试库执行一次恢复，确认备份可用；
2. 恢复后启动服务，检查首页、文章详情、后台登录与图片是否正常；
3. 每季度重复一次演练。

## 五、升级与回滚

### 升级流程

```bash
cd /srv/firefly
./scripts/backup-db.sh            # 1. 先备份
git fetch --all && git checkout <新的 tag 或 commit>
pnpm install --frozen-lockfile    # 2. 安装依赖
pnpm db:generate                  # 3. 生成 Prisma 客户端
pnpm db:deploy                    # 4. 应用数据库迁移
pnpm build                        # 5. 构建
sudo systemctl restart firefly    # 6. 重启（Windows：pm2 restart firefly-blog）
```

> 迁移脚本只做增量变更；升级完成后打开后台与前台各抽查一次，确认无异常。

### 回滚流程

1. `git checkout` 切回上一个稳定 tag/commit；
2. 重新执行 `pnpm install`、`pnpm db:generate`、`pnpm build`、重启服务；
3. 若本次升级包含数据库结构变更且影响到旧代码，则需要先恢复备份的数据库（第四节）。

## 六、日志与排障

| 平台 | 查看方式 |
| --- | --- |
| Linux（systemd） | `journalctl -u firefly -n 200 -f` 或 `tail -f /var/log/firefly/app.log` |
| Linux（PM2） | `pm2 logs firefly-blog` |
| Windows（PM2） | `pm2 logs firefly-blog`，或查看 `C:\firefly\logs\pm2-*.log` |
| Nginx | `tail -f /var/log/nginx/error.log`（Windows 为 `C:\nginx\logs\error.log`） |

常见问题：

1. **后台能登录但上传失败**：检查 `UPLOAD_DIR` 目录是否存在且服务账号可写（Linux 需 `chown www-data`）；
2. **页面报数据库连接失败**：确认 `DATABASE_URL` 账号密码正确、MySQL 服务已启动、账号允许从 `localhost` 连接；
3. **定时文章没有按时出现**：先在浏览器访问任意前台页面触发惰性发布，再手动执行定时任务脚本确认返回 `published` 数量；
4. **反向代理后登录跳转异常**：确认 `AUTH_URL` 与 `SITE_URL` 都填了对外域名（含 https）；
5. **时间显示与服务器时区不一致**：数据库统一存 UTC，前台按 Asia/Shanghai 展示，属正常行为。

## 七、管理员账号维护

### 修改密码 / 昵称

登录后台 → 站点设置 → 账号信息 / 修改密码。修改密码后旧会话立即失效，需重新登录。

### 忘记密码（重置）

```bash
# 1. 在项目目录生成 bcrypt 哈希
cd /srv/firefly
node -e "const {hash}=require('bcryptjs');hash('新密码',10).then(h=>console.log(h))"

# 2. 用生成的哈希更新数据库
mysql -ufirefly -p firefly_blog -e "UPDATE users SET passwordHash='粘贴上面的哈希' WHERE username='admin';"
```

Windows 上第 1 步相同，第 2 步改用 `mysql.exe -ufirefly -p firefly_blog -e "..."`。

> `prisma/seed.ts` 是幂等的：管理员已存在时不会覆盖密码，因此重置密码需要按上面的方式手动执行。

## 八、评论功能（预留）

一期只在文章底部保留评论区容器与后台「评论服务 / 评论配置」两项设置，未接入任何第三方服务。后续接入时，仅需在前台渲染该容器并读取这两项设置，无需改动数据库结构。
