-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" JSONB,
ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginLog_email_idx" ON "LoginLog"("email");

-- CreateIndex
CREATE INDEX "LoginLog_createdAt_idx" ON "LoginLog"("createdAt");

