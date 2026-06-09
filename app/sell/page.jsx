"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "football",   label: "⚽ เสื้อบอล" },
  { value: "basketball", label: "🏀 เสื้อบาส" },
  { value: "retro",      label: "🏆 Retro" },
];
const SIZES  = ["XS", "S", "M", "L", "XL", "XXL"];
const GRADES = [
  { value: "S", label: "S — สภาพใหม่มาก" },
  { value: "A", label: "A — สภาพดี" },
  { value: "B", label: "B — มีรอยบ้าง" },
];
const MAX_IMAGES = 5;

export default function SellPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    name: "", category: "", team: "", size: "", grade: "", price: "", description: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "seller" && profile?.role !== "admin") { router.push("/seller/verify"); return; }
      setUser(user);
      setLoading(false);
    }
    load();
  }, []);

  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  function handleFiles(e) {
    const selected = Array.from(e.target.files);
    const remaining = MAX_IMAGES - files.length;
    const toAdd = selected.slice(0, remaining);
    setFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeImage(i) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category) { setError("กรุณาเลือกประเภทสินค้า"); return; }
    if (!form.size)     { setError("กรุณาเลือกขนาด"); return; }
    if (!form.grade)    { setError("กรุณาเลือกเกรด"); return; }
    if (files.length === 0) { setError("กรุณาอัพโหลดรูปสินค้าอย่างน้อย 1 รูป"); return; }

    setSaving(true);
    setError("");

    const urls = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("products").upload(path, file, { upsert: true });
      if (uploadErr) { setError(uploadErr.message); setSaving(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
      urls.push(publicUrl);
    }

    const { error: saveErr } = await supabase.from("products").insert({
      seller_id:   user.id,
      name:        form.name,
      category:    form.category,
      team:        form.team,
      size:        form.size,
      grade:       form.grade,
      price:       Number(form.price),
      description: form.description,
      image_url:   urls[0],
      image_urls:  urls,
    });

    setSaving(false);
    if (saveErr) { setError(saveErr.message); return; }
    router.push("/seller/dashboard");
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <nav style={S.nav}>
        <a href="/" style={S.logo}>Re<span style={{ color: "#1e3a8a" }}>Match</span></a>
        <button onClick={async () => { try { await supabase.auth.signOut({ scope: 'local' }); } catch {} window.location.reload(); }} style={S.logoutBtn}>ออกจากระบบ</button>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
        <BackLink href="/seller/dashboard" label="กลับ Dashboard" />
        <h1 style={S.heading}>เพิ่มสินค้าใหม่</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>สินค้าจะรอ Admin อนุมัติก่อนแสดงในหน้าหลัก</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* รูปสินค้า */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>รูปสินค้า <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 13 }}>(สูงสุด {MAX_IMAGES} รูป)</span></h2>

            <div className="rm-g5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 12 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  <img src={src} alt={`preview ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {i === 0 && (
                    <div style={{ position: "absolute", top: 4, left: 4, background: "#1e3a8a", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>หลัก</div>
                  )}
                  <button type="button" onClick={() => removeImage(i)}
                    style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                </div>
              ))}

              {previews.length < MAX_IMAGES && (
                <div onClick={() => fileRef.current.click()}
                  style={{ aspectRatio: "1", borderRadius: 10, border: "2px dashed #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#fafafa", fontSize: 11, color: "#9ca3af", gap: 4 }}>
                  <span style={{ fontSize: 22 }}>+</span>
                  <span>เพิ่มรูป</span>
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>รูปแรกจะเป็นรูปหลัก · JPG, PNG</p>
          </div>

          {/* ข้อมูลสินค้า */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>ข้อมูลสินค้า</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={S.label}>ชื่อสินค้า</label>
                <input required value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="เช่น Real Madrid Home 24/25" style={S.input} />
              </div>
              <div className="rm-g2-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={S.label}>ประเภท</label>
                  <select required value={form.category} onChange={e => set("category", e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                    <option value="">เลือกประเภท</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>ทีม / ลีก</label>
                  <input value={form.team} onChange={e => set("team", e.target.value)} placeholder="เช่น La Liga, NBA" style={S.input} />
                </div>
              </div>
              <div className="rm-g2-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={S.label}>ขนาด</label>
                  <select required value={form.size} onChange={e => set("size", e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                    <option value="">Size</option>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>เกรด</label>
                  <select required value={form.grade} onChange={e => set("grade", e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                    <option value="">เกรด</option>
                    {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>ราคา (บาท)</label>
                  <input required value={form.price} onChange={e => set("price", e.target.value.replace(/\D/g, ""))}
                    placeholder="0" inputMode="numeric" style={S.input} />
                </div>
              </div>
              <div>
                <label style={S.label}>รายละเอียดเพิ่มเติม</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="สภาพสินค้า ขนาดจริง ประวัติการใช้งาน ฯลฯ" rows={4}
                  style={{ ...S.input, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
          </div>

          {error && <div style={S.errorBox}>⚠️ {error}</div>}

          <button type="submit" disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.7 : 1 }}>
            {saving ? "กำลังลงสินค้า..." : "ลงสินค้า"}
          </button>
        </form>
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
