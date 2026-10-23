import { describe, expect, it } from 'vitest';
import { isImageFile, placeItems, resizeSlots, swapSlots } from './slots';

describe('resizeSlots', () => {
  it('늘리면 빈 칸을 붙인다', () => {
    expect(resizeSlots(['a'], 3)).toEqual(['a', null, null]);
  });

  it('줄이면 앞에서부터 남긴다', () => {
    expect(resizeSlots(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });
});

describe('placeItems', () => {
  it('드롭한 칸부터 빈 칸에 차례로 채운다', () => {
    expect(placeItems([null, null, null], 0, ['a', 'b'])).toEqual([
      'a',
      'b',
      null
    ]);
  });

  it('드롭한 칸은 차 있어도 덮어쓰고, 뒤의 찬 칸은 건너뛴다', () => {
    expect(placeItems(['x', 'y', null], 0, ['a', 'b'])).toEqual([
      'a',
      'y',
      'b'
    ]);
  });

  it('남는 항목은 버리고 앞쪽 빈 칸은 건드리지 않는다', () => {
    expect(placeItems([null, null, null], 1, ['a', 'b', 'c'])).toEqual([
      null,
      'a',
      'b'
    ]);
  });
});

describe('swapSlots', () => {
  it('두 칸을 바꾼다', () => {
    expect(swapSlots(['a', 'b', null], 0, 2)).toEqual([null, 'b', 'a']);
  });
});

describe('isImageFile', () => {
  it('이미지 MIME 타입을 받는다', () => {
    expect(isImageFile(new File([], 'a.png', { type: 'image/png' }))).toBe(
      true
    );
  });

  it('타입이 비어 있는 HEIC를 확장자로 받는다', () => {
    expect(isImageFile(new File([], 'IMG.HEIC', { type: '' }))).toBe(true);
  });

  it('이미지가 아닌 파일은 거른다', () => {
    expect(
      isImageFile(new File([], 'a.pdf', { type: 'application/pdf' }))
    ).toBe(false);
  });
});
