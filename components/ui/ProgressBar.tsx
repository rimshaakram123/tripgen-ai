import { ReactNode } from "react";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: ReactNode;
  showValue?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && <span className="text-white-soft">{label}</span>}
          {showValue && <span className="text-gray-soft">{percent}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-midnight">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet to-cyan transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
