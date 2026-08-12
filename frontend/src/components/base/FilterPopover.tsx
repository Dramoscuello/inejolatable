"use client";

import { useRef, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Field } from "@/lib/api";
import { useBaseStore } from "@/store/useBaseStore";

const OPERATORS_BY_TYPE: Record<string, string[]> = {
  default: ["contiene", "no contiene", "está vacío", "no está vacío"],
  singleLineText: ["contiene", "no contiene", "es", "no es", "está vacío", "no está vacío"],
  multilineText: ["contiene", "no contiene", "está vacío", "no está vacío"],
  number: ["es", "no es", "es mayor que", "es menor que", "≥", "≤", "está vacío", "no está vacío"],
  currency: ["es", "no es", "es mayor que", "es menor que", "≥", "≤", "está vacío", "no está vacío"],
  percent: ["es", "no es", "es mayor que", "es menor que", "≥", "≤", "está vacío", "no está vacío"],
  duration: ["es", "no es", "es mayor que", "es menor que", "≥", "≤", "está vacío", "no está vacío"],
  singleSelect: ["es", "no es", "es cualquiera de", "no es ninguno de", "está vacío", "no está vacío"],
  multipleSelects: ["contiene", "no contiene", "está vacío", "no está vacío"],
  checkbox: ["es", "no es"],
  date: ["es", "es antes", "es después", "está en o antes", "está en o después", "está en", "está vacío", "no está vacío"],
  dateTime: ["es", "es antes", "es después", "está en o antes", "está en o después", "está en", "está vacío", "no está vacío"],
  email: ["contiene", "no contiene", "está vacío", "no está vacío"],
  url: ["contiene", "no contiene", "está vacío", "no está vacío"],
  phoneNumber: ["contiene", "no contiene", "está vacío", "no está vacío"],
  multipleRecordLinks: ["es exactamente", "tiene cualquiera de", "tiene todos", "no tiene ninguno", "está vacío", "no está vacío"],
  rating: ["es", "no es", "es mayor que", "es menor que", "≥", "≤", "está vacío", "no está vacío"],
};

function getOperators(fieldType: string): string[] {
  return OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.default;
}

function needsValue(operator: string): boolean {
  return !["está vacío", "no está vacío"].includes(operator);
}

interface FilterPopoverProps {
  fields: Field[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function FilterPopover({ fields, position, onClose }: FilterPopoverProps) {
  const {
    activeFilters,
    addFilterGroup,
    updateFilterGroup,
    removeFilterGroup,
    addFilterCondition,
    updateFilterCondition,
    removeFilterCondition,
  } = useBaseStore();
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

  if (activeFilters.length === 0) {
    return (
      <div
        ref={ref}
        className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border w-80 overflow-hidden"
        style={{ left: position.x, top: position.y }}
      >
        <div className="px-3 py-3 text-center">
          <p className="text-sm text-brand-muted mb-3">
            Sin filtros aplicados. Añade una condición para filtrar los registros de esta vista.
          </p>
          <button
            onClick={addFilterGroup}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-medium cursor-pointer hover:bg-brand-blue/90"
          >
            <Plus size={12} />
            Añadir condición
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border w-[420px] max-h-[60vh] overflow-y-auto"
      style={{ left: position.x, top: position.y }}
    >
      {activeFilters.map((group, gi) => (
        <div key={group.id} className="border-b border-brand-border last:border-0">
          <div className="flex items-center justify-between px-3 py-1.5 bg-brand-surface/50">
            <select
              value={group.conjunction}
              onChange={(e) => updateFilterGroup(group.id, { conjunction: e.target.value as "and" | "or" })}
              className="text-xs font-medium text-brand-ink bg-transparent border-0 outline-none cursor-pointer"
            >
              <option value="and">Todas las siguientes</option>
              <option value="or">Cualquiera de las siguientes</option>
            </select>
            <button
              onClick={() => removeFilterGroup(group.id)}
              className="p-0.5 rounded text-brand-muted hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {group.conditions.map((cond, ci) => {
            const field = fields.find((f) => f.id === cond.fieldId);
            const operators = field ? getOperators(field.field_type) : [];
            const showValue = needsValue(cond.operator);

            return (
              <div key={cond.id} className="flex items-center gap-1.5 px-3 py-1.5">
                {ci === 0 ? (
                  <span className="text-[11px] text-brand-muted shrink-0 w-10">Donde</span>
                ) : ci === 1 ? (
                  <select
                    value={group.conjunction}
                    onChange={(e) => updateFilterGroup(group.id, { conjunction: e.target.value as "and" | "or" })}
                    className="text-[11px] font-medium text-brand-blue bg-transparent border-0 outline-none cursor-pointer shrink-0 w-10"
                  >
                    <option value="and">Y</option>
                    <option value="or">O</option>
                  </select>
                ) : (
                  <span className="text-[11px] text-brand-muted shrink-0 w-10">
                    {group.conjunction === "and" ? "Y" : "O"}
                  </span>
                )}

                <select
                  value={cond.fieldId}
                  onChange={(e) => {
                    const newField = fields.find((f) => f.id === e.target.value);
                    const newOps = newField ? getOperators(newField.field_type) : [];
                    updateFilterCondition(group.id, cond.id, {
                      fieldId: e.target.value,
                      operator: newOps[0] || "",
                      value: "",
                    });
                  }}
                  className="flex-1 rounded-md border border-brand-border bg-white px-2 py-1 text-xs text-brand-ink outline-none focus:border-brand-blue min-w-0"
                >
                  <option value="">Seleccionar campo</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => updateFilterCondition(group.id, cond.id, { operator: e.target.value, value: needsValue(e.target.value) ? cond.value : "" })}
                  className="rounded-md border border-brand-border bg-white px-2 py-1 text-xs text-brand-ink outline-none focus:border-brand-blue"
                >
                  <option value="">Operador</option>
                  {operators.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>

                {showValue && (
                  <input
                    value={cond.value}
                    onChange={(e) => updateFilterCondition(group.id, cond.id, { value: e.target.value })}
                    placeholder="Valor"
                    className="w-20 rounded-md border border-brand-border bg-white px-2 py-1 text-xs text-brand-ink outline-none focus:border-brand-blue"
                  />
                )}

                <button
                  onClick={() => removeFilterCondition(group.id, cond.id)}
                  className="p-0.5 rounded text-brand-muted hover:text-red-500 transition-colors cursor-pointer shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          <div className="flex gap-2 px-3 py-1.5">
            <button
              onClick={() => addFilterCondition(group.id)}
              className="text-xs text-brand-blue hover:underline cursor-pointer"
            >
              + Añadir condición
            </button>
          </div>
        </div>
      ))}

      <div className="border-t border-brand-border px-3 py-2 flex justify-between">
        <button
          onClick={addFilterGroup}
          className="text-xs text-brand-blue hover:underline cursor-pointer"
        >
          + Añadir grupo de condiciones
        </button>
        <button
          onClick={addFilterGroup}
          className="text-xs text-brand-muted hover:text-brand-ink cursor-pointer"
        >
          Copiar de otra vista
        </button>
      </div>
    </div>
  );
}
