import { prisma } from "@/lib/prisma";
import type { DashboardModuleCounts } from "@/types/dashboard-module-counts";
import type { AdminDashboardRepository } from "./admin-dashboard.repository.interface";

// 仪表盘聚合仓储实现：并行查询各内容模块总数
export class PrismaAdminDashboardRepository implements AdminDashboardRepository {
  async getModuleCounts(): Promise<DashboardModuleCounts> {
    const [
      dynamicCount,
      projectCount,
      galleryAlbumCount,
      galleryPhotoCount,
      friendCount,
      bookmarkGroupCount,
      bookmarkCount,
      sponsorMethodCount,
      sponsorRecordCount,
      musicTrackCount,
    ] = await Promise.all([
      prisma.dynamic.count(),
      prisma.project.count(),
      prisma.galleryAlbum.count(),
      prisma.galleryPhoto.count(),
      prisma.friendLink.count(),
      prisma.bookmarkGroup.count(),
      prisma.bookmark.count(),
      prisma.sponsorMethod.count(),
      prisma.sponsorRecord.count(),
      prisma.musicTrack.count(),
    ]);
    return {
      dynamicCount,
      projectCount,
      galleryAlbumCount,
      galleryPhotoCount,
      friendCount,
      bookmarkGroupCount,
      bookmarkCount,
      sponsorMethodCount,
      sponsorRecordCount,
      musicTrackCount,
    };
  }
}
