import Link from "next/link";

import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

export type CodeLinkProps = Omit<React.ComponentProps<typeof Link>, "children"> & {
  code: string;
};

// Code column cell. A real <a> so right-click / ctrl-click can open it in a new tab.
export const CodeLink = ({ code, className, ...props }: CodeLinkProps) => (
  <span className="inline-flex items-center gap-1">
    <Link
      {...props}
      className={cn("font-mono text-[13px] font-medium text-primary hover:underline underline-offset-4", className)}
    >
      {code}
    </Link>
    <CopyButton value={code} />
  </span>
);
