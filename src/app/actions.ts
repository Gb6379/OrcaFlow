"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { canCreateQuote, hasPlan, normalizePlan, quoteUsage } from "@/lib/plans";
import { calcTotals, type QuoteItem } from "@/lib/money";
import { interpolate, quotePublicUrl, firstName } from "@/lib/format";
import { parseQuoteWithAI } from "@/lib/parser";
import { publicToken } from "@/lib/token";
import { money } from "@/lib/money";

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

async function bumpMonth(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const key = currentMonthKey();
  const plan = normalizePlan(user.plan);
  const patch: { monthKey?: string; quotesThisMonth?: number; plan?: string } = {};
  if (user.monthKey !== key) {
    patch.monthKey = key;
    patch.quotesThisMonth = 0;
  }
  if (user.plan !== plan) patch.plan = plan;
  if (Object.keys(patch).length) {
    return prisma.user.update({ where: { id: userId }, data: patch });
  }
  return user;
}

export async function getQuoteQuota(userId: string) {
  const user = await bumpMonth(userId);
  if (!user) return quoteUsage("free", 0);
  return quoteUsage(user.plan, user.quotesThisMonth);
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(2),
  trade: z.string().min(2),
  phone: z.string().optional(),
});

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    trade: formData.get("trade"),
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) return { error: "Preencha os campos obrigatórios corretamente." };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (exists) return { error: "Já existe uma conta com este e-mail." };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      companyName: parsed.data.companyName,
      trade: parsed.data.trade,
      phone: parsed.data.phone || "",
      whatsapp: parsed.data.phone || "",
      pixKey: parsed.data.phone || parsed.data.email.toLowerCase(),
      pixKeyType: parsed.data.phone ? "phone" : "email",
      pixName: parsed.data.companyName,
      monthKey: currentMonthKey(),
      plan: ["starter", "pro", "business"].includes(String(formData.get("plan") || ""))
        ? String(formData.get("plan"))
        : "free",
      quotesThisMonth: 0,
    },
  });
  await createSession(user);
  const plan = String(formData.get("plan") || "");
  if (["starter", "pro", "business"].includes(plan)) {
    redirect(`/checkout?plan=${plan}`);
  }
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "E-mail ou senha inválidos." };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "E-mail ou senha inválidos." };
  if (user.blockedAt) return { error: "Esta conta foi bloqueada. Fale com o suporte." };
  await createSession(user);
  const next = String(formData.get("next") || "/dashboard");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(safe);
}

export async function loginDemoAction() {
  const user = await prisma.user.findUnique({ where: { email: "demo@orcaflow.com.br" } });
  if (!user) redirect("/login?error=demo");
  await createSession(user);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function saveCustomerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Informe o nome do cliente." };
  const id = String(formData.get("id") || "");
  const data = {
    name,
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    address: String(formData.get("address") || ""),
    notes: String(formData.get("notes") || ""),
  };
  if (id) {
    await prisma.customer.updateMany({ where: { id, userId: user.id }, data });
    return { ok: true, id };
  }
  const customer = await prisma.customer.create({ data: { ...data, userId: user.id } });
  return { ok: true, id: customer.id };
}

export async function deleteCustomerAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  await prisma.customer.deleteMany({ where: { id, userId: user.id } });
  return { ok: true };
}

export type SaveQuoteInput = {
  id?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  title: string;
  notes?: string;
  items: QuoteItem[];
  discountType: "none" | "percent" | "fixed";
  discountValue: number;
  validityDays?: number;
};

export async function saveQuoteAction(input: SaveQuoteInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  if (!input.title?.trim()) return { error: "Informe o serviço." };
  if (!input.customerName?.trim()) return { error: "Informe o cliente." };
  if (!input.items?.length) return { error: "Adicione pelo menos um item." };

  const fresh = await bumpMonth(user.id);
  const working = fresh || user;

  let customer = await prisma.customer.findFirst({
    where: {
      userId: user.id,
      name: input.customerName.trim(),
    },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        userId: user.id,
        name: input.customerName.trim(),
        phone: input.customerPhone || "",
        email: input.customerEmail || "",
      },
    });
  } else if (input.customerPhone || input.customerEmail) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phone: input.customerPhone || customer.phone,
        email: input.customerEmail || customer.email,
      },
    });
  }

  const { subtotal, total } = calcTotals(input.items, input.discountType, input.discountValue);
  const validity = input.validityDays || working.validityDays || 7;

  if (input.id) {
    const existing = await prisma.quote.findFirst({ where: { id: input.id, userId: user.id } });
    if (!existing) return { error: "Orçamento não encontrado." };
    const quote = await prisma.quote.update({
      where: { id: existing.id },
      data: {
        customerId: customer.id,
        title: input.title.trim(),
        notes: input.notes || "",
        itemsJson: JSON.stringify(input.items),
        discountType: input.discountType,
        discountValue: input.discountValue,
        subtotal,
        total,
        validUntil: existing.status === "draft" ? new Date(Date.now() + validity * 86400000) : existing.validUntil,
      },
    });
    return { ok: true, id: quote.id };
  }

  if (!canCreateQuote(working.plan, working.quotesThisMonth)) {
    const usage = quoteUsage(working.plan, working.quotesThisMonth);
    return {
      error: `Você usou os ${usage.limit} orçamentos do plano Inicial neste mês.`,
      code: "PLAN_LIMIT" as const,
      used: usage.used,
      limit: usage.limit,
    };
  }

  const numbered = await prisma.user.update({
    where: { id: user.id },
    data: { quoteCounter: { increment: 1 }, quotesThisMonth: { increment: 1 } },
  });

  const quote = await prisma.quote.create({
    data: {
      userId: user.id,
      customerId: customer.id,
      number: numbered.quoteCounter,
      publicToken: publicToken(),
      title: input.title.trim(),
      notes: input.notes || "",
      itemsJson: JSON.stringify(input.items),
      discountType: input.discountType,
      discountValue: input.discountValue,
      subtotal,
      total,
      validUntil: new Date(Date.now() + validity * 86400000),
      status: "draft",
    },
  });
  return { ok: true, id: quote.id };
}

