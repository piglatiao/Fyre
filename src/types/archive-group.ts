import type { ArchiveEntry } from "./archive-entry";

// 按年份聚合的归档
export interface ArchiveGroup {
  year: number;
  entries: ArchiveEntry[];
}
