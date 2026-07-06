import { getAllGuides } from '@/lib/guides';

const SITE_URL = 'https://supervint.com';
const STATIC_ROUTES = ['', '/guides', '/privacy', '/terms', '/deletion', '/contact'];

export default function sitemap() {
  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
  }));

  const guideEntries = getAllGuides().map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: guide.date_modified || guide.date_published,
  }));

  return [...staticEntries, ...guideEntries];
}