export async function sendQuoteAction(quoteId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId: user.id },
    include: { customer: true },
  });
  if (!quote) return { error: "Orçamento não encontrado." };

  const now = new Date();
  const updated = await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: quote.status === "draft" ? "sent" : quote.status,
      sentAt: quote.sentAt || now,
    },
  });

  if (hasPlan(user.plan, "pro")) {
    const existing = await prisma.followUp.count({ where: { quoteId: quote.id } });
    if (existing === 0) {
      const vars = {
        cliente: firstName(quote.customer.name),
        servico: quote.title,
        total: money(quote.total),
        numero: String(quote.number),
        link: quotePublicUrl(quote.publicToken),
      };
      await prisma.followUp.createMany({
        data: [
          {
            quoteId: quote.id,
            dayOffset: 0,
            scheduledFor: now,
            message: interpolate(user.followUpDay0, vars),
            status: "pending",
          },
          {
            quoteId: quote.id,
            dayOffset: 2,
            scheduledFor: new Date(now.getTime() + 2 * 86400000),
            message: interpolate(user.followUpDay2, vars),
            status: "pending",
          },
          {
            quoteId: quote.id,
            dayOffset: 5,
            scheduledFor: new Date(now.getTime() + 5 * 86400000),
            message: interpolate(user.followUpDay5, vars),
            status: "pending",
          },
        ],
      });
    }
  }

  return { ok: true, id: updated.id, token: quote.publicToken };
}

export async function deleteQuoteAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  await prisma.quote.deleteMany({ where: { id, userId: user.id } });
  return { ok: true };
}

export async function markFollowUpSentAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  const followUp = await prisma.followUp.findFirst({
    where: { id, quote: { userId: user.id } },
  });
  if (!followUp) return { error: "Follow-up não encontrado." };
  await prisma.followUp.update({
    where: { id },
    data: { status: "sent", sentAt: new Date() },
  });
  return { ok: true };
}

export async function skipFollowUpAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  await prisma.followUp.updateMany({
    where: { id, quote: { userId: user.id } },
    data: { status: "skipped" },
  });
  return { ok: true };
}

export async function acceptQuoteAction(token: string) {
  const quote = await prisma.quote.findUnique({ where: { publicToken: token } });
  if (!quote) return { error: "Orçamento não encontrado." };
  if (quote.status === "accepted") return { ok: true };
  if (quote.validUntil < new Date() && quote.status !== "accepted") {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "expired" } });
    return { error: "Este orçamento expirou." };
  }
  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: "accepted", acceptedAt: new Date() },
  });
  await prisma.followUp.updateMany({
    where: { quoteId: quote.id, status: "pending" },
    data: { status: "cancelled" },
  });
  return { ok: true };
}

export async function parseQuoteAction(text: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  if (!hasPlan(user.plan, "pro")) {
    return { error: "A criação com IA entra no plano Fechador (R$ 59/mês)." };
  }
  if (!text.trim()) return { error: "Descreva o orçamento." };
  const parsed = await parseQuoteWithAI(text);
  return { ok: true, parsed };
}

export async function updateSettingsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  const str = (key: string) => (formData.has(key) ? String(formData.get(key) || "") : undefined);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(str("name") !== undefined ? { name: str("name") || user.name } : {}),
      ...(str("companyName") !== undefined ? { companyName: str("companyName") || user.companyName } : {}),
      ...(str("phone") !== undefined ? { phone: str("phone") || "" } : {}),
      ...(str("whatsapp") !== undefined ? { whatsapp: str("whatsapp") || "" } : {}),
      ...(str("cnpj") !== undefined ? { cnpj: str("cnpj") || "" } : {}),
      ...(str("address") !== undefined ? { address: str("address") || "" } : {}),
      ...(str("trade") !== undefined ? { trade: str("trade") || user.trade } : {}),
      ...(formData.has("validityDays") ? { validityDays: Number(formData.get("validityDays") || 7) } : {}),
      ...(str("followUpDay0") !== undefined ? { followUpDay0: str("followUpDay0") || user.followUpDay0 } : {}),
      ...(str("followUpDay2") !== undefined ? { followUpDay2: str("followUpDay2") || user.followUpDay2 } : {}),
      ...(str("followUpDay5") !== undefined ? { followUpDay5: str("followUpDay5") || user.followUpDay5 } : {}),
      ...(str("pixKey") !== undefined ? { pixKey: str("pixKey") || "" } : {}),
      ...(str("pixKeyType") !== undefined ? { pixKeyType: str("pixKeyType") || "email" } : {}),
      ...(str("pixName") !== undefined ? { pixName: str("pixName") || "" } : {}),
      ...(str("pixCity") !== undefined ? { pixCity: str("pixCity") || "Sao Paulo" } : {}),
    },
  });
  return { ok: true };
}

export async function changePlanAction(plan: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  if (plan !== "free") {
    return { error: "Planos pagos passam pelo checkout." };
  }
  const { cancelPlanAction } = await import("./billing-actions");
  return cancelPlanAction();
}

export async function expireOldQuotes() {
  await prisma.quote.updateMany({
    where: {
      status: { in: ["sent", "viewed"] },
      validUntil: { lt: new Date() },
    },
    data: { status: "expired" },
  });
}
