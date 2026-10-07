import { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "violet" | "cyan";

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-white/10 text-gray-soft border-white/10",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  violet: "bg-violet/15 text-violet border-violet/30",
  cyan: "bg-cyan/15 text-cyan border-cyan/30",
};

export default function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
