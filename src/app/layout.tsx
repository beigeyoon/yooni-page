import type { Metadata } from 'next';
import 'highlight.js/styles/agate.min.css';
import './globals.css';
import AuthProvider from '@/lib/AuthProvider';
import { NavBar } from '@/components/NavBar';
import { QueryProvider } from '@/lib/QueryProvider';
import InfiniteSlider from '@/components/InfiniteSlider';
import { mainYooniMessages } from '@/constants/infiniteSliderContents';
import GlobalLoading from '@/components/Loading/GlobalLoading';

export const metadata: Metadata = {
  title: '유니 블로그',
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
    title: '유니 블로그',
    description: '프론트엔드 개발자 유니의 기록을 담은 공간',
    type: 'website',
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
      <body>
        <QueryProvider>
          <GlobalLoading />
          <AuthProvider>
            <InfiniteSlider
              direction="left"
              backgroundColorClass="bg-black"
              speed={0.58}
              repeat={20}>
              {mainYooniMessages.map((message, idx) => (
                <div
                  key={idx}
                  className="my-[1px] mr-2 text-center text-sm font-semibold text-white">
                  {message}
                </div>
              ))}
            </InfiniteSlider>
            <NavBar />
            <div className="p-8 max-sm:p-0">{children}</div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
