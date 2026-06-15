"use client";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }, [searchParams]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (error) {
      if (error.message?.toLowerCase().includes("email not confirmed")) {
        setError("กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ — เช็คกล่องจดหมายของคุณ");
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
      return;
    }
    router.push("/");
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div style={styles.centerPage}>
      <div style={styles.card}>

        {/* ── Logo ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={styles.logo}>
            Re<span style={{ color: "#1e3a8a" }}>Match</span>
          </div>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>
            เข้าสู่ระบบเพื่อดำเนินการต่อ
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={styles.label}>อีเมล</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              style={styles.input}
              onFocus={e => e.target.style.borderColor = "#1e3a8a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ ...styles.label, marginBottom: 0 }}>รหัสผ่าน</label>
              <a href="/forgot-password" style={{ fontSize: 12, color: "#1e3a8a", textDecoration: "none", fontWeight: 500 }}>
                ลืมรหัสผ่าน?
              </a>
            </div>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="รหัสผ่านของคุณ"
              required
              style={styles.input}
              onFocus={e => e.target.style.borderColor = "#1e3a8a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1e3a8a"; }}
            onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* ── Divider ── */}
        <div style={styles.divider}>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ color: "#9ca3af", fontSize: 12, padding: "0 12px" }}>หรือ</span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        {/* ── Google Button ── */}
        <button
          onClick={handleGoogleLogin}
          style={styles.googleBtn}
          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>

        {/* ── Register Link ── */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 24 }}>
          ยังไม่มีบัญชี?{" "}
          <a href="/register" style={{ color: "#1e3a8a", fontWeight: 600, textDecoration: "none" }}>
            สมัครสมาชิกฟรี
          </a>
        </p>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = {
  centerPage: {
    minHeight: "100vh", background: "#f1f5f9",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 20px", fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: "#fff", borderRadius: 20,
    border: "1px solid #e2e8f0",
    padding: "40px 36px", width: "100%", maxWidth: 440,
    boxShadow: "0 4px 24px rgba(0,0,0,.06)",
  },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 26, fontWeight: 900, letterSpacing: -0.5,
  },
  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "#374151", marginBottom: 6,
  },
  input: {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1px solid #e5e7eb", fontSize: 14, color: "#0f0f0e",
    outline: "none", transition: "border-color 0.2s", background: "#fafafa",
    boxSizing: "border-box",
  },
  googleBtn: {
    width: "100%", padding: "12px", borderRadius: 10,
    border: "1px solid #e5e7eb", background: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    fontSize: 14, fontWeight: 600, color: "#374151",
    cursor: "pointer", transition: "background 0.2s",
  },
  divider: {
    display: "flex", alignItems: "center", margin: "20px 0",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13,
  },
  primaryBtn: {
    width: "100%", padding: "13px",
    background: "#1e3a8a", color: "#fff",
    border: "none", borderRadius: 99, fontSize: 15, fontWeight: 700,
    cursor: "pointer", transition: "background 0.2s",
    marginTop: 4,
  },
};