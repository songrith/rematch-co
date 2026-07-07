"use client";
import { LanguageProvider } from "@/app/context/language";

export default function ClientProviders({ children }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
