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

  const ink      = "rgba(255,255,255,0.82)";
  const divColor = "rgba(255,255,255,0.18)";

  const lnk = (extra = {}) => ({
    fontSize: 13.5, fontWeight: 500, color: ink, textDecoration: "none",
    padding: "5px 12px", borderRadius: 8, transition: "all 0.15s", whiteSpace: "nowrap",
    ...extra,
  });
  const onL  = e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.12)"; };
  const offL = e => { e.currentTarget.style.color = ink; e.currentTarget.style.background = "transparent"; };

  return (
    <div style={{ padding: "14px 16px 0", background: "#06091a" }}>
    <div style={{ maxWidth: 1160, margin: "0 auto" }}>
      <nav style={{
        height: 52,
        background: "transparent",
        display: "flex", alignItems: "center",
        padding: "0 4px",
        gap: 4,
      }}>

        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0, marginRight: 8 }}>
          <img src="/favicon.ico" alt="" width="26" height="26" style={{ borderRadius: 7, display: "block" }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
            Re<span style={{ color: "#93c5fd" }}>Match</span>
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
                <a href="/admin" style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", padding: "4px 10px", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 7, textDecoration: "none", background: "rgba(124,58,237,0.2)", whiteSpace: "nowrap" }}>Admin</a>
              )}
              {profile?.role === "seller" && (
                <a href="/seller/dashboard" style={lnk()} onMouseEnter={onL} onMouseLeave={offL}>{t("navDashboard")}</a>
              )}
              <a href="/orders" style={lnk()} onMouseEnter={onL} onMouseLeave={offL}>{t("navOrders")}</a>

              {/* Bell */}
              <a href="/notifications" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, color: ink, textDecoration: "none", transition: "background 0.15s", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
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
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: ink, alignItems: "center", justifyContent: "center", marginLeft: "auto" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} profile={profile} showCategories={true} />
      </nav>
    </div>
    </div>
  );
}

