// 抓帧超时（毫秒）：超时按失败处理，避免用户一直等
const CAPTURE_TIMEOUT_MS = 15000;
// 抓帧起点最小/最大秒数：避开纯黑首帧，又不跳过短视频
const MIN_SEEK_SECONDS = 0.5;
const MAX_SEEK_SECONDS = 3;

// 客户端从视频地址抓取一帧，返回 WebP 图片 Blob
// 同源（本站媒体库）视频可直接抓帧；跨域视频需要对方站点允许 CORS，否则会在导出时抛错
export function captureVideoFrame(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    video.style.position = "fixed";
    video.style.left = "-10000px";
    document.body.appendChild(video);

    // 收尾：清空地址并移除临时元素，避免继续占用网络与解码器
    const cleanup = (): void => {
      video.removeAttribute("src");
      video.load();
      video.remove();
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("抓帧超时，请确认视频地址可正常访问"));
    }, CAPTURE_TIMEOUT_MS);
    const fail = (message: string): void => {
      window.clearTimeout(timer);
      cleanup();
      reject(new Error(message));
    };

    video.addEventListener(
      "error",
      () => fail("视频加载失败，或该来源不允许跨域抓帧（可先把视频上传到媒体库再抓取）"),
      { once: true },
    );
    video.addEventListener(
      "loadeddata",
      () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const target = duration > 0
          ? Math.min(Math.max(duration * 0.1, MIN_SEEK_SECONDS), MAX_SEEK_SECONDS, Math.max(duration - 0.1, 0))
          : MIN_SEEK_SECONDS;
        video.currentTime = target;
      },
      { once: true },
    );
    video.addEventListener(
      "seeked",
      () => {
        try {
          if (!video.videoWidth) {
            fail("视频尚未解码出画面，请稍后重试");
            return;
          }
          const width = Math.min(video.videoWidth, 1920);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = Math.round((video.videoHeight / video.videoWidth) * width);
          const context = canvas.getContext("2d");
          if (!context) {
            fail("当前浏览器不支持画布抓帧");
            return;
          }
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                window.clearTimeout(timer);
                cleanup();
                resolve(blob);
              } else {
                fail("抓帧失败，浏览器未能导出图片");
              }
            },
            "image/webp",
            0.9,
          );
        } catch {
          fail("跨域视频无法抓帧，请先把视频上传到本站媒体库再抓取");
        }
      },
      { once: true },
    );

    video.src = url;
  });
}