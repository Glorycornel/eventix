import { Fraunces, Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';
import { Preloader } from '../components/Preloader';
import { AuthProvider } from '../components/AuthProvider';
import { AuthModalProvider } from '../components/AuthModalProvider';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

const body = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Eventix',
  description: 'Event booking and ticketing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-neutral-950 text-neutral-100">
        <AuthProvider>
          <AuthModalProvider>
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
