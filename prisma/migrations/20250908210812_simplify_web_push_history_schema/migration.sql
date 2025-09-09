/*
  Warnings:

  - You are about to drop the column `requireInteraction` on the `WebPushNotification` table. All the data in the column will be lost.
  - You are about to drop the column `sentToAll` on the `WebPushNotification` table. All the data in the column will be lost.
  - You are about to drop the column `silent` on the `WebPushNotification` table. All the data in the column will be lost.
  - You are about to drop the column `targetGroupId` on the `WebPushNotification` table. All the data in the column will be lost.
  - You are about to drop the column `targetUserId` on the `WebPushNotification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."WebPushNotification" DROP CONSTRAINT "WebPushNotification_targetGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WebPushNotification" DROP CONSTRAINT "WebPushNotification_targetUserId_fkey";

-- AlterTable
ALTER TABLE "public"."WebPushNotification" DROP COLUMN "requireInteraction",
DROP COLUMN "sentToAll",
DROP COLUMN "silent",
DROP COLUMN "targetGroupId",
DROP COLUMN "targetUserId",
ADD COLUMN     "targetUserIds" TEXT[];

-- CreateTable
CREATE TABLE "public"."_UserToWebPushNotification" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserToWebPushNotification_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserToWebPushNotification_B_index" ON "public"."_UserToWebPushNotification"("B");

-- AddForeignKey
ALTER TABLE "public"."_UserToWebPushNotification" ADD CONSTRAINT "_UserToWebPushNotification_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserToWebPushNotification" ADD CONSTRAINT "_UserToWebPushNotification_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."WebPushNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
