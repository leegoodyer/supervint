import { getAllGuides } from '@/lib/guides';

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
      <h1>Guides</h1>
      <p className="guide-intro">Practical guides on sniping Vinted listings safely and getting the most out of Supervint.</p>
      <ul className="guide-index-list">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <a href={`/guides/${guide.slug}`}>{guide.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
