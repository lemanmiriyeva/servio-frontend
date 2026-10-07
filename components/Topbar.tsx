"use client";
import { Plus, Bell, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { GlobalSearch } from "@/components/GlobalSearch";

type TopbarProps = {
    onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
    const router = useRouter();
    return (
        <div className="h-[76px] flex-none flex items-center gap-3 px-4 sm:px-6 md:px-8 border-b border-line bg-bg">
            <button
                onClick={onMenuClick}
                className="md:hidden w-11 h-11 rounded-[10px] bg-white border border-line flex items-center justify-center text-ink2 flex-none"
                title="Menyu"
            >
                <Menu size={20} />
            </button>
            <GlobalSearch />
            <div className="flex-1" />
            <button onClick={() => router.push("/repairs/new")} className="btn pri !px-3 sm:!px-[18px]">
                <Plus size={18} />
                <span className="hidden sm:inline">Yeni xidmət</span>
            </button>
            <button className="w-11 h-11 rounded-[10px] bg-white border border-line flex items-center justify-center text-ink2 relative flex-none">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-[9px] h-[9px] rounded-full bg-red border-2 border-white" />
            </button>
        </div>
    );
}