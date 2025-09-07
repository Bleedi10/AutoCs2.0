import { Metadata } from 'next';

import ClientSlugHandler from './ClientSlugHandler';
import PageContent from '@/lib/shared/PageContent';
import { generateMetadataObject } from '@/lib/shared/metadata';
import fetchContentType from '@/lib/strapi/fetchContentType';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;

  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: 'homepage',
        locale: params.locale,
      },
      populate: 'seo.metaImage',
    },
    true
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}

export default async function HomePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: 'homepage',
        locale: params.locale,
      },
    },
    true
  );

  const localizedSlugs = pageData?.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = '';
      return acc;
    },
    { [params.locale]: '' }
  );

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs || { [params.locale]: '' }} />
      {pageData ? (
        <PageContent pageData={pageData} />
      ) : (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-4xl md:text-6xl font-extrabold text-neutral-900 dark:text-white">Automatiza tus formularios SII</h1>
          <p className="mt-4 text-neutral-700 dark:text-neutral-300 text-lg max-w-2xl">
            Gestiona tus RUTs, contrata un plan y bloquea en primer uso. Rápido, seguro y simple.
          </p>
          <div className="mt-8 flex gap-3">
            <a href="/es/pricing" className="px-5 py-3 rounded-md bg-cyan-500 hover:bg-cyan-400 text-neutral-900 font-semibold">Ver precios</a>
            <a href="/accounts/login/" className="px-5 py-3 rounded-md border border-neutral-700 text-white hover:bg-neutral-800">Iniciar sesión</a>
          </div>
        </section>
      )}
    </>
  );
}
