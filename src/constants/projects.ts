export const PROJECTS_CONTENT: Array<{
  title: string;
  desc: string[] | string[][];
  links?: {
    title: string;
    src: string;
  }[];
  imgHref?: string;
}> = [
  {
    title: 'Wedding Invitation',
    desc: [
      '셀프 모바일 청첩장',
      '실제 사용을 위해 제작',
      'React, Vite, Typescript, TailwindCSS',
    ],
    links: [
      {
        title: '배포 링크',
        src: 'https://wedding-heetaku-yooni.vercel.app',
      }
    ],
    imgHref: '/images/wedding-invitation.png',
  },
  {
    title: 'Korean Typing Exercise',
    desc: [
      '한글 타자 연습 웹사이트',
      '[짧은 글 연습] 구현 완료, 메뉴 추가 예정',
      'React, Vite, Typescript, TailwindCSS',
    ],
    links: [
      {
        title: '배포 링크',
        src: 'https://yooni-typing.vercel.app',
      }
    ],
    imgHref: '/images/typing-exercise.png',
  },
  {
    title: 'Apple Reminder clone-coding',
    desc: [
      '애플 제공 어플리케이션 미리 알림(reminder)의 클론 코딩',
      '실제 주로 사용하는 앱으로, 사용하지 않는 기능은 제거하고 니즈를 느끼던 캘린더뷰 추가',
      'Next.js, Typescript, TailwindCSS, Prisma, Zustand, React-query',
    ],
    links: [
      {
        title: '배포 링크',
        src: 'https://yooni-reminder.vercel.app',
      }
    ],
    imgHref: '/images/reminder.png',
  },
  {
    title: 'M2E Application RETRIP',
    desc: [
      '이동량을 추적하여 코인으로 보상하는 솔라나 기반 어플리케이션',
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
      }
    ],
    imgHref: '/images/retrip.png',
  },
  {
    title: 'Blockchain Community NGNG',
    desc: [
      '활동에 따른 코인 보상 기반의 블록체인 커뮤니티 웹사이트',
      '클라이언트 개발 및 웹사이트 UI/UX 기획 및 디자인',
      'React, Redux, React-query, MUI',
    ],
    links: [
      {
        title: '개발 회고 링크',
        src: 'https://velog.io/@yooni/Project-NGNG-community',
      }
    ],
    imgHref: '/images/ngng.png',
  }
]