// 媒体地址工具：判断横幅壁纸地址是图片还是视频（含外链）
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];

// 是否为视频地址：忽略查询串与哈希，按扩展名判断
export function isVideoUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  const path = url.split(/[?#]/)[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => path.endsWith(extension));
}