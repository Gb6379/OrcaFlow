# OrçaFlow

SaaS for small Brazilian service businesses: create professional quotes in seconds, send a beautiful accept link, track **Enviado → Visualizado → Aceito**, and follow up automatically on day 0, 2 and 5.

The product is not “AI software”. It is: **stop losing customers because you forgot to follow up on quotes.**

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite
- Cookie sessions (jose + bcryptjs)
- Optional OpenAI for quote parsing (`OPENAI_API_KEY`)
- Heuristic Portuguese parser + Chrome voice dictation when no API key is set

## Setup

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo account

- Email: `demo@orcaflow.com.br`
- Password: `demo1234`
- Company: Silva Climatização (Pro plan, sample quotes and a due follow-up)

## What is included

- Marketing landing page and pricing
- Register / login / demo login
- Dashboard with pipeline, conversion and due follow-ups
- Quote builder: form, natural-language AI, voice
- Public quote page with **ACEITAR ORÇAMENTO** and print/PDF
- View tracking when the customer opens the link
- WhatsApp deep links for send + follow-up
- Customer database
- Plan gating (Free 5/month, Starter, Pro, Business)
- **Payments:** Mercado Pago Checkout Pro (Pix + card, production token `APP_USR-`) or Stripe Billing
- **Quote Pix:** owner saves a Pix key → customer pays with QR / copia e cola after accepting
- Editable follow-up templates (`{cliente}`, `{servico}`, `{total}`, `{numero}`, `{link}`)

## Payments

### OrçaFlow subscription (you charge the tradesperson)

Paste a **production** Mercado Pago Access Token in **Configurações** (starts with `APP_USR-`). Checkout redirects to Mercado Pago; we never store card numbers.

Webhook: `https://your-domain/api/mercadopago/webhook`

Alternatively set `STRIPE_SECRET_KEY` for Stripe Checkout subscriptions.

For webhooks and Pix return URLs, set `APP_URL` to a public **https** domain.

### Quote collection (tradesperson charges their customer)

In **Configurações**, save a Pix key. After the client taps **ACEITAR**, the public page shows a Pix QR. Money goes to the tradesperson’s key, not to OrçaFlow.

The owner confirms in **Pagamentos**.

## Env

See `.env.example`.

- `DATABASE_URL` — SQLite file
- `AUTH_SECRET` — JWT secret
- `APP_URL` — public quote links (default `http://localhost:3000`)
- `OPENAI_API_KEY` — optional; without it, the built-in Portuguese parser still works
- `MP_ACCESS_TOKEN` — Mercado Pago production Access Token (`APP_USR-…`), or paste it in Configurações
- `STRIPE_SECRET_KEY` — optional Stripe secret
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
