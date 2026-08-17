import Stripe from "stripe";
import { PLANS, type PlanId } from "./plans";
import { isMpConfigured } from "./mercadopago";

export type PaymentsMode = "mercadopago" | "stripe" | "setup";

export function paymentsMode(): PaymentsMode {
  if (isMpConfigured()) return "mercadopago";
  if (process.env.STRIPE_SECRET_KEY) return "stripe";
  return "setup";
}

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function paidPlan(plan: string) {
  return plan === "starter" || plan === "pro" || plan === "business";
}

export function planPriceCents(plan: string) {
  const found = PLANS.find((p) => p.id === plan);
  return Math.round((found?.price || 0) * 100);
}

export function addDays(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export const PLAN_PRODUCT: Record<Exclude<PlanId, "free">, string> = {
  starter: "OrçaFlow Essencial",
  pro: "OrçaFlow Fechador",
  business: "OrçaFlow Equipe",
};
