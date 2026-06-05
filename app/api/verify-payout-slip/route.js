export async function POST(request) {
  try {
    const formData    = await request.formData();
    const file        = formData.get("file");
    const sellerAmount = parseFloat(formData.get("seller_amount"));

    if (!file) return Response.json({ ok: false, error: "ไม่พบไฟล์สลิป" }, { status: 400 });

    const easySlipForm = new FormData();
    easySlipForm.append("file", file);

    const res = await fetch("https://developer.easyslip.com/api/v1/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.EASYSLIP_API_KEY}` },
      body: easySlipForm,
    });

    const result = await res.json();

    if (result.status !== 200) {
      return Response.json({ ok: false, error: "สลิปไม่ถูกต้องหรืออ่านไม่ได้ — กรุณาใช้สลิปที่ชัดเจน" });
    }

    const slipAmount   = result.data?.amount?.amount;
    const transRef     = result.data?.transRef    ?? null;
    const date         = result.data?.date        ?? null;
    const receiverName = result.data?.receiver?.displayName ?? null;

    if (!isNaN(sellerAmount) && slipAmount !== undefined && Math.abs(slipAmount - sellerAmount) > 1) {
      return Response.json({
        ok: false,
        error: `ยอดไม่ตรง — สลิป ฿${Number(slipAmount).toLocaleString()} แต่ต้องโอน ฿${Number(sellerAmount).toLocaleString()}`,
        slipAmount,
      });
    }

    return Response.json({ ok: true, amount: slipAmount, transRef, date, receiverName });
  } catch (err) {
    return Response.json({ ok: false, error: "เกิดข้อผิดพลาด: " + err.message }, { status: 500 });
  }
}
