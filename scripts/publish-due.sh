#!/usr/bin/env bash
# 流萤动态博客：定时发布兜底脚本（Linux）
# 作用：调用 /api/tasks/publish-due，把到期的定时文章转为已发布
# 建议 Cron：*/5 * * * * /srv/firefly/scripts/publish-due.sh >> /var/log/firefly-publish.log 2>&1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ENV_FILE:-${PROJECT_DIR}/.env}"

# 读取 .env 中的键值（去掉两侧引号，取最后一次出现）
read_env_value() {
  local key="$1"
  if [[ ! -f "${ENV_FILE}" ]]; then
    return 0
  fi
  grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

SITE_URL="${SITE_URL:-$(read_env_value SITE_URL)}"
CRON_SECRET="${CRON_SECRET:-$(read_env_value CRON_SECRET)}"

if [[ -z "${SITE_URL}" || -z "${CRON_SECRET}" ]]; then
  echo "错误：缺少 SITE_URL 或 CRON_SECRET，请检查 ${ENV_FILE}" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "错误：未找到 curl，请先安装" >&2
  exit 1
fi

curl -fsS --max-time 30 -H "x-cron-secret: ${CRON_SECRET}" "${SITE_URL}/api/tasks/publish-due"
echo
