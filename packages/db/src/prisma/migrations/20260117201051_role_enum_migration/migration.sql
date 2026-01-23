/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isModerator` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isServiceAccount` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SERVICE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isAdmin",
DROP COLUMN "isModerator",
DROP COLUMN "isServiceAccount",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
