"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { AdminUser, updateAdminUser } from "@/lib/api";

const passwordRule = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[a-zA-Z]/, "La contraseña debe contener al menos 1 letra")
  .regex(/[0-9]/, "La contraseña debe contener al menos 1 número");

const editUserSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  password: z.union([z.literal(""), passwordRule]),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  onUpdated: (user: AdminUser) => void;
}

export function EditUserModal({
  user,
  open,
  onClose,
  onUpdated,
}: EditUserModalProps) {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    mode: "onChange",
    defaultValues: {
      firstName: user.first_name,
      lastName: user.last_name,
      password: "",
    },
  });

  const passwordValue = watch("password", "");

  useEffect(() => {
    if (open) {
      reset({
        firstName: user.first_name,
        lastName: user.last_name,
        password: "",
      });
      setServerError("");
    }
  }, [open, user, reset]);

  if (!open) return null;

  const onSubmit = async (data: EditUserForm) => {
    setServerError("");
    try {
      const payload: {
        first_name: string;
        last_name: string;
        password?: string;
      } = {
        first_name: data.firstName,
        last_name: data.lastName,
      };
      if (data.password) payload.password = data.password;
      const updated = await updateAdminUser(user.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Error al actualizar",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">
              Editar usuario
            </h2>
            <p className="text-sm text-brand-muted mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-brand-muted hover:text-brand-ink transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {serverError && (
          <div className="mb-4 rounded-xl bg-brand-red/10 border border-brand-red/30 px-4 py-2.5 text-sm text-brand-red">
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Nombre"
                placeholder="Juan"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Apellido"
                placeholder="Pérez"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <PasswordField
              label="Nueva contraseña (opcional)"
              placeholder="Dejar vacío para no cambiar"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordStrength password={passwordValue} />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
