"use client";

import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

interface Rule {
  label: string;
  test: (value: string) => boolean;
}

const rules: Rule[] = [
  { label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { label: "Al menos 1 letra", test: (v) => /[a-zA-Z]/.test(v) },
  { label: "Al menos 1 número", test: (v) => /[0-9]/.test(v) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const passed = rules.filter((r) => r.test(password)).length;
  const total = rules.length;
  const show = password.length > 0;

  if (!show) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {rules.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              passed === total
                ? "bg-brand-success"
                : i < passed
                  ? "bg-brand-yellow"
                  : "bg-brand-surface-strong"
            }`}
          />
        ))}
      </div>
      <ul className="flex flex-col gap-0.5">
        {rules.map((rule, i) => {
          const ok = rule.test(password);
          return (
            <li
              key={i}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                ok ? "text-brand-success" : "text-brand-muted"
              }`}
            >
              {ok ? <Check size={12} /> : <X size={12} />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
