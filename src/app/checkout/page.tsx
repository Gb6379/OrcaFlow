import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { PLANS } from "@/lib/plans";
import { paidPlan, paymentsMode } from "@/lib/billing";
import { CheckoutForm } from "@/components/CheckoutForm";
import { mpTokenHint } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string; canceled?: string; error?: string };
}) {
  const user = await getCurrentUser();
  const planId = searchParams.plan || "pro";
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan || !paidPlan(plan.id)) redirect("/pricing");
  if (!user) redirect(`/login?next=/checkout?plan=${plan.id}`);

  return (
    <div className="paper-grid min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Logo />
        <a href="/pricing" className="text-sm text-mute">
          Voltar aos planos
        </a>
      </header>
      <main className="mx-auto grid max-w-3xl gap-6 px-5 pb-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-ember">Assinatura</p>
          <h1 className="mt-2 font-serif text-4xl">{plan.name}</h1>
          <p className="mt-2 font-serif text-5xl">{plan.priceLabel}</p>
          <p className="text-mute">por mês · cancele quando quiser</p>
          <p className="mt-4 text-sm text-mute">{plan.blurb}</p>
          <ul className="mt-6 space-y-2 text-sm">
            {plan.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          {searchParams.canceled && (
            <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-sm">Pagamento cancelado. Pode tentar de novo.</p>
          )}
          {searchParams.error && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{searchParams.error}</p>
          )}
        </div>
        <CheckoutForm
          plan={plan.id}
          planName={plan.name}
          priceLabel={plan.priceLabel}
          mode={paymentsMode()}
          mpHint={mpTokenHint()}
        />
      </main>
    </div>
  );
}
