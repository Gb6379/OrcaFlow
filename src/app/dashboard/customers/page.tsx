import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomersManager } from "@/components/CustomersManager";

export default async function CustomersPage() {
  const user = await requireUser();
  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    include: { quotes: true },
    orderBy: { name: "asc" },
  });

  return (
    <CustomersManager
      customers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        notes: c.notes,
        quotesCount: c.quotes.length,
        won: c.quotes.filter((q) => q.status === "accepted").reduce((s, q) => s + q.total, 0),
      }))}
    />
  );
}
