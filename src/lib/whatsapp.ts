export function digitsOnly(phone: string) {
  return (phone || "").replace(/\D/g, "");
}

export function toWhatsAppNumber(phone: string) {
  let digits = digitsOnly(phone);
  if (!digits) return "";
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("55")) digits = `55${digits}`;
  return digits;
}

export function whatsappLink(phone: string, message: string) {
  const number = toWhatsAppNumber(phone);
  const text = encodeURIComponent(message);
  if (!number) return `https://wa.me/?text=${text}`;
  return `https://wa.me/${number}?text=${text}`;
}

export function formatPhone(phone: string) {
  const d = digitsOnly(phone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}
