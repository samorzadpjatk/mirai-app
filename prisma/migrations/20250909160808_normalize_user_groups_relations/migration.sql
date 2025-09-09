/*
  Warnings:

  - You are about to drop the `_GroupToUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[organizerId]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[groupId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."_GroupToUser" DROP CONSTRAINT "_GroupToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_GroupToUser" DROP CONSTRAINT "_GroupToUser_B_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "groupId" TEXT;

-- DropTable
DROP TABLE "public"."_GroupToUser";

-- CreateIndex
CREATE UNIQUE INDEX "Group_organizerId_key" ON "public"."Group"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_groupId_key" ON "public"."User"("groupId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
