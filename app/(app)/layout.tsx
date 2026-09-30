"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Səhifə dəyişəndə mobil menyunu avtomatik bağla
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Menyu açıq olanda arxa fonun sürüşməsinin qarşısını al (mobil)
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-muted text-sm">
        Yüklənir…
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex bg-bg">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 min-w-0 px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-7 flex flex-col gap-4 sm:gap-5">{children}</main>
      </div>
    </div>
  );
}
