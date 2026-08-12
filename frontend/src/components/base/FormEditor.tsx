"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getForm, updateForm, publishForm } from "@/lib/api";
import type { Form, Field } from "@/lib/api";
import { Eye, EyeOff, Check, Copy, ExternalLink } from "lucide-react";

const FIELD_ICONS: Record<string, string> = {
  singleLineText: "Aa", multilineText: "¶", number: "#", currency: "$",
  percent: "%", duration: "⏱", singleSelect: "◎", multipleSelects: "☰",
  checkbox: "☑", date: "📅", dateTime: "📅", email: "@", url: "🔗",
  phoneNumber: "📞", rating: "★", attachment: "📎", multipleRecordLinks: "→",
  formula: "fx", autoNumber: "≡",
};

interface FormEditorProps {
  formId: string;
  fields: Field[];
}

export function FormEditor({ formId, fields }: FormEditorProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<Record<string, { visible: boolean; required: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    getForm(formId).then((f) => {
      setForm(f);
      setName(f.name);
      setDescription(f.description || "");
      const c = (f.config_json as Record<string, unknown> || {}) as Record<string, { visible: boolean; required: boolean }>;
      const merged: Record<string, { visible: boolean; required: boolean }> = {};
      fields.forEach((field) => {
        merged[field.id] = {
          visible: c[field.id]?.visible ?? true,
          required: c[field.id]?.required ?? false,
        };
      });
      setConfig(merged);
    }).catch(() => {});
  }, [formId, fields]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await updateForm(formId, { name, description, config_json: config });
      showToast("Formulario guardado correctamente", "success");
    } catch {
      showToast("Error al guardar el formulario", "error");
    }
    setSaving(false);
  }, [formId, name, description, config]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const f = await publishForm(formId);
      setForm(f);
      showToast("Formulario publicado correctamente", "success");
    } catch {
      showToast("Error al publicar", "error");
    }
    setPublishing(false);
  };

  const publicUrl = form?.public_hash
    ? `${window.location.origin}/f/${form.public_hash}`
    : null;

  const copyUrl = () => {
    if (publicUrl) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(publicUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          fallbackCopy(publicUrl);
        });
      } else {
        fallbackCopy(publicUrl);
      }
    }
  };

  const fallbackCopy = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold text-brand-ink mb-6">Configurar formulario</h1>

      <div className="space-y-4 mb-6">
        <Input
          label="Título"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del formulario"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-brand-ink">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 resize-none"
            placeholder="Descripción del formulario"
          />
        </div>
      </div>

      <h2 className="text-sm font-semibold text-brand-ink mb-3">Campos</h2>
      <div className="space-y-1 mb-6">
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg border border-brand-border bg-white"
          >
            <span className="text-xs text-brand-muted shrink-0 w-4">
              {FIELD_ICONS[field.field_type] || "…"}
            </span>
            <span className="flex-1 text-sm text-brand-ink truncate">{field.name}</span>
            <button
              onClick={() => {
                setConfig((prev) => ({
                  ...prev,
                  [field.id]: { ...prev[field.id], visible: !prev[field.id]?.visible },
                }));
              }}
              className={`p-1 rounded transition-colors cursor-pointer ${config[field.id]?.visible ? "text-brand-ink" : "text-brand-muted"}`}
              title={config[field.id]?.visible ? "Visible" : "Oculto"}
            >
              {config[field.id]?.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={() => {
                setConfig((prev) => ({
                  ...prev,
                  [field.id]: { ...prev[field.id], required: !prev[field.id]?.required },
                }));
              }}
              className="flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <div
                className={`w-8 h-5 rounded-full transition-colors relative ${config[field.id]?.required ? "bg-brand-success" : "bg-brand-border"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${config[field.id]?.required ? "left-[14px]" : "left-0.5"}`} />
              </div>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>

        {!form.public_hash ? (
          <Button onClick={handlePublish} disabled={publishing} className="!bg-brand-success hover:!bg-brand-success/90">
            {publishing ? "Publicando..." : "Publicar"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-muted truncate max-w-[200px]">
              /f/{form.public_hash}
            </span>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-brand-ink border border-brand-border hover:bg-brand-surface cursor-pointer"
            >
              {copied ? <Check size={12} className="text-brand-success" /> : <Copy size={12} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <a
              href={publicUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg text-brand-muted hover:text-brand-blue cursor-pointer"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
