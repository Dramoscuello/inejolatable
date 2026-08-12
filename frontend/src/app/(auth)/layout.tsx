import { BrandLogo } from "@/components/auth/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-gradient-to-br from-brand-surface via-white to-blue-50 flex-col justify-between p-10">
        <BrandLogo />
        <div className="max-w-md">
          <h2 className="text-4xl font-bold text-brand-ink leading-tight tracking-tight">
            Bienvenido a
            <br />
            <span className="text-brand-blue">inejomaTable</span>
          </h2>
          <p className="mt-3 text-brand-muted text-base leading-relaxed">
            Auto-hospedada, privada y sin límites. Tus datos se quedan en tus
            servidores.
          </p>
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-brand-yellow" />
          <div className="h-2 w-2 rounded-full bg-brand-turquoise" />
          <div className="h-2 w-2 rounded-full bg-brand-red" />
        </div>
      </div>

      <div className="lg:hidden absolute top-5 left-5">
        <BrandLogo />
      </div>

      {children}
    </div>
  );
}
