import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-brand-ink"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`rounded-xl border bg-white px-4 py-2.5 text-sm text-brand-ink placeholder:text-brand-border-strong transition-all duration-150 outline-none ${
            error
              ? "border-brand-error focus:ring-2 focus:ring-brand-error/20"
              : "border-brand-border focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-brand-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-brand-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
