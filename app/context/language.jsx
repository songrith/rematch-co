"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({ lang: "th", toggleLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("th");

  useEffect(() => {
    const saved = localStorage.getItem("rm_lang");
    if (saved === "en" || saved === "th") setLang(saved);
  }, []);

  function toggleLang() {
    setLang(prev => {
      const next = prev === "th" ? "en" : "th";
      localStorage.setItem("rm_lang", next);
      return next;
    });
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
