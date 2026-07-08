"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import MobileNav from "@/app/components/MobileNav";
import LanguageToggle from "@/app/components/LanguageToggle";

const TYPE_ICON = {
  new_order:       "🛍️",
  slip_approved:   "✅",
  slip_rejected:   "❌",
  order_shipped:   "📦",
  order_completed: "🎉",
  order_disputed:  "⚠️",
};

export default function NotificationsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navUser, setNavUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setNavUser(user);

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifs(data || []);
      setLoading(false);

      // mark all as read
      await supabase.from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f3", fontFamily: "'Sarabun', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Sarabun:wght@400;500;600;700&display=swap');`}</style>

      <nav style={S.nav}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>
        <span className="rm-mobile-only" style={{ marginLeft: "auto" }}><LanguageToggle /></span>
        <button
          className="rm-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          aria-label="Menu"
        >
          {menuOpen
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={navUser} profile={null} />
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
        <BackLink href="/" label="กลับหน้าหลัก" />
        <h1 style={S.heading}>การแจ้งเตือน</h1>

        {notifs.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "64px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <p style={{ color: "#6b7280", fontSize: 16 }}>ยังไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {notifs.map((n, i) => (
              <a key={n.id}
                href={n.order_id ? (n.type === "new_order" || n.type === "slip_approved" || n.type === "order_completed" || n.type === "order_disputed" ? "/seller/dashboard" : "/orders") : "#"}
                style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 20px", background: n.read ? "#fff" : "#f0fdf4", borderRadius: i === 0 ? "14px 14px 4px 4px" : i === notifs.length - 1 ? "4px 4px 14px 14px" : 4, border: "1px solid #e5e7eb", borderTop: i > 0 ? "none" : "1px solid #e5e7eb", textDecoration: "none", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = n.read ? "#f9fafb" : "#dcfce7"}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "#fff" : "#f0fdf4"}>
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{TYPE_ICON[n.type] || "🔔"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: n.read ? 500 : 700, color: "#111827" }}>{n.message}</div>
                  <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {!n.read && <span style={{ width: 8, height: 8, background: "#1e3a8a", borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink({ href, label }) {
  return (
    <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 20 }}
      onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
      onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
      {label}
    </a>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f3" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  nav:     { position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", padding: "0 48px", height: 64, display: "flex", alignItems: "center", zIndex: 100 },
  logo:    { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" },
  heading: { fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e", margin: "0 0 24px" },
};
