"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import MobileNav from "@/app/components/MobileNav";
import { useLang } from "@/app/context/language";
import LanguageToggle from "@/app/components/LanguageToggle";
import i18n from "@/app/i18n";

/* ─── Navbar ─── */
function Navbar() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [unread, setUnread] = useState(0);
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
    return () => { subscription.unsubscribe(); };
  }, []);

  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
  const isAdmin = profile?.role === "admin" || (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim()).includes(user?.email);

  const ink      = "#374151";
  const divColor = "#e2e8f0";

  const lnk = (extra = {}) => ({
    fontSize: 13.5, fontWeight: 500, color: ink, textDecoration: "none",
    padding: "5px 12px", borderRadius: 8, transition: "all 0.15s", whiteSpace: "nowrap",
    ...extra,
  });
  const onL  = e => { e.currentTarget.style.color = "#0f172a"; e.currentTarget.style.background = "#f1f5f9"; };
  const offL = e => { e.currentTarget.style.color = ink; e.currentTarget.style.background = "transparent"; };

  return (
    <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200, width: "min(calc(100vw - 32px), 1160px)" }}>
      <nav style={{
        height: 52,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid rgba(226,232,240,0.9)",
        borderRadius: 14,
        boxShadow: "0 4px 24px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04)",
        display: "flex", alignItems: "center",
        padding: "0 16px",
        gap: 4,
      }}>

        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0, marginRight: 8 }}>
          <img src="/favicon.ico" alt="" width="26" height="26" style={{ borderRadius: 7, display: "block" }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>
            Re<span style={{ color: "#1e3a8a" }}>Match</span>
          </span>
        </a>

        {/* Separator */}
        <div className="rm-nav-links" style={{ width: 1, height: 16, background: divColor, flexShrink: 0, margin: "0 6px" }} />

        {/* Category links */}
        <div className="rm-nav-links" style={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          {[[t("navCatFootball"), "/shop?cat=football"], [t("navCatBasketball"), "/shop?cat=basketball"], [t("navCatRetro"), "/shop?cat=retro"], [t("navCatSell"), "/seller/terms"]].map(([l, href]) => (
            <a key={href} href={href} style={lnk()} onMouseEnter={onL} onMouseLeave={offL}>{l}</a>
          ))}
        </div>

        {/* Spacer */}
        <div className="rm-nav-links" style={{ flex: 1 }} />

        {/* Right user actions */}
        <div className="rm-nav-links" style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {user ? (
            <>
              {isAdmin && (
                <a href="/admin" style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", padding: "4px 10px", border: "1px solid #ede9fe", borderRadius: 7, textDecoration: "none", background: "#faf5ff", whiteSpace: "nowrap" }}>Admin</a>
              )}
              {profile?.role === "seller" && (
                <a href="/seller/dashboard" style={lnk()} onMouseEnter={onL} onMouseLeave={offL}>{t("navDashboard")}</a>
              )}
              <a href="/orders" style={lnk()} onMouseEnter={onL} onMouseLeave={offL}>{t("navOrders")}</a>

              {/* Bell */}
              <a href="/notifications" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, color: ink, textDecoration: "none", transition: "background 0.15s", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = scrolled ? "#f1f5f9" : "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unread > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "#fff", borderRadius: "50%", fontSize: 8, fontWeight: 700, width: 13, height: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread > 9 ? "9+" : unread}</span>}
              </a>

              {/* Divider */}
              <div style={{ width: 1, height: 16, background: divColor, margin: "0 4px", flexShrink: 0 }} />

              {/* Avatar pill */}
              <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", padding: "4px 10px 4px 4px", borderRadius: 99, border: "1px solid #e2e8f0", background: "#f8fafc", transition: "all 0.15s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {(profile?.full_name || user.email || "?")[0].toUpperCase()}
                </div>
                <span className="rm-nav-name" style={{ fontSize: 13, fontWeight: 500, color: ink }}>{profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}</span>
              </a>

              <button onClick={async () => { try { await supabase.auth.signOut({ scope: "local" }); } catch {} window.location.href = "/"; }}
                style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: "5px 8px", borderRadius: 7, transition: "color 0.15s", whiteSpace: "nowrap" }}
                onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
                {t("navLogout")}
              </button>
            </>
          ) : (
            <>
              <a href="/login" style={lnk({ border: "1px solid #e2e8f0", padding: "6px 15px" })} onMouseEnter={onL} onMouseLeave={offL}>{t("navLogin")}</a>
              <a href="/register" style={{ fontSize: 13.5, fontWeight: 600, color: "#fff", textDecoration: "none", padding: "6px 16px", borderRadius: 8, background: "#1e3a8a", transition: "opacity 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{t("navRegister")}</a>
            </>
          )}
          <LanguageToggle />
        </div>

        {/* Hamburger (mobile) */}
        <button className="rm-hamburger" onClick={() => setMenuOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: ink, alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} profile={profile} showCategories={true} />
      </nav>
    </div>
  );
}

