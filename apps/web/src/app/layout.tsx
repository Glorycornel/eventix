import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Preloader } from '../components/Preloader';
import { AuthProvider } from '../components/AuthProvider';
import { AuthModalProvider } from '../components/AuthModalProvider';
import { PwaRegister } from '../components/PwaRegister';

export const metadata: Metadata = {
  title: 'Eventix',
  description: 'Event booking and ticketing',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/images/eventix_logo.png',
    apple: '/images/eventix_logo.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Eventix',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={
        {
          '--font-display': "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
          '--font-body': "'Trebuchet MS', 'Segoe UI', Tahoma, sans-serif",
        } as React.CSSProperties
      }
    >
      <body className="bg-neutral-950 text-neutral-100">
        <AuthProvider>
          <AuthModalProvider>
            <PwaRegister />
            <Preloader />
            <div
              className="relative min-h-screen"
              style={{
                backgroundImage: "url('/images/eventix_background.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
              }}
            >
              <div className="absolute inset-0 bg-neutral-950/70" />
              <div className="relative z-10">{children}</div>
            </div>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
