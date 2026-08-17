import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function token() {
  return randomBytes(18).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  await prisma.followUp.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "demo@orcaflow.com.br",
      passwordHash: await bcrypt.hash("demo1234", 10),
      name: "Ricardo Silva",
      companyName: "Silva Climatização",
      phone: "(11) 98888-1010",
      whatsapp: "11988881010",
      cnpj: "12.345.678/0001-90",
      address: "Rua das Palmeiras, 120 — São Paulo, SP",
      trade: "Técnico de ar-condicionado",
      plan: "pro",
      planStatus: "active",
      planPeriodEnd: addDays(new Date(), 365),
      pixKey: "demo@orcaflow.com.br",
      pixKeyType: "email",
      pixName: "Silva Climatizacao",
      pixCity: "Sao Paulo",
      quoteCounter: 1048,
      quotesThisMonth: 7,
      monthKey: new Date().toISOString().slice(0, 7),
    },
  });

  const joao = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "João Silva",
      phone: "11987654321",
      email: "joao.silva@email.com",
      notes: "Indicação da vizinha. Prefere WhatsApp.",
    },
  });
  const carlos = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Carlos Mendes",
      phone: "11976543210",
      email: "carlos@email.com",
    },
  });
  const maria = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Maria Oliveira",
      phone: "21988887777",
      email: "maria.oliveira@email.com",
    },
  });
  const ana = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Ana Souza",
      phone: "11991112222",
    },
  });
  const pedro = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Pedro Almeida",
      phone: "11970001122",
    },
  });
  const lucia = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Lúcia Ferreira",
      phone: "11995554433",
      email: "lucia@email.com",
    },
  });

  const items = (rows: { description: string; quantity: number; unitPrice: number; kind: string }[]) =>
    JSON.stringify(rows);

  const q1042 = await prisma.quote.create({
    data: {
      userId: user.id,
      customerId: joao.id,
      number: 1042,
      publicToken: token(),
      title: "Instalação de 3 aparelhos de ar-condicionado",
      notes: "Desconto de 10% se pagar à vista.",
      itemsJson: items([
        { description: "Mão de obra — instalação split", quantity: 3, unitPrice: 300, kind: "labor" },
        { description: "Material (suportes, cobre e acabamento)", quantity: 1, unitPrice: 350, kind: "material" },
      ]),
      discountType: "percent",
      discountValue: 10,
      subtotal: 1250,
      total: 1125,
      validUntil: addDays(new Date(), 5),
      status: "viewed",
      sentAt: hoursAgo(48),
      viewedAt: hoursAgo(30),
    },
  });

  await prisma.quote.create({
    data: {
      userId: user.id,
      customerId: carlos.id,
      number: 1043,
      publicToken: token(),
      title: "Troca da fiação da casa",
      itemsJson: items([
        { description: "Mão de obra — rewiring", quantity: 1, unitPrice: 1200, kind: "labor" },
        { description: "Material (fios, disjuntores, eletrodutos)", quantity: 1, unitPrice: 800, kind: "material" },
      ]),
      subtotal: 2000,
      total: 2000,
      validUntil: addDays(new Date(), 7),
      status: "accepted",
      paymentStatus: "paid",
      paidAt: hoursAgo(18),
      sentAt: hoursAgo(96),
      viewedAt: hoursAgo(90),
      acceptedAt: hoursAgo(20),
    },
  });

  await prisma.quote.create({
    data: {
      userId: user.id,
      customerId: maria.id,
      number: 1044,
      publicToken: token(),
      title: "Manutenção preventiva de 2 splits",
      itemsJson: items([
        { description: "Limpeza e recarga de gás", quantity: 2, unitPrice: 180, kind: "labor" },
      ]),
      subtotal: 360,
      total: 360,
      validUntil: addDays(new Date(), 3),
      status: "sent",
      sentAt: hoursAgo(6),
    },
  });

  await prisma.quote.create({
    data: {
      userId: user.id,
      customerId: ana.id,
      number: 1045,
      publicToken: token(),
      title: "Instalação de ar-condicionado 12.000 BTUs",
      itemsJson: items([
        { description: "Mão de obra", quantity: 1, unitPrice: 450, kind: "labor" },
        { description: "Suporte e tubulação", quantity: 1, unitPrice: 220, kind: "material" },
      ]),
      subtotal: 670,
      total: 670,
      validUntil: addDays(new Date(), 7),
      status: "draft",
    },
  });

  await prisma.quote.create({
    data: {
      userId: user.id,
      customerId: pedro.id,
      number: 1046,
      publicToken: token(),
      title: "Instalação de 2 cassete 18.000 BTUs — escritório",
      itemsJson: items([
        { description: "Mão de obra especializada", quantity: 2, unitPrice: 650, kind: "labor" },
        { description: "Material e drenagem", quantity: 1, unitPrice: 480, kind: "material" },
      ]),
      subtotal: 1780,
      total: 1780,
      validUntil: addDays(hoursAgo(10), -1),
      status: "expired",
      sentAt: hoursAgo(200),
      viewedAt: hoursAgo(190),
    },
  });

  await prisma.quote.create({
    data: {
      userId: user.id,
      customerId: lucia.id,
      number: 1047,
      publicToken: token(),
      title: "Limpeza pesada de evaporadora e condensadora",
      itemsJson: items([
        { description: "Serviço de higienização", quantity: 1, unitPrice: 250, kind: "labor" },
      ]),
      subtotal: 250,
      total: 250,
      validUntil: addDays(new Date(), 6),
      status: "accepted",
      paymentStatus: "pending",
      sentAt: hoursAgo(72),
      viewedAt: hoursAgo(70),
      acceptedAt: hoursAgo(50),
    },
  });

  await prisma.followUp.createMany({
    data: [
      {
        quoteId: q1042.id,
        dayOffset: 0,
        scheduledFor: hoursAgo(48),
        message:
          "Olá João! Seu orçamento para instalação dos 3 aparelhos foi enviado.\n\nQualquer dúvida estou à disposição.",
        status: "sent",
        sentAt: hoursAgo(48),
      },
      {
        quoteId: q1042.id,
        dayOffset: 2,
        scheduledFor: new Date(),
        message: "Oi João! Conseguiu analisar o orçamento que te enviei?",
        status: "pending",
      },
      {
        quoteId: q1042.id,
        dayOffset: 5,
        scheduledFor: addDays(new Date(), 3),
        message:
          "Olá João! Só passando para saber se ainda tem interesse na instalação. Posso ajustar o orçamento se necessário.",
        status: "pending",
      },
    ],
  });

  await prisma.payment.create({
    data: {
      userId: user.id,
      kind: "subscription",
      provider: "card-sandbox",
      status: "paid",
      plan: "pro",
      amount: 59,
      paidAt: hoursAgo(20),
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@orcaflow.com.br",
      passwordHash: await bcrypt.hash("admin1234", 10),
      name: "Admin OrçaFlow",
      companyName: "OrçaFlow",
      trade: "Outro",
      role: "admin",
      plan: "business",
      planStatus: "active",
      monthKey: new Date().toISOString().slice(0, 7),
    },
  });

  console.log("Seed OK");
  console.log("  Demo: demo@orcaflow.com.br / demo1234");
  console.log("  Admin: admin@orcaflow.com.br / admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
