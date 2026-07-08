"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import MobileNav from "@/app/components/MobileNav";

export default function MessagesPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [user, setUser]   = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: rows } = await supabase
        .from("conversations")
        .select("*, product:products(id, name, image_url)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!rows?.length) { setConvs([]); setLoading(false); return; }

      const otherIds = [...new Set(rows.map(c => c.buyer_id === user.id ? c.seller_id : c.buyer_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds);

      const enriched = await Promise.all(rows.map(async c => {
        const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
        const [{ data: lastMsg }, { count: unread }] = await Promise.all([
          supabase.from("messages").select("content, created_at, sender_id").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.id).eq("read", false).neq("sender_id", user.id),
        ]);
        return { ...c, other: profiles?.find(p => p.id === otherId) || {}, lastMsg, unread: unread || 0 };
      }));

      setConvs(enriched);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>
        <a className="rm-nav-links" href="/" style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← กลับหน้าหลัก</a>
        <button
          className="rm-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          style={{ marginLeft: "auto", width: 38, height: 38, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          aria-label="Menu"
        >
          {menuOpen
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} profile={null} />
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e", margin: "0 0 24px" }}>ข้อความ</h1>

        {loading ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 72, background: "#e2e8f0", borderRadius: 12, marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
          </div>
        ) : convs.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "64px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#6b7280" }}>ยังไม่มีข้อความ</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>เริ่มสนทนากับผู้ขายจากหน้าสินค้าได้เลย</div>
            <a href="/shop" style={{ display: "inline-block", marginTop: 20, background: "#1e3a8a", color: "#fff", padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>ดูสินค้า →</a>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {convs.map((c, i) => (
              <a key={c.id} href={`/messages/${c.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ padding: "16px 20px", borderBottom: i < convs.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "center", gap: 14, background: c.unread > 0 ? "#f0fdf4" : "#fff", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={e => e.currentTarget.style.background = c.unread > 0 ? "#f0fdf4" : "#fff"}>

                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {c.other?.avatar_url
                      ? <img src={c.other.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 18, fontWeight: 700, color: "#1e3a8a" }}>{c.other?.full_name?.[0] || "?"}</span>
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <div style={{ fontWeight: c.unread > 0 ? 700 : 600, color: "#0f0f0e", fontSize: 14 }}>{c.other?.full_name || "ผู้ใช้"}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
                        {c.lastMsg ? new Date(c.lastMsg.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      🏷 {c.product?.name || "สินค้า"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13, color: c.unread > 0 ? "#0f0f0e" : "#6b7280", fontWeight: c.unread > 0 ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                        {c.lastMsg ? (c.lastMsg.sender_id === user?.id ? "คุณ: " : "") + c.lastMsg.content : "เริ่มสนทนา"}
                      </div>
                      {c.unread > 0 && (
                        <div style={{ background: "#1e3a8a", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "2px 8px", flexShrink: 0, marginLeft: 8 }}>{c.unread}</div>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
