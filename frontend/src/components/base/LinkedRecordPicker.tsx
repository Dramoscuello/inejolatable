"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, Paperclip } from "lucide-react";
import { getPickerRecords, type Field, type PickerField, type PickerRecord } from "@/lib/api";
import { formatDisplayValue, hexAlpha } from "@/lib/format";
import { COLOR_PALETTE } from "@/store/useBaseStore";
import { CreateRecordModal } from "./CreateRecordModal";

interface LinkedRecordPickerProps {
  tableId: string;
  position: { x: number; y: number };
  selectedIds: string[];
  single: boolean;
  onSelect: (ids: string[]) => void;
  onClose: () => void;
}

const PAGE_SIZE = 20;
const MIN_W = 300;
const MIN_H = 180;
const MAX_W = 640;
const MAX_H = 560;

interface Size {
  w: number;
  h: number;
}

function formatAttachmentValue(value: unknown): { data?: string; filename?: string; type?: string } | null {
  try {
    const att = value ? JSON.parse(String(value)) : null;
    return att && typeof att === "object" ? att : null;
  } catch {
    return null;
  }
}

function AttachmentThumb({ value }: { value: unknown }) {
  const att = formatAttachmentValue(value);
  if (!att || !att.filename) return null;
  if (att.data && att.type?.startsWith("image/")) {
    return (
      <img
        src={att.data}
        alt=""
        className="w-8 h-8 rounded-md object-cover shrink-0 border border-brand-border"
        title={att.filename}
      />
    );
  }
  return (
    <span
      className="w-8 h-8 rounded-md bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted shrink-0"
      title={att.filename}
    >
      <Paperclip size={12} />
    </span>
  );
}

