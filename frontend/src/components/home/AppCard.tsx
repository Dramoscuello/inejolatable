"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AppCardProps {
  id: string;
  name: string;
  workspace: string;
  icon: string;
  iconBg: string;
  starred: boolean;
  onDeleted: () => void;
  onUpdated: (name: string) => void;
}

export function AppCard({
  id,
  name,
  workspace,
  icon,
  iconBg,
  starred,
  onDeleted,
  onUpdated,
}: AppCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [deleting, setDeleting] = useState(false);

  const handleClick = () => {
    router.push(`/bases/${id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { createBase, getBases } = await import("@/lib/api");

      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/bases/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      onDeleted();
    } catch {
      setDeleting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/bases/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      });
      onUpdated(editName);
      setEditOpen(false);
    } catch {}
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="group relative bg-brand-canvas border border-brand-border rounded-2xl p-4 hover:shadow-md hover:shadow-brand-shadow hover:border-brand-border-strong transition-all cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-white text-lg shrink-0`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-brand-ink truncate">
              {name}
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">{workspace}</p>
          </div>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {starred && (
            <Star size={14} className="text-brand-yellow fill-brand-yellow" />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded-md text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        {menuOpen && (
          <div
            className="absolute top-10 right-3 z-10 bg-white border border-brand-border rounded-xl shadow-lg py-1 min-w-36"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setMenuOpen(false); setEditOpen(true); setEditName(name); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-body hover:bg-brand-surface transition-colors cursor-pointer"
            >
              <Pencil size={14} />
              Renombrar
            </button>
            <button
              onClick={() => { setMenuOpen(false); handleDelete(); }}
              disabled={deleting}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-red hover:bg-brand-red/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        )}
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold text-brand-ink mb-4">Renombrar base</h2>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <Input
                label="Nombre"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
