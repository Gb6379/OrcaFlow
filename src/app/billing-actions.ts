"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { addDays, paidPlan, paymentsMode, planPriceCents, PLAN_PRODUCT, stripeClient } from "@/lib/billing";
import { appUrl } from "@/lib/format";
import { buildPixPayload, normalizePixKey, receivePixForUser } from "@/lib/pix";
import { publicToken } from "@/lib/token";
import QRCode from "qrcode";
import type Stripe from "stripe";
import { isMpProduction, isMpToken, mpApi, mpApiWithToken, mpTokenHintFrom, saveMpAccessToken } from "@/lib/mercadopago";

export async function activatePaidPlan(userId: string, plan: string, extra?: {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  periodEnd?: Date;
  provider?: string;
  amount?: number;
  stripeSessionId?: string;
}) {
  const periodEnd = extra?.periodEnd || addDays(30);
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      planStatus: "active",
      planPeriodEnd: periodEnd,
      ...(extra?.stripeCustomerId ? { stripeCustomerId: extra.stripeCustomerId } : {}),
      ...(extra?.stripeSubscriptionId ? { stripeSubscriptionId: extra.stripeSubscriptionId } : {}),
    },
  });
  await prisma.payment.create({
    data: {
      userId,
      kind: "subscription",
      provider: extra?.provider || paymentsMode(),
      status: "paid",
      plan,
      amount: extra?.amount ?? planPriceCents(plan) / 100,
      stripeSessionId: extra?.stripeSessionId || "",
      paidAt: new Date(),
    },
  });
}

export async function startStripeCheckoutAction(plan: string) {
  const user = await requireUser();
  if (!paidPlan(plan)) redirect("/pricing");
  const stripe = stripeClient();
  if (!stripe) redirect(`/checkout?plan=${plan}`);

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const productName = PLAN_PRODUCT[plan as keyof typeof PLAN_PRODUCT];
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    success_url: `${appUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/checkout?plan=${plan}&canceled=1`,
    locale: "pt-BR",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: planPriceCents(plan),
          recurring: { interval: "month" },
          product_data: {
            name: productName,
            description: PLANS.find((p) => p.id === plan)?.blurb,
          },
        },
      },
    ],
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
  });
  if (!session.url) redirect(`/checkout?plan=${plan}&canceled=1`);
  redirect(session.url);
}

export async function startMercadoPagoCheckoutAction(plan: string) {
  const user = await requireUser();
  if (!paidPlan(plan)) redirect("/pricing");
  const productName = PLAN_PRODUCT[plan as keyof typeof PLAN_PRODUCT];
  const price = planPriceCents(plan) / 100;
  const base = appUrl();
  const success = `${base}/checkout/success`;
  const failure = `${base}/checkout?plan=${plan}&canceled=1`;
  const https = base.startsWith("https://");

  const body: Record<string, unknown> = {
    items: [
      {
        id: plan,
        title: productName,
        description: PLANS.find((p) => p.id === plan)?.blurb || productName,
        quantity: 1,
        currency_id: "BRL",
        unit_price: price,
      },
    ],
    payer: {
      name: user.name,
      email: user.email,
    },
    back_urls: {
      success,
      failure,
      pending: success,
    },
    external_reference: `${user.id}:${plan}`,
    statement_descriptor: "ORCAFLOW",
    metadata: { userId: user.id, plan },
    payment_methods: {
      installments: 1,
    },
  };
  if (https) {
    body.auto_return = "approved";
    body.notification_url = `${base}/api/mercadopago/webhook`;
  }

  let pref: { id?: string; init_point?: string; sandbox_init_point?: string };
  try {
    pref = (await mpApi("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify(body),
    })) as typeof pref;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no Mercado Pago";
    redirect(`/checkout?plan=${plan}&error=${encodeURIComponent(message)}`);
  }

  await prisma.payment.create({
    data: {
      userId: user.id,
      kind: "subscription",
      provider: "mercadopago",
      status: "pending",
      plan,
      amount: price,
      stripeSessionId: pref.id || "",
    },
  });

  const url = isMpProduction() ? pref.init_point || pref.sandbox_init_point : pref.sandbox_init_point || pref.init_point;
  if (!url) redirect(`/checkout?plan=${plan}&canceled=1`);
  redirect(url);
}

