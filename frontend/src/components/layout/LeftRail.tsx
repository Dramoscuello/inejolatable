"use client";

import { useState, useRef, useEffect } from "react";
import {
  HelpCircle,
  Bell,
  Database,
  Table2,
  LogOut,
} from "lucide-react";

interface LeftRailProps {
  user: { first_name: string; last_name: string; email: string } | null;
  onLogout: () => void;
}

export function LeftRail({ user, onLogout }: LeftRailProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? (user.first_name[0] + user.last_name[0]).toUpperCase()
    : "??";

  useEffect(() => {
    if (!showMenu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showMenu]);

  return (
    <div className="flex flex-col items-center w-12 shrink-0 bg-brand-surface border-r border-brand-border py-3 gap-2">
      <div className="flex flex-col items-center flex-1">
        <div className="mb-4">
          <Table2 size={24} className="text-brand-blue" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 mt-auto">
        <button className="p-2 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface-strong transition-colors cursor-pointer">
          <HelpCircle size={18} />
        </button>

        <button className="p-2 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface-strong transition-colors cursor-pointer">
          <Database size={18} />
        </button>

        <button className="p-2 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface-strong transition-colors cursor-pointer relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            title={user?.email}
          >
            {initials}
          </button>

          {showMenu && (
            <div className="absolute left-full bottom-0 ml-2 bg-white rounded-xl shadow-lg border border-brand-border py-1 w-44 z-50">
              <div className="px-3 py-2 border-b border-brand-border">
                <p className="text-sm font-medium text-brand-ink truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-brand-muted truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer text-left"
              >
                <LogOut size={14} className="text-brand-muted shrink-0" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
