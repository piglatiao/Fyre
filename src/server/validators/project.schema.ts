import { z } from "zod";

// 可选资源地址：允许本站相对路径与合法外部 URL
function optionalResourceUrl(message: string) {
  return z
    .string()
    .trim()
    .max(500, "地址过长")
    .refine(
      (value) => value.length === 0 || (value.startsWith("/") && !value.startsWith("//")) || z.url().safeParse(value).success,
      message,
    );
}

// 外链必须以 http(s)、mailto 或站内相对路径开头，避免脚本地址进入 href
function requiredLinkUrl() {
  return z
    .string()
    .trim()
    .min(1, "请填写外链地址")
    .max(500, "外链地址过长")
    .refine(
      (value) =>
        (value.startsWith("/") && !value.startsWith("//")) ||
        /^https?:\/\//i.test(value) ||
        /^mailto:/i.test(value),
      "外链地址格式不正确",
    );
}

// 项目新增/编辑校验
export const projectUpsertSchema = z.object({
  title: z.string().trim().min(1, "请填写项目名称").max(200, "项目名称不能超过 200 字"),
  slug: z
    .string()
    .trim()
    .min(1, "请填写项目标识")
    .max(200, "项目标识不能超过 200 字")
    .regex(/^[a-z0-9][a-z0-9-]*$/, "项目标识只能使用小写字母、数字和连字符"),
  description: z.string().trim().max(500, "项目简介不能超过 500 字").default(""),
  content: z.string().min(1, "请填写项目正文"),
  coverUrl: optionalResourceUrl("封面地址格式不正确").default(""),
  status: z.string().trim().max(30, "状态不能超过 30 字").default(""),
  tags: z.array(z.string().trim().min(1).max(50)).max(20, "标签数量过多").default([]),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1, "请填写外链名称").max(100),
        icon: z.string().trim().max(500, "外链图标地址过长").default(""),
        value: requiredLinkUrl(),
      }),
    )
    .max(10, "外链数量过多")
    .default([]),
  publishedAt: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "发布日期格式应为 YYYY-MM-DD"),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
  enabled: z.coerce.boolean().default(true),
});
