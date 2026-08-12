import { useCallback, useRef } from "react";
import { updateRecord, TableRecord } from "@/lib/api";

export function useCellEdit(
  tableId: string,
  records: TableRecord[],
  setRecords: (records: TableRecord[]) => void,
  editingCell: { recordId: string; fieldId: string } | null,
  setEditingCell: (cell: { recordId: string; fieldId: string } | null) => void
) {
  const saveRef = useRef<AbortController | null>(null);

  const confirmEdit = useCallback(
    async (recordId: string, fieldId: string, value: unknown) => {
      if (saveRef.current) saveRef.current.abort();
      const controller = new AbortController();
      saveRef.current = controller;

      const prevRecords = [...records];
      setRecords(
        records.map((r) =>
          r.id === recordId
            ? { ...r, data_json: { ...r.data_json, [fieldId]: value } }
            : r
        )
      );
      setEditingCell(null);

      try {
        const updated = await updateRecord(tableId, recordId, {
          data_json: { [fieldId]: value },
        }, controller.signal);
        setRecords(
          records.map((r) =>
            r.id === recordId
              ? { ...r, data_json: { ...r.data_json, ...updated.data_json } }
              : r
          )
        );
      } catch {
        if (!controller.signal.aborted) {
          setRecords(prevRecords);
        }
      }
    },
    [tableId, records, setRecords, setEditingCell]
  );

  const startEdit = useCallback(
    (recordId: string, fieldId: string) => {
      setEditingCell({ recordId, fieldId });
    },
    [setEditingCell]
  );

  const cancelEdit = useCallback(() => {
    if (saveRef.current) saveRef.current.abort();
    setEditingCell(null);
  }, [setEditingCell]);

  const moveEdit = useCallback(
    (
      recordId: string,
      fieldId: string,
      direction: "next" | "prev",
      fields: { id: string }[]
    ) => {
      const editableFields = fields.filter((f) => f.id !== fieldId);
      if (editableFields.length === 0) return;

      const currentIndex = editableFields.findIndex((f) => f.id === fieldId);
      let nextIndex: number;
      if (currentIndex === -1 || direction === "prev") {
        nextIndex =
          currentIndex <= 0
            ? editableFields.length - 1
            : currentIndex - 1;
      } else {
        nextIndex =
          currentIndex >= editableFields.length - 1
            ? 0
            : currentIndex + 1;
      }
      setEditingCell({
        recordId,
        fieldId: editableFields[nextIndex].id,
      });
    },
    [setEditingCell]
  );

  return {
    editingCell,
    startEdit,
    confirmEdit,
    cancelEdit,
    moveEdit,
  };
}
