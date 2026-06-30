import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Supervint — The Vinted Product Sniper & Price Alert',
  description: 'Supervint monitors your Vinted searches around the clock and alerts you the instant a new listing matches. Spot it first — snipe it before anyone else does.',
  openGraph: {
    title: 'Supervint — The Vinted Product Sniper & Price Alert',
    description: 'Supervint monitors your Vinted searches around the clock and alerts you the instant a new listing matches. Spot it first — snipe it before anyone else does.',
    url: 'https://supervint.com',
    type: 'website',
    images: [{ url: 'https://supervint.com/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Supervint — The Vinted Product Sniper & Price Alert',
    description: 'Real-time Vinted alerts for resellers and collectors. Never miss a drop again.',
    images: ['https://supervint.com/og-image.png'],
  },
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Supervint',
  operatingSystem: 'Chrome',
  applicationCategory: 'UtilitiesApplication',
  description: 'Supervint monitors your Vinted searches around the clock and alerts you the instant a new listing matches. Real-time Vinted alerts for resellers, flippers and collectors.',
  url: 'https://supervint.com',
  downloadUrl: 'https://chromewebstore.google.com/detail/supervint/aaogigmdemlphihidefipnckmmpoakpo',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'GBP' },
    { '@type': 'Offer', name: 'Reseller', price: '6.99', priceCurrency: 'GBP', billingIncrement: 'P1M' },
    { '@type': 'Offer', name: 'Power Seller', price: '13.99', priceCurrency: 'GBP', billingIncrement: 'P1M' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
