import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className = "", ...props }, ref) => (
  <div className="w-full">
    {label && <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>}
    <input
      ref={ref}
      className={`w-full rounded-2xl border bg-white/[0.045] px-4 py-3.5 text-white-soft shadow-inner shadow-black/10 outline-none transition placeholder:text-gray-soft/55 focus:border-cyan/60 focus:bg-white/[0.065] focus:ring-4 focus:ring-cyan/5 ${error ? "border-danger/60" : "border-white/10"} ${className}`}
      {...props}
    />
    {error ? <p className="mt-2 text-xs text-danger">{error}</p> : hint ? <p className="mt-2 text-xs text-gray-soft">{hint}</p> : null}
  </div>
));
Input.displayName = "Input";
export default Input;
