import { Inter } from 'next/font/google';
import './globals.css';
import FacebookPixel from '@/components/FacebookPixel';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://supervint.com'),
  title: 'Vinted Price Alerts & Sniper Tool — Free Chrome Extension | Supervint',
  description: 'Get instant Vinted alerts the moment a matching listing goes live — no auto-buy, no ban risk. Free Chrome extension.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Vinted Price Alerts & Sniper Tool — Free Chrome Extension | Supervint',
    description: 'Get instant Vinted alerts the moment a matching listing goes live — no auto-buy, no ban risk. Free Chrome extension.',
    url: 'https://supervint.com',
    type: 'website',
    images: [{ url: 'https://supervint.com/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vinted Price Alerts & Sniper Tool — Free Chrome Extension | Supervint',
    description: 'Get instant Vinted alerts the moment a matching listing goes live — no auto-buy, no ban risk. Free Chrome extension.',
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
      <body>
        {children}
        <FacebookPixel />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=999947926124403&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
