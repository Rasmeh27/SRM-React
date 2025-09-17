import { Link, useLocation } from "react-router-dom";
import { Home, QrCode, History, LogOut } from "lucide-react";

const Item = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition
                 ${active ? "bg-white text-teal-700" : "text-white/90 hover:bg-white/10"}`}
      title={label}
    >
      <Icon size={20} />
    </Link>
  );
};

export default function SidebarPharmacy() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-16 lg:w-20 flex-col items-center gap-4 bg-teal-700 py-5 z-30">
      <div className="mt-1 mb-4 text-white">
        <svg viewBox="0 0 24 24" className="h-8 w-8 lg:h-9 lg:w-9" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 2v20M7 6h10M8 10c0 2.5 1.79 4.5 4 4.5s4-2 4-4.5" />
          <path d="M7 14c0 3 2.24 5 5 5s5-2 5-5" />
        </svg>
      </div>
      <Item to="/pharmacy" icon={Home} label="Inicio" />
      <Item to="/pharmacy/verify" icon={QrCode} label="Validar receta" />
      <Item to="/pharmacy/dispensed" icon={History} label="Dispensadas" />
      <div className="mt-auto">
        <Item to="/logout" icon={LogOut} label="Salir" />
      </div>
    </aside>
  );
}
