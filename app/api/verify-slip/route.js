import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const amount = parseFloat(formData.get("amount"));

    if (!file) return Response.json({ ok: false, error: "ไม่พบไฟล์สลิป" }, { status: 400 });

    // Hash ไฟล์สลิป — ไฟล์เดิมส่งซ้ำ = hash ซ้ำ ตรวจได้แม้ไม่มี transRef
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer  = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const slipHash    = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    // ตรวจสอบ hash ซ้ำใน DB ก่อนเลย
    const supabase = await createServerSupabaseClient();
    const { data: dupHash } = await supabase
      .from("orders")
      .select("id")
      .eq("slip_hash", slipHash)
      .maybeSingle();

    if (dupHash) {
      return Response.json({ ok: false, error: "สลิปนี้ถูกใช้ไปแล้ว กรุณาโอนเงินใหม่" });
    }

    // ส่งให้ EasySlip ตรวจสอบความถูกต้อง
    const easySlipForm = new FormData();
    easySlipForm.append("file", file);

    const res = await fetch("https://developer.easyslip.com/api/v1/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.EASYSLIP_API_KEY}` },
      body: easySlipForm,
    });

    const result = await res.json();

    if (result.status !== 200) {
      return Response.json({ ok: false, error: "สลิปไม่ถูกต้องหรือตรวจสอบไม่ได้" });
    }

    const slipAmount = result.data?.amount?.amount;
    const transRef   = result.data?.transRef ?? null;

    // ตรวจสอบ transRef ซ้ำด้วย (double-check)
    if (transRef) {
      const { data: dupRef } = await supabase
        .from("orders")
        .select("id")
        .eq("trans_ref", transRef)
        .maybeSingle();

      if (dupRef) {
        return Response.json({ ok: false, error: "สลิปนี้ถูกใช้ไปแล้ว กรุณาโอนเงินใหม่" });
      }
    }

    const receiverProxy  = result.data?.receiver?.proxy?.value?.replace(/\D/g, "");
    const platformNumber = (process.env.NEXT_PUBLIC_PLATFORM_PROMPTPAY || "").replace(/\D/g, "");

    if (receiverProxy && receiverProxy !== platformNumber && !receiverProxy.endsWith(platformNumber.slice(-9))) {
      return Response.json({ ok: false, error: "เบอร์ผู้รับเงินไม่ตรงกับ ReMatch" });
    }

    if (slipAmount !== undefined && Math.abs(slipAmount - amount) > 0.01) {
      return Response.json({
        ok: false,
        error: `ยอดเงินไม่ตรง — สลิป ฿${Number(slipAmount).toLocaleString()} แต่ออเดอร์ ฿${Number(amount).toLocaleString()}`,
      });
    }

    return Response.json({ ok: true, amount: slipAmount, transRef, slipHash });
  } catch (err) {
    return Response.json({ ok: false, error: "เกิดข้อผิดพลาด: " + err.message }, { status: 500 });
  }
}
