-- AlterTable
ALTER TABLE `posts` ADD COLUMN `series` VARCHAR(60) NULL;

-- CreateIndex
CREATE INDEX `posts_status_series_publishedAt_idx` ON `posts`(`status`, `series`, `publishedAt`);
