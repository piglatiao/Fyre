import type { SiteSettings } from "@/types/site-settings";
import { createSiteServices } from "@/server/services/service-container";
import MediaShelfContent from "./media-shelf-content";

// Bangumi 内容服务端组件：读取全部收藏分类并交给通用媒体浏览器呈现
export default async function BangumiContent({ settings }: { settings: SiteSettings }) {
  const { bangumiService } = createSiteServices();
  const collection = await bangumiService.getCollection(
    settings.bangumiUsername,
    settings.bangumiApiUrl,
    settings.bangumiSubjectBaseUrl,
    settings.bangumiCacheMinutes,
    settings.bangumiNsfwMode,
  );

  return (
    <MediaShelfContent
      source="bangumi"
      title={settings.bangumiPageTitle}
      description={settings.bangumiPageDescription}
      result={collection}
      pageSize={settings.bangumiItemsPerPage}
      itemLabel="部"
      searchPlaceholder="搜索动画、书籍、音乐、游戏或标签…"
      emptyTitle="暂无番组收藏"
      emptyDescription="在 Bangumi 添加收藏后，这里会自动同步。"
      nsfwMode={settings.bangumiNsfwMode}
      scoreLabel="Bangumi"
    />
  );
}
