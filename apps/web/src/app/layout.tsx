import { Fraunces, Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display'
});

const body = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body'
});

export const metadata = {
  title: 'Eventix',
  description: 'Event booking and ticketing'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-neutral-950 text-neutral-100">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),_transparent_40%)]">
          {children}
        </div>
      </body>
    </html>
  );
}
