import type { GalleryPhoto } from "./gallery-photo";

// 后台相册：补充启停、密码是否已设置与时间字段，不返回密码哈希
export interface AdminGalleryAlbum {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  eventDate: Date | null;
  location: string;
  tags: string[];
  passwordConfigured: boolean;
  passwordHint: string;
  sortOrder: number;
  enabled: boolean;
  photos: GalleryPhoto[];
  createdAt: Date;
  updatedAt: Date;
}