/* ─── Hero ─── */
function Hero() {
  const supabase = createClient();
  const { lang } = useLang();
  const t = (key) => i18n[lang]?.[key] ?? i18n.th[key] ?? key;
  const [heroProds, setHeroProds] = useState([]);

  useEffect(() => {
    async function fetchHero() {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, image_urls, grade, team, category")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(4);
      setHeroProds(data || []);
    }

    fetchHero();

    const channel = supabase
      .channel("hero-products")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, fetchHero)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "products" }, fetchHero)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const G = {
    S: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
    A: { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
    B: { bg: "#fef9c3", text: "#a16207", border: "#fde68a" },
  };
  const CAT = { football: "⚽", basketball: "🏀", retro: "🏆" };

  const guarantees = [
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: t("heroEscrowTitle"), sub: t("heroEscrowSub") },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, title: t("heroVerifiedTitle"), sub: t("heroVerifiedSub") },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, title: t("heroReturnTitle"), sub: t("heroReturnSub") },
  ];

  const slots = [...heroProds, ...Array(Math.max(0, 4 - heroProds.length)).fill(null)];

  return (
    <section style={{ position: "relative", overflow: "hidden", background: "#06091a" }}>
      {/* Minimal bg glows */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-15%", right: "-5%", width: "45%", height: "70%", background: "radial-gradient(ellipse, rgba(59,130,246,.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-8%", width: "40%", height: "60%", background: "radial-gradient(ellipse, rgba(30,58,138,.15) 0%, transparent 70%)" }} />
      </div>

      <div className="rm-hero-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 48px 100px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>

        {/* Left — copy */}
        <div style={{ animation: "fadeUp 0.6s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(99,102,241,.15)", color: "#a5b4fc", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 99, marginBottom: 28, border: "1px solid rgba(99,102,241,.25)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {t("heroPill")}
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px,4.5vw,60px)", fontWeight: 500, lineHeight: 1.1, letterSpacing: -1, color: "#fff", margin: "0 0 20px" }}>
            {t("heroLine1")}<br />
            <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("heroLine2")}
            </span>
            {t("heroLine3") && <><br />{t("heroLine3")}</>}
          </h1>

          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.45)", margin: "0 0 32px", maxWidth: 400 }}>
            {t("heroDesc")}
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 20px rgba(37,99,235,.4)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "none"; }}>
              {t("heroCTAShop")}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="/seller/terms" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.55)", fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.28)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "rgba(255,255,255,.55)"; }}>
              {t("heroCTAHow")}
            </a>
          </div>

          <div style={{ marginTop: 44, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column", gap: 14 }}>
            {guarantees.map(({ icon, title, sub }) => (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.6)", flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 1 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — real product grid */}
        <div className="rm-hero-right" style={{ animation: "fadeIn 0.7s 0.15s ease both" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {slots.map((p, i) => {
              const img = p?.image_urls?.[0] || p?.image_url;
              const g = p ? (G[p.grade] || G.S) : null;
              return (
                <a key={i} href={p ? `/products/${p.id}` : "/shop"} style={{ textDecoration: "none", display: "block", borderRadius: 16, overflow: "hidden", aspectRatio: "1", position: "relative", background: "#0f172a", border: "1px solid rgba(255,255,255,.08)", transition: "transform 0.22s ease" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                  {img ? (
                    <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                      {p ? (CAT[p.category] || "⚽") : ""}
                    </div>
                  )}
                  {/* Bottom overlay */}
                  {p && (
                    <>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.1) 50%, transparent 100%)" }} />
                      <div style={{ position: "absolute", top: 8, right: 8, background: g.bg, border: `1px solid ${g.border}`, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: g.text }}>
                        {p.grade}
                      </div>
                      <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "#93c5fd" }}>฿{Number(p.price).toLocaleString()}</div>
                      </div>
                    </>
                  )}
                </a>
              );
            })}
          </div>
          {heroProds.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 500 }}>สินค้าล่าสุดจากแพลตฟอร์ม</span>
            </div>
          )}
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

/* ─── Featured Products ─── */
function FeaturedProducts() {
  const supabase = createClient();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, image_urls, grade, team, category, size")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      setProducts(data || []);
      setLoading(false);
    }

    fetchFeatured();

    const channel = supabase
      .channel("featured-products")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, fetchFeatured)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "products" }, fetchFeatured)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const GRADE = {
    S: { pill: "#dcfce7", border: "#bbf7d0", text: "#15803d" },
    A: { pill: "#dbeafe", border: "#bfdbfe", text: "#1e40af" },
    B: { pill: "#fef9c3", border: "#fde68a", text: "#a16207" },
  };
  const CAT = { football: "⚽", basketball: "🏀", retro: "🏆" };

  if (!loading && products.length === 0) return null;

  return (
    <section style={{ background: "#fff", borderTop: "1px solid #f1f5f9" }}>
      <div className="rm-sec" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 48px" }}>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>สินค้าล่าสุด</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>
              เพิ่งลงขายใหม่
            </h2>
          </div>
          <a href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#1e3a8a", textDecoration: "none", padding: "9px 18px", border: "1.5px solid #e2e8f0", borderRadius: 10, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#1e3a8a"; e.currentTarget.style.background = "#eff6ff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>
            ดูทั้งหมด
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        {loading ? (
          <div className="rm-g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: "#f8fafc", border: "1.5px solid #e8edf5", borderRadius: 16, aspectRatio: "0.8", animation: "pulse 1.6s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <div className="rm-g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {products.map(p => {
              const g = GRADE[p.grade] || GRADE.S;
              const img = p.image_urls?.[0] || p.image_url;
              return (
                <a key={p.id} href={`/products/${p.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ background: "#fff", border: "1.5px solid #e8edf5", borderRadius: 16, overflow: "hidden", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = g.border; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,.09)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8edf5"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.04)"; }}>
                    <div style={{ position: "relative", aspectRatio: "1", background: "#f8fafc", overflow: "hidden" }}>
                      {img
                        ? <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>{CAT[p.category] || "⚽"}</div>
                      }
                      <div style={{ position: "absolute", top: 8, right: 8, background: g.pill, border: `1px solid ${g.border}`, borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 800, color: g.text }}>
                        Grade {p.grade}
                      </div>
                    </div>
                    <div style={{ padding: "12px 14px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>
                        {p.name}
                      </div>
                      {(p.team || p.size) && (
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{[p.team, p.size ? `Size ${p.size}` : null].filter(Boolean).join(" · ")}</div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>฿{Number(p.price).toLocaleString()}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 99, padding: "2px 8px" }}>
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#15803d" }}>Escrow</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
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
      <FeaturedProducts />
      <HowItWorks />
      <WhyUs />
      <SellerCTA />
      <Footer />
    </>
  );
}
