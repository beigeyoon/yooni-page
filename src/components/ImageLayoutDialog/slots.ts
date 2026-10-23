// 배치 창의 칸 배열을 다루는 순수 함수들. 빈 칸은 null이다.

export type Slots<T> = (T | null)[];

export function resizeSlots<T>(slots: Slots<T>, count: number): Slots<T> {
  return Array.from({ length: count }, (_, i) => slots[i] ?? null);
}

// 드롭한 칸은 차 있어도 덮어쓰고, 나머지 항목은 그 뒤의 빈 칸에 순서대로 채운다.
export function placeItems<T>(slots: Slots<T>, startIndex: number, items: T[]): Slots<T> {
  const next = [...slots];
  let itemIndex = 0;
  for (let i = startIndex; i < next.length && itemIndex < items.length; i++) {
    if (i === startIndex || next[i] === null) next[i] = items[itemIndex++];
  }
  return next;
}

export function swapSlots<T>(slots: Slots<T>, from: number, to: number): Slots<T> {
  const next = [...slots];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

// 브라우저에 따라 HEIC의 MIME 타입이 비어 있어 확장자도 본다.
export function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.hei[cf]$/i.test(file.name);
}
