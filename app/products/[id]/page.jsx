"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

const GRADE_INFO = {
  S: { bg: "#dcfce7", text: "#15803d", label: "เกือบใหม่", desc: "สภาพดีมาก แทบไม่มีร่องรอยการใช้งาน" },
  A: { bg: "#dbeafe", text: "#1e3a8a", label: "สภาพดี", desc: "ผ่านการใช้งาน มีร่องรอยเล็กน้อย" },
  B: { bg: "#fef9c3", text: "#a16207", label: "สภาพปานกลาง", desc: "ผ่านการใช้งานมา มีร่องรอยชัดเจน" },
};
const CAT_LABEL = { football: "เสื้อบอล", basketball: "เสื้อบาส", retro: "Retro" };
const CAT_ICON  = {
  football:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>,
  basketball: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c4.69 4.69 10.12 9.27 9.14 9.14-.98-.14-4.45-4.45-9.14-9.14z"/><path d="M19.07 4.93c-4.69 4.69-10.12 9.27-9.14 9.14"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>,
  retro:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

const PLATFORM_PROMPTPAY = "0994156241";

export default function ProductDetailPage() {
  const supabase = createClient();
  const router   = useRouter();
  const { id }   = useParams();

  const [product, setProduct]         = useState(null);
  const [seller, setSeller]           = useState(null);
  const [buyer, setBuyer]             = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeImg, setActiveImg]     = useState(0);
  const [lightbox, setLightbox]       = useState(false);
  const [navUser, setNavUser]         = useState(null);

  const [step, setStep]               = useState(0);
  const [addrForm, setAddrForm]       = useState({
    full_name: "", phone: "", address: "", subdistrict: "", district: "", province: "", postal_code: "",
  });
  const [slipFile, setSlipFile]       = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [qrDataUrl, setQrDataUrl]     = useState(null);
  const [ordering, setOrdering]       = useState(false);
  const [orderId, setOrderId]         = useState(null);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [verifyMsg, setVerifyMsg]     = useState("");
  const [transRef, setTransRef]       = useState(null);
  const [slipHash, setSlipHash]       = useState(null);
  const [reviews, setReviews]         = useState([]);
  const [shippedCount, setShippedCount] = useState(0);

  useEffect(() => {
    async function load() {
      const [{ data: prod }, { data: { user } }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.auth.getUser(),
      ]);
      if (!prod) { router.push("/"); return; }
      setProduct(prod);
      setNavUser(user);

      const [{ data: sellerProfile }, { count }] = await Promise.all([
        supabase.from("profiles").select("full_name, email, avatar_url").eq("id", prod.seller_id).single(),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", prod.seller_id).eq("status", "completed"),
      ]);
      setSeller(sellerProfile);
      setShippedCount(count ?? 0);

      // โหลด reviews ของ seller นี้
      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id")
        .eq("seller_id", prod.seller_id)
        .order("created_at", { ascending: false });
      if (reviewRows?.length) {
        const rIds = [...new Set(reviewRows.map(r => r.reviewer_id))];
        const { data: reviewers } = await supabase
          .from("profiles").select("id, full_name, avatar_url").in("id", rIds);
        setReviews(reviewRows.map(r => ({
          ...r,
          reviewer_name:   reviewers?.find(p => p.id === r.reviewer_id)?.full_name || "ผู้ซื้อ",
          reviewer_avatar: reviewers?.find(p => p.id === r.reviewer_id)?.avatar_url || null,
        })));
      }

      if (user) {
        setBuyer(user);
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setBuyerProfile(profile);
        setAddrForm({
          full_name:   profile?.full_name   || "",
          phone:       profile?.phone       || "",
          address:     profile?.address     || "",
          subdistrict: profile?.subdistrict || "",
          district:    profile?.district    || "",
          province:    profile?.province    || "",
          postal_code: profile?.postal_code || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function generateQR(amount) {
    const payload = generatePayload(PLATFORM_PROMPTPAY, { amount });
    const url = await QRCode.toDataURL(payload, { width: 220, margin: 2 });
    setQrDataUrl(url);
  }

  function openCheckout() {
    if (!buyer) { router.push("/login"); return; }
    setStep(1);
  }

  async function handleChat() {
    if (!buyer) { router.push("/login"); return; }
    const { data: existing } = await supabase
      .from("conversations").select("id")
      .eq("buyer_id", buyer.id).eq("seller_id", product.seller_id).eq("product_id", product.id)
      .maybeSingle();
    if (existing) { router.push(`/messages/${existing.id}`); return; }
    const { data: created } = await supabase
      .from("conversations")
      .insert({ buyer_id: buyer.id, seller_id: product.seller_id, product_id: product.id })
      .select("id").single();
    if (created) router.push(`/messages/${created.id}`);
  }

  function confirmAddress() {
    const req = ["full_name", "phone", "address", "subdistrict", "district", "province", "postal_code"];
    if (req.some(k => !addrForm[k]?.trim())) { alert("กรุณากรอกข้อมูลให้ครบถ้วน"); return; }
    generateQR(product.price);
    setStep(2);
  }

  async function handleSlip(e) {
    const f = e.target.files[0];
    if (!f) return;
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
    setVerifyStatus("loading");
    setVerifyMsg("");
    const fd = new FormData();
    fd.append("file", f);
    fd.append("amount", product.price);
    try {
      const res    = await fetch("/api/verify-slip", { method: "POST", body: fd });
      const result = await res.json();
      if (result.ok) {
        setVerifyStatus("ok");
        setVerifyMsg(`ยืนยันสำเร็จ ฿${Number(result.amount).toLocaleString()}`);
        setTransRef(result.transRef || null);
        setSlipHash(result.slipHash || null);
      } else {
        setVerifyStatus("error");
        setVerifyMsg(result.error);
      }
    } catch {
      setVerifyStatus("error");
      setVerifyMsg("ตรวจสอบสลิปไม่ได้ กรุณาลองใหม่");
    }
  }

  async function handleOrder() {
    if (!slipFile) { alert("กรุณาแนบสลิปการโอนเงิน"); return; }
    setOrdering(true);
    const ext  = slipFile.name.split(".").pop();
    const path = `${buyer.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("slips").upload(path, slipFile, { upsert: true });
    if (uploadErr) { alert("อัพโหลดสลิปไม่สำเร็จ: " + uploadErr.message); setOrdering(false); return; }
    const { data: { publicUrl: slip_url } } = supabase.storage.from("slips").getPublicUrl(path);

    const shippingText = [addrForm.address, addrForm.subdistrict, addrForm.district, addrForm.province, addrForm.postal_code].filter(Boolean).join(" ");
    const fee = Math.round(product.price * 0.1 * 100) / 100;

    const { data: newOrderId, error } = await supabase.rpc("place_order", {
      p_product_id: product.id, p_amount: product.price,
      p_fee_amount: fee, p_seller_amount: product.price - fee,
      p_shipping_name: addrForm.full_name, p_shipping_phone: addrForm.phone,
      p_shipping_addr: shippingText, p_slip_url: slip_url,
    });

    if (error) {
      alert(error.message.includes("ถูกซื้อไปแล้ว") ? "ขออภัย สินค้านี้ถูกซื้อไปแล้ว" : "เกิดข้อผิดพลาด: " + error.message);
      setOrdering(false); return;
    }

    await supabase.from("orders").update({
      status: "paid", trans_ref: transRef || null, slip_hash: slipHash || null,
    }).eq("id", newOrderId);

    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "order_placed", buyerEmail: buyer.email, buyerName: addrForm.full_name,
        sellerEmail: seller?.email, sellerName: seller?.full_name,
        productName: product.name, orderId: newOrderId, amount: product.price,
      }),
    }).catch(() => {});

    setOrderId(newOrderId);
    setOrdering(false);
    setStep(3);
  }

  if (loading) return <Spinner />;
  if (!product) return null;

  const images   = product.image_urls?.length ? product.image_urls : (product.image_url ? [product.image_url] : []);
  const gradeInfo = GRADE_INFO[product.grade] || GRADE_INFO.S;
  const isSold    = product.status === "sold";
  const isOwner   = buyer?.id === product.seller_id;

  return (
    <div style={{ minHeight: "100vh", background: "#eef2f7", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .thumb-hover:hover { border-color: #1e3a8a !important; }
        .btn-chat:hover { background: #f1f5f9 !important; border-color: #94a3b8 !important; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/shop" style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}>ร้านค้า</a>
          {navUser ? (
            <a href="/dashboard" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 99 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {navUser.email?.[0]?.toUpperCase() || "U"}
              </div>
              บัญชีของฉัน
            </a>
          ) : (
            <>
              <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: "#475569", textDecoration: "none", padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>เข้าสู่ระบบ</a>
              <a href="/register" style={{ fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none", padding: "8px 20px", borderRadius: 8, background: "#1e3a8a" }}
                onMouseEnter={e => e.currentTarget.style.background = "#172554"}
                onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}>สมัครสมาชิก</a>
            </>
          )}
        </div>
      </nav>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
          <a href="/" style={{ color: "#94a3b8", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>หน้าหลัก</a>
          <span>/</span>
          <a href="/shop" style={{ color: "#94a3b8", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>ร้านค้า</a>
          <span>/</span>
          <a href={`/shop?category=${product.category}`} style={{ color: "#94a3b8", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>{CAT_LABEL[product.category]}</a>
          <span>/</span>
          <span style={{ color: "#374151", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</span>
        </div>
      </div>

      {/* ── Main card ── */}
      <div className="rm-page" style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 32px 64px" }}>
      <div className="rm-product-grid" style={{ background: "#fff", border: "1.5px solid #e4eaf3", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,.07)", padding: "36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "start" }}>

        {/* ── Left: Images ── */}
        <div className="rm-sticky-img" style={{ position: "sticky", top: 88 }}>
          {/* Main image */}
          <div
            onClick={() => images[activeImg] && setLightbox(true)}
            style={{ borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", cursor: images[activeImg] ? "zoom-in" : "default", position: "relative", boxShadow: "0 2px 16px rgba(0,0,0,.04)" }}
          >
            {images[activeImg]
              ? <img src={images[activeImg]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"} />
              : <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
            }

            {/* Authenticity badge */}
            <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0", borderRadius: 99, padding: "5px 10px", boxShadow: "0 1px 6px rgba(0,0,0,.08)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>ผ่านการตรวจสอบ</span>
            </div>

            {/* Zoom hint */}
            {images[activeImg] && (
              <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,.45)", borderRadius: 8, padding: "5px 9px", display: "flex", alignItems: "center", gap: 5, pointerEvents: "none" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Zoom</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {images.map((src, i) => (
                <div key={i} className="thumb-hover" onClick={() => setActiveImg(i)}
                  style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", border: `2px solid ${activeImg === i ? "#1e3a8a" : "#e5e7eb"}`, cursor: "pointer", flexShrink: 0, transition: "border-color 0.15s" }}>
                  <img src={src} alt={`view ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          {/* Trust pills */}
          <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "Escrow Protected" },
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: "Verified" },
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>, text: "คืนเงิน 7 วัน" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "#475569" }}>
                {icon}{text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Info ── */}
        <div style={{ animation: "fadeIn 0.35s ease" }}>

          {/* Category + badges */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {CAT_LABEL[product.category]}
            </span>
            <span style={{ color: "#d1d5db" }}>·</span>
            <span style={{ background: gradeInfo.bg, color: gradeInfo.text, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
              Grade {product.grade} — {gradeInfo.label}
            </span>
            {isSold && (
              <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>ขายแล้ว</span>
            )}
          </div>

          {/* Title */}
          <h1 className="rm-thai" style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 800, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.35 }}>
            {product.name}
          </h1>

          {/* Meta tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {[product.team, `ไซส์ ${product.size}`].filter(Boolean).map(tag => (
              <span key={tag} style={{ fontSize: 12, color: "#475569", background: "#f1f5f9", padding: "3px 10px", borderRadius: 6, fontWeight: 500 }}>{tag}</span>
            ))}
          </div>

          {/* Price box */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>ราคา</div>
            <span className="rm-price" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 700, color: "#0f172a" }}>
              ฿{Number(product.price).toLocaleString()}
            </span>
            <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600, marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ปลอดภัยด้วยระบบ Escrow — ไม่ได้ของ คืนเงิน 100%
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>รายละเอียด</div>
              <p className="rm-thai" style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>{product.description}</p>
            </div>
          )}

          <div style={{ height: 1, background: "#f1f5f9", marginBottom: 18 }} />

          {/* Seller row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
              {seller?.avatar_url
                ? <img src={seller.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : seller?.full_name?.[0] || "S"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{seller?.full_name || "Seller"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified
                </span>
                {shippedCount > 0 && <span style={{ fontSize: 11, color: "#6b7280" }}>· ส่งแล้ว {shippedCount} ชิ้น</span>}
              </div>
            </div>
            {!isOwner && (
              <button onClick={handleChat} className="btn-chat"
                style={{ padding: "6px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                แชท
              </button>
            )}
          </div>

          {/* CTA */}
          {isSold ? (
            <div style={{ width: "100%", padding: "14px", background: "#f1f5f9", color: "#94a3b8", borderRadius: 10, fontSize: 14, fontWeight: 700, textAlign: "center", boxSizing: "border-box" }}>
              สินค้าถูกซื้อแล้ว
            </div>
          ) : (
            <button onClick={openCheckout}
              style={{ width: "100%", padding: "14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s", boxSizing: "border-box" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e3a8a"}
              onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}>
              สั่งซื้อสินค้า
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          )}

          {/* Trust row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
            {[
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "Escrow" },
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: "Verified" },
              { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>, text: "คืนเงิน 7 วัน" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                {icon}{text}
              </div>
            ))}
          </div>

          {/* Reviews link */}
          <a href="/reviews" style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, textDecoration: "none", color: "#94a3b8", fontSize: 12 }}
            onMouseEnter={e => e.currentTarget.style.color = "#475569"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {reviews.length > 0 ? `${reviews.length} รีวิว` : "ยังไม่มีรีวิว"}
          </a>
        </div>
        </div>

      </div>


      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div onClick={() => setLightbox(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setLightbox(false)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>✕</button>
          {activeImg > 0 && (
            <button onClick={e => { e.stopPropagation(); setActiveImg(i => i - 1); }}
              style={{ position: "absolute", left: 20, background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 48, height: 48, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}>‹</button>
          )}
          <img src={images[activeImg]} alt={product.name} onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 12, userSelect: "none" }} />
          {activeImg < images.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setActiveImg(i => i + 1); }}
              style={{ position: "absolute", right: 20, background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 48, height: 48, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}>›</button>
          )}
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 8 }}>
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setActiveImg(i); }}
                  style={{ width: i === activeImg ? 24 : 8, height: 8, borderRadius: 99, background: i === activeImg ? "#fff" : "rgba(255,255,255,.35)", border: "none", cursor: "pointer", transition: "all 0.2s", padding: 0 }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CHECKOUT MODAL (Steps 1 & 2) ── */}
      {step > 0 && step < 3 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setStep(0); }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>

            {/* Modal product header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", flexShrink: 0, border: "1px solid #e2e8f0" }}>
                {(product.image_urls?.[0] || product.image_url)
                  ? <img src={product.image_urls?.[0] || product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg></div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>ไซส์ {product.size} · Grade {product.grade}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1e3a8a", flexShrink: 0 }}>฿{Number(product.price).toLocaleString()}</div>
              <button onClick={() => setStep(0)} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 16, flexShrink: 0 }}>✕</button>
            </div>

            {/* Step bar */}
            <div style={{ padding: "14px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center" }}>
              {["ที่อยู่จัดส่ง", "ชำระเงิน"].map((label, i) => (
                <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: step > i + 1 ? "#15803d" : step === i + 1 ? "#1e3a8a" : "#e2e8f0", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.3s" }}>
                      {step > i + 1
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? "#0f172a" : "#94a3b8" }}>{label}</span>
                  </div>
                  {i < 1 && <div style={{ flex: 1, height: 1, background: step > 1 ? "#1e3a8a" : "#e2e8f0", margin: "0 10px", transition: "background 0.3s" }} />}
                </div>
              ))}
            </div>

            <div style={{ padding: "22px" }}>

              {/* STEP 1 — Address */}
              {step === 1 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 13px", marginBottom: 18 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: 12, color: "#1e40af", fontWeight: 600 }}>เงินของคุณจะถูกกักไว้ใน Escrow — Seller ได้รับเมื่อคุณยืนยันรับของแล้วเท่านั้น</span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>ที่อยู่สำหรับจัดส่ง</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="ชื่อ-นามสกุล *" value={addrForm.full_name} onChange={v => setAddrForm(p => ({ ...p, full_name: v }))} placeholder="กรอกชื่อ-นามสกุล" />
                      <Field label="เบอร์โทร *" value={addrForm.phone} onChange={v => setAddrForm(p => ({ ...p, phone: v.replace(/\D/g, "") }))} inputMode="tel" maxLength={10} placeholder="0XXXXXXXXX" />
                    </div>
                    <Field label="ที่อยู่ *" value={addrForm.address} onChange={v => setAddrForm(p => ({ ...p, address: v }))} placeholder="บ้านเลขที่ ถนน ซอย" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="แขวง / ตำบล" value={addrForm.subdistrict} onChange={v => setAddrForm(p => ({ ...p, subdistrict: v }))} />
                      <Field label="เขต / อำเภอ" value={addrForm.district} onChange={v => setAddrForm(p => ({ ...p, district: v }))} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="จังหวัด" value={addrForm.province} onChange={v => setAddrForm(p => ({ ...p, province: v }))} />
                      <Field label="รหัสไปรษณีย์" value={addrForm.postal_code} onChange={v => setAddrForm(p => ({ ...p, postal_code: v.replace(/\D/g, "") }))} inputMode="numeric" maxLength={5} placeholder="XXXXX" />
                    </div>
                  </div>

                  <button onClick={confirmAddress}
                    style={{ width: "100%", marginTop: 18, padding: "14px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = "#172554"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}>
                    ถัดไป — ชำระเงิน
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </>
              )}

              {/* STEP 2 — Payment */}
              {step === 2 && (
                <>
                  {/* Order summary */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "13px 15px", marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>สรุปคำสั่งซื้อ</div>
                    {[
                      ["สินค้า", product.name],
                      ["จัดส่งให้", `${addrForm.full_name} · ${addrForm.phone}`],
                      ["ที่อยู่", [addrForm.address, addrForm.district, addrForm.province].filter(Boolean).join(", ")],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5, fontSize: 12 }}>
                        <span style={{ color: "#64748b", flexShrink: 0 }}>{k}</span>
                        <span style={{ fontWeight: 600, color: "#0f172a", textAlign: "right" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>ยอดชำระ</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#1e3a8a" }}>฿{Number(product.price).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* QR */}
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 18px", marginBottom: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>สแกน QR Code เพื่อชำระ</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>ด้วยแอปธนาคารหรือ Mobile Banking</div>
                      </div>

                      {qrDataUrl ? (
                        <div style={{ padding: 10, background: "#fff", border: "2px solid #e2e8f0", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                          <img src={qrDataUrl} alt="PromptPay QR" style={{ width: 190, height: 190, display: "block" }} />
                        </div>
                      ) : (
                        <div style={{ width: 190, height: 190, background: "#f1f5f9", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", borderRadius: 99, padding: "7px 14px" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
                        <span style={{ fontSize: 12, color: "#374151", fontWeight: 700 }}>พร้อมเพย์ {PLATFORM_PROMPTPAY}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slip upload */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 7 }}>
                      แนบสลิปโอนเงิน <span style={{ color: "#dc2626" }}>*</span>
                    </div>
                    <label style={{
                      display: "block", borderRadius: 12, cursor: "pointer", overflow: "hidden",
                      border: `2px dashed ${verifyStatus === "ok" ? "#15803d" : verifyStatus === "error" ? "#dc2626" : "#cbd5e1"}`,
                      background: verifyStatus === "ok" ? "#f0fdf4" : verifyStatus === "error" ? "#fef2f2" : "#fafafa",
                      transition: "all 0.2s",
                    }}>
                      {slipPreview ? (
                        <div style={{ position: "relative" }}>
                          <img src={slipPreview} alt="slip" style={{ width: "100%", maxHeight: 170, objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 }}>เปลี่ยน</div>
                        </div>
                      ) : (
                        <div style={{ padding: "22px 16px", textAlign: "center" }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>อัปโหลดสลิปโอนเงิน</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>JPG หรือ PNG · ระบบตรวจสอบอัตโนมัติ</div>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleSlip} style={{ display: "none" }} />
                    </label>

                    {verifyStatus === "loading" && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#64748b", padding: "9px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <div style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                        กำลังตรวจสอบสลิปกับระบบธนาคาร...
                      </div>
                    )}
                    {verifyStatus === "ok" && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 12px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {verifyMsg}
                      </div>
                    )}
                    {verifyStatus === "error" && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 12px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        {verifyMsg}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setStep(1)}
                      style={{ padding: "12px 16px", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                      กลับ
                    </button>
                    <button onClick={handleOrder} disabled={ordering || verifyStatus !== "ok"}
                      style={{ flex: 1, padding: "12px", background: verifyStatus === "ok" ? "#1e3a8a" : "#e2e8f0", color: verifyStatus === "ok" ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: verifyStatus === "ok" ? "pointer" : "not-allowed", opacity: ordering ? 0.7 : 1 }}
                      onMouseEnter={e => { if (verifyStatus === "ok") e.currentTarget.style.background = "#172554"; }}
                      onMouseLeave={e => { if (verifyStatus === "ok") e.currentTarget.style.background = "#1e3a8a"; }}>
                      {ordering ? "กำลังดำเนินการ..." : verifyStatus === "ok" ? "ยืนยันคำสั่งซื้อ →" : "รอการยืนยันสลิป"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Success ── */}
      {step === 3 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,.2)", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
            <div style={{ background: "#15803d", padding: "30px 28px 26px", textAlign: "center" }}>
              <div style={{ width: 60, height: 60, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#fff" }}>สั่งซื้อสำเร็จ!</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 5 }}>เงินของคุณอยู่ใน Escrow อย่างปลอดภัย</div>
            </div>

            <div style={{ padding: "22px 26px 26px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>หมายเลขออเดอร์</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", wordBreak: "break-all", fontFamily: "monospace" }}>{orderId}</div>
              </div>

              <div style={{ marginBottom: 22 }}>
                {[
                  ["Seller ได้รับแจ้งแล้ว", "จะจัดส่งสินค้าภายใน 3 วันทำการ"],
                  ["ติดตามออเดอร์ได้ที่", "หน้าคำสั่งซื้อในบัญชีของคุณ"],
                  ["ได้รับของแล้ว", "กดยืนยันเพื่อปล่อยเงินให้ Seller"],
                ].map(([t, d], i) => (
                  <div key={i} style={{ display: "flex", gap: 11, marginBottom: i < 2 ? 12 : 0 }}>
                    <div style={{ width: 22, height: 22, background: "#eff6ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#1e3a8a", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{t}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a href="/orders" style={{ flex: 1, padding: "13px", background: "#1e3a8a", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                  ดูคำสั่งซื้อ
                </a>
                <a href="/shop" style={{ flex: 1, padding: "13px", background: "#f1f5f9", color: "#374151", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
                  ซื้อต่อ
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, inputMode, maxLength }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fafafa", boxSizing: "border-box", transition: "border-color 0.15s" }}
        onFocus={e => e.target.style.borderColor = "#1e3a8a"}
        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
      />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
