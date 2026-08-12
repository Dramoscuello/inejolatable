"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Field } from "@/lib/api";

interface DeleteFieldModalProps {
  field: Field;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteFieldModal({
  field,
  open,
  onClose,
  onDeleted,
}: DeleteFieldModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleDelete = async () => {
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/fields/${field.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      if (!res.ok) throw new Error("Error al eliminar");
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">
              Eliminar campo
            </h2>
            <p className="text-sm text-brand-muted mt-1">
              ¿Eliminar &quot;{field.name}&quot;? Los datos de las celdas se perderán. El campo irá a la papelera y podrá restaurarse durante 7 días.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-brand-muted hover:text-brand-ink transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {error && <p className="text-xs text-brand-error mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={confirming}
            className="!bg-red-500 !text-white hover:!bg-red-600"
          >
            {confirming ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
