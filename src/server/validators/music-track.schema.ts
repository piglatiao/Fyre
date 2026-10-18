import { z } from "zod";

// 音乐曲目新增/编辑入参校验
export const musicTrackUpsertSchema = z.object({
  title: z.string().trim().min(1, "请填写曲名").max(200, "曲名不能超过 200 字"),
  artist: z.string().trim().max(200, "歌手不能超过 200 字").default(""),
  audioUrl: z.string().trim().min(1, "请选择或填写音频地址").max(500, "音频地址不能超过 500 字符"),
  coverUrl: z.string().trim().max(500, "封面地址不能超过 500 字符").default(""),
  lyrics: z.string().max(100000, "歌词内容过长").default(""),
  sortOrder: z.number().int().min(0, "排序不能为负数").max(9999, "排序最大 9999").default(0),
});
