'use client';
import { useState } from 'react';
import { HeaderUI } from './components/HeaderUI';

export default function RootLayoutClient({
  children
}: {
  children: React.ReactNode
}) {
  const [tab, setTab] = useState<"home" | "account" | "prices" | "form" | "faq">("home");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored;
      const sysLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      return sysLight ? "light" : "dark";
    }
    return "dark";
  });

  const light = theme === "light";

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  return (
    <body suppressHydrationWarning className={`min-h-dvh ${light ? "bg-white text-slate-900" : "bg-[#0a1420] text-white"}`}>
      <HeaderUI 
        light={light} 
        current={tab} 
        onChange={(id) => setTab(id as any)} 
        onToggleTheme={toggleTheme} 
      />
      {children}
    </body>
  );
}
