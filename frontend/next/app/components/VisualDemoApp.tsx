"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, Trash2, Palette, StickyNote, Moon, Sun } from "lucide-react";

// -----------------------------
// Types
// -----------------------------
interface Slot {
  id: number;
  state: "locked" | "available" | "empty";
  rut: string | null;
}

// -----------------------------
// Components
// -----------------------------
function Tag({ tone = "slate", light = false, children }: { tone?: "red" | "green" | "slate"; light?: boolean; children: React.ReactNode }) {
  const colors = {
    red: light ? "bg-red-50 text-red-600" : "bg-red-500/20 text-red-400",
    green: light ? "bg-green-50 text-green-600" : "bg-green-500/20 text-green-400",
    slate: light ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/70",
  };

  return <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[tone]}`}>{children}</div>;
}

function HeaderUI({ light, onToggleTheme }: { light?: boolean; onToggleTheme: () => void }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur">
      <div className={`h-0.5 w-full ${light ? "bg-slate-200" : "bg-white/10"}`} />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="text-lg font-semibold">Visual Demo</div>
        <div className="flex items-center gap-3">
          <button
            className={`rounded-lg p-2 ${light ? "hover:bg-slate-100" : "hover:bg-white/10"} transition-colors duration-200`}
            onClick={onToggleTheme}
            title={light ? "Activar modo oscuro" : "Activar modo claro"}
          >
            {light ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function FooterUI({ light = false }: { light?: boolean }) {
  return (
    <footer className={`mx-auto max-w-6xl px-6 pb-12 pt-6 text-center text-sm ${light ? "text-slate-600" : "text-white/60"}`}>
      Construido en modo <span className={light ? "text-slate-800" : "text-white/80"}>UI-only</span>. Conecta lógicas cuando estés listo.
    </footer>
  );
}

function TiltCard({ icon, title, desc, light = false }: { icon: React.ReactNode; title: string; desc: string; light?: boolean }) {
  function handleMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateX = ((y - midY) / midY) * -6;
    const rotateY = ((x - midX) / midX) * 6;
    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function reset(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`group will-change-transform rounded-2xl p-5 text-left shadow-lg backdrop-blur transition-transform duration-150 ${
        light ? "bg-white" : "bg-white/5"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={`mb-3 inline-flex items-center justify-center rounded-xl p-2 ${light ? "bg-slate-100" : "bg-white/10"}`}>{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className={`mt-1 text-sm ${light ? "text-slate-600" : "text-white/70"}`}>{desc}</p>
      <div
        className={`pointer-events-none mt-4 h-px w-full bg-gradient-to-r from-transparent to-transparent ${
          light ? "via-slate-300/60" : "via-white/20"
        } opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
      />
    </div>
  );
}

function RutSlotCard({ slot, light = false }: { slot: Slot; light?: boolean }) {
  const badge =
    slot.state === "locked"
      ? { label: "bloqueado", tone: "red" as const }
      : slot.state === "available"
      ? { label: "disponible", tone: "green" as const }
      : { label: "vacío", tone: "slate" as const };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl p-4 shadow-lg backdrop-blur ${light ? "bg-white" : "bg-white/5"}`}
    >
      {/* sutil halo */}
      {!light && (
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-tr from-[#40E0D0]/0 via-[#40E0D0]/0 to-[#40E0D0]/0 group-hover:from-[#40E0D0]/10" />
      )}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Slot #{slot.id}</div>
        <Tag tone={badge.tone} light={light}>
          {badge.label}
        </Tag>
      </div>
      <div className={`truncate text-sm ${light ? "text-slate-900/90" : "text-white/90"}`}>
        {slot.rut || <span className={light ? "text-slate-400" : "text-white/40"}>—</span>}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
            slot.state === "locked"
              ? light
                ? "cursor-not-allowed bg-slate-50 text-slate-400"
                : "cursor-not-allowed bg-white/5 text-white/40"
              : light
              ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
              : "bg-white/10 text-white/80 hover:bg-white/15"
          }`}
          aria-disabled={slot.state === "locked"}
          title={slot.state === "locked" ? "Bloqueado — edita cuando conectes la lógica" : "Editar (solo visual)"}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 20h9" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" />
          </svg>
          Editar
        </button>
        <button
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
            slot.state === "locked"
              ? light
                ? "cursor-not-allowed bg-slate-50 text-slate-400"
                : "cursor-not-allowed bg-white/5 text-white/40"
              : light
              ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
              : "bg-white/10 text-white/80 hover:bg-white/15"
          }`}
          aria-disabled={slot.state === "locked"}
          title={slot.state === "locked" ? "Bloqueado — limpiar cuando conectes la lógica" : "Limpiar (solo visual)"}
        >
          <Trash2 className="w-4 h-4" />
          Limpiar
        </button>
        {slot.state === "locked" && (
          <div className={`ml-auto inline-flex items-center gap-1 text-[10px] ${light ? "text-slate-500" : "text-white/50"}`}>
            <Lock className="w-3 h-3" /> primer uso
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function VisualDemoApp() {
  const [darkMode, setDarkMode] = useState(true);

  const slots: Slot[] = [
    { id: 1, state: "locked", rut: "12.345.678-9" },
    { id: 2, state: "available", rut: null },
    { id: 3, state: "empty", rut: null },
  ];

  return (
    <div className={darkMode ? "bg-gradient-to-tr from-slate-900 to-slate-800 text-white" : "bg-gradient-to-tr from-slate-100 to-white"}>
      {/* Layout */}
      <HeaderUI light={!darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* hero */}
        <div className="relative -mt-6 text-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 mx-auto max-w-2xl"
          >
            <div
              className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                darkMode ? "bg-white/10" : "bg-slate-100"
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${darkMode ? "bg-white" : "bg-slate-500"}`} />
              {darkMode ? "Modo claro disponible" : "Modo oscuro disponible"}
            </div>
            <h1 className="text-balance mb-4 text-4xl font-semibold tracking-tight">
              Panel sencillo para <span className="text-teal-400">gestionar RUTs</span>
            </h1>
            <p className={`text-balance text-lg ${darkMode ? "text-white/70" : "text-slate-600"}`}>
              Diseñado para aclarar conceptos de lógica antes de conectar con el servidor Django.
            </p>
          </motion.div>

          {/* efecto glow */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2"
            style={{
              background: `conic-gradient(
              from 90deg at 50% 50%,
              ${darkMode ? "#0000" : "#0000"},
              ${darkMode ? "#40E0D0" : "#40E0D0"},
              ${darkMode ? "#0000" : "#0000"}
            )`,
              opacity: 0.15,
              filter: "blur(80px)",
            }}
          />
        </div>

        {/* slots */}
        <div className="mt-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="grid gap-4 lg:grid-cols-2"
          >
            {slots.map((slot) => (
              <RutSlotCard key={slot.id} slot={slot} light={!darkMode} />
            ))}
          </motion.div>
        </div>

        {/* features */}
        <div className="mt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              Todo lo que necesitas, <span className="text-teal-400">nada más</span>
            </h2>
            <p className={`mx-auto max-w-lg text-balance ${darkMode ? "text-white/70" : "text-slate-600"}`}>
              Enfócate en la lógica de negocio sin preocuparte por detalles de UI. Todo funciona y se ve bien por defecto.
            </p>
          </motion.div>

          {/* cards */}
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <TiltCard
              light={!darkMode}
              icon={<Sparkles className="w-5 h-5" />}
              title="Simplicidad deliberada"
              desc="Solo las funciones esenciales para gestionar RUTs. Cada botón tiene un propósito claro."
            />
            <TiltCard
              light={!darkMode}
              icon={<Palette className="w-5 h-5" />}
              title="Tema adaptable"
              desc="Modo claro y oscuro incluidos. Los colores se ajustan automáticamente para mantener el contraste."
            />
            <TiltCard
              light={!darkMode}
              icon={<StickyNote className="w-5 h-5" />}
              title="Estado visual"
              desc="Los slots tienen estados que indican su disponibilidad. Todo está listo para conectar con Django."
            />
          </div>
        </div>
      </main>

      <FooterUI light={!darkMode} />
    </div>
  );
}
