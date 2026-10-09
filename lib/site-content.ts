// Açıq (ictimai) sayt məzmunu — Baş Admin panelindən idarə olunan verilənlər bazasından gəlir
// (backend: /api/site-content/). Backend əlçatan olmasa, köhnə statik dəyərlərə (FALLBACK) keçir
// ki, sayt heç vaxt boş və ya sınmış görünməsin.
import { FAQ, SITE } from "./site-config";

// Bu modul YALNIZ server komponentlərində (page.tsx-lər, SiteChrome) işləyir, brauzerdə yox.
// NEXT_PUBLIC_API_URL adətən "/api" (nisbi yol) olur, çünki brauzer sorğuları nginx vasitəsilə
// gedir — amma server tərəfdəki fetch üçün nisbi URL keçərsiz olur, ona görə server üçün ayrıca,
// mütləq (absolute) bir ünvan lazımdır: ya INTERNAL_API_URL env dəyişəni, ya da (o olmasa)
// docker-compose.yml-dəki backend servisinin adı ilə birbaşa konteynerlər-arası ünvan.
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_URL =
    process.env.INTERNAL_API_URL ||
    (PUBLIC_API_URL.startsWith("http") ? PUBLIC_API_URL : "http://backend:8000/api");

export type SiteSettingsContent = {
  brand_name: string;
  tagline: string;
  logo: string | null;
  hero_title: string;
  hero_subtitle: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
  footer_note: string;
};

export type FaqEntry = { id: number | string; question: string; answer: string };
export type FeatureEntry = {
  id: number | string; icon: string; tone: "primary" | "dark";
  title: string; short_description: string; points: string[];
};
export type AboutValueEntry = { id: number | string; icon: string; title: string; text: string };
export type HomeStepEntry = { id: number | string; number: string; title: string; description: string };
export type PublicPlan = {
  id: number | string; name: string; price_monthly: string | number;
  price_yearly?: string | number | null; public_description_yearly?: string;
  max_branches: number; max_users: number; public_description: string;
  features: string[]; is_featured: boolean;
};

export type SiteContent = {
  settings: SiteSettingsContent;
  faq: FaqEntry[];
  features: FeatureEntry[];
  about_values: AboutValueEntry[];
  home_steps: HomeStepEntry[];
  plans: PublicPlan[];
};

