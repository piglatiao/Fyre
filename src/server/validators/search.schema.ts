import { z } from "zod";

// 搜索入参校验：关键词必填并限制长度
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "搜索关键词不能为空").max(100, "搜索关键词过长"),
});
