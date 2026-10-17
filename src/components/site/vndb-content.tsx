import type { SiteSettings } from "@/types/site-settings";
import { createSiteServices } from "@/server/services/service-container";
import MediaShelfContent from "./media-shelf-content";

// VNDB 内容服务端组件：支持公开列表与配置 Token 后的私密列表
export default async function VndbContent({ settings }: { settings: SiteSettings }) {
  const { vndbService } = createSiteServices();
  const collection = await vndbService.getCollection(
    settings.vndbUserId,
    settings.vndbApiToken,
    settings.vndbApiUrl,
    settings.vndbVnBaseUrl,
    settings.vndbCacheMinutes,
    settings.vndbNsfwMode,
  );

  return (
    <MediaShelfContent
      source="vndb"
      title={settings.vndbPageTitle}
      description={settings.vndbPageDescription}
      result={collection}
      pageSize={settings.vndbItemsPerPage}
      itemLabel="部"
      searchPlaceholder="搜索视觉小说、开发商、标签或游玩笔记…"
      emptyTitle="暂无视觉小说收藏"
      emptyDescription="在 VNDB 添加游玩记录后，这里会自动同步。"
      showAllTab
      showStatusFilters={false}
      nsfwMode={settings.vndbNsfwMode}
      scoreLabel="VNDB"
    />
  );
}
