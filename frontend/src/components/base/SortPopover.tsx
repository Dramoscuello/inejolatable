"use client";

import { useRef, useEffect } from "react";
import { X, GripVertical, Plus, ArrowUpDown } from "lucide-react";
import type { Field } from "@/lib/api";
import { useBaseStore } from "@/store/useBaseStore";

interface SortPopoverProps {
  fields: Field[];
  position: { x: number; y: number };
  onClose: () => void;
}

function getDirectionLabel(field: Field, direction: "asc" | "desc"): string {
  const type = field.field_type;
  const isNumeric = ["number", "currency", "percent", "duration", "rating", "autoNumber"].includes(type);
  const isDate = ["date", "dateTime", "createdTime", "lastModifiedTime"].includes(type);
  if (isDate) return direction === "asc" ? "Más antiguo → Reciente" : "Reciente → Más antiguo";
  if (isNumeric) return direction === "asc" ? "1 → 9" : "9 → 1";
  if (type === "checkbox") return direction === "asc" ? "☐ → ☑" : "☑ → ☐";
  return direction === "asc" ? "A → Z" : "Z → A";
}

export function SortPopover({ fields, position, onClose }: SortPopoverProps) {
  const { activeSorts, addSort, removeSort, setSorts, hasAutoSort, setHasAutoSort } = useBaseStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const usedIds = new Set(activeSorts.map((s) => s.fieldId));
  const availFields = fields.filter((f) => !usedIds.has(f.id));

  const handleReorder = (from: number, to: number) => {
    const updated = [...activeSorts];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setSorts(updated);
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border w-72 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-2 border-b border-brand-border flex items-center justify-between">
        <span className="text-sm font-medium text-brand-ink">Ordenar por</span>
      </div>

      <div className="py-1">
        {activeSorts.map((sort, i) => {
          const field = fields.find((f) => f.id === sort.fieldId);
          return (
            <div key={sort.fieldId} className="flex items-center gap-1.5 px-2 py-1.5 group">
              <GripVertical size={12} className="text-brand-border-strong shrink-0 cursor-grab" />
              <div className="flex-1 flex items-center gap-1.5">
                <select
                  value={sort.fieldId}
                  onChange={(e) => addSort(e.target.value, sort.direction)}
                  className="flex-1 rounded-md border border-brand-border bg-white px-2 py-1 text-xs text-brand-ink outline-none focus:border-brand-blue"
                >
                  {field && <option value={field.id}>{field.name}</option>}
                  {availFields.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <select
                  value={sort.direction}
                  onChange={(e) => addSort(sort.fieldId, e.target.value as "asc" | "desc")}
                  className="rounded-md border border-brand-border bg-white px-2 py-1 text-xs text-brand-ink outline-none focus:border-brand-blue"
                >
                  <option value="asc">{field ? getDirectionLabel(field, "asc") : "A → Z"}</option>
                  <option value="desc">{field ? getDirectionLabel(field, "desc") : "Z → A"}</option>
                </select>
              </div>
              <button
                onClick={() => removeSort(sort.fieldId)}
                className="p-0.5 rounded text-brand-muted hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {availFields.length > 0 && (
          <button
            onClick={() => addSort(availFields[0].id, "asc")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-muted hover:text-brand-blue hover:bg-brand-surface transition-colors cursor-pointer w-full text-left"
          >
            <Plus size={12} />
            Añadir otra ordenación
          </button>
        )}
      </div>

      <div className="border-t border-brand-border px-3 py-2">
        <button
          onClick={() => setHasAutoSort(!hasAutoSort)}
          className="flex items-center gap-2.5 w-full text-xs cursor-pointer"
        >
          <div
            className={`w-8 h-5 rounded-full transition-colors relative shrink-0 ${
              hasAutoSort ? "bg-brand-success" : "bg-brand-border"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                hasAutoSort ? "left-[14px]" : "left-0.5"
              }`}
            />
          </div>
          <span className="text-brand-ink">Ordenar automáticamente</span>
        </button>
      </div>
    </div>
  );
}
