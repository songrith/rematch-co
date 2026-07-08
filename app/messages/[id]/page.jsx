"use client";
import { useState, useEffect, useRef } from "react";

const EMOJIS = [
  "😀","😂","🥰","😍","😮","😢","😡","🤔","😎","🙏",
  "👍","👎","❤️","🔥","💯","✅","❌","⚽","🏀","🏆",
  "👕","📦","💰","🎉","💪","👀","🤝","😅","🤣","🫡",
];
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import MobileNav from "@/app/components/MobileNav";
import LanguageToggle from "@/app/components/LanguageToggle";

export default function ChatPage() {
  const supabase = createClient();
  const router   = useRouter();
  const { id: convId } = useParams();

  const [user, setUser]         = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [conv, setConv]         = useState(null);
  const [other, setOther]       = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bottomRef = useRef(null);
  const emojiRef  = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: c } = await supabase
        .from("conversations")
        .select("*, product:products(id, name, image_url)")
        .eq("id", convId)
        .single();

      if (!c || (c.buyer_id !== user.id && c.seller_id !== user.id)) {
        router.push("/messages"); return;
      }
      setConv(c);

      const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
      const { data: otherProfile } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", otherId).single();
      setOther(otherProfile);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      // Mark all unread messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", convId)
        .neq("sender_id", user.id)
        .eq("read", false);
    }
    load();
  }, [convId]);

  // Real-time subscription
  useEffect(() => {
    if (!convId) return;
    const channel = supabase
      .channel(`chat:${convId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        // Mark incoming as read immediately
        if (payload.new.sender_id !== user?.id) {
          supabase.from("messages").update({ read: true }).eq("id", payload.new.id).then(() => {});
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [convId, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji panel on outside click
  useEffect(() => {
    if (!emojiOpen) return;
    function onDown(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [emojiOpen]);

  function insertEmoji(em) {
    const input = inputRef.current;
    if (!input) { setText(prev => prev + em); return; }
    const start = input.selectionStart ?? text.length;
    const end   = input.selectionEnd   ?? text.length;
    const next  = text.slice(0, start) + em + text.slice(end);
    setText(next);
    // Restore cursor after emoji
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + em.length;
      input.setSelectionRange(pos, pos);
    });
  }

  async function sendMessage(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: convId,
      sender_id: user.id,
      content,
    });
    if (error) {
      setText(content); // restore text on failure
      alert("ส่งข้อความไม่ได้: " + error.message);
    }
    setSending(false);
  }

  if (loading) return <Spinner />;

  const productImg = conv?.product?.image_url;

  return (
    <div style={{ minHeight: "100dvh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Navbar */}
      <nav style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 48px", height: 64, display: "flex", alignItems: "center", flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f0f0e", textDecoration: "none" }}>
          Re<span style={{ color: "#1e3a8a" }}>Match</span>
        </a>
        <a className="rm-nav-links" href="/messages" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}
          onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
          onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          กลับกล่องข้อความ
        </a>
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
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} profile={null} />
      </nav>

      {/* Centered chat frame */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{
          width: "100%", maxWidth: 760,
          height: "calc(100dvh - 64px - 64px)",
          minHeight: 480,
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* Chat Header */}
          <div style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, background: "#fff" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {other?.avatar_url
                ? <img src={other.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 17, fontWeight: 700, color: "#1e3a8a" }}>{other?.full_name?.[0] || "?"}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "#0f0f0e", fontSize: 15 }}>{other?.full_name || "ผู้ใช้"}</div>
              {conv?.product && (
                <a href={`/products/${conv.product.id}`} style={{ fontSize: 12, color: "#1e3a8a", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                  🏷 {conv.product.name}
                </a>
              )}
            </div>
            {productImg && (
              <a href={`/products/${conv.product.id}`}>
                <img src={productImg} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid #e2e8f0" }} />
              </a>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4, background: "#f8fafc" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 40 }}>
                เริ่มต้นสนทนากับ {other?.full_name || "ผู้ใช้"} ได้เลย
              </div>
            )}
            {messages.map((m, i) => {
              const isMine = m.sender_id === user?.id;
              const prevSame = i > 0 && messages[i - 1].sender_id === m.sender_id;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginTop: prevSame ? 2 : 12 }}>
                  <div style={{
                    maxWidth: "68%",
                    padding: "10px 14px",
                    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isMine ? "#1e3a8a" : "#fff",
                    color: isMine ? "#fff" : "#0f0f0e",
                    fontSize: 14,
                    lineHeight: 1.6,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                    border: isMine ? "none" : "1px solid #e2e8f0",
                    wordBreak: "break-word",
                  }}>
                    {m.content}
                    <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: "right" }}>
                      {new Date(m.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{ borderTop: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", gap: 8, flexShrink: 0, background: "#fff", alignItems: "center", position: "relative" }}>

            {/* Emoji picker button */}
            <div ref={emojiRef} style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" onClick={() => setEmojiOpen(o => !o)}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid #e2e8f0", background: emojiOpen ? "#f1f5f9" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, transition: "background 0.15s" }}>
                😊
              </button>
              {emojiOpen && (
                <div style={{ position: "absolute", bottom: 48, left: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "10px 8px 8px", boxShadow: "0 8px 32px rgba(0,0,0,.13)", display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 2, zIndex: 20, width: 224 }}>
                  <div style={{ gridColumn: "1/-1", fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 2 }}>
                    Emoji
                  </div>
                  {EMOJIS.map(em => (
                    <button key={em} type="button" onClick={() => insertEmoji(em)}
                      style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "5px 4px", borderRadius: 8, lineHeight: 1, transition: "background 0.1s" }}
                      onMouseEnter={ev => ev.currentTarget.style.background = "#f1f5f9"}
                      onMouseLeave={ev => ev.currentTarget.style.background = "none"}>
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              style={{ flex: 1, padding: "11px 18px", borderRadius: 99, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}
              onFocus={e => e.target.style.borderColor = "#1e3a8a"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            <button type="submit" disabled={!text.trim() || sending}
              style={{ width: 46, height: 46, borderRadius: "50%", background: text.trim() ? "#1e3a8a" : "#e2e8f0", border: "none", cursor: text.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? "#fff" : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>

        </div>
      </div>
    </div>
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
