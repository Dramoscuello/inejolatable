"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { FormEditor } from "@/components/base/FormEditor";
import { getTable } from "@/lib/api";
import type { TableWithFields } from "@/lib/api";

export default function FormEditPage() {
  const params = useParams();
  const formId = params.id as string;
  const [table, setTable] = useState<TableWithFields | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTable = useCallback(async () => {
    try {
      const { getForm } = await import("@/lib/api");
      const form = await getForm(formId);
      const t = await getTable(form.table_id);
      setTable(t);
    } catch {}
    setLoading(false);
  }, [formId]);

  useEffect(() => { fetchTable(); }, [fetchTable]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-muted text-sm">No se encontró el formulario.</p>
      </div>
    );
  }

  return <FormEditor formId={formId} fields={table.fields} />;
}
