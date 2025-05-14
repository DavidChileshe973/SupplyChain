import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SupplyFlow - Supply Chain Management',
  description: 'Modern supply chain management solution',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
