import { z } from "zod";

// 可空文本字段：空串与未传值统一视为 null，避免表单产生空字符串
export function nullableText(maxLength: number, message: string) {
  return z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.string().trim().max(maxLength, message).nullable(),
  );
}

// 可空正整数：空串与未传值统一视为 null
export function nullablePositiveInt(message: string) {
  return z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.number().int().positive(message).nullable(),
  );
}
