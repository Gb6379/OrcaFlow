-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "cnpj" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "trade" TEXT NOT NULL DEFAULT 'Outro',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "quoteCounter" INTEGER NOT NULL DEFAULT 1041,
    "quotesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "monthKey" TEXT NOT NULL DEFAULT '',
    "validityDays" INTEGER NOT NULL DEFAULT 7,
    "followUpDay0" TEXT NOT NULL DEFAULT 'Olá {cliente}! Seu orçamento para {servico} foi enviado.

Qualquer dúvida estou à disposição.',
    "followUpDay2" TEXT NOT NULL DEFAULT 'Oi {cliente}! Conseguiu analisar o orçamento que te enviei?',
    "followUpDay5" TEXT NOT NULL DEFAULT 'Olá {cliente}! Só passando para saber se ainda tem interesse em {servico}. Posso ajustar o orçamento se necessário.',
    "stripeCustomerId" TEXT NOT NULL DEFAULT '',
    "stripeSubscriptionId" TEXT NOT NULL DEFAULT '',
    "planStatus" TEXT NOT NULL DEFAULT 'active',
    "planPeriodEnd" TIMESTAMP(3),
    "pixKey" TEXT NOT NULL DEFAULT '',
    "pixKeyType" TEXT NOT NULL DEFAULT 'email',
    "pixName" TEXT NOT NULL DEFAULT '',
    "pixCity" TEXT NOT NULL DEFAULT 'Sao Paulo',
    "mpReceiveToken" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'user',
    "blockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "publicToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "itemsJson" TEXT NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'none',
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "dayOffset" INTEGER NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "plan" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "stripeSessionId" TEXT NOT NULL DEFAULT '',
    "stripePaymentId" TEXT NOT NULL DEFAULT '',
    "pixPayload" TEXT NOT NULL DEFAULT '',
    "pixTxid" TEXT NOT NULL DEFAULT '',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_planStatus_idx" ON "User"("planStatus");

-- CreateIndex
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");

-- CreateIndex
CREATE INDEX "Quote_userId_idx" ON "Quote"("userId");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "FollowUp_quoteId_idx" ON "FollowUp"("quoteId");

-- CreateIndex
CREATE INDEX "FollowUp_status_scheduledFor_idx" ON "FollowUp"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_quoteId_idx" ON "Payment"("quoteId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
