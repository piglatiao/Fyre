// 项目状态：与官网四个标准 key 对齐，未知值使用中性样式原样展示
export interface ProjectStatusMeta {
  key: string;
  label: string;
  className: string;
  coverClassName: string;
}

const statusMeta: Record<string, Omit<ProjectStatusMeta, "key">> = {
  planning: {
    label: "计划中",
    className: "bg-neutral-200/80 text-neutral-600 dark:bg-neutral-700/60 dark:text-neutral-300",
    coverClassName: "bg-neutral-500/85 text-white dark:bg-neutral-600/85",
  },
  developing: {
    label: "开发中",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    coverClassName: "bg-amber-500/90 text-white dark:bg-amber-600/90",
  },
  published: {
    label: "已发布",
    className: "bg-green-500/15 text-green-600 dark:text-green-400",
    coverClassName: "bg-green-600/90 text-white dark:bg-green-700/90",
  },
  archived: {
    label: "已归档",
    className: "bg-neutral-200/80 text-neutral-600 dark:bg-neutral-700/60 dark:text-neutral-300",
    coverClassName: "bg-neutral-500/85 text-white dark:bg-neutral-600/85",
  },
};

export const PROJECT_STATUS_KEYS = Object.keys(statusMeta);

// 解析项目状态：标准 key 返回中文文案与配色，自定义值保持原文
export function getProjectStatusMeta(status: string): ProjectStatusMeta {
  const key = status.trim();
  const meta = statusMeta[key];
  if (meta) {
    return { key, ...meta };
  }
  return {
    key,
    label: key,
    className: "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300",
    coverClassName: "bg-neutral-500/85 text-white dark:bg-neutral-600/85",
  };
}
