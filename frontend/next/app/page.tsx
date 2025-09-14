"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock, MessageSquare, Paperclip, ShieldCheck, Sparkles, Trash2, Upload, Zap, ChevronDown, HelpCircle, Sun, Moon } from "lucide-react";

// -----------------------------
// Mock data (visual only)
// -----------------------------
const mockUser = { email: "demo@tuapp.cl" } as const;
const mockPlan = { code: "PRO_4", name: "Pro (4 RUTs)", rut_quota: 4, active: true } as const;

type Slot = { id: number; rut: string; state: "empty" | "available" | "locked" };
const mockSlots: Slot[] = [
  { id: 1, rut: "76.543.210-5", state: "locked" },
  { id: 2, rut: "77.888.999-K", state: "available" },
  { id: 3, rut: "", state: "empty" },
  { id: 4, rut: "", state: "empty" },
];

// -----------------------------
// Helpers UI y efectos
// -----------------------------
function Tag({ tone = "slate", light = false, children }: { tone?: "slate" | "green" | "red"; light?: boolean; children: React.ReactNode }) {
  const tonesLight: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
  };
  const tonesDark: Record<string, string> = {
    slate: "bg-white/10 text-white/70",
    green: "bg-emerald-500/15 text-emerald-200",
    red: "bg-rose-500/15 text-rose-200",
  };
  const toneClass = (light ? tonesLight : tonesDark)[tone];
  return <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] ${toneClass}`}>{children}</span>;
}

function MotionSection({ id, title, subtitle, children, light = false }: { id?: string; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; light?: boolean }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative scroll-mt-28"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className={`mt-2 text-sm ${light ? "text-slate-600" : "text-white/70"}`}>{subtitle}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function HeaderUI({ current, onChange, light, onToggleTheme }: { current: string; onChange: (tab: string) => void; light: boolean; onToggleTheme: () => void }) {
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
          <span className={`rounded-lg px-2 py-1 ${light ? "bg-slate-100 text-slate-800" : "bg-white/10 text-white/90"}`}>{mockPlan.name}</span>
          <span className="hidden sm:inline">Email:</span>
          <span className={`rounded-lg px-2 py-1 ${light ? "bg-slate-100 text-slate-800" : "bg-white/10 text-white/90"}`}>{mockUser.email}</span>
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
      <div className={`pointer-events-none mt-4 h-px w-full bg-gradient-to-r from-transparent to-transparent ${light ? "via-slate-300/60" : "via-white/20"} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
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
      {!light && <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-tr from-[#40E0D0]/0 via-[#40E0D0]/0 to-[#40E0D0]/0 group-hover:from-[#40E0D0]/10" />}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Slot #{slot.id}</div>
        <Tag tone={badge.tone} light={light}>{badge.label}</Tag>
      </div>
      <div className={`truncate text-sm ${light ? "text-slate-900/90" : "text-white/90"}`}>{slot.rut || <span className={light ? "text-slate-400" : "text-white/40"}>—</span>}</div>
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
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 20h9" stroke="currentColor" strokeWidth="2"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2"/></svg>
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

function FilePicker({ label, file, onPick, light = false }: { label: string; file: File | null; onPick: (f: File | null) => void; light?: boolean }) {
  return (
    <div>
      <label className={`mb-2 block text-sm ${light ? "text-slate-700" : "text-white/70"}`}>{label}</label>
      <label className={`group relative flex cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-xl px-3 py-2 text-sm ${
        light ? "bg-white" : "bg-black/30"
      }`}>
        <span className={`relative z-10 inline-flex items-center gap-2 ${light ? "text-slate-700" : "text-white/80"}`}>
          <Paperclip className="w-4 h-4" /> {file ? file.name : "Seleccionar archivo CSV"}
        </span>
        <input type="file" accept=".csv" className="hidden" onChange={(e) => onPick(e.currentTarget.files?.[0] ?? null)} />
        <span className={`relative z-10 rounded-lg px-3 py-1 text-xs ${light ? "bg-slate-100 text-slate-800" : "bg-white/10 text-white/90"}`}>Elegir</span>
        <span className="shine pointer-events-none absolute inset-0" />
      </label>
    </div>
  );
}

// -----------------------------
// HERO + Vistas (Home, Account, Prices, Form, FAQ)
// -----------------------------
function Hero({ light = false }: { light?: boolean }) {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <section className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl backdrop-blur ${light ? "bg-white" : "bg-white/5"}`}>
      {/* capas decorativas */}
      {!light ? (
        <>
          <div className="pointer-events-none absolute -inset-1 bg-[radial-gradient(800px_circle_at_20%_-10%,rgba(64,224,208,0.10),transparent_60%)]" />
          <div className="pointer-events-none absolute -inset-1 bg-[radial-gradient(800px_circle_at_80%_120%,rgba(64,224,208,0.08),transparent_60%)]" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute -inset-1 bg-[radial-gradient(900px_circle_at_10%_-10%,rgba(64,224,208,0.15),transparent_60%)]" />
          <div className="pointer-events-none absolute -inset-1 bg-[radial-gradient(900px_circle_at_90%_120%,rgba(64,224,208,0.12),transparent_60%)]" />
        </>
      )}
      {/* Badge */}
      <div className={`mx-auto mb-4 w-fit rounded-full px-3 py-1 text-xs ring-1 ${light ? "bg-slate-50 text-slate-700 ring-[rgba(64,224,208,0.35)]" : "bg-white/10 text-white/80"}`}>
        🚀 Auto CS · UI lista para conectar
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`mx-auto max-w-4xl text-balance text-center text-5xl font-black leading-tight sm:text-6xl ${light ? "text-slate-900" : ""}`}
      >
        <span className="relative inline-block">
          <span className="bg-gradient-to-r from-[#40E0D0] via-[#6FEADD] to-[#A8F5EE] bg-clip-text text-transparent">Automatiza compras y ventas</span>
          <span className={`absolute inset-x-0 -bottom-1 h-px w-full bg-gradient-to-r from-transparent to-transparent ${light ? "via-[rgba(64,224,208,0.45)]" : "via-[rgba(64,224,208,0.35)]"}`} />
        </span>
        <br />
        <span className="bg-gradient-to-r from-[#A8F5EE] via-[#6FEADD] to-[#40E0D0] bg-clip-text text-transparent">con Auto CS</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        className={`mx-auto mt-4 max-w-2xl text-center ${light ? "text-slate-600" : "text-white/80"}`}
      >
        Sube tus CSV de <strong>compras/ventas</strong>, gestiona <strong>RUTs</strong> con bloqueo por primer uso y prepárate para conectar con tu backend/SII. Hoy editas lo visual; luego activamos la lógica.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          onClick={() => scrollTo("demo")}
          className={`group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            light
              ? "bg-[rgba(64,224,208,1)] text-slate-900 hover:brightness-95"
              : "bg-[rgba(64,224,208,0.95)] text-slate-900 hover:brightness-95"
          }`}
        >
          <span className="relative z-10">Probar Auto CS</span>
          <span className="shine pointer-events-none absolute inset-0" />
        </button>
        <button
          data-action="open-prices"
          className={`rounded-xl px-5 py-2.5 text-sm ${light ? "bg-white text-slate-700 hover:bg-slate-50" : "bg-white/5 text-white/80"}`}
        >
          Ver precios
        </button>
      </motion.div>

      {/* marquee decorativo */}
      <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className={`animate-marquee whitespace-nowrap text-xs ${light ? "text-slate-400" : "text-white/40"}`}>
          <span className="mx-4">RUTs</span>•<span className="mx-4">CSV</span>•<span className="mx-4">Compras</span>•<span className="mx-4">Ventas</span>•<span className="mx-4">Bloqueo primer uso</span>•
          <span className="mx-4">UI-only</span>•<span className="mx-4">Animaciones</span>•<span className="mx-4">Auroras</span>•<span className="mx-4">Spotlight</span>•<span className="mx-4">Parallax</span>•
        </div>
      </div>
    </section>
  );
}

function HomeView({ light = false }: { light?: boolean }) {
  return (
    <div className="space-y-16">
      <Hero light={light} />

      <MotionSection id="demo" title="Demo visual" subtitle="Vistazos de las secciones principales" light={light}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl backdrop-blur xl:col-span-2 ${light ? "bg-white" : "bg-white/5"}`}>
            <div className={`mb-4 inline-flex items-center gap-2 text-sm ${light ? "text-slate-600" : "text-white/70"}`}><MessageSquare className="w-4 h-4" /> Account</div>
            <div className={`h-64 rounded-xl ${light ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"}`} />
            {!light ? (
              <div className="pointer-events-none absolute -inset-1 bg-[radial-gradient(400px_circle_at_70%_20%,rgba(64,224,208,0.10),transparent_60%)]" />
            ) : (
              <div className="pointer-events-none absolute -inset-1 bg-[radial-gradient(420px_circle_at_70%_20%,rgba(64,224,208,0.12),transparent_60%)]" />
            )}
          </div>
          <div className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl backdrop-blur ${light ? "bg-white" : "bg-white/5"}`}>
            <div className={`mb-4 text-sm ${light ? "text-slate-600" : "text-white/70"}`}>Formulario</div>
            <div className={`h-64 rounded-xl ${light ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"}`} />
            {!light ? (
              <div className="pointer-events-none absolute -inset-1 bg-[radial-gradient(380px_circle_at_30%_30%,rgba(64,224,208,0.10),transparent_60%)]" />
            ) : (
              <div className="pointer-events-none absolute -inset-1 bg-[radial-gradient(420px_circle_at_30%_30%,rgba(64,224,208,0.12),transparent_60%)]" />
            )}
          </div>
        </div>
      </MotionSection>

      <MotionSection title="Características" subtitle="Interacciones suaves y diseño moderno" light={light}>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TiltCard light={light} icon={<Zap className="w-6 h-6" />} title="UI instantánea" desc="Componentes listos para estilizar." />
          <TiltCard light={light} icon={<ShieldCheck className="w-6 h-6" />} title="Escalable" desc="Estructura lista para lógica real." />
          <TiltCard light={light} icon={<Sparkles className="w-6 h-6" />} title="Personalizable" desc="Paletas y tipografías a tu gusto." />
        </div>
      </MotionSection>
    </div>
  );
}