/* ─── Hero ─── */
function Hero() {
  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
  const guarantees = [
    { icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: t("heroEscrowTitle"), sub: t("heroEscrowSub") },
    { icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, title: t("heroVerifiedTitle"), sub: t("heroVerifiedSub") },
    { icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, title: t("heroReturnTitle"), sub: t("heroReturnSub") },
  ];
  return (
    <section style={{
      position: "relative", overflow: "hidden", paddingTop: 80,
      background: "#06091a",
      minHeight: "100vh", display: "flex", alignItems: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "55%", height: "80%", background: "radial-gradient(ellipse, rgba(99,102,241,.18) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "50%", height: "70%", background: "radial-gradient(ellipse, rgba(30,58,138,.25) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "30%", left: "40%", width: "30%", height: "40%", background: "radial-gradient(ellipse, rgba(139,92,246,.08) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)", backgroundSize: "64px 64px", opacity: 0.6 }} />
      </div>

      <div className="rm-hero-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 48px 96px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{ animation: "fadeUp 0.7s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(99,102,241,.15)", color: "#a5b4fc", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 99, marginBottom: 28, border: "1px solid rgba(99,102,241,.25)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {t("heroPill")}
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px,5vw,66px)", fontWeight: 500, lineHeight: 1.1, letterSpacing: -1, color: "#fff", margin: "0 0 22px" }}>
            {t("heroLine1")}<br />
            <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("heroLine2")}
            </span>
            {t("heroLine3") && <><br />{t("heroLine3")}</>}
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,.5)", margin: "0 0 36px", maxWidth: 420 }}>
            {t("heroDesc")}
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 24px rgba(99,102,241,.45)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(99,102,241,.45)"; }}>
              {t("heroCTAShop")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#how" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.6)", fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "13px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.3)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.6)"; }}>
              {t("heroCTAHow")}
            </a>
          </div>

          <div style={{ marginTop: 52, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", gap: 28, flexWrap: "wrap" }}>
            {guarantees.map(({ icon, title, sub }) => (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.7)", flexShrink: 0 }}>{icon}</div>
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
          <div style={{ position: "absolute", inset: -20, background: "radial-gradient(ellipse, rgba(99,102,241,.2) 0%, transparent 70%)", borderRadius: 32, pointerEvents: "none" }} />
          <div style={{ background: "linear-gradient(145deg, #0f172a 0%, #131e35 100%)", borderRadius: 20, padding: 24, position: "relative", overflow: "hidden", border: "1px solid rgba(99,102,241,.25)", boxShadow: "0 0 0 1px rgba(255,255,255,.04), 0 24px 64px rgba(0,0,0,.5)" }}>
            <div style={{ position: "absolute", top: -1, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>🏆 {t("heroBestSeller")}</div>
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
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontWeight: 600, marginBottom: 2 }}>{t("heroCardPrice")}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>฿3,200</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,.12)", color: "#a5b4fc", fontSize: 11, fontWeight: 600, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,.2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Verified
              </div>
            </div>
          </div>

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

          <div style={{ position: "absolute", top: -14, right: -16, background: "rgba(255,255,255,.95)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#0f172a", boxShadow: "0 8px 32px rgba(0,0,0,.3)", display: "flex", alignItems: "center", gap: 7, animation: "float 3s ease-in-out infinite", backdropFilter: "blur(8px)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Escrow Protected
          </div>
          <div style={{ position: "absolute", bottom: 56, left: -20, background: "rgba(255,255,255,.95)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#0f172a", boxShadow: "0 8px 32px rgba(0,0,0,.3)", display: "flex", alignItems: "center", gap: 7, animation: "float 3s 1.5s ease-in-out infinite", backdropFilter: "blur(8px)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Verified Seller
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Scrolling trust marquee ─── */
function TrustBar() {
  const { lang } = useLang();
  const items = i18n[lang]?.trustBar ?? i18n.th.trustBar;
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
  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
  const stepIcons = [
    <svg key="s" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    <svg key="e" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
    <svg key="r" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  ];
  const stepAccents = ["#3b82f6", "#6366f1", "#8b5cf6"];
  const steps = (i18n[lang]?.howSteps ?? i18n.th.howSteps).map((s, i) => ({ ...s, icon: stepIcons[i], accent: stepAccents[i] }));
  return (
    <section id="how" style={{ background: "#fff" }}>
      <div className="rm-sec" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{t("howLabel")}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -1 }}>{t("howH2")}</h2>
          <p style={{ fontSize: 16, color: "#64748b", marginTop: 14, maxWidth: 480, margin: "14px auto 0" }}>{t("howPara")}</p>
        </div>
        <div className="rm-g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 20, padding: "36px 28px", position: "relative", overflow: "hidden", transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,.06)`; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ position: "absolute", top: 16, right: 20, fontFamily: "'Playfair Display', serif", fontSize: 80, fontWeight: 900, color: "#f8fafc", lineHeight: 1, userSelect: "none" }}>{s.num}</div>
              <div style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${s.accent}18, ${s.accent}08)`, border: `1px solid ${s.accent}20`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, color: s.accent }}>
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
  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
  const featureIcons = [
    <svg key="v" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
    <svg key="l" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    <svg key="a" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    <svg key="c" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  ];
  const featureColors = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4"];
  const features = (i18n[lang]?.whyFeatures ?? i18n.th.whyFeatures).map((f, i) => ({ ...f, icon: featureIcons[i], color: featureColors[i] }));
  return (
    <section style={{ background: "#f8fafc" }}>
      <div className="rm-sec" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{t("whyLabel")}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -1 }}>{t("whyH2")}</h2>
        </div>
        <div className="rm-g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ padding: "28px 24px", borderRadius: 16, border: "1px solid #e2e8f0", transition: "all 0.25s", background: "#fff" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + "40"; e.currentTarget.style.boxShadow = `0 12px 32px ${f.color}12`; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 48, height: 48, background: f.color + "12", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: f.color }}>{f.icon}</div>
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
  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
  const titleLines = i18n[lang]?.sellerCTATitle ?? i18n.th.sellerCTATitle;
  return (
    <section style={{ background: "#fff" }}>
      <div className="rm-sec-b" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 100px" }}>
        <div className="rm-g2" style={{ background: "linear-gradient(135deg, #060d1e 0%, #0f172a 100%)", borderRadius: 24, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative" }}>
          <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, background: "radial-gradient(circle, rgba(99,102,241,.15), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, right: 100, width: 300, height: 300, background: "radial-gradient(circle, rgba(139,92,246,.1), transparent 70%)", pointerEvents: "none" }} />

          {/* Left */}
          <div className="rm-cta-left" style={{ padding: "64px 56px", position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>{t("sellerForLabel")}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15, letterSpacing: -0.5 }}>
              {titleLines[0]}<br />{titleLines[1]}
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.45)", lineHeight: 1.75, margin: "0 0 36px" }}>{t("sellerCTASub")}</p>
            <a href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#0f172a", padding: "13px 26px", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.3)"; }}>
              {t("sellerCTABtn")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          {/* Right */}
          <div className="rm-cta-right" style={{ padding: "64px 56px 64px 40px", borderLeft: "1px solid rgba(255,255,255,.06)", position: "relative" }}>
            {(i18n[lang]?.sellerSteps ?? i18n.th.sellerSteps).map(([title, desc], i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 28 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.4)", flexShrink: 0 }}>0{i + 1}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>{desc}</div>
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
  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
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
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", lineHeight: 1.75, maxWidth: 240, margin: 0 }}>{t("footerTagline")}</p>
          </div>
          {[
            [t("footerProducts"), [[t("footerFootball"), "/shop?cat=football"], [t("footerBasketball"), "/shop?cat=basketball"], ["Retro Jersey", "/shop?cat=retro"], [t("footerViewAll"), "/shop"]]],
            [t("footerAccount"), [[t("footerLogin"), "/login"], [t("footerRegister"), "/register"], [t("footerOrders"), "/orders"], [t("footerBecomeSeller"), "/seller/terms"]]],
            [t("footerCompany"), [[t("footerPrivacy"), "/privacy"], [t("footerTerms"), "/terms-of-service"], [t("footerContact"), "/contact"]]],
          ].map(([title, links]) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>{title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(([l, href]) => (
                  <a key={href} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,.3)", textDecoration: "none", transition: "color 0.15s" }}
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
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
