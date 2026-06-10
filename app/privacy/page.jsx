"use client";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e3a8a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>นโยบายความเป็นส่วนตัว</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "#0f0f0e", margin: "0 0 8px", lineHeight: 1.2 }}>Privacy Policy</h1>
        <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 48px" }}>มีผลบังคับใช้ตั้งแต่วันที่ 19 พฤษภาคม 2568</p>

        <Section title="1. บทนำ">
          <p>ReMatch ("บริษัท", "เรา") ให้ความสำคัญสูงสุดกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน นโยบายฉบับนี้อธิบายว่าเราเก็บรวบรวม ใช้ เปิดเผย และดูแลข้อมูลส่วนบุคคลของท่านอย่างไร ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>
        </Section>

        <Section title="2. ข้อมูลที่เราเก็บรวบรวม">
          <p>เราเก็บรวบรวมข้อมูลส่วนบุคคลดังต่อไปนี้:</p>
          <ul>
            <li><strong>ข้อมูลบัญชี:</strong> ชื่อ-นามสกุล อีเมล หมายเลขโทรศัพท์ รหัสผ่าน (เข้ารหัสแล้ว)</li>
            <li><strong>ข้อมูลการจัดส่ง:</strong> ที่อยู่จัดส่ง แขวง เขต จังหวัด รหัสไปรษณีย์</li>
            <li><strong>ข้อมูลการยืนยันตัวตน (สำหรับผู้ขาย):</strong> สำเนาบัตรประชาชน รูปถ่ายเซลฟี่ถือบัตร</li>
            <li><strong>ข้อมูลธุรกรรม:</strong> ประวัติการซื้อขาย หลักฐานการโอนเงิน</li>
            <li><strong>ข้อมูลทางเทคนิค:</strong> IP address, ข้อมูล browser, ประวัติการใช้งาน</li>
          </ul>
        </Section>

        <Section title="3. วัตถุประสงค์การใช้ข้อมูล">
          <p>เราใช้ข้อมูลส่วนบุคคลของท่านเพื่อ:</p>
          <ul>
            <li>ดำเนินการและจัดการบัญชีผู้ใช้งาน</li>
            <li>ประมวลผลคำสั่งซื้อและการชำระเงิน</li>
            <li>ยืนยันตัวตนผู้ขาย เพื่อความปลอดภัยของแพลตฟอร์ม</li>
            <li>จัดส่งสินค้าและติดต่อสื่อสารเกี่ยวกับออเดอร์</li>
            <li>ป้องกันการทุจริตและรักษาความปลอดภัยของระบบ</li>
            <li>ปฏิบัติตามภาระผูกพันทางกฎหมาย</li>
          </ul>
        </Section>

        <Section title="4. ฐานทางกฎหมายในการประมวลผลข้อมูล">
          <p>เราประมวลผลข้อมูลส่วนบุคคลของท่านบนพื้นฐาน:</p>
          <ul>
            <li><strong>การปฏิบัติตามสัญญา:</strong> เพื่อให้บริการซื้อขายแก่ท่าน</li>
            <li><strong>ความยินยอม:</strong> สำหรับข้อมูลที่ท่านให้ไว้โดยสมัครใจ เช่น ข้อมูลยืนยันตัวตน</li>
            <li><strong>ประโยชน์โดยชอบด้วยกฎหมาย:</strong> เพื่อปรับปรุงบริการและป้องกันการทุจริต</li>
            <li><strong>การปฏิบัติตามกฎหมาย:</strong> เมื่อกฎหมายกำหนดให้เปิดเผยข้อมูล</li>
          </ul>
        </Section>

        <Section title="5. การเปิดเผยข้อมูลแก่บุคคลที่สาม">
          <p>เราจะไม่ขายข้อมูลส่วนบุคคลของท่าน เราอาจเปิดเผยข้อมูลในกรณีต่อไปนี้เท่านั้น:</p>
          <ul>
            <li><strong>ผู้ให้บริการที่ผ่านการคัดกรอง:</strong> Supabase (ฐานข้อมูล), EasySlip (ตรวจสอบสลิป)</li>
            <li><strong>ตามคำสั่งกฎหมาย:</strong> เมื่อได้รับหมายศาลหรือคำสั่งจากหน่วยงานที่มีอำนาจ</li>
            <li><strong>การโอนกิจการ:</strong> หากบริษัทถูกควบรวมหรือโอนกิจการ ท่านจะได้รับแจ้งล่วงหน้า</li>
          </ul>
        </Section>

        <Section title="6. ระยะเวลาในการเก็บรักษาข้อมูล">
          <ul>
            <li>ข้อมูลบัญชี: ตลอดระยะเวลาที่บัญชียังคงอยู่ + 1 ปีหลังปิดบัญชี</li>
            <li>ข้อมูลยืนยันตัวตน (บัตรประชาชน/เซลฟี่): 3 ปีนับจากวันสมัครเป็นผู้ขาย</li>
            <li>ข้อมูลธุรกรรม: 5 ปี ตามกฎหมายบัญชีและภาษี</li>
            <li>หลักฐานการชำระเงิน: 5 ปี</li>
          </ul>
        </Section>

        <Section title="7. สิทธิของเจ้าของข้อมูล">
          <p>ท่านมีสิทธิดังต่อไปนี้ภายใต้ PDPA:</p>
          <ul>
            <li><strong>สิทธิในการเข้าถึง:</strong> ขอสำเนาข้อมูลส่วนบุคคลของท่าน</li>
            <li><strong>สิทธิในการแก้ไข:</strong> แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
            <li><strong>สิทธิในการลบ:</strong> ขอให้ลบข้อมูลเมื่อไม่จำเป็นอีกต่อไป</li>
            <li><strong>สิทธิในการโอนย้ายข้อมูล:</strong> ขอรับข้อมูลในรูปแบบที่สามารถอ่านได้ด้วยเครื่อง</li>
            <li><strong>สิทธิในการคัดค้าน:</strong> คัดค้านการประมวลผลข้อมูลในบางกรณี</li>
            <li><strong>สิทธิในการถอนความยินยอม:</strong> ถอนความยินยอมได้ทุกเมื่อ</li>
          </ul>
          <p>ติดต่อใช้สิทธิ์ที่: <strong>privacy@rematch.th</strong> ภายใน 30 วัน</p>
        </Section>

        <Section title="8. การรักษาความปลอดภัย">
          <p>เราใช้มาตรการรักษาความปลอดภัยมาตรฐานอุตสาหกรรม ได้แก่:</p>
          <ul>
            <li>การเข้ารหัสข้อมูล TLS/SSL สำหรับการรับส่งข้อมูล</li>
            <li>Row-Level Security (RLS) บนฐานข้อมูล</li>
            <li>การเข้ารหัสรหัสผ่านด้วย bcrypt</li>
            <li>การจำกัดสิทธิ์การเข้าถึงข้อมูลตามบทบาท</li>
          </ul>
        </Section>

        <Section title="9. คุกกี้">
          <p>เราใช้คุกกี้ที่จำเป็นสำหรับการทำงานของระบบ (Session cookie) เพื่อรักษาสถานะการเข้าสู่ระบบ เราไม่ใช้คุกกี้ติดตามพฤติกรรมโฆษณาหรือ third-party tracking cookies</p>
        </Section>

        <Section title="10. การเปลี่ยนแปลงนโยบาย">
          <p>หากมีการเปลี่ยนแปลงสาระสำคัญ เราจะแจ้งท่านผ่านอีเมลที่ลงทะเบียนไว้ล่วงหน้าไม่น้อยกว่า 30 วัน การใช้งานต่อเนื่องหลังจากวันที่มีผลบังคับใช้ถือว่าท่านยอมรับนโยบายที่แก้ไขแล้ว</p>
        </Section>

        <Section title="11. ติดต่อเรา">
          <p>หากมีข้อสงสัยเกี่ยวกับนโยบายนี้ ติดต่อได้ที่:</p>
          <ul>
            <li>อีเมล: <strong>privacy@rematch.th</strong></li>
            <li>ผู้ควบคุมข้อมูลส่วนบุคคล: ReMatch Co., Ltd.</li>
          </ul>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e2e8f0", display: "flex", gap: 24 }}>
          <a href="/terms-of-service" style={{ fontSize: 13, color: "#1e3a8a", textDecoration: "none" }}>ข้อกำหนดการใช้บริการ →</a>
          <a href="/" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>กลับหน้าหลัก</a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f0f0e", margin: "0 0 12px", paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>{title}</h2>
      <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}
