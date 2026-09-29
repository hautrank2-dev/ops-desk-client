import { Construction } from "lucide-react";

export function PageDevelop({ title }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-soft">
        <Construction className="h-7 w-7 text-muted-foreground/70" />
      </span>
      <div className="text-center">
        <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">{title ?? "Under Development"}</p>
        <p className="text-sm mt-1">This page is coming soon.</p>
      </div>
    </div>
  );
}
