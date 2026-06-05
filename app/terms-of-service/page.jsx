"use client";

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e3a8a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>ข้อตกลงและเงื่อนไข</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "#0f0f0e", margin: "0 0 8px", lineHeight: 1.2 }}>Terms of Service</h1>
        <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 48px" }}>มีผลบังคับใช้ตั้งแต่วันที่ 19 พฤษภาคม 2568</p>

        <Section title="1. การยอมรับข้อกำหนด">
          <p>การเข้าใช้งานหรือลงทะเบียนบนแพลตฟอร์ม ReMatch ("แพลตฟอร์ม") ถือว่าท่านยอมรับข้อกำหนดการใช้บริการฉบับนี้ทุกประการ หากท่านไม่ยอมรับ กรุณางดใช้งานแพลตฟอร์ม</p>
        </Section>

        <Section title="2. คำจำกัดความ">
          <ul>
            <li><strong>แพลตฟอร์ม:</strong> เว็บไซต์และบริการทั้งหมดภายใต้ ReMatch</li>
            <li><strong>ผู้ใช้:</strong> บุคคลที่ลงทะเบียนและ/หรือใช้งานแพลตฟอร์ม</li>
            <li><strong>ผู้ซื้อ:</strong> ผู้ใช้ที่ซื้อสินค้าผ่านแพลตฟอร์ม</li>
            <li><strong>ผู้ขาย:</strong> ผู้ใช้ที่ได้รับการยืนยันตัวตนและได้รับอนุญาตให้ลงขายสินค้า</li>
            <li><strong>Escrow:</strong> ระบบพักเงินที่แพลตฟอร์มถือครองเงินไว้จนกว่าการซื้อขายจะสำเร็จ</li>
          </ul>
        </Section>

        <Section title="3. สินค้าและการลงประกาศ">
          <p>ผู้ขายรับรองและรับประกันว่า:</p>
          <ul>
            <li>สินค้าทุกชิ้นเป็นสินค้า <strong>ของแท้ 100%</strong> ไม่ใช่ของปลอมหรือ replica</li>
            <li>รูปถ่ายและรายละเอียดสินค้าตรงกับสภาพจริงของสินค้า</li>
            <li>ผู้ขายเป็นเจ้าของสินค้าหรือมีสิทธิ์ขายสินค้านั้นโดยชอบด้วยกฎหมาย</li>
            <li>ราคาสินค้าที่ระบุเป็นราคาที่รวมทุกอย่างแล้ว (ไม่รวมค่าส่งหากมี)</li>
          </ul>
          <p>แพลตฟอร์มมีสิทธิ์ปฏิเสธหรือลบประกาศที่ไม่เป็นไปตามข้อกำหนดโดยไม่ต้องแจ้งล่วงหน้า</p>
        </Section>

        <Section title="4. ระบบ Escrow และการชำระเงิน">
          <ul>
            <li>เงินจากผู้ซื้อจะถูกพักไว้กับ ReMatch จนกว่าสินค้าจะถูกจัดส่งและยืนยันการรับ</li>
            <li>ค่าบริการแพลตฟอร์ม 10% จะถูกหักจากยอดขายของผู้ขายในแต่ละธุรกรรม</li>
            <li>การชำระเงินผ่านระบบ PromptPay เท่านั้น</li>
            <li>หลักฐานการโอนเงิน (สลิป) จะถูกตรวจสอบด้วยระบบอัตโนมัติ</li>
          </ul>
        </Section>

        <Section title="5. การจัดส่ง">
          <ul>
            <li>ผู้ขายต้องจัดส่งสินค้าภายใน <strong>3 วันทำการ</strong> หลังจากได้รับการยืนยันคำสั่งซื้อ</li>
            <li>ผู้ขายต้องแจ้งหมายเลขพัสดุให้แพลตฟอร์มและผู้ซื้อทราบ</li>
            <li>ค่าจัดส่งเป็นความรับผิดชอบของผู้ขาย เว้นแต่จะระบุไว้ในประกาศ</li>
          </ul>
        </Section>

        <Section title="6. การยืนยันตัวตนผู้ขาย (KYC)">
          <ul>
            <li>ผู้ขายต้องส่งสำเนาบัตรประชาชนและรูปเซลฟี่ถือบัตร</li>
            <li>ข้อมูล KYC จะถูกเก็บรักษาเป็นความลับตาม Privacy Policy</li>
            <li>แพลตฟอร์มขอสงวนสิทธิ์ปฏิเสธหรือยกเลิกการอนุมัติผู้ขายหากพบข้อมูลเท็จ</li>
            <li>ผู้ขายที่ถูกยกเลิกสถานะจะไม่ได้รับคืนค่าธรรมเนียมหากมี</li>
          </ul>
        </Section>

        <Section title="7. ข้อพิพาทและการคืนเงิน">
          <ul>
            <li>หากสินค้าที่ได้รับไม่ตรงตามที่ระบุ ผู้ซื้อต้องแจ้งภายใน <strong>48 ชั่วโมง</strong> หลังรับสินค้า</li>
            <li>แพลตฟอร์มจะเป็นผู้ตัดสินข้อพิพาทโดยพิจารณาจากหลักฐานทั้งสองฝ่าย</li>
            <li>การตัดสินของแพลตฟอร์มถือเป็นที่สิ้นสุด</li>
            <li>การคืนเงินจะดำเนินการภายใน 7 วันทำการหลังจากตัดสินข้อพิพาทเสร็จสิ้น</li>
          </ul>
        </Section>

        <Section title="8. พฤติกรรมต้องห้าม">
          <p>ผู้ใช้งานห้ามกระทำดังต่อไปนี้:</p>
          <ul>
            <li>ลงขายสินค้าปลอม ของเถื่อน หรือสินค้าละเมิดลิขสิทธิ์</li>
            <li>สร้างบัญชีปลอมหรือให้ข้อมูลเท็จในการสมัคร</li>
            <li>พยายามทำธุรกรรมนอกแพลตฟอร์มเพื่อหลีกเลี่ยงค่าธรรมเนียม</li>
            <li>โจมตีระบบหรือพยายามเข้าถึงข้อมูลของผู้ใช้อื่นโดยไม่ได้รับอนุญาต</li>
            <li>ใช้ภาษาหรือเนื้อหาที่ไม่เหมาะสมในการสื่อสารบนแพลตฟอร์ม</li>
          </ul>
          <p>การฝ่าฝืนอาจส่งผลให้ถูกระงับหรือยกเลิกบัญชีถาวร และอาจดำเนินการทางกฎหมายหากมีความเสียหายเกิดขึ้น</p>
        </Section>

        <Section title="9. การจำกัดความรับผิด">
          <p>ReMatch เป็นเพียงตัวกลางในการซื้อขาย เราไม่รับผิดชอบต่อ:</p>
          <ul>
            <li>ความเสียหายที่เกิดจากสินค้าที่ผู้ขายลงประกาศ</li>
            <li>การสูญหายหรือเสียหายของสินค้าระหว่างการขนส่ง</li>
            <li>ความล่าช้าของระบบที่อยู่นอกเหนือการควบคุม</li>
          </ul>
          <p>ความรับผิดสูงสุดของแพลตฟอร์มจำกัดไม่เกินมูลค่าธุรกรรมที่เกี่ยวข้องนั้น</p>
        </Section>

        <Section title="10. กฎหมายที่ใช้บังคับ">
          <p>ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทที่ไม่สามารถระงับได้จะนำเสนอต่อศาลที่มีเขตอำนาจในประเทศไทย</p>
        </Section>

        <Section title="11. การแก้ไขข้อกำหนด">
          <p>เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดนี้ได้ตลอดเวลา การแจ้งเตือนจะส่งทางอีเมลล่วงหน้า 30 วัน การใช้งานต่อเนื่องถือว่ายอมรับข้อกำหนดที่แก้ไขแล้ว</p>
        </Section>

        <Section title="12. ติดต่อเรา">
          <p>หากมีข้อสงสัย ติดต่อได้ที่: <strong>support@rematch.th</strong></p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e2e8f0", display: "flex", gap: 24 }}>
          <a href="/privacy" style={{ fontSize: 13, color: "#1e3a8a", textDecoration: "none" }}>นโยบายความเป็นส่วนตัว →</a>
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
