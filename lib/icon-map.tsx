// Baş Admin panelindən ikon adı (mətn, məs. "Wrench") seçilir — burada real ikon komponentinə çevrilir.
// Yeni ikon lazım olsa, sadəcə həm bura, həm də backend `sitecontent/models.py`-dəki ICON_CHOICES-ə əlavə edin.
import {
  BarChart3, Boxes, Check, Gauge, Lock, MonitorSmartphone, Printer,
  Puzzle, ShieldCheck, Smile, Star, Truck, Users, Wallet, Wrench,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Users, Wrench, Boxes, Truck, Wallet, BarChart3, ShieldCheck, Printer,
  Gauge, Lock, Puzzle, Smile, MonitorSmartphone, Check, Star,
};

export function getIcon(name?: string | null): LucideIcon {
  return (name && ICON_MAP[name]) || Check;
}
