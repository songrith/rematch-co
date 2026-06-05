"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const RATING_EMOJI = { 5: "😍", 4: "🔥", 3: "✅", 2: "👍", 1: "😐" };
const AVATAR_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#0891b2","#dc2626"];

export default function ReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState(0);

  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id, seller_id")
        .order("created_at", { ascending: false });

      if (!rows?.length) { setLoading(false); return; }

      const reviewerIds = [...new Set(rows.map(r => r.reviewer_id).filter(Boolean))];
      const sellerIds   = [...new Set(rows.map(r => r.seller_id).filter(Boolean))];

      const [{ data: reviewers }, { data: sellers }] = await Promise.all([
        reviewerIds.length ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", reviewerIds) : { data: [] },
        sellerIds.length   ? supabase.from("profiles").select("id, full_name").in("id", sellerIds)              : { data: [] },
      ]);

      setReviews(rows.map(r => ({
        ...r,
        reviewer_name:   reviewers?.find(p => p.id === r.reviewer_id)?.full_name  || "ผู้ซื้อ",
        reviewer_avatar: reviewers?.find(p => p.id === r.reviewer_id)?.avatar_url || null,
        seller_name:     sellers?.find(p => p.id === r.seller_id)?.full_name      || null,
      })));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 0 ? reviews : reviews.filter(r => r.rating === filter);
  const avg      = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const ratingCounts = [5,4,3,2,1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === s).length / reviews.length * 100) : 0,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rv-card { transition: box-shadow .22s, transform .22s; }
        .rv-card:hover { box-shadow: 0 8px 32px rgba(15,23,42,.09) !important; transform: translateY(-2px); }
        .filter-btn { transition: all .16s; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/shop" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", padding: "7px 14px", borderRadius: 8, transition: "color .15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#0f172a"}
            onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>ร้านค้า</a>
          <a href="/dashboard" style={{ fontSize: 13, fontWeight: 500, color: "#374151", textDecoration: "none", padding: "7px 16px", borderRadius: 99, border: "1px solid #e5e7eb", background: "#fff" }}>บัญชีของฉัน</a>
        </div>
      </nav>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8edf5", padding: "56px 48px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 64, alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* Left — title */}
          <div style={{ flex: "1 1 360px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 10 }}>Customer Reviews</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 900, color: "#0f172a", margin: "0 0 14px", lineHeight: 1.15, letterSpacing: -0.8 }}>
              เสียงจากผู้ใช้จริง
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", margin: 0, lineHeight: 1.75, maxWidth: 400 }}>
              รีวิวทุกบทความมาจากผู้ซื้อที่เสร็จสิ้นการสั่งซื้อจริงบนแพลตฟอร์ม ไม่มีการแต่งเติม
            </p>
          </div>

          {/* Right — score + bar */}
          <div style={{ flex: "0 0 auto", display: "flex", gap: 40, alignItems: "flex-start" }}>
            {/* Big score */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{avg ?? "—"}</div>
              <div style={{ display: "flex", gap: 3, justifyContent: "center", margin: "8px 0 4px" }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24"
                    fill={avg && s <= Math.round(avg) ? "#f59e0b" : "#e2e8f0"}
                    stroke={avg && s <= Math.round(avg) ? "#f59e0b" : "#e2e8f0"} strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{reviews.length} รีวิว</div>
            </div>

            {/* Breakdown bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
              {ratingCounts.map(({ star, count, pct }) => (
                <div key={star} onClick={() => setFilter(filter === star ? 0 : star)}
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <span style={{ fontSize: 12, color: "#64748b", width: 14, textAlign: "right", flexShrink: 0 }}>{star}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" style={{ flexShrink: 0 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: filter === star ? "#6366f1" : "#f59e0b", borderRadius: 99, transition: "width .4s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#94a3b8", width: 20, textAlign: "right", flexShrink: 0 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ maxWidth: 1100, margin: "28px auto 0", padding: "0 48px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[[0, "ทั้งหมด"], [5, "😍"], [4, "🔥"], [3, "✅"], [2, "👍"], [1, "😐"]].map(([val, label]) => (
          <button key={val} className="filter-btn" onClick={() => setFilter(val)}
            style={{ padding: "7px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: `1.5px solid ${filter === val ? "#6366f1" : "#e2e8f0"}`,
              background: filter === val ? "#6366f1" : "#fff",
              color:      filter === val ? "#fff"    : "#6b7280",
            }}>
            {label}{val !== 0 && ` · ${reviews.filter(r => r.rating === val).length}`}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1100, margin: "20px auto 80px", padding: "0 48px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, height: 200, animation: "pulse 1.6s ease-in-out infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>ยังไม่มีรีวิว</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map((r, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={r.id} className="rv-card"
                  style={{ background: "#fff", borderRadius: 16, padding: "24px 26px", boxShadow: "0 1px 4px rgba(15,23,42,.05)" }}>

                  {/* Stars + emoji */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="14" height="14" viewBox="0 0 24 24"
                          fill={s <= r.rating ? "#f59e0b" : "#e2e8f0"}
                          stroke={s <= r.rating ? "#f59e0b" : "#e2e8f0"} strokeWidth="1">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                    <span style={{ fontSize: 20 }}>{RATING_EMOJI[r.rating] || "⭐"}</span>
                  </div>

                  {/* Comment */}
                  <p style={{ margin: "0 0 20px", fontSize: 14, color: "#1e293b", lineHeight: 1.75, fontWeight: 400 }}>
                    {r.comment
                      ? `"${r.comment}"`
                      : <span style={{ color: "#94a3b8", fontStyle: "italic", fontWeight: 300 }}>ไม่มีความคิดเห็น</span>}
                  </p>

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                        {r.reviewer_avatar
                          ? <img src={r.reviewer_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : r.reviewer_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{r.reviewer_name}</div>
                        {r.seller_name && <div style={{ fontSize: 11, color: "#94a3b8" }}>ซื้อจาก {r.seller_name}</div>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#cbd5e1" }}>
                      {new Date(r.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 52 }}>
          <a href="/shop"
            style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 99, border: "1.5px solid #e2e8f0", background: "#fff", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#0f172a"; e.currentTarget.style.color = "#0f172a"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#6b7280"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            กลับไปซื้อสินค้า
          </a>
        </div>
      </div>
    </div>
  );
}
