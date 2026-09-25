# ServisCRM — Frontend (Next.js)

## Quraşdırma
```bash
npm install
npm run dev
```
`http://localhost:3000` ünvanında açılır. Backend `http://127.0.0.1:8000`-də işləməlidir
(bax `../backend/README.md`). API ünvanı `.env.local`-da təyin olunub:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

## Giriş
- Mağaza istifadəçisi: `elvin.techfix` / `parol123` → `/dashboard`
- Platform Super Admin: `superadmin` / `parol123` → `/platform`

## Struktur
- `src/lib/api.ts` — bütün backend sorğuları, JWT token idarəetməsi (access/refresh, avtomatik yeniləmə)
- `src/lib/auth-context.tsx` — React Context: cari istifadəçi, giriş/çıxış, `hasModule()` icazə yoxlaması
- `src/app/login/page.tsx` — Giriş səhifəsi (dizaynla eyni)
- `src/app/(app)/layout.tsx` — qorunan səhifələr üçün Sidebar + Topbar qabığı; giriş edilməyibsə `/login`-ə yönləndirir
- `src/app/(app)/dashboard/page.tsx` — Dashboard, canlı API məlumatı ilə (KPI-lar, son xidmətlər, borclar, xəbərdarlıqlar)
- `src/components/Sidebar.tsx` — naviqasiya, istifadəçinin roluna görə modulları göstərir/gizlədir
- Digər bütün naviqasiya bölmələri (Təmir/Xidmətlər, Müştərilər, Anbar, Kassa, Borclar, Hesabatlar, İstifadəçilər, Parametrlər və s.) hələlik placeholder səhifələrdir — növbəti addımda dizayna uyğun tam qurulacaq.

## Dizayn sistemi
Bütün rənglər, boşluqlar və komponent stilləri orijinal dizayn faylından (--bg, --side, --brand, .card, .btn, .badge və s.) globals.css-ə köçürülüb, Tailwind v4-ün @theme mexanizmi ilə bg-side, text-muted, b-green kimi utility-lərə çevrilib.
