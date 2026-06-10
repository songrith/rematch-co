"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SellerVerifyPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef();
  const selfieRef = useRef();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [promptpayId, setPromptpayId] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [editingPP, setEditingPP] = useState(false);
  const [newPP, setNewPP] = useState("");
  const [ppSaving, setPPSaving] = useState(false);

  const otpTimerRef = useRef(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const [{ data: profile }, { data: ver }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("seller_verifications").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      setProfile(profile);
      if (profile?.phone) setPhone(profile.phone);
      if (ver?.promptpay_id) setNewPP(ver.promptpay_id);
      setVerification(ver);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => () => { if (otpTimerRef.current) clearInterval(otpTimerRef.current); }, []);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleSelfieFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setSelfieFile(f);
    setSelfiePreview(URL.createObjectURL(f));
  }

  function startOtpTimer() {
    setOtpTimer(600);
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    otpTimerRef.current = setInterval(() => {
      setOtpTimer(t => { if (t <= 1) { clearInterval(otpTimerRef.current); return 0; } return t - 1; });
    }, 1000);
  }

  async function sendOtp() {
    setOtpLoading(true); setOtpError("");
    try {
      const res  = await fetch("/api/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email }) });
      const data = await res.json();
      if (!data.ok) { setOtpError(data.error || "ส่ง OTP ไม่สำเร็จ"); setOtpLoading(false); return; }
      setOtpToken(data.token);
      setOtpSent(true);
      setOtpCode("");
      setOtpVerified(false);
      startOtpTimer();
    } catch { setOtpError("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
    setOtpLoading(false);
  }

  async function verifyOtp() {
    if (otpCode.length !== 6) { setOtpError("กรุณากรอกรหัส 6 หลัก"); return; }
    setOtpLoading(true); setOtpError("");
    try {
      const res  = await fetch("/api/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: otpToken, code: otpCode }) });
      const data = await res.json();
      if (!data.ok) { setOtpError(data.error || "รหัส OTP ไม่ถูกต้อง"); setOtpLoading(false); return; }
      setOtpVerified(true);
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    } catch { setOtpError("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
    setOtpLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!phone.trim()) { setError("กรุณากรอกเบอร์โทรศัพท์"); return; }
    if (!otpVerified) { setError("กรุณายืนยัน OTP ก่อนส่งข้อมูล"); return; }
    const ppRaw = promptpayId.replace(/\D/g, "");
    if (ppRaw.length !== 10 && ppRaw.length !== 13) { setError("เลข PromptPay ต้องเป็นเบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก"); return; }
    if (!file) { setError("กรุณาอัพโหลดรูปบัตรประชาชน"); return; }
    if (!selfieFile) { setError("กรุณาอัพโหลด Selfie ถือบัตรประชาชน"); return; }

    setSaving(true); setError("");

    await supabase.from("profiles").update({ phone }).eq("id", user.id);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/id-card.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("id-cards").upload(path, file, { upsert: true });
    if (uploadErr) { setError(uploadErr.message); setSaving(false); return; }

    const selfieExt = selfieFile.name.split(".").pop();
    const selfiePath = `${user.id}/selfie.${selfieExt}`;
    const { error: selfieErr } = await supabase.storage.from("id-cards").upload(selfiePath, selfieFile, { upsert: true });
    if (selfieErr) { setError(selfieErr.message); setSaving(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("id-cards").getPublicUrl(path);
    const { data: { publicUrl: selfieUrl } } = supabase.storage.from("id-cards").getPublicUrl(selfiePath);

    const { error: saveErr } = await supabase.from("seller_verifications").insert({
      user_id: user.id,
      promptpay_id: ppRaw,
      id_card_url: publicUrl,
      selfie_url: selfieUrl,
    });

    setSaving(false);
    if (saveErr) { setError(saveErr.message); return; }

    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "verification_submitted", sellerName: profile?.full_name || user.email, sellerEmail: user.email }),
    }).catch(() => {});

    const { data } = await supabase.from("seller_verifications").select("*").eq("user_id", user.id).maybeSingle();
    setVerification(data);
  }

  async function handleUpdatePromptpay() {
    const ppRaw = newPP.replace(/\D/g, "");
    if (ppRaw.length !== 10 && ppRaw.length !== 13) { alert("เลข PromptPay ต้องเป็นเบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก"); return; }
    setPPSaving(true);
    const { error } = await supabase
      .from("seller_verifications")
      .update({ promptpay_id: ppRaw })
      .eq("user_id", user.id);
    setPPSaving(false);
    if (error) { alert("บันทึกไม่สำเร็จ: " + error.message); return; }
    setVerification(prev => ({ ...prev, promptpay_id: ppRaw }));
    setEditingPP(false);
  }

  if (loading) return <Spinner />;

  if (verification?.status === "pending") return (
    <Shell supabase={supabase}>
      <StatusCard icon="⏳" title="รอการตรวจสอบ"
        desc="ทีมงานกำลังตรวจสอบข้อมูลของคุณ ปกติใช้เวลา 1-2 วันทำการ"
        color="#fef9c3" border="#fde68a" />
    </Shell>
  );

  if (verification?.status === "approved") return (
    <Shell supabase={supabase}>
      <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px" }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", marginBottom: 8 }}>ผ่านการยืนยันแล้ว!</h2>
          <p style={{ color: "#6b7280", lineHeight: 1.7, margin: "0 0 24px" }}>คุณสามารถเริ่มลงขายสินค้าได้เลย</p>

          {/* PromptPay display / edit */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #bbf7d0", padding: "18px 20px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>PromptPay</div>
            {editingPP ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={newPP} onChange={e => setNewPP(e.target.value.replace(/\D/g, ""))}
                  maxLength={13} inputMode="numeric" placeholder="เบอร์ / เลขบัตร"
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none" }} />
                <button onClick={handleUpdatePromptpay} disabled={ppSaving}
                  style={{ background: "#15803d", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: ppSaving ? 0.6 : 1, whiteSpace: "nowrap" }}>
                  {ppSaving ? "..." : "บันทึก"}
                </button>
                <button onClick={() => { setEditingPP(false); setNewPP(verification.promptpay_id || ""); }}
                  style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "9px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: "0.05em" }}>
                  {verification.promptpay_id || <span style={{ color: "#9ca3af", fontWeight: 400 }}>ยังไม่ได้กรอก</span>}
                </span>
                <button onClick={() => { setEditingPP(true); setNewPP(verification.promptpay_id || ""); }}
                  style={{ background: "none", border: "1px solid #bbf7d0", color: "#15803d", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  แก้ไข
                </button>
              </div>
            )}
          </div>

          <a href="/sell" style={{ display: "inline-block", background: "#1e3a8a", color: "#fff", padding: "10px 24px", borderRadius: 99, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            เพิ่มสินค้าแรก →
          </a>
        </div>
      </div>
    </Shell>
  );

  if (verification?.status === "rejected") return (
    <Shell supabase={supabase}>
      <StatusCard icon="❌" title="ไม่ผ่านการยืนยัน"
        desc={`เหตุผล: ${verification.reject_reason || "ข้อมูลไม่ถูกต้อง"}`}
        color="#fef2f2" border="#fecaca"
        note="กรุณาติดต่อทีมงาน ReMatch เพื่อดำเนินการอีกครั้ง" />
    </Shell>
  );

  if (!profile?.address) return (
    <Shell supabase={supabase}>
      <StatusCard icon="📍" title="กรุณากรอกที่อยู่ก่อน"
        desc="ต้องกรอกที่อยู่จัดส่งในหน้าบัญชีก่อนสมัครเป็น Seller"
        color="#eff6ff" border="#cbd5e1"
        link={{ href: "/dashboard", label: "ไปกรอกที่อยู่ →" }} />
    </Shell>
  );

  return (
    <Shell supabase={supabase}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <BackLink href="/" label="กลับหน้าหลัก" />
        <h1 style={S.heading}>สมัครเป็น Seller</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
          กรอกข้อมูลเพื่อยืนยันตัวตนและเริ่มขายสินค้าได้เลย
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Phone */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>เบอร์โทรศัพท์</h2>
            <label style={S.label}>เบอร์ติดต่อ</label>
            <input
              required
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="0XXXXXXXXX"
              maxLength={10}
              inputMode="numeric"
              style={S.input}
            />
          </div>

          {/* PromptPay */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>เลข PromptPay</h2>
            <label style={S.label}>เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน ที่ผูก PromptPay</label>
            <input required value={promptpayId}
              onChange={e => setPromptpayId(e.target.value.replace(/\D/g, ""))}
              placeholder="0XXXXXXXXX หรือ 13 หลัก" maxLength={13} inputMode="numeric" style={S.input} />
            <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 0", lineHeight: 1.6 }}>
              ทีมงานจะใช้เลขนี้โอนเงินให้คุณผ่าน PromptPay หลังจากขายสินค้าได้
            </p>
          </div>

          {/* ID Card Upload */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>รูปบัตรประชาชน</h2>
            <div onClick={() => fileRef.current.click()}
              style={{ border: `2px dashed ${preview ? "#1e3a8a" : "#e5e7eb"}`, borderRadius: 12, padding: 24, textAlign: "center", cursor: "pointer", background: preview ? "#f0fdf4" : "#fafafa", transition: "all 0.2s" }}>
              {preview ? (
                <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                  <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>คลิกเพื่ออัพโหลดรูปบัตรประชาชน</p>
                  <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 4 }}>JPG, PNG ขนาดไม่เกิน 5MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </div>
            {preview && (
              <button type="button" onClick={() => { setPreview(null); setFile(null); }}
                style={{ marginTop: 8, background: "none", border: "none", color: "#dc2626", fontSize: 12, cursor: "pointer" }}>
                ลบรูปและเลือกใหม่
              </button>
            )}
          </div>

          {/* Selfie Upload */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>Selfie ถือบัตรประชาชน</h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12, marginTop: -12 }}>
              ถ่ายรูปตัวเองพร้อมถือบัตรประชาชนให้เห็นใบหน้าและบัตรชัดเจน
            </p>
            <div onClick={() => selfieRef.current.click()}
              style={{ border: `2px dashed ${selfiePreview ? "#1e3a8a" : "#e5e7eb"}`, borderRadius: 12, padding: 24, textAlign: "center", cursor: "pointer", background: selfiePreview ? "#f0fdf4" : "#fafafa", transition: "all 0.2s" }}>
              {selfiePreview ? (
                <img src={selfiePreview} alt="selfie preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🤳</div>
                  <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>คลิกเพื่ออัพโหลด Selfie ถือบัตร</p>
                  <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 4 }}>JPG, PNG ขนาดไม่เกิน 5MB</p>
                </>
              )}
              <input ref={selfieRef} type="file" accept="image/*" onChange={handleSelfieFile} style={{ display: "none" }} />
            </div>
            {selfiePreview && (
              <button type="button" onClick={() => { setSelfiePreview(null); setSelfieFile(null); }}
                style={{ marginTop: 8, background: "none", border: "none", color: "#dc2626", fontSize: 12, cursor: "pointer" }}>
                ลบรูปและเลือกใหม่
              </button>
            )}
          </div>

          {/* OTP Verification */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>ยืนยันตัวตนด้วย OTP</h2>
            {otpVerified ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
                <div style={{ width: 36, height: 36, background: "#dcfce7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>ยืนยันอีเมลสำเร็จ</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{user?.email}</div>
                </div>
              </div>
            ) : !otpSent ? (
              <div>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.7 }}>
                  เราจะส่งรหัส OTP 6 หลักไปที่ <strong style={{ color: "#0f172a" }}>{user?.email}</strong> เพื่อยืนยันตัวตน
                </p>
                <button type="button" onClick={sendOtp} disabled={otpLoading}
                  style={{ background: "#1e3a8a", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 99, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: otpLoading ? 0.7 : 1 }}>
                  {otpLoading ? "กำลังส่ง..." : "ขอรหัส OTP"}
                </button>
                {otpError && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 10 }}>{otpError}</div>}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px", lineHeight: 1.7 }}>
                  ส่งรหัสไปที่ <strong style={{ color: "#0f172a" }}>{user?.email}</strong> แล้ว
                  {otpTimer > 0 && (
                    <span style={{ marginLeft: 8, fontFamily: "monospace", fontWeight: 700, color: otpTimer <= 60 ? "#dc2626" : "#0f172a" }}>
                      ({String(Math.floor(otpTimer / 60)).padStart(2, "0")}:{String(otpTimer % 60).padStart(2, "0")})
                    </span>
                  )}
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    value={otpCode}
                    onChange={e => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
                    placeholder="• • • • • •"
                    maxLength={6}
                    inputMode="numeric"
                    style={{ ...S.input, letterSpacing: "0.35em", fontSize: 22, fontWeight: 700, textAlign: "center", flex: 1 }}
                  />
                  <button type="button" onClick={verifyOtp} disabled={otpLoading || otpCode.length !== 6}
                    style={{ background: "#15803d", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: (otpLoading || otpCode.length !== 6) ? 0.45 : 1, whiteSpace: "nowrap" }}>
                    {otpLoading ? "..." : "ยืนยัน"}
                  </button>
                </div>
                {otpError && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{otpError}</div>}
                {otpTimer === 0 ? (
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: "#6b7280" }}>รหัสหมดอายุแล้ว — </span>
                    <button type="button" onClick={sendOtp} style={{ background: "none", border: "none", color: "#1e3a8a", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                      ขอรหัสใหม่
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={sendOtp} disabled={otpTimer > 540}
                    style={{ background: "none", border: "none", color: otpTimer > 540 ? "#9ca3af" : "#1e3a8a", fontSize: 12, fontWeight: 600, cursor: otpTimer > 540 ? "default" : "pointer", padding: 0 }}>
                    {otpTimer > 540 ? `ส่งรหัสใหม่ได้ใน ${otpTimer - 540} วินาที` : "ส่งรหัสใหม่"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Address Summary */}
          <div style={{ ...S.card, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <h2 style={{ ...S.sectionTitle, borderColor: "#bbf7d0" }}>ที่อยู่ของผู้ขาย</h2>
            <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>
              {[profile.address, profile.subdistrict, profile.district, profile.province, profile.postal_code].filter(Boolean).join(" ")}
            </p>
            <a href="/dashboard" style={{ fontSize: 12, color: "#1e3a8a", textDecoration: "none", marginTop: 8, display: "inline-block" }}>
              แก้ไขที่อยู่ →
            </a>
          </div>

          {error && <div style={S.errorBox}>⚠️ {error}</div>}

          <button type="submit" disabled={saving}
            style={{ ...S.primaryBtn, opacity: saving ? 0.7 : 1 }}>
            {saving ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลเพื่อยืนยัน"}
          </button>
        </form>
      </div>
    </Shell>
  );
}

function Shell({ children, supabase }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <nav style={S.nav}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>
        <button onClick={async () => { try { await supabase.auth.signOut({ scope: 'local' }); } catch {} window.location.reload(); }} style={S.logoutBtn}>
          ออกจากระบบ
        </button>
      </nav>
      {children}
    </div>
  );
}

function StatusCard({ icon, title, desc, color, border, note, link }) {
  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px" }}>
      <div style={{ background: color, border: `1px solid ${border}`, borderRadius: 20, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", marginBottom: 8 }}>{title}</h2>
        <p style={{ color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{desc}</p>
        {note && <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>{note}</p>}
        {link && <a href={link.href} style={{ display: "inline-block", marginTop: 20, background: "#1e3a8a", color: "#fff", padding: "10px 24px", borderRadius: 99, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>{link.label}</a>}
      </div>
    </div>
  );
}

function BackLink({ href, label }) {
  return (
    <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13, fontWeight: 500, textDecoration: "none", marginBottom: 16 }}
      onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
      onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      {label}
    </a>
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

const S = {
  nav: { position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 },
  logo: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" },
  logoutBtn: { background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 16px", borderRadius: 99, fontSize: 13, cursor: "pointer" },
  heading: { fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e", margin: "0 0 6px" },
  card: { background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "28px 32px" },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#0f0f0e", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #e2e8f0" },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, color: "#0f0f0e", outline: "none", background: "#fafafa", boxSizing: "border-box" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
  primaryBtn: { width: "100%", padding: "13px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: "pointer" },
};
