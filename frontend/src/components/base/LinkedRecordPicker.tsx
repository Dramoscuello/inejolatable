"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Plus } from "lucide-react";
import { getRecords, TableRecord } from "@/lib/api";

interface LinkedRecordPickerProps {
  tableId: string;
  position: { x: number; y: number };
  selectedIds: string[];
  single: boolean;
  onSelect: (ids: string[]) => void;
  onClose: () => void;
}

export function LinkedRecordPicker({
  tableId,
  position,
  selectedIds,
  single,
  onSelect,
  onClose,
}: LinkedRecordPickerProps) {
  const [records, setRecords] = useState<TableRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  useEffect(() => {
    getRecords(tableId).then(setRecords).catch(() => setRecords([])).finally(() => setLoading(false));
  }, [tableId]);

  const filtered = records.filter((r) => {
    if (!search) return true;
    const name = String(Object.values(r.data_json)[0] || "");
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleToggle = (id: string) => {
    if (single) {
      onSelect(selectedIds.includes(id) ? [] : [id]);
    } else {
      const set = new Set(selectedIds);
      set.has(id) ? set.delete(id) : set.add(id);
      onSelect(Array.from(set));
    }
  };

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
            placeholder="Buscar registro..."
            autoFocus
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-md outline-none focus:border-brand-blue"
          />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        {loading ? (
          <p className="px-3 py-4 text-xs text-brand-muted text-center">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-4 text-xs text-brand-muted text-center">Sin resultados</p>
        ) : (
          filtered.map((r) => {
            const name = String(Object.values(r.data_json)[0] || r.id);
            const checked = selectedIds.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => handleToggle(r.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-brand-surface transition-colors cursor-pointer text-left ${
                  checked ? "text-brand-blue font-medium" : "text-brand-ink"
                }`}
              >
                {checked && <span className="text-brand-blue text-xs w-3">✓</span>}
                <span className={checked ? "" : "ml-3"}>{name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
