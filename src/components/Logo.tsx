export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <a href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill={light ? "#F4EFE4" : "#0B5F4B"} />
        <path
          d="M8 20.5c3.2-6 6.2-9 10.8-11.2"
          stroke={light ? "#0B5F4B" : "#F4EFE4"}
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="22" cy="10" r="2.4" fill="#D4511A" />
      </svg>
      <span className={`font-serif text-xl tracking-tight ${light ? "text-cream" : "text-ink"}`}>
        Orça<span className="text-forest">Flow</span>
      </span>
    </a>
  );
}
