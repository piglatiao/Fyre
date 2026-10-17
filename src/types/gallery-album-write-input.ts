import type { GalleryPhotoInput } from "./gallery-photo-input";

// 相册仓储写入数据：passwordHash 为 undefined 表示编辑时保持原密码
export interface GalleryAlbumWriteInput {
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  eventDate: Date | null;
  location: string;
  tags: string[];
  passwordHash?: string | null;
  passwordHint: string;
  sortOrder: number;
  enabled: boolean;
  photos: GalleryPhotoInput[];
}
