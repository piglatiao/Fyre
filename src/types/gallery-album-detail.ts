import type { GalleryAlbum } from "./gallery-album";
import type { GalleryPhoto } from "./gallery-photo";

// 相册详情：照片仅在密码校验通过或无密码时下发
export interface GalleryAlbumDetail extends GalleryAlbum {
  passwordHint: string;
  photos: GalleryPhoto[];
}
