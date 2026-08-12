"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Field, TableRecord } from "@/lib/api";
import { Plus, ChevronRight, ChevronDown, Upload, Paperclip, Image } from "lucide-react";
import { useBaseStore, type FilterGroup, type SortRule, type GroupRule, type ColorRule, COLOR_PALETTE } from "@/store/useBaseStore";
import { useCellEdit } from "@/hooks/useCellEdit";
import { GridFooter } from "./GridFooter";
import { FieldContextMenu } from "./FieldContextMenu";
import { RecordContextMenu } from "./RecordContextMenu";
import { FieldEditModal } from "./FieldEditModal";
import { FieldDescriptionModal } from "./FieldDescriptionModal";
import { DeleteFieldModal } from "./DeleteFieldModal";
import { DeleteRecordModal } from "./DeleteRecordModal";
import { LinkedRecordPicker } from "./LinkedRecordPicker";
import { RecordExpanded } from "./RecordExpanded";
import { AttachmentPreviewModal } from "./AttachmentPreviewModal";

const FIELD_ICONS: Record<string, string> = {
  singleLineText: "Aa", multilineText: "¶", number: "#", currency: "$",
  percent: "%", duration: "⏱", singleSelect: "◎", multipleSelects: "☰",
  checkbox: "☑", date: "📅", dateTime: "📅", email: "@", url: "🔗",
  phoneNumber: "📞", rating: "★", attachment: "📎", multipleRecordLinks: "→",
  formula: "fx", rollup: "Σ", count: "#", lookup: "👁", autoNumber: "≡",
  createdTime: "🕐", lastModifiedTime: "🕑", barcode: "⊞", button: "▶",
};

const EDITABLE_TYPES = new Set([
  "singleLineText", "multilineText", "number", "currency", "percent",
  "duration", "email", "url", "phoneNumber", "singleSelect",
  "multipleSelects", "checkbox", "date", "dateTime", "rating",
  "attachment", "multipleRecordLinks",
]);

const ROW_HEIGHTS: Record<string, string> = {
  short: "h-8", medium: "h-10", tall: "h-14", extraTall: "h-20",
};

const DEFAULT_COL_WIDTH = 160;

function formatDisplayValue(field: Field, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "✓" : "";
  if (field.field_type === "currency" && typeof value === "number") {
    const opts = (field.options_json as { symbol?: string; precision?: number; allowNegativeNumbers?: boolean }) || {};
    const symbol = opts.symbol || "$";
    const precision = opts.precision ?? 2;
    const num = Number(value);
    return `${symbol}${Math.abs(num).toLocaleString("es", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })}`;
  }
  if (field.field_type === "duration" && typeof value === "number") {
    const fmt = (field.options_json as { durationFormat?: string })?.durationFormat || "h:mm:ss";
    return formatSeconds(value, fmt);
  }
  if (field.field_type === "percent" && typeof value === "number") {
    return `${(value * 100).toFixed(0)}%`;
  }
  return String(value);
}

