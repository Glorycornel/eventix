'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const messages = [
  'CREATE. BOOK. ATTEND.',
  'Events, Simplified. Secure',
  'Smarter Event Booking',
  'Events Without Friction',
];

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleLoad = () => setVisible(false);
    const fallback = setTimeout(handleLoad, 2000);
    window.addEventListener('load', handleLoad);

    setMessage(messages[0]);

    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 1500);

    return () => {
      clearTimeout(fallback);
      clearInterval(interval);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="preloader-overlay fixed inset-0 z-[999] flex items-center justify-center bg-neutral-950/90 backdrop-blur-2xl">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span className="preloader-glow absolute inset-0 rounded-full bg-teal-400/30" />
          <span className="preloader-orb absolute inset-0 rounded-full border border-white/20" />
          <Image
            src="/images/eventix_logo.png"
            width={280}
            height={75}
            alt="Eventix"
            className="relative h-20 w-auto object-contain"
          />
        </div>
        <p className="text-xs uppercase tracking-[0.6em] text-white/70">{message ?? 'Loading'}</p>
      </div>
    </div>
  );
}
