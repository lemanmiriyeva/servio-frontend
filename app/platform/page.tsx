"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function PlatformPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform/dashboard/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("scrm_access")}` },
    }).then((r) => r.json()).then(setStats).catch(() => {});
  }, []);
  return (
    <div className="min-h-screen bg-bg p-8">
      <h1 className="text-2xl font-semibold mb-4">Platform — Mağazalar</h1>
      <div className="card max-w-md">
        <pre className="text-sm">{stats ? JSON.stringify(stats, null, 2) : "Yüklənir…"}</pre>
      </div>
    </div>
  );
}
