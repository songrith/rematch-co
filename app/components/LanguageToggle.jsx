"use client";
import { useLang } from "@/app/context/language";

export default function LanguageToggle({ style = {} }) {
  const { lang, toggleLang } = useLang();
  return (
    <div
      style={{ display: "flex", alignItems: "center", background: "#f1f5f9", borderRadius: 99, padding: 3, gap: 2, flexShrink: 0, ...style }}
      title={lang === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
    >
      {["th", "en"].map(l => (
        <button
          key={l}
          onClick={() => lang !== l && toggleLang()}
          style={{
            padding: "4px 11px",
            borderRadius: 99,
            border: "none",
            cursor: lang === l ? "default" : "pointer",
            background: lang === l ? "#1e3a8a" : "transparent",
            color: lang === l ? "#fff" : "#94a3b8",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            transition: "all 0.18s",
            lineHeight: 1,
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
