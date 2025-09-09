/*
  Warnings:

  - You are about to drop the column `createdBy` on the `NotificationSchedule` table. All the data in the column will be lost.
  - You are about to drop the `WebPushNotification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserToWebPushNotification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdById` to the `NotificationSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."NotificationSchedule" DROP CONSTRAINT "NotificationSchedule_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."WebPushNotification" DROP CONSTRAINT "WebPushNotification_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserToWebPushNotification" DROP CONSTRAINT "_UserToWebPushNotification_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserToWebPushNotification" DROP CONSTRAINT "_UserToWebPushNotification_B_fkey";

-- AlterTable
ALTER TABLE "public"."NotificationSchedule" DROP COLUMN "createdBy",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."WebPushNotification";

-- DropTable
DROP TABLE "public"."_UserToWebPushNotification";

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPush" (
    "targetUserId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "NotificationPush_pkey" PRIMARY KEY ("targetUserId","notificationId")
);

-- AddForeignKey
ALTER TABLE "public"."NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPush" ADD CONSTRAINT "NotificationPush_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPush" ADD CONSTRAINT "NotificationPush_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
