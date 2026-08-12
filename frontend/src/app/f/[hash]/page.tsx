"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface FormField {
  id: string;
  name: string;
  field_type: string;
  options_json?: {
    symbol?: string;
    precision?: number;
    max?: number;
    color?: string;
    choices?: { id?: string; name: string; color?: string }[];
    durationFormat?: string;
    default?: boolean;
  } | null;
}

interface PublicForm {
  id: string;
  name: string;
  description: string | null;
  config_json: Record<string, unknown>;
  table_id: string;
  fields: FormField[];
}

async function resizeImageIfNeeded(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => {
      const maxDim = 1200;
      let { width, height } = img;
      if (width > height) {
        if (width > maxDim) { height = (height / width) * maxDim; width = maxDim; }
      } else {
        if (height > maxDim) { width = (width / height) * maxDim; height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = URL.createObjectURL(file);
  });
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const opts = field.options_json || {};
  const border = error ? "border-red-400 focus:border-red-400" : "border-brand-border focus:border-brand-blue";
  const baseStyle = `w-full rounded-xl border px-4 py-2.5 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-blue/15 ${border}`;

  switch (field.field_type) {
    case "multilineText":
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${baseStyle} resize-y`}
          placeholder={field.name}
        />
      );

    case "number":
    case "percent":
      return (
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            step="any"
            className={baseStyle}
            placeholder="0"
          />
          {field.field_type === "percent" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">%</span>
          )}
        </div>
      );

    case "currency": {
      const sym = opts.symbol || "$";
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">{sym}</span>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            step="any"
            className={`${baseStyle} pl-7`}
            placeholder="0"
          />
        </div>
      );
    }

    case "duration":
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseStyle}
          placeholder={opts.durationFormat || "h:mm:ss"}
        />
      );

    case "email":
      return (
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseStyle}
          placeholder="correo@ejemplo.com"
        />
      );

    case "url":
      return (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseStyle}
          placeholder="https://"
        />
      );

    case "phoneNumber":
      return (
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseStyle}
          placeholder="300 123 4567"
        />
      );

    case "singleSelect": {
      const choices = opts.choices || [];
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseStyle} bg-white cursor-pointer`}
        >
          <option value="">Seleccionar...</option>
          {choices.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      );
    }

    case "multipleSelects": {
      const choices = opts.choices || [];
      const selected = value.split(",").filter(Boolean);
      return (
        <div className="space-y-1.5">
          {choices.map((c) => {
            const checked = selected.includes(c.name);
            const color = c.color || "#6b7280";
            return (
              <label
                key={c.name}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const set = new Set(selected);
                    checked ? set.delete(c.name) : set.add(c.name);
                    onChange(Array.from(set).join(","));
                  }}
                  className="w-4 h-4 rounded border-brand-border text-brand-blue cursor-pointer"
                />
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${color}26`,
                    color: color,
                  }}
                >
                  {c.name}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    case "checkbox":
      return (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "")}
            className="w-4 h-4 rounded border-brand-border text-brand-blue cursor-pointer"
          />
          <span className="text-sm text-brand-ink">{field.name}</span>
        </label>
      );

    case "date":
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseStyle} bg-white`}
        />
      );

    case "dateTime":
      return (
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseStyle} bg-white`}
        />
      );

    case "rating": {
      const max = opts.max || 5;
      const color = opts.color || "#eab308";
      const current = parseInt(value) || 0;
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: max }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(String(current === i + 1 ? 0 : i + 1))}
              className="cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 20 20" fill={i < current ? color : "#d1d5db"}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      );
    }

    case "attachment":
      return (
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const reader = new FileReader();
              reader.onload = () => {
                onChange(JSON.stringify({
                  filename: file.name,
                  type: file.type,
                  size: file.size,
                  data: reader.result as string,
                }));
              };
              reader.onerror = () => {
                onChange(JSON.stringify({
                  filename: file.name,
                  type: file.type,
                  size: file.size,
                  data: "",
                }));
              };
              reader.readAsDataURL(file);
            } catch {
              onChange(JSON.stringify({
                filename: file.name,
                type: file.type,
                size: file.size,
                data: "",
              }));
            }
          }}
          className={`${baseStyle} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-brand-surface file:text-brand-ink hover:file:bg-brand-surface-strong cursor-pointer`}
        />
      );

    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseStyle}
          placeholder={field.name}
        />
      );
  }
}

export default function PublicFormPage() {
  const params = useParams();
  const hash = params.hash as string;
  const [form, setForm] = useState<PublicForm | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (form) document.title = `${form.name} — inejomaTable`;
    else document.title = "Formulario — inejomaTable";
  }, [form]);

  useEffect(() => {
    const hashOnly = hash.split("?")[0];
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API_URL}/api/v1/f/${hashOnly}`)
      .then((r) => r.json())
      .then((f: PublicForm) => {
        if (f.id) setForm(f);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hash]);

  const config = (form?.config_json || {}) as Record<string, { visible?: boolean; required?: boolean }>;
  const fields = form?.fields || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    fields.forEach((f) => {
      if (config[f.id]?.required && !values[f.id]?.trim()) {
        errs[f.id] = "Este campo es obligatorio";
      }
    });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSending(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const data: Record<string, unknown> = {};
      Object.entries(values).forEach(([k, v]) => {
        if (!v) return;
        const field = fields.find((f) => f.id === k);
        if (field?.field_type === "number" || field?.field_type === "currency" || field?.field_type === "percent" || field?.field_type === "rating") {
          const n = parseFloat(v);
          data[k] = isNaN(n) ? v : n;
        } else if (field?.field_type === "checkbox") {
          data[k] = v === "true";
        } else {
          data[k] = v;
        }
      });
      await fetch(`${API_URL}/api/v1/f/${hash.split("?")[0]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_json: data }),
      });
      setSubmitted(true);
    } catch {}
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <p className="text-brand-muted">Formulario no encontrado.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-bold text-brand-ink mb-2">¡Gracias!</h1>
          <p className="text-brand-muted mb-4">Tu respuesta ha sido enviada correctamente.</p>
          <button
            onClick={() => { setSubmitted(false); setValues({}); setErrors({}); }}
            className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue/90 transition-colors cursor-pointer"
          >
            Enviar otra respuesta
          </button>
        </div>
      </div>
    );
  }

  const visibleFields = fields.filter((f) => config[f.id]?.visible !== false);

  return (
    <div className="min-h-screen bg-brand-surface flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-brand-border p-8">
        <h1 className="text-xl font-bold text-brand-ink mb-2">{form.name}</h1>
        {form.description && (
          <p className="text-sm text-brand-muted mb-6">{form.description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {visibleFields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">
                {field.name}
                {config[field.id]?.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <FieldRenderer
                field={field}
                value={values[field.id] || ""}
                onChange={(v) => {
                  setValues((prev) => ({ ...prev, [field.id]: v }));
                  setErrors((prev) => ({ ...prev, [field.id]: "" }));
                }}
                error={errors[field.id]}
              />
              {errors[field.id] && (
                <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={sending}
            className="w-full py-2.5 rounded-xl bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}
