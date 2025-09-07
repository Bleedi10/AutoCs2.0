"use client";

import { useTheme } from "next-themes";
import React from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || theme === undefined;
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-3 py-1.5 text-xs rounded-md min-w-[120px] text-center border backdrop-blur border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
      title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
    >
      {isDark ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}
