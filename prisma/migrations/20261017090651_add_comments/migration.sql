-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `targetType` ENUM('POST', 'GALLERY_ALBUM', 'PROJECT', 'PAGE', 'DYNAMIC', 'GUESTBOOK', 'SPONSOR', 'FRIENDS') NOT NULL,
    `targetId` INTEGER NULL,
    `targetTitle` VARCHAR(200) NOT NULL,
    `authorName` VARCHAR(50) NOT NULL,
    `authorEmail` VARCHAR(100) NULL,
    `authorWebsite` VARCHAR(500) NULL,
    `content` VARCHAR(2000) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'HIDDEN') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `comments_targetType_targetId_status_createdAt_idx`(`targetType`, `targetId`, `status`, `createdAt`),
    INDEX `comments_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
