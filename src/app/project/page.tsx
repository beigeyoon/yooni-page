import { PROJECTS_CONTENT } from '@/constants/projects';
import ProjectCard from '@/components/ProjectCard';
import type { Metadata } from 'next';

const SITE_URL = 'https://yooni.seoul.kr';
const PROJECT_URL = `${SITE_URL}/project`;
const OG_IMAGE =
  'https://pkcsbguvrcjetmuabppk.supabase.co/storage/v1/object/public/images//main_yooni_3.png';

export const metadata: Metadata = {
  title: '프로젝트 | 유니의 블로그',
  description:
    '프론트엔드 개발자 유니가 진행한 사이드 프로젝트와 작업물을 모아둔 페이지입니다.',
  keywords:
    '프론트엔드 프로젝트, 사이드 프로젝트, 포트폴리오, Next.js 프로젝트, React 프로젝트, 유니, Yooni, yooni',
  authors: [{ name: '유니' }],
  openGraph: {
    title: '프로젝트 | 유니의 블로그',
    description:
      '프론트엔드 개발자 유니가 진행한 사이드 프로젝트와 작업물을 모아둔 페이지입니다.',
    type: 'website',
    url: PROJECT_URL,
    siteName: '유니의 블로그',
    locale: 'ko_KR',
    images: [
      { url: OG_IMAGE, width: 1200, height: 630, alt: '유니의 블로그 프로젝트' }
    ]
  },
  twitter: {
    title: '프로젝트 | 유니의 블로그',
    description:
      '프론트엔드 개발자 유니가 진행한 사이드 프로젝트와 작업물을 모아둔 페이지입니다.',
    card: 'summary_large_image',
    images: [OG_IMAGE]
  },
  alternates: { canonical: PROJECT_URL }
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: '프로젝트', item: PROJECT_URL }
  ]
};

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: '유니의 프로젝트',
  itemListElement: PROJECTS_CONTENT.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.title,
    description: p.summary
  }))
};

export default function Projects() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c')
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, '\\u003c')
        }}
      />
      <div className="mx-auto mt-8 grid max-w-[780px] grid-cols-2 gap-8 pb-12 max-sm:flex max-sm:flex-col max-sm:p-6">
        {PROJECTS_CONTENT.map((item, idx) => (
          <ProjectCard
            key={idx}
            content={item}
          />
        ))}
      </div>
    </>
  );
}
