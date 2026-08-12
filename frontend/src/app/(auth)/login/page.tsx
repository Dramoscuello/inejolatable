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
import { ArrowRight } from "lucide-react";
import { login } from "@/lib/api";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  useEffect(() => { document.title = "Iniciar sesión — inejomaTable"; }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError("");
    try {
      const res = await login(data.email, data.password);
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      router.push("/");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al iniciar sesión";
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
            Iniciar sesión
          </h1>
          <p className="mt-1.5 text-sm text-brand-muted">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="text-brand-blue hover:underline font-medium"
            >
              Crear una
            </Link>
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          method="POST"
          noValidate
        >
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="juan@ejemplo.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <PasswordField
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting}
            className="mt-2"
          >
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            {!isSubmitting && <ArrowRight size={16} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
