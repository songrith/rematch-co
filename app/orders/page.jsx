"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import MobileNav from "@/app/components/MobileNav";

const COURIER_LABEL = {
  thaipost: "ไปรษณีย์ไทย / EMS",
  kerry:    "Kerry Express",
  flash:    "Flash Express",
  jt:       "J&T Express",
  dhl:      "DHL",
  other:    "ขนส่งอื่นๆ",
};
const COURIER_URL = {
  thaipost: (t) => `https://track.thailandpost.co.th/?trackNumber=${t}`,
  kerry:    (t) => `https://th.kerryexpress.com/th/track/?track=${t}`,
  flash:    (t) => `https://www.flashexpress.co.th/tracking/?se=${t}`,
  jt:       (t) => `https://www.jtexpress.co.th/index/query/gquery.html?bills=${t}`,
  dhl:      (t) => `https://www.dhl.com/th-th/home/tracking.html?tracking-id=${t}`,
  other:    (t) => null,
};

const STATUS_LABEL = {
  pending_payment: "รอตรวจสลิป",
  paid:            "รอจัดส่ง",
  shipped:         "อยู่ระหว่างจัดส่ง",
  delivered:       "ได้รับแล้ว",
  completed:       "สำเร็จ",
  disputed:        "มีปัญหา",
  refunded:        "คืนเงินแล้ว",
};
const STATUS_COLOR = {
  pending_payment: { bg: "#fef9c3", text: "#a16207" },
  paid:            { bg: "#e2e8f0", text: "#172554" },
  shipped:         { bg: "#e0e7ff", text: "#4338ca" },
  delivered:       { bg: "#dcfce7", text: "#15803d" },
  completed:       { bg: "#dcfce7", text: "#15803d" },
  disputed:        { bg: "#fee2e2", text: "#dc2626" },
  refunded:        { bg: "#f3f4f6", text: "#6b7280" },
};
const CAT_EMOJI = { football: "⚽", basketball: "🏀", retro: "🏆" };