function formatSeconds(totalSeconds: number, format: string): string {
  const neg = totalSeconds < 0;
  const s = Math.abs(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const ms = Math.round((secs - Math.floor(secs)) * 1000);
  const wholeSecs = Math.floor(secs);
  const prefix = neg ? "-" : "";

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const pad3 = (n: number) => String(n).padStart(3, "0");

  switch (format) {
    case "h:mm":
      return `${prefix}${hours}:${pad2(minutes)}`;
    case "h:mm:ss":
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}`;
    case "h:mm:ss.s":
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}.${Math.floor(ms / 100)}`;
    case "h:mm:ss.ss":
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}.${pad2(Math.floor(ms / 10))}`;
    case "h:mm:ss.sss":
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}.${pad3(ms)}`;
    default:
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}`;
  }
}

function parseDurationInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed.endsWith("ms")) {
    return parseFloat(trimmed) / 1000;
  }
  if (trimmed.endsWith("s")) {
    return parseFloat(trimmed);
  }
  if (trimmed.endsWith("m")) {
    return parseFloat(trimmed) * 60;
  }
  if (trimmed.endsWith("h")) {
    return parseFloat(trimmed) * 3600;
  }

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    let total = 0;
    if (parts.length >= 3) {
      total = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2] || "0");
    } else if (parts.length === 2) {
      total = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60;
    }
    return isNaN(total) ? null : total;
  }

  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return num >= 1000 ? num : num * 60;
  }

  return null;
}

interface ResizeState {
  fieldId: string;
  startX: number;
  startWidth: number;
}

function getRecordValue(record: TableRecord, fieldId: string): string {
  const v = record.data_json[fieldId];
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function evalCondition(
  record: TableRecord,
  field: Field | undefined,
  cond: { fieldId: string; operator: string; value: string }
): boolean {
  const raw = getRecordValue(record, cond.fieldId);
  const op = cond.operator;
  const cv = cond.value;

  switch (op) {
    case "contiene":
      return raw.toLowerCase().includes(cv.toLowerCase());
    case "no contiene":
      return !raw.toLowerCase().includes(cv.toLowerCase());
    case "es":
      return raw === cv;
    case "no es":
      return raw !== cv;
    case "está vacío":
      return raw === "";
    case "no está vacío":
      return raw !== "";
    case "es mayor que": {
      const a = parseFloat(raw), b = parseFloat(cv);
      return !isNaN(a) && !isNaN(b) && a > b;
    }
    case "es menor que": {
      const a = parseFloat(raw), b = parseFloat(cv);
      return !isNaN(a) && !isNaN(b) && a < b;
    }
    case "≥": {
      const a = parseFloat(raw), b = parseFloat(cv);
      return !isNaN(a) && !isNaN(b) && a >= b;
    }
    case "≤": {
      const a = parseFloat(raw), b = parseFloat(cv);
      return !isNaN(a) && !isNaN(b) && a <= b;
    }
    case "es cualquiera de":
      return cv.split(",").some((o) => o.trim() === raw);
    case "no es ninguno de":
      return !cv.split(",").some((o) => o.trim() === raw);
    case "es antes":
      return raw < cv;
    case "es después":
      return raw > cv;
    case "está en o antes":
      return raw <= cv;
    case "está en o después":
      return raw >= cv;
    case "está en":
      return raw.includes(cv);
    case "es exactamente":
      return raw === cv;
    case "tiene cualquiera de":
      return cv.split(",").some((o) => o.trim() === raw);
    case "tiene todos":
      return cv.split(",").every((o) => raw.includes(o.trim()));
    case "no tiene ninguno":
      return !cv.split(",").some((o) => raw.includes(o.trim()));
    default:
      return true;
  }
}

function evalFilterGroup(
  record: TableRecord,
  fields: Field[],
  group: FilterGroup
): boolean {
  if (group.conditions.length === 0) return true;
  const method = group.conjunction === "and" ? "every" : "some";
  return group.conditions[method]((cond) => {
    if (!cond.fieldId || !cond.operator) return true;
    const field = fields.find((f) => f.id === cond.fieldId);
    return evalCondition(record, field, cond);
  });
}

function filterRecords(
  records: TableRecord[],
  fields: Field[],
  filterGroups: FilterGroup[]
): TableRecord[] {
  if (filterGroups.length === 0) return records;
  return records.filter((r) =>
    filterGroups.some((g) => evalFilterGroup(r, fields, g))
  );
}

function applySorts(records: TableRecord[], sorts: SortRule[]): TableRecord[] {
  if (sorts.length === 0) return records;
  return [...records].sort((a, b) => {
    for (const sort of sorts) {
      const va = String(a.data_json[sort.fieldId] || "");
      const vb = String(b.data_json[sort.fieldId] || "");
      const numA = parseFloat(va);
      const numB = parseFloat(vb);
      const isNum = !isNaN(numA) && !isNaN(numB);
      let cmp = 0;
      if (isNum) {
        cmp = numA - numB;
      } else {
        cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
      }
      if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}

function getRecordColor(
  record: TableRecord,
  fields: Field[],
  colorRules: ColorRule[],
  defaultColor: string | null
): string | null {
  for (const rule of colorRules) {
    const allMatch = rule.conditions.every((cond) => {
      if (!cond.fieldId || !cond.operator) return true;
      return evalCondition(record, fields.find((f) => f.id === cond.fieldId), cond);
    });
    if (allMatch) return rule.color;
  }
  return defaultColor;
}

interface GroupNode {
  value: string;
  count: number;
  records: TableRecord[];
  children: GroupNode[];
  depth: number;
}

function groupRecords(
  records: TableRecord[],
  fields: Field[],
  groups: GroupRule[],
  depth = 0
): GroupNode[] {
  if (depth >= groups.length || groups.length === 0) {
    return records.length > 0
      ? [{ value: "", count: records.length, records, children: [], depth }]
      : [];
  }

  const groupBy = groups[depth];
  const buckets = new Map<string, TableRecord[]>();

  for (const record of records) {
    const raw = getRecordValue(record, groupBy.fieldId);
    const key = raw || "(Vacío)";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(record);
  }

  const nodes: GroupNode[] = [];
  for (const [value, groupRecords_] of buckets) {
  const isLastLevel = depth === groups.length - 1;
  nodes.push({
    value,
    count: groupRecords_.length,
    records: isLastLevel ? groupRecords_ : [],
    children: isLastLevel ? [] : groupRecords(groupRecords_, fields, groups, depth + 1),
    depth,
  });
  }

  nodes.sort((a, b) => {
    const dir = groupBy.direction === "asc" ? 1 : -1;
    const va = a.value === "(Vacío)" ? "" : a.value;
    const vb = b.value === "(Vacío)" ? "" : b.value;
    return va.localeCompare(vb, undefined, { sensitivity: "base" }) * dir;
  });

  return nodes;
}

function flattenGroups(
  nodes: GroupNode[],
  collapsed: Set<string>,
  path = ""
): { type: "header" | "row"; node: GroupNode; record?: TableRecord; recordIndex?: number; groupPath: string }[] {
  const result: { type: "header" | "row"; node: GroupNode; record?: TableRecord; recordIndex?: number; groupPath: string }[] = [];
  let ri = 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePath = path ? `${path}/${i}` : String(i);
    result.push({ type: "header", node, recordIndex: ri, groupPath: nodePath });

    if (!collapsed.has(nodePath)) {
      if (node.records.length > 0) {
        for (const record of node.records) {
          result.push({ type: "row", node, record, recordIndex: ri, groupPath: nodePath });
          ri++;
        }
      }
      if (node.children.length > 0) {
        const childResult = flattenGroups(node.children, collapsed, nodePath);
        for (const item of childResult) {
          result.push(item);
          if (item.type === "row") ri++;
        }
      }
    }
  }
  return result;
}

interface GridViewProps {
  tableId: string;
  fields: Field[];
  records: TableRecord[];
  onAddField: () => void;
  onRefresh: () => void;
}

export function GridView({
  tableId, fields, records, onAddField, onRefresh,
}: GridViewProps) {
  const {
    editingCell, setEditingCell, rowHeight, hiddenFields,
    setRecords, columnWidths, setColumnWidth, fieldSummaries,
    activeFilters, activeSorts, activeGroups,
    colorRules, defaultColor,
    searchTerm, searchMatches, setSearchMatches,
    searchActiveIndex,
  } = useBaseStore();

  const sortedRecords = useMemo(
    () => applySorts(filterRecords(records, fields, activeFilters), activeSorts),
    [records, fields, activeFilters, activeSorts],
  );

  const groupNodes = useMemo(
    () => groupRecords(sortedRecords, fields, activeGroups),
    [sortedRecords, fields, activeGroups],
  );

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const flattenResult = useMemo(
    () => flattenGroups(groupNodes, collapsed),
    [groupNodes, collapsed],
  );

  const displayedRecords = useMemo(
    () => flattenResult.filter((f) => f.type === "row").map((f) => f.record!),
    [flattenResult],
  );

  const recordColors = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const r of sortedRecords) {
      map.set(r.id, getRecordColor(r, fields, colorRules, defaultColor));
    }
    return map;
  }, [sortedRecords, fields, colorRules, defaultColor]);

  const computedMatches = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    const m: { recordId: string; fieldId: string }[] = [];
    for (const r of displayedRecords) {
      for (const f of fields) {
        if (hiddenFields.includes(f.id)) continue;
        const v = String(r.data_json[f.id] || "").toLowerCase();
        if (v.includes(term)) {
          m.push({ recordId: r.id, fieldId: f.id });
        }
      }
    }
    return m;
  }, [searchTerm, displayedRecords, fields, hiddenFields]);

  useEffect(() => {
    setSearchMatches(computedMatches);
  }, [computedMatches, setSearchMatches]);

  useEffect(() => {
    if (!searchTerm || searchMatches.length === 0) return;
    const match = searchMatches[searchActiveIndex];
    if (!match) return;
    const el = document.querySelector(
      `[data-record-id="${match.recordId}"][data-field-id="${match.fieldId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [searchActiveIndex, searchTerm, searchMatches]);

  const { startEdit, confirmEdit, cancelEdit, moveEdit } = useCellEdit(
    tableId, records, setRecords, editingCell, setEditingCell,
  );

  const [resize, setResize] = useState<ResizeState | null>(null);
  const [menuField, setMenuField] = useState<{
    field: Field;
    x: number;
    y: number;
  } | null>(null);
  const [editField, setEditField] = useState<Field | null>(null);
  const [descField, setDescField] = useState<Field | null>(null);
  const [deleteField, setDeleteField] = useState<Field | null>(null);
  const [contextMenuRecord, setContextMenuRecord] = useState<{
    record: TableRecord;
    x: number;
    y: number;
  } | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<{
    record: TableRecord;
    index: number;
  } | null>(null);
  const [delRecordId, setDelRecordId] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  const visibleFields = fields.filter((f) => !hiddenFields.includes(f.id));

  const getColWidth = useCallback(
    (fieldId: string) => columnWidths[fieldId] || DEFAULT_COL_WIDTH,
    [columnWidths],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, fieldId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setResize({ fieldId, startX: e.clientX, startWidth: getColWidth(fieldId) });
    },
    [getColWidth],
  );

  useEffect(() => {
    if (!resize) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resize.startX;
      setColumnWidth(resize.fieldId, resize.startWidth + delta);
    };
    const onUp = () => setResize(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resize, setColumnWidth]);

  const handleMenuOpen = useCallback(
    (e: React.MouseEvent, field: Field) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const w = 224;
      let x = rect.left;
      if (x + w > window.innerWidth - 8) x = Math.max(8, window.innerWidth - w - 8);
      let y = rect.bottom + 2;
      if (y + 440 > window.innerHeight - 8) y = rect.top - 440 - 2;
      setMenuField({ field, x, y });
    },
    [],
  );

  const handleDuplicateField = useCallback(
    async (field: Field) => {
      try {
        const currentOptions =
          typeof field.options_json === "object" && field.options_json !== null
            ? field.options_json
            : {};
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/tables/${field.table_id}/fields`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({
              name: `${field.name} (copia)`,
              field_type: field.field_type,
              options_json: currentOptions,
              order_position: field.order_position + 1,
            }),
          }
        );
        if (res.ok) onRefresh();
      } catch {}
    },
    [onRefresh],
  );

  const handleInsertField = useCallback(
    async (field: Field, side: "left" | "right") => {
      const pos = side === "left" ? field.order_position : field.order_position + 1;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/tables/${field.table_id}/fields`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({
              name: "Nuevo campo",
              field_type: "singleLineText",
              order_position: pos,
            }),
          }
        );
        if (res.ok) onRefresh();
      } catch {}
    },
    [onRefresh],
  );

  const handleAddRecord = useCallback(async () => {
    const { createRecord } = await import("@/lib/api");
    try {
      const data: Record<string, unknown> = {};
      fields.forEach((f) => { data[f.id] = ""; });
      const newRecord = await createRecord(tableId, { data_json: data });
      setRecords([...records, newRecord]);
    } catch {}
  }, [tableId, fields, records, setRecords]);

  const handleInsertRecord = useCallback(
    async (referenceId: string, position: "above" | "below") => {
      const { createRecord } = await import("@/lib/api");
      try {
        const data: Record<string, unknown> = {};
        fields.forEach((f) => { data[f.id] = ""; });
        const newRecord = await createRecord(tableId, { data_json: data });
        const idx = records.findIndex((r) => r.id === referenceId);
        const updated = [...records];
        updated.splice(position === "above" ? idx : idx + 1, 0, newRecord);
        setRecords(updated);
      } catch {}
    },
    [tableId, fields, records, setRecords],
  );

  const handleDuplicateRecord = useCallback(
    async (record: TableRecord) => {
      const { createRecord } = await import("@/lib/api");
      try {
        const newRecord = await createRecord(tableId, {
          data_json: { ...record.data_json },
        });
        setRecords([...records, newRecord]);
      } catch {}
    },
    [tableId, records, setRecords],
  );

  const handleDeleteRecord = useCallback(
    (recordId: string) => {
      setRemovingIds((prev) => new Set(prev).add(recordId));
      setTimeout(() => {
        setRecords(records.filter((r) => r.id !== recordId));
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(recordId);
          return next;
        });
      }, 250);
    },
    [records, setRecords],
  );

  const handleDeleteSelected = useCallback(async () => {
    const { deleteRecord } = await import("@/lib/api");
    const ids = [...selectedRecords];
    setRemovingIds(new Set(ids));
    await Promise.allSettled(ids.map((id) => deleteRecord(id)));
    setTimeout(() => {
      setRecords(records.filter((r) => !selectedRecords.has(r.id)));
      setRemovingIds(new Set());
      setSelectedRecords(new Set());
    }, 250);
  }, [selectedRecords, records, setRecords]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedRecords((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(sortedRecords.map((r) => r.id));
    setSelectedRecords((prev) =>
      prev.size === allIds.size ? new Set<string>() : allIds
    );
  }, [sortedRecords]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, record: TableRecord) => {
      e.preventDefault();
      setContextMenuRecord({ record, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const recordPlural =
    fields.find((f) => f.is_primary)?.name?.toLowerCase() || "registros";
  const recordLabel = recordPlural.endsWith("s") ? recordPlural.slice(0, -1) : recordPlural;

  const summaryValues = useCallback(
    (f: Field) => {
      const fn = fieldSummaries[f.id];
      if (!fn) return null;
      const vals = records
        .map((r) => r.data_json[f.id])
        .filter((v) => v !== null && v !== undefined && v !== "");
      if (fn === "Suma") return String(vals.reduce((a: number, b: unknown) => a + Number(b), 0));
      if (fn === "Promedio") return vals.length ? String(Number(vals.reduce((a: number, b: unknown) => a + Number(b), 0)) / vals.length) : "—";
      if (fn === "Vacío") return String(records.length - vals.length);
      if (fn === "Relleno") return String(vals.length);
      if (fn === "% Vacío") return records.length ? `${Math.round((records.length - vals.length) / records.length * 100)}%` : "—";
      if (fn === "% Relleno") return records.length ? `${Math.round(vals.length / records.length * 100)}%` : "—";
      if (fn === "Únicos") return String(new Set(vals).size);
      if (fn === "% Únicos") return vals.length ? `${Math.round(new Set(vals).size / vals.length * 100)}%` : "—";
      if (fn === "Mín") return vals.length ? String(Math.min(...vals.map(Number))) : "—";
      if (fn === "Máx") return vals.length ? String(Math.max(...vals.map(Number))) : "—";
      if (fn === "Mediana") {
        if (!vals.length) return "—";
        const sorted = vals.map(Number).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? String(sorted[mid]) : String((sorted[mid - 1] + sorted[mid]) / 2);
      }
      return null;
    },
    [records, fieldSummaries],
  );

  return (
    <div className="flex flex-col flex-1 min-w-0" ref={gridRef}>
      <div className="flex-1 overflow-auto">
        <table className="table-fixed border-collapse min-w-max">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface sticky top-0 z-10">
              <th className="w-12 border-r border-brand-border p-0 align-middle">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-brand-border text-brand-blue cursor-pointer m-auto block"
                  checked={sortedRecords.length > 0 && selectedRecords.size === sortedRecords.length}
                  onChange={selectAll}
                />
              </th>
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  className="relative border-r border-brand-border px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-surface-strong transition-colors group select-none align-middle"
                  style={{ width: getColWidth(field.id) }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-brand-muted shrink-0">
                      {FIELD_ICONS[field.field_type] || "…"}
                    </span>
                    <span className="truncate">{field.name}</span>
                    <button
                      onClick={(e) => handleMenuOpen(e, field)}
                      className="text-brand-border-strong opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand-ink rounded cursor-pointer shrink-0 ml-0.5"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-blue/50 z-20"
                    onMouseDown={(e) => handleResizeStart(e, field.id)}
                  />
                </th>
              ))}
              <th className="border-r border-brand-border p-0 w-[160px] align-middle">
                <button
                  onClick={onAddField}
                  className="w-full h-full flex items-center justify-center text-brand-muted hover:text-brand-blue hover:bg-brand-blue/5 transition-colors cursor-pointer py-2"
                  title="Agregar campo"
                >
                  <Plus size={18} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {activeGroups.length === 0 ? (
              sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={visibleFields.length + 2} className="py-8 text-center text-sm text-brand-muted">
                    Sin registros
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className={`border-b border-brand-border hover:bg-brand-surface/50 transition-all duration-200 group ${ROW_HEIGHTS[rowHeight]} ${
                      removingIds.has(record.id) ? "opacity-0 scale-y-0" : ""
                    }`}
                    style={recordColors.get(record.id) ? { borderLeft: `3px solid ${recordColors.get(record.id)}` } : undefined}
                    onContextMenu={(e) => handleContextMenu(e, record)}
                  >
                    <td className="w-12 border-r border-brand-border align-middle text-center text-xs text-brand-muted relative">
                      <span className={`${selectedRecords.size > 0 ? "hidden" : "group-hover:hidden"}`}>{index + 1}</span>
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-brand-border text-brand-blue cursor-pointer absolute inset-0 m-auto"
                        checked={selectedRecords.has(record.id)}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </td>
                    {visibleFields.map((field) => (
                      <GridCell
                        key={field.id}
                        field={field}
                        value={record.data_json[field.id]}
                        isEditing={
                          editingCell?.recordId === record.id &&
                          editingCell?.fieldId === field.id
                        }
                        width={getColWidth(field.id)}
                        rowHeight={rowHeight}
                        onStartEdit={() => startEdit(record.id, field.id)}
                        onConfirmEdit={(v) => confirmEdit(record.id, field.id, v)}
                        onCancelEdit={cancelEdit}
                        onTabNext={() => moveEdit(record.id, field.id, "next", visibleFields)}
                        onTabPrev={() => moveEdit(record.id, field.id, "prev", visibleFields)}
                        searchTerm={searchTerm}
                        recordId={record.id}
                        isActiveMatch={
                          searchMatches.length > 0 &&
                          searchMatches[searchActiveIndex]?.recordId === record.id &&
                          searchMatches[searchActiveIndex]?.fieldId === field.id
                        }
                      />
                    ))}
                    <td className="border-r border-brand-border w-[160px]" />
                  </tr>
                ))
              )
            ) : flattenResult.length === 0 ? (
              <tr>
                <td colSpan={visibleFields.length + 2} className="py-8 text-center text-sm text-brand-muted">
                  Sin registros
                </td>
              </tr>
            ) : (
              flattenResult.map((item, fi) => {
                if (item.type === "header") {
                  const node = item.node;
                  const path = item.groupPath;
                  const isCollapsed = collapsed.has(path);
                  const indent = node.depth * 24;

                  return (
                    <tr
                      key={`hdr-${fi}`}
                      className="border-b border-brand-border bg-brand-surface hover:bg-brand-surface-strong cursor-pointer select-none"
                      onClick={() => toggleCollapse(path)}
                    >
                      <td colSpan={visibleFields.length + 2} className="px-3 py-1.5">
                        <div className="flex items-center gap-2" style={{ paddingLeft: indent }}>
                          {isCollapsed ? (
                            <ChevronRight size={14} className="text-brand-muted shrink-0" />
                          ) : (
                            <ChevronDown size={14} className="text-brand-muted shrink-0" />
                          )}
                          {node.value && node.depth === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-blue/10 text-brand-blue">
                              {node.value}
                            </span>
                          )}
                          {node.value && node.depth > 0 && (
                            <span className="text-sm font-medium text-brand-ink">
                              {node.value}
                            </span>
                          )}
                          <span className="text-xs text-brand-muted tabular-nums">
                            ({node.count})
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const record = item.record!;
                return (
                  <tr
                    key={record.id}
                    className={`border-b border-brand-border hover:bg-brand-surface/50 transition-all duration-200 group ${ROW_HEIGHTS[rowHeight]} ${
                      removingIds.has(record.id) ? "opacity-0 scale-y-0" : ""
                    }`}
                    style={recordColors.get(record.id) ? { borderLeft: `3px solid ${recordColors.get(record.id)}` } : undefined}
                    onContextMenu={(e) => handleContextMenu(e, record)}
                  >
                    <td className="w-12 border-r border-brand-border align-middle text-center text-xs text-brand-muted relative">
                      <span className={`${selectedRecords.size > 0 ? "hidden" : "group-hover:hidden"}`}>{item.recordIndex! + 1}</span>
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-brand-border text-brand-blue cursor-pointer absolute inset-0 m-auto"
                        checked={selectedRecords.has(record.id)}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </td>
                    {visibleFields.map((field) => (
                      <GridCell
                        key={field.id}
                        field={field}
                        value={record.data_json[field.id]}
                        isEditing={
                          editingCell?.recordId === record.id &&
                          editingCell?.fieldId === field.id
                        }
                        width={getColWidth(field.id)}
                        rowHeight={rowHeight}
                        onStartEdit={() => startEdit(record.id, field.id)}
                        onConfirmEdit={(v) => confirmEdit(record.id, field.id, v)}
                        onCancelEdit={cancelEdit}
                        onTabNext={() => moveEdit(record.id, field.id, "next", visibleFields)}
                        onTabPrev={() => moveEdit(record.id, field.id, "prev", visibleFields)}
                        searchTerm={searchTerm}
                        recordId={record.id}
                        isActiveMatch={
                          searchMatches.length > 0 &&
                          searchMatches[searchActiveIndex]?.recordId === record.id &&
                          searchMatches[searchActiveIndex]?.fieldId === field.id
                        }
                      />
                    ))}
                    <td className="border-r border-brand-border w-[160px]" />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div
          className="flex items-center h-8 border-b border-brand-border hover:bg-brand-surface/50 cursor-pointer text-brand-muted"
          onClick={handleAddRecord}
        >
          <div className="w-12 shrink-0 flex items-center justify-center border-r border-brand-border">
            <Plus size={14} />
          </div>
          <div className="flex-1 px-3 text-sm text-brand-border-strong italic">
            Añadir registro...
          </div>
        </div>

        <div className="flex border-t border-brand-border bg-brand-canvas text-xs text-brand-muted">
          <div className="w-12 shrink-0 border-r border-brand-border py-1" />
          {visibleFields.map((field) => {
            const summary = summaryValues(field);
            return (
              <div
                key={field.id}
                className="border-r border-brand-border px-3 py-1 min-h-[24px]"
                style={{ width: getColWidth(field.id) }}
              >
                {summary && (
                  <span className="truncate block">{summary}</span>
                )}
              </div>
            );
          })}
          <div className="border-r border-brand-border w-[160px]" />
        </div>
      </div>

      <GridFooter
        recordCount={displayedRecords.length}
        recordLabel={recordPlural}
        onAddRecord={handleAddRecord}
      />

      {menuField && (
        <FieldContextMenu
          field={menuField.field}
          position={{ x: menuField.x, y: menuField.y }}
          onClose={() => setMenuField(null)}
          onEditField={() => {
            setEditField(menuField.field);
            setMenuField(null);
          }}
          onDuplicateField={() => {
            handleDuplicateField(menuField.field);
            setMenuField(null);
          }}
          onInsertLeft={() => {
            handleInsertField(menuField.field, "left");
            setMenuField(null);
          }}
          onInsertRight={() => {
            handleInsertField(menuField.field, "right");
            setMenuField(null);
          }}
          onEditDescription={() => {
            setDescField(menuField.field);
            setMenuField(null);
          }}
          onDeleteField={() => {
            setDeleteField(menuField.field);
            setMenuField(null);
          }}
        />
      )}

      {editField && (
        <FieldEditModal
          field={editField}
          open={!!editField}
          onClose={() => setEditField(null)}
          onSaved={onRefresh}
        />
      )}

      {descField && (
        <FieldDescriptionModal
          field={descField}
          open={!!descField}
          onClose={() => setDescField(null)}
          onSaved={onRefresh}
        />
      )}

      {deleteField && (
        <DeleteFieldModal
          field={deleteField}
          open={!!deleteField}
          onClose={() => setDeleteField(null)}
          onDeleted={onRefresh}
        />
      )}

      {contextMenuRecord && (
        <RecordContextMenu
          recordLabel={recordLabel}
          selectionCount={selectedRecords.size > 1 ? selectedRecords.size : 1}
          position={{ x: contextMenuRecord.x, y: contextMenuRecord.y }}
          onClose={() => setContextMenuRecord(null)}
          onInsertAbove={() => {
            handleInsertRecord(contextMenuRecord.record.id, "above");
            setContextMenuRecord(null);
          }}
          onInsertBelow={() => {
            handleInsertRecord(contextMenuRecord.record.id, "below");
            setContextMenuRecord(null);
          }}
          onDuplicate={() => {
            handleDuplicateRecord(contextMenuRecord.record);
            setContextMenuRecord(null);
          }}
          onExpand={() => {
            setExpandedRecord({
              record: contextMenuRecord.record,
              index: sortedRecords.findIndex((r) => r.id === contextMenuRecord.record.id),
            });
            setContextMenuRecord(null);
          }}
          onDelete={() => {
            if (selectedRecords.size > 1) {
              setDelRecordId("__bulk__");
            } else {
              setDelRecordId(contextMenuRecord.record.id);
            }
            setContextMenuRecord(null);
          }}
        />
      )}

      {expandedRecord && (
        <RecordExpanded
          record={expandedRecord.record}
          recordIndex={expandedRecord.index}
          totalRecords={sortedRecords.length}
          fields={fields}
          hiddenFields={hiddenFields}
          onClose={() => setExpandedRecord(null)}
          onPrev={() => {
            const i = expandedRecord.index;
            if (i > 0) {
              setExpandedRecord({ record: sortedRecords[i - 1], index: i - 1 });
            }
          }}
          onNext={() => {
            const i = expandedRecord.index;
            if (i < sortedRecords.length - 1) {
              setExpandedRecord({ record: sortedRecords[i + 1], index: i + 1 });
            }
          }}
          onAddField={onAddField}
          onDeleteRecord={(recordId) => {
            handleDeleteRecord(recordId);
          }}
        />
      )}

      {delRecordId === "__bulk__" && (
        <DeleteRecordModal
          recordId="__bulk__"
          recordLabel={`${selectedRecords.size} ${recordLabel}${selectedRecords.size > 1 ? "s" : ""}`}
          open={true}
          onClose={() => setDelRecordId(null)}
          onDeleted={() => {
            handleDeleteSelected();
            setDelRecordId(null);
          }}
        />
      )}

      {delRecordId && delRecordId !== "__bulk__" && (
        <DeleteRecordModal
          recordId={delRecordId}
          recordLabel={recordLabel}
          open={!!delRecordId}
          onClose={() => setDelRecordId(null)}
          onDeleted={() => {
            handleDeleteRecord(delRecordId);
            setDelRecordId(null);
          }}
        />
      )}
    </div>
  );
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export async function resizeImageIfNeeded(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => {
      const maxDim = 1200;
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
        return;
      }
      if (width > height) {
        height = (height / width) * maxDim;
        width = maxDim;
      } else {
        width = (width / height) * maxDim;
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = URL.createObjectURL(file);
  });
}

function RatingCell({ field, value, onConfirmEdit }: { field: Field; value: unknown; onConfirmEdit: (v: unknown) => void }) {
  const opts = (field.options_json as { max?: number; color?: string }) || {};
  const max = opts.max || 5;
  const color = opts.color || "#eab308";
  const current = Number(value) || 0;
  const [hover, setHover] = useState(0);
  const active = hover || current;

  return (
    <>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < active;
        return (
          <button
            key={i}
            className="cursor-pointer"
            onMouseEnter={() => setHover(i + 1)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onConfirmEdit(current === i + 1 ? null : i + 1)}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill={filled ? color : "#d1d5db"}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </>
  );
}

interface GridCellProps {
  field: Field;
  value: unknown;
  isEditing: boolean;
  width: number;
  rowHeight: "short" | "medium" | "tall" | "extraTall";
  onStartEdit: () => void;
  onConfirmEdit: (value: unknown) => void;
  onCancelEdit: () => void;
  onTabNext: () => void;
  onTabPrev: () => void;
  searchTerm: string;
  recordId: string;
  isActiveMatch: boolean;
}

function renderHighlighted(text: string, term: string): React.ReactNode {
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 rounded-sm px-0.5 text-brand-ink">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}

function GridCell({
  field, value, isEditing, width, rowHeight,
  onStartEdit, onConfirmEdit, onCancelEdit, onTabNext, onTabPrev,
  searchTerm, recordId, isActiveMatch,
}: GridCellProps) {
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [previewAtt, setPreviewAtt] = useState<{
    id: string; filename: string; type: string; size: number; data: string;
  } | null>(null);
  const [linkedPickerPos, setLinkedPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [linkedRecordsCache, setLinkedRecordsCache] = useState<Record<string, string>>({});
  const isLinkedRecord = field.field_type === "multipleRecordLinks";
  const isEditable = EDITABLE_TYPES.has(field.field_type);
  const isAttachment = field.field_type === "attachment";
  const isNumeric = ["number", "currency", "percent", "duration"].includes(field.field_type);
  const isCheckbox = field.field_type === "checkbox";
  const isFormula = ["formula", "rollup", "lookup", "count", "autoNumber", "createdTime", "lastModifiedTime"].includes(field.field_type);

  const parseEditValue = useCallback(
    (val: string): unknown => {
      if (field.field_type === "duration" && val !== "") {
        const parsed = parseDurationInput(val);
        return parsed !== null ? parsed : val;
      }
      if (isNumeric && val !== "") {
        const n = parseFloat(val);
        return isNaN(n) ? val : n;
      }
      return val;
    },
    [isNumeric, field.field_type],
  );

  useEffect(() => {
    if (isEditing && !isAttachment && inputRef.current) {
      if (field.field_type === "currency" || field.field_type === "duration") {
        const raw = value !== null && value !== undefined ? String(value) : "";
        setEditValue(raw);
      } else {
        setEditValue(formatDisplayValue(field, value));
      }
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, field, value, isAttachment]);

  const handleDoubleClick = useCallback(() => {
    if (!isEditable || isEditing) return;
    if (isAttachment) {
      fileInputRef.current?.click();
      return;
    }
    if (field.field_type === "rating") return;
    onStartEdit();
  }, [isEditable, isEditing, isAttachment, field.field_type, onStartEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); onConfirmEdit(parseEditValue(editValue)); }
      else if (e.key === "Escape") { onCancelEdit(); }
      else if (e.key === "Tab") {
        e.preventDefault();
        onConfirmEdit(parseEditValue(editValue));
        e.shiftKey ? onTabPrev() : onTabNext();
      }
    },
    [editValue, onConfirmEdit, onCancelEdit, onTabNext, onTabPrev, parseEditValue],
  );

  const display = formatDisplayValue(field, value);

  const checkColor = (field.options_json as { color?: string })?.color || "#22c55e";

  const hasMatch = searchTerm
    ? display.toLowerCase().includes(searchTerm.toLowerCase())
    : false;
  const matchStyle = hasMatch && !isActiveMatch
    ? { backgroundColor: "#fef08a" }
    : undefined;

  const highlight = searchTerm && display ? renderHighlighted(display, searchTerm) : display;

  if (isEditing) {
    if (isCheckbox) {
      const isChecked = Boolean(value);
      return (
        <td
          className="border-r border-brand-border px-3 align-middle cursor-pointer"
          style={{ width, ...matchStyle }}
          data-record-id={recordId}
          data-field-id={field.id}
          onClick={() => onConfirmEdit(!isChecked)}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            isChecked ? "border-brand-success" : "border-brand-border-strong"
          }`}
          style={isChecked ? { backgroundColor: checkColor, borderColor: checkColor, color: "white" } : undefined}>
            {isChecked && <span className="text-[10px]">✓</span>}
          </div>
        </td>
      );
    }

    if (field.field_type === "singleSelect" || field.field_type === "multipleSelects") {
      const choices = (field.options_json as { choices?: { name: string; color?: string }[] })?.choices || [];
      return (
        <td className="border-r border-brand-border p-0 align-middle bg-white" style={{ width }} data-record-id={recordId} data-field-id={field.id}>
          <select
            value={editValue}
            onChange={(e) => onConfirmEdit(e.target.value)}
            onBlur={() => onCancelEdit()}
            onKeyDown={(e) => { if (e.key === "Escape") onCancelEdit(); }}
            className="w-full h-full px-3 py-1.5 text-sm text-brand-ink outline-none bg-white border-0 shadow-[0_0_0_2px_#1665d8] rounded-sm cursor-pointer"
            autoFocus
          >
            <option value="">—</option>
            {choices.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </td>
      );
    }

    if (field.field_type === "date" || field.field_type === "dateTime") {
      const type = field.field_type === "dateTime" ? "datetime-local" : "date";
      return (
        <td className="border-r border-brand-border p-0 align-middle bg-white" style={{ width }} data-record-id={recordId} data-field-id={field.id}>
          <div className="shadow-[0_0_0_2px_#1665d8] rounded-sm">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => onConfirmEdit(parseEditValue(editValue))}
              className="w-full px-3 py-1.5 text-sm text-brand-ink outline-none bg-transparent"
            />
          </div>
        </td>
      );
    }

    return (
      <td className="border-r border-brand-border p-0 align-middle" style={{ width, ...matchStyle }} data-record-id={recordId} data-field-id={field.id}>
        <div className="shadow-[0_0_0_2px_#1665d8] rounded-sm">
          <input
            ref={inputRef}
            type={isNumeric && field.field_type !== "duration" ? "number" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onConfirmEdit(parseEditValue(editValue))}
            className="w-full px-3 py-1.5 text-sm text-brand-ink outline-none bg-transparent"
            step={isNumeric ? "any" : undefined}
          />
        </div>
      </td>
    );
  }

  return (
    <td
      className={`border-r border-brand-border px-3 align-middle text-sm select-none ${
        isNumeric ? "text-right" : "text-left"
      } ${isCheckbox ? "cursor-pointer" : isEditable ? "cursor-cell" : "cursor-default"} ${
        isFormula ? "text-brand-muted/60" : "text-brand-ink"
      } ${isActiveMatch ? "ring-2 ring-brand-blue z-10" : ""}`}
      style={{ width, ...matchStyle }}
      data-record-id={recordId}
      data-field-id={field.id}
      onDoubleClick={isCheckbox ? undefined : handleDoubleClick}
      onClick={isCheckbox ? () => onConfirmEdit(!Boolean(value)) : undefined}
      title={isCheckbox ? undefined : display}
    >
      {isLinkedRecord ? (
        (() => {
          const ids = String(value || "").split(",").filter(Boolean);
          const foreignTableId = (field.options_json as { foreignTableId?: string })?.foreignTableId;

          return (
            <>
              <div className="flex flex-wrap items-center gap-1 py-0.5">
                {ids.map((id) => {
                  const name = linkedRecordsCache[id] || id;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-brand-surface border border-brand-border text-brand-ink max-w-[140px] truncate"
                      title={name}
                    >
                      <span className="truncate">{name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmEdit(ids.filter((i) => i !== id).join(","));
                        }}
                        className="shrink-0 text-brand-muted hover:text-red-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={(e) => {
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    let x = r.left;
                    if (x + 256 > window.innerWidth - 8) x = Math.max(8, window.innerWidth - 256 - 8);
                    let y = r.bottom + 4;
                    if (y + 320 > window.innerHeight - 8) y = r.top - 320 - 4;
                    setLinkedPickerPos({ x, y });
                  }}
                  className="inline-flex items-center justify-center w-5 h-5 rounded text-brand-muted hover:text-brand-blue hover:bg-brand-surface cursor-pointer shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>

              {linkedPickerPos && foreignTableId && (
                <LinkedRecordPicker
                  tableId={foreignTableId}
                  position={linkedPickerPos}
                  selectedIds={ids}
                  single={false}
                  onSelect={(newIds) => {
                    onConfirmEdit(newIds.join(","));
                    setLinkedPickerPos(null);
                  }}
                  onClose={() => setLinkedPickerPos(null)}
                />
              )}
            </>
          );
        })()
      ) : field.field_type === "rating" ? (
        <RatingCell field={field} value={value} onConfirmEdit={onConfirmEdit} />
      ) : field.field_type === "attachment" ? (
        (() => {
          let att: { id?: string; filename?: string; type?: string; size?: number; data?: string } | null = null;
          try { att = value ? JSON.parse(String(value)) : null; } catch {}
          const hasFile = !!(att?.filename && att?.data);
          const isImage = att?.type?.startsWith("image/");
          const name = att?.filename || "";

          const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const data = await resizeImageIfNeeded(file);
            const newAtt = {
              id: `att_${Date.now()}`,
              filename: file.name,
              type: file.type,
              size: file.size,
              data,
            };
            onConfirmEdit(JSON.stringify(newAtt));
          };

          const handleReplaceClick = () => {
            replaceInputRef.current?.click();
          };

          const handlePreviewClick = () => {
            if (att?.data && att?.filename) {
              setPreviewAtt({
                id: att.id || "",
                filename: att.filename,
                type: att.type || "",
                size: att.size || 0,
                data: att.data,
              });
            }
          };

          return (
            <>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
              <input ref={replaceInputRef} type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />

              {hasFile ? (
                <div className="flex items-center gap-1.5 w-full min-w-0">
                  {isImage ? (
                    <button
                      onClick={handlePreviewClick}
                      className="w-5 h-5 rounded overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      title={name}
                    >
                      <img src={att!.data} alt="" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <button
                      onClick={handlePreviewClick}
                      className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      title={name}
                    >
                      <Image size={14} className="text-red-400" />
                    </button>
                  )}
                  <button
                    onClick={handleReplaceClick}
                    className="shrink-0 cursor-pointer hover:text-brand-blue transition-colors"
                    title="Reemplazar archivo"
                  >
                    <Paperclip size={12} className="text-brand-muted hover:text-brand-blue transition-colors" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 truncate">
                  <Paperclip size={12} className="text-brand-muted shrink-0" />
                  <span className="truncate text-xs text-brand-border-strong italic">
                    Vacío
                  </span>
                </div>
              )}

              {previewAtt && (
                <AttachmentPreviewModal
                  open={!!previewAtt}
                  attachment={previewAtt}
                  onClose={() => setPreviewAtt(null)}
                  onUpload={(data, filename, type, size) => {
                    onConfirmEdit(JSON.stringify({
                      id: `att_${Date.now()}`,
                      filename,
                      type,
                      size,
                      data,
                    }));
                    setPreviewAtt(null);
                  }}
                />
              )}
            </>
          );
        })()
      ) : field.field_type === "singleSelect" || field.field_type === "multipleSelects" ? (
        (() => {
          const choices = (field.options_json as { choices?: { name: string; color?: string }[] })?.choices || [];
          const selected = field.field_type === "multipleSelects"
            ? ((value as string) || "").split(",").filter(Boolean)
            : [String(value || "")].filter(Boolean);
          return (
            <div className="flex flex-wrap gap-0.5 py-0.5">
              {selected.map((sel) => {
                const opt = choices.find((c) => c.name === sel);
                const color = opt?.color || "#e5e7eb";
                const hex = color.startsWith("#") ? color : (COLOR_PALETTE.find((c) => c.hex === color)?.hex || color);
                return (
                  <span
                    key={sel}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium truncate max-w-[140px]"
                    style={{ backgroundColor: hexAlpha(hex, 0.15), color: hex }}
                    title={sel}
                  >
                    {sel}
                  </span>
                );
              })}
            </div>
          );
        })()
      ) : isCheckbox ? (
        <div className="flex items-center justify-center h-full min-h-[20px] -mx-3 -my-2">
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            Boolean(value) ? "bg-brand-success border-brand-success text-white" : "border-brand-border-strong"
          }`}>
            {Boolean(value) && <span className="text-[10px]">✓</span>}
          </div>
        </div>
      ) : display ? (
        <span className="truncate block">{highlight}</span>
      ) : (
        <span className="text-brand-border-strong italic text-xs">
          {field.is_primary && rowHeight !== "short" ? "Vacío" : ""}
        </span>
      )}
    </td>
  );
}
