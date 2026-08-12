"use client";

import { useState, useRef, useEffect } from "react";
import { Search, HelpCircle, Bell, Menu, ChevronDown, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/auth/BrandLogo";

interface TopBarProps {
  onToggleSidebar: () => void;
  user: { first_name: string; last_name: string; email: string } | null;
  onLogout: () => void;
}

export function TopBar({ onToggleSidebar, user, onLogout }: TopBarProps) {
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
    <header className="flex items-center justify-between h-14 px-4 bg-brand-canvas border-b border-brand-border shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
        >
          <Menu size={18} />
        </button>
        <BrandLogo />
      </div>

      <div className="flex-1 max-w-lg mx-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-border-strong"
          />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-9 pr-14 py-2 text-sm bg-brand-surface border border-brand-border rounded-xl outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 placeholder:text-brand-border-strong"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-brand-muted bg-white border border-brand-border rounded-md px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer">
          <HelpCircle size={18} />
        </button>

        <button className="p-2 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-brand-border relative" ref={menuRef}>
          <div className="w-7 h-7 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-xs text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
          >
            <ChevronDown size={14} />
          </button>

          {showMenu && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-brand-border py-1 w-44 z-50">
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
    </header>
  );
}
