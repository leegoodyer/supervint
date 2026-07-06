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
    openGraph: {
      title: `${guide.title} — Supervint`,
      description: guide.meta_description || guide.intro,
      url: `https://supervint.com/guides/${slug}`,
      type: 'article',
    },
  };
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  return <GuideTemplate guide={guide} />;
}
