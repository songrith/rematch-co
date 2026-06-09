"use client";

export default function MobileNav({ isOpen, onClose, user, profile, supabase, showCategories = true }) {
  if (!isOpen) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {/* Overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(100,116,139,.35)", backdropFilter: "blur(2px)", zIndex: 998 }} />

      {/* Drawer */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "80vw", maxWidth: 300, background: "#f8fafc", zIndex: 999, display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,.12)", animation: "slideIn 0.25s ease" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
            Re<span style={{ color: "#1e3a8a" }}>Match</span>
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#6b7280" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: "16px 20px", flex: 1 }}>

          {/* Categories */}
          {showCategories && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>หมวดหมู่</div>
              {[["เสื้อบอล", "/shop?cat=football"], ["เสื้อบาส", "/shop?cat=basketball"], ["Retro", "/shop?cat=retro"], ["ดูทั้งหมด", "/shop"]].map(([l, href]) => (
                <a key={l} href={href} style={{ display: "block", fontSize: 15, fontWeight: 500, color: "#374151", textDecoration: "none", padding: "11px 0", borderBottom: "1px solid #f9fafb" }}>{l}</a>
              ))}
            </div>
          )}

          {/* User menu */}
          {user ? (
            <div>
              {/* User info */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #f3f4f6", marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {(profile?.full_name || user.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{profile?.full_name || user.email?.split("@")[0]}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{user.email}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>เมนู</div>

              {profile?.role === "admin" && <NavItem href="/admin" label="Admin Panel" icon={<AdminIcon />} />}
              {profile?.role === "seller" && <>
                <NavItem href="/seller/dashboard" label="Seller Dashboard" icon={<DashIcon />} />
                <NavItem href="/sell" label="+ ลงสินค้า" icon={<PlusIcon />} accent />
              </>}
              {(profile?.role === "buyer" || !profile?.role) && <NavItem href="/seller/terms" label="สมัครเป็น Seller" icon={<ShopIcon />} />}
              <NavItem href="/orders"        label="คำสั่งซื้อ"    icon={<BoxIcon />} />
              <NavItem href="/messages"      label="ข้อความ"       icon={<MsgIcon />} />
              <NavItem href="/notifications" label="การแจ้งเตือน"  icon={<BellIcon />} />
              <NavItem href="/dashboard"     label="บัญชีของฉัน"   icon={<UserIcon />} />

              <button onClick={handleSignOut} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "13px 0", fontSize: 14, color: "#dc2626", fontWeight: 600, borderTop: "1px solid #f3f4f6", marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <a href="/login" style={{ padding: "13px", borderRadius: 10, border: "1px solid #e5e7eb", textAlign: "center", color: "#374151", textDecoration: "none", fontWeight: 600, fontSize: 15 }}>เข้าสู่ระบบ</a>
              <a href="/register" style={{ padding: "13px", borderRadius: 10, background: "#1e3a8a", textAlign: "center", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 15 }}>สมัครสมาชิก</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function NavItem({ href, label, icon, accent }) {
  return (
    <a href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", fontSize: 14, fontWeight: 500, color: accent ? "#1e3a8a" : "#374151", textDecoration: "none", borderBottom: "1px solid #f9fafb" }}>
      <span style={{ color: "#9ca3af", flexShrink: 0 }}>{icon}</span>
      {label}
    </a>
  );
}

const AdminIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const DashIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const PlusIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ShopIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
const BoxIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const MsgIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const BellIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const UserIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
