"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createRecord, getTable, type Field } from "@/lib/api";
import { FieldEditor } from "./RecordExpanded";

const READ_ONLY_TYPES = new Set([
  "formula", "rollup", "lookup", "count", "autoNumber",
  "createdTime", "lastModifiedTime", "button",
]);

interface CreateRecordModalProps {
  tableId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (recordId: string) => void;
}

export function CreateRecordModal({ tableId, open, onClose, onCreated }: CreateRecordModalProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    getTable(tableId)
      .then((t) => setFields(t.fields.filter((f) => !READ_ONLY_TYPES.has(f.field_type))))
      .catch(() => setFields([]))
      .finally(() => setLoading(false));
  }, [open, tableId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const record = await createRecord(tableId, { data_json: values });
      onCreated(record.id);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-[440px] max-w-[92vw] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border shrink-0">
          <h3 className="text-sm font-semibold text-brand-ink">Crear registro</h3>
          <button onClick={onClose} className="p-1 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <p className="text-xs text-brand-muted text-center py-4">Cargando campos...</p>
          ) : (
            fields.map((field) => (
              <FieldEditor
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
              />
            ))
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-brand-border shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-brand-muted hover:bg-brand-surface rounded-md transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear registro"}
          </button>
        </div>
      </div>
    </div>
  );
}
