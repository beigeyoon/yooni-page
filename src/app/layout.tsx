import type { Metadata } from 'next';
import 'highlight.js/styles/agate.min.css';
import './globals.css';
import AuthProvider from '@/lib/AuthProvider';
import { NavBar } from '@/components/NavBar';
import { QueryProvider } from '@/lib/QueryProvider';

export const metadata: Metadata = {
  title: 'Yooni Page',
  description: '프론트엔드 개발자 유니의 기록을 담은 공간',
  openGraph: {
    title: 'Yooni Page',
    description: '프론트엔드 개발자 유니의 기록을 담은 공간'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr">
      <body>
        <QueryProvider>
          <AuthProvider>
            <NavBar />
            <div className="p-8 max-sm:p-0">{children}</div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
