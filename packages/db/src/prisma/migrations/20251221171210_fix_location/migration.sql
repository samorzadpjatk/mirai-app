/*
  Warnings:

  - You are about to alter the column `accuracy` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,8)`.
  - You are about to alter the column `altitude` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,8)`.
  - You are about to alter the column `altitudeAccuracy` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,8)`.
  - You are about to alter the column `heading` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,8)`.
  - You are about to alter the column `latitude` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,8)`.
  - You are about to alter the column `longitude` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,8)`.
  - You are about to alter the column `speed` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,8)`.

*/
-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "accuracy" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "altitude" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "altitudeAccuracy" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "heading" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "latitude" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "longitude" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "speed" SET DATA TYPE DECIMAL(10,8);
