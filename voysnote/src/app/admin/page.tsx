"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { MiniPlayer } from "@/components/shell/MiniPlayer";
import { Toaster } from "@/components/ui/Toast";
import { useHydrated } from "@/lib/store/app";

// Demo: open to everyone. With Supabase, writes are enforced by RLS
// (profiles.role = 'admin'), so a non-admin sees the UI but can't save.
export default function AdminPage() {
  const hydrated = useHydrated();
  return (
    <div className="min-h-dvh bg-cream">
      {hydrated ? <AdminDashboard /> : null}
      <MiniPlayer />
      <Toaster />
    </div>
  );
}
