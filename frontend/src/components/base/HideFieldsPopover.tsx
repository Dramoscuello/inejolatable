"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Eye, EyeOff } from "lucide-react";
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

interface HideFieldsPopoverProps {
  fields: Field[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function HideFieldsPopover({ fields, position, onClose }: HideFieldsPopoverProps) {
  const { hiddenFields, toggleHiddenField, hideAllFields, showAllFields } = useBaseStore();
  const [search, setSearch] = useState("");
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

  const filtered = fields.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border w-64 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div className="p-2 border-b border-brand-border">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-border-strong" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Encontrar un campo"
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-md outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto py-1">
        {filtered.map((f) => {
          const hidden = hiddenFields.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => !f.is_primary && toggleHiddenField(f.id)}
              className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-sm transition-colors text-left ${
                f.is_primary
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:bg-brand-surface"
              }`}
            >
              <div
                className={`w-8 h-5 rounded-full transition-colors relative shrink-0 ${
                  hidden ? "bg-brand-border" : "bg-brand-success"
                } ${f.is_primary ? "" : ""}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                    hidden ? "left-0.5" : "left-[14px]"
                  }`}
                />
              </div>
              <span className="text-[10px] text-brand-muted shrink-0 w-4">
                {FIELD_ICONS[f.field_type] || "…"}
              </span>
              <span className="truncate text-brand-ink">{f.name}</span>
              {f.is_primary && (
                <span className="text-[10px] text-brand-muted shrink-0 ml-auto">Primario</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex border-t border-brand-border">
        <button
          onClick={() => hideAllFields(fields)}
          className="flex-1 py-2 text-xs text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
        >
          Ocultar todos
        </button>
        <button
          onClick={() => showAllFields()}
          className="flex-1 py-2 text-xs text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer border-l border-brand-border"
        >
          Mostrar todos
        </button>
      </div>
    </div>
  );
}
