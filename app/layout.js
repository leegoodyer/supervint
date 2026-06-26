import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Supervint — The Vinted Product Sniper & Price Alert',
  description: 'Supervint monitors your Vinted searches around the clock and alerts you the instant a new listing matches. Spot it first — snipe it before anyone else does.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
