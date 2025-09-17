import React from "react";
import SidebarPharmacy from "./SidebarPharmacy";

export default function PharmacyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <SidebarPharmacy />
      <main className="md:pl-16 lg:pl-20 px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
