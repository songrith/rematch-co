import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || "ReMatch <onboarding@resend.dev>";

async function sign(payload) {
  const secret = process.env.RESEND_API_KEY || "otp-secret-fallback";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return Response.json({ ok: false, error: "ไม่พบอีเมล" }, { status: 400 });

    const code    = String(Math.floor(100000 + Math.random() * 900000));
    const exp     = Date.now() + 10 * 60 * 1000;
    const payload = `${code}:${email}:${exp}`;
    const sig     = await sign(payload);
    const token   = btoa(payload) + "." + sig;

    await resend.emails.send({
      from: FROM,
      to:   email,
      subject: `รหัส OTP ของคุณคือ ${code} — ReMatch`,
      html: `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
  <div style="background:#1e293b;padding:24px 32px;">
    <span style="font-size:20px;font-weight:900;color:#fff;">Re<span style="color:#3b82f6;">Match</span></span>
  </div>
  <div style="padding:32px;">
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">รหัส OTP ยืนยันตัวตน Seller</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.7;">ใช้รหัสนี้เพื่อยืนยันการสมัครเป็น Seller บน ReMatch</p>
    <div style="text-align:center;background:#f0f9ff;border:2px solid #bfdbfe;border-radius:16px;padding:28px;margin:0 0 24px;">
      <div style="font-size:44px;font-weight:900;letter-spacing:0.3em;color:#1e3a8a;font-family:monospace;">${code}</div>
    </div>
    <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">รหัสนี้จะหมดอายุใน <strong>10 นาที</strong><br/>ห้ามแชร์รหัสนี้กับผู้อื่น</p>
  </div>
  <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#9ca3af;text-align:center;">
    © 2025 ReMatch · หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉย
  </div>
</div>
</body></html>`,
    });

    return Response.json({ ok: true, token });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
