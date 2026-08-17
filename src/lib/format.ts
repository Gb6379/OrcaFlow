export function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export function quotePublicUrl(token: string) {
  return `${appUrl()}/o/${token}`;
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviado",
    viewed: "Visualizado",
    accepted: "Aceito",
    expired: "Expirado",
    declined: "Recusado",
  };
  return map[status] || status;
}

export function interpolate(
  template: string,
  vars: { cliente: string; servico: string; total: string; numero: string; link: string },
) {
  return template
    .replaceAll("{cliente}", vars.cliente)
    .replaceAll("{servico}", vars.servico)
    .replaceAll("{total}", vars.total)
    .replaceAll("{numero}", vars.numero)
    .replaceAll("{link}", vars.link);
}

export function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full;
}

export function paymentLabel(status: string) {
  const map: Record<string, string> = {
    unpaid: "A pagar",
    pending: "Aguardando confirmação",
    paid: "Pago",
  };
  return map[status] || status;
}

export const TRADES = [
  "Eletricista",
  "Encanador",
  "Mecânico",
  "Técnico de ar-condicionado",
  "Pedreiro",
  "Pintor",
  "Fotógrafo",
  "Empresa de limpeza",
  "Web designer",
  "Manutenção",
  "Freelancer",
  "Outro",
];
