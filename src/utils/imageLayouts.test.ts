import { describe, expect, it } from 'vitest';
import { IMAGE_LAYOUTS, LAYOUT_COUNTS, getLayout, getLayoutsByCount } from './imageLayouts';

describe('IMAGE_LAYOUTS', () => {
  it('id가 겹치지 않는다', () => {
    const ids = IMAGE_LAYOUTS.map(layout => layout.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('칸 수가 장수와 같다', () => {
    for (const layout of IMAGE_LAYOUTS) {
      expect(layout.cells.length, layout.id).toBe(layout.count);
    }
  });

  it('장수별 레이아웃 개수는 1/3/5/5다', () => {
    expect(LAYOUT_COUNTS.map(count => getLayoutsByCount(count).length)).toEqual([1, 3, 5, 5]);
  });

  it('원본 비율 칸은 1장 레이아웃에만 있다', () => {
    for (const layout of IMAGE_LAYOUTS) {
      expect(layout.cells.includes('original'), layout.id).toBe(layout.count === 1);
    }
  });
});

describe('getLayout', () => {
  it('id로 찾는다', () => {
    expect(getLayout('3-c')?.cells).toEqual(['portrait', 'landscape', 'landscape']);
  });

  it('없는 id는 undefined다', () => {
    expect(getLayout('9-z')).toBeUndefined();
  });
});
