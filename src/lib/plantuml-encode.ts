import { deflateRawSync } from "node:zlib";

// PlantUML 专用编码字母表：与标准 Base64 不同，可直接放入 URL 路径
const PLANTUML_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

// 将 6 位数值映射为 PlantUML 编码字符
function encode6bit(value: number): string {
  return PLANTUML_ALPHABET.charAt(value & 0x3f);
}

// 将三个字节打包为四个 PlantUML 编码字符
function append3bytes(first: number, second: number, third: number): string {
  const firstPart = first >> 2;
  const secondPart = ((first & 0x03) << 4) | (second >> 4);
  const thirdPart = ((second & 0x0f) << 2) | (third >> 6);
  const fourthPart = third & 0x3f;
  return (
    encode6bit(firstPart) + encode6bit(secondPart) + encode6bit(thirdPart) + encode6bit(fourthPart)
  );
}

// 使用 PlantUML 自定义字母表编码压缩后的字节，末尾不补等号
function encode64(bytes: Uint8Array): string {
  let result = "";
  for (let index = 0; index < bytes.length; index += 3) {
    if (index + 2 === bytes.length) {
      result += append3bytes(bytes[index], bytes[index + 1], 0);
    } else if (index + 1 === bytes.length) {
      result += append3bytes(bytes[index], 0, 0);
    } else {
      result += append3bytes(bytes[index], bytes[index + 1], bytes[index + 2]);
    }
  }
  return result;
}

// 编码 PlantUML 源码：UTF-8 → raw DEFLATE → PlantUML Base64
export function encodePlantUml(source: string): string {
  return encode64(deflateRawSync(Buffer.from(source, "utf8")));
}

// 源码已显式指定主题时不再覆盖，避免破坏作者意图
function hasExplicitTheme(source: string): boolean {
  return /^\s*!theme\s+\S+/m.test(source) || /^\s*skinparam\s+backgroundColor\b/im.test(source);
}

// 在 @startuml 行之后注入主题，没有起始行时放到源码最前面
export function injectPlantUmlTheme(source: string, themeName: string): string {
  const theme = themeName.trim();
  if (!theme || hasExplicitTheme(source)) {
    return source;
  }
  const startMatch = source.match(/^[^\S\r\n]*@startuml[^\r\n]*\r?\n?/);
  const directive = `!theme ${theme}`;
  if (!startMatch) {
    return `${directive}\n${source}`;
  }
  const insertAt = startMatch.index! + startMatch[0].length;
  return `${source.slice(0, insertAt)}${directive}\n${source.slice(insertAt)}`;
}

// 拼接 PlantUML 公共服务的 SVG 地址
export function buildPlantUmlSvgUrl(server: string, encoded: string): string {
  return `${server.replace(/\/+$/, "")}/svg/${encoded}`;
}
