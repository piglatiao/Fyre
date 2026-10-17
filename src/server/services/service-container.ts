import { resolveUploadRoot } from "@/lib/upload-path";
import { PrismaAdminCategoryRepository } from "@/server/repositories/admin-category.repository";
import { PrismaAdminDynamicRepository } from "@/server/repositories/admin-dynamic.repository";
import { PrismaAdminDashboardRepository } from "@/server/repositories/admin-dashboard.repository";
import { PrismaAdminMediaRepository } from "@/server/repositories/admin-media.repository";
import { PrismaAdminPageRepository } from "@/server/repositories/admin-page.repository";
import { PrismaAdminPostRepository } from "@/server/repositories/admin-post.repository";
import { PrismaAdminSettingRepository } from "@/server/repositories/admin-setting.repository";
import { PrismaAdminSystemRepository } from "@/server/repositories/admin-system.repository";
import { PrismaAdminTagRepository } from "@/server/repositories/admin-tag.repository";
import { PrismaAdminUserRepository } from "@/server/repositories/admin-user.repository";
import { PrismaCategoryRepository } from "@/server/repositories/category.repository";
import { PrismaDynamicRepository } from "@/server/repositories/dynamic.repository";
import { PrismaFriendLinkRepository } from "@/server/repositories/friend-link.repository";
import { PrismaAdminFriendLinkRepository } from "@/server/repositories/admin-friend-link.repository";
import { PrismaBookmarkRepository } from "@/server/repositories/bookmark.repository";
import { PrismaAdminBookmarkRepository } from "@/server/repositories/admin-bookmark.repository";
import { PrismaSponsorRepository } from "@/server/repositories/sponsor.repository";
import { PrismaAdminSponsorRepository } from "@/server/repositories/admin-sponsor.repository";
import { PrismaProjectRepository } from "@/server/repositories/project.repository";
import { PrismaAdminProjectRepository } from "@/server/repositories/admin-project.repository";
import { PrismaGalleryRepository } from "@/server/repositories/gallery.repository";
import { PrismaAdminGalleryRepository } from "@/server/repositories/admin-gallery.repository";
import { PrismaMusicTrackRepository } from "@/server/repositories/music-track.repository";
import { PrismaPageRepository } from "@/server/repositories/page.repository";
import { PrismaPostRepository } from "@/server/repositories/post.repository";
import { PrismaSettingRepository } from "@/server/repositories/setting.repository";
import { PrismaTagRepository } from "@/server/repositories/tag.repository";
import { LocalMediaStorage } from "@/server/storage/local-media-storage";
import { HttpRemoteMediaFetcher } from "@/server/storage/remote-media-fetcher";
import { DefaultAdminAccountService } from "./admin-account.service";
import { DefaultAdminCategoryService } from "./admin-category.service";
import { DefaultAdminDashboardService } from "./admin-dashboard.service";
import { DefaultAdminDynamicService } from "./admin-dynamic.service";
import { DefaultAdminPageService } from "./admin-page.service";
import { DefaultAdminPostService } from "./admin-post.service";
import { DefaultAdminSettingService } from "./admin-setting.service";
import { DefaultAdminTagService } from "./admin-tag.service";
import { DefaultCategoryService } from "./category.service";
import { DefaultDynamicService } from "./dynamic.service";
import { DefaultFriendService } from "./friend.service";
import { DefaultAdminFriendService } from "./admin-friend.service";
import { DefaultBookmarkService } from "./bookmark.service";
import { DefaultAdminBookmarkService } from "./admin-bookmark.service";
import { DefaultSponsorService } from "./sponsor.service";
import { DefaultAdminSponsorService } from "./admin-sponsor.service";
import { DefaultProjectService } from "./project.service";
import { DefaultAdminProjectService } from "./admin-project.service";
import { DefaultGalleryService } from "./gallery.service";
import { DefaultAdminGalleryService } from "./admin-gallery.service";
import { DefaultMarkdownImportService } from "./markdown-import.service";
import { DefaultMediaService } from "./media.service";
import { DefaultMusicService } from "./music.service";
import { DefaultPageService } from "./page.service";
import { DefaultPostService } from "./post.service";
import { DefaultSettingService } from "./setting.service";
import type { SiteServices } from "./site-services.interface";
import { DefaultTagService } from "./tag.service";
import { DefaultBilibiliService } from "./bilibili.service";
import { DefaultBangumiService } from "./bangumi.service";
import { DefaultVndbService } from "./vndb.service";
import { DefaultMalService } from "./mal.service";

