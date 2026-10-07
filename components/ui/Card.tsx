import { forwardRef, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ children, hover = true, className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`glass-panel rounded-[28px] p-6 sm:p-7 transition-all duration-300 ${hover ? "hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_24px_80px_rgba(0,0,0,.32)]" : ""} ${className}`}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = "Card";
export default Card;
