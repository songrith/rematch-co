"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";




export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── สมัครด้วย Email + Password ──
  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (form.password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },    // บันทึกชื่อเข้า profiles อัตโนมัติ
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(true); // แสดงข้อความให้ไปเช็คอีเมล
  }

  // ── สมัครด้วย Google ──
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

  if (success) return (
    <div style={styles.centerPage}>
      <div style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={styles.title}>เช็คอีเมลของคุณ!</h2>
        <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
          เราส่งลิงก์ยืนยันไปที่ <strong>{form.email}</strong><br />
          กดลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี
        </p>
      </div>
    </div>
  );

  return (
    <div style={styles.centerPage}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={styles.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></div>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>สร้างบัญชีใหม่</p>
        </div>

        {/* Google Button */}
        <button onClick={handleGoogleLogin} style={styles.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          สมัครด้วย Google
        </button>

        {/* Divider */}
        <div style={styles.divider}><span>หรือ</span></div>

        {/* Form */}
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={styles.label}>ชื่อ-นามสกุล</label>
            <input name="fullName" value={form.fullName} onChange={handleChange}
              placeholder="กรอกชื่อ-นามสกุล" required style={styles.input}
              onFocus={e => e.target.style.borderColor = "#1e3a8a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div>
            <label style={styles.label}>อีเมล</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="your@email.com" required style={styles.input}
              onFocus={e => e.target.style.borderColor = "#1e3a8a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div>
            <label style={styles.label}>รหัสผ่าน</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="อย่างน้อย 8 ตัวอักษร" required style={styles.input}
              onFocus={e => e.target.style.borderColor = "#1e3a8a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div>
            <label style={styles.label}>ยืนยันรหัสผ่าน</label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
              placeholder="พิมพ์รหัสผ่านอีกครั้ง" required style={styles.input}
              onFocus={e => e.target.style.borderColor = "#1e3a8a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          <button type="submit" disabled={loading} style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}>
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 20 }}>
          มีบัญชีแล้ว?{" "}
          <a href="/login" style={{ color: "#1e3a8a", fontWeight: 600, textDecoration: "none" }}>เข้าสู่ระบบ</a>
        </p>
      </div>
    </div>
  );
}
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
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22, fontWeight: 900, color: "#0f0f0e", marginBottom: 8,
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
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
    cursor: "pointer", transition: "all 0.2s",
  },
  divider: {
    display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
    color: "#d1d5db", fontSize: 13,
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13,
  },
  primaryBtn: {
    width: "100%", padding: "13px",
    background: "#1e3a8a", color: "#fff",
    border: "none", borderRadius: 99, fontSize: 15, fontWeight: 700,
    cursor: "pointer", transition: "background 0.2s, transform 0.15s",
    marginTop: 4,
  },
};