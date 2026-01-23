/*
  Warnings:

  - You are about to alter the column `accuracy` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `DoublePrecision`.
  - You are about to alter the column `altitude` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `DoublePrecision`.
  - You are about to alter the column `altitudeAccuracy` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `DoublePrecision`.
  - You are about to alter the column `heading` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `DoublePrecision`.
  - You are about to alter the column `latitude` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `DoublePrecision`.
  - You are about to alter the column `longitude` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `DoublePrecision`.
  - You are about to alter the column `speed` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "accuracy" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "altitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "altitudeAccuracy" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "heading" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "speed" SET DATA TYPE DOUBLE PRECISION;
