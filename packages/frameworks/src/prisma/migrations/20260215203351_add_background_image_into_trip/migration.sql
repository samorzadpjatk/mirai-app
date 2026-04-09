-- DropIndex
DROP INDEX "idx_NotificationSchedule_active_time";

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "backgroundImagePath" TEXT;
