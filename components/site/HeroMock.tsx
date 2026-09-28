import { TrendingUp, Users, Boxes, ShieldCheck } from "lucide-react";

function Badge({ icon: Icon, tone, label, className }: { icon: typeof Users; tone: string; label: string; className: string }) {
  return (
    <div className={`absolute ${className} flex items-center gap-2.5 rounded-xl bg-[#111C3D]/90 backdrop-blur-md border border-white/15 px-3.5 py-2.5 shadow-xl z-10`}>
      <span className={`w-8 h-8 rounded-lg ${tone} flex items-center justify-center text-white`}><Icon size={17} /></span>
      <span className="text-[13px] font-medium text-white whitespace-nowrap">{label}</span>
    </div>
  );
}

function MiniStat({ c }: { c: string }) {
  return (
    <div className="rounded-md bg-white border border-[#E6EBF5] p-1.5">
      <div className={`w-3 h-3 rounded-sm ${c} mb-1.5`} />
      <div className="h-1.5 w-8 rounded bg-[#DDE4F2]" />
      <div className="h-2 w-6 rounded bg-[#0B1B3F]/80 mt-1" />
    </div>
  );
}

export function HeroMock() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto aspect-[1.08/1]">
      {/* glow */}
      <div className="absolute inset-0 -z-0 rounded-full bg-[#1F6BFF]/25 blur-[90px]" />

      {/* laptop */}
      <div className="absolute left-[10%] top-[16%] w-[78%]">
        <div className="rounded-t-2xl bg-[#0E1526] p-[2.2%] border border-white/10 shadow-2xl">
          <div className="rounded-lg bg-[#F4F7FD] aspect-[16/10] overflow-hidden flex">
            <div className="w-[15%] bg-white border-r border-[#E6EBF5] p-2 flex flex-col gap-1.5">
              <div className="h-2 w-8 rounded bg-[#1F6BFF]" />
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className={`h-1.5 rounded ${i === 1 ? "bg-[#1F6BFF]/30" : "bg-[#E3E8F3]"}`} />)}
            </div>
            <div className="flex-1 p-2.5 flex flex-col gap-2">
              <div className="h-2 w-16 rounded bg-[#0B1B3F]/80" />
              <div className="grid grid-cols-5 gap-1.5">
                {["bg-[#1F6BFF]", "bg-[#12B48A]", "bg-[#F5A524]", "bg-[#8B5CF6]", "bg-[#EF4444]"].map((c) => <MiniStat key={c} c={c} />)}
              </div>
              <div className="flex-1 grid grid-cols-[1.6fr_1fr] gap-1.5 min-h-0">
                <div className="rounded-md bg-white border border-[#E6EBF5] p-2 flex flex-col">
                  <div className="h-1.5 w-14 rounded bg-[#DDE4F2] mb-1" />
                  <svg viewBox="0 0 200 80" className="flex-1 w-full" preserveAspectRatio="none">
                    <defs><linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1F6BFF" stopOpacity=".35" /><stop offset="1" stopColor="#1F6BFF" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0 62 L22 54 L40 58 L62 40 L84 46 L108 28 L132 36 L156 18 L180 24 L200 8 L200 80 L0 80Z" fill="url(#hg)" />
                    <path d="M0 62 L22 54 L40 58 L62 40 L84 46 L108 28 L132 36 L156 18 L180 24 L200 8" fill="none" stroke="#1F6BFF" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="rounded-md bg-white border border-[#E6EBF5] p-2 flex flex-col gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#DDE4F2]" />
                      <div className="h-1.5 flex-1 rounded bg-[#E3E8F3]" />
                      <div className="h-1.5 w-4 rounded bg-[#12B48A]/60" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-2.5 mx-[-3%] rounded-b-xl bg-gradient-to-b from-[#C9D1E0] to-[#8F9AB3]" />
      </div>

      {/* phone */}
      <div className="absolute left-[2%] bottom-[8%] w-[27%] aspect-[9/18.5] rounded-[22px] bg-[#0E1526] p-[2.2%] border border-white/15 shadow-2xl">
        <div className="w-full h-full rounded-[18px] bg-[#F4F7FD] overflow-hidden flex flex-col">
          <div className="bg-[#0B1B3F] px-2.5 pt-3 pb-2.5">
            <div className="h-1.5 w-10 rounded bg-white/70" />
            <div className="h-3 w-14 rounded bg-white mt-1.5" />
          </div>
          <div className="flex-1 p-2 flex flex-col gap-1.5">
            {["#1F6BFF", "#12B48A", "#F5A524", "#8B5CF6", "#EF4444"].map((c) => (
              <div key={c} className="flex items-center gap-1.5 rounded-md bg-white border border-[#E6EBF5] p-1.5">
                <div className="w-4 h-4 rounded" style={{ background: c }} />
                <div className="flex-1"><div className="h-1.5 w-10 rounded bg-[#DDE4F2]" /><div className="h-1.5 w-6 rounded bg-[#E9EDF6] mt-1" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Badge icon={TrendingUp} tone="bg-[#12B48A]" label="Gəlir artımı" className="left-[8%] top-[2%]" />
      <Badge icon={Users} tone="bg-[#7C5CFF]" label="Müştəri bazası" className="right-[2%] top-[6%]" />
      <Badge icon={Boxes} tone="bg-[#F5A524]" label="Anbar idarəsi" className="right-[-3%] top-[42%] hidden sm:flex" />
      <Badge icon={ShieldCheck} tone="bg-[#1F6BFF]" label="Zəmanət izləmə" className="right-[2%] bottom-[10%] hidden sm:flex" />
    </div>
  );
}
