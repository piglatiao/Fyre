-- CreateTable
CREATE TABLE `friend_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `avatarUrl` VARCHAR(500) NOT NULL DEFAULT '',
    `description` VARCHAR(300) NOT NULL DEFAULT '',
    `siteUrl` VARCHAR(500) NOT NULL,
    `tags` JSON NOT NULL,
    `weight` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `friend_links_enabled_weight_id_idx`(`enabled`, `weight`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
