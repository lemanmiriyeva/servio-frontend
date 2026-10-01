"use client";
import { useState } from "react";
import { User, Lock, Eye, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/site/Logo";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      // Backend mağaza bağlı olduqda ("planın vaxtı bitib" və s.) dəqiq səbəbi
      // non_field_errors ilə qaytarır — onu olduğu kimi göstəririk; əks halda
      // ümumi "yanlış" mesajı (istifadəçi adı/şifrə ayrı-ayrı doğrulanmasın deyə).
      const detail =
          err instanceof ApiError &&
          err.data && typeof err.data === "object" && "non_field_errors" in (err.data as Record<string, unknown>)
              ? (err.data as { non_field_errors: string[] }).non_field_errors[0]
              : null;
      setError(detail || "İstifadəçi adı və ya şifrə yanlışdır.");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#D3D8DB] p-4">
        <div className="w-full max-w-[1440px] rounded-[20px] overflow-hidden flex bg-white shadow-2xl min-h-[640px] md:min-h-[760px]">
          {/* Left panel */}
          <div className="hidden md:flex w-[46%] flex-none bg-side text-white relative overflow-hidden p-10 lg:p-14 flex-col justify-between">
            <svg className="absolute left-16 top-0 opacity-80 pointer-events-none" width="420" height="760" viewBox="0 0 560 900" fill="none">
              <path d="M0 140 H150 L210 200 H420" stroke="rgba(17,108,251,.55)" strokeWidth="2" />
              <circle cx="420" cy="200" r="7" stroke="rgba(17,108,251,.55)" strokeWidth="2" />
              <path d="M0 230 H80 L140 290 H300 L360 350 H560" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
              <path d="M0 640 H120 L180 580 H360 L420 640 H560" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
              <path d="M0 730 H200 L260 790 H440" stroke="rgba(17,108,251,.4)" strokeWidth="2" />
            </svg>

            <div className="relative z-10 flex items-center">
              <div className="bg-white rounded-xl px-3 py-1.5 inline-flex w-fit"><Logo height={40} /></div>
            </div>

            <div className="relative z-10 flex flex-col gap-5">
              <h2 className="text-[38px] lg:text-[44px] font-semibold leading-[1.1] tracking-tight max-w-[480px]">
                Ustanın masası, bir ekranda.
              </h2>
              <p className="text-[#A9BEC5] text-base max-w-[420px]">
                Müştəri, təmir, maya, qazanc və zəmanət eyni yerdə. Telefonda da, kompüterdə də.
              </p>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="flex-1 flex items-center justify-center bg-bg px-6 py-12">
            <form onSubmit={handleSubmit} className="w-full max-w-[400px] flex flex-col gap-5">
              <div className="md:hidden flex items-center mb-2">
                <Logo height={36} />
              </div>

              <div>
                <h1 className="text-[28px] md:text-[30px] font-semibold tracking-tight">Hesaba daxil ol</h1>
                <p className="text-ink2 mt-1.5 text-sm">Yalnız öz servisinizin məlumatları göstərilir.</p>
              </div>

              <div className="fld">
                <label>Login</label>
                <div className="inp">
                  <User size={18} className="text-muted flex-none" />
                  <input
                      className="pl"
                      placeholder="elvin.techfix"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                  />
                </div>
                <span className="mut text-xs">
                Format: istifadəçi adı.mağaza kodu — hər mağaza öz məlumatına ayrıca giriş əldə edir
              </span>
              </div>

              <div className="fld">
                <label>Şifrə</label>
                <div className="inp">
                  <Lock size={18} className="text-muted flex-none" />
                  <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="ml-auto text-muted flex-none"
                      tabIndex={-1}
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              {error && (
                  <div className="text-sm rounded-lg px-3 py-2" style={{ background: "var(--red-s)", color: "var(--red)" }}>
                    {error}
                  </div>
              )}

              <div className="flex justify-between items-center text-[13px]">
                <button
                    type="button"
                    onClick={() => setRemember((r) => !r)}
                    className="flex gap-2 items-center text-ink2 font-medium"
                >
                <span
                    className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-none"
                    style={{
                      background: remember ? "var(--brand)" : "#fff",
                      color: "var(--brand-ink)",
                      border: remember ? "none" : "1px solid var(--line)",
                    }}
                >
                  {remember && <Check size={13} strokeWidth={3} />}
                </span>
                  Məni xatırla
                </button>
                <button
                    type="button"
                    onClick={() => setShowForgot((s) => !s)}
                    className="link cursor-pointer"
                    style={{ color: "var(--blue)" }}
                >
                  Şifrəni unutmusan?
                </button>
              </div>

              {showForgot && (
                  <div className="text-sm rounded-lg px-3 py-2.5 bg-[#F3F6FB] text-ink2 leading-relaxed">
                    Şifrənizi özünüz sıfırlaya bilmirsiniz — mağazanızın administratoru (Sahib) və ya
                    Platforma admini sizin üçün yeni şifrə təyin edə bilər: <b>Platforma → İstifadəçilər</b>{" "}
                    bölməsindən adınızı tapıb yeni şifrə yazmaq kifayətdir.
                  </div>
              )}

              <button type="submit" className="btn pri block" disabled={loading}>
                <span>{loading ? "Daxil olunur…" : "Daxil ol"}</span>
              </button>

              <div className="text-center text-muted text-[13px]">
                Hesabınız yoxdursa, administratorla əlaqə saxlayın
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}