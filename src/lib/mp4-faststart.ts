// MP4 fast-start 重排：把 moov（元数据）从文件尾部搬到 mdat（媒体数据）之前，
// 让浏览器只下载文件开头的一小段就能拿到时长/编码信息并开始播放，无需等待整个文件。
// 纯 Node 内存操作，不依赖 ffmpeg；仅处理普通渐进式 MP4（不含 moof 分片）。
// 任何无法安全处理的文件都会原样返回，绝不破坏上传流程。

// 单个 MP4 box 的扫描信息（偏移均相对所在缓冲区）
interface Mp4Box {
  type: string;
  offset: number;
  size: number;
  headerSize: number;
}

// 允许向下递归扫描的容器 box 类型（stco/co64 只可能出现在这些容器内）
const CONTAINER_TYPES = new Set(["moov", "trak", "mdia", "minf", "stbl"]);

// 扫描 [start, end) 区间内的 box 链；结构异常时返回已识别部分
function scanBoxes(buffer: Buffer, start: number, end: number): Mp4Box[] {
  const boxes: Mp4Box[] = [];
  let offset = start;
  while (offset + 8 <= end) {
    const size32 = buffer.readUInt32BE(offset);
    const type = buffer.toString("latin1", offset + 4, offset + 8);
    let size = size32;
    let headerSize = 8;
    if (size32 === 1) {
      if (offset + 16 > end) {
        break;
      }
      size = Number(buffer.readBigUInt64BE(offset + 8));
      headerSize = 16;
    } else if (size32 === 0) {
      size = end - offset;
    }
    if (size < headerSize || offset + size > end) {
      break;
    }
    boxes.push({ type, offset, size, headerSize });
    offset += size;
  }
  return boxes;
}

// 修补 moov 内的 stco/co64 分片偏移表：所有条目整体平移 delta 字节
function shiftChunkOffsets(
  buffer: Buffer,
  start: number,
  end: number,
  delta: number,
): { patched: number; ok: boolean } {
  let patched = 0;
  for (const box of scanBoxes(buffer, start, end)) {
    if (box.type === "stco" || box.type === "co64") {
      const payload = box.offset + box.headerSize;
      const count = buffer.readUInt32BE(payload + 4);
      const entrySize = box.type === "stco" ? 4 : 8;
      if (payload + 8 + count * entrySize > box.offset + box.size) {
        return { patched, ok: false };
      }
      const deltaBig = BigInt(delta);
      for (let i = 0; i < count; i++) {
        const at = payload + 8 + i * entrySize;
        if (entrySize === 4) {
          const value = buffer.readUInt32BE(at) + delta;
          if (value > 0xffffffff) {
            return { patched, ok: false };
          }
          buffer.writeUInt32BE(value, at);
        } else {
          buffer.writeBigUInt64BE(buffer.readBigUInt64BE(at) + deltaBig, at);
        }
      }
      patched += count;
    } else if (CONTAINER_TYPES.has(box.type)) {
      const sub = shiftChunkOffsets(buffer, box.offset + box.headerSize, box.offset + box.size, delta);
      if (!sub.ok) {
        return sub;
      }
      patched += sub.patched;
    }
  }
  return { patched, ok: true };
}

// 收集 moov 内所有分片偏移，用于重排后做范围校验
function collectChunkOffsets(buffer: Buffer, start: number, end: number, out: number[]): void {
  for (const box of scanBoxes(buffer, start, end)) {
    if (box.type === "stco" || box.type === "co64") {
      const payload = box.offset + box.headerSize;
      const count = buffer.readUInt32BE(payload + 4);
      const entrySize = box.type === "stco" ? 4 : 8;
      for (let i = 0; i < count; i++) {
        const at = payload + 8 + i * entrySize;
        out.push(entrySize === 4 ? buffer.readUInt32BE(at) : Number(buffer.readBigUInt64BE(at)));
      }
    } else if (CONTAINER_TYPES.has(box.type)) {
      collectChunkOffsets(buffer, box.offset + box.headerSize, box.offset + box.size, out);
    }
  }
}

// 把 MP4 重排为 fast-start（moov 前置）；已符合或无法安全处理时原样返回
export function faststartMp4(input: Buffer): Buffer {
  try {
    const boxes = scanBoxes(input, 0, input.length);
    const last = boxes.at(-1);
    // 顶层结构必须被完整解析，且只允许一个 mdat
    if (!last || last.offset + last.size !== input.length) {
      return input;
    }
    const moov = boxes.find((box) => box.type === "moov");
    const mdats = boxes.filter((box) => box.type === "mdat");
    const mdat = mdats.at(0);
    if (!moov || !mdat || mdats.length !== 1) {
      return input;
    }
    // 已经是 fast-start 或为分片 MP4：不做处理
    if (moov.offset < mdat.offset || boxes.some((box) => box.type === "moof")) {
      return input;
    }
    const preBoxes = boxes.filter((box) => box.offset < mdat.offset);
    const midBoxes = boxes.filter((box) => box.offset > mdat.offset && box.offset < moov.offset);
    const postBoxes = boxes.filter((box) => box.offset > moov.offset);
    const prefixSize = preBoxes.reduce((total, box) => total + box.size, 0);
    const newMdatOffset = prefixSize + moov.size;
    const delta = newMdatOffset - mdat.offset;
    // 拷贝 moov 并修补分片偏移（条目宽度不变，moov 总长度不变）
    const moovBuffer = Buffer.from(input.subarray(moov.offset, moov.offset + moov.size));
    const shifted = shiftChunkOffsets(moovBuffer, moov.headerSize, moov.size, delta);
    if (!shifted.ok || shifted.patched === 0) {
      return input;
    }
    // 校验：所有分片偏移都必须落在新 mdat 数据区内
    const dataStart = newMdatOffset + mdat.headerSize;
    const dataEnd = newMdatOffset + mdat.size;
    const offsets: number[] = [];
    collectChunkOffsets(moovBuffer, moov.headerSize, moov.size, offsets);
    if (offsets.some((value) => value < dataStart || value >= dataEnd)) {
      return input;
    }
    // 组装新文件：前置 box → moov → mdat → 中置 box → 后置 box
    const output = Buffer.allocUnsafe(input.length);
    let cursor = 0;
    const copyBox = (box: Mp4Box): void => {
      input.copy(output, cursor, box.offset, box.offset + box.size);
      cursor += box.size;
    };
    for (const box of preBoxes) {
      copyBox(box);
    }
    moovBuffer.copy(output, cursor);
    cursor += moovBuffer.length;
    copyBox(mdat);
    for (const box of midBoxes) {
      copyBox(box);
    }
    for (const box of postBoxes) {
      copyBox(box);
    }
    if (cursor !== input.length) {
      return input;
    }
    return output;
  } catch {
    // 任何异常都回退到原文件
    return input;
  }
}
