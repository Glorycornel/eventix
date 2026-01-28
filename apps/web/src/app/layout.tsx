import '../styles/globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
