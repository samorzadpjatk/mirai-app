/*
  Warnings:

  - Made the column `url` on table `Notification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Notification" ALTER COLUMN "url" SET NOT NULL;
