'use client';
import { Moon, Sun } from "lucide-react";

export function HeaderUI({ current, onChange, light, onToggleTheme }: { current: string; onChange: (tab: string) => void; light: boolean; onToggleTheme: () => void }) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "account", label: "Account" },
    { id: "prices", label: "Precios" },
    { id: "form", label: "Formulario" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <header className="mx-auto max-w-6xl px-6 pt-6">
      <div className={`relative flex items-center justify-between rounded-2xl p-3 shadow-none backdrop-blur ${light ? "bg-transparent" : "bg-white/5"}`}>
        <div className="flex items-center gap-6">
          <div className={`text-sm font-semibold tracking-wide ${light ? "text-slate-900" : ""}`}>
            SaaS <span className={light ? "text-slate-500" : "text-white/60"}>2.0</span>
          </div>
          <nav className={`hidden gap-2 text-sm sm:flex ${light ? "text-slate-600" : "text-white/80"}`}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  current === t.id
                    ? light
                      ? "bg-slate-100 text-slate-900"
                      : "bg-white/10 text-white"
                    : "hover:text-inherit hover:opacity-90"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className={`flex items-center gap-3 text-xs ${light ? "text-slate-600" : "text-white/70"}`}>
          <button
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
            className={`inline-flex items-center justify-center rounded-lg px-2 py-1 transition ${
              light ? "bg-slate-50 text-slate-700 hover:bg-slate-100" : "bg-white/10 text-white/80 hover:text-white"
            }`}
            title={light ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
          >
            {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <span className="hidden sm:inline">Plan:</span>
          <span className={`rounded-lg px-2 py-1 ${light ? "bg-slate-100 text-slate-800" : "bg-white/10 text-white/90"}`}>Pro (4 RUTs)</span>
          <span className="hidden sm:inline">Email:</span>
          <span className={`rounded-lg px-2 py-1 ${light ? "bg-slate-100 text-slate-800" : "bg-white/10 text-white/90"}`}>demo@tuapp.cl</span>
        </div>
      </div>
    </header>
  );
}
