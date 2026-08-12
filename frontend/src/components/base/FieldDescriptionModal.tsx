"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Field } from "@/lib/api";

interface FieldDescriptionModalProps {
  field: Field;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function FieldDescriptionModal({
  field,
  open,
  onClose,
  onSaved,
}: FieldDescriptionModalProps) {
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDescription(
        typeof field.options_json === "object" && field.options_json !== null
          ? (field.options_json as Record<string, unknown>).description as string || ""
          : ""
      );
      setError("");
    }
  }, [open, field]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const currentOptions =
        typeof field.options_json === "object" && field.options_json !== null
          ? (field.options_json as Record<string, unknown>)
          : {};
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/fields/${field.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            options_json: { ...currentOptions, description: description.trim() },
          }),
        }
      );
      if (!res.ok) throw new Error("Error al guardar");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-ink">
            Editar descripción del campo
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs text-brand-muted">
            La descripción aparece como tooltip al pasar el cursor sobre el encabezado del campo.
          </p>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el propósito de este campo..."
            rows={4}
            className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 resize-none"
            autoFocus
          />

          {error && <p className="text-xs text-brand-error">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
