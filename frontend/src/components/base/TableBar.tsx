"use client";

import {
  Plus,
  ChevronDown,
} from "lucide-react";
import type { Table } from "@/lib/api";

interface TableBarProps {
  tables: Table[];
  activeTableId: string | null;
  onSelectTable: (id: string) => void;
  onAddTable: () => void;
}

export function TableBar({
  tables,
  activeTableId,
  onSelectTable,
  onAddTable,
}: TableBarProps) {
  return (
    <div className="flex items-center h-10 px-2 bg-brand-blue/10 border-b border-brand-border shrink-0">
      <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
        {tables.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTable(t.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              activeTableId === t.id
                ? "bg-brand-canvas text-brand-ink rounded-b-none border border-b-brand-canvas border-brand-border -mb-px"
                : "text-brand-muted hover:text-brand-ink hover:bg-brand-blue/5 rounded-lg"
            }`}
          >
            {t.name}
            <ChevronDown size={12} className="text-brand-muted" />
          </button>
        ))}

        <div className="w-px h-5 bg-brand-border mx-1 shrink-0" />

        <button
          onClick={onAddTable}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-brand-muted hover:text-brand-blue hover:bg-brand-blue/5 transition-colors cursor-pointer shrink-0"
        >
          <Plus size={14} />
          Añadir
        </button>
      </div>
    </div>
  );
}