const FALLBACK: SiteContent = {
  settings: {
    brand_name: SITE.name,
    tagline: "",
    logo: null,
    hero_title: "Servisinizi daha rahat idarə edin.",
    hero_subtitle:
        "Müştərilər, təmirlər, gəlir-xərc, anbar, borclar və hesabatlar — hamısı bir platformada. " +
        "Telefon və kompüter servis bizneslər üçün ağıllı idarəetmə sistemi.",
    email: SITE.email, phone: SITE.phone, whatsapp: SITE.whatsapp,
    address: SITE.address, hours: SITE.hours, footer_note: "",
  },
  faq: FAQ.map((f, i) => ({ id: i, question: f.q, answer: f.a })),
  features: [
    { id: 1, icon: "Users", tone: "primary", title: "Müştərilər", short_description: "Müştəri bazasını yaradın və asanlıqla idarə edin.", points: ["Ad, telefon və qeydlər üzrə sürətli axtarış", "Hər müştərinin bütün təmir tarixçəsi", "Ödənişlər, borclar və zəmanətlər bir profildə"] },
    { id: 2, icon: "Wrench", tone: "dark", title: "Təmir / Xidmətlər", short_description: "Təmir prosesini izləyin, statusları qeyd edin.", points: ["Hər xidmətə avtomatik nömrə (SRV-2026-000125)", "Qəbul edildi → Diaqnostika → Hazırdır → Təhvil verildi", "Qazanc satış və maya dəyərindən avtomatik hesablanır"] },
    { id: 3, icon: "Boxes", tone: "primary", title: "Anbar", short_description: "Ehtiyat hissələri və malların idarə edilməsi.", points: ["Alış və satış qiyməti, say və minimum hədd", "Stok azaldıqda xəbərdarlıq", "Detal istifadə olunanda say avtomatik azalır"] },
    { id: 4, icon: "Truck", tone: "dark", title: "Təchizatçılar", short_description: "Təchizatçıları əlavə edin, borcları izləyin.", points: ["Alış tarixçəsi və ümumi məbləğ", "Ay sonu hesablaşma üçün borc qeydi", "Təmirdən avtomatik təchizatçı borcu yaratmaq"] },
    { id: 5, icon: "Wallet", tone: "primary", title: "Kassa", short_description: "Gəlir və xərcləri idarə edin, kassa balansını görün.", points: ["Xidmət ödənişləri və digər gəlirlər", "Xərclər və təchizatçı ödənişləri balansdan çıxılır", "Bütün əməliyyatların tarixçəsi"] },
    { id: 6, icon: "BarChart3", tone: "dark", title: "Hesabatlar", short_description: "Gündəlik, aylıq, illik analizlər və qrafiklər.", points: ["İstənilən tarix aralığı üzrə hesabat", "Xidmət və təchizatçı üzrə analiz", "Ümumi satış, maya, xərc və xalis qazanc"] },
    { id: 7, icon: "ShieldCheck", tone: "primary", title: "Zəmanətlər", short_description: "Zəmanət müddətlərini izləyin, müştərilərə xəbərdarlıq edin.", points: ["Təhvildən sonra zəmanət avtomatik geri sayılır", "Bitməyə 3 gün qalanlar ayrıca görünür", "7 / 14 / 30 / 90 gün və ya zəmanətsiz"] },
    { id: 8, icon: "Printer", tone: "dark", title: "Qəbz / Çap", short_description: "Rəsmi qəbz və təhvil-təslim sənədlərini çap edin.", points: ["A4 formatında səliqəli təhvil-təslim aktı", "Servisin öz zəmanət şərtləri mətni", "Müştəri və usta imza sahələri"] },
  ] as FeatureEntry[],
  about_values: [
    { id: 1, icon: "Gauge", title: "Sadəlik", text: "Məqsəd mühasibat proqramı kimi mürəkkəb sistem yox, ustanın gündəlik işini sürətləndirən rahat alətdir. Müştəridən çapa qədər proses bir neçə klikdir." },
    { id: 2, icon: "Lock", title: "Məlumat təhlükəsizliyi", text: "Hər servis yalnız öz məlumatını görür. Müştəri, gəlir, xərc, təchizatçı və təmir məlumatları başqa servisə heç vaxt görünmür." },
    { id: 3, icon: "Puzzle", title: "Böyüməyə açıq", text: "Sistem modul əsaslıdır: filial, işçi rolları, anbar və yeni imkanlar biznesiniz böyüdükcə əlavə olunur." },
  ],
  home_steps: [
    { id: 1, number: "1", title: "Müştəri və cihazı qeyd edin", description: "Müştəri, cihaz, şikayət və görüləcək işi bir neçə kliklə əlavə edin." },
    { id: 2, number: "2", title: "Maya, satış və təchizatçını seçin", description: "Qazanc avtomatik hesablanır, təchizatçı borcu isə lazım olarsa avtomatik yazılır." },
    { id: 3, number: "3", title: "Təhvil verin və çap edin", description: "Ödənişi qeyd edin, A4 qəbz çap edin, zəmanət avtomatik geri saymağa başlasın." },
  ],
  plans: [
    { id: 1, name: "Basic", price_monthly: 19, max_branches: 1, max_users: 3, is_featured: false,
      public_description: "Tək usta və kiçik servislər üçün",
      features: ["Müştərilər və təmir qeydiyyatı", "Kassa, xərclər və borclar", "Zəmanət izləmə və A4 qəbz", "Anbar və təchizatçılar", "Hesabatlar və analitika"] },
    { id: 2, name: "Pro", price_monthly: 49, max_branches: 5, max_users: 15, is_featured: true,
      public_description: "Böyüyən və çox filiallı servislər üçün",
      features: ["Basic planın bütün imkanları", "5 filialadək bir hesabda", "15 istifadəçiyə qədər (usta, tələbə, kassir)", "Rol və icazələrin geniş idarəsi", "Böyük komanda üçün rahat nəzarət"] },
  ],
};

export async function getSiteContent(): Promise<SiteContent> {
  try {
    // Docker build mərhələsində (`next build` zamanı) backend hələ ayağa qalxmayıb və ya
    // şəbəkədən əlçatan deyil — adi fetch bu halda saxlanıla bilər (hang) və build-i
    // dəqiqələrlə dondurar. AbortController ilə sərt vaxt limiti qoyuruq ki, əlçatan
    // olmasa tez FALLBACK-a keçsin.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let res: Response;
    try {
      res = await fetch(`${API_URL}/site-content/`, { next: { revalidate: 60 }, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as Partial<SiteContent>;
    return {
      settings: { ...FALLBACK.settings, ...data.settings },
      faq: data.faq?.length ? data.faq : FALLBACK.faq,
      features: data.features?.length ? data.features : FALLBACK.features,
      about_values: data.about_values?.length ? data.about_values : FALLBACK.about_values,
      home_steps: data.home_steps?.length ? data.home_steps : FALLBACK.home_steps,
      plans: data.plans?.length ? data.plans : FALLBACK.plans,
    };
  } catch {
    return FALLBACK;
  }
}