export const PROJECTS_CONTENT: Array<{
  title: string;
  summary: string;
  imgHref: string;
  detail: {
    description: string[];
    links?: {
      title: string;
      src: string;
    }[];
  };
}> = [
  {
    title: 'Yooti',
    summary: '시간 기반 아이템 통합 관리 캘린더 앱',
    imgHref: '/images/yooti-app.png',
    detail: {
      description: [
        '할일/이벤트/루틴/기념일/기간/마감일 통합 관리',
        'TestFlight 베타 테스트 중',
        '2026 애플 앱스토어 출시 예정',
        'React-native, Expo, Swift, Typescript',
      ],
      links: [
        {
          title: '웹버전 공유용 배포 링크',
          src: 'https://gorgeous-monstera-ba69a1.netlify.app',
        },
        {
          title: 'Github 레포지토리 링크',
          src: 'https://github.com/beigeyoon/yooni-page',
        },
      ],
    },
  },
  {
    title: 'Personal Blog',
    summary: '포트폴리오 및 개인 기록물 관리를 위한 블로그',
    imgHref: '/images/blog.png',
    detail: {
      description: [
        'Next.js, Typescript, TailwindCSS, Prisam, Supabase, Tiptap',
      ],
      links: [
        {
          title: 'Github 레포지토리 링크',
          src: 'https://github.com/beigeyoon/yooni-page',
        },
      ],
    },
  },
  {
    title: 'Wedding Invitation',
    summary: '셀프 모바일 청첩장',
    imgHref: '/images/wedding.png',
    detail: {
      description: [
        '실제 사용을 위해 제작',
        'React, Vite, Typescript, TailwindCSS',
      ],
      links: [
        {
          title: '배포 링크',
          src: 'https://wedding-heetaku-yooni.vercel.app',
        },
        {
          title: 'Github 레포지토리 링크',
          src: 'https://github.com/beigeyoon/wedding-letter',
        },
      ],
    },
  },
  {
    title: 'Korean Typing Exercise',
    summary: '한글 타자 연습 웹사이트',
    imgHref: '/images/typing.png',
    detail: {
      description: [
        '[짧은 글 연습] 구현 완료, 메뉴 추가 예정',
        'React, Vite, Typescript, TailwindCSS',
      ],
      links: [
        {
          title: '배포 링크',
          src: 'https://yooni-typing.vercel.app',
        },
        {
          title: 'Github 레포지토리 링크',
          src: 'https://github.com/beigeyoon/typing-exercise',
        },
      ],
    },
  },
  {
    title: 'Apple Reminder clone-coding',
    summary: '애플 제공 어플리케이션 미리 알림(reminder)의 클론 코딩',
    imgHref: '/images/reminder.png',
    detail: {
      description: [
        '사용하지 않는 기능 제거, 니즈를 느끼던 캘린더뷰 추가',
        'Next.js, Typescript, TailwindCSS, Zustand, React-query, Prisma',
      ],
      links: [
        {
          title: '배포 링크',
          src: 'https://yooni-reminder.vercel.app',
        },
        {
          title: 'Github 레포지토리 링크',
          src: 'https://github.com/beigeyoon/reminder',
        },
      ],
    },
  },
  {
    title: 'M2E Application RETRIP',
    summary: '이동량을 추적하여 코인으로 보상하는 솔라나 기반 어플리케이션',
    imgHref: '/images/retrip.png',
    detail: {
      description: [
        '클라이언트 개발 및 어플케이션 UI/UX 기획 및 디자인',
        'React Native, Redux, Expo, Styled-components, GraphQL',
      ],
      links: [
        {
          title: '시연 영상 링크',
          src: 'https://drive.google.com/file/d/1hj6MEtlOXjUwQk7l-AUQtdN1797r8p2u/view?usp=sharing',
        },
        {
          title: '개발 회고 링크',
          src: 'https://literate-prawn-cb8.notion.site/RETRIP-916e7618f75145cba1f09871be444e39',
        },
        {
          title: '팀원 평가 링크',
          src: 'https://literate-prawn-cb8.notion.site/RETRIP-df0e6d9f7a1c4de4b10db6422e4cd4ce',
        },
      ],
    },
  },
  {
    title: 'Blockchain Community NGNG',
    summary: '활동에 따른 코인 보상 기반의 블록체인 커뮤니티 웹사이트',
    imgHref: '/images/ngng.png',
    detail: {
      description: [
        '클라이언트 개발 및 웹사이트 UI/UX 기획 및 디자인',
        'React, Redux, React-query, MUI',
      ],
      links: [
        {
          title: '개발 회고 링크',
          src: 'https://velog.io/@yooni/Project-NGNG-community',
        },
      ],
    },
  },
];
