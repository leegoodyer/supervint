import { getAllGuides } from '@/lib/guides';
import BrandBolt from '@/components/BrandBolt';

export const metadata = {
  title: 'Guides — Supervint',
  description: 'Guides on sniping Vinted listings safely and getting the most out of Supervint.',
  alternates: {
    canonical: '/guides',
  },
};

export default function GuidesIndex() {
  const guides = getAllGuides();

  return (
    <div className="guide">
      <div className="guides-hero">
        <BrandBolt />
        <h1>Guides</h1>
        <p className="guide-intro">Practical guides on sniping Vinted listings safely and getting the most out of Supervint.</p>
      </div>
      <div className="guide-card-grid">
        {guides.map((guide) => (
          <a key={guide.slug} href={`/guides/${guide.slug}`} className="guide-card">
            <h2>{guide.title}</h2>
            <p>{guide.meta_description || guide.intro}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
