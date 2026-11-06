-- AlterTable: gateway references so a webhook can be matched to its order
-- and replayed safely (paymentSessionId is unique).
ALTER TABLE "Order" ADD COLUMN "paymentRef" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentSessionId_key" ON "Order"("paymentSessionId");
