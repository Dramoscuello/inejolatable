"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Field } from "@/lib/api";

const FIELD_TYPES = [
  { value: "singleLineText", label: "Texto" },
  { value: "multilineText", label: "Texto largo" },
  { value: "number", label: "Número" },
  { value: "currency", label: "Moneda" },
  { value: "percent", label: "Porcentaje" },
  { value: "duration", label: "Duración" },
  { value: "singleSelect", label: "Selección única" },
  { value: "multipleSelects", label: "Selección múltiple" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Fecha" },
  { value: "dateTime", label: "Fecha y hora" },
  { value: "email", label: "Correo" },
  { value: "url", label: "URL" },
  { value: "phoneNumber", label: "Teléfono" },
  { value: "rating", label: "Rating" },
  { value: "attachment", label: "Adjunto" },
  { value: "formula", label: "Fórmula" },
  { value: "autoNumber", label: "Autonumérico" },
  { value: "multipleRecordLinks", label: "Vínculo a otro registro" },
  { value: "rollup", label: "Rollup" },
  { value: "count", label: "Conteo" },
  { value: "lookup", label: "Lookup" },
  { value: "createdTime", label: "Fecha de creación" },
  { value: "lastModifiedTime", label: "Última modificación" },
  { value: "barcode", label: "Código de barras" },
  { value: "button", label: "Botón" },
];

const DESTRUCTIVE_CONVERSIONS: Record<string, string[]> = {
  attachment: ["singleLineText", "multilineText", "number", "currency", "percent", "email", "url", "phoneNumber"],
  multipleRecordLinks: ["singleLineText", "multilineText"],
};

interface FieldEditModalProps {
  field: Field;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function FieldEditModal({ field, open, onClose, onSaved }: FieldEditModalProps) {
  const [name, setName] = useState(field.name);
  const [fieldType, setFieldType] = useState(field.field_type);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(field.name);
      setFieldType(field.field_type);
      setError("");
    }
  }, [open, field]);

  if (!open) return null;

  const typeChange = fieldType !== field.field_type;
  const destructive = DESTRUCTIVE_CONVERSIONS[field.field_type]?.includes(fieldType);

  const handleSave = async () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError("");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/fields/${field.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ name: name.trim(), field_type: fieldType }),
      });
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
          <h2 className="text-lg font-semibold text-brand-ink">Editar campo</h2>
          <button onClick={onClose} className="p-1 rounded-md text-brand-muted hover:text-brand-ink transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            placeholder="Nombre del campo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-ink">Tipo</label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {typeChange && destructive && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <span className="text-yellow-600 text-sm shrink-0 mt-0.5">⚠</span>
              <p className="text-xs text-yellow-700">
                Cambiar de {field.field_type === "attachment" ? "Adjunto" : "Vínculo"} a {FIELD_TYPES.find((t) => t.value === fieldType)?.label} eliminará los datos existentes en este campo.
              </p>
            </div>
          )}

          {typeChange && !destructive && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-blue-600 text-sm shrink-0 mt-0.5">ℹ</span>
              <p className="text-xs text-blue-700">
                Se intentará convertir los valores existentes al nuevo tipo.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-brand-error">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
