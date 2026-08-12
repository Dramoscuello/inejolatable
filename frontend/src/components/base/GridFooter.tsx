"use client";

import { Plus } from "lucide-react";

interface GridFooterProps {
  recordCount: number;
  recordLabel: string;
  onAddRecord: () => void;
}

export function GridFooter({
  recordCount,
  recordLabel,
  onAddRecord,
}: GridFooterProps) {
  return (
    <div className="flex items-center h-10 px-3 bg-brand-canvas border-t border-brand-border shrink-0 gap-4">
      <button
        onClick={onAddRecord}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-sm text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
      >
        <Plus size={14} />
        Añadir...
      </button>

      <span className="text-sm text-brand-muted">
        {recordCount} {recordLabel}
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-xs text-brand-muted">
        <span>Vacío 0</span>
        <span>Únicos {recordCount}</span>
        <span>Relleno {recordCount > 0 ? "100%" : "0%"}</span>
      </div>
    </div>
  );
}
