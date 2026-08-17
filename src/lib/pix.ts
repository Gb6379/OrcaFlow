function emv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(data: string) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function toPixAscii(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max) || "ORCAFLOW";
}

export function guessPixType(key: string) {
  const raw = key.trim();
  if (!raw) return "email";
  if (raw.includes("@")) return "email";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 14) return "cnpj";
  if (digits.length === 11 && (raw.includes(".") || raw.includes("-"))) return "cpf";
  if (digits.length >= 10 && digits.length <= 13) return "phone";
  if (digits.length === 11) return "cpf";
  return "random";
}

export function receivePixForUser(user: {
  pixKey: string;
  pixKeyType: string;
  pixName: string;
  pixCity: string;
  phone: string;
  whatsapp: string;
  email: string;
  cnpj: string;
  companyName: string;
  name: string;
}) {
  const name = user.pixName || user.companyName || user.name;
  const city = user.pixCity || "Sao Paulo";
  if (user.pixKey.trim()) {
    return {
      key: user.pixKey.trim(),
      type: user.pixKeyType || guessPixType(user.pixKey),
      name,
      city,
      inferred: false,
    };
  }
  const phone = user.whatsapp || user.phone;
  if (phone.replace(/\D/g, "").length >= 10) {
    return { key: phone, type: "phone" as const, name, city, inferred: true };
  }
  if (user.email.includes("@")) {
    return { key: user.email, type: "email" as const, name, city, inferred: true };
  }
  const digits = user.cnpj.replace(/\D/g, "");
  if (digits.length === 14) return { key: user.cnpj, type: "cnpj" as const, name, city, inferred: true };
  if (digits.length === 11) return { key: user.cnpj, type: "cpf" as const, name, city, inferred: true };
  return { key: "", type: user.pixKeyType || "email", name, city, inferred: false };
}

export function normalizePixKey(key: string, type: string) {
  const raw = key.trim();
  if (!raw) return "";
  if (type === "email" || raw.includes("@")) return raw.toLowerCase();
  if (type === "phone") {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (!digits.startsWith("55")) digits = `55${digits}`;
    return `+${digits}`;
  }
  if (type === "cpf" || type === "cnpj") return raw.replace(/\D/g, "");
  return raw;
}

export function buildPixPayload({
  key,
  name,
  city,
  amount,
  txid,
  description,
}: {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid: string;
  description?: string;
}) {
  const merchant =
    emv("00", "br.gov.bcb.pix") +
    emv("01", key) +
    (description ? emv("02", description.slice(0, 25)) : "");
  const additional = emv("62", emv("05", (txid || "***").slice(0, 25)));
  const payload =
    emv("00", "01") +
    emv("01", "12") +
    emv("26", merchant) +
    emv("52", "0000") +
    emv("53", "986") +
    emv("54", amount.toFixed(2)) +
    emv("58", "BR") +
    emv("59", toPixAscii(name, 25)) +
    emv("60", toPixAscii(city, 15)) +
    additional +
    "6304";
  return payload + crc16(payload);
}
