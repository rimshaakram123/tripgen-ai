import Link from "next/link";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-card p-12 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-violet/20 to-cyan/20 text-cyan">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-white-soft">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-gray-soft">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 rounded-xl bg-gradient-to-r from-violet to-cyan px-6 py-3 font-semibold text-white transition hover:scale-105"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
