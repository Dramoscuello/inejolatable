import { create } from "zustand";
import type { Table, TableWithFields, TableRecord, Field } from "@/lib/api";

export interface SortRule {
  fieldId: string;
  direction: "asc" | "desc";
}

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  conjunction: "and" | "or";
  conditions: FilterCondition[];
}

export interface GroupRule {
  fieldId: string;
  direction: "asc" | "desc";
}

export interface ColorRule {
  id: string;
  color: string;
  label: string;
  conditions: FilterCondition[];
}

interface BaseState {
  viewSidebarOpen: boolean;
  toggleViewSidebar: () => void;
  setViewSidebarOpen: (open: boolean) => void;

  tables: Table[];
  setTables: (tables: Table[]) => void;

  activeTableId: string | null;
  setActiveTableId: (id: string) => void;

  activeTable: TableWithFields | null;
  setActiveTable: (table: TableWithFields | null) => void;

  records: TableRecord[];
  setRecords: (records: TableRecord[]) => void;

  editingCell: { recordId: string; fieldId: string } | null;
  setEditingCell: (cell: { recordId: string; fieldId: string } | null) => void;

  rowHeight: "short" | "medium" | "tall" | "extraTall";
  setRowHeight: (height: "short" | "medium" | "tall" | "extraTall") => void;

  hiddenFields: string[];
  toggleHiddenField: (fieldId: string) => void;
  hideAllFields: (fields: Field[]) => void;
  showAllFields: () => void;

  frozenFields: number;
  setFrozenFields: (count: number) => void;

  columnWidths: Record<string, number>;
  setColumnWidth: (fieldId: string, width: number) => void;

  fieldSummaries: Record<string, string>;
  setFieldSummary: (fieldId: string, fn: string) => void;

  activeSorts: SortRule[];
  addSort: (fieldId: string, direction: "asc" | "desc") => void;
  removeSort: (fieldId: string) => void;
  setSorts: (sorts: SortRule[]) => void;
  hasAutoSort: boolean;
  setHasAutoSort: (v: boolean) => void;

  activeGroups: GroupRule[];
  addGroup: (fieldId: string, direction: "asc" | "desc") => void;
  removeGroup: (fieldId: string) => void;
  setGroups: (groups: GroupRule[]) => void;

  activeFilters: FilterGroup[];
  addFilterGroup: () => void;
  updateFilterGroup: (id: string, group: Partial<FilterGroup>) => void;
  removeFilterGroup: (id: string) => void;
  addFilterCondition: (groupId: string) => void;
  updateFilterCondition: (groupId: string, conditionId: string, cond: Partial<FilterCondition>) => void;
  removeFilterCondition: (groupId: string, conditionId: string) => void;

