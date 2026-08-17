import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen bg-paper lg:flex">
      <AdminNav name={user.name} />
      <div className="min-w-0 flex-1 px-4 py-6 pb-16 lg:px-8 lg:pb-10">{children}</div>
    </div>
  );
}
