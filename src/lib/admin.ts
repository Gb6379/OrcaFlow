import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { requireUser } from "./auth";
import { paidPlan as isPaidPlanId } from "./billing";
import { PLANS, normalizePlan, type PlanId } from "./plans";

export function isAdminUser(user: { role: string; email: string }) {
  if (user.role === "admin") return true;
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(user.email.toLowerCase());
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminUser(user)) redirect("/dashboard");
  return user;
}

export function isSubscriptionActive(user: {
  plan: string;
  planStatus: string;
  planPeriodEnd: Date | null;
}, now = new Date()) {
  if (!isPaidPlanId(normalizePlan(user.plan))) return false;
  if (user.planStatus !== "active") return false;
  if (user.planPeriodEnd && user.planPeriodEnd < now) return false;
  return true;
}

export function planPrice(plan: string) {
  return PLANS.find((p) => p.id === plan)?.price || 0;
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export function lastMonthKeys(count = 6) {
  const keys: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < count; i++) {
    keys.unshift(monthKey(d));
    d.setMonth(d.getMonth() - 1);
  }
  return keys;
}

export const PLAN_IDS: PlanId[] = ["free", "starter", "pro", "business"];
