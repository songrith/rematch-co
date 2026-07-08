"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import LanguageToggle from "@/app/components/LanguageToggle";

export default function MobileNav({ isOpen, onClose, user, profile, showCategories = true }) {
  const ref = useRef(null);
  const supabase = createClient();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSignOut() {
    await supabase.auth.signOut({ scope: 'local' });
    window.location.href = "/";
  }

  return (
    <>
      <style>{`
        @keyframes dropDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Dropdown card */}
      <div ref={ref} style={{
        position: "fixed", top: 68, right: 16,
        width: 240, background: "#fff",
        borderRadius: 16, border: "1px solid #e2e8f0",
        boxShadow: "0 8px 32px rgba(0,0,0,.12)",
        zIndex: 999, overflow: "hidden",
        animation: "dropDown 0.2s ease",
      }}>

        {/* User info */}
        {user && (
          <div style={{ padding: "14px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {(profile?.full_name || user.email || "?")[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.full_name || user.email?.split("@")[0]}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            </div>
          </div>
        )}

        <div style={{ padding: "8px 0" }}>

          {/* Categories */}
          {showCategories && (
            <>
              <div style={{ padding: "4px 16px 6px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>หมวดหมู่</div>
              {[["เสื้อบอล", "/shop?cat=football"], ["เสื้อบาส", "/shop?cat=basketball"], ["Retro", "/shop?cat=retro"]].map(([l, href]) => (
                <Item key={l} href={href} label={l} />
              ))}
              <div style={{ height: 1, background: "#f3f4f6", margin: "6px 0" }} />
            </>
          )}

          {/* Nav items */}
          {/* Language toggle */}
          <div style={{ padding: "8px 16px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>ภาษา / Language</span>
            <LanguageToggle />
          </div>
          <div style={{ height: 1, background: "#f3f4f6", margin: "6px 0" }} />

          {user ? (
            <>
              {profile?.role === "admin"  && <Item href="/admin"            label="Admin Panel"     icon={<AdminIcon />} />}
              {profile?.role === "seller" && <Item href="/seller/dashboard" label="Seller Dashboard" icon={<DashIcon />} />}
              {profile?.role === "seller" && <Item href="/sell"             label="+ ลงสินค้า"       icon={<PlusIcon />} accent />}
              {(profile?.role === "buyer" || !profile?.role) && <Item href="/seller/terms" label="สมัครเป็น Seller" icon={<ShopIcon />} />}
              <Item href="/orders"        label="คำสั่งซื้อ"   icon={<BoxIcon />} />
              <Item href="/messages"      label="ข้อความ"      icon={<MsgIcon />} />
              <Item href="/notifications" label="การแจ้งเตือน" icon={<BellIcon />} />
              <Item href="/dashboard"     label="บัญชีของฉัน"  icon={<UserIcon />} />
              <div style={{ height: 1, background: "#f3f4f6", margin: "6px 0" }} />
              <button onClick={handleSignOut} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px 16px", fontSize: 14, color: "#dc2626", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                <SignOutIcon /> ออกจากระบบ
              </button>
            </>
          ) : (
            <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="/login"    style={{ padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb", textAlign: "center", color: "#374151", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>เข้าสู่ระบบ</a>
              <a href="/register" style={{ padding: "11px", borderRadius: 10, background: "#1e3a8a", textAlign: "center", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>สมัครสมาชิก</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Item({ href, label, icon, accent }) {
  return (
    <a href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 14, fontWeight: 500, color: accent ? "#1e3a8a" : "#374151", textDecoration: "none", transition: "background 0.1s" }}
      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {icon && <span style={{ color: "#9ca3af", flexShrink: 0, display: "flex" }}>{icon}</span>}
      {label}
    </a>
  );
}

const AdminIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const DashIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const PlusIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ShopIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
const BoxIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const MsgIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const BellIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const UserIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const SignOutIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
