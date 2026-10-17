#!/usr/bin/env bash
# 流萤动态博客：MySQL 数据库备份脚本（Linux）
# 用法：./scripts/backup-db.sh
# 可覆盖的环境变量：
#   ENV_FILE    .env 路径，默认项目根目录下的 .env
#   BACKUP_DIR  备份输出目录，默认项目根目录下的 backups
#   KEEP_DAYS   备份保留天数，默认 14 天
#   MYSQLDUMP_BIN  mysqldump 可执行文件路径，默认取 PATH 中的 mysqldump
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ENV_FILE:-${PROJECT_DIR}/.env}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

# 读取 .env 中的键值（去掉两侧引号，取最后一次出现）
read_env_value() {
  local key="$1"
  if [[ ! -f "${ENV_FILE}" ]]; then
    return 0
  fi
  grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

DATABASE_URL="${DATABASE_URL:-$(read_env_value DATABASE_URL)}"
if [[ -z "${DATABASE_URL}" ]]; then
  echo "错误：未找到 DATABASE_URL，请检查 ${ENV_FILE}" >&2
  exit 1
fi

# 解析 mysql://user:password@host:port/database
if [[ ! "${DATABASE_URL}" =~ ^mysql://([^:@/]+):([^@]*)@([^:/]+):([0-9]+)/([^?]+) ]]; then
  echo "错误：无法解析 DATABASE_URL：${DATABASE_URL}" >&2
  exit 1
fi
DB_USER="${BASH_REMATCH[1]}"
DB_PASSWORD="${BASH_REMATCH[2]}"
DB_HOST="${BASH_REMATCH[3]}"
DB_PORT="${BASH_REMATCH[4]}"
DB_NAME="${BASH_REMATCH[5]}"

MYSQLDUMP_BIN="${MYSQLDUMP_BIN:-mysqldump}"
if ! command -v "${MYSQLDUMP_BIN}" >/dev/null 2>&1; then
  echo "错误：未找到 mysqldump，请先安装 MySQL 客户端或设置 MYSQLDUMP_BIN" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.sql.gz"

# 通过临时配置文件传递账号密码，避免密码出现在进程列表与命令历史
DEFAULTS_FILE="$(mktemp)"
chmod 600 "${DEFAULTS_FILE}"
trap 'rm -f "${DEFAULTS_FILE}"' EXIT
cat > "${DEFAULTS_FILE}" <<EOF
[client]
host=${DB_HOST}
port=${DB_PORT}
user=${DB_USER}
password=${DB_PASSWORD}
EOF

# 单事务导出保证一致性；导出存储过程、触发器，字符集固定 utf8mb4
"${MYSQLDUMP_BIN}" --defaults-extra-file="${DEFAULTS_FILE}" \
  --single-transaction --routines --triggers --default-character-set=utf8mb4 \
  "${DB_NAME}" | gzip > "${TARGET}"

echo "备份完成：${TARGET}"

# 清理超过保留期限的历史备份（仅匹配当前库的备份文件，不影响其他文件）
find "${BACKUP_DIR}" -maxdepth 1 -type f -name "${DB_NAME}-*.sql.gz" -mtime "+${KEEP_DAYS}" -print -delete
echo "已清理 ${KEEP_DAYS} 天前的历史备份"
