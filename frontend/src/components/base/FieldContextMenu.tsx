"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  Pencil,
  Copy,
  ArrowLeft,
  ArrowRight,
  Link2,
  FileText,
  Sigma,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Filter,
  Group,
  EyeOff,
  Trash2,
} from "lucide-react";
import type { Field } from "@/lib/api";
import { useBaseStore } from "@/store/useBaseStore";

const SUMMARY_OPTIONS: Record<string, string[]> = {
  numeric: [
    "Suma", "Promedio", "Mín", "Máx", "Mediana", "Rango",
    "Desviación estándar", "Vacío", "Relleno", "% Vacío", "% Relleno",
    "Únicos", "% Únicos",
  ],
  date: [
    "Más temprana", "Más tardía", "Rango (días)", "Rango (meses)",
    "Vacío", "Relleno", "% Vacío", "% Relleno",
  ],
  checkbox: [
    "Marcado", "Desmarcado", "% Marcado", "% Desmarcado",
  ],
  generic: [
    "Vacío", "Relleno", "% Vacío", "% Relleno", "Únicos", "% Únicos",
  ],
};

function getSummaryOptions(fieldType: string): string[] {
  if (["number", "currency", "percent", "duration"].includes(fieldType)) {
    return SUMMARY_OPTIONS.numeric;
  }
  if (["date", "dateTime"].includes(fieldType)) {
    return SUMMARY_OPTIONS.date;
  }
  if (fieldType === "checkbox") {
    return SUMMARY_OPTIONS.checkbox;
  }
  return SUMMARY_OPTIONS.generic;
}

function getSortLabel(field: Field, direction: "asc" | "desc"): string {
  const isNumeric = ["number", "currency", "percent", "duration", "autoNumber", "rating"].includes(field.field_type);
  if (direction === "asc") return isNumeric ? "Ordenar 1 → 9" : "Ordenar A → Z";
  return isNumeric ? "Ordenar 9 → 1" : "Ordenar Z → A";
}

interface FieldContextMenuProps {
  field: Field;
  position: { x: number; y: number };
  onClose: () => void;
  onEditField: () => void;
  onDuplicateField: () => void;
  onInsertLeft: () => void;
  onInsertRight: () => void;
  onEditDescription: () => void;
  onDeleteField: () => void;
}

