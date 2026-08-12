"use client";

import {
  Home,
  Star,
  Users,
  ChevronDown,
  Plus,
  Database,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { CreateWorkspaceModal } from "@/components/layout/CreateWorkspaceModal";
import { CreateBaseModal } from "@/components/layout/CreateBaseModal";
import { getWorkspaces, createWorkspace, Workspace } from "@/lib/api";

interface SidebarProps {
  collapsed: boolean;
  onClose: () => void;
  onBaseCreated: () => void;
}

const WORKSPACE_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-indigo-500",
];

export function Sidebar({ collapsed, onClose, onBaseCreated }: SidebarProps) {
  const [starredOpen, setStarredOpen] = useState(false);
  const [workspacesOpen, setWorkspacesOpen] = useState(true);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [baseModalOpen, setBaseModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await getWorkspaces();
      setWorkspaces(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = async (name: string) => {
    await createWorkspace(name);
    await fetchWorkspaces();
  };

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-brand-canvas border-r border-brand-border transition-transform ${
          collapsed ? "-translate-x-full lg:-translate-x-full" : "translate-x-0"
        } w-64 shrink-0`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-brand-ink bg-brand-blue/10 hover:bg-brand-blue/15 transition-colors"
          >
            <Home size={18} className="text-brand-blue" />
            Home
          </a>

          <button
            onClick={() => setStarredOpen(!starredOpen)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Star size={18} className="text-brand-yellow" />
              Favoritos
            </div>
            <ChevronDown
              size={14}
              className={`text-brand-muted transition-transform ${starredOpen ? "rotate-180" : ""}`}
            />
          </button>

          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-ink hover:bg-brand-surface transition-colors"
          >
            <Users size={18} />
            Compartidos
          </a>

          <div className="pt-3">
            <button
              onClick={() => setWorkspacesOpen(!workspacesOpen)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-brand-ink hover:bg-brand-surface transition-colors cursor-pointer"
            >
              <span>Espacios de trabajo</span>
              <div className="flex items-center gap-1">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkspaceModalOpen(true);
                  }}
                  className="p-0.5 rounded text-brand-muted hover:text-brand-ink hover:bg-brand-surface-strong transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </span>
                <ChevronDown
                  size={14}
                  className={`text-brand-muted transition-transform ${workspacesOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {workspacesOpen && (
              <div className="ml-3 mt-1 space-y-0.5">
                {workspaces.map((ws, i) => (
                  <a
                    key={ws.id}
                    href="#"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-brand-body hover:bg-brand-surface transition-colors"
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-sm ${WORKSPACE_COLORS[i % WORKSPACE_COLORS.length]}`}
                    />
                    {ws.name}
                  </a>
                ))}
                {workspaces.length === 0 && (
                  <p className="px-3 py-2 text-xs text-brand-muted">
                    No hay espacios de trabajo
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-3 pb-4">
          <button
            onClick={() => setBaseModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue/90 transition-colors cursor-pointer"
          >
            <Database size={16} />
            Crear base
          </button>
        </div>
      </aside>

      <CreateWorkspaceModal
        open={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        onCreated={handleCreateWorkspace}
      />

      <CreateBaseModal
        open={baseModalOpen}
        onClose={() => setBaseModalOpen(false)}
        onCreated={() => {
          setBaseModalOpen(false);
          onBaseCreated();
        }}
      />
    </>
  );
}