export async function fulfillMercadoPagoPayment(paymentId: string) {
  if (!paymentId) return { ok: false as const, status: "missing" };
  const payment = (await mpApi(`/v1/payments/${paymentId}`)) as {
    id: number;
    status: string;
    transaction_amount: number;
    external_reference?: string;
  };
  const [userId, plan] = String(payment.external_reference || "").split(":");
  if (!userId || !paidPlan(plan)) return { ok: false as const, status: payment.status };

  if (payment.status === "approved") {
    const existing = await prisma.payment.findFirst({
      where: { stripePaymentId: String(payment.id), status: "paid" },
    });
    if (!existing) {
      await activatePaidPlan(userId, plan, {
        provider: "mercadopago",
        stripeSessionId: String(payment.id),
        stripeSubscriptionId: `mp_${payment.id}`,
        amount: payment.transaction_amount,
        periodEnd: addDays(30),
      });
    }
  }
  return { ok: payment.status === "approved", status: payment.status };
}

export async function saveMercadoPagoTokenAction(formData: FormData) {
  const user = await requireUser();
  if (!user) return { error: "Faça login." };
  const token = String(formData.get("mpAccessToken") || "").trim();
  if (!token) return { error: "Cole o Access Token de produção do Mercado Pago." };
  if (!token.startsWith("APP_USR-") && !token.startsWith("TEST-")) {
    return { error: "Token inválido. Produção começa com APP_USR-." };
  }
  saveMpAccessToken(token);
  return { ok: true };
}

export async function cancelPlanAction() {
  const user = await requireUser();
  const stripe = stripeClient();
  if (stripe && user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch {
      /* already canceled */
    }
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "free",
      planStatus: "canceled",
      stripeSubscriptionId: "",
    },
  });
  redirect("/dashboard/settings");
}

