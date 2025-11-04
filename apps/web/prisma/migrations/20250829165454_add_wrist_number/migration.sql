/*
  Warnings:

  - A unique constraint covering the columns `[wristNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "wristNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_wristNumber_key" ON "public"."User"("wristNumber");
