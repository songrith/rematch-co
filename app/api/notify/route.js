import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || "ReMatch <noreply@rematch.th>";
const ADMIN  = process.env.ADMIN_EMAIL || "admin@rematch.th";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type } = body;

    switch (type) {
      case "order_placed":     return await orderPlaced(body);
      case "verification_submitted":    return await verificationSubmitted(body);
      case "seller_approved":  return await sellerApproved(body);
      case "seller_rejected":  return await sellerRejected(body);
      case "product_approved": return await productApproved(body);
      case "product_rejected": return await productRejected(body);
      case "order_shipped":    return await orderShipped(body);
      case "dispute_filed":   return await disputeFiled(body);
      case "dispute_denied":              return await disputeDenied(body);
      case "refund_promptpay_submitted":  return await refundPromptpaySubmitted(body);
      case "refund_confirmed":            return await refundConfirmed(body);
      default:
        return Response.json({ ok: false, error: "unknown type" }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function send(to, subject, html) {
  await resend.emails.send({ from: FROM, to, subject, html });
}

function wrap(title, content) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
  <div style="background:#1e293b;padding:24px 32px;">
    <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Re<span style="color:#1e3a8a;">Match</span></span>
  </div>
  <div style="padding:32px;">
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">${title}</h2>
    ${content}
  </div>
  <div style="padding:20px 32px;background:#f1f5f9;border-top:1px solid #e2e8f0;font-size:12px;color:#9ca3af;text-align:center;">
    © 2025 ReMatch · Marketplace เสื้อกีฬาของแท้ · <a href="https://rematch.th/privacy" style="color:#9ca3af;">Privacy Policy</a>
  </div>
</div>
</body></html>`;
}

function row(label, value) {
  return `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">${label}</td><td style="padding:8px 0;font-size:14px;color:#0f172a;font-weight:600;">${value}</td></tr>`;
}

function table(rows) {
  return `<table style="width:100%;border-collapse:collapse;background:#f1f5f9;border-radius:12px;padding:16px;margin:16px 0;">${rows}</table>`;
}

function btn(href, text) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;background:#1e3a8a;color:#fff;padding:12px 28px;border-radius:99px;font-size:14px;font-weight:700;text-decoration:none;">${text}</a>`;
}

// ─── templates ────────────────────────────────────────────────────────────────

async function orderPlaced({ buyerEmail, buyerName, sellerEmail, sellerName, productName, orderId, amount }) {
  const shortId = orderId?.slice(0, 8).toUpperCase();

  // to buyer
  await send(buyerEmail, `✅ ยืนยันคำสั่งซื้อ #${shortId}`, wrap(
    `สั่งซื้อสำเร็จแล้ว!`,
    `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">ขอบคุณที่ซื้อสินค้าผ่าน ReMatch — Seller ได้รับแจ้งแล้วและจะจัดส่งสินค้าภายใน <strong>3 วันทำการ</strong></p>
    ${table(`${row("ออเดอร์", `#${shortId}`)}${row("สินค้า", productName)}${row("ยอดชำระ", `฿${Number(amount).toLocaleString()}`)}${row("Seller", sellerName || "-")}`)}
    ${btn("https://rematch.th/orders", "ดูสถานะออเดอร์")}`
  ));

  // to seller
  if (sellerEmail) {
    await send(sellerEmail, `🛒 มีออเดอร์ใหม่! ${productName}`, wrap(
      `คุณมีออเดอร์ใหม่รอจัดส่ง`,
      `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">กรุณาจัดส่งสินค้าภายใน <strong>3 วันทำการ</strong> หลังได้รับแจ้ง</p>
      ${table(`${row("ออเดอร์", `#${shortId}`)}${row("สินค้า", productName)}${row("ยอดของคุณ", `฿${Number(amount * 0.9).toLocaleString()} (หลังหัก 10%)`)}${row("ผู้ซื้อ", buyerName || "-")}`)}
      ${btn("https://rematch.th/seller/dashboard", "จัดการออเดอร์")}`
    ));
  }

  return Response.json({ ok: true });
}

