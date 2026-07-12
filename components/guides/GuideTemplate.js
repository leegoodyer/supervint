import { buildArticleSchema, buildFaqSchema } from '@/lib/guides';
import BrandBolt from '@/components/BrandBolt';

export default function GuideTemplate({ guide }) {
  const faqSchema = buildFaqSchema(guide);
  const articleSchema = buildArticleSchema(guide);

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