function FieldPreview({ field, value }: { field: PickerField; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;

  if (field.field_type === "checkbox") {
    if (!Boolean(value)) return null;
    return <span className="text-brand-success text-xs font-semibold shrink-0">✓</span>;
  }

  if (field.field_type === "singleSelect" || field.field_type === "multipleSelects") {
    const choices = (field.options_json as { choices?: { name: string; color?: string }[] })?.choices || [];
    const selected = field.field_type === "multipleSelects"
      ? String(value).split(",").filter(Boolean)
      : [String(value)].filter(Boolean);
    return (
      <span className="flex flex-wrap gap-1">
        {selected.map((sel) => {
          if (field.field_type === "multipleSelects") {
            return (
              <span
                key={sel}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium truncate max-w-[110px] bg-gray-100 text-gray-600"
                title={sel}
              >
                {sel}
              </span>
            );
          }
          const opt = choices.find((c) => c.name === sel);
          const raw = opt?.color || "#e5e7eb";
          const hex = raw.startsWith("#") ? raw : (COLOR_PALETTE.find((c) => c.hex === raw)?.hex || raw);
          return (
            <span
              key={sel}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium truncate max-w-[110px]"
              style={{ backgroundColor: hexAlpha(hex, 0.15), color: hex }}
              title={sel}
            >
              {sel}
            </span>
          );
        })}
      </span>
    );
  }

  const display = formatDisplayValue(
    { field_type: field.field_type, options_json: field.options_json } as unknown as Field,
    value,
  );
  if (!display) return null;
  return (
    <span className="text-xs text-brand-muted truncate max-w-[120px] shrink-0" title={display}>
      {display}
    </span>
  );
}

export function LinkedRecordPicker({
  tableId,
  position,
  selectedIds,
  single,
  onSelect,
  onClose,
}: LinkedRecordPickerProps) {
  const [fields, setFields] = useState<PickerField[]>([]);
  const [records, setRecords] = useState<PickerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [size, setSize] = useState<Size>({ w: 360, h: 320 });
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startSize: Size } | null>(null);

  const primaryFieldId =
    fields.find((f) => f.is_primary)?.id || fields[0]?.id || null;

  const fetchPage = useCallback(
    async (query: string, cursor: string | null, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await getPickerRecords(
          tableId,
          { searchQuery: query, cursor: cursor || undefined, limit: PAGE_SIZE },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (!append) setFields(res.fields);
        setRecords((prev) => (append ? [...prev, ...res.records] : res.records));
        setNextCursor(res.next_cursor);
      } catch {
        if (!controller.signal.aborted) {
          if (!append) setRecords([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [tableId],
  );

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    getPickerRecords(tableId, { limit: PAGE_SIZE }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setFields(res.fields);
        setRecords(res.records);
        setNextCursor(res.next_cursor);
      })
      .catch(() => {
        if (!controller.signal.aborted) setRecords([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tableId]);

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
    if (!sentinelRef.current || !nextCursor || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          fetchPage(search, nextCursor, true);
        }
      },
      { root: listRef.current, rootMargin: "40px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loading, loadingMore, search, fetchPage]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setRecords([]);
      setNextCursor(null);
      fetchPage(value.trim(), null, false);
    }, 150);
  };

  const handleToggle = (id: string) => {
    if (single) {
      onSelect(selectedIds.includes(id) ? [] : [id]);
    } else {
      const set = new Set(selectedIds);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      onSelect(Array.from(set));
    }
  };

  const handleCreated = (recordId: string) => {
    setSearch("");
    fetchPage("", null, false);
    if (single) {
      onSelect([recordId]);
    } else {
      onSelect([...selectedIds, recordId]);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startSize: size };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      setSize({
        w: Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.startSize.w + dx)),
        h: Math.min(MAX_H, Math.max(MIN_H, resizeRef.current.startSize.h + dy)),
      });
    };
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const secondaryFields = fields.filter((f) => f.id !== primaryFieldId);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl border border-brand-border shadow-[0_4px_16px_rgba(15,23,42,0.12)] overflow-hidden flex flex-col"
      style={{ left: position.x, top: position.y, width: size.w, height: size.h }}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-brand-border shrink-0">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-border-strong pointer-events-none" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar"
            autoFocus
            className="w-full pl-7 pr-2 py-1.5 text-xs text-brand-ink bg-transparent outline-none placeholder:text-brand-border-strong"
          />
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          title="Crear registro en la tabla vinculada"
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-brand-muted hover:text-brand-blue hover:bg-brand-surface transition-colors cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-3 py-6 text-xs text-brand-muted text-center">Cargando...</p>
        ) : records.length === 0 ? (
          <p className="px-3 py-6 text-xs text-brand-muted text-center">Sin resultados</p>
        ) : (
          <>
            {records.map((r) => {
              const primaryValue = primaryFieldId ? r.fields[primaryFieldId] : undefined;
              const name =
                primaryValue !== null && primaryValue !== undefined && String(primaryValue).trim() !== ""
                  ? String(primaryValue)
                  : r.id;
              const checked = selectedIds.includes(r.id);
              const attachmentFields = secondaryFields.filter((f) => f.field_type === "attachment");
              const otherFields = secondaryFields.filter((f) => f.field_type !== "attachment");
              const hasSecondary = otherFields.some(
                (f) => r.fields[f.id] !== null && r.fields[f.id] !== undefined && r.fields[f.id] !== ""
              ) || attachmentFields.some((f) => formatAttachmentValue(r.fields[f.id])?.filename);
              return (
                <button
                  key={r.id}
                  onClick={() => handleToggle(r.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-brand-border/60 transition-colors cursor-pointer ${
                    checked ? "bg-blue-50" : "hover:bg-brand-surface/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate font-semibold ${checked ? "text-brand-blue" : "text-brand-ink"}`}>
                      {name}
                    </span>
                    {checked && <span className="text-brand-blue text-xs shrink-0">✓</span>}
                  </div>
                  {hasSecondary && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                        {otherFields.map((f) => (
                          <FieldPreview key={f.id} field={f} value={r.fields[f.id]} />
                        ))}
                      </div>
                      <div className="ml-auto flex items-center gap-1 shrink-0">
                        {attachmentFields.map((f) => (
                          <AttachmentThumb key={f.id} value={r.fields[f.id]} />
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
            <div ref={sentinelRef} className="h-px" />
            {loadingMore && (
              <p className="px-3 py-2 text-xs text-brand-muted text-center">Cargando más...</p>
            )}
          </>
        )}
      </div>

      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end"
        title="Redimensionar"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" className="mb-0.5 mr-0.5 text-brand-border-strong">
          <line x1="10.2" y1="0.8" x2="0.8" y2="10.2" />
          <line x1="10.2" y1="4" x2="4" y2="10.2" />
          <line x1="10.2" y1="7.2" x2="7.2" y2="10.2" />
        </svg>
      </div>

      <CreateRecordModal
        key={createOpen ? "open" : "closed"}
        tableId={tableId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
