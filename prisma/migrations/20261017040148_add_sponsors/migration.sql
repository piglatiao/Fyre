-- CreateTable
CREATE TABLE `sponsor_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(500) NOT NULL DEFAULT '',
    `qrCodeUrl` VARCHAR(500) NOT NULL DEFAULT '',
    `linkUrl` VARCHAR(500) NOT NULL DEFAULT '',
    `description` VARCHAR(300) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sponsor_methods_enabled_sortOrder_id_idx`(`enabled`, `sortOrder`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sponsor_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `avatarUrl` VARCHAR(500) NOT NULL DEFAULT '',
    `amount` VARCHAR(50) NOT NULL DEFAULT '',
    `message` VARCHAR(300) NOT NULL DEFAULT '',
    `sponsoredAt` VARCHAR(10) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sponsor_records_enabled_sortOrder_id_idx`(`enabled`, `sortOrder`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
