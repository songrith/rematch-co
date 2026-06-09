"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const TERMS = [
  {
    icon: "✅",
    title: "สินค้าแท้ 100%",
    desc: "หากได้รับการร้องเรียนเรื่องสินค้าปลอม ผู้ขายจะได้รับโอกาสยืนยันความแท้ของสินค้า หากไม่สามารถพิสูจน์ได้ บัญชีจะถูกระงับทันทีโดยไม่มีการแจ้งล่วงหน้า",
  },
  {
    icon: "🔒",
    title: "ระบบ Escrow",
    desc: "เงินจากผู้ซื้อจะถูกพักไว้ในระบบ Escrow ของ ReMatch จนกว่าผู้ซื้อจะยืนยันว่าได้รับสินค้าแล้ว Seller จะได้รับเงินหลังหักค่าธรรมเนียมแพลตฟอร์ม",
  },
  {
    icon: "🚚",
    title: "จัดส่งภายใน 3 วันทำการ",
    desc: "หลังจากได้รับแจ้งยืนยันการชำระเงิน Seller ต้องจัดส่งสินค้าและกรอกเลข Tracking ภายใน 3 วันทำการ หากเกินกำหนดโดยไม่มีเหตุผล อาจถูกพิจารณาระงับสิทธิ์",
  },
  {
    icon: "⚖️",
    title: "การระงับข้อพิพาท",
    desc: "ในกรณีที่มีข้อพิพาท ReMatch จะเป็นผู้ตัดสินใจขั้นสุดท้าย Seller ต้องให้ความร่วมมือในการตรวจสอบและส่งหลักฐานภายใน 48 ชั่วโมงที่ได้รับการติดต่อ",
  },
  {
    icon: "🔐",
    title: "ความเป็นส่วนตัวของข้อมูล",
    desc: "ข้อมูลส่วนตัวและเอกสาร KYC ทั้งหมดจะถูกเก็บเป็นความลับ ใช้เพื่อการยืนยันตัวตนและตรวจสอบตัวตนเท่านั้น ไม่มีการเปิดเผยต่อบุคคลที่สาม",
  },
];

export default function SellerTermsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: ver } = await supabase
        .from("seller_verifications")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ver) { router.push("/seller/verify"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "seller") { router.push("/seller/dashboard"); return; }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <button onClick={async () => { try { await supabase.auth.signOut(); } catch {} window.location.reload(); }}
          style={{ background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 16px", borderRadius: 99, fontSize: 13, cursor: "pointer" }}>
          ออกจากระบบ
        </button>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#e2e8f0", border: "1px solid #cbd5e1", color: "#172554", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 99, marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, background: "#1e3a8a", borderRadius: "50%", display: "inline-block" }} />
            ขั้นตอนที่ 1 จาก 2
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: "#0f0f0e", margin: "0 0 12px", letterSpacing: -0.5 }}>
            เงื่อนไขการเป็น Seller
          </h1>
          <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            กรุณาอ่านและทำความเข้าใจเงื่อนไขต่อไปนี้ก่อนสมัครเป็น Seller บนแพลตฟอร์ม ReMatch
          </p>
        </div>

        {/* Terms list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {TERMS.map((t, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 28px", display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{t.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f0f0e", marginBottom: 6 }}>{t.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Agree card */}
        <div style={{ background: "#fff", border: `2px solid ${agreed ? "#1e3a8a" : "#e5e7eb"}`, borderRadius: 16, padding: "24px 28px", marginBottom: 24, transition: "border-color 0.2s" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: "#1e3a8a", cursor: "pointer", flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
              ข้าพเจ้าได้อ่าน เข้าใจ และ<strong>ยอมรับเงื่อนไขและข้อตกลงของ Seller</strong> ทั้งหมดข้างต้นแล้ว
              และยืนยันว่าจะปฏิบัติตามนโยบายของ ReMatch อย่างเคร่งครัด
            </span>
          </label>
        </div>

        {/* CTA */}
        <button
          onClick={() => agreed && router.push("/seller/verify")}
          disabled={!agreed}
          style={{ width: "100%", padding: "15px", background: agreed ? "#0f0f0e" : "#e5e7eb", color: agreed ? "#fff" : "#9ca3af", border: "none", borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: agreed ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
          ยอมรับและดำเนินการต่อ →
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 14 }}>
          ขั้นตอนถัดไป: ยืนยันตัวตน KYC (บัตรประชาชน + ข้อมูลธนาคาร)
        </p>
      </div>
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