export async function openBillingPortalAction() {
  const user = await requireUser();
  const stripe = stripeClient();
  if (!stripe || !user.stripeCustomerId) {
    redirect("/dashboard/settings?billing=unavailable");
  }
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl()}/dashboard/settings`,
  });
  redirect(portal.url);
}

export async function fulfillStripeSession(sessionId: string) {
  const stripe = stripeClient();
  if (!stripe) return;
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  const userId = (session.client_reference_id || session.metadata?.userId) as string | undefined;
  const plan = (session.metadata?.plan || "") as string;
  if (!userId || !paidPlan(plan)) return;
  if (session.payment_status !== "paid" && session.status !== "complete") return;

  const existing = await prisma.payment.findFirst({ where: { stripeSessionId: session.id, status: "paid" } });
  if (existing) return;

  const sub = session.subscription as
    | string
    | (Stripe.Subscription & { current_period_end?: number; items?: { data: { current_period_end?: number }[] } })
    | null;
  const subId = typeof sub === "string" ? sub : sub?.id || "";
  const unix =
    typeof sub === "object" && sub
      ? sub.current_period_end || sub.items?.data?.[0]?.current_period_end
      : undefined;
  const periodEnd = unix ? new Date(unix * 1000) : addDays(30);

  await activatePaidPlan(userId, plan, {
    provider: "stripe",
    stripeCustomerId: String(session.customer || ""),
    stripeSubscriptionId: subId,
    stripeSessionId: session.id,
    periodEnd,
    amount: (session.amount_total || planPriceCents(plan)) / 100,
  });
}

export async function applyStripeSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const plan = subscription.metadata?.plan;
  if (!userId) return;
  const cycle = subscription as Stripe.Subscription & {
    current_period_end?: number;
    items: { data: { current_period_end?: number }[] };
  };
  const unix = cycle.current_period_end || cycle.items?.data?.[0]?.current_period_end;
  const periodEnd = unix ? new Date(unix * 1000) : addDays(30);
  if (subscription.status === "canceled" || subscription.status === "unpaid") {
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "free", planStatus: subscription.status, stripeSubscriptionId: "", planPeriodEnd: new Date() },
    });
    return;
  }
  if (plan && paidPlan(plan)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        planStatus: subscription.status === "active" || subscription.status === "trialing" ? "active" : subscription.status,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: String(subscription.customer),
        planPeriodEnd: periodEnd,
      },
    });
  }
}

export async function expireSandboxPlans() {
  await prisma.user.updateMany({
    where: {
      plan: { not: "free" },
      planPeriodEnd: { lt: new Date() },
      stripeSubscriptionId: "",
    },
    data: { plan: "free", planStatus: "expired" },
  });
}

async function markQuotePaid(quoteId: string, extra?: { provider?: string; providerRef?: string; amount?: number }) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return;
  const now = new Date();
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      paymentStatus: "paid",
      paidAt: now,
      status: "accepted",
      acceptedAt: quote.acceptedAt || now,
    },
  });
  await prisma.followUp.updateMany({
    where: { quoteId: quote.id, status: "pending" },
    data: { status: "cancelled" },
  });
  if (extra?.providerRef) {
    const existing = await prisma.payment.findFirst({
      where: {
        quoteId: quote.id,
        kind: "quote",
        OR: [{ stripePaymentId: extra.providerRef }, { stripeSessionId: extra.providerRef }],
      },
    });
    if (existing) {
      await prisma.payment.update({
        where: { id: existing.id },
        data: {
          status: "paid",
          paidAt: now,
          provider: extra.provider || existing.provider,
          stripePaymentId: extra.providerRef,
        },
      });
    } else {
      const pending = await prisma.payment.findFirst({
        where: { quoteId: quote.id, kind: "quote", status: { not: "paid" } },
        orderBy: { createdAt: "desc" },
      });
      if (pending) {
        await prisma.payment.update({
          where: { id: pending.id },
          data: {
            status: "paid",
            paidAt: now,
            provider: extra.provider || pending.provider,
            stripePaymentId: extra.providerRef,
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            userId: quote.userId,
            quoteId: quote.id,
            kind: "quote",
            provider: extra.provider || "mercadopago",
            status: "paid",
            amount: extra.amount ?? quote.total,
            stripePaymentId: extra.providerRef,
            stripeSessionId: extra.providerRef,
            paidAt: now,
          },
        });
      }
    }
  } else {
    await prisma.payment.updateMany({
      where: { quoteId: quote.id },
      data: { status: "paid", paidAt: now },
    });
  }
}

export async function saveMpReceiveTokenAction(formData: FormData) {
  const user = await requireUser();
  const token = String(formData.get("mpReceiveToken") || "").trim();
  if (!token) return { error: "Cole o Access Token da sua conta Mercado Pago." };
  if (!isMpToken(token)) {
    return { error: "Token inválido. Produção começa com APP_USR-; teste com TEST-." };
  }
  await prisma.user.update({ where: { id: user.id }, data: { mpReceiveToken: token } });
  return { ok: true, hint: mpTokenHintFrom(token) };
}

export async function startQuoteCheckoutAction(token: string) {
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: { user: true, customer: true },
  });
  if (!quote) return { error: "Orçamento não encontrado." };
  if (quote.paymentStatus === "paid") return { ok: true as const };

  const receiveToken = quote.user.mpReceiveToken.trim();
  if (!receiveToken) return { error: "Pagamento automático ainda não foi configurado." };

  if (quote.validUntil < new Date() && quote.status !== "accepted") {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "expired" } });
    return { error: "Este orçamento expirou." };
  }

  if (quote.status !== "accepted") {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "accepted", acceptedAt: new Date() },
    });
    await prisma.followUp.updateMany({
      where: { quoteId: quote.id, status: "pending" },
      data: { status: "cancelled" },
    });
  }

  const base = appUrl();
  const back = `${base}/o/${token}`;
  const https = base.startsWith("https://");
  const title = `Orçamento #${quote.number} · ${quote.title}`.slice(0, 250);

  const body: Record<string, unknown> = {
    items: [
      {
        id: quote.id,
        title,
        description: `Para ${quote.customer.name}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: Math.round(quote.total * 100) / 100,
      },
    ],
    payer: {
      name: quote.customer.name,
      ...(quote.customer.email ? { email: quote.customer.email } : {}),
    },
    back_urls: {
      success: back,
      failure: back,
      pending: back,
    },
    external_reference: `quote:${token}`,
    statement_descriptor: (quote.user.companyName || "ORCAMENTO").replace(/[^A-Za-z0-9 ]/g, "").slice(0, 22) || "ORCAMENTO",
    metadata: { quoteId: quote.id, token, userId: quote.userId, kind: "quote" },
    payment_methods: { installments: 12 },
  };
  if (https) {
    body.auto_return = "approved";
    body.notification_url = `${base}/api/mercadopago/webhook?uid=${encodeURIComponent(quote.userId)}&kind=quote`;
  }

  let pref: { id?: string; init_point?: string; sandbox_init_point?: string };
  try {
    pref = (await mpApiWithToken(receiveToken, "/checkout/preferences", {
      method: "POST",
      body: JSON.stringify(body),
    })) as typeof pref;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no Mercado Pago";
    return { error: message };
  }

  await prisma.payment.create({
    data: {
      userId: quote.userId,
      quoteId: quote.id,
      kind: "quote",
      provider: "mercadopago",
      status: "pending",
      amount: quote.total,
      stripeSessionId: pref.id || "",
    },
  });

  const prod = receiveToken.startsWith("APP_USR-");
  const url = prod ? pref.init_point || pref.sandbox_init_point : pref.sandbox_init_point || pref.init_point;
  if (!url) return { error: "Não foi possível abrir o pagamento." };
  return { ok: true as const, url };
}

export async function fulfillQuoteMpPayment(paymentId: string, userId: string) {
  if (!paymentId || !userId) return { ok: false as const, status: "missing" };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mpReceiveToken) return { ok: false as const, status: "no-token" };

  let payment: {
    id: number;
    status: string;
    transaction_amount: number;
    external_reference?: string;
  };
  try {
    payment = (await mpApiWithToken(user.mpReceiveToken, `/v1/payments/${paymentId}`)) as typeof payment;
  } catch {
    return { ok: false as const, status: "lookup-failed" };
  }

  const ref = String(payment.external_reference || "");
  const [, publicTokenValue] = ref.split(":");
  if (!publicTokenValue) return { ok: false as const, status: payment.status };

  const quote = await prisma.quote.findUnique({ where: { publicToken: publicTokenValue } });
  if (!quote || quote.userId !== userId) return { ok: false as const, status: payment.status };

  if (payment.status === "approved") {
    await markQuotePaid(quote.id, {
      provider: "mercadopago",
      providerRef: String(payment.id),
      amount: payment.transaction_amount,
    });
  } else if (payment.status === "pending" && quote.paymentStatus !== "paid") {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { paymentStatus: "pending", status: "accepted", acceptedAt: quote.acceptedAt || new Date() },
    });
  }

  return { ok: payment.status === "approved", status: payment.status };
}

export async function customerMarkPaidAction(token: string) {
  const quote = await prisma.quote.findUnique({ where: { publicToken: token } });
  if (!quote) return { error: "Orçamento não encontrado." };
  if (quote.validUntil < new Date() && quote.status !== "accepted") {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "expired" } });
    return { error: "Este orçamento expirou." };
  }
  if (quote.paymentStatus === "paid") return { ok: true };
  const now = new Date();
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "accepted",
      acceptedAt: quote.acceptedAt || now,
      paymentStatus: "pending",
    },
  });
  await prisma.followUp.updateMany({
    where: { quoteId: quote.id, status: "pending" },
    data: { status: "cancelled" },
  });
  return { ok: true };
}

export async function ownerConfirmPaymentAction(quoteId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login." };
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId: user.id } });
  if (!quote) return { error: "Orçamento não encontrado." };
  await markQuotePaid(quote.id, { provider: "manual" });
  return { ok: true };
}

export async function quotePixData(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { user: true },
  });
  if (!quote) return null;
  const recv = receivePixForUser(quote.user);
  const key = normalizePixKey(recv.key, recv.type);
  if (!key) return null;
  if (recv.inferred) {
    await prisma.user.update({
      where: { id: quote.userId },
      data: { pixKey: recv.key, pixKeyType: recv.type, pixName: recv.name, pixCity: recv.city },
    });
  }
  const txid = `OF${quote.number}${publicToken(6)}`.slice(0, 25);
  const qrOpts = { margin: 1, width: 280 } as const;
  const existing = await prisma.payment.findFirst({
    where: { quoteId: quote.id, kind: "quote", pixPayload: { not: "" } },
    orderBy: { createdAt: "desc" },
  });
  if (existing?.pixPayload) {
    const qrDataUrl = await QRCode.toDataURL(existing.pixPayload, qrOpts);
    return { payload: existing.pixPayload, qrDataUrl, amount: quote.total, company: quote.user.companyName };
  }
  const payload = buildPixPayload({
    key,
    name: recv.name,
    city: recv.city,
    amount: quote.total,
    txid,
    description: `Orcamento ${quote.number}`,
  });
  const qrDataUrl = await QRCode.toDataURL(payload, qrOpts);
  await prisma.payment.create({
    data: {
      userId: quote.userId,
      quoteId: quote.id,
      kind: "quote",
      provider: "pix",
      status: quote.paymentStatus === "paid" ? "paid" : "pending",
      amount: quote.total,
      pixPayload: payload,
      pixTxid: txid,
      paidAt: quote.paidAt,
    },
  });
  return { payload, qrDataUrl, amount: quote.total, company: quote.user.companyName };
}
