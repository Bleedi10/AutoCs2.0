"use client";

import { IconBrandWindows, IconBrandGoogle } from "@tabler/icons-react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";

import { Container } from "@/components/container";
import { FeatureIconContainer } from "@/components/dynamic-zone/features/feature-icon-container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { Button } from "@/components/elements/button";

export default function Signup() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "es";
  const sp = useSearchParams();
  const plan = sp?.get("plan") || "";

  const feBase = process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.WEBSITE_URL || "http://localhost:3000";
  const beBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const nextUrl = `${feBase}/${locale}/account`;

  const join = (base: string, params: Record<string, string | undefined>) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
      .join("&");
    return qs ? `${base}?${qs}` : base;
  };

  const signupUrl = join(`${beBase}/accounts/signup/`, { next: nextUrl, plan: plan || undefined });
  const loginUrl = join(`${beBase}/accounts/login/`, { next: nextUrl });
  const googleHref = `/api/auth/signin/google?callbackUrl=/${locale}/account`;

  return (
    <div className="relative z-10">
      <Container className="pt-20 pb-24">
        <div className="max-w-md mx-auto">
          <h2 className="text-center text-white text-lg font-semibold mb-6">Inicia sesión en tu cuenta</h2>
          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8">
            <div className="flex justify-center mb-6">
              <span className="text-2xl font-extrabold text-neutral-900">AutoCS</span>
            </div>

            <form className="space-y-3">
              <div>
                <label className="block text-sm text-neutral-700 mb-1">Email</label>
                <input type="email" placeholder="tu@correo.com" className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1">Contraseña</label>
                <input type="password" placeholder="••••••••" className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="flex justify-between items-center text-sm">
                <div />
                <Link href={`${beBase}/accounts/password/reset/`} className="text-cyan-600 hover:text-cyan-700 font-medium">¿Olvidaste tu contraseña?</Link>
              </div>
              <Button as={Link} href={loginUrl} className="w-full bg-neutral-900 text-white hover:bg-neutral-800" variant="muted">Continuar</Button>

              <div className="text-center text-sm text-neutral-600">
                ¿No tienes cuenta? <Link href={signupUrl} className="text-cyan-600 hover:text-cyan-700 font-semibold">Regístrate</Link>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-neutral-200 flex-1" />
                <span className="text-neutral-400 text-xs">O</span>
                <div className="h-px bg-neutral-200 flex-1" />
              </div>

              <div className="grid gap-3">
                <a href={googleHref} className="border border-neutral-300 hover:bg-neutral-50 rounded-md px-4 py-2 flex items-center justify-center gap-2">
                  <IconBrandGoogle className="h-5 w-5" /> Continuar con Google
                </a>
                <button disabled className="opacity-60 border border-neutral-300 rounded-md px-4 py-2 flex items-center justify-center gap-2">
                  <IconBrandWindows className="h-5 w-5" /> Continuar con Microsoft (próximamente)
                </button>
              </div>

              <p className="text-[11px] text-center text-neutral-500 mt-4">
                Al crear una cuenta o iniciar sesión aceptas nuestros <a href="/terms" className="underline">términos de uso</a>.
              </p>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
