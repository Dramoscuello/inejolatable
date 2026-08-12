"use client";

import { useRef, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Maximize2,
  Trash2,
} from "lucide-react";

interface RecordContextMenuProps {
  recordLabel: string;
  selectionCount: number;
  position: { x: number; y: number };
  onClose: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onDuplicate: () => void;
  onExpand: () => void;
  onDelete: () => void;
}

export function RecordContextMenu({
  recordLabel,
  selectionCount,
  position,
  onClose,
  onInsertAbove,
  onInsertBelow,
  onDuplicate,
  onExpand,
  onDelete,
}: RecordContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const x = Math.min(position.x, window.innerWidth - 240);
  const y = Math.min(position.y, window.innerHeight - 360);
  const isBulk = selectionCount > 1;

  if (isBulk) {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border py-1 w-56"
        style={{ left: x, top: y }}
      >
        <button
          onClick={onDelete}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
        >
          <Trash2 size={14} className="shrink-0" />
          Eliminar {selectionCount} {recordLabel}s
        </button>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border py-1 w-56"
      style={{ left: x, top: y }}
    >
      <button
        onClick={onInsertAbove}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <ArrowUp size={14} className="text-brand-muted shrink-0" />
        Insertar {recordLabel} arriba
      </button>

      <button
        onClick={onInsertBelow}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <ArrowDown size={14} className="text-brand-muted shrink-0" />
        Insertar {recordLabel} abajo
      </button>

      <div className="h-px bg-brand-border my-1" />

      <button
        onClick={onDuplicate}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <Copy size={14} className="text-brand-muted shrink-0" />
        Duplicar {recordLabel}
      </button>

      <div className="h-px bg-brand-border my-1" />

      <button
        onClick={onExpand}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <Maximize2 size={14} className="text-brand-muted shrink-0" />
        Expandir {recordLabel}
      </button>

      <div className="h-px bg-brand-border my-1" />

      <button
        onClick={onDelete}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
      >
        <Trash2 size={14} className="shrink-0" />
        Eliminar {recordLabel}
      </button>
    </div>
  );
}
