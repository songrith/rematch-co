"use client";

const ELIGIBLE = [
  {
    icon: "🥷",
    title: "สินค้าปลอม / เก๊",
    desc: "ได้รับสินค้าที่ไม่ใช่ของแท้ หรือมีหลักฐานพิสูจน์ได้ว่าไม่ใช่ของจริงตามที่ระบุ",
    examples: ["tag ไม่ตรงกับแบรนด์", "ตะเข็บหรือผ้าผิดปกติ", "hologram หรือ label ปลอม"],
  },
  {
    icon: "📷",
    title: "สินค้าไม่ตรงกับรูป",
    desc: "สินค้าที่ได้รับต่างจากรูปในประกาศอย่างมีนัยสำคัญ เช่น สี รุ่น หรือลวดลาย",
    examples: ["สีต่างจากรูปอย่างชัดเจน", "รุ่นหรือซีซั่นผิด", "มีตำหนิที่ไม่ได้ระบุไว้"],
  },
  {
    icon: "📦",
    title: "ไม่ได้รับสินค้า",
    desc: "กดยืนยันรับสินค้าแล้วแต่ไม่ได้รับจริง หรือพัสดุสูญหายระหว่างขนส่ง",
    examples: ["กล่องว่างเปล่า", "ได้รับสินค้าผิดชิ้น", "Tracking ระบุจัดส่งแต่ไม่มีสินค้า"],
  },
  {
    icon: "💥",
    title: "สินค้าชำรุดเสียหาย",
    desc: "สินค้าได้รับความเสียหายระหว่างการขนส่ง หรือสภาพไม่ตรงตามที่ระบุในประกาศ",
    examples: ["รอยฉีกขาดที่ไม่ได้ระบุ", "ขนาดไม่ตรงกับที่ระบุ", "อุปกรณ์เสริมขาดหาย"],
  },
];

const NOT_ELIGIBLE = [
  "เปลี่ยนใจหลังจากได้รับสินค้า",
  "ไม่ชอบสินค้าแต่สินค้าถูกต้องตรงตามที่ระบุ",
  "ขอ Refund หลังเกิน 3 วันนับจากวันยืนยันรับสินค้า",
  "สินค้าถูกใช้งานหรือชักซักแล้ว",
  "ไม่มีหลักฐานประกอบ (รูปถ่าย / วิดีโอ)",
];

const RETURN_STEPS = [
  { n: "1", title: "ยื่นคำร้องภายใน 3 วัน", desc: "กดปุ่ม 'ขอ Refund' ในหน้าคำสั่งซื้อพร้อมแนบหลักฐาน" },
  { n: "2", title: "รอทีมงานอนุมัติ", desc: "ทีมงานตรวจสอบและแจ้งผลภายใน 3–5 วันทำการ" },
  { n: "3", title: "จัดส่งสินค้าคืน", desc: "หากอนุมัติ ลูกค้าต้องส่งสินค้ากลับมาที่ทางร้านภายใน 7 วัน โดยลูกค้าเป็นผู้รับผิดชอบค่าส่ง" },
  { n: "4", title: "ร้านตรวจรับสินค้า", desc: "ทีมงานตรวจสอบสินค้าที่ได้รับคืน ว่าตรงกับที่แจ้งไว้" },
  { n: "5", title: "คืนเงินภายใน 14 วัน", desc: "เมื่อตรวจสอบผ่าน เงินจะคืนผ่านช่องทางเดิมภายใน 14 วันทำการ" },
];

export default function RefundPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <a href="/orders" style={{ fontSize: 13, color: "#374151", textDecoration: "none", padding: "7px 16px", borderRadius: 99, border: "1px solid #e5e7eb" }}>
          คำสั่งซื้อของฉัน
        </a>
      </nav>

      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8edf5", padding: "52px 48px 44px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 10 }}>นโยบาย</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#0f172a", margin: "0 0 14px", letterSpacing: -0.8 }}>
            นโยบายการคืนเงิน
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 24px", lineHeight: 1.8, maxWidth: 560 }}>
            ReMatch ปกป้องผู้ซื้อด้วยระบบ Escrow — เงินของคุณปลอดภัยจนกว่าจะได้รับสินค้าที่ถูกต้อง
          </p>
          {/* Banners */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "12px 20px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1d4ed8" }}>ยื่นคำร้องได้ภายใน <strong>3 วัน</strong> หลังยืนยันรับสินค้า</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "12px 20px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#15803d" }}>ส่งสินค้าคืนและรับเงินคืนภายใน <strong>14 วัน</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "40px auto 80px", padding: "0 48px" }}>

        {/* กรณีที่ได้ Refund */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 28, height: 28, background: "#dcfce7", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</span>
            กรณีที่ได้รับ Refund
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ELIGIBLE.map((item, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #e8edf5", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 12 }}>{item.desc}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {item.examples.map((ex, j) => (
                        <span key={j} style={{ fontSize: 12, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 99, padding: "3px 10px" }}>
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* กรณีที่ไม่ได้ Refund */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 28, height: 28, background: "#fee2e2", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</span>
            กรณีที่ไม่ได้รับ Refund
          </h2>
          <div style={{ background: "#fff", border: "1.5px solid #e8edf5", borderRadius: 16, padding: "20px 24px" }}>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {NOT_ELIGIBLE.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#374151" }}>
                  <span style={{ color: "#ef4444", fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* นโยบายการส่งคืนสินค้า */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 28, height: 28, background: "#dbeafe", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📦</span>
            เงื่อนไขการส่งคืนสินค้า
          </h2>
          <div style={{ background: "#fff", border: "1.5px solid #bfdbfe", borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📬</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>ลูกค้าต้องส่งสินค้าคืนมาที่ทางร้าน</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>เมื่อทีมงานอนุมัติคำร้องแล้ว ลูกค้าจะได้รับที่อยู่สำหรับส่งคืน และต้องจัดส่งสินค้ากลับมาภายใน <strong>7 วัน</strong> ค่าจัดส่งเป็นความรับผิดชอบของลูกค้า</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #dbeafe", paddingTop: 12, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⏱️</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>คืนเงินภายใน 14 วันทำการ</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>หลังทีมงานได้รับและตรวจสอบสินค้าคืนเรียบร้อยแล้ว เงินจะถูกโอนคืนผ่านช่องทางเดิมภายใน <strong>14 วันทำการ</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* ขั้นตอน */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>ขั้นตอนการยื่นคำร้อง</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {RETURN_STEPS.map((step, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 16, position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: i === 2 ? "#1e3a8a" : "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{step.n}</div>
                  {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "#e2e8f0", margin: "4px 0" }} />}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 24 : 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                    {step.title}
                    {i === 2 && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", padding: "2px 8px", borderRadius: 99, border: "1px solid #bfdbfe" }}>ลูกค้ารับผิดชอบค่าส่ง</span>}
                    {i === 4 && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#15803d", background: "#f0fdf4", padding: "2px 8px", borderRadius: 99, border: "1px solid #bbf7d0" }}>14 วันทำการ</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "#0f172a", borderRadius: 20, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>มีปัญหากับออเดอร์?</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>ยื่นคำร้องได้ทันทีในหน้าคำสั่งซื้อ</div>
          </div>
          <a href="/orders" style={{ background: "#fff", color: "#0f172a", fontWeight: 700, fontSize: 14, padding: "11px 28px", borderRadius: 99, textDecoration: "none", flexShrink: 0 }}>
            ไปที่คำสั่งซื้อ →
          </a>
        </div>

      </div>
    </div>
  );
}
