"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import MobileNav from "@/app/components/MobileNav";
import LanguageToggle from "@/app/components/LanguageToggle";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [convs, setConvs] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data || {});

      // โหลดประวัติการสนทนา
      const { data: rows } = await supabase
        .from("conversations")
        .select("*, product:products(id, name)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (rows?.length) {
        const otherIds = [...new Set(rows.map(c => c.buyer_id === user.id ? c.seller_id : c.buyer_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds);
        const enriched = await Promise.all(rows.map(async c => {
          const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
          const { data: lastMsg } = await supabase.from("messages").select("content, sender_id, created_at").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
          const { count: unread } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.id).eq("read", false).neq("sender_id", user.id);
          return { ...c, other: profiles?.find(p => p.id === otherId) || {}, lastMsg, unread: unread || 0 };
        }));
        setConvs(enriched);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        subdistrict: profile.subdistrict,
        district: profile.district,
        province: profile.province,
        postal_code: profile.postal_code,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  function set(key, value) {
    setProfile(prev => ({ ...prev, [key]: value }));
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setError("อัปโหลดรูปไม่สำเร็จ"); setAvatarUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBusted = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: cacheBusted }).eq("id", user.id);
    setProfile(prev => ({ ...prev, avatar_url: cacheBusted }));
    setAvatarUploading(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1e3a8a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap'); @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <div className="rm-nav-links" style={{ marginLeft: "auto" }}>
          <button
            onClick={async () => { await fetch("/api/signout", { method: "POST" }); window.location.href = "/"; }}
            style={{ background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            ออกจากระบบ
          </button>
        </div>
        <span className="rm-mobile-only" style={{ marginLeft: "auto" }}><LanguageToggle /></span>
        <button
          className="rm-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          aria-label="Menu"
        >
          {menuOpen
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} profile={profile} />
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13, fontWeight: 500, textDecoration: "none", marginBottom: 16 }}
            onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
            onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            กลับหน้าหลัก
          </a>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#0f0f0e", margin: "0 0 6px" }}>
            บัญชีของฉัน
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>{user?.email}</p>
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 8 }}>
          <label htmlFor="avatar-input" style={{ cursor: "pointer", position: "relative", flexShrink: 0 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: "#e2e8f0", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 28, fontWeight: 700, color: "#1e3a8a" }}>{(profile.full_name || user?.email || "?")[0].toUpperCase()}</span>
              }
            </div>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, background: "#1e3a8a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
              {avatarUploading
                ? <div style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              }
            </div>
            <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </label>
          <div>
            <div style={{ fontWeight: 700, color: "#0f0f0e", fontSize: 16 }}>{profile.full_name || "ยังไม่ได้ตั้งชื่อ"}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>คลิกที่รูปเพื่อเปลี่ยน</div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Personal Info */}
          <div style={card}>
            <h2 style={sectionTitle}>ข้อมูลส่วนตัว</h2>
            <div className="rm-g2-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="ชื่อ-นามสกุล" value={profile.full_name || ""} onChange={v => set("full_name", v)} placeholder="กรอกชื่อ-นามสกุล" />
              <Field label="เบอร์โทรศัพท์" value={profile.phone || ""} onChange={v => set("phone", v.replace(/\D/g, ""))} placeholder="0XXXXXXXXX" inputMode="tel" maxLength={10} />
            </div>
          </div>

          {/* Shipping Address */}
          <div style={card}>
            <h2 style={sectionTitle}>ที่อยู่สำหรับจัดส่ง</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field
                label="ที่อยู่ (บ้านเลขที่ ถนน ซอย)"
                value={profile.address || ""}
                onChange={v => set("address", v)}
                placeholder="เช่น 123/4 ถ.สุขุมวิท ซ.11"
              />
              <div className="rm-g2-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="แขวง / ตำบล" value={profile.subdistrict || ""} onChange={v => set("subdistrict", v)} placeholder="แขวง/ตำบล" />
                <Field label="เขต / อำเภอ" value={profile.district || ""} onChange={v => set("district", v)} placeholder="เขต/อำเภอ" />
              </div>
              <div className="rm-g2-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="จังหวัด" value={profile.province || ""} onChange={v => set("province", v)} placeholder="เช่น กรุงเทพมหานคร" />
                <Field label="รหัสไปรษณีย์" value={profile.postal_code || ""} onChange={v => set("postal_code", v.replace(/\D/g, ""))} placeholder="10XXX" inputMode="numeric" maxLength={5} />
              </div>
            </div>
          </div>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {error}</div>}
          {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>✓ บันทึกข้อมูลเรียบร้อยแล้ว</div>}

          <button
            type="submit"
            disabled={saving}
            style={{ width: "100%", padding: "13px", background: saving ? "#6b7280" : "#0f0f0e", color: "#fff", border: "none", borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: saving ? "default" : "pointer", transition: "background 0.2s" }}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>

        </form>

        {/* Chat History */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f0f0e", margin: 0 }}>ประวัติการสนทนา</h2>
            <a href="/messages" style={{ fontSize: 13, color: "#1e3a8a", fontWeight: 600, textDecoration: "none" }}>ดูทั้งหมด →</a>
          </div>

          {convs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: 13 }}>
              ยังไม่มีการสนทนา — ลองถามผู้ขายจากหน้าสินค้าได้เลย
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {convs.map(c => (
                <a key={c.id} href={`/messages/${c.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {c.other?.avatar_url
                      ? <img src={c.other.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 15, fontWeight: 700, color: "#1e3a8a" }}>{c.other?.full_name?.[0] || "?"}</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: c.unread > 0 ? 700 : 600, color: "#0f0f0e" }}>{c.other?.full_name || "ผู้ใช้"}</span>
                      {c.lastMsg && <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{new Date(c.lastMsg.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>🏷 {c.product?.name || "สินค้า"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: c.unread > 0 ? "#0f0f0e" : "#6b7280", fontWeight: c.unread > 0 ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                        {c.lastMsg ? (c.lastMsg.sender_id === user?.id ? "คุณ: " : "") + c.lastMsg.content : "เริ่มสนทนา"}
                      </span>
                      {c.unread > 0 && <span style={{ background: "#1e3a8a", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "1px 7px", flexShrink: 0, marginLeft: 8 }}>{c.unread}</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, inputMode, maxLength }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${focused ? "#1e3a8a" : "#e5e7eb"}`, fontSize: 14, color: "#0f0f0e", outline: "none", background: "#fafafa", boxSizing: "border-box", transition: "border-color 0.2s" }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

const card = { background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "28px 32px", boxShadow: "0 2px 8px rgba(0,0,0,.04)" };
const sectionTitle = { fontSize: 16, fontWeight: 700, color: "#0f0f0e", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #e2e8f0" };
