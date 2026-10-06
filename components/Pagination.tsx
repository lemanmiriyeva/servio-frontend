"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 10;

type Props = {
    page: number;
    totalItems: number;
    pageSize?: number;
    onChange: (page: number) => void;
};

export function Pagination({ page, totalItems, pageSize = PAGE_SIZE, onChange }: Props) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalPages <= 1) return null;

    const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between gap-3 px-1 pt-3 flex-wrap">
            <span className="text-xs text-muted">{from}–{to} / {totalItems}</span>
            <div className="flex items-center gap-2">
                <button
                    className="btn sm"
                    disabled={page <= 1}
                    onClick={() => onChange(page - 1)}
                    aria-label="Əvvəlki səhifə"
                >
                    <ChevronLeft size={15} />
                </button>
                <span className="text-xs font-semibold text-ink2 min-w-[50px] text-center">{page} / {totalPages}</span>
                <button
                    className="btn sm"
                    disabled={page >= totalPages}
                    onClick={() => onChange(page + 1)}
                    aria-label="Növbəti səhifə"
                >
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
}

/** Bir massivi cari səhifəyə görə kəsir. */
export function paginate<T>(items: T[], page: number, pageSize: number = PAGE_SIZE): T[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
}