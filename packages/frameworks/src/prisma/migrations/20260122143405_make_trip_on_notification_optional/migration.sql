-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_tripId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationDelivery" DROP CONSTRAINT "NotificationDelivery_tripId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationSchedule" DROP CONSTRAINT "NotificationSchedule_tripId_fkey";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "tripId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationDelivery" ALTER COLUMN "tripId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationSchedule" ALTER COLUMN "tripId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
