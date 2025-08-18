import type { Metadata } from 'next';
import 'highlight.js/styles/agate.min.css';
import './globals.css';

import AuthProvider from '@/lib/AuthProvider';
import { NavBar } from '@/components/NavBar';
import { QueryProvider } from '@/lib/QueryProvider';
import InfiniteSlider from '@/components/InfiniteSlider';
import { mainYooniMessages } from '@/constants/infiniteSliderContents';
import GlobalLoading from '@/components/Loading/GlobalLoading';
import { metaDataKeywords } from '@/constants/metadataKeywords';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: '유니 블로그',
  description: '프론트엔드 개발자 유니의 기록을 담은 공간',
  keywords: metaDataKeywords,
  openGraph: {
    title: '유니 블로그',
    description: '프론트엔드 개발자 유니의 기록을 담은 공간',
    type: 'website',
    url: 'https://yooni.seoul.kr',
    siteName: '유니 블로그',
    locale: 'ko_KR',
    images: [
      'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_2.png'
    ]
  },
  twitter: {
    title: '유니 블로그',
    description: '프론트엔드 개발자 유니의 기록을 담은 공간',
    card: 'summary_large_image',
    images: [
      'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_2.png'
    ]
  },
  alternates: {
    canonical: 'https://yooni.seoul.kr'
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'noarchive': false,
    },
  },
  other: {
    'google-site-verification': '5W1hOcpX-1XPgPg4aa6h6QyycCMe5tJLiLDK74p9neg',
    'naver-site-verification': 'e6ab26b3426fdd33652a11e3560de0076b23356d'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr">
      <body className="flex min-h-screen flex-col">
        <QueryProvider>
          <GlobalLoading />
          <AuthProvider>
            <header>
              <div data-nosnippet aria-hidden="true">
                <InfiniteSlider
                  direction="left"
                  backgroundColorClass="bg-black"
                  speed={0.58}
                  repeat={20}>
                  {mainYooniMessages.map((message, idx) => (
                    <div
                      key={idx}
                      className="my-[1px] mr-2 whitespace-nowrap text-center text-sm font-semibold text-white">
                      {message}
                    </div>
                  ))}
                </InfiniteSlider>
              </div>
              <NavBar />
            </header>
            <main className="flex-grow p-8 max-sm:p-0">{children}</main>
            <Footer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
