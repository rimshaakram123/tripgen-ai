import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "border border-white/10 bg-gradient-to-r from-violet via-violet-hover to-cyan text-white shadow-[0_12px_40px_rgba(124,58,237,.26)] hover:-translate-y-0.5 hover:shadow-[0_18px_52px_rgba(34,211,238,.18)]",
  secondary:
    "border border-white/10 bg-white/[0.055] text-white-soft shadow-sm hover:-translate-y-0.5 hover:border-cyan/40 hover:bg-white/[0.08]",
  ghost: "border border-transparent text-gray-soft hover:bg-white/[0.05] hover:text-white-soft",
  danger: "border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", loading = false, fullWidth = false, disabled = false, className = "", ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-2xl font-semibold tracking-[-0.01em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Working…
        </span>
      ) : children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;
