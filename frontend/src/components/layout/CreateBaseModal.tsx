"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getWorkspaces, Workspace } from "@/lib/api";

const ICONS = ["🚀", "📋", "📦", "📅", "💼", "🐛", "📊", "🗂", "🎯", "🔧", "📝", "💡", "⭐", "🏠", "🎉", "💻"];

const COLORS = [
  { name: "blue", bg: "bg-blue-500" },
  { name: "purple", bg: "bg-purple-500" },
  { name: "green", bg: "bg-green-500" },
  { name: "orange", bg: "bg-orange-400" },
  { name: "pink", bg: "bg-pink-400" },
  { name: "teal", bg: "bg-teal-400" },
  { name: "red", bg: "bg-red-400" },
  { name: "indigo", bg: "bg-indigo-400" },
];

interface CreateBaseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBaseModal({ open, onClose, onCreated }: CreateBaseModalProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📋");
  const [color, setColor] = useState("blue");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      getWorkspaces()
        .then((ws) => {
          setWorkspaces(ws);
          if (ws.length > 0 && !selectedWorkspace) {
            setSelectedWorkspace(ws[0].id);
          }
        })
        .catch(() => {});
    }
  }, [open, selectedWorkspace]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!selectedWorkspace) {
      setError("Selecciona un espacio de trabajo");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { createBase } = await import("@/lib/api");
      await createBase(selectedWorkspace, { name: name.trim(), icon, color });
      setName("");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la base");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-brand-ink mb-4">
          Crear base
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-ink">
              Espacio de trabajo
            </label>
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Nombre"
            placeholder="Mi base de datos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-ink">Icono</label>
            <div className="grid grid-cols-8 gap-2">
              {ICONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                    icon === em
                      ? "bg-brand-blue/10 ring-2 ring-brand-blue"
                      : "hover:bg-brand-surface"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-ink">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`w-8 h-8 rounded-lg ${c.bg} transition-all cursor-pointer ${
                    color === c.name
                      ? "ring-2 ring-brand-blue ring-offset-2"
                      : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface">
            <div
              className={`w-10 h-10 rounded-xl ${COLORS.find((c) => c.name === color)?.bg || "bg-blue-500"} flex items-center justify-center text-white text-lg shrink-0`}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-ink truncate">
                {name || "Mi base"}
              </p>
              <p className="text-xs text-brand-muted">
                {workspaces.find((ws) => ws.id === selectedWorkspace)?.name || "Sin workspace"}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-brand-error">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear base"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
