"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { getRecords, getTable, TableRecord, Field } from "@/lib/api";

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
  const [primaryFieldId, setPrimaryFieldId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    Promise.all([getTable(tableId), getRecords(tableId)])
      .then(([table, recs]) => {
        const pf: Field | undefined =
          table.fields.find((f) => f.is_primary) || table.fields[0];
        setPrimaryFieldId(pf?.id || null);
        setRecords(recs);
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [tableId]);

  const getName = (r: TableRecord): string => {
    if (primaryFieldId) {
      const v = r.data_json[primaryFieldId];
      if (v !== null && v !== undefined && String(v).trim() !== "") return String(v);
    }
    return r.id;
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    return getName(r).toLowerCase().includes(search.toLowerCase());
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
            const name = getName(r);
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
