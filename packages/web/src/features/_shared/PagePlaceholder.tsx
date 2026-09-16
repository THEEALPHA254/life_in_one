import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PagePlaceholder({ title, subtitle, children }: Props) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </header>
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {children ?? "Not built yet."}
      </div>
    </div>
  );
}
