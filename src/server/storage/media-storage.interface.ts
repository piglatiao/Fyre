import type { StoredMediaFile } from "@/types/stored-media-file";

// 媒体存储抽象接口：一期实现为本机磁盘，后续可平滑替换为对象存储
export interface MediaStorage {
  // 保存文件：校验类型与大小，返回可访问 URL 与文件元信息
  save(input: { buffer: Buffer; originalName: string; mimeType: string }): Promise<StoredMediaFile>;
  // 按访问 URL 删除文件（文件不存在时忽略）
  removeByUrl(url: string): Promise<void>;
}
