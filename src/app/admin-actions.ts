"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAdminUser, PLAN_IDS } from "@/lib/admin";
import { addDays, paidPlan, planPriceCents } from "@/lib/billing";
import { normalizePlan } from "@/lib/plans";

function refreshAdmin(userId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/revenue");
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

export async function adminUpdatePlanAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const plan = normalizePlan(String(formData.get("plan") || "free"));
  const planStatus = String(formData.get("planStatus") || "active");
  const periodRaw = String(formData.get("planPeriodEnd") || "");
  const complimentary = formData.get("complimentary") === "on";
  const recordPayment = complimentary || formData.get("recordPayment") === "on";
  if (!userId) return { error: "Usuário inválido." };
  if (!PLAN_IDS.includes(plan)) return { error: "Plano inválido." };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Usuário não encontrado." };

  const periodEnd =
    plan === "free" ? null : periodRaw ? new Date(`${periodRaw}T23:59:59`) : addDays(30);

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      planStatus: plan === "free" ? "canceled" : planStatus || "active",
      planPeriodEnd: periodEnd,
      ...(plan === "free" ? { stripeSubscriptionId: "" } : {}),
    },
  });

  if (paidPlan(plan) && recordPayment) {
    await prisma.payment.create({
      data: {
        userId,
        kind: "subscription",
        provider: "admin",
        status: "paid",
        plan,
        amount: complimentary ? 0 : planPriceCents(plan) / 100,
        paidAt: new Date(),
      },
    });
  }

  refreshAdmin(userId);
  return { ok: true };
}

export async function adminExtendPlanAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const days = Math.max(1, Number(formData.get("days") || 30));
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado." };
  const base = user.planPeriodEnd && user.planPeriodEnd > new Date() ? user.planPeriodEnd : new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      planStatus: user.plan === "free" ? user.planStatus : "active",
      planPeriodEnd: addDays(days, base),
    },
  });
  refreshAdmin(userId);
  return { ok: true };
}

export async function adminSetRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "user") === "admin" ? "admin" : "user";
  if (userId === admin.id && role !== "admin") {
    return { error: "Você não pode remover o próprio acesso de admin." };
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  refreshAdmin(userId);
  return { ok: true };
}

export async function adminToggleBlockAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (userId === admin.id) return { error: "Você não pode bloquear a própria conta." };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado." };
  if (!user.blockedAt && isAdminUser(user)) {
    return { error: "Não bloqueie outro admin por aqui." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { blockedAt: user.blockedAt ? null : new Date() },
  });
  refreshAdmin(userId);
  return { ok: true };
}

export async function adminDeleteUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const confirm = String(formData.get("confirm") || "").trim().toLowerCase();
  if (userId === admin.id) return { error: "Você não pode apagar a própria conta." };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado." };
  if (confirm !== user.email.toLowerCase()) {
    return { error: "Digite o e-mail da conta para confirmar." };
  }
  if (isAdminUser(user)) return { error: "Não apague uma conta admin." };
  await prisma.user.delete({ where: { id: userId } });
  refreshAdmin();
  return { ok: true, deleted: true };
}
