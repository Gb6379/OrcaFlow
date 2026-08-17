import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "payments.json");

export type PaymentConfig = {
  mpAccessToken: string;
};

function readFileConfig(): PaymentConfig {
  try {
    return { mpAccessToken: "", ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch {
    return { mpAccessToken: "" };
  }
}

export function getMpAccessToken() {
  return (process.env.MP_ACCESS_TOKEN || readFileConfig().mpAccessToken || "").trim();
}

export function isMpConfigured() {
  return Boolean(getMpAccessToken());
}

export function isMpProduction() {
  const token = getMpAccessToken();
  return token.startsWith("APP_USR-");
}

export function mpTokenHint() {
  return mpTokenHintFrom(getMpAccessToken());
}

export function saveMpAccessToken(token: string) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ mpAccessToken: token.trim() }, null, 2), "utf8");
}

export function isMpToken(token: string) {
  const t = token.trim();
  return t.startsWith("APP_USR-") || t.startsWith("TEST-");
}

export function mpTokenHintFrom(token: string) {
  const t = token.trim();
  if (!t) return "";
  return `${t.startsWith("APP_USR-") ? "produção" : "teste"} · …${t.slice(-6)}`;
}

export async function mpApiWithToken(token: string, pathname: string, init?: RequestInit) {
  const t = token.trim();
  if (!t) throw new Error("Mercado Pago não configurado.");
  const res = await fetch(`https://api.mercadopago.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { message?: string; error?: string }).message ||
      (data as { error?: string }).error ||
      `Mercado Pago ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function mpApi(pathname: string, init?: RequestInit) {
  return mpApiWithToken(getMpAccessToken(), pathname, init);
}
