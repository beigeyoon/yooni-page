import type { Metadata } from 'next';
import 'highlight.js/styles/agate.min.css';
import './globals.css';
import AuthProvider from '@/lib/AuthProvider';
import { NavBar } from '@/components/NavBar';
import { QueryProvider } from '@/lib/QueryProvider';

export const metadata: Metadata = {
  title: 'Yooni Page',
  description: '프론트엔드 개발자 유니의 기록을 담은 공간',
  keywords: [
    '프론트엔드',
    '프론트엔드 개발자',
    'Next.js',
    '웹 개발',
    '기술 블로그',
    '개발 블로그',
    '포트폴리오',
    '유니',
    'yooni',
    '프론트엔드 포트폴리오',
    '여행 블로그',
    '여행',
    '생각',
    '글쓰기',
    '이야기',
    '커리어',
    '유니 블로그',
    '개발자 블로그',
    '포트폴리오 블로그'
  ],
  openGraph: {
    title: 'Yooni Page',
    description: '프론트엔드 개발자 유니의 기록을 담은 공간',
    type: 'website',
    images: [
      'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_2.png'
    ]
  },
  twitter: {
    title: 'Yooni Page',
    description: '프론트엔드 개발자 유니의 기록을 담은 공간',
    card: 'summary_large_image',
    images: [
      'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_2.png'
    ]
  },
  other: {
    'google-site-verification': '5W1hOcpX-1XPgPg4aa6h6QyycCMe5tJLiLDK74p9neg'
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
