import { z } from "zod";

// 媒体列表查询参数校验
export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
  type: z.enum(["IMAGE", "FILE"]).optional(),
});
