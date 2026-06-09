"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import MobileNav from "@/app/components/MobileNav";

/* ─── Navbar ─── */
function Navbar() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
        setProfile(data);
        const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
        setUnread(count || 0);
      }
    }
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("full_name, role").eq("id", session.user.id).single();
        setProfile(data);
      } else { setProfile(null); setUnread(0); }
    });
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => { subscription.unsubscribe(); window.removeEventListener("scroll", onScroll); };
  }, []);

  const onDark = !scrolled;
  const ink = onDark ? "rgba(255,255,255,0.75)" : "#475569";
  const inkHover = onDark ? "#fff" : "#0f172a";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      height: 68,
      background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? "1px solid #e2e8f0" : "none",
      boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,.06)" : "none",
      transition: "all 0.3s ease",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 max(48px, calc((100vw - 1200px)/2 + 48px))",
    }} className="rm-nav">
      <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, background: onDark ? "rgba(255,255,255,.1)" : "#1e3a8a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: onDark ? "1px solid rgba(255,255,255,.15)" : "none", transition: "all 0.3s" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: onDark ? "#fff" : "#0f172a", letterSpacing: -0.3, transition: "color 0.3s" }}>
          Re<span style={{ color: onDark ? "#93c5fd" : "#1e3a8a" }}>Match</span>
        </span>
      </a>

      <div className="rm-nav-links" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[["เสื้อบอล", "/shop?cat=football"], ["เสื้อบาส", "/shop?cat=basketball"], ["Retro", "/shop?cat=retro"], ["ปล่อยของ", "/seller/terms"]].map(([l, href]) => (
          <a key={l} href={href} style={{ fontSize: 14, fontWeight: 500, color: ink, textDecoration: "none", padding: "6px 12px", borderRadius: 8, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = inkHover; if (!onDark) e.currentTarget.style.background = "#f1f5f9"; }}
            onMouseLeave={e => { e.currentTarget.style.color = ink; e.currentTarget.style.background = "transparent"; }}>{l}</a>
        ))}
      </div>

      {/* Hamburger — mobile only */}
      <button className="rm-hamburger" onClick={() => setMenuOpen(true)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: ink, alignItems: "center", justifyContent: "center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} profile={profile} showCategories={true} />

      {/* Desktop nav */}
      <div className="rm-nav-links" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user ? (
          <>
            {profile?.role === "admin" && <a href="/admin" className="rm-nav-hide" style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed", textDecoration: "none", padding: "7px 14px", border: "1px solid #ede9fe", borderRadius: 8 }}>Admin</a>}
            {profile?.role === "seller" && <a href="/seller/dashboard" className="rm-nav-hide" style={{ fontSize: 13, fontWeight: 600, color: ink, textDecoration: "none", padding: "7px 14px", border: `1px solid ${onDark ? "rgba(255,255,255,.15)" : "#e2e8f0"}`, borderRadius: 8 }}>Dashboard</a>}
            <a href="/orders" className="rm-nav-hide" style={{ fontSize: 13, fontWeight: 500, color: ink, textDecoration: "none", padding: "7px 14px", borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.color = inkHover}
              onMouseLeave={e => e.currentTarget.style.color = ink}>คำสั่งซื้อ</a>
            <a href="/notifications" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, color: ink, textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unread > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#dc2626", color: "#fff", borderRadius: "50%", fontSize: 9, fontWeight: 700, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread > 9 ? "9+" : unread}</span>}
            </a>
            <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: ink, textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: `1px solid ${onDark ? "rgba(255,255,255,.15)" : "#e2e8f0"}`, transition: "all 0.15s" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: onDark ? "rgba(255,255,255,.15)" : "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {(profile?.full_name || user.email || "?")[0].toUpperCase()}
              </div>
              <span className="rm-nav-name">{profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}</span>
            </a>
            <button className="rm-nav-hide" onClick={async () => { try { await supabase.auth.signOut(); } catch {} window.location.reload(); }}
              style={{ fontSize: 13, color: ink, background: "none", border: "none", cursor: "pointer", padding: "7px 10px", borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
              onMouseLeave={e => e.currentTarget.style.color = ink}>ออก</button>
          </>
        ) : (
          <>
            <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: ink, textDecoration: "none", padding: "8px 16px", borderRadius: 8, border: `1px solid ${onDark ? "rgba(255,255,255,.2)" : "#e2e8f0"}`, transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = inkHover}
              onMouseLeave={e => e.currentTarget.style.color = ink}>เข้าสู่ระบบ</a>
            <a href="/register" style={{ fontSize: 14, fontWeight: 600, color: onDark ? "#0f172a" : "#fff", textDecoration: "none", padding: "8px 20px", borderRadius: 8, background: onDark ? "#fff" : "#1e3a8a", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>สมัครสมาชิก</a>
          </>
        )}
      </div>
    </nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section style={{
      position: "relative", overflow: "hidden", paddingTop: 68,
      background: "#06091a",
      minHeight: "100vh", display: "flex", alignItems: "center",
    }}>
      {/* Gradient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "55%", height: "80%", background: "radial-gradient(ellipse, rgba(99,102,241,.18) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "50%", height: "70%", background: "radial-gradient(ellipse, rgba(30,58,138,.25) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "30%", left: "40%", width: "30%", height: "40%", background: "radial-gradient(ellipse, rgba(139,92,246,.08) 0%, transparent 65%)", borderRadius: "50%" }} />
        {/* Subtle grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)", backgroundSize: "64px 64px", opacity: 0.6 }} />
      </div>

      <div className="rm-hero-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 48px 96px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>

        {/* Left */}
        <div style={{ animation: "fadeUp 0.7s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(99,102,241,.15)", color: "#a5b4fc", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 99, marginBottom: 28, border: "1px solid rgba(99,102,241,.25)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ของแท้ 100% · ยืนยันทุกชิ้นโดย Admin
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(38px,4.8vw,62px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: -2, color: "#fff", margin: "0 0 22px" }}>
            ตลาดซื้อขาย<br />
            <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              เสื้อกีฬาของแท้
            </span><br />
            ที่ไว้วางใจได้
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,.5)", margin: "0 0 36px", maxWidth: 420 }}>
            Seller ทุกคนผ่าน KYC · เงินถูกกักไว้ใน Escrow จนกว่าคุณจะได้ของจริง · คืนเงินเต็มหากสินค้าไม่ตรงปก
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 24px rgba(99,102,241,.45)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(99,102,241,.45)"; }}>
              เลือกซื้อสินค้า
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#how" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.6)", fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "13px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.3)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.6)"; }}>
              วิธีการทำงาน
            </a>
          </div>

          {/* Guarantees */}
          <div style={{ marginTop: 52, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", gap: 28, flexWrap: "wrap" }}>
            {[
              { icon: "🔒", title: "Escrow ทุกออเดอร์", sub: "เงินปลอดภัย 100%" },
              { icon: "🪪", title: "KYC ทุก Seller",   sub: "ยืนยันตัวตนก่อนขาย" },
              { icon: "💸", title: "คืนเงินเต็ม",      sub: "ถ้าสินค้าไม่ตรงปก" },
            ].map(({ icon, title, sub }) => (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — product showcase */}
        <div className="rm-hero-right" style={{ position: "relative", paddingBottom: 40, animation: "fadeIn 0.8s 0.2s ease both" }}>

          {/* Glow ring behind main card */}
          <div style={{ position: "absolute", inset: -20, background: "radial-gradient(ellipse, rgba(99,102,241,.2) 0%, transparent 70%)", borderRadius: 32, pointerEvents: "none" }} />

          {/* Main card */}
          <div style={{ background: "linear-gradient(145deg, #0f172a 0%, #131e35 100%)", borderRadius: 20, padding: 24, position: "relative", overflow: "hidden", border: "1px solid rgba(99,102,241,.25)", boxShadow: "0 0 0 1px rgba(255,255,255,.04), 0 24px 64px rgba(0,0,0,.5)" }}>
            {/* Shine effect */}
            <div style={{ position: "absolute", top: -1, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>🏆 ขายดีอันดับ 1</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Real Madrid Home 24/25</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 3 }}>Adidas · Size M · La Liga</div>
              </div>
              <div style={{ background: "linear-gradient(135deg, #15803d, #16a34a)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, boxShadow: "0 2px 8px rgba(21,128,61,.4)" }}>Grade S</div>
            </div>

            <div style={{ background: "linear-gradient(145deg, #1e293b, #0f172a)", borderRadius: 14, height: 150, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, border: "1px solid rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,.08), transparent 70%)" }} />
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.25)" strokeWidth="0.8"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontWeight: 600, marginBottom: 2 }}>ราคา</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>฿3,200</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,.12)", color: "#a5b4fc", fontSize: 11, fontWeight: 600, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,.2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                KYC Verified
              </div>
            </div>
          </div>

          {/* Mini cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            {[
              { name: "Lakers #23 LeBron", league: "NBA · Size L", price: "฿2,800", grade: "A", gradeBg: "#dbeafe", gradeText: "#1e3a8a" },
              { name: "Man City 3rd 23/24", league: "EPL · Size M", price: "฿2,400", grade: "S", gradeBg: "#dcfce7", gradeText: "#15803d" },
            ].map(p => (
              <div key={p.name} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: "14px", backdropFilter: "blur(4px)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ position: "relative", background: "rgba(255,255,255,.04)", borderRadius: 10, height: 64, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                  <span style={{ position: "absolute", top: 5, right: 5, background: p.gradeBg, color: p.gradeText, fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 99 }}>Grade {p.grade}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{p.league}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#93c5fd" }}>{p.price}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#4ade80", display: "flex", alignItems: "center", gap: 3 }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Escrow
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Floating badges */}
          <div style={{ position: "absolute", top: -14, right: -16, background: "rgba(255,255,255,.95)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#0f172a", boxShadow: "0 8px 32px rgba(0,0,0,.3)", display: "flex", alignItems: "center", gap: 7, animation: "float 3s ease-in-out infinite", backdropFilter: "blur(8px)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Escrow Protected
          </div>
          <div style={{ position: "absolute", bottom: 56, left: -20, background: "rgba(255,255,255,.95)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#0f172a", boxShadow: "0 8px 32px rgba(0,0,0,.3)", display: "flex", alignItems: "center", gap: 7, animation: "float 3s 1.5s ease-in-out infinite", backdropFilter: "blur(8px)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            KYC Verified Seller
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Scrolling trust marquee ─── */
function TrustBar() {
  const items = [
    "✓  Seller ยืนยัน KYC ทุกคน",
    "🔒  Escrow คุ้มครองทุกออเดอร์",
    "↩  คืนเงิน 100% ถ้าไม่ตรงปก",
    "🚚  จัดส่งภายใน 48 ชั่วโมง",
    "✓  Admin ตรวจสอบสินค้าทุกชิ้น",
    "⭐  4.9 / 5 คะแนนเฉลี่ยจากผู้ซื้อ",
  ];
  const repeated = [...items, ...items];

  return (
    <div style={{ background: "#0f172a", borderTop: "1px solid rgba(255,255,255,.06)", overflow: "hidden", padding: "14px 0" }}>
      <div style={{ display: "flex", animation: "marquee 28s linear infinite", width: "max-content" }}>
        {repeated.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 32, padding: "0 48px", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.5)" }}>{t}</span>
            <span style={{ color: "rgba(255,255,255,.12)", fontSize: 16 }}>·</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { icon: "🔍", num: "01", title: "เลือกและสั่งซื้อ", desc: "เลือกสินค้าจาก Seller ที่ผ่าน KYC แล้ว ทุกรายการผ่านการตรวจสอบโดย Admin", accent: "#3b82f6" },
    { icon: "🔒", num: "02", title: "ชำระผ่าน Escrow", desc: "เงินถูกเก็บไว้อย่างปลอดภัย Seller จะได้รับเงินเมื่อคุณยืนยันว่าได้รับสินค้าแล้ว", accent: "#6366f1" },
    { icon: "✅", num: "03", title: "ยืนยันและรีวิว", desc: "ตรวจสอบสินค้าที่ได้รับ กดยืนยัน เงินปล่อยให้ Seller ทันที มีปัญหา ReMatch ช่วยทุกขั้นตอน", accent: "#8b5cf6" },
  ];
  return (
    <section id="how" style={{ background: "#fff" }}>
      <div className="rm-sec" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>วิธีการทำงาน</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -1 }}>
            ซื้อง่าย ปลอดภัย ใน 3 ขั้นตอน
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", marginTop: 14, maxWidth: 480, margin: "14px auto 0" }}>ระบบ Escrow ของเราทำให้การซื้อขายเสื้อกีฬาของแท้เป็นเรื่องง่ายและปลอดภัยสำหรับทุกคน</p>
        </div>
        <div className="rm-g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 20, padding: "36px 28px", position: "relative", overflow: "hidden", transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,.06)`; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ position: "absolute", top: 16, right: 20, fontFamily: "'Playfair Display', serif", fontSize: 80, fontWeight: 900, color: "#f8fafc", lineHeight: 1, userSelect: "none" }}>{s.num}</div>
              <div style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${s.accent}18, ${s.accent}08)`, border: `1px solid ${s.accent}20`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, fontSize: 24 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.75, color: "#64748b" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Why ReMatch ─── */
function WhyUs() {
  const features = [
    { icon: "🛡️", title: "KYC ทุกคน", desc: "Seller ต้องยืนยันบัตรประชาชน + Selfie ก่อนลงขาย ไม่มีมือสองปลอมแน่นอน", color: "#3b82f6" },
    { icon: "💰", title: "Escrow ปลอดภัย", desc: "เงินค้างระบบจนกว่าคุณจะยืนยันรับของ ไม่มีทางโดนโกงแน่นอน", color: "#6366f1" },
    { icon: "🎽", title: "Admin ตรวจสินค้า", desc: "ทีมงาน ReMatch ตรวจสอบรูปและเอกสารความแท้ก่อนอนุมัติทุกรายการ", color: "#8b5cf6" },
    { icon: "💬", title: "แชทกับ Seller ได้เลย", desc: "ถามข้อมูลสินค้า ต่อรองราคา หรือขอรูปเพิ่มเติมได้โดยตรง", color: "#06b6d4" },
  ];
  return (
    <section style={{ background: "#f8fafc" }}>
      <div className="rm-sec" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>ทำไมต้อง ReMatch</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -1 }}>มาตรฐานความปลอดภัยระดับพรีเมียม</h2>
        </div>
        <div className="rm-g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ padding: "28px 24px", borderRadius: 16, border: "1px solid #e2e8f0", transition: "all 0.25s", background: "#fff" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + "40"; e.currentTarget.style.boxShadow = `0 12px 32px ${f.color}12`; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 48, height: 48, background: f.color + "12", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.75, color: "#64748b" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Seller CTA ─── */
function SellerCTA() {
  return (
    <section style={{ background: "#fff" }}>
      <div className="rm-sec-b" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 100px" }}>
        <div className="rm-g2" style={{ background: "linear-gradient(135deg, #060d1e 0%, #0f172a 100%)", borderRadius: 24, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative" }}>
          <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, background: "radial-gradient(circle, rgba(99,102,241,.15), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, right: 100, width: 300, height: 300, background: "radial-gradient(circle, rgba(139,92,246,.1), transparent 70%)", pointerEvents: "none" }} />

          {/* Left */}
          <div className="rm-cta-left" style={{ padding: "64px 56px", position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>สำหรับผู้ขาย</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15, letterSpacing: -0.5 }}>
              มีเสื้อกีฬา<br />ของแท้อยู่?
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.45)", lineHeight: 1.75, margin: "0 0 36px" }}>ไม่ต้องมีหน้าร้าน ลงขายง่าย ได้เงินเร็ว ค่าธรรมเนียมแค่ 10%</p>
            <a href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#0f172a", padding: "13px 26px", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.3)"; }}>
              เริ่มขายเลย
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          {/* Right */}
          <div className="rm-cta-right" style={{ padding: "64px 56px 64px 40px", borderLeft: "1px solid rgba(255,255,255,.06)", position: "relative" }}>
            {[
              ["01", "สมัครและยืนยัน KYC", "รูปบัตร ปชช. + Selfie ใช้เวลา 5 นาที"],
              ["02", "ลงรายการสินค้า", "ถ่ายรูป ใส่ราคา รอ Admin อนุมัติใน 24 ชม."],
              ["03", "รับออเดอร์ ส่งของ รับเงิน", "หักค่าธรรมเนียม 10% โอนเข้าบัญชีทันที"],
            ].map(([n, t, s]) => (
              <div key={n} style={{ display: "flex", gap: 16, marginBottom: 28 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.4)", flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{t}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer style={{ background: "#060d1e", borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div className="rm-footer-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 48px 32px" }}>
        <div className="rm-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div className="rm-footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, background: "rgba(255,255,255,.08)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.1)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
              </div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 900, color: "#fff" }}>Re<span style={{ color: "#93c5fd" }}>Match</span></span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", lineHeight: 1.75, maxWidth: 240, margin: 0 }}>ตลาดซื้อขายเสื้อกีฬาของแท้ที่ปลอดภัยที่สุดในไทย ด้วยระบบ Escrow และ KYC</p>
          </div>
          {[
            ["สินค้า", [["เสื้อบอล", "/shop?cat=football"], ["เสื้อบาส", "/shop?cat=basketball"], ["Retro Jersey", "/shop?cat=retro"], ["ดูทั้งหมด", "/shop"]]],
            ["บัญชี", [["เข้าสู่ระบบ", "/login"], ["สมัครสมาชิก", "/register"], ["คำสั่งซื้อ", "/orders"], ["สมัคร Seller", "/seller/terms"]]],
            ["บริษัท", [["นโยบายความเป็นส่วนตัว", "/privacy"], ["ข้อกำหนดการใช้", "/terms-of-service"], ["ติดต่อเรา", "/contact"]]],
          ].map(([title, links]) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>{title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(([l, href]) => (
                  <a key={l} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,.3)", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => e.target.style.color = "#93c5fd"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.3)"}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.2)", margin: 0 }}>© 2025 ReMatch Technologies Co., Ltd. · All rights reserved.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.2)", margin: 0 }}>Made with ❤️ in Thailand</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Home ─── */
export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; color: #0f172a; overflow-x: hidden; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
      <Navbar />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <WhyUs />
      <SellerCTA />
      <Footer />
    </>
  );
}
