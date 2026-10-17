-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `description` VARCHAR(500) NOT NULL DEFAULT '',
    `content` LONGTEXT NOT NULL,
    `coverUrl` VARCHAR(500) NOT NULL DEFAULT '',
    `status` VARCHAR(30) NOT NULL DEFAULT '',
    `tags` JSON NOT NULL,
    `links` JSON NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projects_slug_key`(`slug`),
    INDEX `projects_enabled_sortOrder_publishedAt_idx`(`enabled`, `sortOrder`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
