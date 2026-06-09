"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PROD_STATUS_LABEL = { pending: "รออนุมัติ", approved: "อนุมัติแล้ว", rejected: "ไม่ผ่าน", sold: "ขายแล้ว" };
const PROD_STATUS_COLOR = {
  pending:  { bg: "#fef9c3", text: "#a16207" },
  approved: { bg: "#dcfce7", text: "#15803d" },
  rejected: { bg: "#fee2e2", text: "#dc2626" },
  sold:     { bg: "#e0e7ff", text: "#4338ca" },
};
const ORD_STATUS_LABEL = {
  pending_payment: "รอตรวจสลิป",
  paid:            "รอจัดส่ง",
  shipped:         "จัดส่งแล้ว",
  completed:       "สำเร็จ",
  refunded:        "คืนเงิน",
};
const ORD_STATUS_COLOR = {
  pending_payment: { bg: "#fef9c3", text: "#92400e" },
  paid:            { bg: "#e2e8f0", text: "#1e293b" },
  shipped:         { bg: "#e0e7ff", text: "#3730a3" },
  completed:       { bg: "#dcfce7", text: "#166534" },
  refunded:        { bg: "#f3f4f6", text: "#4b5563" },
};
const CAT_EMOJI = { football: "⚽", basketball: "🏀", retro: "🏆" };

