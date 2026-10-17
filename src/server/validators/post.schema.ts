import { z } from "zod";
import { nullablePositiveInt, nullableText } from "@/lib/zod-fields";

// 文章新增/编辑入参校验
export const postUpsertSchema = z.object({
  title: z.string().trim().min(1, "请填写文章标题").max(200, "标题不能超过 200 字"),
  slug: z.string().trim().max(200, "slug 不能超过 200 字符").default(""),
  content: z.string().min(1, "请填写正文内容"),
  excerpt: nullableText(500, "摘要不能超过 500 字"),
  coverUrl: nullableText(500, "封面地址过长"),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "PRIVATE"]),
  pinned: z.boolean().default(false),
  seoTitle: nullableText(200, "SEO 标题过长"),
  seoDescription: nullableText(300, "SEO 描述过长"),
  seoKeywords: nullableText(300, "SEO 关键词过长"),
  publishedAt: nullableText(40, "发布时间格式不正确"),
  scheduledAt: nullableText(40, "定时时间格式不正确"),
  categoryId: nullablePositiveInt("分类不正确"),
  tagIds: z.array(z.number().int().positive()).max(20, "标签数量过多").default([]),
  series: nullableText(60, "所属系列不能超过 60 字"),
  // 密码保护：password 留空表示不修改已有密码（新建时必须填写）
  encrypted: z.boolean().default(false),
  password: z.string().max(100, "密码不能超过 100 字").nullable().default(null),
});

// 后台文章列表查询参数校验
export const postListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "PRIVATE"]).optional(),
  keyword: z.string().trim().max(100, "关键词过长").optional(),
});

// 批量删除入参校验
export const postBulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, "请选择要删除的文章").max(100),
});
