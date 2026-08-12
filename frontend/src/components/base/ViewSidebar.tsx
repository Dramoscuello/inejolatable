"use client";

import { Plus, Search, GripVertical } from "lucide-react";

interface View {
  id: string;
  name: string;
  typeIcon: string;
  section: "favorites" | "personal" | "collaborative";
  isActive: boolean;
  isLocked?: boolean;
  isPersonal?: boolean;
}

const SAMPLE_VIEWS: View[] = [
  { id: "1", name: "Grid view", typeIcon: "▦", section: "personal", isActive: true },
];

const SECTION_LABELS: Record<string, string> = {
  favorites: "Mis favoritos",
  personal: "Mis vistas personales",
  collaborative: "Más vistas colaborativas",
};

interface ViewSidebarProps {
  open: boolean;
}

export function ViewSidebar({ open }: ViewSidebarProps) {
  if (!open) return null;

  const viewsBySection = SAMPLE_VIEWS.reduce(
    (acc, v) => {
      if (!acc[v.section]) acc[v.section] = [];
      acc[v.section].push(v);
      return acc;
    },
    {} as Record<string, View[]>
  );

  return (
    <aside className="w-64 shrink-0 border-r border-brand-border bg-brand-canvas overflow-y-auto flex flex-col">
      <div className="px-3 pt-3 pb-2">
        <button className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-sm text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer">
          <Plus size={14} />
          Crear nuevo...
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-border-strong"
          />
          <input
            type="text"
            placeholder="Encontrar una vista"
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-md outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 placeholder:text-brand-border-strong"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
        {Object.entries(viewsBySection).map(([section, views]) => {
          if (views.length === 0) return null;
          return (
            <div key={section}>
              <p className="px-2 py-1 text-[10px] font-medium text-brand-muted uppercase tracking-wider">
                {SECTION_LABELS[section] || section}
              </p>
              <div className="space-y-0.5">
                {views.map((v) => (
                  <button
                    key={v.id}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer group ${
                      v.isActive
                        ? "bg-brand-surface text-brand-ink border-l-2 border-brand-blue pl-1.5"
                        : "text-brand-body hover:bg-brand-surface"
                    }`}
                  >
                    <GripVertical
                      size={12}
                      className="text-brand-border-strong opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    />
                    <span className="text-xs">{v.typeIcon}</span>
                    <span className="flex-1 text-left truncate">{v.name}</span>
                    {v.isActive && (
                      <span className="text-brand-blue text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