async function verificationSubmitted({ sellerName, sellerEmail }) {
  await send(ADMIN, `👤 Verified ใหม่รออนุมัติ — ${sellerName}`, wrap(
    `Seller ใหม่รอการตรวจสอบ`,
    `<p style="color:#6b7280;font-size:14px;margin:0 0 16px;">มีคำขอยืนยัน Seller ใหม่รอการอนุมัติ</p>
    ${table(`${row("ชื่อ", sellerName || "-")}${row("อีเมล", sellerEmail || "-")}`)}
    ${btn("https://rematch.th/admin", "ไปหน้า Admin")}`
  ));
  return Response.json({ ok: true });
}

async function sellerApproved({ sellerEmail, sellerName }) {
  await send(sellerEmail, `✅ คุณได้รับการอนุมัติเป็น Seller แล้ว!`, wrap(
    `ยินดีต้อนรับสู่ทีม Seller!`,
    `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">สวัสดี <strong>${sellerName}</strong> — คุณผ่านการยืนยันตัวตนแล้ว สามารถเริ่มลงขายสินค้าได้ทันที</p>
    ${btn("https://rematch.th/sell", "เพิ่มสินค้าแรก →")}`
  ));
  return Response.json({ ok: true });
}

async function sellerRejected({ sellerEmail, sellerName, rejectReason }) {
  await send(sellerEmail, `❌ ขออภัย ไม่ผ่านการยืนยัน Seller`, wrap(
    `ไม่ผ่านการยืนยันตัวตน`,
    `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">สวัสดี <strong>${sellerName}</strong> — ขออภัย คำขอของคุณยังไม่ผ่านการตรวจสอบ</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin:12px 0;">
      <strong style="font-size:13px;color:#dc2626;">เหตุผล:</strong>
      <p style="margin:6px 0 0;font-size:14px;color:#374151;">${rejectReason || "ข้อมูลไม่ถูกต้อง"}</p>
    </div>
    <p style="font-size:13px;color:#9ca3af;margin-top:16px;">หากมีข้อสงสัย ติดต่อทีมงานที่ support@rematch.th</p>`
  ));
  return Response.json({ ok: true });
}

async function productApproved({ sellerEmail, sellerName, productName }) {
  await send(sellerEmail, `✅ สินค้าผ่านการอนุมัติแล้ว — ${productName}`, wrap(
    `สินค้าของคุณพร้อมขายแล้ว!`,
    `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">สวัสดี <strong>${sellerName}</strong> — สินค้าของคุณผ่านการตรวจสอบและแสดงในหน้าหลักแล้ว</p>
    ${table(row("สินค้า", productName))}
    ${btn("https://rematch.th/shop", "ดูสินค้าในร้าน")}`
  ));
  return Response.json({ ok: true });
}

async function productRejected({ sellerEmail, sellerName, productName, rejectReason }) {
  await send(sellerEmail, `❌ สินค้าไม่ผ่านการอนุมัติ — ${productName}`, wrap(
    `สินค้าต้องแก้ไขก่อนแสดง`,
    `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">สวัสดี <strong>${sellerName}</strong> — ขออภัย สินค้าของคุณยังไม่ผ่านการตรวจสอบ</p>
    ${table(row("สินค้า", productName))}
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin:12px 0;">
      <strong style="font-size:13px;color:#dc2626;">เหตุผล:</strong>
      <p style="margin:6px 0 0;font-size:14px;color:#374151;">${rejectReason || "ข้อมูลสินค้าไม่ถูกต้อง"}</p>
    </div>
    ${btn("https://rematch.th/seller/dashboard", "แก้ไขสินค้า")}`
  ));
  return Response.json({ ok: true });
}

