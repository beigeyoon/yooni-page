export const PROFILE: { name: string, value: string }[] = [
  { name: 'name', value: 'Yoon Yeokyung' },
  { name: 'job', value: 'Frontend Developer' },
  { name: 'sideJob', value: 'Amateur photographer' },
  { name: 'wannaBe', value: 'Traveler' },
  { name: 'city', value: 'Seoul, Korea' },
  { name: 'email', value: 'beige.yoon@gmail.com' },
];

export const ABOUT_CONTENT: Array<{
  title: string;
  desc: string[] | string[][];
}> = [
  {
    title: 'Personality',
    desc: [
      '스스로에 대한 믿음을 기반으로 한 도전의 반복',
      '도전에 대한 철저한 책임감',
      '다양한 창구를 적극적으로 활용하는 소통 스킬',
      '중요한 디테일을 찾아내는 꼼꼼함',
      '사진, 여행, 커피, 영화, 하이볼',
    ],
  },
  {
    title: 'Skills',
    desc: [
      'HTML / CSS / Javascript / Typescript',
      'React / React-native / Redux',
      'Next.js',
      'Angular.js',
      'Tanstack-query',
      'SQL / GraphQL / Prisma',
      'Git / Github',
      'Figma',
      'Photoshop / Premiere',
    ],
  },
  {
    title: 'Work Experiences',
    desc: [
      [ 'STIBEE', '2022. 08 ~ 2024. 12' ],
      [ 'KUUS', '2021. 01 ~ 2021. 12' ],
      [ 'HYUNDAI MOTORS', '2024. 01 ~ 2019. 03' ],
    ],
  },
  {
    title: 'Education',
    desc: [
      [ 'CODESTATES', 'Blockchain Engineering Bootcamp 3기 수료' ],
      [ '상명대학교', '사진영상콘텐츠학과 중퇴' ],
      [ '성균관대학교', '시스템경영공학과 졸업' ],
      [ '삼성SDS', '동계 인턴십 프로그램 수료' ],
    ],
  },
];