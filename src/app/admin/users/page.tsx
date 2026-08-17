import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { planLabel, PLAN_LABEL } from "@/lib/plans";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; plan?: string; status?: string };
}) {
  await requireAdmin();
  const q = (searchParams.q || "").trim();
  const plan = searchParams.plan || "";
  const status = searchParams.status || "";

  const users = await prisma.user.findMany({
    where: {
      ...(plan ? { plan } : {}),
      ...(status === "blocked" ? { blockedAt: { not: null } } : {}),
      ...(status === "admin" ? { role: "admin" } : {}),
      ...(status === "paid" ? { plan: { in: ["starter", "pro", "business"] } } : {}),
      ...(status === "free" ? { plan: "free" } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { name: { contains: q } },
              { companyName: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { quotes: true, customers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Usuários</h1>
        <p className="text-mute">{users.length} conta{users.length === 1 ? "" : "s"} neste filtro.</p>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/users">
        <input name="q" defaultValue={q} className="field max-w-xs" placeholder="Buscar e-mail, empresa, nome" />
        <select name="plan" className="field w-40" defaultValue={plan}>
          <option value="">Todos os planos</option>
          {Object.entries(PLAN_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <select name="status" className="field w-40" defaultValue={status}>
          <option value="">Todos</option>
          <option value="paid">Pagantes</option>
          <option value="free">Grátis</option>
          <option value="blocked">Bloqueados</option>
          <option value="admin">Admins</option>
        </select>
        <button className="btn-forest">Filtrar</button>
      </form>

      <div className="card divide-y divide-ink/5 overflow-hidden">
        {users.map((u) => (
          <a key={u.id} href={`/admin/users/${u.id}`} className="grid gap-2 px-5 py-4 hover:bg-sand/40 sm:grid-cols-[1fr_140px_80px_80px]">
            <div className="min-w-0">
              <p className="font-medium">
                {u.companyName}
                {u.role === "admin" ? <span className="ml-2 text-[11px] uppercase tracking-wider text-ember">admin</span> : null}
                {u.blockedAt ? <span className="ml-2 text-[11px] uppercase tracking-wider text-rose-700">bloqueado</span> : null}
              </p>
              <p className="truncate text-sm text-mute">
                {u.name} · {u.email}
              </p>
            </div>
            <p className="text-sm text-forest">{planLabel(u.plan)}</p>
            <p className="text-sm text-mute">{u._count.quotes} orç.</p>
            <p className="text-sm text-mute">{u.createdAt.toLocaleDateString("pt-BR")}</p>
          </a>
        ))}
        {users.length === 0 && <p className="px-5 py-10 text-mute">Nenhuma conta neste filtro.</p>}
      </div>
    </div>
  );
}
