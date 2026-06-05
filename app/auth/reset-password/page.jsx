"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // also check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) { setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirm) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/"), 2500);
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Sarabun:wght@400;500;600;700&display=swap');`}</style>
      <div style={S.card}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={S.title}>เปลี่ยนรหัสผ่านแล้ว!</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>กำลังพาไปหน้าหลัก...</p>
          </div>
        ) : (
          <>
            <h2 style={S.title}>ตั้งรหัสผ่านใหม่</h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>กรอกรหัสผ่านใหม่ที่ต้องการใช้</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={S.label}>รหัสผ่านใหม่</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร" required style={S.input}
                  onFocus={e => e.target.style.borderColor = "#1e3a8a"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={S.label}>ยืนยันรหัสผ่านใหม่</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง" required style={S.input}
                  onFocus={e => e.target.style.borderColor = "#1e3a8a"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              {error && <div style={S.errorBox}>⚠️ {error}</div>}
              <button type="submit" disabled={loading || !ready}
                style={{ ...S.btn, border: "none", cursor: (loading || !ready) ? "default" : "pointer", opacity: (loading || !ready) ? 0.7 : 1 }}>
                {loading ? "กำลังบันทึก..." : !ready ? "กำลังโหลด..." : "บันทึกรหัสผ่านใหม่"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  page:     { minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Sarabun', sans-serif" },
  card:     { background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,.06)" },
  logo:     { display: "block", textAlign: "center", fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "#0f0f0e", textDecoration: "none", marginBottom: 28 },
  title:    { fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: "#0f0f0e", margin: "0 0 8px" },
  label:    { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input:    { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fafafa", boxSizing: "border-box", transition: "border-color 0.2s", fontFamily: "'Sarabun', sans-serif" },
  btn:      { display: "block", width: "100%", padding: "13px", background: "#1e3a8a", color: "#fff", borderRadius: 99, fontSize: 15, fontWeight: 700, textAlign: "center", textDecoration: "none" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
};