async function disputeDenied({ orderId, buyerId, buyerName, productName, denyReason }) {
  const sb = adminSupabase();
  const shortId = orderId?.slice(0, 8).toUpperCase();

  const { data: buyer } = await sb.from("profiles").select("email, full_name").eq("id", buyerId).single();

  // In-app notification for buyer
  await sb.from("notifications").insert({
    user_id:  buyerId,
    type:     "slip_rejected",
    message:  `❌ คำร้องขอ Refund ออเดอร์ #${shortId} ถูกปฏิเสธ`,
    order_id: orderId,
    read:     false,
  });

  // Email → buyer
  if (buyer?.email) {
    await send(buyer.email, `❌ คำร้องขอ Refund ออเดอร์ #${shortId} ไม่ผ่านการพิจารณา`, wrap(
      `คำร้องของคุณถูกปฏิเสธ`,
      `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">สวัสดี <strong>${buyerName || buyer.full_name || "ลูกค้า"}</strong> — ทีมงาน ReMatch ได้ตรวจสอบคำร้องของคุณแล้วและไม่สามารถอนุมัติ Refund ในครั้งนี้</p>
      ${table(`${row("ออเดอร์", `#${shortId}`)}${row("สินค้า", productName || "—")}`)}
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 18px;margin:16px 0;">
        <div style="font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">เหตุผลที่ปฏิเสธ</div>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${denyReason}</p>
      </div>
      <p style="font-size:13px;color:#9ca3af;margin-top:16px;">หากมีข้อสงสัยหรือต้องการข้อมูลเพิ่มเติม กรุณาติดต่อทีมงานที่ support@rematch.th</p>`
    )).catch(() => {});
  }

  return Response.json({ ok: true });
}

async function disputeFiled({ orderId, sellerId, productName, disputeType, buyerName }) {
  const sb = adminSupabase();
  const shortId = orderId?.slice(0, 8).toUpperCase();

  // Fetch seller profile
  const { data: seller } = await sb.from("profiles").select("email, full_name").eq("id", sellerId).single();

  // In-app notification for seller
  await sb.from("notifications").insert({
    user_id:  sellerId,
    type:     "order_disputed",
    message:  `⚠️ มีการแจ้งปัญหาออเดอร์ #${shortId} — ${disputeType}`,
    order_id: orderId,
    read:     false,
  });

  // Email → seller
  if (seller?.email) {
    await send(seller.email, `⚠️ มีการแจ้งปัญหาออเดอร์ #${shortId}`, wrap(
      `ผู้ซื้อแจ้งปัญหากับสินค้าของคุณ`,
      `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">สวัสดี <strong>${seller.full_name || "Seller"}</strong> — ผู้ซื้อได้ยื่นคำร้องเกี่ยวกับออเดอร์ด้านล่าง ทีมงาน ReMatch จะตรวจสอบและติดต่อกลับภายใน 3–5 วันทำการ</p>
      ${table(`${row("ออเดอร์", `#${shortId}`)}${row("สินค้า", productName || "—")}${row("ประเภทปัญหา", disputeType || "—")}${row("ผู้ซื้อ", buyerName || "—")}`)}
      <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#92400e;">⏳ กรุณารอการตรวจสอบจากทีมงาน อย่าโอนเงินหรือส่งสินค้าเพิ่มเติมจนกว่าจะได้รับการยืนยัน</div>
      ${btn("https://rematch.th/seller/dashboard", "ดูสถานะออเดอร์")}`
    )).catch(() => {});
  }

  // Email → admin
  await send(ADMIN, `🚨 [Dispute] ออเดอร์ #${shortId} — ${disputeType}`, wrap(
    `มีการแจ้งปัญหาออเดอร์รอตรวจสอบ`,
    `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">ผู้ซื้อ <strong>${buyerName || "—"}</strong> ยื่นคำร้องขอ Refund/เปลี่ยนสินค้า</p>
    ${table(`${row("ออเดอร์", `#${shortId}`)}${row("สินค้า", productName || "—")}${row("ประเภทปัญหา", disputeType || "—")}${row("Seller", seller?.full_name || "—")}${row("อีเมล Seller", seller?.email || "—")}`)}
    ${btn("https://rematch.th/admin", "ไปหน้า Admin →")}`
  )).catch(() => {});

  return Response.json({ ok: true });
}

