"use client";

import { useState, useRef } from "react";
import { X, Download, Upload, FileText, ImageIcon } from "lucide-react";
import { resizeImageIfNeeded } from "./GridView";

interface AttachmentData {
  id: string;
  filename: string;
  type: string;
  size: number;
  data: string;
}

export interface AttachmentPreviewModalProps {
  open: boolean;
  attachment: AttachmentData | null;
  onClose: () => void;
  onUpload: (data: string, filename: string, type: string, size: number) => void;
}

export function AttachmentPreviewModal({
  open,
  attachment,
  onClose,
  onUpload,
}: AttachmentPreviewModalProps) {
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const isImage = attachment?.type?.startsWith("image/");

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    const data = await resizeImageIfNeeded(file);
    onUpload(data, file.name, file.type, file.size);
    setProcessing(false);
  };

  const handleDownload = () => {
    if (!attachment?.data) return;
    const a = document.createElement("a");
    a.href = attachment.data;
    a.download = attachment.filename || "archivo";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-[500px] max-h-[80vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border shrink-0">
          <h3 className="text-sm font-semibold text-brand-ink truncate">
            {attachment ? attachment.filename : "Adjuntar archivo"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 min-h-[200px]">
          {attachment ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-full max-h-[300px] flex items-center justify-center bg-brand-surface rounded-xl overflow-hidden">
                {isImage ? (
                  <img
                    src={attachment.data}
                    alt={attachment.filename}
                    className="max-w-full max-h-[300px] object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <FileText size={48} className="text-red-400" />
                    <span className="text-sm text-brand-muted">
                      {attachment.filename}
                    </span>
                    <span className="text-xs text-brand-border-strong">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-ink border border-brand-border hover:bg-brand-surface transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  Descargar
                </button>
                <button
                  onClick={handleFilePick}
                  disabled={processing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload size={14} />
                  {processing ? "Procesando..." : "Reemplazar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-2xl bg-brand-surface flex items-center justify-center">
                <ImageIcon size={32} className="text-brand-muted" />
              </div>
              <p className="text-sm text-brand-muted text-center">
                Arrastra un archivo o haz clic para seleccionar
              </p>
              <button
                onClick={handleFilePick}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload size={14} />
                {processing ? "Procesando..." : "Cargar archivo"}
              </button>
            </div>
          )}

          {processing && (
            <div className="w-full max-w-[200px]">
              <div className="h-1.5 bg-brand-surface rounded-full overflow-hidden">
                <div className="h-full bg-brand-blue rounded-full animate-pulse w-2/3" />
              </div>
              <p className="text-xs text-brand-muted text-center mt-1">Procesando...</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
