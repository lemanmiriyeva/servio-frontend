"use client";
import { Search, Plus, Bell, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  return (
    <div className="h-[70px] md:h-[76px] flex-none flex items-center gap-2 md:gap-3 px-3 sm:px-6 md:px-8 border-b border-line bg-bg">
      <button type="button"
        onClick={onMenuClick}
        className="md:hidden w-11 h-11 rounded-[10px] bg-white border border-line flex items-center justify-center text-ink2 flex-none"
        aria-label="Menyu"
      >
        <Menu size={20} />
      </button>
      <div className="hidden sm:flex flex-1 min-w-0 items-center gap-2.5 h-11 max-w-[460px] px-3.5 bg-white border border-line rounded-[10px] text-muted cursor-pointer">
        <Search size={18} className="flex-none" />
        <span className="text-sm truncate">Müştəri, telefon, IMEI, təmir № üzrə axtar</span>
        <span className="ml-auto text-xs border border-line rounded-md px-1.5 py-px flex-none">Ctrl K</span>
      </div>
      <div className="flex items-center gap-2 md:gap-3 ml-auto flex-none">
        <button type="button" onClick={() => router.push("/repairs/new")} className="btn pri !px-3.5 sm:!px-[18px]">
          <Plus size={18} />
          <span className="hidden sm:inline">Yeni xidmət</span>
        </button>
        <button type="button" onClick={() => router.push("/notifications")} className="w-11 h-11 rounded-[10px] bg-white border border-line flex items-center justify-center text-ink2 relative flex-none">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-[9px] h-[9px] rounded-full bg-red border-2 border-white" />
        </button>
      </div>
    </div>
  );
}
