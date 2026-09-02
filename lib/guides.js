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

// Topical clusters for internal linking. Guides in the same cluster link to each
// other, so Google sees topical silos instead of isolated pages. Unknown slugs
// fall through to the universal fallback set.
const CLUSTERS = {
  outerwear: ['north-face-on-vinted', 'barbour-on-vinted', 'arcteryx-on-vinted', 'patagonia-on-vinted'],
  clothing: ['carhartt-on-vinted', 'football-shirts-on-vinted', 'stone-island-on-vinted', 'kids-clothes-on-vinted', 'school-uniforms-on-vinted', 'halloween-costumes-on-vinted'],
  footwear: ['adidas-on-vinted', 'nike-on-vinted', 'dr-martens-on-vinted'],
  denim: ['vintage-denim-on-vinted', 'levis-on-vinted'],
  accessories: ['designer-bags-on-vinted'],
  gaming: ['retro-games-on-vinted', 'lego-on-vinted'],
  reselling: ['how-to-sell-on-vinted', 'how-to-get-more-views-on-vinted', 'reselling-on-vinted', 'what-sells-on-vinted', 'vinted-sniper', 'vinted-vs-depop', 'vinted-vs-ebay', 'vinted-vs-facebook-marketplace', 'vinted-alternatives', 'vinted-price-alert'],
  howItWorks: ['does-vinted-notify-price-changes', 'vinted-notifications-not-working', 'how-to-see-sold-prices-on-vinted'],
  safety: ['vinted-buyer-protection', 'is-vinted-safe-to-sell-on', 'vinted-ban-risk', 'is-it-safe-to-buy-an-iphone-on-vinted'],
  help: ['how-to-contact-vinted-support', 'vinted-delivery-issues-troubleshooting', 'vinted-scams-buyer-protection', 'vinted-empty-box-scam', 'vinted-buyer-didnt-collect-order', 'vinted-account-banned-email-scam', 'vinted-ai-banning-system', 'vinted-ai-damage-photo-scam'],
};

const SLUG_TO_CLUSTER = {};
for (const [cluster, slugs] of Object.entries(CLUSTERS)) {
  for (const slug of slugs) SLUG_TO_CLUSTER[slug] = cluster;
}

// Universal links every guide gets regardless of cluster (pillar + broad topics).
const FALLBACK_RELATED = ['vinted-price-alert', 'vinted-alerts-for-resellers', 'vinted-sniper'];

export function getRelatedGuides(slug, limit = 4) {
  const all = getAllGuides();
  const bySlug = new Map(all.map((g) => [g.slug, g]));
  const cluster = SLUG_TO_CLUSTER[slug];
  const peers = cluster ? CLUSTERS[cluster].filter((s) => s !== slug) : [];
  const ordered = [...peers, ...FALLBACK_RELATED.filter((s) => s !== slug && !peers.includes(s))];
  const seen = new Set();
  const out = [];
  for (const s of ordered) {
    if (seen.has(s)) continue;
    const guide = bySlug.get(s);
    if (guide) { seen.add(s); out.push(guide); }
    if (out.length >= limit) break;
  }
  return out;
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

export function buildBreadcrumbSchema(guide) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
      { '@type': 'ListItem', position: 3, name: guide.title, item: `${SITE_URL}/guides/${guide.slug}` },
    ],
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
