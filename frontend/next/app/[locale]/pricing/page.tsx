import React from 'react';
import { fetchPlans } from '@/lib/api';
import { Pricing } from '@/components/dynamic-zone/pricing';

export const dynamic = 'force-dynamic';

export default async function PricingPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = params.locale;
  let plans: { code: string; name: string; price_month: string; rut_quota: number }[] = [];
  try {
    plans = await fetchPlans();
  } catch (e) {
    plans = [
      { code: 'basic', name: 'Básico', price_month: '4900', rut_quota: 1 },
      { code: 'pro', name: 'Pro', price_month: '14900', rut_quota: 5 },
      { code: 'enterprise', name: 'Enterprise', price_month: '49900', rut_quota: 20 },
    ];
  }

  const mapPerks = (quota: number) => {
    if (quota <= 1)
      return [
        { text: 'Hasta 1 RUT activo' },
        { text: 'Gestión de slots y bloqueo' },
        { text: 'Formulario básico' },
        { text: 'Analítica básica' },
      ];
    if (quota <= 5)
      return [
        { text: 'Hasta 5 RUTs activos' },
        { text: 'Dashboard de cuenta' },
        { text: 'Mayor velocidad de procesamiento' },
        { text: 'Analítica avanzada' },
        { text: 'Soporte prioritario' },
      ];
    return [
      { text: 'Hasta 20 RUTs activos' },
      { text: 'Dashboard colaborativo' },
      { text: 'Alta velocidad' },
      { text: 'Analítica y reportes' },
      { text: 'Soporte prioritario' },
      { text: 'Herramientas de equipo' },
    ];
  };

  const mapped = plans.map((p) => ({
    name: p.name,
    price: Number(p.price_month),
    perks: mapPerks(p.rut_quota),
    additional_perks: [],
    description: '',
    number: String(p.rut_quota),
    featured: p.code === 'enterprise',
    plan_code: p.code,
    CTA: { text: 'Contratar', mode: 'subscribe' },
  }));

  // Card adicional "Contáctanos" (sin precio)
  const contactCard = {
    name: 'Enterprise',
    // sin price: muestra texto grande en su lugar
    perks: [
      { text: 'RUTs ilimitados' },
      { text: 'Dashboard personalizable' },
      { text: 'Entrega ultra-rápida' },
      { text: 'Analítica integral y reportes' },
      { text: 'Equipo de soporte dedicado' },
      { text: 'Integraciones y soluciones a medida' },
    ],
    additional_perks: [],
    description: '',
    number: '∞',
    featured: false,
    CTA: { text: 'Contáctanos', href: `/${locale}/contact` },
  } as any;

  const cards = [...mapped, contactCard];

  return (
    <div className="relative z-10">
      <Pricing heading="Elige tu plan" sub_heading="Escala cuando lo necesites" plans={cards} locale={locale} />
    </div>
  );
}
