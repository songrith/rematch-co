"use client";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

const CAT_EMOJI = { football: "⚽", basketball: "🏀", retro: "🏆" };
const GRADE_STYLE = {
  S: { pill: "#dcfce7", pillBorder: "#bbf7d0", text: "#15803d", accent: "#16a34a", label: "เกือบใหม่", shadow: "rgba(22,163,74,.14)" },
  A: { pill: "#dbeafe", pillBorder: "#bfdbfe", text: "#1e40af", accent: "#2563eb", label: "สภาพดี",   shadow: "rgba(37,99,235,.14)" },
  B: { pill: "#fef9c3", pillBorder: "#fde68a", text: "#a16207", accent: "#d97706", label: "ปานกลาง", shadow: "rgba(217,119,6,.14)" },
};
const catMap     = { "ทั้งหมด": null, "เสื้อบอล": "football", "เสื้อบาส": "basketball", "Retro": "retro" };
const catReverse = { football: "เสื้อบอล", basketball: "เสื้อบาส", retro: "Retro" };
const tabs       = ["ทั้งหมด", "เสื้อบอล", "เสื้อบาส", "Retro"];
const tabEmoji   = { "ทั้งหมด": "✦", "เสื้อบอล": "⚽", "เสื้อบาส": "🏀", "Retro": "🏆" };

