"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, FlaskConical, ClipboardCheck } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/demo", label: "Demostración", icon: FlaskConical },
  { href: "/historial", label: "Historial", icon: History },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/65">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Principal" className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link prefetch={false}
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "hidden sm:inline-flex",
                pathname.startsWith(href) && "bg-accent text-accent-foreground",
              )}
            >
              <Icon aria-hidden /> {label}
            </Link>
          ))}
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link prefetch={false}
              key={`m-${href}`}
              href={href}
              aria-label={label}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "sm:hidden")}
            >
              <Icon aria-hidden />
            </Link>
          ))}
          <ThemeToggle />
          <Link prefetch={false}
            href="/evaluacion"
            className={cn(buttonVariants({ size: "lg" }), "ml-1 hidden sm:inline-flex")}
          >
            <ClipboardCheck aria-hidden /> Iniciar evaluación
          </Link>
        </nav>
      </div>
    </header>
  );
}
