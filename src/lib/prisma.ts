import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

// Prisma 7 起必须显式传入驱动适配器：MySQL 使用 MariaDB 驱动，连接串来自 DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("缺少环境变量 DATABASE_URL，请检查 .env 配置");
}

// 为生产环境并发请求设置更宽松的连接池上限与获取超时，避免短时请求洪峰触发 P2039
function addPoolOptions(url: string): string {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set("connectionLimit", "20");
    parsedUrl.searchParams.set("acquireTimeout", "30000");
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

const adapter = new PrismaMariaDb(addPoolOptions(databaseUrl));

// 开发环境热重载会重复执行模块，缓存实例避免连接数膨胀
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
