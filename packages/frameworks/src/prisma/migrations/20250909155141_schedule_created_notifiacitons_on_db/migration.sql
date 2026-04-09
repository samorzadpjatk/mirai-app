/*
  Warnings:

  - Added the required column `notificationId` to the `NotificationSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recurrence` to the `NotificationSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."NotificationSchedule" DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "notificationId" TEXT NOT NULL,
ADD COLUMN     "recurrence" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
