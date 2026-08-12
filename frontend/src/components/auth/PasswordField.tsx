"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm text-brand-ink placeholder:text-brand-border-strong transition-all duration-150 outline-none ${
              error
                ? "border-brand-error focus:ring-2 focus:ring-brand-error/20"
                : "border-brand-border focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink cursor-pointer transition-colors"
            tabIndex={-1}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="text-xs text-brand-error">{error}</p>}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";
