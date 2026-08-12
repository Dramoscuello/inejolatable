"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useBaseStore, COLOR_PALETTE } from "@/store/useBaseStore";
import {
  getTables,
  createTable,
  getTable,
  createField,
  getRecords,
  listBaseForms,
  deleteForm,
} from "@/lib/api";
import { BaseHeader } from "@/components/base/BaseHeader";
import { TableBar } from "@/components/base/TableBar";
import { ViewBar } from "@/components/base/ViewBar";
import { ViewSidebar } from "@/components/base/ViewSidebar";
import { GridView } from "@/components/base/GridView";

const FIELD_TYPES = [
  { value: "singleLineText", label: "Texto" },
  { value: "multilineText", label: "Texto largo" },
  { value: "number", label: "Número" },
  { value: "currency", label: "Moneda" },
  { value: "percent", label: "Porcentaje" },
  { value: "singleSelect", label: "Selección única" },
  { value: "multipleSelects", label: "Selección múltiple" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Fecha" },
  { value: "email", label: "Correo" },
  { value: "url", label: "URL" },
  { value: "phoneNumber", label: "Teléfono" },
  { value: "rating", label: "Rating" },
  { value: "duration", label: "Duración" },
  { value: "attachment", label: "Adjunto" },
  { value: "multipleRecordLinks", label: "Vincular a otro registro" },
  { value: "formula", label: "Fórmula" },
];

const optId = () => Math.random().toString(36).slice(2, 10);

const CURRENCY_SYMBOLS = [
  "$", "€", "£", "¥", "₹", "CHF", "C$", "A$", "R$", "₽", "₩", "kr",
  "COP", "MXN", "ARS", "CLP", "PEN", "UYU",
];

export default function BaseDetailPage() {
  const params = useParams();
  const baseId = params.id as string;

  const {
    viewSidebarOpen,
    toggleViewSidebar,
    tables,
    setTables,
    activeTableId,
    setActiveTableId,
    activeTable,
    setActiveTable,
    records,
    setRecords,
    hiddenFields,
  } = useBaseStore();

  const [loading, setLoading] = useState(true);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("singleLineText");
  const [modalError, setModalError] = useState("");
  const [selectOptions, setSelectOptions] = useState<{ id: string; name: string; color: string }[]>([
    { id: optId(), name: "", color: "blueBright" },
  ]);
  const [defaultOptionId, setDefaultOptionId] = useState("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [colorPickerPos, setColorPickerPos] = useState({ x: 0, y: 0 });
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyPrecision, setCurrencyPrecision] = useState(2);
  const [currencyAllowNeg, setCurrencyAllowNeg] = useState(true);
  const [checkboxColor, setCheckboxColor] = useState("#22c55e");
  const [checkboxDefault, setCheckboxDefault] = useState(false);
  const [durationFormat, setDurationFormat] = useState("h:mm:ss");
  const [ratingMax, setRatingMax] = useState(5);
  const [ratingColor, setRatingColor] = useState("#eab308");
  const [linkedTableId, setLinkedTableId] = useState("");
  const [linkedSingle, setLinkedSingle] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formTableId, setFormTableId] = useState("");
  const [formName, setFormName] = useState("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"datos" | "forms">("datos");
  const [forms, setForms] = useState<import("@/lib/api").Form[]>([]);

  useEffect(() => {
    document.title = activeTable?.name
      ? `${activeTable.name} — inejomaTable`
      : "Base — inejomaTable";
  }, [activeTable]);

  const fetchForms = useCallback(async () => {
    try {
      const data = await listBaseForms(baseId);
      setForms(data);
    } catch {}
  }, [baseId]);

  const handleDeleteForm = async (formId: string) => {
    try {
      await deleteForm(formId);
      setForms((prev) => prev.filter((f) => f.id !== formId));
    } catch {}
  };

  useEffect(() => {
    if (activeTab === "forms") fetchForms();
  }, [activeTab, fetchForms]);

  const handleAddOption = () => {
    setSelectOptions((prev) => [
      ...prev,
      { id: optId(), name: "", color: "blueBright" },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    setSelectOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleOptionName = (id: string, name: string) => {
    setSelectOptions((prev) => prev.map((o) => (o.id === id ? { ...o, name } : o)));
  };

  const handleOptionColor = (id: string, color: string) => {
    setSelectOptions((prev) => prev.map((o) => (o.id === id ? { ...o, color } : o)));
    setShowColorPicker(null);
  };

  const isSelectType = newFieldType === "singleSelect" || newFieldType === "multipleSelects";

  const resetSelectOptions = () => {
    setSelectOptions([{ id: optId(), name: "", color: "blueBright" }]);
    setDefaultOptionId("");
  };

  const handleCreateForm = async () => {
    if (!formTableId || !formName.trim()) return;
    try {
      const { createForm } = await import("@/lib/api");
      const form = await createForm({ table_id: formTableId, name: formName.trim() });
      setShowFormModal(false);
      setFormTableId("");
      setFormName("");
      fetchForms();
      router.push(`/forms/${form.id}/edit`);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error");
    }
  };

  const fetchTables = useCallback(async () => {
    try {
      const data = await getTables(baseId);
      setTables(data);
      if (data.length > 0 && !activeTableId) {
        setActiveTableId(data[0].id);
      }
    } catch {}
    setLoading(false);
  }, [baseId, activeTableId, setTables, setActiveTableId]);

  const fetchTableData = useCallback(async () => {
    if (!activeTableId) return;
    try {
      const [table, recordsData] = await Promise.all([
        getTable(activeTableId),
        getRecords(activeTableId),
      ]);
      setActiveTable(table);
      setRecords(recordsData);
    } catch {}
  }, [activeTableId, setActiveTable, setRecords]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    try {
      const table = await createTable(baseId, newTableName.trim());
      setNewTableName("");
      setShowTableModal(false);
      await fetchTables();
      setActiveTableId(table.id);
      setActiveTableId(table.id);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTableId || !newFieldName.trim()) return;
    try {
      const isSelect = newFieldType === "singleSelect" || newFieldType === "multipleSelects";
      const isCurrency = newFieldType === "currency";
      await createField(activeTableId, {
        name: newFieldName.trim(),
        field_type: newFieldType,
        options_json: isSelect
          ? {
              choices: selectOptions
                .filter((o) => o.name.trim())
                .map((o) => ({ id: o.id, name: o.name.trim(), color: o.color })),
              defaultValue: defaultOptionId || undefined,
            }
          : isCurrency
            ? { symbol: currencySymbol, precision: currencyPrecision, allowNegativeNumbers: currencyAllowNeg }
            : newFieldType === "checkbox"
              ? { color: checkboxColor, default: checkboxDefault }
              : newFieldType === "duration"
                ? { durationFormat }
            : newFieldType === "rating"
              ? { max: ratingMax, color: ratingColor }
              : newFieldType === "multipleRecordLinks"
                ? { foreignTableId: linkedTableId, prefersSingleRecordLink: linkedSingle }
                : undefined,
      });
      setNewFieldName("");
      setNewFieldType("singleLineText");
      setSelectOptions([{ id: optId(), name: "", color: "blueBright" }]);
      setDefaultOptionId("");
      setShowFieldModal(false);
      await fetchTableData();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <BaseHeader baseName={activeTable?.name || "Base sin nombre"} activeTab={activeTab} onTabChange={setActiveTab} />

      <TableBar
        tables={tables}
        activeTableId={activeTableId}
        onSelectTable={setActiveTableId}
        onAddTable={() => setShowTableModal(true)}
      />
      {activeTab === "datos" ? (
        <>
          <ViewBar
            viewName="Grid view"
            viewSidebarOpen={viewSidebarOpen}
            onToggleSidebar={toggleViewSidebar}
            fields={activeTable?.fields || []}
          />

          <div className="flex flex-1 min-h-0">
            <ViewSidebar open={viewSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0">
              {activeTable ? (
                <GridView
                  tableId={activeTable.id}
                  fields={activeTable.fields}
                  records={records}
                  onAddField={() => { resetSelectOptions(); setShowFieldModal(true); }}
                  onRefresh={fetchTableData}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <p className="text-brand-muted text-sm mb-4">
                    {tables.length === 0
                      ? "No hay tablas en esta base. Crea una para empezar."
                      : "Selecciona una tabla para ver sus datos."}
                  </p>
                  {tables.length === 0 && (
                    <Button onClick={() => setShowTableModal(true)}>
                      <Plus size={16} />
                      Crear tabla
                    </Button>
                  )}
                </div>
              )}

              {activeTable && activeTable.fields.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-brand-muted text-sm mb-4">
                      Esta tabla no tiene columnas.
                    </p>
                    <Button onClick={() => { resetSelectOptions(); setShowFieldModal(true); }}>
                      <Plus size={16} />
                      Agregar campo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-ink">Formularios</h2>
              <Button onClick={() => setShowFormModal(true)}>
                <Plus size={16} />
                Crear formulario
              </Button>
            </div>
            {forms.length === 0 ? (
              <p className="text-sm text-brand-muted">No hay formularios aún.</p>
            ) : (
              <div className="space-y-2">
                {forms.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white border border-brand-border rounded-xl hover:shadow-sm transition-shadow"
                  >
                    <span className="text-lg">📋</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-brand-ink truncate">
                        {f.name}
                      </h3>
                      {f.description && (
                        <p className="text-xs text-brand-muted truncate">
                          {f.description}
                        </p>
                      )}
                    </div>
                    {f.public_hash ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        Publicado
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-surface text-brand-muted">
                        Borrador
                      </span>
                    )}
                    <a
                      href={`/forms/${f.id}/edit`}
                      className="text-xs text-brand-blue hover:underline cursor-pointer shrink-0"
                    >
                      Editar
                    </a>
                    <button
                      onClick={() => handleDeleteForm(f.id)}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer shrink-0"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowTableModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold text-brand-ink mb-4">Crear tabla</h2>
            <form onSubmit={handleCreateTable} className="flex flex-col gap-4">
              <Input
                label="Nombre"
                placeholder="Mi tabla"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                error={modalError}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowTableModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFieldModal(false)} />
          <div className={`relative bg-white rounded-2xl shadow-xl mx-4 p-6 ${isSelectType ? "w-full max-w-lg" : "w-full max-w-sm"}`}>
            <h2 className="text-lg font-semibold text-brand-ink mb-4">Agregar campo</h2>
            <form onSubmit={handleCreateField} className="flex flex-col gap-4">
              <Input
                label="Nombre del campo"
                placeholder="Nombre"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                autoFocus
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-ink">Tipo</label>
                <select
                  value={newFieldType}
                  onChange={(e) => {
                    setNewFieldType(e.target.value);
                    resetSelectOptions();
                  }}
                  className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </select>
              </div>

              {isSelectType && (
                <div className="space-y-2 border border-brand-border rounded-xl p-3">
                  <label className="text-sm font-medium text-brand-ink">Opciones</label>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {selectOptions.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setColorPickerPos({ x: r.left, y: r.bottom + 4 });
                            setShowColorPicker(showColorPicker === opt.id ? null : opt.id);
                          }}
                          className="w-7 h-7 rounded-full border border-brand-border-strong cursor-pointer shrink-0 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: COLOR_PALETTE.find((c) => c.hex === opt.color)?.hex || opt.color,
                          }}
                        />
                        <input
                          value={opt.name}
                          onChange={(e) => handleOptionName(opt.id, e.target.value)}
                          placeholder="Nombre de la opción"
                          className="flex-1 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue"
                        />
                        {selectOptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(opt.id)}
                              className="p-1 rounded text-brand-muted hover:text-red-500 transition-colors cursor-pointer shrink-0"
                            >
                              ×
                            </button>
                          )}
                        </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-1 text-xs text-brand-blue hover:underline cursor-pointer"
                  >
                    <Plus size={12} /> Añadir opción
                  </button>

                  {selectOptions.some((o) => o.name.trim()) && (
                    <div className="flex flex-col gap-1 pt-1 border-t border-brand-border">
                      <label className="text-xs text-brand-muted">Valor por defecto (opcional)</label>
                      <select
                        value={defaultOptionId}
                        onChange={(e) => setDefaultOptionId(e.target.value)}
                        className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue"
                      >
                        <option value="">Sin valor por defecto</option>
                        {selectOptions
                          .filter((o) => o.name.trim())
                          .map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name.trim()}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {newFieldType === "currency" && (
                <div className="space-y-2 border border-brand-border rounded-xl p-3">
                  <label className="text-sm font-medium text-brand-ink">Formato de moneda</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-brand-muted w-20 shrink-0">Símbolo</label>
                      <select
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className="flex-1 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue"
                      >
                        {CURRENCY_SYMBOLS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-brand-muted w-20 shrink-0">Decimales</label>
                      <select
                        value={currencyPrecision}
                        onChange={(e) => setCurrencyPrecision(Number(e.target.value))}
                        className="flex-1 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue"
                      >
                        {Array.from({ length: 9 }, (_, i) => (
                          <option key={i} value={i}>{i} decimal{i !== 1 ? "es" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-brand-muted w-20 shrink-0">Negativos</label>
                      <button
                        type="button"
                        onClick={() => setCurrencyAllowNeg(!currencyAllowNeg)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${currencyAllowNeg ? "bg-brand-success" : "bg-brand-border"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${currencyAllowNeg ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {newFieldType === "checkbox" && (
                <div className="space-y-2 border border-brand-border rounded-xl p-3">
                  <label className="text-sm font-medium text-brand-ink">Estilo</label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-brand-muted w-20 shrink-0">Color</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setCheckboxColor(c.hex)}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${checkboxColor === c.hex ? "ring-2 ring-brand-blue ring-offset-1 scale-110" : ""}`}
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-brand-muted w-20 shrink-0">Defecto</label>
                    <button
                      type="button"
                      onClick={() => setCheckboxDefault(!checkboxDefault)}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${checkboxDefault ? "bg-brand-success" : "bg-brand-border"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${checkboxDefault ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                    <span className="text-xs text-brand-muted">
                      {checkboxDefault ? "Marcado" : "Desmarcado"}
                    </span>
                  </div>
                </div>
              )}

              {newFieldType === "duration" && (
                <div className="space-y-2 border border-brand-border rounded-xl p-3">
                  <label className="text-sm font-medium text-brand-ink">Formato de duración</label>
                  <select
                    value={durationFormat}
                    onChange={(e) => setDurationFormat(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
                  >
                    <option value="h:mm">h:mm (1:30)</option>
                    <option value="h:mm:ss">h:mm:ss (1:30:45)</option>
                    <option value="h:mm:ss.s">h:mm:ss.s (1:30:45.6)</option>
                    <option value="h:mm:ss.ss">h:mm:ss.ss (1:30:45.67)</option>
                    <option value="h:mm:ss.sss">h:mm:ss.sss (1:30:45.678)</option>
                  </select>
                </div>
              )}

              {newFieldType === "rating" && (
                <div className="space-y-2 border border-brand-border rounded-xl p-3">
                  <label className="text-sm font-medium text-brand-ink">Calificación</label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-brand-muted w-20 shrink-0">Máximo</label>
                    <select
                      value={ratingMax}
                      onChange={(e) => setRatingMax(Number(e.target.value))}
                      className="flex-1 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-brand-muted w-20 shrink-0">Color</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setRatingColor(c.hex)}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${ratingColor === c.hex ? "ring-2 ring-brand-blue ring-offset-1 scale-110" : ""}`}
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {newFieldType === "multipleRecordLinks" && (
                <div className="space-y-2 border border-brand-border rounded-xl p-3">
                  <label className="text-sm font-medium text-brand-ink">Vincular a otro registro</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-brand-muted w-24 shrink-0">Tabla destino</label>
                      <select
                        value={linkedTableId}
                        onChange={(e) => setLinkedTableId(e.target.value)}
                        className="flex-1 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue"
                      >
                        <option value="">Seleccionar tabla</option>
                        {tables.filter((t) => t.id !== activeTableId).map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-brand-muted w-24 shrink-0">Cardinalidad</label>
                      <button
                        type="button"
                        onClick={() => setLinkedSingle(!linkedSingle)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${!linkedSingle ? "bg-brand-success" : "bg-brand-border"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${!linkedSingle ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                      <span className="text-xs text-brand-muted">
                        {linkedSingle ? "Un solo registro" : "Múltiples registros"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {modalError && <p className="text-xs text-brand-error">{modalError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowFieldModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agregar</Button>
              </div>
            </form>
          </div>

          {showColorPicker && (
            <div
              className="fixed z-[60] bg-white rounded-xl shadow-lg border border-brand-border p-2 grid grid-cols-5 gap-1.5"
              style={{ left: colorPickerPos.x, top: colorPickerPos.y }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleOptionColor(showColorPicker, c.hex)}
                  className="w-7 h-7 rounded-full cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          {showColorPicker && (
            <div className="fixed inset-0 z-[59]" onClick={() => setShowColorPicker(null)} />
          )}
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFormModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold text-brand-ink mb-4">Crear formulario</h2>
            <div className="flex flex-col gap-4">
              <Input
                label="Nombre del formulario"
                placeholder="Mi formulario"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-ink">Tabla</label>
                <select
                  value={formTableId}
                  onChange={(e) => setFormTableId(e.target.value)}
                  className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                >
                  <option value="">Seleccionar tabla</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowFormModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateForm}>Crear</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
