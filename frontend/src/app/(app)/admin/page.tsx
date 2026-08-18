"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Users, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminUser, getAdminUsers } from "@/lib/api";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { DeleteUserModal } from "@/components/admin/DeleteUserModal";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  useEffect(() => {
    document.title = "Administrar usuarios — inejomaTable";
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Error al cargar usuarios",
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 1) fetchUsers();
  }, [user, fetchUsers]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 1)) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== 1) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
          <Users size={18} className="text-brand-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-ink tracking-tight">
            Administrar usuarios
          </h1>
          <p className="text-sm text-brand-muted">
            Gestiona las cuentas registradas en inejomaTable
          </p>
        </div>
      </div>

      {listError && (
        <div className="mb-4 rounded-xl bg-brand-red/10 border border-brand-red/30 px-4 py-2.5 text-sm text-brand-red">
          {listError}
        </div>
      )}

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-brand-muted text-sm">No hay usuarios.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface text-left">
                <th className="px-5 py-3 font-medium text-brand-muted text-xs">
                  Usuario
                </th>
                <th className="px-4 py-3 font-medium text-brand-muted text-xs">
                  Rol
                </th>
                <th className="px-4 py-3 font-medium text-brand-muted text-xs">
                  Estado
                </th>
                <th className="px-4 py-3 font-medium text-brand-muted text-xs">
                  Creado
                </th>
                <th className="px-4 py-3 font-medium text-brand-muted text-xs text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === user.id;
                const isAdmin = u.role === 1;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-brand-border last:border-b-0 hover:bg-brand-surface/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {(u.first_name[0] + u.last_name[0]).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-brand-ink truncate">
                            {u.first_name} {u.last_name}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-brand-blue">
                                Tú
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-brand-muted truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue text-xs font-medium">
                          <ShieldCheck size={12} />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-brand-surface-strong text-brand-muted text-xs font-medium">
                          Usuario
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.state ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-brand-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-success" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-muted" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-muted text-xs whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {!isAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditing(u)}
                            title="Editar usuario"
                            className="p-2 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-brand-blue/10 transition-colors cursor-pointer"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleting(u)}
                            title="Eliminar usuario"
                            className="p-2 rounded-lg text-brand-muted hover:text-brand-red hover:bg-brand-red/10 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <EditUserModal
          user={editing}
          open={true}
          onClose={() => setEditing(null)}
          onUpdated={(updated) =>
            setUsers((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u)),
            )
          }
        />
      )}

      {deleting && (
        <DeleteUserModal
          user={deleting}
          open={true}
          onClose={() => setDeleting(null)}
          onDeleted={() =>
            setUsers((prev) => prev.filter((u) => u.id !== deleting.id))
          }
        />
      )}
    </div>
  );
}