function AccountView({ light = false }: { light?: boolean }) {
  return (
    <MotionSection title="Account" subtitle="Gestión visual de RUTs (sin lógica)" light={light}>
      <div className={`mb-4 text-sm ${light ? "text-slate-600" : "text-white/70"}`}>
        Plan activo: <span className="font-medium">{mockPlan.name}</span> · Cupo: <span className="font-medium">{mockPlan.rut_quota}</span> · Usuario: <span className="font-medium">{mockUser.email}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockSlots.map((s) => (
          <RutSlotCard key={s.id} slot={s} light={light} />
        ))}
      </div>
    </MotionSection>
  );
}

function PricesView({ light = false }: { light?: boolean }) {
  const tiers = [
    { code: "BASIC_1", name: "Básico", quota: 1, price: "$5.990" },
    { code: "PRO_2", name: "Pro", quota: 2, price: "$9.990" },
    { code: "PRO_4", name: "Pro Plus", quota: 4, price: "$14.990" },
  ];
  return (
    <MotionSection title="Precios" subtitle="Elige un plan (sólo visual)" light={light}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <motion.div
            key={t.code}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl backdrop-blur ${light ? "bg-white" : "bg-white/5"}`}
          >
            <div className={`mb-1 text-sm ${light ? "text-slate-600" : "text-white/60"}`}>{t.name}</div>
            <div className={`mb-1 text-3xl font-bold ${light ? "text-slate-900" : ""}`}>{t.price}</div>
            <div className={`mb-6 ${light ? "text-slate-600" : "text-white/60"}`}>Incluye {t.quota} RUT(s)</div>
            <ul className={`mb-6 space-y-2 text-sm ${light ? "text-slate-700" : "text-white/80"}`}>
              <li className="flex items-center gap-2"><Check className="w-4 h-4" />Uso de formularios</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4" />Bloqueo por primer uso</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4" />Soporte por email</li>
            </ul>
            <button className={`group relative w-full overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition ${
              light ? "bg-[rgba(64,224,208,1)] text-slate-900 hover:brightness-95" : "bg-white/10 text-white/80 hover:text-white"
            }`} aria-disabled title="Conecta la lógica para habilitar la compra">
              <span className="relative z-10">Elegir (deshabilitado)</span>
              <span className="shine pointer-events-none absolute inset-0" />
            </button>
            <div className={`pointer-events-none absolute -inset-1 ${light ? "bg-[radial-gradient(520px_circle_at_50%_-10%,rgba(64,224,208,0.15),transparent_60%)]" : "bg-[radial-gradient(500px_circle_at_50%_-10%,rgba(64,224,208,0.10),transparent_60%)]"}`} />
          </motion.div>
        ))}
      </div>
    </MotionSection>
  );
}

function FaqItem({ q, a, light = false }: { q: string; a: React.ReactNode; light?: boolean }) {
  return (
    <details className={`group rounded-2xl p-4 transition  ${light ? "bg-white" : "bg-white/5"}`}>
      <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 text-left text-sm font-medium ${light ? "text-slate-900" : "text-white/90"}`}>
        <span className="inline-flex items-center gap-2"><HelpCircle className="w-4 h-4" />{q}</span>
        <ChevronDown className={`w-4 h-4 transition group-open:rotate-180 ${light ? "text-slate-500" : ""}`} />
      </summary>
      <div className={`mt-3 text-sm ${light ? "text-slate-700" : "text-white/80"}`}>{a}</div>
    </details>
  );
}

