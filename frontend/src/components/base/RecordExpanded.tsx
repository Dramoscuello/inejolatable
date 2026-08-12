"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ChevronUp,
  ChevronDown,
  Link2,
  MoreHorizontal,
  Eye,
  Plus,
  Trash2,
  Search,
  Upload,
  ExternalLink,
} from "lucide-react";
import type { Field, TableRecord } from "@/lib/api";
import { updateRecord } from "@/lib/api";

const FIELD_ICONS: Record<string, string> = {
  singleLineText: "Aa", multilineText: "¶", number: "#", currency: "$",
  percent: "%", duration: "⏱", singleSelect: "◎", multipleSelects: "☰",
  checkbox: "☑", date: "📅", dateTime: "📅", email: "@", url: "🔗",
  phoneNumber: "📞", rating: "★", attachment: "📎", multipleRecordLinks: "→",
  formula: "fx", rollup: "Σ", count: "#", lookup: "👁", autoNumber: "≡",
  createdTime: "🕐", lastModifiedTime: "🕑", button: "▶",
};

const READ_ONLY_TYPES = new Set([
  "formula", "rollup", "lookup", "count", "autoNumber",
  "createdTime", "lastModifiedTime", "button",
]);

interface RecordExpandedProps {
  record: TableRecord;
  recordIndex: number;
  totalRecords: number;
  fields: Field[];
  hiddenFields: string[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAddField: () => void;
  onDeleteRecord: (recordId: string) => void;
}

export function RecordExpanded({
  record, recordIndex, totalRecords, fields, hiddenFields,
  onClose, onPrev, onNext, onAddField, onDeleteRecord,
}: RecordExpandedProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [showHidden, setShowHidden] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => { setValues({ ...record.data_json }); }, [record]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showMenu]);

  const handleChange = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    clearTimeout(debounceRef.current[fieldId]);
    debounceRef.current[fieldId] = setTimeout(() => {
      updateRecord("", record.id, { data_json: { [fieldId]: value } }).catch(() => {});
    }, 300);
  }, [record.id]);

  useEffect(() => () => { Object.values(debounceRef.current).forEach(clearTimeout); }, []);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setShowMenu(false);
  }, []);

  const primaryField = fields.find((f) => f.is_primary) || fields[0];
  const title = primaryField ? String(values[primaryField.id] ?? "") : "";

  const allFields = showHidden ? fields : fields.filter((f) => !hiddenFields.includes(f.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-[70vw] max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-border shrink-0">
          <button onClick={onPrev} disabled={recordIndex === 0}
            className="p-1 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors disabled:opacity-30 cursor-pointer">
            <ChevronUp size={16} />
          </button>
          <button onClick={onNext} disabled={recordIndex >= totalRecords - 1}
            className="p-1 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors disabled:opacity-30 cursor-pointer">
            <ChevronDown size={16} />
          </button>
          <input value={title} onChange={(e) => primaryField && handleChange(primaryField.id, e.target.value)}
            className="flex-1 text-base font-semibold text-brand-ink outline-none bg-transparent px-1 py-0.5 rounded hover:bg-brand-surface focus:bg-brand-surface min-w-0"
            placeholder={primaryField?.name || "Registro"} />
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer">
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-brand-border py-1 w-48 z-10">
                <button onClick={handleCopyUrl} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface cursor-pointer text-left">
                  <Link2 size={14} className="text-brand-muted shrink-0" /> Copiar URL del registro
                </button>
                <button onClick={() => { onDeleteRecord(record.id); onClose(); setShowMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer text-left">
                  <Trash2 size={14} className="shrink-0" /> Eliminar registro
                </button>
              </div>
            )}
          </div>
          <button onClick={handleCopyUrl} className="p-1.5 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer" title="Copiar enlace">
            <Link2 size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {allFields.map((field) => (
            <FieldEditor key={field.id} field={field} value={values[field.id]} onChange={(v) => handleChange(field.id, v)} />
          ))}
          {hiddenFields.length > 0 && !showHidden && (
            <button onClick={() => setShowHidden(true)} className="flex items-center gap-1.5 text-sm text-brand-blue hover:underline cursor-pointer">
              <Eye size={14} /> Mostrar {hiddenFields.length} campos ocultos
            </button>
          )}
        </div>

        <div className="px-4 py-3 border-t border-brand-border shrink-0">
          <button onClick={onAddField} className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-blue transition-colors cursor-pointer">
            <Plus size={14} /> Añadir un nuevo campo...
          </button>
        </div>
      </div>
    </div>
  );
}

