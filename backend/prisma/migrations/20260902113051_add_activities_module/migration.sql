-- AlterTable
ALTER TABLE "User" ADD COLUMN "ageGroup" TEXT;

-- CreateTable
CREATE TABLE "ActivityWeek" (
    "id" SERIAL NOT NULL,
    "month" INTEGER NOT NULL,
    "monthTheme" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityTopic" (
    "id" SERIAL NOT NULL,
    "weekId" INTEGER NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "topic" TEXT NOT NULL,

    CONSTRAINT "ActivityTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityWeek_month_weekNumber_key" ON "ActivityWeek"("month", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityTopic_weekId_ageGroup_key" ON "ActivityTopic"("weekId", "ageGroup");

-- AddForeignKey
ALTER TABLE "ActivityTopic" ADD CONSTRAINT "ActivityTopic_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ActivityWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
