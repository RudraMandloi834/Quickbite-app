import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-brand-fg placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
          error ? "border-rose-500 focus:ring-rose-500/50" : "border-brand-border"
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
