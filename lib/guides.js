import fs from 'fs';
import path from 'path';

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides');
const SITE_URL = 'https://supervint.com';

export function getAllGuideSlugs() {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
}

export function getGuideBySlug(slug) {
  const filePath = path.join(GUIDES_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return { slug, ...JSON.parse(raw) };
}

export function getAllGuides() {
  return getAllGuideSlugs()
    .map((slug) => getGuideBySlug(slug))
    .filter(Boolean);
}

export function buildFaqSchema(guide) {
  if (!guide.faq || guide.faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.answer,
      },
    })),
  };
}

export function buildArticleSchema(guide) {
  const url = `${SITE_URL}/guides/${guide.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.meta_description || guide.intro,
    datePublished: guide.date_published,
    dateModified: guide.date_modified || guide.date_published,
    author: {
      '@type': 'Organization',
      name: guide.author || 'Supervint',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Supervint',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}
