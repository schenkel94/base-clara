import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "group rounded-2xl border border-surface-600/70 bg-gradient-to-b from-surface-800/85 to-surface-900/80 p-5 shadow-panel backdrop-blur transition duration-300 hover:border-surface-600",
        className,
      )}
    >
      <header className="mb-4 border-b border-surface-600/60 pb-3">
        <h2 className="font-display text-xl font-semibold tracking-tight text-slate-100">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-slate-300">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