export default function OrdersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewSlip, setViewSlip] = useState(null);
  const [confirming, setConfirming] = useState({});
  const [disputeOrd, setDisputeOrd]         = useState(null);
  const [disputeStep, setDisputeStep]       = useState(1);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [disputeReason, setDisputeReason]   = useState("");
  const [disputeType, setDisputeType]       = useState("");
  const [disputeDamage, setDisputeDamage]   = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState([]);
  const [disputeImages, setDisputeImages]     = useState([]);
  const [disputeRequest, setDisputeRequest] = useState("refund");
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  const [disputing, setDisputing]           = useState(false);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [reviewModal, setReviewModal] = useState(null); // { orderId, sellerId, productName }
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [navUser, setNavUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refundInputs, setRefundInputs]   = useState({});
  const [refundQrUrls, setRefundQrUrls]   = useState({});
  const [savingRefund, setSavingRefund]   = useState({});

  async function handleDispute() {
    if (!disputeType) { alert("กรุณาเลือกประเภทปัญหา"); return; }
    if (!disputeReason.trim()) { alert("กรุณาอธิบายรายละเอียดปัญหา"); return; }
    if (!legalConfirmed) { alert("กรุณายืนยันความถูกต้องของข้อมูล"); return; }
    setDisputing(true);

    // Upload evidence images
    const imageUrls = [];
    for (const file of disputeImages) {
      const ext  = file.name.split(".").pop();
      const path = `disputes/${disputeOrd.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("slips").upload(path, file, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("slips").getPublicUrl(path);
        imageUrls.push(publicUrl);
      }
    }

    const fullReason = `[${disputeType}] ${disputeReason}${disputeDamage ? ` | ความเสียหาย: ${disputeDamage}` : ""}${disputeEvidence.length ? ` | หลักฐาน: ${disputeEvidence.join(", ")}` : ""}${imageUrls.length ? ` | รูปภาพ: ${imageUrls.join(", ")}` : ""} | คำขอ: ${disputeRequest === "refund" ? "คืนเงิน" : "เปลี่ยนสินค้า"}`;

    const { error } = await supabase.from("orders")
      .update({ status: "disputed", dispute_reason: fullReason })
      .eq("id", disputeOrd.id);
    setDisputing(false);
    if (error) { alert("เกิดข้อผิดพลาด: " + error.message); return; }
    setOrders(prev => prev.map(o => o.id === disputeOrd.id ? { ...o, status: "disputed", dispute_reason: fullReason } : o));

    // Notify seller + admin
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        "dispute_filed",
        orderId:     disputeOrd.id,
        sellerId:    disputeOrd.product?.seller_id,
        productName: disputeOrd.product?.name || "สินค้า",
        disputeType,
        buyerName:   disputeOrd.shipping_name,
      }),
    }).catch(() => {});

    setDisputeOrd(null);
  }

  async function handleSubmitReview() {
    if (!reviewStars) { alert("กรุณาเลือกคะแนน"); return; }
    setReviewSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      order_id:    reviewModal.orderId,
      reviewer_id: userId,
      seller_id:   reviewModal.sellerId,
      rating:      reviewStars,
      comment:     reviewComment.trim() || null,
    });
    setReviewSubmitting(false);
    if (error) { alert("เกิดข้อผิดพลาด: " + error.message); return; }
    setReviewedIds(prev => new Set([...prev, reviewModal.orderId]));
    setReviewModal(null);
    setReviewStars(5);
    setReviewComment("");
  }

  async function handleConfirmReceived(orderId) {
    if (!confirm("ยืนยันว่าได้รับสินค้าเรียบร้อยแล้ว?")) return;
    setConfirming(prev => ({ ...prev, [orderId]: true }));
    const completedAt = new Date().toISOString();
    const { error } = await supabase.from("orders")
      .update({ status: "completed", completed_at: completedAt })
      .eq("id", orderId);
    setConfirming(prev => ({ ...prev, [orderId]: false }));
    if (error) { alert("เกิดข้อผิดพลาด: " + error.message); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "completed", completed_at: completedAt } : o));
  }

  async function genRefundQr(orderId, phone) {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      setRefundQrUrls(prev => ({ ...prev, [orderId]: null }));
      return;
    }
    try {
      const payload = generatePayload(cleaned);
      const url = await QRCode.toDataURL(payload, { width: 180, margin: 1, color: { dark: "#0f172a", light: "#fff" } });
      setRefundQrUrls(prev => ({ ...prev, [orderId]: url }));
    } catch {
      setRefundQrUrls(prev => ({ ...prev, [orderId]: null }));
    }
  }

  async function saveRefundPromptpay(orderId) {
    const phone = (refundInputs[orderId] || "").trim();
    if (!phone) return;
    setSavingRefund(prev => ({ ...prev, [orderId]: true }));
    const { error } = await supabase.from("orders").update({ refund_promptpay: phone }).eq("id", orderId);
    if (error) { alert("บันทึกไม่สำเร็จ: " + error.message); }
    else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, refund_promptpay: phone } : o));
      const ord = orders.find(o => o.id === orderId);
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:        "refund_promptpay_submitted",
          orderId,
          buyerName:   ord?.shipping_name || "ผู้ซื้อ",
          productName: ord?.product?.name || "สินค้า",
          amount:      ord?.amount,
          promptpay:   phone,
        }),
      }).catch(() => {});
    }
    setSavingRefund(prev => ({ ...prev, [orderId]: false }));
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      setNavUser(user);

      const { data: orderRows } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (!orderRows?.length) { setOrders([]); setLoading(false); return; }

      const productIds = [...new Set(orderRows.map(o => o.product_id).filter(Boolean))];
      const { data: products } = productIds.length
        ? await supabase.from("products").select("id, name, image_url, category, grade, size, seller_id").in("id", productIds)
        : { data: [] };

      // โหลด order ที่รีวิวแล้ว
      const { data: myReviews } = await supabase
        .from("reviews").select("order_id").eq("reviewer_id", user.id);
      setReviewedIds(new Set(myReviews?.map(r => r.order_id) || []));

      setOrders(orderRows.map(o => ({
        ...o,
        product: products?.find(p => p.id === o.product_id) || null,
      })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <nav style={S.nav}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>
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
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={navUser} profile={null} />
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <BackLink href="/" label="กลับหน้าหลัก" />
        <h1 style={S.heading}>คำสั่งซื้อของฉัน</h1>

        {/* Status filter */}
        {orders.length > 0 && (() => {
          const BUYER_TABS = [
            { key: "all",             label: "ทั้งหมด" },
            { key: "pending_payment", label: "รอตรวจสลิป" },
            { key: "paid",            label: "รอจัดส่ง" },
            { key: "shipped",         label: "จัดส่งแล้ว" },
            { key: "completed",       label: "สำเร็จ" },
            { key: "disputed",        label: "มีปัญหา" },
            { key: "refunded",        label: "คืนเงิน" },
          ];
          return (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {BUYER_TABS.map(t => {
                const count = t.key === "all" ? orders.length : orders.filter(o => o.status === t.key).length;
                if (t.key !== "all" && count === 0) return null;
                return (
                  <button key={t.key} onClick={() => setStatusFilter(t.key)}
                    style={{ padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all .16s",
                      borderColor: statusFilter === t.key ? "#1e3a8a" : "#e2e8f0",
                      background:  statusFilter === t.key ? "#1e3a8a" : "#fff",
                      color:       statusFilter === t.key ? "#fff"    : "#6b7280",
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
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
            <p style={{ color: "#6b7280", marginBottom: 16 }}>ยังไม่มีคำสั่งซื้อ</p>
            <a href="/#listings" style={{ background: "#1e3a8a", color: "#fff", padding: "10px 24px", borderRadius: 99, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              เลือกซื้อสินค้า →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter)).map(o => {
              const isDenied = o.status === "completed" && o.dispute_reason?.startsWith("[DENIED]");
              const sc = isDenied
                ? { bg: "#fff7ed", text: "#c2410c" }
                : STATUS_COLOR[o.status] || STATUS_COLOR.pending_payment;
              const statusLabel = isDenied ? "คำร้องถูกปฏิเสธ" : STATUS_LABEL[o.status] || o.status;
              const prod = o.product;
              return (
                <div key={o.id} style={{ background: "#fff", borderRadius: 16, border: `1px solid ${isDenied ? "#fed7aa" : "#e2e8f0"}`, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ padding: "14px 24px", background: isDenied ? "#fff7ed" : "#f1f5f9", borderBottom: `1px solid ${isDenied ? "#fed7aa" : "#e2e8f0"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      ออเดอร์ <span style={{ fontWeight: 600, color: "#374151" }}>#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span style={{ marginLeft: 12 }}>{new Date(o.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, border: isDenied ? "1px solid #fdba74" : "none" }}>
                      {isDenied && "✕ "}{statusLabel}
                    </span>
                  </div>

                  {/* Product row */}
                  <div style={{ padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 12, background: "#e2e8f0", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                      {prod?.image_url
                        ? <img src={prod.image_url} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : CAT_EMOJI[prod?.category] || "⚽"
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f0f0e" }}>{prod?.name || "สินค้า"}</div>
                      {prod && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Size {prod.size} · Grade {prod.grade}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#0f0f0e", letterSpacing: "-0.5px" }}>
                        ฿{Number(o.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Shipping */}
                  <div style={{ padding: "0 24px 16px", fontSize: 13 }}>
                    <div style={{ color: "#9ca3af", marginBottom: 4 }}>จัดส่งที่</div>
                    <div style={{ fontWeight: 600, color: "#374151" }}>{o.shipping_name} · {o.shipping_phone}</div>
                    <div style={{ color: "#6b7280", lineHeight: 1.5 }}>{o.shipping_addr}</div>
                  </div>

                  {/* Tracking box */}
                  {o.tracking_number && (() => {
                    const courierKey = o.courier || "thaipost";
                    const trackUrl = COURIER_URL[courierKey]?.(o.tracking_number);
                    return (
                      <div style={{ margin: "0 24px 20px", background: "#eff6ff", border: "1px solid #cbd5e1", borderRadius: 12, padding: "14px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                              📦 {COURIER_LABEL[courierKey] || "พัสดุ"}
                            </div>
                            <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#172554", letterSpacing: 1 }}>
                              {o.tracking_number}
                            </div>
                            {o.shipped_at && (
                              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                                จัดส่งเมื่อ {new Date(o.shipped_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => { navigator.clipboard.writeText(o.tracking_number); alert("คัดลอกเลข Tracking แล้ว"); }}
                              style={{ padding: "7px 14px", border: "1px solid #cbd5e1", background: "#fff", color: "#3b82f6", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              คัดลอก
                            </button>
                            {trackUrl && (
                              <a href={trackUrl} target="_blank" rel="noreferrer"
                                style={{ padding: "7px 14px", background: "#172554", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                                ติดตามพัสดุ →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Waiting for tracking */}
                  {o.status === "paid" && !o.tracking_number && (
                    <div style={{ margin: "0 24px 20px", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#92400e" }}>
                      ⏳ กำลังรอ Seller จัดส่งสินค้า
                    </div>
                  )}

                  {/* แจ้งปัญหา */}
                  {(o.status === "shipped" || o.status === "paid") && (
                    <div style={{ padding: "0 24px 4px" }}>
                      <button onClick={() => { setDisputeOrd(o); setDisputeReason(""); setDisputeType(""); setDisputeDamage(""); setDisputeEvidence([]); setDisputeImages([]); setDisputeRequest("refund"); setLegalConfirmed(false); setDisputeStep(1); setPolicyAccepted(false); }}
                        style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                        มีปัญหากับออเดอร์นี้?
                      </button>
                    </div>
                  )}

                  {/* Refund ภายใน 3 วัน */}
                  {(() => {
                    if (o.status !== "completed" || !o.completed_at) return null;
                    const msLeft = 3 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(o.completed_at).getTime());
                    if (msLeft <= 0) return null;
                    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
                    return (
                      <div style={{ padding: "0 24px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                          ⏱ ขอ Refund ได้อีก {daysLeft} วัน
                        </span>
                        <button onClick={() => { setDisputeOrd(o); setDisputeReason(""); setDisputeType(""); setDisputeDamage(""); setDisputeEvidence([]); setDisputeImages([]); setDisputeRequest("refund"); setLegalConfirmed(false); setDisputeStep(1); setPolicyAccepted(false); }}
                          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "5px 14px", borderRadius: 99 }}>
                          ขอ Refund
                        </button>
                      </div>
                    );
                  })()}

                  {/* disputed */}
                  {o.status === "disputed" && (
                    <div style={{ margin: "0 24px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", fontSize: 14, color: "#dc2626", fontWeight: 600 }}>
                      ⚠️ แจ้งปัญหาแล้ว — ทีมงานกำลังตรวจสอบ
                    </div>
                  )}

                  {/* Refunded — state-based display */}
                  {o.status === "refunded" && (() => {
                    const saved   = o.refund_promptpay;
                    const input   = refundInputs[o.id] ?? "";
                    const qrUrl   = refundQrUrls[o.id];
                    const saving  = savingRefund[o.id];
                    const cleaned = input.replace(/\D/g, "");
                    const valid   = cleaned.length === 10 || cleaned.length === 13;

                    /* ── 1. โอนแล้ว (admin upload slip แล้ว) ── */
                    if (o.refund_slip_url) return (
                      <div style={{ margin: "0 24px 20px", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac", borderRadius: 16, padding: "22px 20px" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#15803d", marginBottom: 6 }}>🎉 ได้รับเงินคืนแล้ว!</div>
                        <div style={{ fontSize: 13, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
                          ทีมงานโอนเงินคืน <strong>฿{Number(o.amount).toLocaleString()}</strong> ไปยัง PromptPay ของคุณแล้ว
                          {o.refund_confirmed_at && <span style={{ color: "#6b7280" }}> · {new Date(o.refund_confirmed_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 14, alignItems: "center", background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid #bbf7d0" }}>
                          <img src={o.refund_slip_url} alt="สลิปคืนเงิน" onClick={() => setViewSlip(o.refund_slip_url)}
                            style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, cursor: "zoom-in", flexShrink: 0, border: "1px solid #e2e8f0" }} />
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>หลักฐานการโอน</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 3 }}>PromptPay: {saved}</div>
                          </div>
                        </div>
                      </div>
                    );

                    /* ── 2 & 3. รอ PromptPay / รอ admin โอน ── */
                    return (
                      <div style={{ margin: "0 24px 20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "20px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>✅ อนุมัติคืนเงินแล้ว</div>
                        {saved ? (
                          /* ── 2. มี PromptPay แล้ว รอ admin โอน ── */
                          <>
                            <div style={{ fontSize: 13, color: "#374151", marginBottom: 12 }}>
                              บันทึก PromptPay แล้ว — <strong>รอทีมงานโอนเงิน ฿{Number(o.amount).toLocaleString()}</strong> ให้คุณ
                            </div>
                            <RefundQr phone={saved} />
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8, textAlign: "center" }}>
                              PromptPay: <span style={{ fontWeight: 600, color: "#0f172a" }}>{saved}</span>
                            </div>
                          </>
                        ) : (
                          /* ── 3. ยังไม่มี PromptPay ── */
                          <>
                            <div style={{ fontSize: 13, color: "#374151", marginBottom: 14, lineHeight: 1.6 }}>
                              กรุณากรอกเบอร์ PromptPay เพื่อรับเงินคืน <strong>฿{Number(o.amount).toLocaleString()}</strong>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                              <input type="tel" value={input}
                                onChange={e => { const val = e.target.value; setRefundInputs(prev => ({ ...prev, [o.id]: val })); genRefundQr(o.id, val); }}
                                placeholder="เบอร์มือถือ 10 หลัก / เลขบัตร 13 หลัก"
                                style={{ flex: 1, padding: "11px 13px", borderRadius: 10, border: "1.5px solid #86efac", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                              <button onClick={() => saveRefundPromptpay(o.id)} disabled={saving || !valid}
                                style={{ padding: "11px 20px", background: valid ? "#15803d" : "#d1d5db", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed", whiteSpace: "nowrap", opacity: saving ? 0.7 : 1 }}>
                                {saving ? "..." : "บันทึก →"}
                              </button>
                            </div>
                            {qrUrl && (
                              <div style={{ marginTop: 16, textAlign: "center" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>ตัวอย่าง QR PromptPay</div>
                                <img src={qrUrl} alt="PromptPay QR" style={{ width: 148, height: 148, borderRadius: 12, border: "1px solid #bbf7d0" }} />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* ได้รับของแล้ว */}
                  {o.status === "shipped" && (
                    <div style={{ margin: "0 24px 20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>📬 ได้รับสินค้าแล้วใช่ไหม?</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>กดยืนยันเมื่อได้รับของครบถ้วนแล้ว</div>
                      </div>
                      <button
                        onClick={() => handleConfirmReceived(o.id)}
                        disabled={confirming[o.id]}
                        style={{ padding: "10px 22px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: confirming[o.id] ? 0.7 : 1, whiteSpace: "nowrap" }}>
                        {confirming[o.id] ? "กำลังยืนยัน..." : "ได้รับของแล้ว ✓"}
                      </button>
                    </div>
                  )}

                  {/* Denial notice */}
                  {o.status === "completed" && o.dispute_reason?.startsWith("[DENIED]") && (
                    <div style={{ margin: "0 24px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>❌ คำร้องขอ Refund ถูกปฏิเสธ</div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>
                        <span style={{ fontWeight: 600 }}>เหตุผล: </span>
                        {o.dispute_reason.replace(/^\[DENIED\]\s*/, "")}
                      </div>
                    </div>
                  )}

                  {/* Completed */}
                  {o.status === "completed" && (
                    <div style={{ margin: "0 24px 20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, color: "#15803d", fontWeight: 600 }}>✅ ออเดอร์เสร็จสมบูรณ์</div>
                      {reviewedIds.has(o.id) ? (
                        <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          รีวิวแล้ว
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewModal({ orderId: o.id, sellerId: o.product?.seller_id, productName: o.product?.name || "สินค้า" })}
                          style={{ padding: "8px 18px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          ⭐ รีวิว Seller
                        </button>
                      )}
                    </div>
                  )}

                  {/* Slip link */}
                  {o.slip_url && (
                    <div style={{ padding: "0 24px 16px" }}>
                      <button onClick={() => setViewSlip(o.slip_url)}
                        style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline", marginRight:5, verticalAlign:"middle" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>ดูสลิปการโอน
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispute modal */}
      {disputeOrd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setDisputeOrd(null); }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>

            {/* Step indicator */}
            <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: disputeStep >= s ? "#0f172a" : "#e2e8f0", color: disputeStep >= s ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{s}</div>
                  <span style={{ fontSize: 12, color: disputeStep >= s ? "#0f172a" : "#94a3b8", fontWeight: disputeStep === s ? 700 : 400 }}>
                    {s === 1 ? "เงื่อนไข Refund" : "รายละเอียดปัญหา"}
                  </span>
                  {s < 2 && <div style={{ width: 24, height: 1.5, background: disputeStep > s ? "#0f172a" : "#e2e8f0", marginLeft: 4 }} />}
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 28px 28px" }}>
              {disputeStep === 1 ? (
                <>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>เงื่อนไขการขอ Refund</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>ออเดอร์ #{disputeOrd.id.slice(0, 8).toUpperCase()}</p>

                  {/* Eligible */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>✓ กรณีที่ได้รับ Refund</div>
                    {[["🥷","สินค้าปลอม / เก๊"], ["📷","สินค้าไม่ตรงกับรูปในประกาศ"], ["📦","ไม่ได้รับสินค้า"], ["💥","สินค้าชำรุดเสียหายระหว่างขนส่ง"]].map(([icon, label]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#374151" }}>
                        <span>{icon}</span>{label}
                      </div>
                    ))}
                  </div>

                  {/* Not eligible */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>✕ กรณีที่ไม่ได้รับ Refund</div>
                    {["เปลี่ยนใจหลังได้รับสินค้า", "ไม่ชอบแต่สินค้าตรงตามที่ระบุ", "เกิน 3 วันหลังยืนยันรับสินค้า"].map(label => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#94a3b8" }}>
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>✕</span>{label}
                      </div>
                    ))}
                  </div>

                  {/* Return & refund timeline */}
                  <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 8 }}>📦 ขั้นตอนหลังอนุมัติ</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 12, color: "#1e3a8a", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>1.</span>
                        <span>ลูกค้า<strong>ส่งสินค้าคืน</strong>มาที่ทางร้านภายใน 7 วัน (ค่าส่งเป็นความรับผิดชอบของลูกค้า)</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#1e3a8a", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>2.</span>
                        <span>ทีมงานตรวจสอบสินค้าที่ได้รับคืน แล้ว<strong>คืนเงินภายใน 14 วันทำการ</strong></span>
                      </div>
                    </div>
                  </div>

                  <a href="/refund-policy" target="_blank" style={{ fontSize: 12, color: "#6366f1", textDecoration: "underline" }}>อ่านนโยบาย Refund ฉบับเต็ม →</a>

                  {/* Checkbox */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 18, cursor: "pointer" }}>
                    <input type="checkbox" checked={policyAccepted} onChange={e => setPolicyAccepted(e.target.checked)}
                      style={{ marginTop: 2, width: 16, height: 16, accentColor: "#0f172a", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                      ฉันอ่านและเข้าใจเงื่อนไขการขอ Refund แล้ว รวมถึงยอมรับว่าต้องส่งสินค้าคืนมาที่ทางร้านก่อนรับเงินคืน
                    </span>
                  </label>

                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={() => { if (policyAccepted) setDisputeStep(2); }} disabled={!policyAccepted}
                      style={{ flex: 1, padding: "12px", background: policyAccepted ? "#0f172a" : "#e2e8f0", color: policyAccepted ? "#fff" : "#94a3b8", border: "none", borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: policyAccepted ? "pointer" : "not-allowed", transition: "all .2s" }}>
                      ถัดไป →
                    </button>
                    <button onClick={() => setDisputeOrd(null)}
                      style={{ padding: "12px 20px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 99, fontSize: 14, cursor: "pointer" }}>
                      ยกเลิก
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>แบบฟอร์มคำร้องขอ Refund</h2>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 18px" }}>ออเดอร์ #{disputeOrd.id.slice(0, 8).toUpperCase()} · ข้อมูลทั้งหมดถูกบันทึกเพื่อใช้ในการพิจารณา</p>

                  {/* 1. ประเภทปัญหา */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      1. ประเภทปัญหา <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select value={disputeType} onChange={e => setDisputeType(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: disputeType ? "#0f172a" : "#94a3b8", background: "#fff", outline: "none", fontFamily: "inherit" }}>
                      <option value="">-- เลือกประเภทปัญหา --</option>
                      <option value="สินค้าปลอม / เก๊">🥷 สินค้าปลอม / เก๊</option>
                      <option value="สินค้าไม่ตรงกับรูปในประกาศ">📷 สินค้าไม่ตรงกับรูปในประกาศ</option>
                      <option value="ไม่ได้รับสินค้า">📦 ไม่ได้รับสินค้า</option>
                      <option value="สินค้าชำรุดเสียหาย">💥 สินค้าชำรุดเสียหาย</option>
                      <option value="อื่นๆ">📋 อื่นๆ</option>
                    </select>
                  </div>

                  {/* 2. รายละเอียด */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      2. รายละเอียดปัญหาที่พบ <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                      placeholder="อธิบายปัญหาอย่างละเอียด เช่น ลักษณะสินค้าที่ได้รับ, จุดที่แตกต่างจากในรูป, เหตุการณ์ที่เกิดขึ้น..."
                      rows={4} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }} />
                  </div>

                  {/* 3. ความเสียหาย */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      3. มูลค่าความเสียหายโดยประมาณ
                    </label>
                    <input value={disputeDamage} onChange={e => setDisputeDamage(e.target.value)}
                      placeholder="เช่น เต็มมูลค่าสินค้า ฿2,500 / ส่วนต่างราคาตลาด ฿800"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                  </div>

                  {/* 4. หลักฐาน */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                      4. หลักฐานที่มีในครอบครอง
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["รูปถ่ายสินค้า", "วิดีโอ", "ภาพเปรียบเทียบ", "แชทกับ Seller", "ใบเสร็จ / หลักฐานการซื้อ", "รายงานจากผู้เชี่ยวชาญ"].map(ev => (
                        <label key={ev} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer",
                          padding: "5px 12px", borderRadius: 99, border: `1.5px solid ${disputeEvidence.includes(ev) ? "#6366f1" : "#e2e8f0"}`,
                          background: disputeEvidence.includes(ev) ? "#eef2ff" : "#fff", transition: "all .15s" }}>
                          <input type="checkbox" checked={disputeEvidence.includes(ev)}
                            onChange={e => setDisputeEvidence(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))}
                            style={{ display: "none" }} />
                          {disputeEvidence.includes(ev) ? "✓ " : ""}{ev}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 5. รูปหลักฐาน */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                      5. รูปหลักฐานประกอบ <span style={{ color: "#94a3b8", fontWeight: 400 }}>(ไม่บังคับ, สูงสุด 5 รูป)</span>
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#4f46e5", padding: "7px 14px", border: "1.5px dashed #c7d2fe", borderRadius: 8, background: "#eef2ff", cursor: "pointer" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      เลือกรูปภาพ
                      <input type="file" accept="image/*" multiple style={{ display: "none" }}
                        onChange={e => {
                          const files = Array.from(e.target.files);
                          setDisputeImages(prev => [...prev, ...files].slice(0, 5));
                          e.target.value = "";
                        }} />
                    </label>
                    {disputeImages.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                        {disputeImages.map((file, i) => {
                          const url = URL.createObjectURL(file);
                          return (
                            <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
                              <img src={url} alt={`ev-${i}`} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                              <button onClick={() => setDisputeImages(prev => prev.filter((_, j) => j !== i))}
                                style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 6. คำขอ */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                      6. ต้องการให้ดำเนินการอย่างไร
                    </label>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[["refund", "💰 คืนเงิน"], ["replace", "🔄 เปลี่ยนสินค้า"]].map(([val, label]) => (
                        <label key={val} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8,
                          border: `1.5px solid ${disputeRequest === val ? "#0f172a" : "#e2e8f0"}`,
                          background: disputeRequest === val ? "#0f172a" : "#fff",
                          color: disputeRequest === val ? "#fff" : "#6b7280",
                          fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                          <input type="radio" name="disputeRequest" value={val} checked={disputeRequest === val} onChange={() => setDisputeRequest(val)} style={{ display: "none" }} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Legal declaration */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>ข้อความทางกฎหมาย</div>
                    <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.75, margin: "0 0 10px" }}>
                      การยื่นคำร้องเท็จถือเป็นความผิดตาม <strong>พระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2560 มาตรา 14</strong> และอาจมีความรับผิดทางแพ่งตาม <strong>ประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 420</strong> ข้อมูลที่คุณให้ไว้จะถูกบันทึกและอาจใช้เป็นหลักฐานทางกฎหมายได้
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.75, margin: 0 }}>
                      ผู้บริโภคมีสิทธิ์ยื่นเรื่องร้องเรียนได้ที่ <strong>สำนักงานคณะกรรมการคุ้มครองผู้บริโภค (สคบ.)</strong> หรือ <strong>กองบังคับการปราบปรามการกระทำความผิดเกี่ยวกับการคุ้มครองผู้บริโภค (บก.ปคบ.)</strong>
                    </p>
                  </div>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18, cursor: "pointer" }}>
                    <input type="checkbox" checked={legalConfirmed} onChange={e => setLegalConfirmed(e.target.checked)}
                      style={{ marginTop: 2, width: 15, height: 15, accentColor: "#0f172a", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.65 }}>
                      ข้าพเจ้าขอรับรองว่าข้อมูลทั้งหมดในคำร้องนี้เป็นความจริงทุกประการ และยอมรับผลทางกฎหมายหากข้อมูลเป็นเท็จ
                    </span>
                  </label>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleDispute} disabled={disputing || !disputeType || !disputeReason.trim() || !legalConfirmed}
                      style={{ flex: 1, padding: "12px", background: (disputeType && disputeReason.trim() && legalConfirmed) ? "#dc2626" : "#e2e8f0",
                        color: (disputeType && disputeReason.trim() && legalConfirmed) ? "#fff" : "#94a3b8",
                        border: "none", borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: (disputeType && disputeReason.trim() && legalConfirmed) ? "pointer" : "not-allowed", transition: "all .2s", opacity: disputing ? 0.7 : 1 }}>
                      {disputing ? "กำลังส่ง..." : "ยื่นคำร้องอย่างเป็นทางการ"}
                    </button>
                    <button onClick={() => setDisputeStep(1)}
                      style={{ padding: "12px 18px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 99, fontSize: 13, cursor: "pointer" }}>
                      ← ย้อนกลับ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setReviewModal(null); }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>รีวิวสินค้า</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>{reviewModal.productName}</p>

            {/* Stars */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>คะแนนความพึงพอใจ</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s}
                    onClick={() => setReviewStars(s)}
                    onMouseEnter={() => setReviewHover(s)}
                    onMouseLeave={() => setReviewHover(0)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24"
                      fill={(reviewHover || reviewStars) >= s ? "#f59e0b" : "#e2e8f0"}
                      stroke={(reviewHover || reviewStars) >= s ? "#f59e0b" : "#e2e8f0"}
                      strokeWidth="1" style={{ transition: "fill .15s" }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                ))}
                <span style={{ fontSize: 13, color: "#64748b", alignSelf: "center", marginLeft: 4 }}>
                  {["", "แย่มาก", "พอใช้", "ปานกลาง", "ดีมาก", "ดีเยี่ยม"][reviewHover || reviewStars]}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                ความคิดเห็น <span style={{ color: "#94a3b8", fontWeight: 400 }}>(ไม่บังคับ)</span>
              </label>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                placeholder="เล่าประสบการณ์การซื้อสินค้าครั้งนี้..."
                rows={3} style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = "#93c5fd"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSubmitReview} disabled={reviewSubmitting}
                style={{ flex: 1, padding: "13px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: reviewSubmitting ? 0.7 : 1 }}>
                {reviewSubmitting ? "กำลังส่ง..." : "ส่งรีวิว →"}
              </button>
              <button onClick={() => setReviewModal(null)}
                style={{ padding: "13px 18px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip modal */}
      {viewSlip && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setViewSlip(null)}>
          <img src={viewSlip} alt="slip" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 16, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

function BackLink({ href, label }) {
  return (
    <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13, fontWeight: 500, textDecoration: "none", marginBottom: 16 }}
      onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
      onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      {label}
    </a>
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

function RefundQr({ phone }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const cleaned = phone?.replace(/\D/g, "");
    if (!cleaned || (cleaned.length !== 10 && cleaned.length !== 13)) return;
    try {
      const payload = generatePayload(cleaned);
      QRCode.toDataURL(payload, { width: 180, margin: 1, color: { dark: "#0f172a", light: "#fff" } })
        .then(setUrl).catch(() => {});
    } catch {}
  }, [phone]);
  if (!url) return null;
  return <img src={url} alt="QR" style={{ width: 148, height: 148, borderRadius: 12, border: "1px solid #bbf7d0", display: "block", margin: "0 auto" }} />;
}

const S = {
  nav: { position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", zIndex: 100 },
  logo: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" },
  heading: { fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e", margin: "0 0 28px" },
};
