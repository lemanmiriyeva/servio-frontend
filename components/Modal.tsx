"use client";
import { X } from "lucide-react";

/**
 * Hər yerdə eyni görünüşlü "yeni X yarat" pəncərəsi — kənara klikləyəndə və ya
 * X-ə basanda bağlanır. Səhifə düzülüşünün içinə "aşağı açılan kart" kimi
 * yerləşən köhnə üsul (hər səhifədə fərqli görünürdü) əvəzinə bunu istifadə edin.
 */
export function Modal({
                          title, onClose, children, maxWidth = "max-w-xl",
                      }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className={`card ${maxWidth} w-full flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-muted flex-none"><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}