async function refundPromptpaySubmitted({ orderId, buyerName, productName, amount, promptpay }) {
  const shortId = orderId?.slice(0, 8).toUpperCase();
  await send(ADMIN, `💸 รอโอนเงินคืน — ออเดอร์ #${shortId}`, wrap(
    `ผู้ซื้อกรอก PromptPay แล้ว — รอโอนเงินคืน`,
    `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">
      ผู้ซื้อ <strong>${buyerName || "—"}</strong> ได้กรอกเลข PromptPay แล้ว กรุณาโอนเงินคืนโดยเร็วที่สุด
    </p>
    ${table(`
      ${row("ออเดอร์", `#${shortId}`)}
      ${row("สินค้า", productName || "—")}
      ${row("ยอดที่ต้องคืน", `<strong style="color:#dc2626;">฿${Number(amount || 0).toLocaleString()}</strong>`)}
      ${row("PromptPay ผู้ซื้อ", `<span style="font-family:monospace;font-size:15px;font-weight:700;color:#0f172a;letter-spacing:1px;">${promptpay}</span>`)}
    `)}
    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin:16px 0;font-size:13px;color:#92400e;">
      ⚠️ กรุณาโอนเงินผ่าน PromptPay ข้างต้น และอัปเดตสถานะใน Admin Panel
    </div>
    ${btn("https://rematch.th/admin", "ไปหน้า Admin →")}`
  )).catch(() => {});
  return Response.json({ ok: true });
}

async function refundConfirmed({ orderId, buyerId, buyerName, productName, amount, slipUrl }) {
  const sb = adminSupabase();
  const shortId = orderId?.slice(0, 8).toUpperCase();

  await sb.from("notifications").insert({
    user_id:  buyerId,
    type:     "refund_confirmed",
    message:  `✅ เงินคืน ฿${Number(amount).toLocaleString()} ออเดอร์ #${shortId} เข้า PromptPay แล้ว`,
    order_id: orderId,
    read:     false,
  });

  const { data: buyer } = await sb.from("profiles").select("email, full_name").eq("id", buyerId).single();
  if (buyer?.email) {
    await send(buyer.email, `✅ เงินคืนเข้า PromptPay แล้ว — ออเดอร์ #${shortId}`, wrap(
      `เงินคืนของคุณถูกโอนแล้ว! 🎉`,
      `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">
        สวัสดี <strong>${buyerName || buyer.full_name || "ลูกค้า"}</strong> — ทีมงาน ReMatch ได้โอนเงินคืนให้คุณแล้ว
        กรุณาตรวจสอบ PromptPay ของคุณ
      </p>
      ${table(`
        ${row("ออเดอร์", `#${shortId}`)}
        ${row("สินค้า", productName || "—")}
        ${row("ยอดที่ได้รับคืน", `<strong style="font-size:16px;color:#15803d;">฿${Number(amount || 0).toLocaleString()}</strong>`)}
      `)}
      ${slipUrl ? `
        <div style="margin:20px 0;">
          <div style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">หลักฐานการโอน</div>
          <img src="${slipUrl}" alt="สลิปโอนเงิน" style="max-width:220px;border-radius:12px;border:1px solid #e5e7eb;display:block;" />
        </div>` : ""}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin:16px 0;font-size:13px;color:#15803d;">
        ✅ ธุรกรรมเสร็จสมบูรณ์ — ขอบคุณที่ใช้บริการ ReMatch
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0;">หากมีข้อสงสัย ติดต่อ support@rematch.th</p>`
    )).catch(() => {});
  }

  return Response.json({ ok: true });
}

async function orderShipped({ buyerEmail, buyerName, productName, orderId, trackingNumber, courier }) {
  const shortId = orderId?.slice(0, 8).toUpperCase();
  const courierLabel = { thaipost: "ไปรษณีย์ไทย / EMS", kerry: "Kerry Express", flash: "Flash Express", jt: "J&T Express", dhl: "DHL", other: "อื่นๆ" };

  await send(buyerEmail, `📦 สินค้าถูกจัดส่งแล้ว! #${shortId}`, wrap(
    `สินค้ากำลังมาหาคุณแล้ว!`,
    `<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 16px;">สวัสดี <strong>${buyerName}</strong> — Seller จัดส่งสินค้าของคุณแล้ว</p>
    ${table(`${row("สินค้า", productName)}${row("ออเดอร์", `#${shortId}`)}${row("บริษัทขนส่ง", courierLabel[courier] || courier || "-")}${row("เลข Tracking", `<span style="font-family:monospace;font-size:15px;font-weight:700;color:#172554;">${trackingNumber}</span>`)}`)}
    <p style="font-size:13px;color:#9ca3af;margin-top:16px;">หลังรับสินค้าแล้ว กรุณายืนยันใน <a href="https://rematch.th/orders" style="color:#1e3a8a;">หน้าออเดอร์</a></p>`
  ));

  return Response.json({ ok: true });
}
