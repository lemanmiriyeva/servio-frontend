"use client";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Check } from "lucide-react";
import { DARK_BG } from "./Sections";
import type { SiteSettingsContent } from "@/lib/site-content";
import { api, ApiError } from "@/lib/api";

export function ContactForm({ settings }: { settings: SiteSettingsContent }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Sorğu birbaşa bazaya yazılır və Baş Adminin panelində "Müştəri sorğuları" bölməsinə düşür
  // (əvvəllər WhatsApp-da hazır mətnlə açılırdı — indi elə saytın özündən "Göndər").
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await api.submitContactInquiry({ full_name: name, phone, message });
      setSent(true);
      setName(""); setPhone(""); setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? "Göndərilmədi, bir az sonra yenidən cəhd edin." : "Gözlənilməz xəta baş verdi.");
    } finally {
      setSending(false);
    }
  }

  const items = [
    { icon: Mail, label: "E-poçt", value: settings.email, href: `mailto:${settings.email}` },
    { icon: Phone, label: "Telefon", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { icon: MapPin, label: "Ünvan", value: settings.address },
    { icon: Clock, label: "İş saatları", value: settings.hours },
  ];

  return (
      <>
        <section className={`${DARK_BG} text-white pt-[140px] pb-16`}>
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <div className="text-[13px] font-semibold tracking-[0.12em] text-[#3A85FF] uppercase">Əlaqə</div>
            <h1 className="mt-3 text-[34px] md:text-[48px] font-bold leading-tight tracking-tight">Pulsuz başlamaq üçün bizimlə əlaqə saxlayın</h1>
            <p className="mt-4 text-white/70 text-[17px] max-w-[620px]">Adınızı və nömrənizi yazın, sizinlə əlaqə saxlayıb hesabınızı açaq.</p>
          </div>
        </section>
        <section className="py-14 md:py-20">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col gap-4">
              {items.map((i) => (
                  <div key={i.label} className="flex items-center gap-4 rounded-2xl border border-[#DCE8FF] p-5">
                    <span className="w-12 h-12 rounded-xl bg-[#E3EFFF] text-[#116CFB] flex items-center justify-center flex-none"><i.icon size={22} /></span>
                    <div className="min-w-0">
                      <div className="text-xs text-[#3E4C6B]">{i.label}</div>
                      {i.href ? <a href={i.href} className="font-semibold hover:text-[#116CFB] break-all">{i.value}</a> : <div className="font-semibold">{i.value}</div>}
                    </div>
                  </div>
              ))}
            </div>
            <form onSubmit={send} className="rounded-2xl border border-[#DCE8FF] p-7 shadow-[0_8px_30px_rgba(16,40,100,0.06)] flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Mesaj göndərin</h2>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Ad, soyad
                <input required value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl border border-[#DCE8FF] px-4 outline-none focus:border-[#116CFB]" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Telefon
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 50 000 00 00" className="h-12 rounded-xl border border-[#DCE8FF] px-4 outline-none focus:border-[#116CFB]" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Mesaj
                <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Servisiniz haqqında qısa məlumat" className="rounded-xl border border-[#DCE8FF] px-4 py-3 outline-none focus:border-[#116CFB] resize-none" />
              </label>
              {error && <div className="text-sm rounded-xl px-4 py-2.5 bg-red-50 text-red-600">{error}</div>}
              {sent && (
                  <div className="text-sm rounded-xl px-4 py-2.5 bg-green-50 text-green-700 flex items-center gap-2">
                    <Check size={16} />Mesajınız göndərildi, tezliklə sizinlə əlaqə saxlayacağıq.
                  </div>
              )}
              <button type="submit" disabled={sending} className="h-12 rounded-xl bg-[#116CFB] hover:bg-[#3A85FF] text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <Send size={18} />{sending ? "Göndərilir…" : "Göndər"}
              </button>
            </form>
          </div>
        </section>
      </>
  );
}