"use client";

import { useState, useEffect, useCallback } from "react";
import { AppCard } from "@/components/home/AppCard";
import { getBases, Base } from "@/lib/api";
import { ChevronDown, LayoutGrid, List } from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  green: "bg-green-500",
  orange: "bg-orange-400",
  pink: "bg-pink-400",
  teal: "bg-teal-400",
  red: "bg-red-400",
  indigo: "bg-indigo-400",
};

export default function HomePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = "Inicio — inejomaTable"; }, []);

  const fetchBases = useCallback(async () => {
    try {
      const data = await getBases();
      setBases(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBases();
  }, [fetchBases]);

  const handleDelete = (id: string) => {
    setBases((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdate = (id: string, name: string) => {
    setBases((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-brand-ink tracking-tight">
          Home
        </h1>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-body bg-white border border-brand-border hover:border-brand-border-strong transition-colors cursor-pointer">
          Abierto los últimos 7 días
          <ChevronDown size={14} className="text-brand-muted" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-body bg-white border border-brand-border hover:border-brand-border-strong transition-colors cursor-pointer">
          Todos los espacios
          <ChevronDown size={14} className="text-brand-muted" />
        </button>

        <div className="flex-1" />

        <div className="flex bg-white border border-brand-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-brand-blue text-white"
                : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface"
            }`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-brand-blue text-white"
                : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bases.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-brand-muted text-sm">
            No hay bases aún. Crea una desde el botón &quot;Crear base&quot; en el menú lateral.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-2"
          }
        >
          {bases.map((base) =>
            viewMode === "grid" ? (
              <AppCard
                key={base.id}
                id={base.id}
                name={base.name}
                workspace={base.workspace_name}
                icon={base.icon}
                iconBg={COLOR_MAP[base.color] || "bg-blue-500"}
                starred={false}
                onDeleted={() => handleDelete(base.id)}
                onUpdated={(name) => handleUpdate(base.id, name)}
              />
            ) : (
              <div
                key={base.id}
                onClick={() => {
                  window.location.href = `/bases/${base.id}`;
                }}
                className="flex items-center gap-3 bg-white border border-brand-border rounded-xl px-4 py-3 hover:shadow-sm hover:border-brand-border-strong transition-all cursor-pointer group"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${COLOR_MAP[base.color] || "bg-blue-500"} flex items-center justify-center text-white text-sm shrink-0`}
                >
                  {base.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-brand-ink truncate">
                    {base.name}
                  </h3>
                  <p className="text-xs text-brand-muted">
                    {base.workspace_name}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