function FaqView({ light = false }: { light?: boolean }) {
  return (
    <MotionSection title="Preguntas frecuentes" subtitle="Todo lo que necesitas saber (UI-only)" light={light}>
      <div className="space-y-3">
        <FaqItem light={light} q="¿Cómo funciona el bloqueo de RUT?" a={<>
          Al enviar tu primer formulario con un RUT en estado <Tag tone='green' light={light}>disponible</Tag>, ese slot pasa a <Tag tone='red' light={light}>bloqueado</Tag>. En Account ya no será editable, pero seguirá utilizable en Formularios.
        </>} />
        <FaqItem light={light} q="¿Puedo cambiar de plan más adelante?" a={<>
          Sí. Al <strong>subir</strong> de plan, se desbloquean los RUTs y se crean slots vacíos hasta completar el cupo nuevo. Al <strong>bajar</strong>, se podan los slots que exceden el cupo.
        </>} />
        <FaqItem light={light} q="¿Qué formato deben tener los CSV?" a={<>
          Aceptamos 2 archivos CSV por formulario. Ejemplo de cabeceras sugeridas: <code>fecha,folio,monto,rut</code>. El tamaño estará limitado (mostrado en la UI) cuando conectemos la lógica.
        </>} />
        <FaqItem light={light} q="¿Guardan mi contraseña del SII?" a={<>
          No en texto plano. Cuando conectemos la lógica, se manejará en memoria o cifrada con TTL, nunca en logs.
        </>} />
        <FaqItem light={light} q="¿Puedo editar un RUT bloqueado?" a={<>
          No desde Account. El estado bloqueado indica que ya fue usado por un formulario. Puedes desbloquear con un <em>upgrade</em> o reglas específicas cuando implementemos backend.
        </>} />
        <FaqItem light={light} q="¿Cómo exporto mis datos?" a={<>
          Cuando esté lista la lógica, podrás descargar reportes desde el historial de formularios.
        </>} />
      </div>
    </MotionSection>
  );
}

