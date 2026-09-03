import { notFound } from 'next/navigation';
import { getAllGuideSlugs, getGuideBySlug } from '@/lib/guides';
import GuideTemplate from '@/components/guides/GuideTemplate';

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return {
    title: `${guide.title} — Supervint`,
    description: guide.meta_description || guide.intro,
    alternates: {
      canonical: `/guides/${slug}`,
    },
    openGraph: {
      title: `${guide.title} — Supervint`,
      description: guide.meta_description || guide.intro,
      url: `https://supervint.com/guides/${slug}`,
      type: 'article',
      ...(guide.hero_image?.src
        ? { images: [{ url: `https://supervint.com${guide.hero_image.src}` }] }
        : { images: [{ url: 'https://supervint.com/og-image.png' }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${guide.title} — Supervint`,
      description: guide.meta_description || guide.intro,
      ...(guide.hero_image?.src
        ? { images: [`https://supervint.com${guide.hero_image.src}`] }
        : { images: ['https://supervint.com/og-image.png'] }),
    },
  };
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  return <GuideTemplate guide={guide} />;
}
