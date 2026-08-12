"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { getPublicPickerRecords } from "@/lib/api";
import { LinkedRecordList } from "./LinkedRecordPicker";

interface LinkedRecordFormFieldProps {
  foreignTableId: string;
  single: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function singularize(name: string): string {
  const n = name.trim();
  if (n.length > 2 && n.endsWith("s") && !n.endsWith("es")) return n.slice(0, -1);
  if (n.length > 3 && n.endsWith("es")) return n.slice(0, -2);
  return n;
}

export function LinkedRecordFormField({
  foreignTableId,
  single,
  value,
  onChange,
  error,
}: LinkedRecordFormFieldProps) {
  const [tableName, setTableName] = useState("tabla vinculada");
  const [namesCache, setNamesCache] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    getPublicPickerRecords(foreignTableId, { limit: 20 }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setTableName(res.table_name);
        const pf = res.fields.find((f) => f.is_primary) || res.fields[0];
        const map: Record<string, string> = {};
        res.records.forEach((r) => {
          const v = pf ? r.fields[pf.id] : undefined;
          map[r.id] = v !== null && v !== undefined && String(v).trim() !== "" ? String(v) : r.id;
        });
        setNamesCache(map);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [foreignTableId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const ids = value.split(",").filter(Boolean);

  const openModal = () => {
    setDraft(ids);
    setOpen(true);
  };

  const handleSelect = (newIds: string[]) => {
    if (single) {
      onChange(newIds.join(","));
      setOpen(false);
    } else {
      setDraft(newIds);
    }
  };

  const handleConfirm = () => {
    onChange(draft.join(","));
    setOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(ids.filter((i) => i !== id).join(","));
  };

  return (
    <div>
      <div
        className={`rounded-xl border px-4 py-3 ${
          error ? "border-red-400" : "border-brand-border"
        }`}
      >
        <p className="text-xs font-medium text-brand-muted uppercase tracking-wide mb-2">
          {tableName}
        </p>

        {ids.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {ids.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-brand-surface border border-brand-border text-brand-ink max-w-[160px]"
                title={namesCache[id] || id}
              >
                <span className="truncate">{namesCache[id] || id}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="shrink-0 text-brand-muted hover:text-red-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline cursor-pointer"
        >
          <Plus size={14} />
          {ids.length > 0 && single
            ? `Cambiar ${singularize(tableName)}`
            : `Agregar ${singularize(tableName)}`}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-[420px] max-w-[92vw] h-[65vh] max-h-[560px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border shrink-0">
              <h3 className="text-sm font-semibold text-brand-ink">
                Seleccionar de {tableName}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <LinkedRecordList
                tableId={foreignTableId}
                selectedIds={single ? ids : draft}
                single={single}
                onSelect={handleSelect}
                publicApi
                onData={({ tableName: tn, records, fields: listFields }) => {
                  setTableName(tn);
                  const pf = listFields.find((f) => f.is_primary) || listFields[0];
                  setNamesCache((prev) => {
                    const next = { ...prev };
                    records.forEach((r) => {
                      const v = pf ? r.fields[pf.id] : undefined;
                      next[r.id] = v !== null && v !== undefined && String(v).trim() !== "" ? String(v) : r.id;
                    });
                    return next;
                  });
                }}
              />
            </div>

            {!single && (
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-brand-border shrink-0">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-brand-muted hover:bg-brand-surface rounded-md transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-md transition-colors cursor-pointer"
                >
                  Listo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
