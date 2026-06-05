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
    const { token, code } = await request.json();
    if (!token || !code) return Response.json({ ok: false, error: "ข้อมูลไม่ครบ" }, { status: 400 });

    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return Response.json({ ok: false, error: "token ไม่ถูกต้อง" }, { status: 400 });

    const payloadB64 = token.slice(0, dotIdx);
    const sig        = token.slice(dotIdx + 1);

    let payload;
    try { payload = atob(payloadB64); } catch {
      return Response.json({ ok: false, error: "token ไม่ถูกต้อง" }, { status: 400 });
    }

    const parts = payload.split(":");
    if (parts.length !== 3) return Response.json({ ok: false, error: "token ไม่ถูกต้อง" }, { status: 400 });

    const [storedCode, , expStr] = parts;

    if (Date.now() > Number(expStr))
      return Response.json({ ok: false, error: "รหัส OTP หมดอายุ กรุณาขอรหัสใหม่" });

    const expected = await sign(payload);
    if (sig !== expected)
      return Response.json({ ok: false, error: "token ไม่ถูกต้อง" }, { status: 400 });

    if (code !== storedCode)
      return Response.json({ ok: false, error: "รหัส OTP ไม่ถูกต้อง" });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
