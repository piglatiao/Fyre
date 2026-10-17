// 远程媒体抓取抽象：把外部 http(s) 地址的文件取回内存，交给存储层校验落盘
export interface RemoteMediaFetcher {
  fetch(url: string): Promise<{ buffer: Buffer; mimeType: string; originalName: string }>;
}