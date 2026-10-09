// Açıq (ictimai) sayt məzmunu — YALNIZ Baş Admin panelindən (Platform) idarə olunan
// verilənlər bazasından gəlir (backend: /api/site-content/). Əvvəllər backend boş qeyd
// qaytaranda (və ya bütöv sorğu uğursuz olanda) kod daxilindəki sabit "FALLBACK" mətni
// sükutla göstərilirdi — bu, admin-in bazada etdiyi dəyişiklikləri "görünməz" edirdi.
// İndi fallback YOXDUR: backend nə qaytarırsa, dəqiq elə göstərilir (bölmə bazada boşdursa,
// səhifədə də boş görünür — bu, admin-ə "buraya məzmun əlavə et" siqnalıdır, saxta mətn yox).
import { SITE } from "./site-config";

// Bu modul YALNIZ server komponentlərində (page.tsx-lər, SiteChrome) işləyir, brauzerdə yox.
// NEXT_PUBLIC_API_URL adətən "/api" (nisbi yol) olur, çünki brauzer sorğuları nginx vasitəsilə
// gedir — amma server tərəfdəki fetch üçün nisbi URL keçərsiz olur, ona görə server üçün ayrıca,
// mütləq (absolute) bir ünvan lazımdır: ya INTERNAL_API_URL env dəyişəni, ya da (o olmasa)
// docker-compose.yml-dəki backend konteynerinin HƏQİQİ adı ilə birbaşa konteynerlər-arası
// ünvan. Bu konteynerin əsl adı "servio-backend"dir (əvvəllər səhvən "backend" yazılmışdı —
// bu ad Docker şəbəkəsində mövcud olmadığı üçün SSR sorğusu uğursuz olur, səhifə backend-dən
// heç nə ala bilmədən boş görünürdü). Production-da ən doğrusu INTERNAL_API_URL-i açıq
// təyin etməkdir (məs. docker-compose.yml-də "INTERNAL_API_URL=http://servio-backend:8000/api")
// — aşağıdakı defolt yalnız bu env dəyişəni verilməyəndə işə düşən ehtiyat seçimdir.
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_URL =
    process.env.INTERNAL_API_URL ||
    (PUBLIC_API_URL.startsWith("http") ? PUBLIC_API_URL : "http://servio-backend:8000/api");

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

// Bazadan heç nə gəlmədiyi/çatmadığı anlar üçün yalnız "boş struktur" — SAXTA MARKETİNQ
// MƏTNİ YOXDUR. Admin bir bölməni bazada doldurmayıbsa, həmin bölmə səhifədə sadəcə boş
// görünməlidir ki, problem gizli qalmasın.
const EMPTY: SiteContent = {
  settings: {
    brand_name: SITE.name, tagline: "", logo: null,
    hero_title: "", hero_subtitle: "",
    email: "", phone: "", whatsapp: "", address: "", hours: "", footer_note: "",
  },
  faq: [], features: [], about_values: [], home_steps: [], plans: [],
};

export async function getSiteContent(): Promise<SiteContent> {
  try {
    // Docker build mərhələsində (`next build` zamanı) backend hələ ayağa qalxmayıb və ya
    // şəbəkədən əlçatan deyil — adi fetch bu halda saxlanıla bilər (hang) və build-i
    // dəqiqələrlə dondurar. AbortController ilə sərt vaxt limiti qoyuruq. Qeyd: bu səhifələr
    // `export const dynamic = "force-dynamic"` ilə işarələnib, ona görə bu sorğu HƏQİQƏTƏN
    // yalnız runtime-da (hər istəkdə), build zamanı YOX, icra olunur — aşağıdakı timeout
    // sırf şəbəkə problemi/kəsilmə halları üçün bir təhlükəsizlik tərəfidir.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let res: Response;
    try {
      res = await fetch(`${API_URL}/site-content/`, { cache: "no-store", signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as Partial<SiteContent>;
    // Heç bir sahə sabit mətnlə "tamamlanmır" — backend nə qaytarırsa, dəqiq elədir.
    return {
      settings: { ...EMPTY.settings, ...data.settings },
      faq: data.faq ?? [],
      features: data.features ?? [],
      about_values: data.about_values ?? [],
      home_steps: data.home_steps ?? [],
      plans: data.plans ?? [],
    };
  } catch {
    return EMPTY;
  }
}