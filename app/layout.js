import { Inter } from 'next/font/google';
import Script from 'next/script';
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
      <body>
        {children}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '999947926124403');
              fbq('track', 'PageView');
            `,
          }}
        />
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
