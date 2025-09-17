import React from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar />
      {/* IMPORTANT: padding-left sincronizado con el sidebar (w-16 / lg:w-20) */}
      <main className="md:pl-16 lg:pl-20 px-4 sm:px-6 lg:px-8 py-6">
        {/* ancho máximo cómodo para cards/tablas */}
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
