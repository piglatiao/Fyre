import { z } from "zod";

// 评论目标类型：与 Prisma 枚举保持一致
const commentTargetTypeSchema = z.enum([
  "POST",
  "GALLERY_ALBUM",
  "PROJECT",
  "PAGE",
  "DYNAMIC",
  "GUESTBOOK",
  "SPONSOR",
  "FRIENDS",
]);

// 评论审核状态：与 Prisma 枚举保持一致
export const commentStatusSchema = z.enum(["PENDING", "APPROVED", "HIDDEN"]);

// 仅独立页面允许不带目标编号
const singletonTargetTypes = new Set(["GUESTBOOK", "SPONSOR", "FRIENDS"]);

// 校验访客网址只允许 HTTP(S)，避免前台生成危险协议链接
function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// 评论提交入参校验
export const commentSubmissionSchema = z
  .object({
    targetType: commentTargetTypeSchema,
    targetId: z.number().int().positive().nullable().default(null),
    authorName: z.string().trim().min(1, "请填写昵称").max(50, "昵称不能超过 50 字"),
    authorEmail: z
      .string()
      .trim()
      .max(100, "邮箱不能超过 100 字")
      .default("")
      .refine((value) => value.length === 0 || z.email().safeParse(value).success, "邮箱格式不正确"),
    authorWebsite: z
      .string()
      .trim()
      .max(500, "网站地址不能超过 500 字")
      .default("")
      .refine((value) => value.length === 0 || isHttpUrl(value), "网站地址必须是完整的 HTTP(S) 链接"),
    content: z.string().trim().min(1, "请填写评论内容").max(2000, "评论不能超过 2000 字"),
  })
  .superRefine((input, context) => {
    const singleton = singletonTargetTypes.has(input.targetType);
    if (singleton && input.targetId !== null) {
      context.addIssue({ code: "custom", message: "该页面不接受内容编号", path: ["targetId"] });
    }
    if (!singleton && input.targetId === null) {
      context.addIssue({ code: "custom", message: "缺少评论目标编号", path: ["targetId"] });
    }
  });

// 公开评论列表查询校验
export const commentListQuerySchema = z
  .object({
    targetType: commentTargetTypeSchema,
    targetId: z.coerce.number().int().positive().nullable().default(null),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  })
  .superRefine((input, context) => {
    const singleton = singletonTargetTypes.has(input.targetType);
    if (singleton && input.targetId !== null) {
      context.addIssue({ code: "custom", message: "该页面不接受内容编号", path: ["targetId"] });
    }
    if (!singleton && input.targetId === null) {
      context.addIssue({ code: "custom", message: "缺少评论目标编号", path: ["targetId"] });
    }
  });

// 后台修改评论状态入参
export const commentStatusUpdateSchema = z.object({
  status: commentStatusSchema,
});
