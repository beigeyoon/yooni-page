// 에디터 이미지 묶음의 레이아웃 목록. 실제 칸 배치는 globals.css의 [data-layout] 규칙이 맡는다.
// 여기에 레이아웃을 추가하면 globals.css에도 같은 id의 규칙을 넣어야 한다(테스트가 확인한다).

export type CellRatio = 'original' | 'square' | 'landscape' | 'portrait';
export type LayoutCount = 1 | 2 | 3 | 4;

export type ImageLayout = {
  id: string;
  count: LayoutCount;
  label: string;
  cells: CellRatio[];
};

export const LAYOUT_COUNTS: LayoutCount[] = [1, 2, 3, 4];

const S = 'square';
const L = 'landscape';
const P = 'portrait';

export const IMAGE_LAYOUTS: ImageLayout[] = [
  { id: '1-a', count: 1, label: '원본 비율', cells: ['original'] },
  { id: '2-a', count: 2, label: '정방형 나란히', cells: [S, S] },
  { id: '2-b', count: 2, label: '세로형 나란히', cells: [P, P] },
  { id: '2-c', count: 2, label: '가로형 위아래', cells: [L, L] },
  { id: '3-a', count: 3, label: '정방형 3열', cells: [S, S, S] },
  { id: '3-b', count: 3, label: '세로형 3열', cells: [P, P, P] },
  { id: '3-c', count: 3, label: '세로1 + 가로2', cells: [P, L, L] },
  { id: '3-d', count: 3, label: '가로2 + 세로1', cells: [L, L, P] },
  { id: '3-e', count: 3, label: '위 가로1 + 아래 정방형2', cells: [L, S, S] },
  { id: '4-a', count: 4, label: '정방형 2×2', cells: [S, S, S, S] },
  { id: '4-b', count: 4, label: '정방형 4열', cells: [S, S, S, S] },
  { id: '4-c', count: 4, label: '위 가로1 + 아래 정방형3', cells: [L, S, S, S] },
  { id: '4-d', count: 4, label: '세로1 + 가로3', cells: [P, L, L, L] },
  { id: '4-e', count: 4, label: '세로형 4열', cells: [P, P, P, P] }
];

export function getLayoutsByCount(count: LayoutCount) {
  return IMAGE_LAYOUTS.filter(layout => layout.count === count);
}

export function getLayout(id: string) {
  return IMAGE_LAYOUTS.find(layout => layout.id === id);
}
