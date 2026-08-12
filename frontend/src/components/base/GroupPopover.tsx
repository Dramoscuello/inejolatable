"use client";

import { useRef, useEffect, useState } from "react";
import { X, GripVertical, Plus, PlusCircle } from "lucide-react";
import type { Field } from "@/lib/api";
import { useBaseStore } from "@/store/useBaseStore";

const FIELD_ICONS: Record<string, string> = {
  singleLineText: "Aa", multilineText: "¶", number: "#", currency: "$",
  percent: "%", duration: "⏱", singleSelect: "◎", multipleSelects: "☰",
  checkbox: "☑", date: "📅", dateTime: "📅", email: "@", url: "🔗",
  phoneNumber: "📞", rating: "★", attachment: "📎", multipleRecordLinks: "→",
  formula: "fx", rollup: "Σ", count: "#", lookup: "👁", autoNumber: "≡",
  createdTime: "🕐", lastModifiedTime: "🕑", barcode: "⊞", button: "▶",
};

interface GroupPopoverProps {
  fields: Field[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function GroupPopover({ fields, position, onClose }: GroupPopoverProps) {
  const { activeGroups, addGroup, removeGroup, setGroups } = useBaseStore();
  const ref = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);

  const usedIds = new Set(activeGroups.map((g) => g.fieldId));
  const availFields = fields.filter((f) => !usedIds.has(f.id));

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

  const handleSelectField = (fieldId: string) => {
    addGroup(fieldId, "asc");
    setShowPicker(false);
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border w-72 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-2 border-b border-brand-border flex items-center justify-between">
        <span className="text-sm font-medium text-brand-ink">Agrupar por</span>
        {activeGroups.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-brand-muted">
            <button className="hover:text-brand-ink cursor-pointer">Colapsar todo</button>
            <button className="hover:text-brand-ink cursor-pointer">Expandir todo</button>
          </div>
        )}
      </div>

      <div className="p-2">
        {activeGroups.map((group) => {
          const field = fields.find((f) => f.id === group.fieldId);
          const otherAvail = availFields.filter((f) => f.id !== group.fieldId);
          return (
            <div key={group.fieldId} className="flex items-center gap-1.5 px-1 py-1.5 group">
              <GripVertical size={12} className="text-brand-border-strong shrink-0 cursor-grab" />
              <div className="flex-1 flex items-center gap-1.5">
                <select
                  value={group.fieldId}
                  onChange={(e) => addGroup(e.target.value, group.direction)}
                  className="flex-1 rounded-md border border-brand-border bg-white px-2 py-1 text-xs text-brand-ink outline-none focus:border-brand-blue"
                >
                  {field && <option value={field.id}>{field.name}</option>}
                  {otherAvail.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <select
                  value={group.direction}
                  onChange={(e) => addGroup(group.fieldId, e.target.value as "asc" | "desc")}
                  className="rounded-md border border-brand-border bg-white px-2 py-1 text-xs text-brand-ink outline-none focus:border-brand-blue"
                >
                  <option value="asc">Primero → Último</option>
                  <option value="desc">Último → Primero</option>
                </select>
              </div>
              <button
                onClick={() => removeGroup(group.fieldId)}
                className="p-0.5 rounded text-brand-muted hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {activeGroups.length === 0 && (
          <div className="max-h-52 overflow-y-auto">
            <p className="px-1 py-1 text-[11px] text-brand-muted">
              Selecciona un campo para agrupar
            </p>
            {fields.map((field) => (
              <button
                key={field.id}
                onClick={() => handleSelectField(field.id)}
                className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
              >
                <span className="text-[11px] text-brand-muted shrink-0 w-4">
                  {FIELD_ICONS[field.field_type] || "…"}
                </span>
                <span className="truncate">{field.name}</span>
              </button>
            ))}
          </div>
        )}

        {activeGroups.length > 0 && activeGroups.length < 3 && availFields.length > 0 && (
          <button
            onClick={() => handleSelectField(availFields[0].id)}
            className="flex items-center gap-1.5 w-full px-1 py-1.5 rounded-md text-xs text-brand-muted hover:text-brand-blue hover:bg-brand-surface transition-colors cursor-pointer text-left"
          >
            <Plus size={12} />
            Añadir subgrupo
          </button>
        )}
      </div>
    </div>
  );
}
