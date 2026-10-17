-- CreateTable
CREATE TABLE `bookmark_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(500) NOT NULL DEFAULT '',
    `description` VARCHAR(300) NOT NULL DEFAULT '',
    `weight` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookmark_groups_slug_key`(`slug`),
    INDEX `bookmark_groups_enabled_weight_id_idx`(`enabled`, `weight`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookmarks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `description` VARCHAR(300) NOT NULL DEFAULT '',
    `icon` VARCHAR(500) NOT NULL DEFAULT '',
    `weight` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookmarks_groupId_enabled_weight_id_idx`(`groupId`, `enabled`, `weight`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `bookmark_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
