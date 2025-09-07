"use client";

import React from "react";

export function UserStatus({ locale }: { locale: string }) {
  const [email, setEmail] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (data?.authenticated) {
          setEmail(data.email || null);
          setPlan(data.plan_name || null);
        }
      } catch {}
    })();
    return () => { mounted = false };
  }, []);

  if (!email) {
    return (
      <a href={`/${locale}/signup`} className="text-sm text-neutral-800 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white">Iniciar sesión</a>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-neutral-800 dark:text-white/80">{email}{plan ? ` · Plan: ${plan}` : " · Sin plan"}</span>
      <a href={`/api/auth/signout?callbackUrl=/${locale}`} className="px-2 py-1 rounded-md border border-neutral-300 hover:bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:text-white">Cerrar sesión</a>
    </div>
  );
}
