// 에디터 이미지 묶음의 레이아웃 목록. 실제 칸 배치는 globals.css의 [data-layout] 규칙이 맡는다.
// 여기에 레이아웃을 추가하면 globals.css에도 같은 id의 규칙을 넣어야 한다(테스트가 확인한다).

export type CellRatio = 'original' | 'square' | 'landscape' | 'portrait';
export type LayoutCount = 1 | 2 | 3 | 4;

export type ImageLayout = {
  id: string;
  count: LayoutCount;
  label: string;
  cells: CellRatio[];
  // 묶음 전체의 가로/세로 비율. globals.css의 aspect-ratio와 같아야 한다(테스트가 확인한다).
  // 1-a는 원본 비율이라 CSS 값이 없고, 썸네일에서만 4:3으로 쓴다.
  ratio: number;
};

export const LAYOUT_COUNTS: LayoutCount[] = [1, 2, 3, 4];

const S = 'square';
const L = 'landscape';
const P = 'portrait';

export const IMAGE_LAYOUTS: ImageLayout[] = [
  {
    id: '1-a',
    count: 1,
    label: '원본 비율',
    cells: ['original'],
    ratio: 4 / 3
  },
  { id: '2-a', count: 2, label: '정방형 나란히', cells: [S, S], ratio: 2 },
  { id: '2-b', count: 2, label: '세로형 나란히', cells: [P, P], ratio: 3 / 2 },
  { id: '2-d', count: 2, label: '가로형 나란히', cells: [L, L], ratio: 8 / 3 },
  { id: '2-c', count: 2, label: '가로형 위아래', cells: [L, L], ratio: 2 / 3 },
  { id: '3-a', count: 3, label: '정방형 3열', cells: [S, S, S], ratio: 3 },
  { id: '3-b', count: 3, label: '세로형 3열', cells: [P, P, P], ratio: 9 / 4 },
  {
    id: '3-c',
    count: 3,
    label: '세로1 + 가로2',
    cells: [P, L, L],
    ratio: 17 / 12
  },
  {
    id: '3-d',
    count: 3,
    label: '가로2 + 세로1',
    cells: [L, L, P],
    ratio: 17 / 12
  },
  {
    id: '3-e',
    count: 3,
    label: '위 가로1 + 아래 정방형2',
    cells: [L, S, S],
    ratio: 4 / 5
  },
  { id: '4-a', count: 4, label: '정방형 2×2', cells: [S, S, S, S], ratio: 1 },
  {
    id: '4-f',
    count: 4,
    label: '가로형 2×2',
    cells: [L, L, L, L],
    ratio: 4 / 3
  },
  { id: '4-b', count: 4, label: '정방형 4열', cells: [S, S, S, S], ratio: 4 },
  {
    id: '4-c',
    count: 4,
    label: '위 가로1 + 아래 정방형3',
    cells: [L, S, S, S],
    ratio: 12 / 13
  },
  {
    id: '4-d',
    count: 4,
    label: '세로1 + 가로3',
    cells: [P, L, L, L],
    ratio: 43 / 36
  },
  { id: '4-e', count: 4, label: '세로형 4열', cells: [P, P, P, P], ratio: 3 }
];

export function getLayoutsByCount(count: LayoutCount) {
  return IMAGE_LAYOUTS.filter(layout => layout.count === count);
}

export function getLayout(id: string) {
  return IMAGE_LAYOUTS.find(layout => layout.id === id);
}
