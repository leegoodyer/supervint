import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    const guideRedirects = [
      ['/guides/vinted-adidas-trainers-alert', '/guides/adidas-on-vinted'],
      ['/guides/vinted-alerts-arcteryx', '/guides/arcteryx-on-vinted'],
      ['/guides/vinted-alerts-barbour', '/guides/barbour-on-vinted'],
      ['/guides/vinted-alerts-carhartt-workwear', '/guides/carhartt-on-vinted'],
      ['/guides/vinted-alerts-designer-bags', '/guides/designer-bags-on-vinted'],
      ['/guides/vinted-alerts-dr-martens', '/guides/dr-martens-on-vinted'],
      ['/guides/vinted-alerts-football-shirts', '/guides/football-shirts-on-vinted'],
      ['/guides/vinted-alerts-childrens-clothing', '/guides/kids-clothes-on-vinted'],
      ['/guides/vinted-alerts-levis-denim', '/guides/levis-on-vinted'],
      ['/guides/vinted-alerts-nike-trainers', '/guides/nike-on-vinted'],
      ['/guides/vinted-alerts-north-face', '/guides/north-face-on-vinted'],
      ['/guides/vinted-alerts-patagonia', '/guides/patagonia-on-vinted'],
      ['/guides/vinted-alerts-for-resellers', '/guides/reselling-on-vinted'],
      ['/guides/vinted-alerts-retro-gaming', '/guides/retro-games-on-vinted'],
      ['/guides/vinted-alerts-stone-island', '/guides/stone-island-on-vinted'],
      ['/guides/vinted-alerts-vintage-denim', '/guides/vintage-denim-on-vinted'],
      ['/guides/vinted-alerts-without-the-ban-risk', '/guides/vinted-ban-risk'],
      ['/guides/vinted-vs-depop-alerts', '/guides/vinted-vs-depop'],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));

    return [
      ...guideRedirects,
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.supervint.com' }],
        destination: 'https://supervint.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
