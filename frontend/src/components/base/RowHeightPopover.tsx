"use client";

import { useRef, useEffect } from "react";
import { useBaseStore } from "@/store/useBaseStore";

interface RowHeightPopoverProps {
  position: { x: number; y: number };
  onClose: () => void;
}

const OPTIONS = [
  { key: "short" as const, label: "Corta", lines: 4 },
  { key: "medium" as const, label: "Media", lines: 3 },
  { key: "tall" as const, label: "Alta", lines: 2 },
  { key: "extraTall" as const, label: "Extra alta", lines: 1 },
];

function DensityIcon({ lines, active }: { lines: number; active: boolean }) {
  const bars = Array.from({ length: 4 }, (_, i) => i < lines);
  const color = active ? "#1665d8" : "#6b7280";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
      {bars.map((filled, i) => (
        <rect
          key={i}
          x="2"
          y={3 + i * 4.5}
          width="16"
          height={filled ? "2.5" : "1"}
          rx="1"
          fill={color}
          opacity={filled ? 1 : 0.35}
        />
      ))}
    </svg>
  );
}

export function RowHeightPopover({ position, onClose }: RowHeightPopoverProps) {
  const { rowHeight, setRowHeight } = useBaseStore();
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

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border w-52 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-2 border-b border-brand-border">
        <span className="text-sm font-medium text-brand-ink">Seleccionar altura de fila</span>
      </div>
      <div className="py-0.5">
        {OPTIONS.map((opt) => {
          const active = rowHeight === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => { setRowHeight(opt.key); onClose(); }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors cursor-pointer text-left hover:bg-brand-surface ${
                active ? "text-brand-blue font-medium" : "text-brand-ink"
              }`}
            >
              <DensityIcon lines={opt.lines} active={active} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
