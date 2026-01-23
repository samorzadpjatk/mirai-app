/*
  Warnings:

  - Added the required column `name` to the `NotificationSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notificationType` to the `NotificationSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."NotificationSchedule" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notificationType" TEXT NOT NULL,
ALTER COLUMN "notificationId" DROP NOT NULL;