export default function SellerDashboardPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [profile, setProfile]   = useState(null);
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
  const [payoutConfirming, setPayoutConfirming] = useState({});
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

      // นับข้อความที่ยังไม่ได้อ่าน
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .eq("seller_id", user.id);
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
    const { error } = await supabase
      .from("seller_verifications")
      .update({ promptpay_id: raw })
      .eq("user_id", profile.id);
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

  async function handleConfirmPayout(orderId) {
    setPayoutConfirming(prev => ({ ...prev, [orderId]: true }));
    await supabase.from("orders").update({ payout_status: "confirmed" }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payout_status: "confirmed" } : o));
    setPayoutConfirming(prev => ({ ...prev, [orderId]: false }));
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
        body: JSON.stringify({
          type:           "order_shipped",
          buyerEmail:     ord.buyer.email,
          buyerName:      ord.buyer.full_name || ord.shipping_name,
          productName:    ord.product?.name || "สินค้า",
          orderId:        orderId,
          trackingNumber: t,
          courier:        c,
        }),
      }).catch(() => {});
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "shipped", tracking_number: t, courier: c } : o));
  }

  if (loading) return <Spinner />;

  const stats = [
    { label: "สินค้าทั้งหมด", value: products.length,                                                          icon: "📦" },
    { label: "รอจัดส่ง",      value: orders.filter(o => o.status === "paid").length,                          icon: "🕐" },
    { label: "ส่งแล้ว",       value: orders.filter(o => o.status === "shipped" || o.status === "completed").length, icon: "🚚" },
    { label: "ขายสำเร็จ",     value: orders.filter(o => o.status === "completed").length,                     icon: "✅" },
  ];

  const pendingOrders = orders.filter(o => o.status === "paid");

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f3", fontFamily: "'Sarabun', sans-serif", fontSize: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        input, select, button, textarea { font-family: 'Sarabun', sans-serif; }
      `}</style>

      {/* Navbar */}
      <nav style={S.nav}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Bell */}
          <a href="/notifications" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", border: "1px solid #e5e7eb", color: "#6b7280", textDecoration: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadNotif > 0 && (
              <span style={{ position: "absolute", top: -2, right: -2, background: "#dc2626", color: "#fff", borderRadius: "50%", fontSize: 10, fontWeight: 700, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unreadNotif > 9 ? "9+" : unreadNotif}
              </span>
            )}
          </a>
          {/* Messages */}
          <a href="/messages" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", border: "1px solid #e5e7eb", color: "#6b7280", textDecoration: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {unreadMsg > 0 && (
              <span style={{ position: "absolute", top: -2, right: -2, background: "#1e3a8a", color: "#fff", borderRadius: "50%", fontSize: 10, fontWeight: 700, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unreadMsg > 9 ? "9+" : unreadMsg}
              </span>
            )}
          </a>
          <a href="/sell" style={{ background: "#1e3a8a", color: "#fff", padding: "10px 22px", borderRadius: 99, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            + เพิ่มสินค้า
          </a>
          <button onClick={async () => { try { await supabase.auth.signOut({ scope: 'local' }); } catch {} window.location.reload(); }} className="rm-nav-hide" style={S.logoutBtn}>
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        <BackLink href="/" label="กลับหน้าหลัก" />

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={S.heading}>Seller Dashboard</h1>
          <p style={{ color: "#6b7280", fontSize: 17, margin: 0 }}>
            ยินดีต้อนรับ, <span style={{ fontWeight: 600, color: "#374151" }}>{profile?.full_name || profile?.email}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="rm-g4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "24px 28px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: "#0f0f0e", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 15, color: "#6b7280", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* PromptPay card */}
        <div style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${promptpayId ? "#bbf7d0" : "#fde68a"}`, padding: "16px 24px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 40, height: 40, background: promptpayId ? "#f0fdf4" : "#fef9c3", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            {promptpayId ? "✅" : "⚠️"}
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>PromptPay สำหรับรับเงิน</div>
            {ppEditing ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <input value={ppNew} onChange={e => setPPNew(e.target.value.replace(/\D/g, ""))}
                  maxLength={13} inputMode="numeric" placeholder="เบอร์โทร / เลขบัตรประชาชน" autoFocus
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none" }} />
                <button onClick={handleUpdatePP} disabled={ppSaving}
                  style={{ background: "#15803d", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: ppSaving ? 0.6 : 1, whiteSpace: "nowrap" }}>
                  {ppSaving ? "..." : "บันทึก"}
                </button>
                <button onClick={() => { setPPEditing(false); setPPNew(promptpayId); }}
                  style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 16, fontWeight: 700, color: promptpayId ? "#0f172a" : "#d97706", letterSpacing: "0.05em" }}>
                {promptpayId || "ยังไม่ได้กรอก — กรุณาเพิ่มเพื่อรับเงิน"}
              </div>
            )}
          </div>
          {!ppEditing && (
            <button onClick={() => { setPPEditing(true); setPPNew(promptpayId); }}
              style={{ background: "none", border: "1px solid #e5e7eb", color: "#374151", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              {promptpayId ? "แก้ไข" : "+ เพิ่ม"}
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#fff", borderRadius: 14, padding: 5, border: "1px solid #e5e7eb", width: "fit-content" }}>
          {[
            { key: "products", label: "สินค้าของฉัน", badge: 0 },
            { key: "orders",   label: "ออเดอร์",       badge: pendingOrders.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "10px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, border: "none", background: tab === t.key ? "#0f0f0e" : "transparent", color: tab === t.key ? "#fff" : "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{ background: "#dc2626", color: "#fff", borderRadius: 99, fontSize: 12, fontWeight: 700, padding: "2px 8px" }}>{t.badge}</span>
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
            {/* Product status filter pills */}
            {products.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {PROD_TABS.map(t => {
                  const count = t.key === "all" ? products.length : products.filter(p => p.status === t.key).length;
                  if (t.key !== "all" && count === 0) return null;
                  const active = prodStatusTab === t.key;
                  const accentColor = { pending: "#d97706", approved: "#15803d", rejected: "#dc2626", sold: "#4338ca" }[t.key] || "#0f172a";
                  return (
                    <button key={t.key} onClick={() => setProdStatusTab(t.key)}
                      style={{ padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all .16s",
                        borderColor: active ? accentColor : "#e2e8f0",
                        background:  active ? accentColor : "#fff",
                        color:       active ? "#fff"       : "#6b7280",
                      }}>
                      {t.label}
                      <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {products.length === 0 ? (
              <div style={{ padding: "72px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>📦</div>
                <p style={{ color: "#6b7280", margin: "0 0 20px", fontSize: 17 }}>ยังไม่มีสินค้า</p>
                <a href="/sell" style={{ background: "#1e3a8a", color: "#fff", padding: "12px 28px", borderRadius: 99, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                  เพิ่มสินค้าแรก
                </a>
              </div>
            ) : filteredProds.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ color: "#6b7280", margin: 0, fontSize: 16 }}>ไม่มีสินค้าในหมวดนี้</p>
              </div>
            ) : filteredProds.map((p, i) => {
              const sc = PROD_STATUS_COLOR[p.status] || PROD_STATUS_COLOR.pending;
              return (
                <div key={p.id} style={{ padding: "20px 32px", borderBottom: i < products.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", gap: 18 }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: 68, height: 68, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 68, height: 68, borderRadius: 12, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{CAT_EMOJI[p.category] || "⚽"}</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{p.name}</div>
                    <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>{p.team} · Size {p.size} · Grade {p.grade}</div>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#111827", marginRight: 12, letterSpacing: "-0.5px" }}>฿{Number(p.price).toLocaleString()}</div>
                  <div style={{ background: sc.bg, color: sc.text, fontSize: 13, fontWeight: 700, padding: "5px 14px", borderRadius: 99, whiteSpace: "nowrap" }}>{PROD_STATUS_LABEL[p.status]}</div>
                  {p.status !== "sold" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(p)}
                        style={{ background: "none", border: "1px solid #e5e7eb", color: "#374151", padding: "7px 14px", borderRadius: 9, fontSize: 14, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                        แก้ไข
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        style={{ background: "none", border: "1px solid #fecaca", color: "#dc2626", padding: "7px 14px", borderRadius: 9, fontSize: 14, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Status filter tabs */}
            {orders.length > 0 && (() => {
              const SELLER_ORD_TABS = [
                { key: "all",       label: "ทั้งหมด" },
                { key: "paid",      label: "รอจัดส่ง" },
                { key: "shipped",   label: "จัดส่งแล้ว" },
                { key: "completed", label: "สำเร็จ" },
                { key: "disputed",  label: "มีปัญหา" },
                { key: "refunded",  label: "คืนเงิน" },
              ];
              return (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {SELLER_ORD_TABS.map(t => {
                    const count = t.key === "all" ? orders.length : orders.filter(o => o.status === t.key).length;
                    if (t.key !== "all" && count === 0) return null;
                    return (
                      <button key={t.key} onClick={() => setOrderStatusTab(t.key)}
                        style={{ padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all .16s",
                          borderColor: orderStatusTab === t.key ? "#0f172a" : "#e2e8f0",
                          background:  orderStatusTab === t.key ? "#0f172a" : "#fff",
                          color:       orderStatusTab === t.key ? "#fff"    : "#6b7280",
                        }}>
                        {t.label}
                        <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {orders.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", padding: "72px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
                <p style={{ color: "#6b7280", fontSize: 17, margin: 0 }}>ยังไม่มีออเดอร์</p>
              </div>
            ) : (orderStatusTab === "all" ? orders : orders.filter(o => o.status === orderStatusTab)).map(o => {
              const sc = ORD_STATUS_COLOR[o.status] || ORD_STATUS_COLOR.pending_payment;
              return (
                <div key={o.id} style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", overflow: "hidden" }}>

                  {/* Header */}
                  <div style={{ padding: "14px 28px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, color: "#9ca3af", fontWeight: 500 }}>
                      ออเดอร์ <span style={{ fontWeight: 700, color: "#374151", fontSize: 15 }}>#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span style={{ marginLeft: 14 }}>{new Date(o.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <span style={{ background: sc.bg, color: sc.text, fontSize: 13, fontWeight: 700, padding: "5px 16px", borderRadius: 99 }}>
                      {ORD_STATUS_LABEL[o.status] || o.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="rm-g2-form" style={{ padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    {/* Product */}
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 72, height: 72, borderRadius: 12, background: "#e2e8f0", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                        {o.product?.image_url
                          ? <img src={o.product.image_url} alt={o.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : CAT_EMOJI[o.product?.category] || "⚽"
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{o.product?.name || "สินค้า"}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#1e3a8a", marginTop: 4, letterSpacing: "-0.5px" }}>
                          ฿{Number(o.seller_amount || o.amount).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>หลังหักค่าธรรมเนียม 10%</div>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>ที่อยู่จัดส่ง</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{o.shipping_name}</div>
                      <div style={{ fontSize: 15, color: "#374151", marginTop: 2 }}>{o.shipping_phone}</div>
                      <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginTop: 4 }}>{o.shipping_addr}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ padding: "0 28px 24px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid #f3f4f6", paddingTop: 20, marginTop: 4 }}>
                    {o.slip_url && (
                      <button onClick={() => setViewSlip(o.slip_url)}
                        style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151", padding: "9px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline", marginRight:5, verticalAlign:"middle" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>ดูสลิป
                      </button>
                    )}

                    {o.status === "paid" && (
                      <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
                        <select
                          value={courier[o.id] || "thaipost"}
                          onChange={e => setCourier(prev => ({ ...prev, [o.id]: e.target.value }))}
                          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 15, outline: "none", background: "#fff", cursor: "pointer", fontWeight: 500 }}>
                          <option value="thaipost">ไปรษณีย์ไทย / EMS</option>
                          <option value="kerry">Kerry Express</option>
                          <option value="flash">Flash Express</option>
                          <option value="jt">J&T Express</option>
                          <option value="dhl">DHL</option>
                          <option value="other">อื่นๆ</option>
                        </select>
                        <input
                          value={tracking[o.id] || ""}
                          onChange={e => setTracking(prev => ({ ...prev, [o.id]: e.target.value }))}
                          placeholder="กรอกเลข Tracking..."
                          style={{ flex: 1, minWidth: 180, padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 15, outline: "none" }}
                        />
                        <button onClick={() => handleShip(o.id)} disabled={shipping[o.id]}
                          style={{ padding: "10px 22px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: shipping[o.id] ? 0.6 : 1, whiteSpace: "nowrap" }}>
                          {shipping[o.id] ? "กำลังบันทึก..." : "จัดส่งแล้ว ✓"}
                        </button>
                      </div>
                    )}

                    {o.status === "shipped" && o.tracking_number && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#eff6ff", border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 18px" }}>
                        <span style={{ fontSize: 18 }}>📦</span>
                        <div>
                          <div style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600 }}>จัดส่งแล้ว — รอผู้ซื้อยืนยัน</div>
                          <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#172554" }}>{o.tracking_number}</div>
                        </div>
                      </div>
                    )}

                    {o.status === "completed" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 18px", flex: 1, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 24 }}>✅</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d" }}>ผู้ซื้อได้รับสินค้าแล้ว</div>
                          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                            ยอดที่คุณจะได้รับ: <span style={{ fontWeight: 700, color: "#15803d" }}>฿{Number(o.seller_amount || o.amount).toLocaleString()}</span>
                          </div>
                        </div>
                        {o.payout_status === "confirmed" && (
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "4px 12px", borderRadius: 99, display: "inline-block" }}>โอนเงินแล้ว ✓</span>
                            {o.paid_at && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{new Date(o.paid_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</div>}
                            {o.payout_slip_url && (
                              <button onClick={() => setViewSlip(o.payout_slip_url)}
                                style={{ marginTop: 8, background: "none", border: "1px solid #bbf7d0", color: "#15803d", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline", marginRight:5, verticalAlign:"middle" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>ดูสลิปโอนเงิน
                              </button>
                            )}
                          </div>
                        )}
                        {(!o.payout_status || o.payout_status === "pending") && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "4px 12px", borderRadius: 99 }}>รอโอนเงิน</span>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setEditProd(null); }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", margin: "0 0 6px" }}>แก้ไขสินค้า</h2>
            <p style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600, margin: "0 0 24px" }}>⚠️ หลังบันทึก สินค้าจะถูกส่งให้ Admin ตรวจสอบอีกครั้ง</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <EField label="ชื่อสินค้า" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <EField label="ราคา (บาท)" value={editForm.price} onChange={v => setEditForm(p => ({ ...p, price: v.replace(/\D/g,"") }))} inputMode="numeric" />
                <EField label="ทีม/ลาย" value={editForm.team} onChange={v => setEditForm(p => ({ ...p, team: v }))} placeholder="เช่น Manchester United" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
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
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 15, outline: "none", background: "#fafafa", resize: "vertical", boxSizing: "border-box", fontFamily: "'Sarabun', sans-serif" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={handleSaveEdit} disabled={editSaving}
                style={{ flex: 1, padding: "13px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: editSaving ? 0.7 : 1 }}>
                {editSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button onClick={() => setEditProd(null)}
                style={{ padding: "13px 22px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 99, fontSize: 15, cursor: "pointer" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip modal */}
      {viewSlip && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setViewSlip(null)}>
          <img src={viewSlip} alt="slip" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 16, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

function EField({ label, value, onChange, placeholder, inputMode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 15, outline: "none", background: "#fafafa", boxSizing: "border-box" }} />
    </div>
  );
}
const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 };
const selectStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", cursor: "pointer", fontFamily: "'Sarabun', sans-serif" };

function BackLink({ href, label }) {
  return (
    <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 15, fontWeight: 600, textDecoration: "none", marginBottom: 20 }}
      onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
      onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      {label}
    </a>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f3" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  nav:       { position: "sticky", top: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", padding: "0 48px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 },
  logo:      { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" },
  logoutBtn: { background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "9px 18px", borderRadius: 99, fontSize: 14, cursor: "pointer", fontWeight: 600 },
  heading:   { fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: "#0f0f0e", margin: "0 0 8px" },
};
