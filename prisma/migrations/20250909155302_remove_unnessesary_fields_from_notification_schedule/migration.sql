/*
  Warnings:

  - You are about to drop the column `recurrence` on the `NotificationSchedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."NotificationSchedule" DROP COLUMN "recurrence";
