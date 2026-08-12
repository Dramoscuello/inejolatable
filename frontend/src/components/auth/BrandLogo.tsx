import { Table2 } from "lucide-react";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <Table2 size={28} className="text-brand-blue" />
      <span className="text-lg font-semibold text-brand-ink tracking-tight">
        inejomaTable
      </span>
    </div>
  );
}
