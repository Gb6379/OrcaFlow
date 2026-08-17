import { requireUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { TRADES } from "@/lib/format";
import { mpTokenHint, mpTokenHintFrom } from "@/lib/mercadopago";
import { SettingsForms } from "@/components/SettingsForms";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-serif text-4xl">Configurações</h1>
        <p className="text-mute">A cara da empresa no orçamento, como o cliente paga e as mensagens que cobram.</p>
      </div>
      <SettingsForms
        user={{
          name: user.name,
          companyName: user.companyName,
          phone: user.phone,
          whatsapp: user.whatsapp,
          cnpj: user.cnpj,
          address: user.address,
          trade: user.trade,
          validityDays: user.validityDays,
          followUpDay0: user.followUpDay0,
          followUpDay2: user.followUpDay2,
          followUpDay5: user.followUpDay5,
          plan: user.plan,
          planStatus: user.planStatus,
          planPeriodEnd: user.planPeriodEnd?.toISOString() || null,
          pixKey: user.pixKey,
          pixKeyType: user.pixKeyType,
          pixName: user.pixName,
          pixCity: user.pixCity,
          hasStripe: Boolean(user.stripeCustomerId && process.env.STRIPE_SECRET_KEY),
          mpHint: mpTokenHint(),
          mpReceiveHint: mpTokenHintFrom(user.mpReceiveToken),
        }}
        trades={TRADES}
        plans={PLANS}
      />
    </div>
  );
}
