"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LeftRail } from "@/components/layout/LeftRail";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);
  const isBasePage = pathname.startsWith("/bases/");

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-brand-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (isBasePage) {
    return (
      <div className="flex h-full">
        <LeftRail user={user} onLogout={logout} />
        <div className="flex-1 flex flex-col min-w-0" key={refreshKey}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={logout}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarCollapsed(true)}
          onBaseCreated={triggerRefresh}
        />
        <main className="flex-1 overflow-y-auto bg-brand-surface" key={refreshKey}>
          {children}
        </main>
      </div>
    </div>
  );
}
