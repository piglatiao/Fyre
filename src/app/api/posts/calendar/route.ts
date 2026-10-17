import { okResponse } from "@/lib/api-response";
import { formatDateKey } from "@/lib/format-date";
import { createSiteServices } from "@/server/services/service-container";

// 侧栏日历接口：返回全部已发布文章的日期与标题（日期按 Asia/Shanghai 归一为 YYYY-MM-DD）
export async function GET(): Promise<Response> {
  const { postService } = createSiteServices();
  const groups = await postService.listArchiveGroups();
  const data = groups.flatMap((group) =>
    group.entries.map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      date: formatDateKey(entry.publishedAt),
    })),
  );
  return okResponse(data);
}
