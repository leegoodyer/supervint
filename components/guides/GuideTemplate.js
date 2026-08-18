import { buildArticleSchema, buildFaqSchema, buildBreadcrumbSchema, getRelatedGuides } from '@/lib/guides';
import BrandBolt from '@/components/BrandBolt';

export default function GuideTemplate({ guide }) {
  const faqSchema = buildFaqSchema(guide);
  const articleSchema = buildArticleSchema(guide);
  const breadcrumbSchema = buildBreadcrumbSchema(guide);
  const related = getRelatedGuides(guide.slug);

  return (
    <div className="guide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}

      <nav className="guide-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/guides">Guides</a>
        <span aria-hidden="true">/</span>
        <span>{guide.title}</span>
      </nav>

      <div className="guide-hero">
        <BrandBolt sm />
        <h1>{guide.title}</h1>
      </div>
      <p className="guide-intro">{guide.intro}</p>

      <div className="guide-body">
        {guide.body?.map((section, i) => (
          <div className="guide-section" key={i}>
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((paragraph, j) => (
              <p key={j}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>

      {guide.faq && guide.faq.length > 0 && (
        <div className="guide-faq">
          <h2>Frequently asked questions</h2>
          <div className="faq-list">
            {guide.faq.map((qa, i) => (
              <div className="faq-item" key={i}>
                <h3>{qa.question}</h3>
                <p>{qa.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {guide.pillar_page && (
        <p className="guide-related">
          Related guide:{' '}
          <a href={guide.pillar_page}>{guide.pillar_page_anchor_text || guide.pillar_page}</a>
        </p>
      )}

      {/* Related guides (topical cluster + universal fallback) — keeps every
          page linked into a crawlable, topically-connected graph. */}
      {related.length > 0 && (
        <nav className="guide-crosslinks" aria-label="Related guides">
          <span className="guide-crosslinks-label">Related guides:</span>
          {related.map((r) => (
            <a key={r.slug} href={`/guides/${r.slug}`}>{r.title}</a>
          ))}
        </nav>
      )}

      {/* Help Hub + core help articles, linked from every guide */}
      <nav className="guide-crosslinks" aria-label="Related help">
        <span className="guide-crosslinks-label">More help:</span>
        <a href="/help">Help Hub</a>
        <a href="/guides/how-to-contact-vinted-support">Contact Vinted</a>
        <a href="/guides/vinted-delivery-issues-troubleshooting">Delivery issues</a>
        <a href="/guides/vinted-scams-buyer-protection">Scams &amp; buyer protection</a>
      </nav>

      {guide.cta_href && (
        <div className="guide-cta">
          <a href={guide.cta_href} className="btn btn-primary btn-lg">
            {guide.cta_text || 'Get Supervint free'}
          </a>
        </div>
      )}
    </div>
  );
}
