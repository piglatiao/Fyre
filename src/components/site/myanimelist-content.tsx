import type { SiteSettings } from "@/types/site-settings";
import { createSiteServices } from "@/server/services/service-container";
import MediaShelfContent from "./media-shelf-content";

// MyAnimeList 内容服务端组件：合并动画与漫画列表并提供分类筛选
export default async function MyAnimeListContent({ settings }: { settings: SiteSettings }) {
  const { malService } = createSiteServices();
  const collection = await malService.getCollection(
    settings.malUsername,
    settings.malClientId,
    settings.malApiUrl,
    settings.malAnimeBaseUrl,
    settings.malMangaBaseUrl,
    settings.malCacheMinutes,
    settings.malNsfwMode,
  );

  return (
    <MediaShelfContent
      source="mal"
      title={settings.malPageTitle}
      description={settings.malPageDescription}
      result={collection}
      pageSize={settings.malItemsPerPage}
      itemLabel="部"
      searchPlaceholder="搜索动画、漫画、类型或观看笔记…"
      emptyTitle="暂无动画或漫画收藏"
      emptyDescription="在 MyAnimeList 添加公开收藏后，这里会自动同步。"
      nsfwMode={settings.malNsfwMode}
      scoreLabel="MAL"
    />
  );
}
