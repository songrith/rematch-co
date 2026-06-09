"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

const VER_TABS  = ["pending", "approved", "rejected"];
const VER_LABEL = { pending: "รอตรวจสอบ", approved: "อนุมัติแล้ว", rejected: "ไม่ผ่าน" };
const PROD_TABS  = ["pending", "approved", "rejected"];
const PROD_LABEL = { pending: "รออนุมัติ", approved: "อนุมัติแล้ว", rejected: "ไม่ผ่าน" };
const CAT_LABEL  = { football: "เสื้อบอล", basketball: "เสื้อบาส", retro: "Retro" };

export default function AdminPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [loading, setLoading]   = useState(true);
  const [section, setSection]   = useState("disputes"); // disputes | sellers | products | payout

  const [lightbox, setLightbox] = useState(null); // url string when open

  // Sellers state
  const [verifications, setVerifications] = useState([]);
  const [verTab, setVerTab]   = useState("pending");
  const [selected, setSelected]     = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Products state
  const [products, setProducts]         = useState([]);
  const [prodTab, setProdTab]           = useState("pending");
  const [selectedProd, setSelectedProd] = useState(null);
  const [prodRejectReason, setProdRejectReason] = useState("");
  const [prodProcessing, setProdProcessing]     = useState(false);
  const [prodImgIdx, setProdImgIdx]             = useState(0);

  // Payout state
  const [payoutOrders, setPayoutOrders]     = useState([]);
  const [payoutTab, setPayoutTab]           = useState("pending");
  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [payoutSlipFiles, setPayoutSlipFiles]       = useState({});
  const [payoutVerifyResults, setPayoutVerifyResults] = useState({});

  // Disputes state
  const [disputeOrds, setDisputeOrds]       = useState([]);
  const [disputeTab, setDisputeTab]         = useState("disputed");
  const [disputeProcessing, setDisputeProcessing] = useState(false);
  const [denyModal, setDenyModal]           = useState(null);
  const [denyReason, setDenyReason]         = useState("");
  const [refundSlipFiles, setRefundSlipFiles]   = useState({});
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [refundModal, setRefundModal]           = useState(null); // order object

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") { router.push("/"); return; }
      await Promise.all([fetchVerifications(), fetchProducts(), fetchPayoutOrders(), fetchDisputeOrders()]);
      setLoading(false);
    }
    load();
  }, []);

  // ── Fetch verifications ───────────────────────────────────────
  async function fetchVerifications() {
    const { data: vers } = await supabase
      .from("seller_verifications")
      .select("*")
      .order("created_at", { ascending: true });
    if (!vers?.length) { setVerifications([]); return; }
    const ids = vers.map(v => v.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, address, subdistrict, district, province, postal_code")
      .in("id", ids);
    setVerifications(vers.map(v => ({ ...v, profile: profiles?.find(p => p.id === v.user_id) || {} })));
  }

  // ── Fetch payout orders ───────────────────────────────────────
  async function fetchPayoutOrders() {
    const { data: ords } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (!ords?.length) { setPayoutOrders([]); return; }

    const sellerIds  = [...new Set(ords.map(o => o.seller_id).filter(Boolean))];
    const productIds = [...new Set(ords.map(o => o.product_id).filter(Boolean))];

    const [{ data: sellers }, { data: prods }, { data: bankInfos }] = await Promise.all([
      sellerIds.length  ? supabase.from("profiles").select("id, full_name, email, phone").in("id", sellerIds) : { data: [] },
      productIds.length ? supabase.from("products").select("id, name, image_url").in("id", productIds) : { data: [] },
      sellerIds.length  ? supabase.from("seller_verifications").select("user_id, promptpay_id").in("user_id", sellerIds) : { data: [] },
    ]);

    setPayoutOrders(ords.map(o => ({
      ...o,
      seller:   sellers?.find(s => s.id === o.seller_id)   || {},
      product:  prods?.find(p => p.id === o.product_id)    || {},
      bankInfo: bankInfos?.find(b => b.user_id === o.seller_id) || {},
    })));
  }

  // ── Fetch products ────────────────────────────────────────────
  async function fetchProducts() {
    const { data: prods } = await supabase.from("products").select("*").order("created_at", { ascending: true });
    if (!prods?.length) { setProducts([]); return; }
    const ids = [...new Set(prods.map(p => p.seller_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    setProducts(prods.map(p => ({ ...p, seller: profiles?.find(pr => pr.id === p.seller_id) || {} })));
  }

  // ── Fetch disputes ────────────────────────────────────────────
  async function fetchDisputeOrders() {
    const [{ data: activeOrds }, { data: deniedOrds }] = await Promise.all([
      supabase.from("orders").select("*").in("status", ["disputed", "refunded"]).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("status", "completed").like("dispute_reason", "[DENIED]%").order("created_at", { ascending: false }),
    ]);
    const ords = [...(activeOrds || []), ...(deniedOrds || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (!ords.length) { setDisputeOrds([]); return; }

    const buyerIds   = [...new Set(ords.map(o => o.buyer_id).filter(Boolean))];
    const sellerIds  = [...new Set(ords.map(o => o.seller_id).filter(Boolean))];
    const productIds = [...new Set(ords.map(o => o.product_id).filter(Boolean))];

    const [{ data: buyers }, { data: sellers }, { data: prods }] = await Promise.all([
      buyerIds.length   ? supabase.from("profiles").select("id, full_name, email").in("id", buyerIds)   : { data: [] },
      sellerIds.length  ? supabase.from("profiles").select("id, full_name, email").in("id", sellerIds)  : { data: [] },
      productIds.length ? supabase.from("products").select("id, name, image_url").in("id", productIds)  : { data: [] },
    ]);

    setDisputeOrds(ords.map(o => ({
      ...o,
      buyer:   buyers?.find(b => b.id === o.buyer_id)    || {},
      seller:  sellers?.find(s => s.id === o.seller_id)  || {},
      product: prods?.find(p => p.id === o.product_id)   || {},
    })));
  }

  // ── Dispute actions ───────────────────────────────────────────
  async function handleApproveRefund(o) {
    if (!confirm(`อนุมัติ Refund ออเดอร์ #${o.id.slice(0,8).toUpperCase()}?`)) return;
    setDisputeProcessing(true);
    await supabase.from("orders").update({ status: "refunded", payout_status: "refunded" }).eq("id", o.id);
    if (o.product_id) {
      await supabase.from("products").update({ status: "approved" }).eq("id", o.product_id);
    }
    setDisputeProcessing(false);
    await fetchDisputeOrders();
  }

  async function handleDenyRefund() {
    if (!denyReason.trim()) { alert("กรุณาระบุเหตุผล"); return; }
    const o = denyModal;
    setDisputeProcessing(true);
    await supabase.from("orders").update({ status: "completed", dispute_reason: `[DENIED] ${denyReason.trim()}` }).eq("id", o.id);
    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        "dispute_denied",
        orderId:     o.id,
        buyerId:     o.buyer_id,
        buyerName:   o.shipping_name,
        productName: o.product?.name || "สินค้า",
        denyReason:  denyReason.trim(),
      }),
    }).catch(() => {});
    setDisputeProcessing(false);
    setDenyModal(null);
    setDenyReason("");
    await fetchDisputeOrders();
  }

  async function handleConfirmRefund(o) {
    const file = refundSlipFiles[o.id];
    if (!file) { alert("กรุณาเลือกสลิปการโอนเงิน"); return; }
    setRefundProcessing(true);
    const ext  = file.name.split(".").pop();
    const path = `refund/${o.id}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("slips").upload(path, file, { upsert: true });
    if (upErr) { alert("อัปโหลดสลิปไม่สำเร็จ: " + upErr.message); setRefundProcessing(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("slips").getPublicUrl(path);
    await supabase.from("orders").update({ refund_slip_url: publicUrl, refund_confirmed_at: new Date().toISOString() }).eq("id", o.id);
    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        "refund_confirmed",
        orderId:     o.id,
        buyerId:     o.buyer_id,
        buyerName:   o.shipping_name,
        productName: o.product?.name || "สินค้า",
        amount:      o.amount,
        slipUrl:     publicUrl,
      }),
    }).catch(() => {});
    setRefundProcessing(false);
    setRefundModal(null);
    setRefundSlipFiles(prev => { const n = { ...prev }; delete n[o.id]; return n; });
    await fetchDisputeOrders();
  }

  // ── Seller actions ────────────────────────────────────────────
  async function handleApprove(v) {
    setProcessing(true);
    await Promise.all([
      supabase.from("seller_verifications").update({ status: "approved" }).eq("id", v.id),
      supabase.from("profiles").update({ role: "seller" }).eq("id", v.user_id),
    ]);
    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "seller_approved", sellerEmail: v.profile?.email, sellerName: v.profile?.full_name }),
    }).catch(() => {});
    setSelected(null); setProcessing(false);
    await fetchVerifications();
  }

  async function handleReject(v) {
    if (!rejectReason.trim()) { alert("กรุณาระบุเหตุผล"); return; }
    setProcessing(true);
    await supabase.from("seller_verifications").update({ status: "rejected", reject_reason: rejectReason }).eq("id", v.id);
    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "seller_rejected", sellerEmail: v.profile?.email, sellerName: v.profile?.full_name, rejectReason }),
    }).catch(() => {});
    setSelected(null); setRejectReason(""); setProcessing(false);
    await fetchVerifications();
  }

  // ── Payout action ─────────────────────────────────────────────
  async function handleSelectPayoutSlip(order, file) {
    setPayoutSlipFiles(prev => ({ ...prev, [order.id]: file }));
    setPayoutVerifyResults(prev => ({ ...prev, [order.id]: { status: "verifying" } }));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("seller_amount", order.seller_amount ?? Math.floor(order.amount * 0.9));
    try {
      const res  = await fetch("/api/verify-payout-slip", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        setPayoutVerifyResults(prev => ({ ...prev, [order.id]: { status: "ok", data } }));
      } else {
        setPayoutVerifyResults(prev => ({ ...prev, [order.id]: { status: "error", error: data.error } }));
      }
    } catch (err) {
      setPayoutVerifyResults(prev => ({ ...prev, [order.id]: { status: "error", error: err.message } }));
    }
  }

  async function handleMarkPaid(order) {
    setPayoutProcessing(true);
    const file = payoutSlipFiles[order.id];
    if (!file) { setPayoutProcessing(false); return; }
    const ext  = file.name.split(".").pop();
    const path = `payout/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("slips").upload(path, file, { upsert: true });
    if (uploadErr) { alert("อัปโหลดสลิปไม่สำเร็จ: " + uploadErr.message); setPayoutProcessing(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("slips").getPublicUrl(path);
    await supabase.from("orders").update({ payout_status: "confirmed", paid_at: new Date().toISOString(), payout_slip_url: publicUrl }).eq("id", order.id);
    setPayoutProcessing(false);
    setPayoutSlipFiles(prev => { const n = { ...prev }; delete n[order.id]; return n; });
    setPayoutVerifyResults(prev => { const n = { ...prev }; delete n[order.id]; return n; });
    await fetchPayoutOrders();
  }

  // ── Product actions ───────────────────────────────────────────
  async function handleApproveProd(p) {
    setProdProcessing(true);
    await supabase.from("products").update({ status: "approved" }).eq("id", p.id);
    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "product_approved", sellerEmail: p.seller?.email, sellerName: p.seller?.full_name, productName: p.name }),
    }).catch(() => {});
    setSelectedProd(null); setProdProcessing(false);
    await fetchProducts();
  }

  async function handleRejectProd(p) {
    if (!prodRejectReason.trim()) { alert("กรุณาระบุเหตุผล"); return; }
    setProdProcessing(true);
    await supabase.from("products").update({ status: "rejected", reject_reason: prodRejectReason }).eq("id", p.id);
    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "product_rejected", sellerEmail: p.seller?.email, sellerName: p.seller?.full_name, productName: p.name, rejectReason: prodRejectReason }),
    }).catch(() => {});
    setSelectedProd(null); setProdRejectReason(""); setProdProcessing(false);
    await fetchProducts();
  }

  if (loading) return <Spinner />;

  const filteredVer  = verifications.filter(v => v.status === verTab);
  const filteredProd = products.filter(p => p.status === prodTab);

  const sections = [
    { key: "disputes", label: "คำร้องเรียน",     badge: disputeOrds.filter(o => o.status === "disputed").length,         color: "#dc2626" },
    { key: "sellers",  label: "อนุมัติ Seller",  badge: verifications.filter(v => v.status === "pending").length,        color: "#fbbf24" },
    { key: "products", label: "อนุมัติสินค้า",   badge: products.filter(p => p.status === "pending").length,             color: "#fbbf24" },
    { key: "payout",   label: "โอนเงิน Seller",  badge: payoutOrders.filter(o => o.payout_status === "pending" || o.payout_status === "transferred").length,  color: "#059669" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <nav style={S.nav}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span> <span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af", marginLeft: 8 }}>Admin</span></a>
        <button onClick={async () => { try { await supabase.auth.signOut({ scope: 'local' }); } catch {} window.location.reload(); }} style={S.logoutBtn}>ออกจากระบบ</button>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        <BackLink href="/" label="กลับหน้าหลัก" />
        <h1 style={S.heading}>Admin Panel</h1>

        {/* Section switcher */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, background: "#fff", borderRadius: 12, padding: 4, border: "1px solid #e2e8f0", width: "fit-content" }}>
          {sections.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              style={{ padding: "8px 20px", borderRadius: 9, fontSize: 14, fontWeight: 600, border: "none", background: section === s.key ? "#0f0f0e" : "transparent", color: section === s.key ? "#fff" : "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {s.label}
              {s.badge > 0 && <span style={{ background: section === s.key ? s.color : s.color, color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{s.badge}</span>}
            </button>
          ))}
        </div>

        {/* ===== DISPUTES SECTION ===== */}
        {section === "disputes" && (() => {
          const pending  = disputeOrds.filter(o => o.status === "disputed").length;
          const resolved = disputeOrds.filter(o => o.status === "refunded").length;
          const denied   = disputeOrds.filter(o => o.status === "completed" && o.dispute_reason?.startsWith("[DENIED]")).length;
          const filtered = disputeTab === "denied"
            ? disputeOrds.filter(o => o.status === "completed" && o.dispute_reason?.startsWith("[DENIED]"))
            : disputeOrds.filter(o => o.status === disputeTab);

          function parseReason(raw) {
            if (!raw) return {};
            const typeMatch   = raw.match(/^\[([^\]]+)\]/);
            const bodyMatch   = raw.match(/^\[[^\]]+\]\s*(.+?)(?:\s*\||\s*$)/);
            const damageMatch = raw.match(/ความเสียหาย:\s*([^|]+)/);
            const evidMatch   = raw.match(/หลักฐาน:\s*([^|]+)/);
            const imgsMatch   = raw.match(/รูปภาพ:\s*([^|]+)/);
            const reqMatch    = raw.match(/คำขอ:\s*([^|]+)/);
            const imgs = imgsMatch ? imgsMatch[1].trim().split(",").map(s => s.trim()).filter(Boolean) : [];
            return {
              type:     typeMatch?.[1]   || "",
              body:     bodyMatch?.[1]?.trim() || raw,
              damage:   damageMatch?.[1]?.trim() || "",
              evidence: evidMatch?.[1]?.trim()  || "",
              images:   imgs,
              request:  reqMatch?.[1]?.trim()   || "",
            };
          }

          return (
            <>
              {/* KPI row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>
                <div style={{ background: pending > 0 ? "#fff1f2" : "#fff", borderRadius: 16, border: `1.5px solid ${pending > 0 ? "#fecaca" : "#e2e8f0"}`, padding: "22px 24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: pending > 0 ? "#dc2626" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>รอตรวจสอบ</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: pending > 0 ? "#dc2626" : "#0f172a", lineHeight: 1 }}>{pending}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>ยังไม่ได้ดำเนินการ</div>
                </div>
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "22px 24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>คืนเงินแล้ว</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{resolved}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>อนุมัติ Refund แล้ว</div>
                </div>
                <div style={{ background: denied > 0 ? "#fafafa" : "#fff", borderRadius: 16, border: `1.5px solid ${denied > 0 ? "#d1d5db" : "#e2e8f0"}`, padding: "22px 24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>ปฏิเสธแล้ว</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "#374151", lineHeight: 1 }}>{denied}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>คำร้องที่ถูกปฏิเสธ</div>
                </div>
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "22px 24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>ทั้งหมด</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{disputeOrds.length}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>คำร้องสะสม</div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {[
                  { key: "disputed", label: "รอตรวจสอบ",  count: pending,  activeColor: "#dc2626" },
                  { key: "refunded", label: "คืนเงินแล้ว", count: resolved, activeColor: "#0f172a" },
                  { key: "denied",   label: "ถูกปฏิเสธ",   count: denied,   activeColor: "#374151" },
                ].map(t => (
                  <button key={t.key} onClick={() => setDisputeTab(t.key)}
                    style={{ padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all .15s",
                      borderColor: disputeTab === t.key ? t.activeColor : "#e5e7eb",
                      background:  disputeTab === t.key ? t.activeColor : "#fff",
                      color:       disputeTab === t.key ? "#fff" : "#6b7280" }}>
                    {t.label} <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 11 }}>{t.count}</span>
                  </button>
                ))}
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {filtered.length === 0 ? (
                  <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #e2e8f0", padding: "64px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>ไม่มีคำร้องที่รอดำเนินการ</div>
                    <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>คำร้องใหม่จะปรากฏที่นี่</div>
                  </div>
                ) : filtered.map(o => {
                  const isDenied = o.status === "completed" && o.dispute_reason?.startsWith("[DENIED]");
                  const d = parseReason(isDenied ? "" : o.dispute_reason);
                  const isOpen = o.status === "disputed";
                  const topBg = isOpen ? "linear-gradient(90deg,#b91c1c,#dc2626)" : isDenied ? "linear-gradient(90deg,#374151,#1f2937)" : "#f8fafc";
                  const borderColor = isOpen ? "#fecaca" : isDenied ? "#d1d5db" : "#e2e8f0";
                  return (
                    <div key={o.id} style={{ background: "#fff", borderRadius: 20, border: `1.5px solid ${borderColor}`, overflow: "hidden", boxShadow: isOpen ? "0 4px 24px rgba(220,38,38,.07)" : "0 1px 4px rgba(0,0,0,.04)" }}>

                      {/* Coloured top bar */}
                      <div style={{ padding: "11px 24px", background: topBg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {isDenied
                            ? <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>✕ ปฏิเสธคำร้อง</span>
                            : <>
                                {d.type && <span style={{ fontSize: 13, fontWeight: 700, color: isOpen ? "#fff" : "#6b7280" }}>{d.type}</span>}
                                {d.request && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99, background: isOpen ? "rgba(255,255,255,.18)" : "#e2e8f0", color: isOpen ? "#fff" : "#374151", border: isOpen ? "1px solid rgba(255,255,255,.25)" : "1px solid #e2e8f0" }}>{d.request}</span>}
                                {isOpen && <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,.2)", color: "#fff", padding: "2px 9px", borderRadius: 99 }}>⚠️ รอตรวจสอบ</span>}
                              </>
                          }
                        </div>
                        <span style={{ fontSize: 11, color: (isOpen || isDenied) ? "rgba(255,255,255,.65)" : "#9ca3af" }}>
                          {new Date(o.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div style={{ padding: "22px 24px 0" }}>
                        {/* Order ID + amount */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>ออเดอร์</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>#{o.id.slice(0, 8).toUpperCase()}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>มูลค่า</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#1e3a8a", letterSpacing: "-0.5px" }}>฿{Number(o.amount).toLocaleString()}</div>
                          </div>
                        </div>

                        {/* 3-col: product / buyer / seller */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, paddingBottom: 20, borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>สินค้า</div>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f1f5f9", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                                {o.product?.image_url ? <img src={o.product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "⚽"}
                              </div>
                              <span style={{ fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>{o.product?.name || "—"}</span>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>ผู้ซื้อ</div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{o.shipping_name || o.buyer?.full_name || "—"}</div>
                            <div style={{ color: "#6b7280", marginTop: 2 }}>{o.buyer?.email}</div>
                            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 1 }}>{o.shipping_phone}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Seller</div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{o.seller?.full_name || "—"}</div>
                            <div style={{ color: "#6b7280", marginTop: 2 }}>{o.seller?.email}</div>
                          </div>
                        </div>

                        {/* Claim body / Denial reason */}
                        <div style={{ padding: "20px 0", borderBottom: d.images?.length ? "1px solid #f1f5f9" : "none" }}>
                          {isDenied ? (
                            <>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>เหตุผลที่ปฏิเสธ</div>
                              <blockquote style={{ margin: 0, padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "3px solid #374151", borderRadius: "0 10px 10px 0", fontSize: 14, color: "#374151", lineHeight: 1.75 }}>
                                {o.dispute_reason.replace(/^\[DENIED\]\s*/, "")}
                              </blockquote>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>รายละเอียดคำร้อง</div>
                              {d.body && (
                                <blockquote style={{ margin: "0 0 12px", padding: "14px 16px", background: "#fafafa", border: "1px solid #f1f5f9", borderLeft: "3px solid #dc2626", borderRadius: "0 10px 10px 0", fontSize: 14, color: "#374151", lineHeight: 1.75 }}>
                                  {d.body}
                                </blockquote>
                              )}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {d.damage && (
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "5px 12px" }}>
                                    💰 ความเสียหาย: {d.damage}
                                  </div>
                                )}
                                {d.evidence && d.evidence.split(",").map((ev, i) => (
                                  <span key={i} style={{ fontSize: 12, color: "#374151", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 12px" }}>
                                    📎 {ev.trim()}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Evidence images */}
                        {d.images?.length > 0 && (
                          <div style={{ padding: "20px 0" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                              รูปหลักฐาน <span style={{ fontSize: 10, fontWeight: 500 }}>({d.images.length} รูป)</span>
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              {d.images.map((url, i) => (
                                <div key={i} onClick={() => setLightbox(url)}
                                  style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", border: "1.5px solid #e2e8f0", cursor: "zoom-in", flexShrink: 0 }}>
                                  <img src={url} alt={`หลักฐาน ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .2s" }}
                                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Refund transfer panel (refunded orders only) */}
                      {!isOpen && !isDenied && (
                        <div style={{ padding: "20px 0 4px", borderTop: "1px solid #f1f5f9" }}>
                          {o.refund_slip_url ? (
                            /* ─ Already transferred ─ */
                            <>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>หลักฐานการโอนเงินคืน</div>
                              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                <img src={o.refund_slip_url} alt="refund slip" onClick={() => setLightbox(o.refund_slip_url)}
                                  style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 12, border: "1.5px solid #bbf7d0", cursor: "zoom-in", flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d" }}>✅ โอนเงินคืนสำเร็จ</div>
                                  {o.refund_confirmed_at && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                                    โอนเมื่อ {new Date(o.refund_confirmed_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </div>}
                                  {o.refund_promptpay && <div style={{ fontSize: 12, color: "#374151", marginTop: 3 }}>PromptPay: <span style={{ fontWeight: 700 }}>{o.refund_promptpay}</span></div>}
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d", marginTop: 6 }}>฿{Number(o.amount).toLocaleString()}</div>
                                </div>
                              </div>
                            </>
                          ) : o.refund_promptpay ? null : (
                            /* ─ No PromptPay yet ─ */
                            <>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>PromptPay ผู้ซื้อ</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f9fafb", border: "1px dashed #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
                                <span style={{ fontSize: 18 }}>⏳</span>
                                <span style={{ fontSize: 13, color: "#9ca3af" }}>รอผู้ซื้อกรอก PromptPay</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Action footer */}
                      {isOpen ? (
                        <div style={{ padding: "18px 24px", background: "#fafafa", borderTop: "1px solid #f1f5f9", display: "flex", gap: 12 }}>
                          <button onClick={() => handleApproveRefund(o)} disabled={disputeProcessing}
                            style={{ flex: 1, padding: "13px", background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: disputeProcessing ? "not-allowed" : "pointer", opacity: disputeProcessing ? 0.6 : 1 }}>
                            ✓ อนุมัติ Refund
                          </button>
                          <button onClick={() => { setDenyModal(o); setDenyReason(""); }} disabled={disputeProcessing}
                            style={{ flex: 1, padding: "13px", background: "#fff", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: disputeProcessing ? "not-allowed" : "pointer", opacity: disputeProcessing ? 0.6 : 1 }}>
                            ✕ ปฏิเสธคำร้อง
                          </button>
                        </div>
                      ) : isDenied ? (
                        <div style={{ padding: "14px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>✕ ปฏิเสธคำร้องแล้ว</span>
                        </div>
                      ) : o.refund_slip_url ? (
                        /* Refund confirmed — minimal green footer */
                        <div style={{ padding: "14px 24px", background: "#f0fdf4", borderTop: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>✅ โอนเงินคืนเรียบร้อยแล้ว</span>
                        </div>
                      ) : o.refund_promptpay ? (
                        /* Has PromptPay — button opens modal */
                        <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
                          <button onClick={() => setRefundModal(o)}
                            style={{ padding: "11px 24px", background: "linear-gradient(135deg,#15803d,#166534)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 10px rgba(21,128,61,.3)" }}>
                            💸 โอนเงินให้ผู้ซื้อ →
                          </button>
                        </div>
                      ) : (
                        /* No PromptPay yet */
                        <div style={{ padding: "14px 24px", background: "#fafafa", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "#9ca3af" }}>⏳ รอผู้ซื้อกรอก PromptPay</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* ===== SELLERS SECTION ===== */}
        {section === "sellers" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              {VER_TABS.map(t => (
                <div key={t} onClick={() => setVerTab(t)}
                  style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", cursor: "pointer", outline: verTab === t ? "2px solid #1e3a8a" : "none" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e" }}>{verifications.filter(v => v.status === t).length}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{VER_LABEL[t]}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {VER_TABS.map(t => (
                <button key={t} onClick={() => setVerTab(t)}
                  style={{ padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 500, border: `1px solid ${verTab === t ? "#0f0f0e" : "#e5e7eb"}`, background: verTab === t ? "#0f0f0e" : "#fff", color: verTab === t ? "#fff" : "#6b7280", cursor: "pointer" }}>
                  {VER_LABEL[t]} ({verifications.filter(v => v.status === t).length})
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredVer.length === 0 ? <EmptyState /> : filteredVer.map(v => (
                <div key={v.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f0f0e" }}>{v.profile.full_name || "—"}</div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{v.profile.email}</div>
                    </div>
                    <div>
                      {v.status === "pending" && <button onClick={() => { setSelected(v); setRejectReason(""); }} style={{ background: "#1e3a8a", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>ตรวจสอบ →</button>}
                      {v.status === "approved" && <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>✓ Seller แล้ว</span>}
                      {v.status === "rejected" && <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>✗ ปฏิเสธแล้ว</span>}
                    </div>
                  </div>
                  <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, fontSize: 13 }}>
                    <div>
                      <div style={{ color: "#9ca3af", marginBottom: 4 }}>ธนาคาร</div>
                      <div style={{ fontWeight: 600 }}>{v.bank_name}</div>
                      <div style={{ color: "#374151", marginTop: 2 }}>{v.bank_account}</div>
                      <div style={{ color: "#374151" }}>{v.bank_account_name}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9ca3af", marginBottom: 4 }}>ที่อยู่</div>
                      <div style={{ color: "#374151", lineHeight: 1.6 }}>{[v.profile.address, v.profile.subdistrict, v.profile.district, v.profile.province, v.profile.postal_code].filter(Boolean).join(" ") || "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9ca3af", marginBottom: 4 }}>บัตรประชาชน</div>
                      {v.id_card_url ? <a href={v.id_card_url} target="_blank" rel="noreferrer"><img src={v.id_card_url} alt="ID card" style={{ width: "100%", maxWidth: 140, borderRadius: 8, objectFit: "cover", cursor: "pointer" }} /></a> : <span style={{ color: "#9ca3af" }}>ไม่มีรูป</span>}
                    </div>
                    <div>
                      <div style={{ color: "#9ca3af", marginBottom: 4 }}>Selfie ถือบัตร</div>
                      {v.selfie_url ? <a href={v.selfie_url} target="_blank" rel="noreferrer"><img src={v.selfie_url} alt="selfie" style={{ width: "100%", maxWidth: 140, borderRadius: 8, objectFit: "cover", cursor: "pointer" }} /></a> : <span style={{ color: "#9ca3af" }}>ไม่มีรูป</span>}
                    </div>
                  </div>
                  {v.status === "rejected" && v.reject_reason && <div style={{ margin: "0 24px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>เหตุผล: {v.reject_reason}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== PAYOUT SECTION ===== */}
        {section === "payout" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { key: "pending",   label: "รอโอนเงิน" },
                { key: "confirmed", label: "โอนแล้ว (ตรวจสลิปผ่าน)" },
              ].map(t => (
                <div key={t.key} onClick={() => setPayoutTab(t.key)}
                  style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", cursor: "pointer", outline: payoutTab === t.key ? "2px solid #1e3a8a" : "none" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e" }}>{payoutOrders.filter(o => o.payout_status === t.key).length}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{t.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { key: "pending",   label: "รอโอนเงิน" },
                { key: "confirmed", label: "โอนแล้ว" },
              ].map(t => (
                <button key={t.key} onClick={() => setPayoutTab(t.key)}
                  style={{ padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 500, border: `1px solid ${payoutTab === t.key ? "#0f0f0e" : "#e5e7eb"}`, background: payoutTab === t.key ? "#0f0f0e" : "#fff", color: payoutTab === t.key ? "#fff" : "#6b7280", cursor: "pointer" }}>
                  {t.label} ({payoutOrders.filter(o => o.payout_status === t.key).length})
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {payoutOrders.filter(o => o.payout_status === payoutTab).length === 0 ? <EmptyState /> :
                payoutOrders.filter(o => o.payout_status === payoutTab).map(o => (
                  <div key={o.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div style={{ padding: "14px 24px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                        #{o.id.slice(0, 8).toUpperCase()}
                        <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 10, fontSize: 12 }}>
                          {new Date(o.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      {o.payout_status === "pending"   && <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "3px 10px", borderRadius: 99 }}>รอโอนเงิน</span>}
                      {o.payout_status === "confirmed" && <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "3px 10px", borderRadius: 99 }}>ตรวจสลิปผ่าน ✓</span>}
                    </div>

                    <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, fontSize: 13, alignItems: "start" }}>
                      {/* Product */}
                      <div>
                        <div style={{ color: "#9ca3af", marginBottom: 6 }}>สินค้า</div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: "#e2e8f0", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                            {o.product?.image_url ? <img src={o.product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "⚽"}
                          </div>
                          <div style={{ fontWeight: 600, color: "#0f0f0e" }}>{o.product?.name || "—"}</div>
                        </div>
                      </div>

                      {/* Seller + QR */}
                      <div>
                        <div style={{ color: "#9ca3af", marginBottom: 6 }}>Seller</div>
                        <div style={{ fontWeight: 600, color: "#0f0f0e", marginBottom: 2 }}>{o.seller?.full_name || o.seller?.email || "—"}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{o.seller?.email}</div>
                        <PayoutQR
                          promptpayId={o.bankInfo?.promptpay_id}
                          phone={o.seller?.phone}
                          amount={o.seller_amount ?? Math.floor(o.amount * 0.9)}
                        />
                      </div>

                      {/* Amount + Action */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#9ca3af", marginBottom: 6 }}>ยอดโอน (90%)</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 800, color: "#15803d", letterSpacing: "-0.5px", marginBottom: 10 }}>
                          ฿{Number(o.seller_amount ?? Math.floor(o.amount * 0.9)).toLocaleString()}
                        </div>
                        {o.payout_status === "pending" && (() => {
                          const vr = payoutVerifyResults[o.id];
                          return (
                            <div>
                              <label style={{ cursor: "pointer", display: "block", marginBottom: 8 }}>
                                <input type="file" accept="image/*" style={{ display: "none" }}
                                  onChange={e => { if (e.target.files[0]) handleSelectPayoutSlip(o, e.target.files[0]); e.target.value = ""; }} />
                                <span style={{ fontSize: 12, fontWeight: 600, display: "block", textAlign: "center", padding: "7px 14px", borderRadius: 8, border: `1px dashed ${vr?.status === "ok" ? "#86efac" : "#c7d2fe"}`, background: vr?.status === "ok" ? "#f0fdf4" : "#eef2ff", color: vr?.status === "ok" ? "#15803d" : "#4f46e5" }}>
                                  {payoutSlipFiles[o.id] ? payoutSlipFiles[o.id].name.slice(0, 20) : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline", marginRight:5, verticalAlign:"middle" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>เลือกสลิปโอนเงิน</>}
                                </span>
                              </label>
                              {vr?.status === "verifying" && <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", marginBottom: 8 }}>⏳ กำลังตรวจสอบ...</div>}
                              {vr?.status === "ok" && (
                                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 8 }}>
                                  <div style={{ fontWeight: 700, color: "#15803d" }}>✓ สลิปถูกต้อง</div>
                                  {vr.data.amount !== undefined && <div style={{ color: "#374151" }}>฿{Number(vr.data.amount).toLocaleString()}</div>}
                                  {vr.data.transRef && <div style={{ color: "#6b7280" }}>Ref: {vr.data.transRef}</div>}
                                  {vr.data.receiverName && <div style={{ color: "#6b7280" }}>ผู้รับ: {vr.data.receiverName}</div>}
                                </div>
                              )}
                              {vr?.status === "error" && (
                                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626", marginBottom: 8 }}>
                                  ✗ {vr.error}
                                </div>
                              )}
                              <button onClick={() => handleMarkPaid(o)} disabled={payoutProcessing || vr?.status !== "ok"}
                                style={{ background: vr?.status === "ok" ? "#15803d" : "#9ca3af", color: "#fff", border: "none", padding: "9px 0", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: vr?.status === "ok" ? "pointer" : "not-allowed", width: "100%" }}>
                                {payoutProcessing ? "กำลังบันทึก..." : "ยืนยันโอนแล้ว ✓"}
                              </button>
                            </div>
                          );
                        })()}
                        {o.payout_status === "confirmed" && (
                          <div>
                            {o.paid_at && <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>โอน {new Date(o.paid_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</div>}
                            {o.payout_slip_url && (
                              <img src={o.payout_slip_url} alt="payout slip" onClick={() => setLightbox(o.payout_slip_url)}
                                style={{ width: "100%", maxWidth: 100, borderRadius: 8, objectFit: "cover", cursor: "zoom-in", border: "1px solid #bbf7d0", display: "block", marginLeft: "auto" }} />
                            )}
                            {o.payout_status === "confirmed" && <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600, marginTop: 6, textAlign: "right" }}>Seller ยืนยันแล้ว ✓</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </>
        )}

        {/* ===== PRODUCTS SECTION ===== */}
        {section === "products" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              {PROD_TABS.map(t => (
                <div key={t} onClick={() => setProdTab(t)}
                  style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", cursor: "pointer", outline: prodTab === t ? "2px solid #1e3a8a" : "none" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e" }}>{products.filter(p => p.status === t).length}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{PROD_LABEL[t]}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {PROD_TABS.map(t => (
                <button key={t} onClick={() => setProdTab(t)}
                  style={{ padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 500, border: `1px solid ${prodTab === t ? "#0f0f0e" : "#e5e7eb"}`, background: prodTab === t ? "#0f0f0e" : "#fff", color: prodTab === t ? "#fff" : "#6b7280", cursor: "pointer" }}>
                  {PROD_LABEL[t]} ({products.filter(p => p.status === t).length})
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredProd.length === 0 ? <EmptyState /> : filteredProd.map(p => (
                <div key={p.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 72, height: 72, borderRadius: 12, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>⚽</div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f0f0e" }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{CAT_LABEL[p.category] || p.category} · {p.team || "—"} · Size {p.size} · Grade {p.grade}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Seller: {p.seller.full_name || p.seller.email || "—"}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#0f0f0e", letterSpacing: "-0.5px" }}>฿{Number(p.price).toLocaleString()}</div>
                      {p.status === "pending"  && <button onClick={() => { setSelectedProd(p); setProdRejectReason(""); setProdImgIdx(0); }} style={{ marginTop: 8, background: "#1e3a8a", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>ตรวจสอบ →</button>}
                      {p.status === "approved" && <div style={{ marginTop: 8, fontSize: 13, color: "#15803d", fontWeight: 600 }}>✓ อนุมัติแล้ว</div>}
                      {p.status === "rejected" && <div style={{ marginTop: 8, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>✗ ปฏิเสธแล้ว</div>}
                    </div>
                  </div>
                  {p.description && <div style={{ padding: "0 24px 16px", fontSize: 13, color: "#6b7280", borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>{p.description}</div>}
                  {p.status === "rejected" && p.reject_reason && <div style={{ margin: "0 24px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>เหตุผล: {p.reject_reason}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal: Seller Verify */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", marginBottom: 4 }}>ตรวจสอบ Seller</h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>{selected.profile.full_name} · {selected.profile.email}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>บัตรประชาชน</div>
                {selected.id_card_url
                  ? <a href={selected.id_card_url} target="_blank" rel="noreferrer"><img src={selected.id_card_url} alt="ID card" style={{ width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 180, border: "1px solid #e5e7eb" }} /></a>
                  : <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>ไม่มีรูป</div>}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>Selfie ถือบัตร</div>
                {selected.selfie_url
                  ? <a href={selected.selfie_url} target="_blank" rel="noreferrer"><img src={selected.selfie_url} alt="selfie" style={{ width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 180, border: "1px solid #e5e7eb" }} /></a>
                  : <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>ไม่มีรูป</div>}
              </div>
            </div>
            <div style={{ background: "#f1f5f9", borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>ข้อมูลธนาคาร</div>
              <div>{selected.bank_name}</div>
              <div>{selected.bank_account} · {selected.bank_account_name}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>เหตุผล (กรณีปฏิเสธ)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="ระบุเหตุผลที่ปฏิเสธ..." rows={3}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fafafa", boxSizing: "border-box", resize: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleApprove(selected)} disabled={processing} style={{ flex: 1, padding: "12px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: processing ? 0.7 : 1 }}>✓ อนุมัติ</button>
              <button onClick={() => handleReject(selected)} disabled={processing} style={{ flex: 1, padding: "12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: processing ? 0.7 : 1 }}>✗ ปฏิเสธ</button>
              <button onClick={() => setSelected(null)} style={{ padding: "12px 20px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 99, fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Product Review */}
      {selectedProd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedProd(null); }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", marginBottom: 4 }}>ตรวจสอบสินค้า</h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>Seller: {selectedProd.seller.full_name || selectedProd.seller.email}</p>
            {(() => {
              const imgs = selectedProd.image_urls?.length ? selectedProd.image_urls : (selectedProd.image_url ? [selectedProd.image_url] : []);
              if (!imgs.length) return null;
              return (
                <div style={{ marginBottom: 20 }}>
                  <img src={imgs[prodImgIdx]} alt={selectedProd.name} onClick={() => setLightbox(imgs[prodImgIdx])}
                    style={{ width: "100%", borderRadius: 12, objectFit: "cover", maxHeight: 240, border: "1px solid #e2e8f0", cursor: "zoom-in" }} />
                  {imgs.length > 1 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      {imgs.map((src, i) => (
                        <div key={i} onClick={() => setProdImgIdx(i)}
                          style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: `2px solid ${prodImgIdx === i ? "#1e3a8a" : "#e5e7eb"}`, cursor: "pointer", flexShrink: 0 }}>
                          <img src={src} alt={`img ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{ background: "#f1f5f9", borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f0f0e", marginBottom: 8 }}>{selectedProd.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div><span style={{ color: "#9ca3af" }}>ประเภท: </span>{CAT_LABEL[selectedProd.category] || selectedProd.category}</div>
                <div><span style={{ color: "#9ca3af" }}>ทีม: </span>{selectedProd.team || "—"}</div>
                <div><span style={{ color: "#9ca3af" }}>ขนาด: </span>{selectedProd.size}</div>
                <div><span style={{ color: "#9ca3af" }}>เกรด: </span>{selectedProd.grade}</div>
              </div>
              <div style={{ marginTop: 8, fontWeight: 700, color: "#0f0f0e" }}>฿{Number(selectedProd.price).toLocaleString()}</div>
              {selectedProd.description && <div style={{ marginTop: 8, color: "#6b7280", lineHeight: 1.6 }}>{selectedProd.description}</div>}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>เหตุผล (กรณีปฏิเสธ)</label>
              <textarea value={prodRejectReason} onChange={e => setProdRejectReason(e.target.value)} placeholder="ระบุเหตุผลที่ปฏิเสธ..." rows={3}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fafafa", boxSizing: "border-box", resize: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleApproveProd(selectedProd)} disabled={prodProcessing} style={{ flex: 1, padding: "12px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: prodProcessing ? 0.7 : 1 }}>✓ อนุมัติ</button>
              <button onClick={() => handleRejectProd(selectedProd)} disabled={prodProcessing} style={{ flex: 1, padding: "12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: prodProcessing ? 0.7 : 1 }}>✗ ปฏิเสธ</button>
              <button onClick={() => setSelectedProd(null)} style={{ padding: "12px 20px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 99, fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ปฏิเสธคำร้อง */}
      {denyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) { setDenyModal(null); setDenyReason(""); } }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460, boxShadow: "0 24px 64px rgba(0,0,0,.18)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", padding: "24px 28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>ปฏิเสธคำร้อง</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#fff" }}>
                ออเดอร์ #{denyModal.id.slice(0, 8).toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                {denyModal.product?.name || "สินค้า"} · ผู้ซื้อ: {denyModal.shipping_name}
              </div>
            </div>

            <div style={{ padding: "24px 28px" }}>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: "0 0 20px" }}>
                เหตุผลนี้จะถูกส่งไปยัง <strong>ผู้ซื้อ</strong> ทางอีเมล และบันทึกใน notification ของลูกค้า กรุณาระบุให้ชัดเจนและเป็นกลาง
              </p>

              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                เหตุผลที่ปฏิเสธ <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                value={denyReason}
                onChange={e => setDenyReason(e.target.value)}
                placeholder="เช่น: หลักฐานที่ให้มาไม่เพียงพอ / สินค้าตรงตามที่ระบุไว้ในประกาศ / ปัญหาเกิดจากการใช้งานหลังรับสินค้า..."
                rows={4}
                autoFocus
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, lineHeight: 1.65, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#0f172a" }}
                onFocus={e => e.target.style.borderColor = "#94a3b8"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{denyReason.length} ตัวอักษร</div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={handleDenyRefund}
                  disabled={disputeProcessing || !denyReason.trim()}
                  style={{ flex: 1, padding: "13px", background: denyReason.trim() ? "#0f172a" : "#e2e8f0", color: denyReason.trim() ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: denyReason.trim() ? "pointer" : "not-allowed", transition: "all .15s", opacity: disputeProcessing ? 0.6 : 1 }}>
                  {disputeProcessing ? "กำลังดำเนินการ..." : "ส่งเหตุผลและปฏิเสธคำร้อง"}
                </button>
                <button
                  onClick={() => { setDenyModal(null); setDenyReason(""); }}
                  style={{ padding: "13px 20px", background: "#f8fafc", color: "#6b7280", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: โอนเงินคืนให้ผู้ซื้อ */}
      {refundModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,.72)", backdropFilter: "blur(8px)", zIndex: 350, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setRefundModal(null); }}>
          <div style={{ background: "#fff", borderRadius: 28, width: "100%", maxWidth: 460, boxShadow: "0 48px 120px rgba(0,0,0,.35)", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)", padding: "26px 28px 22px", position: "relative" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 99, padding: "3px 10px", marginBottom: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>โอนเงินคืนให้ผู้ซื้อ</span>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4, letterSpacing: "-0.3px" }}>
                ออเดอร์ #{refundModal.id.slice(0, 8).toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>
                {refundModal.product?.name || "สินค้า"} · {refundModal.shipping_name}
              </div>
            </div>

            <div style={{ padding: "24px 28px 28px" }}>

              {/* Payment card */}
              <div style={{ background: "linear-gradient(135deg,#020617,#0f172a)", borderRadius: 20, padding: "22px 24px", marginBottom: 22, position: "relative", overflow: "hidden" }}>
                {/* subtle circle decorations */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(99,102,241,.12)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -30, left: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(59,130,246,.08)", pointerEvents: "none" }} />

                {/* Top row: QR + number */}
                <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 18 }}>
                  <div style={{ background: "#fff", borderRadius: 14, padding: "8px", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
                    <PayoutQR promptpayId={refundModal.refund_promptpay} amount={refundModal.amount} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>PromptPay ผู้ซื้อ</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: 1.5, fontVariantNumeric: "tabular-nums" }}>
                      {refundModal.refund_promptpay}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(255,255,255,.08)", marginBottom: 18 }} />

                {/* Amount */}
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>ยอดที่ต้องโอน</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,.5)", fontFamily: "'DM Sans', sans-serif" }}>฿</span>
                  <span style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-3px", fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>
                    {Number(refundModal.amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Upload zone */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                  สลิปยืนยันการโอน <span style={{ color: "#ef4444" }}>*</span>
                </div>
                <label style={{ cursor: "pointer", display: "block" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => { if (e.target.files[0]) setRefundSlipFiles(prev => ({ ...prev, [refundModal.id]: e.target.files[0] })); e.target.value = ""; }} />
                  {refundSlipFiles[refundModal.id] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14 }}>
                      <div style={{ width: 42, height: 42, background: "#dcfce7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>✓ เลือกไฟล์แล้ว</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{refundSlipFiles[refundModal.id].name}</div>
                      </div>
                      <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600, flexShrink: 0 }}>เปลี่ยน</span>
                    </div>
                  ) : (
                    <div style={{ padding: "24px", border: "2px dashed #e2e8f0", borderRadius: 14, textAlign: "center", background: "#fafafa", transition: "all .18s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; }}>
                      <div style={{ marginBottom: 8, display:"flex", justifyContent:"center" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 3 }}>คลิกเพื่อเลือกสลิป</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>JPG, PNG — ไม่เกิน 10MB</div>
                    </div>
                  )}
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleConfirmRefund(refundModal)} disabled={refundProcessing || !refundSlipFiles[refundModal.id]}
                  style={{ flex: 1, padding: "14px", fontSize: 14, fontWeight: 700, border: "none", borderRadius: 14, transition: "all .2s", opacity: refundProcessing ? 0.7 : 1,
                    cursor: refundSlipFiles[refundModal.id] ? "pointer" : "not-allowed",
                    background: refundSlipFiles[refundModal.id] ? "linear-gradient(135deg,#15803d,#166534)" : "#e2e8f0",
                    color: refundSlipFiles[refundModal.id] ? "#fff" : "#9ca3af",
                    boxShadow: refundSlipFiles[refundModal.id] ? "0 6px 20px rgba(21,128,61,.4)" : "none" }}>
                  {refundProcessing ? "กำลังบันทึก..." : "✓ ยืนยันโอนแล้ว — แจ้ง Buyer"}
                </button>
                <button onClick={() => setRefundModal(null)}
                  style={{ padding: "14px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
          <button onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
          <img src={lightbox} alt="fullsize" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการ</div>;
}

function BackLink({ href, label }) {
  return (
    <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13, fontWeight: 500, textDecoration: "none", marginBottom: 16 }}
      onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
      onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
      {label}
    </a>
  );
}

function PayoutQR({ promptpayId, phone, amount }) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    const id = [(promptpayId || ""), (phone || "")]
      .map(s => s.replace(/\D/g, ""))
      .find(s => s.length === 10 || s.length === 13);
    if (!id) return;
    try {
      const payload = generatePayload(id, { amount: Number(amount) });
      QRCode.toDataURL(payload, { width: 160, margin: 1, color: { dark: "#0f172a", light: "#fff" } })
        .then(setDataUrl).catch(() => {});
    } catch {}
  }, [promptpayId, phone, amount]);

  if (!dataUrl) return (
    <div style={{ marginTop: 10, fontSize: 11, color: "#f59e0b", background: "#fef9c3", borderRadius: 6, padding: "4px 8px", textAlign: "center" }}>
      ⚠️ ไม่มีเลข PromptPay
    </div>
  );
  return (
    <div style={{ marginTop: 10, textAlign: "center" }}>
      <img src={dataUrl} alt="QR" style={{ width: 128, height: 128, borderRadius: 10, border: "1px solid #e2e8f0", display: "block", margin: "0 auto" }} />
      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>PromptPay · สแกนโอนเงิน</div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  nav:      { position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 },
  logo:     { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none", display: "flex", alignItems: "center" },
  logoutBtn:{ background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 16px", borderRadius: 99, fontSize: 13, cursor: "pointer" },
  heading:  { fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e", margin: "0 0 24px" },
};
