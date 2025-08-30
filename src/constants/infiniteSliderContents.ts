export const mainYooniImages = [
  '/images/main_yooni/main_yooni_1.png',
  '/images/main_yooni/main_yooni_2.png',
  '/images/main_yooni/main_yooni_3.png',
  '/images/main_yooni/main_yooni_4.png',
  '/images/main_yooni/main_yooni_5.png',
  '/images/main_yooni/main_yooni_6.png',
  '/images/main_yooni/main_yooni_7.png',
  '/images/main_yooni/main_yooni_8.png',
];

export const mainYooniMessages = [
  'Next.js로 만든 유니 블로그에 오신 것을 환영합니다! 👋',
  '여행, 생각, 개발, 커리어 모든 고민을 적고 있어요 ✍️',
  '함께 일하고 싶은 분들은 언제든지 연락주세요 📩',
  '맥주와 위스키를 좋아해요 🍺🥃',
  '사진과 영상 촬영을 즐깁니다 📸',
  '올해 여름 치앙마이에서 40일 살기를 하고 왔어요 🇹🇭',
  '프론트엔드 개발자로서 성장하는 여정을 함께해요 🚀',
  '굴곡진 우상향 그래프처럼 살고 싶어요 📈',
  '가장 좋아하는 여행지는 대만이에요 🇹🇼',
  '구글 계정으로 로그인하고 다양한 댓글을 남겨주세요! 😊',
  '요가의 즐거움을 알아가고 있는 중입니다 🧘‍♀️',
  'You are my soda pop, My little soda pop 🍹',
];

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}