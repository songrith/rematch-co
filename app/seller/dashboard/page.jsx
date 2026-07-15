"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import MobileNav from "@/app/components/MobileNav";
import LanguageToggle from "@/app/components/LanguageToggle";

const PROD_STATUS = {
  pending:  { label: "รออนุมัติ",   bg: "#fef3c7", text: "#92400e" },
  approved: { label: "อนุมัติแล้ว", bg: "#dcfce7", text: "#166534" },
  rejected: { label: "ไม่ผ่าน",     bg: "#fee2e2", text: "#dc2626" },
  sold:     { label: "ขายแล้ว",     bg: "#ede9fe", text: "#5b21b6" },
};
const ORD_STATUS = {
  pending_payment: { label: "รอตรวจสลิป", bg: "#fef3c7", text: "#92400e" },
  paid:            { label: "รอจัดส่ง",   bg: "#dbeafe", text: "#1d4ed8" },
  shipped:         { label: "จัดส่งแล้ว", bg: "#ede9fe", text: "#5b21b6" },
  completed:       { label: "สำเร็จ",     bg: "#dcfce7", text: "#166534" },
  refunded:        { label: "คืนเงิน",    bg: "#f1f5f9", text: "#475569" },
};
const CAT_EMOJI = { football: "⚽", basketball: "🏀", retro: "🏆" };

