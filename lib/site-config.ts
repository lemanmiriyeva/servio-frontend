import { Users, Wrench, Boxes, Truck, Wallet, BarChart3, ShieldCheck, Printer } from "lucide-react";

// ⚠️ Əlaqə məlumatlarını öz real məlumatlarınızla əvəz edin (indiki dəyərlər nümunədir).
export const SITE = {
  name: "SERVIO",
  email: "info@servio.az",
  phone: "+994 50 000 00 00",
  whatsapp: "994500000000", // wa.me üçün, + və boşluqsuz
  address: "Bakı, Azərbaycan",
  hours: "Bazar ertəsi – Şənbə, 09:00 – 18:00",
};

export const NAV = [
  { href: "/", label: "Ana səhifə" },
  { href: "/funksiyalar", label: "Funksiyalar" },
  { href: "/qiymetler", label: "Qiymətlər" },
  { href: "/haqqimizda", label: "Haqqımızda" },
  { href: "/faq", label: "FAQ" },
  { href: "/elaqe", label: "Əlaqə" },
];

export const FEATURES = [
  { icon: Users, tone: "bg-[#116CFB]", title: "Müştərilər", short: "Müştəri bazasını yaradın və asanlıqla idarə edin.",
    points: ["Ad, telefon və qeydlər üzrə sürətli axtarış", "Hər müştərinin bütün təmir tarixçəsi", "Ödənişlər, borclar və zəmanətlər bir profildə"] },
  { icon: Wrench, tone: "bg-[#041326]", title: "Təmir / Xidmətlər", short: "Təmir prosesini izləyin, statusları qeyd edin.",
    points: ["Hər xidmətə avtomatik nömrə (SRV-2026-000125)", "Qəbul edildi → Diaqnostika → Hazırdır → Təhvil verildi", "Qazanc satış və maya dəyərindən avtomatik hesablanır"] },
  { icon: Boxes, tone: "bg-[#116CFB]", title: "Anbar", short: "Ehtiyat hissələri və malların idarə edilməsi.",
    points: ["Alış və satış qiyməti, say və minimum hədd", "Stok azaldıqda xəbərdarlıq", "Detal istifadə olunanda say avtomatik azalır"] },
  { icon: Truck, tone: "bg-[#041326]", title: "Təchizatçılar", short: "Təchizatçıları əlavə edin, borcları izləyin.",
    points: ["Alış tarixçəsi və ümumi məbləğ", "Ay sonu hesablaşma üçün borc qeydi", "Təmirdən avtomatik təchizatçı borcu yaratmaq"] },
  { icon: Wallet, tone: "bg-[#116CFB]", title: "Kassa", short: "Gəlir və xərcləri idarə edin, kassa balansını görün.",
    points: ["Xidmət ödənişləri və digər gəlirlər", "Xərclər və təchizatçı ödənişləri balansdan çıxılır", "Bütün əməliyyatların tarixçəsi"] },
  { icon: BarChart3, tone: "bg-[#041326]", title: "Hesabatlar", short: "Gündəlik, aylıq, illik analizlər və qrafiklər.",
    points: ["İstənilən tarix aralığı üzrə hesabat", "Xidmət və təchizatçı üzrə analiz", "Ümumi satış, maya, xərc və xalis qazanc"] },
  { icon: ShieldCheck, tone: "bg-[#116CFB]", title: "Zəmanətlər", short: "Zəmanət müddətlərini izləyin, müştərilərə xəbərdarlıq edin.",
    points: ["Təhvildən sonra zəmanət avtomatik geri sayılır", "Bitməyə 3 gün qalanlar ayrıca görünür", "7 / 14 / 30 / 90 gün və ya zəmanətsiz"] },
  { icon: Printer, tone: "bg-[#041326]", title: "Qəbz / Çap", short: "Rəsmi qəbz və təhvil-təslim sənədlərini çap edin.",
    points: ["A4 formatında səliqəli təhvil-təslim aktı", "Servisin öz zəmanət şərtləri mətni", "Müştəri və usta imza sahələri"] },
];

export const PLANS = [
  { name: "Basic", price: 19, desc: "Tək usta və kiçik servislər üçün", branches: "1 filial", users: "3 istifadəçi", featured: false,
    items: ["Müştərilər və təmir qeydiyyatı", "Kassa, xərclər və borclar", "Zəmanət izləmə və A4 qəbz", "Anbar və təchizatçılar", "Hesabatlar və analitika"] },
  { name: "Pro", price: 49, desc: "Böyüyən və çox filiallı servislər üçün", branches: "5 filial", users: "15 istifadəçi", featured: true,
    items: ["Basic planın bütün imkanları", "5 filialadək bir hesabda", "15 istifadəçiyə qədər (usta, tələbə, kassir)", "Rol və icazələrin geniş idarəsi", "Böyük komanda üçün rahat nəzarət"] },
];

export const FAQ = [
  { q: "Servio kimlər üçündür?", a: "Telefon və kompüter təmiri ilə məşğul olan ustalar və servis mərkəzləri üçün. Müştəri, təmir, kassa, anbar, borc və hesabatların hamısı bir yerdədir." },
  { q: "Telefonda işləyirmi?", a: "Bəli. Sistem həm kompüter, həm də telefon ekranında rahat işləyir, ona görə də ustalar işin ortasında da məlumat daxil edə bilər." },
  { q: "Mənim məlumatımı başqa servis görə bilərmi?", a: "Xeyr. Hər servis ayrıca hesab kimi işləyir və yalnız öz müştərilərini, gəlirini, xərclərini, borclarını və təmir məlumatlarını görür." },
  { q: "Tələbəyə giriş versəm, qazancı görəcəkmi?", a: "Yox. Rol və icazələr bölməsindən şəyird üçün gəlir və net qazanc rəqəmlərini bağlaya bilərsiniz. O, təmirlərlə işləyə bilər, amma maya, qazanc və gəlir ona görünmür." },
  { q: "Bir neçə filialla işləmək mümkündürmü?", a: "Bəli. Basic planda 1, Pro planda 5 filial dəstəklənir. Hər plan üzrə filial və istifadəçi limiti Qiymətlər səhifəsində göstərilib." },
  { q: "Təchizatçıya borcu necə izləyirəm?", a: "Təmiri qeyd edəndə detalı təchizatçıdan borcla aldığınızı seçirsiniz, məbləğ təchizatçının hesabına borc kimi yazılır. Ödəyəndən sonra ödənilmiş kimi işarələyirsiniz. Detal istifadə olunmayıbsa (məsələn, plata təmiri), bu sahəni doldurmaq məcburi deyil." },
  { q: "Zəmanət necə hesablanır?", a: "Cihaz təhvil veriləndə zəmanət müddəti avtomatik başlayır və gün-gün geri sayılır. Müddəti bitən zəmanət “müddəti bitib” kimi göstərilir." },
  // { q: "Pulsuz başlaya bilərəmmi?", a: "Bəli, pulsuz sınaqla başlaya bilərsiniz. Müddət və şərtlər barədə Əlaqə səhifəsindən bizə yazın." },
];
