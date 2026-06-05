"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div style={S.card}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
            <h2 style={S.title}>เช็คอีเมลของคุณ</h2>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
              ส่งลิงก์รีเซ็ตรหัสผ่านไปที่<br />
              <strong style={{ color: "#0f0f0e" }}>{email}</strong> แล้ว<br />
              กรุณาคลิกลิงก์ในอีเมลเพื่อตั้งรหัสผ่านใหม่
            </p>
            <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 20 }}>ไม่เจออีเมล? เช็คในโฟลเดอร์ Spam</p>
            <button onClick={() => setSent(false)}
              style={{ background: "none", border: "none", color: "#1e3a8a", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              ส่งอีกครั้ง
            </button>
          </div>
        ) : (
          <>
            <h2 style={S.title}>ลืมรหัสผ่าน?</h2>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={S.label}>อีเมล</label>
                <input
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={S.input}
                  onFocus={e => e.target.style.borderColor = "#1e3a8a"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
              {error && <div style={S.errorBox}>⚠️ {error}</div>}
              <button type="submit" disabled={loading}
                style={{ ...S.btn, opacity: loading ? 0.7 : 1, cursor: loading ? "default" : "pointer" }}>
                {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <a href="/login" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                ← กลับหน้าเข้าสู่ระบบ
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  page:     { minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" },
  card:     { background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "40px 36px", width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,.06)" },
  logo:     { display: "block", textAlign: "center", fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "#0f0f0e", textDecoration: "none", marginBottom: 28 },
  title:    { fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: "#0f0f0e", margin: "0 0 8px" },
  label:    { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input:    { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fafafa", boxSizing: "border-box", transition: "border-color 0.2s", fontFamily: "'DM Sans', sans-serif" },
  btn:      { width: "100%", padding: "13px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 99, fontSize: 15, fontWeight: 700 },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
};
