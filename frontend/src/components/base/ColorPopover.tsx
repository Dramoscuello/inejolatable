"use client";

import { useRef, useEffect } from "react";
import { X, Trash2, Copy, Plus } from "lucide-react";
import type { Field } from "@/lib/api";
import { useBaseStore, COLOR_PALETTE, type FilterCondition } from "@/store/useBaseStore";

const OPERATORS_BY_TYPE: Record<string, string[]> = {
  default: ["contiene", "no contiene", "está vacío", "no está vacío"],
  singleLineText: ["contiene", "no contiene", "es", "no es", "está vacío", "no está vacío"],
  number: ["es", "no es", "es mayor que", "es menor que", "≥", "≤", "está vacío", "no está vacío"],
  currency: ["es", "no es", "es mayor que", "es menor que", "≥", "≤", "está vacío", "no está vacío"],
  singleSelect: ["es", "no es", "es cualquiera de", "no es ninguno de", "está vacío", "no está vacío"],
  checkbox: ["es", "no es"],
  date: ["es", "es antes", "es después", "está vacío", "no está vacío"],
  dateTime: ["es", "es antes", "es después", "está vacío", "no está vacío"],
};

function getOperators(fieldType: string): string[] {
  return OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.default;
}

function needsValue(operator: string): boolean {
  return !["está vacío", "no está vacío"].includes(operator);
}

let _cndId = 0;
function genCCId() { _cndId++; return `cc${_cndId}`; }

interface ColorPopoverProps {
  fields: Field[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ColorPopover({ fields, position, onClose }: ColorPopoverProps) {
  const {
    colorRules, addColorRule, updateColorRule, removeColorRule,
    defaultColor, setDefaultColor,
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

  const handleAddColor = () => {
    addColorRule({
      id: `clr${Date.now()}`,
      color: COLOR_PALETTE[colorRules.length % COLOR_PALETTE.length].hex,
      label: `Regla ${colorRules.length + 1}`,
      conditions: [{ id: genCCId(), fieldId: "", operator: "", value: "" }],
    });
  };

  const handleAddCondition = (ruleId: string) => {
    const rule = colorRules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateColorRule(ruleId, {
      conditions: [...rule.conditions, { id: genCCId(), fieldId: "", operator: "", value: "" }],
    });
  };

  const handleUpdateCondition = (ruleId: string, condId: string, data: Partial<FilterCondition>) => {
    const rule = colorRules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateColorRule(ruleId, {
      conditions: rule.conditions.map((c) => (c.id === condId ? { ...c, ...data } : c)),
    });
  };

  const handleRemoveCondition = (ruleId: string, condId: string) => {
    const rule = colorRules.find((r) => r.id === ruleId);
    if (!rule) return;
    const updated = rule.conditions.filter((c) => c.id !== condId);
    if (updated.length === 0) removeColorRule(ruleId);
    else updateColorRule(ruleId, { conditions: updated });
  };

  const handleDuplicate = (ruleId: string) => {
    const rule = colorRules.find((r) => r.id === ruleId);
    if (!rule) return;
    addColorRule({
      ...rule,
      id: `clr${Date.now()}`,
      label: `${rule.label} (copia)`,
      conditions: rule.conditions.map((c) => ({ ...c, id: genCCId() })),
    });
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-brand-border w-[400px] max-h-[70vh] overflow-y-auto"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-2 border-b border-brand-border">
        <p className="text-xs text-brand-muted">
          Los registros obtienen el primer color que coinciden.
        </p>
      </div>

      {colorRules.map((rule) => (
        <div key={rule.id} className="border-b border-brand-border px-3 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-5 gap-1 w-[160px] shrink-0">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => updateColorRule(rule.id, { color: c.hex })}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 ${
                    rule.color === c.hex ? "ring-2 ring-brand-blue ring-offset-1 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
            <span className="text-xs text-brand-ink flex-1 truncate">{rule.label}</span>
            <button
              onClick={() => handleDuplicate(rule.id)}
              className="p-0.5 rounded text-brand-muted hover:text-brand-ink cursor-pointer"
              title="Duplicar regla"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={() => removeColorRule(rule.id)}
              className="p-0.5 rounded text-brand-muted hover:text-red-500 cursor-pointer"
              title="Eliminar regla"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {rule.conditions.map((cond) => {
            const field = fields.find((f) => f.id === cond.fieldId);
            const operators = field ? getOperators(field.field_type) : [];
            const showValue = needsValue(cond.operator);
            return (
              <div key={cond.id} className="flex items-center gap-1.5 ml-0.5">
                <select
                  value={cond.fieldId}
                  onChange={(e) => {
                    const f = fields.find((ff) => ff.id === e.target.value);
                    const ops = f ? getOperators(f.field_type) : [];
                    handleUpdateCondition(rule.id, cond.id, { fieldId: e.target.value, operator: ops[0] || "", value: "" });
                  }}
                  className="rounded border border-brand-border bg-white px-1.5 py-0.5 text-[11px] text-brand-ink outline-none focus:border-brand-blue min-w-0 flex-1"
                >
                  <option value="">Campo</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => handleUpdateCondition(rule.id, cond.id, { operator: e.target.value, value: needsValue(e.target.value) ? cond.value : "" })}
                  className="rounded border border-brand-border bg-white px-1.5 py-0.5 text-[11px] text-brand-ink outline-none focus:border-brand-blue"
                >
                  <option value="">Op</option>
                  {operators.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>

                {showValue && (
                  <input
                    value={cond.value}
                    onChange={(e) => handleUpdateCondition(rule.id, cond.id, { value: e.target.value })}
                    placeholder="Valor"
                    className="w-16 rounded border border-brand-border bg-white px-1.5 py-0.5 text-[11px] text-brand-ink outline-none focus:border-brand-blue"
                  />
                )}

                <button
                  onClick={() => handleRemoveCondition(rule.id, cond.id)}
                  className="p-0.5 text-brand-muted hover:text-red-500 cursor-pointer shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => handleAddCondition(rule.id)}
            className="flex items-center gap-1 text-[11px] text-brand-blue hover:underline cursor-pointer"
          >
            <Plus size={10} />
            Añadir condición
          </button>
        </div>
      ))}

      <div className="border-t border-brand-border px-3 py-2.5 space-y-2">
        <button
          onClick={handleAddColor}
          className="flex items-center gap-1 text-xs text-brand-blue hover:underline cursor-pointer"
        >
          <Plus size={12} />
          Añadir regla
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-muted">Color por defecto:</span>
          {defaultColor ? (
            <>
              <div className="w-5 h-5 rounded-full border border-brand-border" style={{ backgroundColor: defaultColor }} />
              <span className="text-xs text-brand-muted">Activo</span>
              <button onClick={() => setDefaultColor(null)} className="text-xs text-red-500 hover:underline cursor-pointer">
                Quitar
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {COLOR_PALETTE.slice(0, 5).map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setDefaultColor(c.hex)}
                  className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
