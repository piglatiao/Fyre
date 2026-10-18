import type { LyricLine } from "@/types/lyric-line";

// 支持 [mm:ss]、[mm:ss.xx]、[mm:ss.xxx]，一行可携带多个时间戳
const TIME_TAG_PATTERN = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

// 把毫秒片段换算为秒：一位按十分之一秒、两位按百分之一秒、三位按毫秒
function parseFraction(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const digits = value.slice(0, 3);
  return Number.parseInt(digits, 10) / 10 ** digits.length;
}

// 解析 LRC 文本：忽略元数据标签与空行，按时间升序返回
export function parseLrc(source: string): LyricLine[] {
  if (!source.trim()) {
    return [];
  }
  const result: LyricLine[] = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const tags = Array.from(rawLine.matchAll(TIME_TAG_PATTERN));
    if (tags.length === 0) {
      continue;
    }
    const text = rawLine.replace(TIME_TAG_PATTERN, "").trim();
    if (!text) {
      continue;
    }
    for (const tag of tags) {
      const minutes = Number.parseInt(tag[1], 10);
      const seconds = Number.parseInt(tag[2], 10);
      if (seconds >= 60) {
        continue;
      }
      result.push({
        time: minutes * 60 + seconds + parseFraction(tag[3]),
        text,
      });
    }
  }
  return result.sort((left, right) => left.time - right.time);
}
