"use client";

import {
  Rocket,
  ChevronDown,
  History,
  Link2,
  Share2,
} from "lucide-react";

interface BaseHeaderProps {
  baseName: string;
  activeTab: "datos" | "forms";
  onTabChange: (tab: "datos" | "forms") => void;
}

export function BaseHeader({ baseName, activeTab, onTabChange }: BaseHeaderProps) {
  const tabs = [
    { key: "datos" as const, label: "Datos" },
    { key: "forms" as const, label: "Formularios" },
  ];

  return (
    <header className="flex items-center h-12 px-4 bg-brand-canvas border-b border-brand-border shrink-0 gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-brand-blue flex items-center justify-center">
          <Rocket size={14} className="text-white" />
        </div>
        <button className="flex items-center gap-1 text-sm font-semibold text-brand-ink hover:bg-brand-surface rounded-md px-1.5 py-0.5 transition-colors cursor-pointer">
          {baseName}
          <ChevronDown size={14} className="text-brand-muted" />
        </button>
      </div>

      <nav className="flex items-center gap-1 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "text-brand-blue"
                : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-blue rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-1 shrink-0">
        <button className="p-1.5 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer">
          <History size={16} />
        </button>
        <button className="p-1.5 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer">
          <Link2 size={16} />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue/90 transition-colors cursor-pointer">
          <Share2 size={14} />
          Compartir
        </button>
      </div>
    </header>
  );
}
