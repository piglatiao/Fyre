import { z } from "zod";
import { nullableText } from "@/lib/zod-fields";

// 动态配图入参：最多 9 张，src 必填（复用媒体库地址）
const dynamicImageSchema = z.object({
  alt: z.string().trim().max(120, "图片替代文本过长").default(""),
  src: z.string().trim().min(1, "图片地址不能为空").max(500, "图片地址过长"),
});

// 动态新增/编辑入参校验
export const dynamicUpsertSchema = z.object({
  content: z.string().trim().min(1, "请输入动态内容").max(5000, "动态内容不能超过 5000 字"),
  images: z.array(dynamicImageSchema).max(9, "最多选择 9 张图片").default([]),
  location: z.string().trim().max(64, "位置不能超过 64 字").default(""),
  pinned: z.boolean().default(false),
  publishedAt: nullableText(40, "发布时间格式不正确"),
});

// 动态列表查询参数校验（前台公开列表与后台列表共用）
export const dynamicListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  year: z.coerce.number().int().min(2000).max(2999).optional(),
  keyword: z.string().trim().max(100, "关键词过长").optional(),
});