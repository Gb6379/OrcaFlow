import { NextRequest, NextResponse } from "next/server";
import { fulfillMercadoPagoPayment, fulfillQuoteMpPayment } from "@/app/billing-actions";
import { isMpConfigured, mpApi, mpApiWithToken } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const url = req.nextUrl;
  const uid = url.searchParams.get("uid") || "";
  const kind = url.searchParams.get("kind") || "";
  let type = url.searchParams.get("type") || url.searchParams.get("topic") || "";
  let id = url.searchParams.get("data.id") || url.searchParams.get("id") || "";

  if (req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as {
      type?: string;
      action?: string;
      data?: { id?: string };
    };
    type = body.type || body.action || type;
    id = String(body.data?.id || id);
  }

  if (kind === "quote" && uid) {
    if (String(type).includes("payment") && id) {
      await fulfillQuoteMpPayment(String(id), uid);
    }
    if (String(type).includes("merchant_order") && id) {
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (user?.mpReceiveToken) {
        const order = (await mpApiWithToken(user.mpReceiveToken, `/merchant_orders/${id}`)) as {
          payments?: { id: number; status: string }[];
        };
        const approved = order.payments?.find((p) => p.status === "approved");
        if (approved) await fulfillQuoteMpPayment(String(approved.id), uid);
      }
    }
    return NextResponse.json({ received: true });
  }

  if (!isMpConfigured()) {
    return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 400 });
  }

  if (String(type).includes("payment") && id) {
    await fulfillMercadoPagoPayment(String(id));
  }

  if (String(type).includes("merchant_order") && id) {
    const order = (await mpApi(`/merchant_orders/${id}`)) as {
      payments?: { id: number; status: string }[];
    };
    const approved = order.payments?.find((p) => p.status === "approved");
    if (approved) await fulfillMercadoPagoPayment(String(approved.id));
  }

  return NextResponse.json({ received: true });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
