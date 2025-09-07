import { Metadata } from 'next';

import ClientSlugHandler from '../ClientSlugHandler';
import PageContent from '@/lib/shared/PageContent';
import { generateMetadataObject } from '@/lib/shared/metadata';
import fetchContentType from '@/lib/strapi/fetchContentType';

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: params.slug,
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

export default async function Page(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const params = await props.params;
  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: params.slug,
        locale: params.locale,
      },
    },
    true
  );

  const localizedSlugs = pageData?.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = localization.slug;
      return acc;
    },
    { [params.locale]: params.slug }
  );

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs || { [params.locale]: params.slug }} />
      {pageData ? (
        <PageContent pageData={pageData} />
      ) : (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Sección</h1>
          <p className="text-neutral-300">Contenido no disponible por el momento.</p>
        </section>
      )}
    </>
  );
}
