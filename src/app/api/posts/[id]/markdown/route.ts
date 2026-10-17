import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { buildFrontMatter } from "@/lib/markdown-front-matter";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";

// 文章导出为 Markdown：带头部信息，浏览器直接下载
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const postId = Number.parseInt(id, 10);
  if (!Number.isInteger(postId) || postId <= 0) {
    return errorResponse("invalid_params", "文章编号不正确", 400);
  }
  const { adminPostService, adminTagService } = createSiteServices();
  const post = await adminPostService.getById(postId);
  if (!post) {
    return errorResponse("post_not_found", "文章不存在或已被删除", 404);
  }
  const tags = await adminTagService.list();
  const tagNames = post.tagIds
    .map((tagId) => tags.find((tag) => tag.id === tagId)?.name)
    .filter((name): name is string => Boolean(name));

  const dated = post.publishedAt ?? post.scheduledAt;
  const header = buildFrontMatter({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    date: dated ? dated.toISOString() : "",
    status: post.status,
    tags: tagNames.length > 0 ? `[${tagNames.join(", ")}]` : "",
    series: post.series ?? "",
  });
  const body = `${header}${post.content}\n`;
  const encodedName = encodeURIComponent(`${post.slug}.md`);

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${post.slug}.md"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "no-store",
    },
  });
}
