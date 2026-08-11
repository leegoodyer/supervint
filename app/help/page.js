import { getAllGuides } from '@/lib/guides';
import HelpHubClient from '@/components/HelpHubClient';
import BrandBolt from '@/components/BrandBolt';

export const metadata = {
  title: 'Help Hub — Supervint',
  description: 'Help with Vinted: contact Vinted support, delivery troubleshooting, scams & buyer protection, plus every Supervint guide in one searchable place.',
  alternates: {
    canonical: '/help',
  },
};

export default function HelpPage() {
  const guides = getAllGuides();

  // Dedicated deep-dive articles (each ranks for its own keyword)
  const deepDives = [
    {
      slug: 'how-to-contact-vinted-support',
      ico: '✉️',
      title: 'How to contact Vinted support',
      desc: 'Phone, email, response times and what actually works — the full guide.',
    },
    {
      slug: 'vinted-delivery-issues-troubleshooting',
      ico: '📦',
      title: 'Delivery troubleshooting',
      desc: 'Parcel not arrived, lost or stuck — and the 2-day reporting window explained.',
    },
    {
      slug: 'vinted-scams-buyer-protection',
      ico: '🛡️',
      title: 'Scams & buyer protection',
      desc: 'Spot the scam patterns, report them, and get your money back.',
    },
  ];

  return (
    <div className="help-hub">
      <div className="guides-hero">
        <BrandBolt />
        <h1>Help Hub</h1>
        <p className="guide-intro">
          Everything for buying and selling on Vinted — contacting support, fixing delivery problems,
          spotting scams, and getting instant alerts on the items you want.
        </p>
      </div>

      <HelpHubClient guides={guides} deepDives={deepDives} />

      <section className="help-section">
        <h2>Follow Supervint</h2>
        <p>
          Tips, alerts and Vinted news on our channels — plus quick answers to the questions
          buyers and sellers ask every day.
        </p>
        <div className="help-socials">
          <a href="https://www.facebook.com/supervintapp" target="_blank" rel="noopener noreferrer" className="help-social">
            <span className="help-topic-ico">📘</span>
            <strong>Facebook</strong>
            <span>@supervintapp</span>
          </a>
          <a href="https://www.youtube.com/@Supervintapp" target="_blank" rel="noopener noreferrer" className="help-social">
            <span className="help-topic-ico">▶️</span>
            <strong>YouTube</strong>
            <span>@Supervintapp</span>
          </a>
        </div>
      </section>
    </div>
  );
}