export function FieldContextMenu({
  field,
  position,
  onClose,
  onEditField,
  onDuplicateField,
  onInsertLeft,
  onInsertRight,
  onEditDescription,
  onDeleteField,
}: FieldContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    fieldSummaries, setFieldSummary,
    activeSorts, addSort, setSorts,
    activeGroups, addGroup,
    hiddenFields, toggleHiddenField,
  } = useBaseStore();

  const [showSummary, setShowSummary] = useState(false);
  const summaryOptions = getSummaryOptions(field.field_type);
  const currentSummary = fieldSummaries[field.id];

  const isNumeric = ["number", "currency", "percent", "duration"].includes(field.field_type);
  const isHidden = hiddenFields.includes(field.id);
  const hasSort = activeSorts.some((s) => s.fieldId === field.id);
  const sortDir = activeSorts.find((s) => s.fieldId === field.id)?.direction || "asc";
  const hasGroup = activeGroups.some((g) => g.fieldId === field.id);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleCopyUrl = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?field=${field.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    onClose();
  }, [field.id, onClose]);

  const handleSort = useCallback(
    (direction: "asc" | "desc") => {
      addSort(field.id, direction);
      onClose();
    },
    [field.id, addSort, onClose],
  );

  const handleGroup = useCallback(() => {
    addGroup(field.id, "asc");
    onClose();
  }, [field.id, addGroup, onClose]);

  const handleHide = useCallback(() => {
    toggleHiddenField(field.id);
    onClose();
  }, [field.id, toggleHiddenField, onClose]);

  const handleSummary = useCallback(
    (fn: string) => {
      setFieldSummary(field.id, fn);
      setShowSummary(false);
    },
    [field.id, setFieldSummary],
  );

  const x = Math.min(position.x, window.innerWidth - 240);
  const y = Math.min(position.y, window.innerHeight - 440);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border py-1 w-56 overflow-visible"
      style={{ left: x, top: y }}
    >
      <button
        onClick={onEditField}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <Pencil size={14} className="text-brand-muted shrink-0" />
        Editar campo
      </button>

      <button
        onClick={onDuplicateField}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <Copy size={14} className="text-brand-muted shrink-0" />
        Duplicar campo
      </button>

      <button
        onClick={onInsertLeft}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <ArrowLeft size={14} className="text-brand-muted shrink-0" />
        Insertar a la izquierda
      </button>

      <button
        onClick={onInsertRight}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <ArrowRight size={14} className="text-brand-muted shrink-0" />
        Insertar a la derecha
      </button>

      <div className="h-px bg-brand-border my-1" />

      <button
        onClick={handleCopyUrl}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <Link2 size={14} className="text-brand-muted shrink-0" />
        Copiar URL del campo
      </button>

      <button
        onClick={onEditDescription}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <FileText size={14} className="text-brand-muted shrink-0" />
        Editar descripción del campo
      </button>

      <div className="relative">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Sigma size={14} className="text-brand-muted shrink-0" />
            Resumir el campo
          </div>
          <span className="text-xs text-brand-muted">
            {currentSummary || "—"}
          </span>
        </button>
        {showSummary && (
          <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-lg border border-brand-border py-1 w-48 max-h-60 overflow-y-auto">
            {summaryOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSummary(opt)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-brand-surface transition-colors cursor-pointer text-left ${
                  currentSummary === opt
                    ? "text-brand-blue font-medium"
                    : "text-brand-ink"
                }`}
              >
                {currentSummary === opt && (
                  <span className="text-brand-blue text-xs w-4">✓</span>
                )}
                <span className={currentSummary === opt ? "" : "ml-4"}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-brand-border my-1" />

      <button
        onClick={() => handleSort("asc")}
        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-brand-surface transition-colors cursor-pointer text-left ${
          hasSort && sortDir === "asc" ? "text-brand-blue font-medium" : "text-brand-ink"
        }`}
      >
        <ArrowUp size={14} className={`shrink-0 ${hasSort && sortDir === "asc" ? "text-brand-blue" : "text-brand-muted"}`} />
        {getSortLabel(field, "asc")}
      </button>

      <button
        onClick={() => handleSort("desc")}
        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-brand-surface transition-colors cursor-pointer text-left ${
          hasSort && sortDir === "desc" ? "text-brand-blue font-medium" : "text-brand-ink"
        }`}
      >
        <ArrowDown size={14} className={`shrink-0 ${hasSort && sortDir === "desc" ? "text-brand-blue" : "text-brand-muted"}`} />
        {getSortLabel(field, "desc")}
      </button>

      <div className="h-px bg-brand-border my-1" />

      <button
        onClick={() => setSorts([])}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <Filter size={14} className="text-brand-muted shrink-0" />
        Filtrar por este campo
      </button>

      <button
        onClick={handleGroup}
        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-brand-surface transition-colors cursor-pointer text-left ${
          hasGroup ? "text-brand-blue font-medium" : "text-brand-ink"
        }`}
      >
        <Group size={14} className={`shrink-0 ${hasGroup ? "text-brand-blue" : "text-brand-muted"}`} />
        {hasGroup ? "Desagrupar este campo" : "Agrupar por este campo"}
      </button>

      <div className="h-px bg-brand-border my-1" />

      <button
        onClick={handleHide}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
      >
        <EyeOff size={14} className="text-brand-muted shrink-0" />
        {isHidden ? "Mostrar campo" : "Ocultar campo"}
      </button>

      <button
        onClick={onDeleteField}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
      >
        <Trash2 size={14} className="shrink-0" />
        Eliminar campo
      </button>
    </div>
  );
}