function ShopContent() {
  const supabase     = createClient();
  const searchParams = useSearchParams();

  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [unread,   setUnread]   = useState(0);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [active,   setActive]   = useState(() => catReverse[searchParams.get("cat")] || "ทั้งหมด");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
        setProfile(data);
        const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
        setUnread(count || 0);
      }
      const { data: prods } = await supabase.from("products").select("*").eq("status", "approved").order("created_at", { ascending: false });
      if (!prods?.length) { setProducts([]); setLoading(false); return; }
      const sellerIds = [...new Set(prods.map(p => p.seller_id))];
      const { data: sellerProfiles } = await supabase.from("profiles").select("id, full_name, avatar_url, rating, review_count").in("id", sellerIds);
      setProducts(prods.map(p => {
        const prof = sellerProfiles?.find(pr => pr.id === p.seller_id);
        return { ...p, seller_name: prof?.full_name || "seller", seller_avatar: prof?.avatar_url || null, seller_rating: prof?.rating ?? null, seller_review_count: prof?.review_count ?? 0 };
      }));
      setLoading(false);
    }
    init();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const q        = search.trim().toLowerCase();
  const filtered = products
    .filter(p => active === "ทั้งหมด" || p.category === catMap[active])
    .filter(p => !q || p.name?.toLowerCase().includes(q) || p.team?.toLowerCase().includes(q));

  const navBorder = { padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", border: "1px solid #e5e7eb" };
  const navFilled = (bg) => ({ background: bg, color: "#fff", padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, textDecoration: "none" });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .product-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; }
        @media (max-width: 1100px) { .product-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 720px)  { .product-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px)  { .product-grid { grid-template-columns: 1fr; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .shop-search:focus { outline: none; border-color: #93c5fd !important; box-shadow: 0 0 0 3px rgba(147,197,253,.2) !important; }
        .shop-search::placeholder { color: #94a3b8; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div className="rm-nav-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {[["เสื้อบอล","football"],["เสื้อบาส","basketball"],["Retro","retro"]].map(([label, cat]) => (
              <button key={cat} onClick={() => setActive(catReverse[cat])}
                style={{ background: "none", border: "none", fontSize: 14, fontWeight: active === catReverse[cat] ? 700 : 500, color: active === catReverse[cat] ? "#1e3a8a" : "#4b5563", cursor: "pointer", padding: 0 }}>
                {label}
              </button>
            ))}
          </div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {profile?.role === "admin"  && <a href="/admin" className="rm-nav-hide" style={navFilled("#7c3aed")}>Admin</a>}
              {profile?.role === "seller" && <><a href="/sell" className="rm-nav-hide" style={navFilled("#1e3a8a")}>+ ลงสินค้า</a><a href="/seller/dashboard" className="rm-nav-hide" style={navBorder}>Dashboard</a></>}
              {(profile?.role === "buyer" || !profile?.role) && <a href="/seller/terms" className="rm-nav-hide" style={navBorder}>สมัครเป็น Seller</a>}
              <a href="/orders"   className="rm-nav-hide" style={navBorder}>คำสั่งซื้อ</a>
              <a href="/messages" className="rm-nav-hide" style={navBorder}>ข้อความ</a>
              <a href="/notifications" style={{ position: "relative", display: "flex", alignItems: "center", color: "#6b7280", textDecoration: "none" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && <span style={{ position: "absolute", top: -2, right: -2, background: "#dc2626", color: "#fff", borderRadius: "50%", fontSize: 10, fontWeight: 700, width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread > 9 ? "9+" : unread}</span>}
              </a>
              <a href="/dashboard" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {(profile?.full_name || user.email || "?")[0].toUpperCase()}
                </div>
                <span className="rm-nav-name">{profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}</span>
              </a>
              <button onClick={handleLogout} className="rm-nav-hide" style={{ background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 14px", borderRadius: 99, fontSize: 13, cursor: "pointer" }}>ออก</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <a href="/login"    style={{ padding: "9px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", border: "1px solid #e5e7eb" }}>เข้าสู่ระบบ</a>
              <a href="/register" style={{ background: "#1e3a8a", color: "#fff", padding: "9px 20px", borderRadius: 99, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>สมัครสมาชิก</a>
            </div>
          )}
        </div>
      </nav>

      {/* ── Header ── airy, light editorial */}
      <div className="rm-sec" style={{ background: "#fff", borderBottom: "1px solid #e8edf5", padding: "44px 48px 36px", position: "relative", overflow: "hidden" }}>
        {/* subtle dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.35, pointerEvents: "none" }} />
        {/* soft blue wash top-right */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,231,255,.6) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <a href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, fontWeight: 500, textDecoration: "none", marginBottom: 24, transition: "color .18s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            กลับหน้าหลัก
          </a>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Authentic Jerseys Marketplace</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3.6vw,46px)", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -0.8, lineHeight: 1.1 }}>
                เจอร์ซีย์แท้ทุกชนิด
              </h1>
            </div>
            <div style={{ paddingBottom: 4, textAlign: "right" }}>
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{filtered.length} รายการ</span>
            </div>
          </div>

          {/* Search + filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
              <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="shop-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อสินค้า, ทีม..."
                style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, background: "#fff", color: "#0f172a", transition: "all .2s" }} />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActive(t)}
                  style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .18s",
                    border:     active === t ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
                    background: active === t ? "#f0f0ff"             : "#fff",
                    color:      active === t ? "#4f46e5"             : "#6b7280",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="rm-sec" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 48px 80px" }}>
        {loading ? (
          <div className="product-grid">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #e8edf5", borderRadius: 16, aspectRatio: "0.75", animation: "pulse 1.6s ease-in-out infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#475569", marginBottom: 6 }}>ไม่พบสินค้า</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</div>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return <Suspense><ShopContent /></Suspense>;
}

function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const grade  = GRADE_STYLE[product.grade] || GRADE_STYLE.S;
  const emoji  = CAT_EMOJI[product.category] || "⚽";
  const isSold = product.status === "sold";
  const img    = product.image_urls?.[0] || product.image_url;

  return (
    <a href={`/products/${product.id}`} style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{
        background: "#fff",
        border: `1.5px solid ${hovered ? grade.pillBorder : "#e8edf5"}`,
        borderRadius: 16,
        overflow: "hidden",
        transform: hovered ? "translateY(-6px)" : "none",
        boxShadow: hovered
          ? `0 20px 48px ${grade.shadow}, 0 4px 12px rgba(0,0,0,.06)`
          : "0 2px 8px rgba(0,0,0,.04)",
        transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)",
        opacity: isSold ? 0.65 : 1,
      }}>

        {/* Image */}
        <div style={{ position: "relative", aspectRatio: "1", background: "#f1f5f9", overflow: "hidden" }}>
          {img
            ? <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.04)" : "scale(1)", transition: "transform 0.38s ease" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>{emoji}</div>
          }

          {/* Grade badge — top right */}
          <div style={{ position: "absolute", top: 10, right: 10, background: grade.pill, border: `1px solid ${grade.pillBorder}`, borderRadius: 99, padding: "3px 9px" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: grade.text, letterSpacing: "0.04em" }}>Grade {product.grade}</span>
          </div>

          {/* Team pill — top left */}
          {product.team && (
            <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,.88)", border: "1px solid rgba(0,0,0,.08)", borderRadius: 99, padding: "3px 9px", backdropFilter: "blur(6px)" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#374151" }}>{product.team}</span>
            </div>
          )}

          {/* Sold overlay */}
          {isSold && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(248,250,252,.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ background: "#0f172a", color: "#fff", fontSize: 12, fontWeight: 800, padding: "7px 20px", borderRadius: 99, letterSpacing: "0.08em" }}>SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "13px 14px 14px" }}>
          {/* Left accent bar */}
          <div style={{ width: 24, height: 3, borderRadius: 99, background: grade.accent, marginBottom: 8, opacity: 0.6 }} />

          {/* Name */}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {product.name}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>
            ไซส์ {product.size} · <span style={{ color: grade.text, fontWeight: 600 }}>{grade.label}</span>
          </div>

          {/* Price + Escrow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>
              ฿{Number(product.price).toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 99, padding: "3px 8px" }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#15803d" }}>Escrow</span>
            </div>
          </div>

          {/* Seller row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 9, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1e3a8a", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
              {product.seller_avatar
                ? <img src={product.seller_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : product.seller_name?.[0]?.toUpperCase() || "S"}
            </div>
            <span style={{ fontSize: 11, color: "#374151", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {product.seller_name}
            </span>
            {/* KYC */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 99, padding: "2px 7px", flexShrink: 0 }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#1e40af" }}>KYC</span>
            </div>
            {/* Star */}
            {product.seller_rating != null ? (
              <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{Number(product.seller_rating).toFixed(1)}</span>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>({product.seller_review_count})</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#e2e8f0" stroke="#e2e8f0" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>ยังไม่มีรีวิว</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ width: "100%", marginTop: 11, padding: "9px 0", background: isSold ? "#f1f5f9" : hovered ? "#1e3a8a" : "#0f172a", color: isSold ? "#94a3b8" : "#fff", borderRadius: 10, fontSize: 12, fontWeight: 700, textAlign: "center", transition: "background .2s", letterSpacing: "0.02em" }}>
            {isSold ? "ถูกซื้อแล้ว" : "ดูรายละเอียด →"}
          </div>
        </div>
      </div>
    </a>
  );
}
