import { z } from "zod";

// 可选图片地址：允许本站相对路径与合法外部 URL
function optionalImageUrl(message: string) {
  return z
    .string()
    .trim()
    .max(500, "图片地址过长")
    .refine(
      (value) => value.length === 0 || (value.startsWith("/") && !value.startsWith("//")) || z.url().safeParse(value).success,
      message,
    );
}

// 相册新增/编辑校验：照片随相册一次提交，避免前后台列表不一致
export const galleryAlbumUpsertSchema = z.object({
  title: z.string().trim().min(1, "请填写相册名称").max(200, "相册名称不能超过 200 字"),
  slug: z
    .string()
    .trim()
    .min(1, "请填写相册标识")
    .max(200, "相册标识不能超过 200 字")
    .regex(/^[a-z0-9][a-z0-9-]*$/, "相册标识只能使用小写字母、数字和连字符"),
  description: z.string().trim().max(500, "相册简介不能超过 500 字").default(""),
  coverUrl: optionalImageUrl("封面地址格式不正确").default(""),
  eventDate: z
    .string()
    .trim()
    .max(10)
    .refine((value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value), "相册日期格式应为 YYYY-MM-DD")
    .default(""),
  location: z.string().trim().max(200, "地点不能超过 200 字").default(""),
  tags: z.array(z.string().trim().min(1).max(50)).max(12, "标签数量过多").default([]),
  password: z.string().max(100, "密码不能超过 100 字").default(""),
  passwordHint: z.string().trim().max(255, "密码提示不能超过 255 字").default(""),
  clearPassword: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
  enabled: z.coerce.boolean().default(true),
  photos: z
    .array(
      z.object({
        imageUrl: optionalImageUrl("照片地址格式不正确").refine((value) => value.length > 0, "请填写照片地址"),
        caption: z.string().trim().max(300, "照片说明不能超过 300 字").default(""),
        sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
      }),
    )
    .max(100, "单个相册最多 100 张照片")
    .default([]),
});