const SELECT_COLORS = [
  { bg: "#dbeafe", text: "#1e40af" }, { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fef3c7", text: "#92400e" }, { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#fee2e2", text: "#991b1b" }, { bg: "#e0e7ff", text: "#3730a3" },
  { bg: "#fce7f3", text: "#9d174d" }, { bg: "#ccfbf1", text: "#134e4a" },
  { bg: "#f3f4f6", text: "#374151" }, { bg: "#ffedd5", text: "#9a3412" },
];

function FieldLabel({ field }: { field: Field }) {
  const icon = FIELD_ICONS[field.field_type] || "…";
  return (
    <div className="w-40 shrink-0 pt-2 flex items-center gap-1.5">
      <span className="text-xs text-brand-muted">{icon}</span>
      <span className="text-sm font-medium text-brand-ink truncate">{field.name}</span>
    </div>
  );
}

export function FieldEditor({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const type = field.field_type;
  if (READ_ONLY_TYPES.has(type)) return <ReadOnlyField field={field} value={value} />;
  if (type === "checkbox") return <CheckboxField field={field} value={value} onChange={onChange} />;
  if (type === "rating") return <RatingField field={field} value={value} onChange={onChange} />;
  if (type === "singleSelect" || type === "multipleSelects") return <SelectField field={field} value={value} onChange={onChange} multiple={type === "multipleSelects"} />;
  if (type === "multilineText") return <LongTextField field={field} value={value} onChange={onChange} />;
  if (type === "currency" || type === "percent") return <NumericField field={field} value={value} onChange={onChange} />;
  if (type === "email" || type === "url" || type === "phoneNumber") return <LinkField field={field} value={value} onChange={onChange} />;
  if (type === "date" || type === "dateTime") return <DateField field={field} value={value} onChange={onChange} />;
  if (type === "attachment") return <AttachmentField />;
  if (type === "multipleRecordLinks") return <LinkedRecordField field={field} />;
  return <TextField field={field} value={value} onChange={onChange} />;
}

function ReadOnlyField({ field, value }: { field: Field; value: unknown }) {
  const display = value === null || value === undefined ? "—" : String(value);
  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0 py-2">
        <p className="text-sm text-brand-muted/70 italic bg-brand-surface rounded-lg px-3 py-2">{display}</p>
      </div>
    </div>
  );
}

function CheckboxField({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const checked = Boolean(value);
  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0 py-2">
        <button onClick={() => onChange(!checked)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${checked ? "bg-brand-success border-brand-success text-white" : "border-brand-border-strong"}`}>
          {checked && <span className="text-[11px]">✓</span>}
        </button>
      </div>
    </div>
  );
}

function RatingField({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const opts = (field.options_json as { max?: number; color?: string }) || {};
  const max = opts.max || 5;
  const color = opts.color || "#eab308";
  const current = Number(value) || 0;
  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0 py-2 flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(current === i + 1 ? null : i + 1)}
            className="cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill={i < current ? color : "#d1d5db"}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

(Showing lines 209-233 of 436, column 8. Use offset=234 to continue.)

(Let op: deze wijziging heeft 34 regels in het bestand aangepast; de weergave hierboven kan afgekapt zijn. Bekijk de bestandswijzigingen in de editor voor de volledige weergave.)
    </div>
  );
}

function SelectField({ field, value, onChange, multiple }: { field: Field; value: unknown; onChange: (v: unknown) => void; multiple: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const options = (field.options_json as { choices?: { name: string; color?: string }[] })?.choices || [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = multiple
    ? ((value as string) || "").split(",").filter(Boolean)
    : [String(value || "")].filter(Boolean);

  const filtered = options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  const handleToggle = (name: string) => {
    if (multiple) {
      const set = new Set(selected);
      set.has(name) ? set.delete(name) : set.add(name);
      onChange(Array.from(set).join(","));
    } else {
      onChange(name);
      setOpen(false);
    }
  };

  return (
    <div className="flex items-start gap-3" ref={ref}>
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0 py-2 relative">
        <div className="flex flex-wrap gap-1.5 cursor-pointer min-h-[36px] items-center" onClick={() => setOpen(!open)}>
          {selected.length === 0 && (
            <span className="text-sm text-brand-border-strong px-3 py-2">Seleccionar...</span>
          )}
          {selected.map((sel, i) => {
            const opt = options.find((o) => o.name === sel);
            const color = SELECT_COLORS[i % SELECT_COLORS.length];
            return (
              <span key={sel} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
                style={{ backgroundColor: color.bg, color: color.text }}>
                {sel}
                {multiple && (
                  <button onClick={(e) => { e.stopPropagation(); handleToggle(sel); }}
                    className="hover:opacity-70 cursor-pointer">×</button>
                )}
              </span>
            );
          })}
        </div>
        {open && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-lg border border-brand-border z-10 max-h-52 overflow-y-auto">
            <div className="p-2 border-b border-brand-border">
              <div className="relative">
                <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-border-strong" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." autoFocus
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-md outline-none focus:border-brand-blue" />
              </div>
            </div>
            {filtered.map((opt) => (
              <button key={opt.name} onClick={() => handleToggle(opt.name)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-brand-surface transition-colors cursor-pointer text-left ${selected.includes(opt.name) ? "text-brand-blue font-medium" : "text-brand-ink"}`}>
                {selected.includes(opt.name) && <span className="text-brand-blue text-xs w-3">✓</span>}
                <span className={selected.includes(opt.name) ? "" : "ml-3"}>{opt.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LongTextField({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const display = String(value || "");

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [display]);

  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0">
        <textarea ref={textareaRef} value={display} onChange={(e) => onChange(e.target.value)} rows={1}
          className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 resize-none min-h-[80px]"
          placeholder="Escribe aquí..." />
      </div>
    </div>
  );
}

function NumericField({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const prefix = field.field_type === "currency" ? "$" : field.field_type === "percent" ? "%" : "";
  const display = String(value || "");
  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0 relative">
        {prefix && field.field_type === "currency" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">$</span>
        )}
        <input type="number" value={display} onChange={(e) => onChange(e.target.value)} step="any"
          className={`w-full rounded-lg border border-brand-border bg-white text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 px-3 py-2 ${prefix && field.field_type === "currency" ? "pl-7" : ""}`}
          placeholder="0" />
        {prefix && field.field_type === "percent" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">%</span>
        )}
      </div>
    </div>
  );
}

function LinkField({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const [editing, setEditing] = useState(false);
  const display = String(value || "");
  const type = field.field_type;

  if (!editing && display) {
    let href = "";
    if (type === "email") href = `mailto:${display}`;
    else if (type === "phoneNumber") href = `tel:${display}`;
    else href = display.startsWith("http") ? display : `https://${display}`;

    return (
      <div className="flex items-start gap-3">
        <FieldLabel field={field} />
        <div className="flex-1 min-w-0 py-2">
          <button onDoubleClick={() => setEditing(true)}
            className="text-sm text-brand-blue hover:underline cursor-pointer flex items-center gap-1">
            {display} {type === "url" && <ExternalLink size={12} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0">
        <input value={display} onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)}
          placeholder={type === "email" ? "correo@ejemplo.com" : type === "phoneNumber" ? "555-1234" : "https://"}
          className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" autoFocus />
      </div>
    </div>
  );
}

function DateField({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const display = String(value || "");
  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0">
        <input type={field.field_type === "dateTime" ? "datetime-local" : "date"} value={display}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" />
      </div>
    </div>
  );
}

function AttachmentField() {
  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={{ name: "Adjuntos", field_type: "attachment", id: "", table_id: "", is_primary: false, options_json: null, order_position: 0, created_at: "", updated_at: "" }} />
      <div className="flex-1 min-w-0">
        <div className="border-2 border-dashed border-brand-border rounded-lg p-8 text-center hover:border-brand-blue/50 transition-colors cursor-pointer">
          <Upload size={20} className="text-brand-muted mx-auto mb-2" />
          <p className="text-sm text-brand-muted">Arrastra archivos aquí o haz clic para subir</p>
        </div>
      </div>
    </div>
  );
}

function LinkedRecordField({ field }: { field: Field }) {
  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0 py-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-muted border border-brand-border hover:border-brand-blue hover:text-brand-blue transition-colors cursor-pointer">
          <Plus size={14} /> Añadir registro
        </button>
      </div>
    </div>
  );
}

function TextField({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const display = String(value || "");
  return (
    <div className="flex items-start gap-3">
      <FieldLabel field={field} />
      <div className="flex-1 min-w-0">
        <input value={display} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
          placeholder="Vacío" />
      </div>
    </div>
  );
}