// 组合根：把仓储与存储实现注入服务实现，页面与 API 统一从这里取服务
export function createSiteServices(): SiteServices {
  const posts = new PrismaPostRepository();
  const categories = new PrismaCategoryRepository();
  const tags = new PrismaTagRepository();
  const pages = new PrismaPageRepository();
  const settings = new PrismaSettingRepository();
  const dynamics = new PrismaDynamicRepository();
  const musicTracks = new PrismaMusicTrackRepository();
  const friends = new PrismaFriendLinkRepository();
  const bookmarks = new PrismaBookmarkRepository();
  const sponsors = new PrismaSponsorRepository();
  const projects = new PrismaProjectRepository();
  const galleries = new PrismaGalleryRepository();

  const adminPosts = new PrismaAdminPostRepository();
  const adminCategories = new PrismaAdminCategoryRepository();
  const adminTags = new PrismaAdminTagRepository();
  const adminPages = new PrismaAdminPageRepository();
  const adminSettings = new PrismaAdminSettingRepository();
  const adminMedia = new PrismaAdminMediaRepository();
  const adminUsers = new PrismaAdminUserRepository();
  const adminSystem = new PrismaAdminSystemRepository();
  const adminDashboard = new PrismaAdminDashboardRepository();
  const adminDynamics = new PrismaAdminDynamicRepository();
  const adminFriends = new PrismaAdminFriendLinkRepository();
  const adminBookmarks = new PrismaAdminBookmarkRepository();
  const adminSponsors = new PrismaAdminSponsorRepository();
  const adminProjects = new PrismaAdminProjectRepository();
  const adminGalleries = new PrismaAdminGalleryRepository();

  const adminPostService = new DefaultAdminPostService(adminPosts);
  const adminCategoryService = new DefaultAdminCategoryService(adminCategories);
  const adminTagService = new DefaultAdminTagService(adminTags);

  return {
    postService: new DefaultPostService(posts),
    categoryService: new DefaultCategoryService(categories),
    tagService: new DefaultTagService(tags),
    pageService: new DefaultPageService(pages),
    settingService: new DefaultSettingService(settings),
    dynamicService: new DefaultDynamicService(dynamics),
    friendService: new DefaultFriendService(friends),
    bookmarkService: new DefaultBookmarkService(bookmarks),
    sponsorService: new DefaultSponsorService(sponsors),
    projectService: new DefaultProjectService(projects),
    galleryService: new DefaultGalleryService(galleries),
    musicService: new DefaultMusicService(musicTracks),
    bilibiliService: new DefaultBilibiliService(),
    bangumiService: new DefaultBangumiService(),
    vndbService: new DefaultVndbService(),
    malService: new DefaultMalService(),
    adminPostService,
    adminCategoryService,
    adminTagService,
    adminPageService: new DefaultAdminPageService(adminPages),
    adminSettingService: new DefaultAdminSettingService(settings, adminSettings),
    adminMediaService: new DefaultMediaService(
      adminMedia,
      new LocalMediaStorage(resolveUploadRoot()),
      new HttpRemoteMediaFetcher(),
    ),
    adminAccountService: new DefaultAdminAccountService(adminUsers),
    adminDashboardService: new DefaultAdminDashboardService(
      adminPosts,
      adminCategories,
      adminTags,
      adminPages,
      adminMedia,
      adminSystem,
      adminDashboard,
    ),
    adminDynamicService: new DefaultAdminDynamicService(adminDynamics),
    adminFriendService: new DefaultAdminFriendService(adminFriends),
    adminBookmarkService: new DefaultAdminBookmarkService(adminBookmarks),
    adminSponsorService: new DefaultAdminSponsorService(adminSponsors),
    adminProjectService: new DefaultAdminProjectService(adminProjects),
    adminGalleryService: new DefaultAdminGalleryService(adminGalleries),
    markdownImportService: new DefaultMarkdownImportService(adminPostService, adminTagService, adminCategoryService),
  };
}
