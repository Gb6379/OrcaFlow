import { requireUser } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";
import { expireOldQuotes } from "@/app/actions";
import { expireSandboxPlans } from "@/app/billing-actions";
import { isAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await expireOldQuotes();
  await expireSandboxPlans();

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <DashboardNav companyName={user.companyName} plan={user.plan} admin={isAdminUser(user)} />
      <div className="min-w-0 flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-10">{children}</div>
    </div>
  );
}
