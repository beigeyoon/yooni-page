import { PROFILE, ABOUT_CONTENT } from '@/constants/about';
import ItemCard from '@/components/ItemCard';
import Image from 'next/image';
import { Copy } from 'lucide-react';
import CopyButton from '@/components/CopyButton';
import type { Metadata } from 'next';

const SITE_URL = 'https://yooni.seoul.kr';
const ABOUT_URL = `${SITE_URL}/about`;
const OG_IMAGE =
  'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png';

export const metadata: Metadata = {
  title: '소개 | 유니의 블로그',
  description:
    '프론트엔드 개발자 유니(Yooni)의 소개 페이지입니다. 경력, 기술 스택, 학력 정보를 확인하세요.',
  keywords:
    '유니, yooni, Yooni, 프론트엔드 개발자, 프로필, 이력, 경력, React, Next.js',
  authors: [{ name: '유니' }],
  openGraph: {
    title: '소개 | 유니의 블로그',
    description:
      '프론트엔드 개발자 유니(Yooni)의 소개 페이지입니다. 경력, 기술 스택, 학력 정보를 확인하세요.',
    type: 'profile',
    url: ABOUT_URL,
    siteName: '유니의 블로그',
    locale: 'ko_KR',
    images: [
      { url: OG_IMAGE, width: 1200, height: 630, alt: '유니의 블로그 소개' }
    ]
  },
  twitter: {
    title: '소개 | 유니의 블로그',
    description: '프론트엔드 개발자 유니(Yooni)의 소개 페이지입니다.',
    card: 'summary_large_image',
    images: [OG_IMAGE]
  },
  alternates: { canonical: ABOUT_URL }
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Yoon Yeokyung',
  alternateName: ['yooni', '유니', 'Yooni', 'yeokyung'],
  jobTitle: 'Frontend Developer',
  url: ABOUT_URL,
  image: OG_IMAGE,
  email: 'mailto:beige.yoon@gmail.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Seoul',
    addressCountry: 'KR'
  },
  knowsAbout: [
    'Frontend Development',
    'Next.js',
    'React',
    'TypeScript',
    'TailwindCSS'
  ],
  worksFor: { '@type': 'Organization', name: 'MARKNCOMPANY' }
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: '소개', item: ABOUT_URL }
  ]
};

export default function About() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c')
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c')
        }}
      />
      <div className="flex flex-row-reverse justify-center gap-16 pb-10 max-sm:flex-col-reverse max-sm:p-6">
        <div className="flex flex-col gap-8">
          {ABOUT_CONTENT.map((item, idx) => (
            <ItemCard
              key={idx}
              content={item}
            />
          ))}
        </div>
        <div className="flex flex-col items-center">
          <Image
            src="/images/yooni_chiangmai.webp"
            alt="yooni-profile-image"
            width={280}
            height={280}
            className="mb-8 rounded-full grayscale hover:grayscale-0"
          />
          {PROFILE.map(item => (
            <div
              key={item.name}
              className={`text-center text-neutral-600 ${item.name === 'name' ? 'pb-2 text-lg font-bold' : 'text-sm'}`}>
              {item.name === 'email' ? (
                <CopyButton
                  trigger={
                    <div className="mx-auto flex cursor-pointer items-center gap-1 pt-2 font-semibold underline">
                      {item.value}
                      <Copy size={14} />
                    </div>
                  }
                  textToCopy={item.value}
                />
              ) : (
                item.value
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
