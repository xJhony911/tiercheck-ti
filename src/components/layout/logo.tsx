import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Logotipo textual TierCheck TI. */
export function Logo({ className, href = "/" }: { className?: string; href?: string | null }) {
  const content = (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-electric to-navy text-white shadow-sm">
        <ShieldCheck className="size-4.5" aria-hidden />
      </span>
      <span className="text-lg">
        Tier<span className="text-electric">Check</span>
        <span className="ml-1 rounded bg-navy px-1.5 py-0.5 text-xs font-bold text-white align-middle dark:bg-electric">
          TI
        </span>
      </span>
    </span>
  );
  return href ? (
    <Link prefetch={false} href={href} aria-label="TierCheck TI, ir al inicio">
      {content}
    </Link>
  ) : (
    content
  );
}
