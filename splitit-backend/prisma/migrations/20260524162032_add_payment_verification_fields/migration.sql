-- AlterTable
ALTER TABLE `expensesplit` ADD COLUMN `isPaid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isValidated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `paymentProof` VARCHAR(191) NULL;
