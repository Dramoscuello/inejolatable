"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  PanelLeft,
  Eye,
  Filter,
  Group,
  ArrowUpDown,
  Palette,
} from "lucide-react";
import type { Field } from "@/lib/api";
import { useBaseStore } from "@/store/useBaseStore";
import { HideFieldsPopover } from "./HideFieldsPopover";
import { SortPopover } from "./SortPopover";
import { GroupPopover } from "./GroupPopover";
import { FilterPopover } from "./FilterPopover";
import { ColorPopover } from "./ColorPopover";
import { RowHeightPopover } from "./RowHeightPopover";
import { SearchBar } from "./SearchBar";

type PopoverType = "hide" | "filter" | "group" | "sort" | "color" | "rowHeight" | null;

interface ViewBarProps {
  viewName: string;
  viewSidebarOpen: boolean;
  onToggleSidebar: () => void;
  fields: Field[];
}

export function ViewBar({ viewName, viewSidebarOpen, onToggleSidebar, fields }: ViewBarProps) {
  const {
    hiddenFields,
    activeSorts,
    activeGroups,
    activeFilters,
    colorRules,
    searchOpen,
    setSearchOpen,
  } = useBaseStore();

  const [activePopover, setActivePopover] = useState<PopoverType>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openPopover = useCallback(
    (type: PopoverType, key: string) => {
      setActivePopover((prev) => (prev === type ? null : type));
      const btn = btnRefs.current[key];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const popoverWidth = type === "filter" || type === "color" ? 420 : type === "hide" ? 256 : 288;
        const popoverHeight = 400;
        let x = rect.left;
        if (x + popoverWidth > window.innerWidth - 8) {
          x = Math.max(8, window.innerWidth - popoverWidth - 8);
        }
        let y = rect.bottom + 4;
        if (y + popoverHeight > window.innerHeight - 8) {
          y = rect.top - popoverHeight - 4;
        }
        setPopoverPos({ x, y });
      }
    },
    [],
  );

  const totalFilters = activeFilters.reduce((sum, g) => sum + g.conditions.length, 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  return (
    <div className="flex items-center h-9 px-3 bg-brand-canvas border-b border-brand-border shrink-0 gap-1">
      <button
        onClick={onToggleSidebar}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer shrink-0"
      >
        <PanelLeft size={14} />
        {!viewSidebarOpen && <span className="text-xs">Vistas</span>}
      </button>

      <button className="flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer shrink-0">
        {viewName}
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          ref={(el) => { btnRefs.current.hide = el; }}
          onClick={() => openPopover("hide", "hide")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors cursor-pointer ${
            hiddenFields.length > 0
              ? "bg-brand-hide-bg text-brand-hide-text font-medium"
              : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface"
          }`}
        >
          <Eye size={14} />
          {hiddenFields.length > 0
            ? `${hiddenFields.length} campos ocultos`
            : "Ocultar campos"}
        </button>

        <button
          ref={(el) => { btnRefs.current.filter = el; }}
          onClick={() => openPopover("filter", "filter")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors cursor-pointer ${
            totalFilters > 0
              ? "bg-brand-filter-bg text-brand-filter-text font-medium"
              : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface"
          }`}
        >
          <Filter size={14} />
          {totalFilters > 0
            ? `${totalFilters} filtros`
            : "Filtro"}
        </button>

        <button
          ref={(el) => { btnRefs.current.group = el; }}
          onClick={() => openPopover("group", "group")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors cursor-pointer ${
            activeGroups.length > 0
              ? "bg-brand-group-bg text-brand-group-text font-medium"
              : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface"
          }`}
        >
          <Group size={14} />
          {activeGroups.length > 0
            ? `Agrupado por ${activeGroups.length} campos`
            : "Grupo"}
        </button>

        <button
          ref={(el) => { btnRefs.current.sort = el; }}
          onClick={() => openPopover("sort", "sort")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors cursor-pointer ${
            activeSorts.length > 0
              ? "bg-brand-sort-bg text-brand-sort-text font-medium"
              : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface"
          }`}
        >
          <ArrowUpDown size={14} />
          {activeSorts.length > 0
            ? `Ordenado por ${activeSorts.length} campos`
            : "Clasificar"}
        </button>

        <button
          ref={(el) => { btnRefs.current.color = el; }}
          onClick={() => openPopover("color", "color")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors cursor-pointer ${
            colorRules.length > 0
              ? "bg-brand-color-bg text-brand-color-text font-medium"
              : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface"
          }`}
        >
          <Palette size={14} />
          <span className="hidden md:inline">
            {colorRules.length > 0
              ? `${colorRules.length} reglas`
              : "Configurar color"}
          </span>
        </button>

        <button
          ref={(el) => { btnRefs.current.rowHeight = el; }}
          onClick={() => openPopover("rowHeight", "rowHeight")}
          className="p-1.5 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
          title="Altura de fila"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="4.5" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.6"/>
            <rect x="1" y="7.5" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.35"/>
            <rect x="1" y="10.5" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.15"/>
            <path d="M4 0.5L5.5 2L4 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            <path d="M4 13.5L5.5 12L4 10.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
          </svg>
        </button>

        {searchOpen ? (
          <SearchBar />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
            title="Buscar (Ctrl+F)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        )}
      </div>

      {activePopover === "hide" && (
        <HideFieldsPopover
          fields={fields}
          position={popoverPos}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "sort" && (
        <SortPopover
          fields={fields}
          position={popoverPos}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "group" && (
        <GroupPopover
          fields={fields}
          position={popoverPos}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "filter" && (
        <FilterPopover
          fields={fields}
          position={popoverPos}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "color" && (
        <ColorPopover
          fields={fields}
          position={popoverPos}
          onClose={() => setActivePopover(null)}
        />
      )}

      {activePopover === "rowHeight" && (
        <RowHeightPopover
          position={popoverPos}
          onClose={() => setActivePopover(null)}
        />
      )}
    </div>
  );
}
