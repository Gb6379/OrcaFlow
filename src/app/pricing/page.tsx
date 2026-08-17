import { Logo } from "@/components/Logo";
import { checkoutHref, PLANS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/auth";

export default async function PricingPage() {
  const user = await getCurrentUser();
  return (
    <div className="paper-grid min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <a href={user ? "/dashboard/settings" : "/register"} className="btn-primary">
          {user ? "Minha assinatura" : "Começar grátis"}
        </a>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-serif text-5xl">Preço de lanche. Resultado de fechador.</h1>
        <p className="mt-4 max-w-2xl text-lg text-mute">
          Comece grátis. Cartão ou Pix no checkout. Cancele quando quiser.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`card p-6 ${plan.highlight ? "ring-2 ring-ember" : ""}`}>
              <p className="text-sm text-mute">{plan.name}</p>
              <p className="mt-1 font-serif text-4xl">{plan.priceLabel}</p>
              <p className="text-sm text-mute">/mês</p>
              <p className="mt-3 text-sm">{plan.blurb}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <a
                href={checkoutHref(plan.id, Boolean(user))}
                className={`mt-6 w-full ${plan.highlight ? "btn-primary" : "btn-forest"}`}
              >
                {plan.id === "free" ? "Começar grátis" : "Assinar"}
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
