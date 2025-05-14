"use client";

import { ReactNode } from "react";
import { Navigation } from "@/app/components/custom/navigation";

// DashboardLayout wraps all dashboard pages with navigation and a dashboard container
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
