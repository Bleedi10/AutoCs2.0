import { Metadata } from 'next';
import { ViewTransitions } from 'next-view-transitions';
import { Inter } from 'next/font/google';
import React from 'react';

import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { CartProvider } from '@/context/cart-context';
import { generateMetadataObject } from '@/lib/shared/metadata';
import fetchContentType from '@/lib/strapi/fetchContentType';
import { ThemeProvider } from '@/components/theme-provider';
import { AmbientColor } from '@/components/decorations/ambient-color';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

// Default Global SEO for pages without them
export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const pageData = await fetchContentType(
    'global',
    {
      filters: { locale: params.locale },
      populate: 'seo.metaImage',
    },
    true
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { locale } = params;

  const { children } = props;

  const pageData = await fetchContentType('global', { filters: { locale } }, true);

  // Fallback básico si no hay CMS: navbar + footer estáticos en ES
  const navbarFallback = {
    left_navbar_items: [
      { URL: '/', text: 'Inicio' },
      { URL: '/pricing', text: 'Precios' },
      { URL: '/products', text: 'Productos' },
      { URL: '/blog', text: 'Blog' },
      { URL: '/faq', text: 'FAQ' },
      { URL: '/contact', text: 'Contacto' },
    ],
    right_navbar_items: [
      { URL: '/signup', text: 'Crear cuenta' },
      { URL: '/account', text: 'Account' },
    ],
    logo: {},
  } as any;

  const footerFallback = {
    logo: {},
    description: 'Automatiza formularios y gestión de RUTs de manera simple.',
    copyright: '© ' + new Date().getFullYear() + ' AutoCS. Todos los derechos reservados.',
    internal_links: [
      { URL: '/', text: 'Inicio' },
      { URL: '/pricing', text: 'Precios' },
      { URL: '/products', text: 'Productos' },
      { URL: '/blog', text: 'Blog' },
      { URL: '/faq', text: 'FAQ' },
      { URL: '/contact', text: 'Contacto' },
    ],
    policy_links: [
      { URL: '/terms', text: 'Términos' },
      { URL: '/privacy', text: 'Privacidad' },
    ],
    social_media_links: [
      { URL: 'https://x.com', text: 'X' },
      { URL: 'https://linkedin.com', text: 'LinkedIn' },
    ],
  } as any;
  return (
    <ViewTransitions>
      <ThemeProvider>
        <CartProvider>
          <div
            className={cn(
              inter.className,
              'antialiased h-full w-full bg-white text-neutral-900 dark:bg-charcoal dark:text-white'
            )}
          >
            <div className="hidden dark:block"><AmbientColor /></div>
            <Navbar data={pageData?.navbar ?? navbarFallback} locale={locale} />
            {children}
            <Footer data={pageData?.footer ?? footerFallback} locale={locale} />
          </div>
        </CartProvider>
      </ThemeProvider>
    </ViewTransitions>
  );
}
