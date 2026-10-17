import type { MediaType } from "@/generated/prisma/client";
import type { MediaItem } from "@/types/media-item";
import type { PageResult } from "@/types/page-result";

// 媒体服务接口：封装存储与数据库记录的一致操作
export interface MediaService {
  // 分页列表
  list(params: { page: number; pageSize: number; type?: MediaType }): Promise<PageResult<MediaItem>>;
  // 上传：存储层校验并落盘后写入数据库
  upload(file: { buffer: Buffer; originalName: string; mimeType: string }): Promise<MediaItem>;
  // 转存远程文件：先下载再走上传流程
  importFromUrl(url: string): Promise<MediaItem>;
  // 删除：先删文件再删记录
  remove(id: number): Promise<void>;
}
