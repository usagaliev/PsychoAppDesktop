-- CreateTable
CREATE TABLE "GoalTracking" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalDayLog" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "reflection" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalDayLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroAction" (
    "id" TEXT NOT NULL,
    "goalTrackingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicroAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroActionCompletion" (
    "id" TEXT NOT NULL,
    "microActionId" TEXT NOT NULL,
    "dayLogId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroActionCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalTracking_goalId_key" ON "GoalTracking"("goalId");

-- CreateIndex
CREATE INDEX "GoalTracking_userId_idx" ON "GoalTracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalDayLog_journalEntryId_key" ON "GoalDayLog"("journalEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalDayLog_trackingId_date_key" ON "GoalDayLog"("trackingId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MicroActionCompletion_microActionId_dayLogId_key" ON "MicroActionCompletion"("microActionId", "dayLogId");

-- AddForeignKey
ALTER TABLE "GoalTracking" ADD CONSTRAINT "GoalTracking_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTracking" ADD CONSTRAINT "GoalTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalDayLog" ADD CONSTRAINT "GoalDayLog_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "GoalTracking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalDayLog" ADD CONSTRAINT "GoalDayLog_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroAction" ADD CONSTRAINT "MicroAction_goalTrackingId_fkey" FOREIGN KEY ("goalTrackingId") REFERENCES "GoalTracking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroActionCompletion" ADD CONSTRAINT "MicroActionCompletion_microActionId_fkey" FOREIGN KEY ("microActionId") REFERENCES "MicroAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroActionCompletion" ADD CONSTRAINT "MicroActionCompletion_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "GoalDayLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
