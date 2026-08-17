export type PlanId = "free" | "starter" | "pro" | "business";

export const PLAN_LABEL: Record<string, string> = {
  free: "Inicial",
  starter: "Essencial",
  pro: "Fechador",
  business: "Equipe",
};

export function planLabel(plan: string) {
  return PLAN_LABEL[plan] || PLAN_LABEL.free;
}

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Inicial",
    price: 0,
    priceLabel: "R$ 0",
    blurb: "Comece sem escolher plano. 5 orçamentos por mês.",
    features: ["5 orçamentos por mês", "Modelos básicos", "Link profissional", "Sem follow-up automático"],
  },
  {
    id: "starter",
    name: "Essencial",
    price: 29,
    priceLabel: "R$ 29",
    blurb: "O básico para parar de mandar orçamento em PDF feio.",
    features: [
      "Orçamentos ilimitados",
      "Logo da empresa",
      "Rastreio Enviado → Visualizado → Aceito",
      "PDF",
      "Cadastro de clientes",
    ],
  },
  {
    id: "pro",
    name: "Fechador",
    price: 59,
    priceLabel: "R$ 59",
    blurb: "O plano que fecha orçamento no automático.",
    highlight: true,
    features: [
      "Tudo do Essencial",
      "Criação de orçamento com IA",
      "Follow-up automático (dia 0, 2 e 5)",
      "Integração WhatsApp",
      "Página personalizada",
      "Analytics de conversão",
    ],
  },
  {
    id: "business",
    name: "Equipe",
    price: 99,
    priceLabel: "R$ 99",
    blurb: "Para quem já tem gente na rua fechando serviço.",
    features: [
      "Tudo do Fechador",
      "Vários colaboradores",
      "Automação avançada",
      "Links de pagamento",
      "Assistente de IA",
      "Suporte prioritário",
    ],
  },
];

const RANK: Record<PlanId, number> = { free: 0, starter: 1, pro: 2, business: 3 };

export function planRank(plan: string) {
  return RANK[(plan as PlanId) || "free"] ?? 0;
}

export function hasPlan(userPlan: string, min: PlanId) {
  return planRank(userPlan) >= RANK[min];
}

export function normalizePlan(plan?: string | null): PlanId {
  if (plan === "starter" || plan === "pro" || plan === "business") return plan;
  return "free";
}

export function monthlyQuoteLimit(plan: string) {
  return normalizePlan(plan) === "free" ? 5 : Infinity;
}

export function canCreateQuote(plan: string, quotesThisMonth: number) {
  const limit = monthlyQuoteLimit(plan);
  return quotesThisMonth < limit;
}

export function quoteUsage(plan: string, quotesThisMonth: number) {
  const normalized = normalizePlan(plan);
  const limit = monthlyQuoteLimit(normalized);
  const used = quotesThisMonth || 0;
  const remaining = Number.isFinite(limit) ? Math.max(0, limit - used) : Infinity;
  return {
    plan: normalized,
    used,
    limit,
    remaining,
    atLimit: !canCreateQuote(normalized, used),
  };
}

export function checkoutHref(planId: string, loggedIn: boolean) {
  if (planId === "free") return loggedIn ? "/dashboard" : "/register";
  return loggedIn ? `/checkout?plan=${planId}` : `/register?plan=${planId}`;
}
