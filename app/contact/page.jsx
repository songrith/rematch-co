"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ── แก้ข้อมูลติดต่อตรงนี้ ──
const CONTACT_EMAIL = "contact@rematch.th";
const CONTACT_PHONE = "086-000-0000";
const CONTACT_HOURS = "จันทร์ – ศุกร์  09:00 – 18:00";

export default function ContactPage() {
  const supabase = createClient();
  const [navUser, setNavUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setNavUser(user));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .contact-card:hover { border-color: #c7d2fe !important; box-shadow: 0 8px 32px rgba(99,102,241,.1) !important; transform: translateY(-3px); }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/shop" style={{ fontSize: 14, color: "#4b5563", textDecoration: "none", padding: "8px 14px", borderRadius: 8 }}>ร้านค้า</a>
          {navUser ? (
            <a href="/dashboard" style={{ fontSize: 13, color: "#374151", textDecoration: "none", padding: "8px 16px", borderRadius: 99, border: "1px solid #e5e7eb" }}>บัญชีของฉัน</a>
          ) : (
            <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none", padding: "8px 20px", borderRadius: 99, background: "#1e3a8a" }}>เข้าสู่ระบบ</a>
          )}
        </div>
      </nav>

      {/* Hero band */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8edf5", padding: "48px 48px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.3, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -60, right: -40, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,231,255,.7) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>ติดต่อเรา</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#0f172a", margin: "0 0 12px", letterSpacing: -0.8 }}>
            พร้อมช่วยเสมอ
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0, lineHeight: 1.7 }}>
            มีคำถามเรื่องสินค้า การชำระเงิน หรือ Escrow? ทีมงาน ReMatch พร้อมตอบทุกวัน
          </p>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 760, margin: "40px auto 80px", padding: "0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>

          {/* Email */}
          <a href={`mailto:${CONTACT_EMAIL}`}
            className="contact-card"
            style={{ display: "block", textDecoration: "none", background: "#fff", border: "1.5px solid #e4eaf3", borderRadius: 20, padding: "28px 28px", transition: "all 0.25s" }}>
            <div style={{ width: 48, height: 48, background: "#eef2ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>อีเมล</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{CONTACT_EMAIL}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>ตอบกลับภายใน 24 ชั่วโมง</div>
          </a>

          {/* Phone */}
          <a href={`tel:${CONTACT_PHONE.replace(/-/g, "")}`}
            className="contact-card"
            style={{ display: "block", textDecoration: "none", background: "#fff", border: "1.5px solid #e4eaf3", borderRadius: 20, padding: "28px 28px", transition: "all 0.25s" }}>
            <div style={{ width: 48, height: 48, background: "#f0fdf4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>โทรศัพท์</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{CONTACT_PHONE}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{CONTACT_HOURS}</div>
          </a>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <a href="/" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, transition: "color .2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}