function FormView({ light = false }: { light?: boolean }) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const selectableRuts = mockSlots.filter((s) => s.state !== "empty");

  return (
    <MotionSection title="Formulario" subtitle="Subida de archivos (UI-only)" light={light}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl backdrop-blur ${light ? "bg-white" : "bg-white/5"}`}>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={`mb-2 block text-sm ${light ? "text-slate-700" : "text-white/70"}`}>Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className={`rounded-xl px-3 py-2 text-sm ${light ? "bg-slate-100 text-slate-800" : "bg-white/10 text-white/90"}`}>Compras</button>
                  <button className={`rounded-xl px-3 py-2 text-sm ${light ? "bg-white text-slate-700" : "bg-white/5 text-white/80"}`}>Ventas</button>
                </div>
              </div>
              <div>
                <label className={`mb-2 block text-sm ${light ? "text-slate-700" : "text-white/70"}`}>RUT</label>
                <select className={`w-full rounded-xl px-3 py-2 text-sm ${light ? "bg-white text-slate-800" : "bg-black/30 text-white/90"}`}>
                  {selectableRuts.map((s) => (
                    <option key={s.id} value={s.rut}>
                      {s.rut} · {s.state === "locked" ? "bloqueado" : "disponible"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FilePicker light={light} label="CSV #1" file={fileA} onPick={setFileA} />
              <FilePicker light={light} label="CSV #2" file={fileB} onPick={setFileB} />
            </div>
            <div className="mt-6">
              <button className={`group relative inline-flex cursor-not-allowed items-center gap-2 overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition ${
                light ? "bg-[rgba(64,224,208,1)] text-slate-900" : "bg-white/10 text-white/80"
              }`} aria-disabled title="Conecta la lógica para procesar">
                <span className="relative z-10 inline-flex items-center gap-2"><Upload className="w-4 h-4" /> Procesar (deshabilitado)</span>
                <span className="shine pointer-events-none absolute inset-0" />
              </button>
            </div>
            <div className={`pointer-events-none absolute -inset-1 ${light ? "bg-[radial-gradient(420px_circle_at_10%_-10%,rgba(64,224,208,0.12),transparent_60%)]" : "bg-[radial-gradient(420px_circle_at_10%_-10%,rgba(64,224,208,0.10),transparent_60%)]"}`} />
          </div>
        </div>
        <aside className="space-y-4">
          <div className={`rounded-3xl p-4 text-sm shadow-2xl backdrop-blur ${light ? "bg-white text-slate-700" : "bg-white/5 text-white/80"}`}>
            <div className="mb-2 font-medium">Notas</div>
            <ul className="list-disc space-y-1 pl-5">
              <li>Este formulario es solo visual.</li>
              <li>Al conectar la lógica, el primer uso de un RUT lo bloqueará.</li>
              <li>Los archivos no se suben; solo se previsualiza el nombre.</li>
            </ul>
          </div>
        </aside>
      </div>
    </MotionSection>
  );
}
// -----------------------------
// APP (archivo único) con efectos globales y tema + persistencia
// -----------------------------
export default function VisualDemoApp(): JSX.Element {
  const [tab, setTab] = useState<"home" | "account" | "prices" | "form" | "faq">("home");
  // Tema con inicialización perezosa: respeta localStorage o prefers-color-scheme
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored;
      const sysLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      return sysLight ? "light" : "dark";
    }
    return "dark";
  });
  // Si no hay preferencia guardada, seguimos los cambios del sistema automáticamente
  const [autoFollow, setAutoFollow] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !window.localStorage.getItem("theme");
    }
    return true;
  });

  const light = theme === "light";

  // Persistir en localStorage cada vez que cambia
  useEffect(() => {
    try { window.localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  // Escuchar cambios del sistema solo si estamos en modo autoFollow
  useEffect(() => {
    if (!autoFollow) return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "light" : "dark");
    if ("addEventListener" in mql) mql.addEventListener("change", handler);
    else (mql as any).addListener(handler as any);
    return () => {
      if ("removeEventListener" in mql) mql.removeEventListener("change", handler);
      else (mql as any).removeListener(handler as any);
    };
  }, [autoFollow]);

  function toggleTheme() {
    setAutoFollow(false);
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  return (
    <main
      className={`min-h-dvh ${light ? "bg-white text-slate-900" : "bg-[#0a1420] text-white"}`}
      onClick={(e) => {
        const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
        if (!target) return;
        const action = target.dataset.action;
        if (action === "open-prices") setTab("prices");
        if (action === "open-form") setTab("form");
      }}
      data-theme={theme}
    >
      {/* Aurora + Glow de fondo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" />

      <div className="relative z-10">
        <HeaderUI light={light} current={tab} onChange={(id) => setTab(id as any)} onToggleTheme={toggleTheme} />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-6">
          {tab === "home" && <HomeView light={light} />}
          {tab === "account" && <AccountView light={light} />}
          {tab === "prices" && <PricesView light={light} />}
          {tab === "form" && <FormView light={light} />}
          {tab === "faq" && <FaqView light={light} />}
        </div>
        <FooterUI light={light} />
      </div>

      {/* Estilos globales para animaciones + vars de marca */}
      <style>{`
        :root[data-theme='light'] { --brand: #40E0D0; }
        :root[data-theme='dark']  { --brand: #40E0D0; }
        @keyframes aurora {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(0,-20px,0) scale(1.05); }
        }
        .animate-aurora { animation: aurora 8s ease-in-out infinite; }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.16) 45%, rgba(255,255,255,0.16) 55%, transparent 100%);
          transform: translateX(-100%);
          animation: shine 2.2s linear infinite;
        }
        @keyframes beam { 0% { opacity: .2; } 50% { opacity: .7; } 100% { opacity: .2; } }
        .animate-beam { animation: beam 3s ease-in-out infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 18s linear infinite; }
      `}</style>
    </main>
  );
}
