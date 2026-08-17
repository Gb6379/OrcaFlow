import { statusLabel } from "@/lib/format";

const styles: Record<string, string> = {
  draft: "bg-sand text-ink/80",
  sent: "bg-forest-mist text-forest-dark",
  viewed: "bg-amber-100 text-amber-900",
  accepted: "bg-emerald-100 text-emerald-800",
  expired: "bg-stone-200 text-stone-600",
  declined: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${styles[status] || styles.draft}`}
    >
      {statusLabel(status)}
    </span>
  );
}
