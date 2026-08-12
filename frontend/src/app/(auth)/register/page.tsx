"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { ArrowRight } from "lucide-react";
import { register as registerUser } from "@/lib/api";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "El nombre es obligatorio"),
    lastName: z.string().min(1, "El apellido es obligatorio"),
    email: z
      .string()
      .min(1, "El correo es obligatorio")
      .email("Correo electrónico inválido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[a-zA-Z]/, "La contraseña debe contener al menos 1 letra")
      .regex(/[0-9]/, "La contraseña debe contener al menos 1 número"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  useEffect(() => { document.title = "Registro — inejomaTable"; }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");
    try {
      const res = await registerUser({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      router.push("/");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al crear cuenta";
      setServerError(msg);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {serverError && (
          <div className="mb-6 rounded-xl bg-brand-red/10 border border-brand-red/30 px-4 py-2.5 text-sm text-brand-red">
            {serverError}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-ink tracking-tight">
            Crear cuenta
          </h1>
          <p className="mt-1.5 text-sm text-brand-muted">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-brand-blue hover:underline font-medium"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          method="POST"
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

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="juan@ejemplo.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="flex flex-col gap-1.5">
            <PasswordField
              label="Contraseña"
              placeholder="Mín. 8 caracteres, letras y números"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordStrength password={passwordValue} />
          </div>

          <PasswordField
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting}
            className="mt-2"
          >
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            {!isSubmitting && <ArrowRight size={16} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