  colorRules: ColorRule[];
  addColorRule: (rule: ColorRule) => void;
  updateColorRule: (id: string, rule: Partial<ColorRule>) => void;
  removeColorRule: (id: string) => void;
  setColorRules: (rules: ColorRule[]) => void;
  defaultColor: string | null;
  setDefaultColor: (color: string | null) => void;

  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMatches: { recordId: string; fieldId: string }[];
  setSearchMatches: (matches: { recordId: string; fieldId: string }[]) => void;
  searchActiveIndex: number;
  setSearchActiveIndex: (i: number) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

let _condId = 0;
function genCondId() { _condId++; return `cnd${_condId}`; }
let _grpId = 0;
function genGrpId() { _grpId++; return `grp${_grpId}`; }
let _clrId = 0;
function genClrId() { _clrId++; return `clr${_clrId}`; }

const COLOR_PALETTE = [
  { label: "Azul", hex: "#3b82f6" },
  { label: "Verde", hex: "#22c55e" },
  { label: "Rojo", hex: "#ef4444" },
  { label: "Amarillo", hex: "#eab308" },
  { label: "Naranja", hex: "#f97316" },
  { label: "Púrpura", hex: "#a855f7" },
  { label: "Rosa", hex: "#ec4899" },
  { label: "Cian", hex: "#06b6d4" },
  { label: "Gris", hex: "#6b7280" },
  { label: "Verde azulado", hex: "#14b8a6" },
];

export { COLOR_PALETTE };

export const useBaseStore = create<BaseState>((set) => ({
  viewSidebarOpen: true,
  toggleViewSidebar: () => set((s) => ({ viewSidebarOpen: !s.viewSidebarOpen })),
  setViewSidebarOpen: (open) => set({ viewSidebarOpen: open }),

  tables: [],
  setTables: (tables) => set({ tables }),

  activeTableId: null,
  setActiveTableId: (id) => set({ activeTableId: id, editingCell: null }),

  activeTable: null,
  setActiveTable: (table) => set({ activeTable: table }),

  records: [],
  setRecords: (records) => set({ records }),

  editingCell: null,
  setEditingCell: (cell) => set({ editingCell: cell }),

  rowHeight: "short",
  setRowHeight: (height) => set({ rowHeight: height }),

  hiddenFields: [],
  toggleHiddenField: (fieldId) =>
    set((s) => ({
      hiddenFields: s.hiddenFields.includes(fieldId)
        ? s.hiddenFields.filter((f) => f !== fieldId)
        : [...s.hiddenFields, fieldId],
    })),
  hideAllFields: (fields) =>
    set({ hiddenFields: fields.filter((f) => !f.is_primary).map((f) => f.id) }),
  showAllFields: () => set({ hiddenFields: [] }),

  frozenFields: 1,
  setFrozenFields: (count) => set({ frozenFields: Math.min(Math.max(count, 0), 3) }),

  columnWidths: {},
  setColumnWidth: (fieldId, width) =>
    set((s) => ({
      columnWidths: { ...s.columnWidths, [fieldId]: Math.max(60, width) },
    })),

  fieldSummaries: {},
  setFieldSummary: (fieldId, fn) =>
    set((s) => ({
      fieldSummaries: { ...s.fieldSummaries, [fieldId]: fn },
    })),

  activeSorts: [],
  addSort: (fieldId, direction) =>
    set((s) => ({
      activeSorts: s.activeSorts.some((r) => r.fieldId === fieldId)
        ? s.activeSorts.map((r) =>
            r.fieldId === fieldId ? { fieldId, direction } : r
          )
        : [...s.activeSorts, { fieldId, direction }],
    })),
  removeSort: (fieldId) =>
    set((s) => ({ activeSorts: s.activeSorts.filter((r) => r.fieldId !== fieldId) })),
  setSorts: (sorts) => set({ activeSorts: sorts }),
  hasAutoSort: true,
  setHasAutoSort: (v) => set({ hasAutoSort: v }),

  activeGroups: [],
  addGroup: (fieldId, direction) =>
    set((s) => {
      const exists = s.activeGroups.find((g) => g.fieldId === fieldId);
      if (exists) {
        return {
          activeGroups: s.activeGroups.map((g) =>
            g.fieldId === fieldId ? { fieldId, direction } : g
          ),
        };
      }
      if (s.activeGroups.length >= 3) return s;
      return { activeGroups: [...s.activeGroups, { fieldId, direction }] };
    }),
  removeGroup: (fieldId) =>
    set((s) => ({ activeGroups: s.activeGroups.filter((g) => g.fieldId !== fieldId) })),
  setGroups: (groups) => set({ activeGroups: groups }),

  activeFilters: [],
  addFilterGroup: () =>
    set((s) => ({
      activeFilters: [
        ...s.activeFilters,
        {
          id: genGrpId(),
          conjunction: "and",
          conditions: [{ id: genCondId(), fieldId: "", operator: "", value: "" }],
        },
      ],
    })),
  updateFilterGroup: (id, group) =>
    set((s) => ({
      activeFilters: s.activeFilters.map((g) => (g.id === id ? { ...g, ...group } : g)),
    })),
  removeFilterGroup: (id) =>
    set((s) => ({ activeFilters: s.activeFilters.filter((g) => g.id !== id) })),
  addFilterCondition: (groupId) =>
    set((s) => ({
      activeFilters: s.activeFilters.map((g) =>
        g.id === groupId
          ? { ...g, conditions: [...g.conditions, { id: genCondId(), fieldId: "", operator: "", value: "" }] }
          : g
      ),
    })),
  updateFilterCondition: (groupId, conditionId, cond) =>
    set((s) => ({
      activeFilters: s.activeFilters.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...cond } : c
              ),
            }
          : g
      ),
    })),
  removeFilterCondition: (groupId, conditionId) =>
    set((s) => ({
      activeFilters: s.activeFilters
        .map((g) =>
          g.id === groupId
            ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) }
            : g
        )
        .filter((g) => g.conditions.length > 0),
    })),

  colorRules: [],
  addColorRule: (rule) =>
    set((s) => ({ colorRules: [...s.colorRules, rule] })),
  updateColorRule: (id, rule) =>
    set((s) => ({
      colorRules: s.colorRules.map((r) => (r.id === id ? { ...r, ...rule } : r)),
    })),
  removeColorRule: (id) =>
    set((s) => ({ colorRules: s.colorRules.filter((r) => r.id !== id) })),
  setColorRules: (rules) => set({ colorRules: rules }),
  defaultColor: null,
  setDefaultColor: (color) => set({ defaultColor: color }),

  searchTerm: "",
  setSearchTerm: (term) =>
    set({ searchTerm: term, searchMatches: [], searchActiveIndex: 0 }),
  searchMatches: [],
  setSearchMatches: (matches) => set({ searchMatches: matches }),
  searchActiveIndex: 0,
  setSearchActiveIndex: (i) => set({ searchActiveIndex: i }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open, searchTerm: open ? "" : "" }),
}));
