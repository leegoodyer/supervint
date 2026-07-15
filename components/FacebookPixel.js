'use client';

import { useEffect } from 'react';

export default function FacebookPixel() {
  useEffect(() => {
    // Load Meta Pixel — fires reliably on every page view
    const script = document.createElement('script');
    script.innerHTML = `
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
    `;
    script.id = 'fb-pixel';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return null;
}
