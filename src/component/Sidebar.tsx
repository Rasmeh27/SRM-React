// src/component/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { Home, FileSignature, History, Users, IdCard, LogOut } from "lucide-react";

type ItemProps = { to: string; icon: any; label: string };

const NavItem = ({ to, icon: Icon, label }: ItemProps) => {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      className={`relative group flex h-11 w-11 items-center justify-center rounded-2xl transition-all
        ${active
          ? "bg-white text-teal-700 shadow ring-1 ring-teal-700/20"
          : "text-white/90 hover:bg-white/10 hover:text-white"
        }`}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {/* Indicador activo (barra) */}
      {active && <span className="absolute left-0 -ml-2 h-7 w-1 rounded-full bg-white/80" aria-hidden />}
      <Icon size={20} strokeWidth={2} />

      {/* Tooltip */}
      <span
        className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 scale-95 opacity-0 transition-all
                   whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-teal-800 shadow-lg ring-1 ring-teal-700/10
                   group-hover:opacity-100 group-hover:scale-100"
      >
        {label}
      </span>
    </Link>
  );
};

export default function Sidebar() {
  return (
    // Lateral compacto con gradiente teal, sombras suaves y anillas coherentes
    <aside
      className="hidden md:flex fixed left-0 top-0 z-30 h-screen w-16 lg:w-20 flex-col items-center gap-4
                 bg-gradient-to-b from-teal-700 to-teal-800 py-5 shadow-xl ring-1 ring-black/10"
    >
      {/* Logo SRM (coloca /public/logo-srm.svg o /public/logo-srm.png) */}
      <Link
        to="/doctor"
        className="group relative mt-1 mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10
                   ring-1 ring-white/15 transition hover:bg-white/15"
        aria-label="Inicio"
      >
        <img
          src="/src/images/logo_med_shield.png"
          onError={(e) => {
            // fallback opcional si usas PNG
            const img = e.currentTarget as HTMLImageElement;
            if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = "/logo-srm.png"; }
          }}
          alt="SRM"
          className="h-7 w-7 object-contain drop-shadow"
        />
        <span className="sr-only">Inicio</span>
      </Link>

      <div className="h-px w-10 bg-white/15" />

      <nav className="flex flex-col items-center gap-2">
        <NavItem to="/doctor" icon={Home} label="Inicio" />
        <NavItem to="/doctor/prescriptions/new" icon={FileSignature} label="Emitir receta" />
        <NavItem to="/doctor/prescriptions" icon={History} label="Historial" />
        <NavItem to="/doctor/patients" icon={Users} label="Pacientes" />
        <NavItem to="/doctor/profile" icon={IdCard} label="Perfil" />
      </nav>

      <div className="mt-auto h-px w-10 bg-white/15" />

      <div className="pb-1">
        <NavItem to="/logout" icon={LogOut} label="Salir" />
      </div>
    </aside>
  );
}
