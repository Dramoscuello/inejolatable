import type { Field } from "./api";

export function formatDisplayValue(field: Field, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "✓" : "";
  if (field.field_type === "currency" && typeof value === "number") {
    const opts = (field.options_json as { symbol?: string; precision?: number; allowNegativeNumbers?: boolean }) || {};
    const symbol = opts.symbol || "$";
    const precision = opts.precision ?? 2;
    const num = Number(value);
    return `${symbol}${Math.abs(num).toLocaleString("es", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })}`;
  }
  if (field.field_type === "duration" && typeof value === "number") {
    const fmt = (field.options_json as { durationFormat?: string })?.durationFormat || "h:mm:ss";
    return formatSeconds(value, fmt);
  }
  if (field.field_type === "percent" && typeof value === "number") {
    return `${(value * 100).toFixed(0)}%`;
  }
  return String(value);
}

export function formatSeconds(totalSeconds: number, format: string): string {
  const neg = totalSeconds < 0;
  const s = Math.abs(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const ms = Math.round((secs - Math.floor(secs)) * 1000);
  const wholeSecs = Math.floor(secs);
  const prefix = neg ? "-" : "";

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const pad3 = (n: number) => String(n).padStart(3, "0");

  switch (format) {
    case "h:mm":
      return `${prefix}${hours}:${pad2(minutes)}`;
    case "h:mm:ss":
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}`;
    case "h:mm:ss.s":
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}.${Math.floor(ms / 100)}`;
    case "h:mm:ss.ss":
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}.${pad2(Math.floor(ms / 10))}`;
    case "h:mm:ss.sss":
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}.${pad3(ms)}`;
    default:
      return `${prefix}${hours}:${pad2(minutes)}:${pad2(wholeSecs)}`;
  }
}

export function parseDurationInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed.endsWith("ms")) {
    return parseFloat(trimmed) / 1000;
  }
  if (trimmed.endsWith("s")) {
    return parseFloat(trimmed);
  }
  if (trimmed.endsWith("m")) {
    return parseFloat(trimmed) * 60;
  }
  if (trimmed.endsWith("h")) {
    return parseFloat(trimmed) * 3600;
  }

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    let total = 0;
    if (parts.length >= 3) {
      total = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2] || "0");
    } else if (parts.length === 2) {
      total = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60;
    }
    return isNaN(total) ? null : total;
  }

  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return num >= 1000 ? num : num * 60;
  }

  return null;
}

export function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
