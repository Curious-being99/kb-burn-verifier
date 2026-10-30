import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '$KB Burn Verifier | Kaspa Browser',
  description: 'Public, source-linked reporting of verified $KB burn activity on Kaspa.',
  metadataBase: new URL('https://kb-burn-verifier.vercel.app'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