export default function SellerDashboardPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [profile, setProfile]   = useState(null);
  const [navUser, setNavUser]   = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [unreadMsg, setUnreadMsg]     = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [tab, setTab]           = useState("products");
  const [orderStatusTab, setOrderStatusTab] = useState("all");
  const [prodStatusTab, setProdStatusTab]   = useState("all");
  const [tracking, setTracking] = useState({});
  const [courier, setCourier]   = useState({});
  const [shipping, setShipping] = useState({});
  const [viewSlip, setViewSlip] = useState(null);
  const [editProd, setEditProd] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [promptpayId, setPromptpayId] = useState("");
  const [ppEditing, setPPEditing] = useState(false);
  const [ppNew, setPPNew] = useState("");
  const [ppSaving, setPPSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setNavUser(user);

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof?.role !== "seller" && prof?.role !== "admin") { router.push("/seller/verify"); return; }

      const [{ data: prods }, { data: ords }, { data: ver }] = await Promise.all([
        supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("seller_verifications").select("promptpay_id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (ver?.promptpay_id) { setPromptpayId(ver.promptpay_id); setPPNew(ver.promptpay_id); }

      const buyerIds = [...new Set((ords || []).map(o => o.buyer_id).filter(Boolean))];
      const { data: buyers } = buyerIds.length
        ? await supabase.from("profiles").select("id, full_name, phone, email").in("id", buyerIds)
        : { data: [] };

      const prodIds = [...new Set((ords || []).map(o => o.product_id).filter(Boolean))];
      const { data: ordProds } = prodIds.length
        ? await supabase.from("products").select("id, name, image_url, category").in("id", prodIds)
        : { data: [] };

      const { data: convs } = await supabase.from("conversations").select("id").eq("seller_id", user.id);
      if (convs?.length) {
        const convIds = convs.map(c => c.id);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", convIds)
          .neq("sender_id", user.id)
          .eq("read", false);
        setUnreadMsg(count || 0);
      }

      const { count: notifCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadNotif(notifCount || 0);

      setProfile(prof);
      setProducts(prods || []);
      setOrders((ords || []).map(o => ({
        ...o,
        buyer:   buyers?.find(b => b.id === o.buyer_id) || null,
        product: ordProds?.find(p => p.id === o.product_id) || null,
      })));
      setLoading(false);
    }
    load();
  }, []);

  async function handleUpdatePP() {
    const raw = ppNew.replace(/\D/g, "");
    if (raw.length !== 10 && raw.length !== 13) { alert("ต้องเป็นเบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก"); return; }
    setPPSaving(true);
    const { error } = await supabase.from("seller_verifications").update({ promptpay_id: raw }).eq("user_id", profile.id);
    setPPSaving(false);
    if (error) { alert("บันทึกไม่สำเร็จ: " + error.message); return; }
    setPromptpayId(raw); setPPEditing(false);
  }

  function openEdit(p) {
    setEditForm({ name: p.name, price: p.price, team: p.team || "", size: p.size, grade: p.grade, category: p.category, description: p.description || "" });
    setEditProd(p);
  }

  async function handleSaveEdit() {
    if (!editForm.name?.trim() || !editForm.price) { alert("กรุณากรอกชื่อและราคา"); return; }
    setEditSaving(true);
    const { error } = await supabase.from("products").update({
      name:        editForm.name.trim(),
      price:       Number(editForm.price),
      team:        editForm.team.trim(),
      size:        editForm.size,
      grade:       editForm.grade,
      category:    editForm.category,
      description: editForm.description.trim(),
      status:      "pending",
    }).eq("id", editProd.id);
    setEditSaving(false);
    if (error) { alert("บันทึกไม่สำเร็จ: " + error.message); return; }
    setProducts(prev => prev.map(p => p.id === editProd.id ? { ...p, ...editForm, price: Number(editForm.price), status: "pending" } : p));
    setEditProd(null);
  }

  async function handleDelete(id) {
    if (!confirm("ลบสินค้านี้?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function handleShip(orderId) {
    const t = tracking[orderId]?.trim();
    const c = courier[orderId] || "thaipost";
    if (!t) { alert("กรุณากรอกเลข Tracking"); return; }
    setShipping(prev => ({ ...prev, [orderId]: true }));
    const { error } = await supabase.from("orders")
      .update({ status: "shipped", tracking_number: t, courier: c, shipped_at: new Date().toISOString() })
      .eq("id", orderId);
    setShipping(prev => ({ ...prev, [orderId]: false }));
    if (error) { alert("อัปเดตไม่สำเร็จ: " + error.message); return; }
    const ord = orders.find(o => o.id === orderId);
    if (ord?.buyer?.email) {
      fetch("/api/notify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "order_shipped", buyerEmail: ord.buyer.email, buyerName: ord.buyer.full_name || ord.shipping_name, productName: ord.product?.name || "สินค้า", orderId, trackingNumber: t, courier: c }),
      }).catch(() => {});
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "shipped", tracking_number: t, courier: c } : o));
  }

  if (loading) return <Spinner />;

  const pendingShip = orders.filter(o => o.status === "paid").length;
  const stats = [
    { label: "สินค้าทั้งหมด", value: products.length,                                                               accent: "#94a3b8" },
    { label: "รอจัดส่ง",      value: pendingShip,                                                                    accent: "#f59e0b" },
    { label: "ส่งแล้ว",       value: orders.filter(o => o.status === "shipped" || o.status === "completed").length, accent: "#3b82f6" },
    { label: "ขายสำเร็จ",     value: orders.filter(o => o.status === "completed").length,                           accent: "#16a34a" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Sarabun', sans-serif", fontSize: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        input, select, button, textarea { font-family: 'Sarabun', sans-serif; }
        button:focus-visible { outline: 2px solid #1e3a8a; outline-offset: 2px; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", padding: "0 32px", height: 64, display: "flex", alignItems: "center", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f172a", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <div className="rm-nav-links" style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
          <IconBtn href="/notifications" badge={unreadNotif} badgeColor="#dc2626">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </IconBtn>
          <IconBtn href="/messages" badge={unreadMsg} badgeColor="#1e3a8a">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </IconBtn>
          <a href="/sell" style={{ background: "#1e3a8a", color: "#fff", padding: "9px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            + เพิ่มสินค้า
          </a>
          <button onClick={async () => { await fetch("/api/signout", { method: "POST" }); window.location.href = "/"; }}
            style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "9px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            ออกจากระบบ
          </button>
        </div>
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
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={navUser} profile={profile} />
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Back link */}
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 14, fontWeight: 500, textDecoration: "none", marginBottom: 28 }}
          onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
          onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          กลับหน้าหลัก
        </a>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Dashboard
          </h1>
          <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>
            {profile?.full_name || profile?.email}
          </p>
        </div>

        {/* Stats row */}
        <div className="rm-g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px 22px", borderTop: `3px solid ${s.accent}` }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* PromptPay row */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>PromptPay รับเงิน</div>
          {ppEditing ? (
            <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
              <input value={ppNew} onChange={e => setPPNew(e.target.value.replace(/\D/g, ""))}
                maxLength={13} inputMode="numeric" placeholder="เบอร์โทร หรือเลขบัตรประชาชน" autoFocus
                style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none" }} />
              <button onClick={handleUpdatePP} disabled={ppSaving}
                style={{ background: "#15803d", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: ppSaving ? 0.6 : 1 }}>
                {ppSaving ? "..." : "บันทึก"}
              </button>
              <button onClick={() => { setPPEditing(false); setPPNew(promptpayId); }}
                style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                ยกเลิก
              </button>
            </div>
          ) : (
            <>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: promptpayId ? "#0f172a" : "#f59e0b", letterSpacing: promptpayId ? "0.04em" : 0 }}>
                {promptpayId || "ยังไม่ได้กรอก — กรุณาเพิ่มเพื่อรับเงิน"}
              </span>
              {promptpayId && <span style={{ background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>ตั้งค่าแล้ว</span>}
              <button onClick={() => { setPPEditing(true); setPPNew(promptpayId); }}
                style={{ background: "none", border: "1px solid #e5e7eb", color: "#374151", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                {promptpayId ? "แก้ไข" : "+ เพิ่ม"}
              </button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
          {[
            { key: "products", label: "สินค้าของฉัน", badge: 0 },
            { key: "orders",   label: "ออเดอร์",       badge: pendingShip },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "12px 24px", fontSize: 15, fontWeight: 600, border: "none", background: "none", cursor: "pointer", color: tab === t.key ? "#0f172a" : "#9ca3af", borderBottom: tab === t.key ? "2px solid #1e3a8a" : "2px solid transparent", marginBottom: -2, display: "flex", alignItems: "center", gap: 8, transition: "color 0.14s" }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{ background: "#dc2626", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "2px 7px", lineHeight: 1.4 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ===== PRODUCTS TAB ===== */}
        {tab === "products" && (() => {
          const PROD_TABS = [
            { key: "all",      label: "ทั้งหมด" },
            { key: "pending",  label: "รออนุมัติ" },
            { key: "approved", label: "อนุมัติแล้ว" },
            { key: "rejected", label: "ไม่ผ่าน" },
            { key: "sold",     label: "ขายแล้ว" },
          ];
          const filteredProds = prodStatusTab === "all" ? products : products.filter(p => p.status === prodStatusTab);
          return (
            <div>
              {products.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {PROD_TABS.map(t => {
                    const count = t.key === "all" ? products.length : products.filter(p => p.status === t.key).length;
                    if (t.key !== "all" && count === 0) return null;
                    const active = prodStatusTab === t.key;
                    return (
                      <button key={t.key} onClick={() => setProdStatusTab(t.key)}
                        style={{ padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all .14s",
                          borderColor: active ? "#0f172a" : "#e2e8f0",
                          background:  active ? "#0f172a" : "#fff",
                          color:       active ? "#fff"    : "#6b7280",
                        }}>
                        {t.label} <span style={{ opacity: 0.55, fontSize: 11, marginLeft: 2 }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                {products.length === 0 ? (
                  <div style={{ padding: "64px 24px", textAlign: "center" }}>
                    <p style={{ color: "#9ca3af", margin: "0 0 20px", fontSize: 15 }}>ยังไม่มีสินค้า</p>
                    <a href="/sell" style={{ background: "#1e3a8a", color: "#fff", padding: "11px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                      เพิ่มสินค้าแรก
                    </a>
                  </div>
                ) : filteredProds.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <p style={{ color: "#9ca3af", margin: 0, fontSize: 15 }}>ไม่มีสินค้าในหมวดนี้</p>
                  </div>
                ) : filteredProds.map((p, i) => {
                  const st = PROD_STATUS[p.status] || PROD_STATUS.pending;
                  return (
                    <div key={p.id} style={{ padding: "14px 20px", borderBottom: i < filteredProds.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                        : <div style={{ width: 54, height: 54, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{CAT_EMOJI[p.category] || "⚽"}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 3 }}>{p.team} · Size {p.size} · Grade {p.grade}</div>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em", flexShrink: 0 }}>฿{Number(p.price).toLocaleString()}</div>
                      <span style={{ background: st.bg, color: st.text, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>{st.label}</span>
                      {p.status !== "sold" && (
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => openEdit(p)}
                            style={{ background: "none", border: "1px solid #e5e7eb", color: "#374151", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                            แก้ไข
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            style={{ background: "none", border: "1px solid #fecaca", color: "#dc2626", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                            ลบ
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ===== ORDERS TAB ===== */}
        {tab === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {orders.length > 0 && (() => {
              const SELLER_ORD_TABS = [
                { key: "all",       label: "ทั้งหมด" },
                { key: "paid",      label: "รอจัดส่ง" },
                { key: "shipped",   label: "จัดส่งแล้ว" },
                { key: "completed", label: "สำเร็จ" },
                { key: "refunded",  label: "คืนเงิน" },
              ];
              return (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {SELLER_ORD_TABS.map(t => {
                    const count = t.key === "all" ? orders.length : orders.filter(o => o.status === t.key).length;
                    if (t.key !== "all" && count === 0) return null;
                    const active = orderStatusTab === t.key;
                    return (
                      <button key={t.key} onClick={() => setOrderStatusTab(t.key)}
                        style={{ padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all .14s",
                          borderColor: active ? "#0f172a" : "#e2e8f0",
                          background:  active ? "#0f172a" : "#fff",
                          color:       active ? "#fff"    : "#6b7280",
                        }}>
                        {t.label} <span style={{ opacity: 0.55, fontSize: 11, marginLeft: 2 }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {orders.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "64px 24px", textAlign: "center" }}>
                <p style={{ color: "#9ca3af", fontSize: 15, margin: 0 }}>ยังไม่มีออเดอร์</p>
              </div>
            ) : (orderStatusTab === "all" ? orders : orders.filter(o => o.status === orderStatusTab)).map(o => {
              const st = ORD_STATUS[o.status] || ORD_STATUS.pending_payment;
              return (
                <div key={o.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>

                  {/* Order header */}
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "monospace", letterSpacing: "0.06em" }}>#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>{new Date(o.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <span style={{ background: st.bg, color: st.text, fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 99 }}>{st.label}</span>
                  </div>

                  {/* Order body */}
                  <div className="rm-g2-form" style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 56, height: 56, borderRadius: 10, background: "#f1f5f9", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        {o.product?.image_url
                          ? <img src={o.product.image_url} alt={o.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : CAT_EMOJI[o.product?.category] || "⚽"
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{o.product?.name || "สินค้า"}</div>
                        <div style={{ fontSize: 19, fontWeight: 700, color: "#1e3a8a", marginTop: 4, letterSpacing: "-0.03em" }}>
                          ฿{Number(o.seller_amount || o.amount).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>หลังหักค่าธรรมเนียม 10%</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>ที่อยู่จัดส่ง</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{o.shipping_name}</div>
                      <div style={{ fontSize: 14, color: "#374151", marginTop: 2 }}>{o.shipping_phone}</div>
                      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginTop: 4 }}>{o.shipping_addr}</div>
                    </div>
                  </div>

                  {/* Order actions */}
                  <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {o.slip_url && (
                      <button onClick={() => setViewSlip(o.slip_url)}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e5e7eb", color: "#374151", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        ดูสลิป
                      </button>
                    )}

                    {o.status === "paid" && (
                      <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
                        <select value={courier[o.id] || "thaipost"} onChange={e => setCourier(prev => ({ ...prev, [o.id]: e.target.value }))}
                          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", cursor: "pointer", fontWeight: 500, fontFamily: "'Sarabun', sans-serif" }}>
                          <option value="thaipost">ไปรษณีย์ไทย / EMS</option>
                          <option value="kerry">Kerry Express</option>
                          <option value="flash">Flash Express</option>
                          <option value="jt">J&T Express</option>
                          <option value="dhl">DHL</option>
                          <option value="other">อื่นๆ</option>
                        </select>
                        <input value={tracking[o.id] || ""} onChange={e => setTracking(prev => ({ ...prev, [o.id]: e.target.value }))}
                          placeholder="เลข Tracking..."
                          style={{ flex: 1, minWidth: 160, padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none" }} />
                        <button onClick={() => handleShip(o.id)} disabled={shipping[o.id]}
                          style={{ padding: "9px 20px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: shipping[o.id] ? 0.6 : 1, whiteSpace: "nowrap" }}>
                          {shipping[o.id] ? "กำลังบันทึก..." : "ยืนยันจัดส่ง"}
                        </button>
                      </div>
                    )}

                    {o.status === "shipped" && o.tracking_number && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 16px" }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>จัดส่งแล้ว — รอผู้ซื้อยืนยัน</div>
                          <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "#1e40af", marginTop: 2 }}>{o.tracking_number}</div>
                        </div>
                      </div>
                    )}

                    {o.status === "completed" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", flex: 1, flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#15803d" }}>ผู้ซื้อได้รับสินค้าแล้ว</div>
                          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                            ยอดที่คุณจะได้รับ: <span style={{ fontWeight: 700, color: "#15803d" }}>฿{Number(o.seller_amount || o.amount).toLocaleString()}</span>
                          </div>
                        </div>
                        {o.payout_status === "confirmed" ? (
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "4px 12px", borderRadius: 99, display: "inline-block" }}>โอนเงินแล้ว ✓</span>
                            {o.paid_at && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{new Date(o.paid_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</div>}
                            {o.payout_slip_url && (
                              <button onClick={() => setViewSlip(o.payout_slip_url)}
                                style={{ marginTop: 8, background: "none", border: "1px solid #bbf7d0", color: "#15803d", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                ดูสลิปโอนเงิน
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#d97706", background: "#fef3c7", padding: "4px 12px", borderRadius: 99 }}>รอโอนเงิน</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editProd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setEditProd(null); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>แก้ไขสินค้า</h2>
            <p style={{ color: "#f59e0b", fontSize: 13, fontWeight: 500, margin: "0 0 20px" }}>⚠️ หลังบันทึก สินค้าจะถูกส่งให้ Admin ตรวจสอบอีกครั้ง</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <EField label="ชื่อสินค้า" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <EField label="ราคา (บาท)" value={editForm.price} onChange={v => setEditForm(p => ({ ...p, price: v.replace(/\D/g,"") }))} inputMode="numeric" />
                <EField label="ทีม/ลาย" value={editForm.team} onChange={v => setEditForm(p => ({ ...p, team: v }))} placeholder="เช่น Manchester United" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>ประเภท</label>
                  <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} style={selectStyle}>
                    <option value="football">เสื้อบอล</option>
                    <option value="basketball">เสื้อบาส</option>
                    <option value="retro">Retro</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ไซส์</label>
                  <select value={editForm.size} onChange={e => setEditForm(p => ({ ...p, size: e.target.value }))} style={selectStyle}>
                    {["XS","S","M","L","XL","XXL"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>เกรด</label>
                  <select value={editForm.grade} onChange={e => setEditForm(p => ({ ...p, grade: e.target.value }))} style={selectStyle}>
                    <option value="S">S — ใหม่/มือหนึ่ง</option>
                    <option value="A">A — ดีมาก</option>
                    <option value="B">B — ดี</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>รายละเอียด</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="บรรยายสินค้า..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Sarabun', sans-serif" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={handleSaveEdit} disabled={editSaving}
                style={{ flex: 1, padding: "12px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: editSaving ? 0.7 : 1 }}>
                {editSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button onClick={() => setEditProd(null)}
                style={{ padding: "12px 20px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip viewer */}
      {viewSlip && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setViewSlip(null)}>
          <img src={viewSlip} alt="slip" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

function IconBtn({ href, badge, badgeColor, children }) {
  return (
    <a href={href} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 8, border: "1px solid #e5e7eb", color: "#6b7280", textDecoration: "none" }}>
      {children}
      {badge > 0 && (
        <span style={{ position: "absolute", top: -4, right: -4, background: badgeColor, color: "#fff", borderRadius: "50%", fontSize: 10, fontWeight: 700, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </a>
  );
}

function EField({ label, value, onChange, placeholder, inputMode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fafafa", boxSizing: "border-box" }} />
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const selectStyle = { width: "100%", padding: "10px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", fontFamily: "'Sarabun', sans-serif" };

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
