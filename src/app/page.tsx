import { Logo } from "@/components/Logo";
import { QuotePreview } from "@/components/QuotePreview";
import { loginDemoAction } from "./actions";
import { checkoutHref, PLANS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/auth";

const trades = [
  "Eletricistas",
  "Encanadores",
  "Mecânicos",
  "Técnicos de ar-condicionado",
  "Pedreiros",
  "Pintores",
  "Fotógrafos",
  "Limpeza",
  "Web designers",
  "Manutenção",
  "Freelancers",
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="paper-grid min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <a href="/pricing" className="hidden rounded-full px-4 py-2 sm:inline">
            Preços
          </a>
          {user ? (
            <a href="/dashboard" className="btn-forest">
              Abrir painel
            </a>
          ) : (
            <>
              <a href="/login" className="btn-ghost">
                Entrar
              </a>
              <a href="/register" className="btn-primary">
                Começar grátis
              </a>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-2 lg:pt-16">
        <div>
          <p className="inline-flex rounded-full bg-forest-mist px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-forest-dark">
            Feito para quem vive de serviço
          </p>
          <h1 className="mt-5 font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Pare de perder cliente porque esqueceu de cobrar o orçamento.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-mute">
            O cliente pede preço no WhatsApp. O OrçaFlow vira isso em orçamento profissional,
            link bonito e follow-up automático no dia 0, 2 e 5.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/register" className="btn-primary px-6 py-3">
              Criar conta grátis
            </a>
            <form action={loginDemoAction}>
              <button className="btn-ghost px-6 py-3">Ver conta demo</button>
            </form>
          </div>
          <p className="mt-4 text-sm text-mute">5 orçamentos grátis por mês. Sem cartão.</p>
        </div>
        <QuotePreview
          companyName="Silva Climatização"
          number={1042}
          customerName="João Silva"
          title="Instalação de 3 aparelhos de ar-condicionado"
          items={[
            { description: "Mão de obra", quantity: 3, unitPrice: 300, kind: "labor" },
            { description: "Material", quantity: 1, unitPrice: 350, kind: "material" },
          ]}
          discountType="none"
          discountValue={0}
          validDays={7}
        />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <p className="text-xs uppercase tracking-[0.2em] text-mute">O problema</p>
        <h2 className="mt-2 max-w-3xl font-serif text-4xl">
          Ler, calcular, escrever, gerar PDF, mandar, esperar e lembrar de cobrar. A maioria para no mandar.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Pedido chega", "Quanto fica pra instalar 3 ar-condicionados?"],
            ["O dono improvisa", "Calcula no caderno, manda um texto torto no WhatsApp."],
            ["Ninguém cobra", "O cliente esfria. O serviço vai para o concorrente."],
          ].map(([title, body]) => (
            <div key={title} className="card p-6">
              <p className="font-serif text-2xl">{title}</p>
              <p className="mt-2 text-mute">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-forest text-cream">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">A virada</p>
          <h2 className="mt-2 font-serif text-4xl">Pedido → orçamento → link → aceite → follow-up</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["1", "Monta em segundos", "Formulário, texto solto ou áudio. A IA organiza mão de obra, material e desconto."],
              ["2", "Página profissional", "O cliente abre um link bonito, não um PDF amassado. Um toque em Aceitar."],
              ["3", "Você vê o que aconteceu", "Enviado, visualizado, aceito. Sem perguntar se a pessoa viu."],
              ["4", "O sistema cobra por você", "Dia 0, dia 2, dia 5. WhatsApp pronto. Você só aperta enviar."],
            ].map(([n, t, b]) => (
              <div key={n} className="rounded-3xl bg-white/5 p-5">
                <p className="text-gold">{n}</p>
                <p className="mt-2 font-serif text-2xl">{t}</p>
                <p className="mt-2 text-sm text-cream/75">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-serif text-4xl">O follow-up é o produto. O orçamento é o isca.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Dia 0", "Olá João! Seu orçamento para instalação dos 3 aparelhos foi enviado. Qualquer dúvida estou à disposição."],
            ["Dia 2", "Oi João! Conseguiu analisar o orçamento que te enviei?"],
            ["Dia 5", "Olá João! Só passando para saber se ainda tem interesse na instalação. Posso ajustar o orçamento se necessário."],
          ].map(([day, msg]) => (
            <div key={day} className="card p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-ember">{day}</p>
              <p className="mt-3 whitespace-pre-line text-ink/90">{msg}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="font-serif text-4xl">Para quem vive de orçamento no WhatsApp</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {trades.map((t) => (
            <span key={t} className="rounded-full bg-sand px-4 py-2 text-sm">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section id="precos" className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="font-serif text-4xl">Barato de propósito. Volume fecha a conta.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`card p-6 ${plan.highlight ? "ring-2 ring-ember" : ""}`}
            >
              {plan.highlight && (
                <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ember">Mais vendido</p>
              )}
              <p className="text-sm text-mute">{plan.name}</p>
              <p className="mt-1 font-serif text-4xl">{plan.priceLabel}</p>
              <p className="text-sm text-mute">/mês</p>
              <p className="mt-3 text-sm">{plan.blurb}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink/80">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <a href={checkoutHref(plan.id, Boolean(user))} className={`mt-6 w-full ${plan.highlight ? "btn-primary" : "btn-forest"}`}>
                {plan.id === "free" ? "Começar grátis" : "Assinar"}
              </a>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink/10 px-5 py-8 text-center text-sm text-mute">
        OrçaFlow — o SaaS que ajuda pequenos negócios a fechar mais orçamentos.
      </footer>
    </div>
  );
}
