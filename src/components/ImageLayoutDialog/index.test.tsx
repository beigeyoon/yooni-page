// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageLayoutDialog from '.';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const uploadImage = vi.hoisted(() => vi.fn());
vi.mock('@/utils/uploadImage', () => ({ default: uploadImage }));

// jsdom에는 미리보기용 object URL이 없다.
URL.createObjectURL = () => 'blob:preview';
URL.revokeObjectURL = () => {};

let container: HTMLDivElement;
let root: Root;
const onInsert = vi.fn();
const onOpenChange = vi.fn();

beforeEach(() => {
  uploadImage.mockImplementation(async (file: File) => ({ url: `https://x/${file.name}` }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<ImageLayoutDialog open onOpenChange={onOpenChange} onInsert={onInsert} />);
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  uploadImage.mockReset();
  onInsert.mockReset();
  onOpenChange.mockReset();
});

const image = (name: string) => new File(['x'], name, { type: 'image/jpeg' });
const slots = () => [...document.querySelectorAll<HTMLElement>('[data-slot]')];
const button = (name: string) =>
  [...document.querySelectorAll('button')].find(b => b.textContent === name)!;

function drop(target: HTMLElement, data: { files?: File[]; slot?: number }) {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files: data.files ?? [],
      getData: (type: string) =>
        type === 'application/x-image-slot' && data.slot !== undefined ? String(data.slot) : ''
    }
  });
  act(() => {
    target.dispatchEvent(event);
  });
}

async function click(target: HTMLElement) {
  await act(async () => {
    target.click();
  });
}

describe('ImageLayoutDialog', () => {
  it('기본은 2장 정방형 나란히이고, 칸이 다 차야 삽입할 수 있다', () => {
    expect(slots()).toHaveLength(2);
    expect(button('삽입').disabled).toBe(true);

    drop(slots()[0], { files: [image('a.jpg')] });
    expect(button('삽입').disabled).toBe(true);

    drop(slots()[1], { files: [image('b.jpg')] });
    expect(button('삽입').disabled).toBe(false);
  });

  it('여러 장을 한 칸에 놓으면 이어지는 빈 칸을 채우고, 이미지가 아닌 파일은 거른다', async () => {
    drop(slots()[0], {
      files: [image('a.jpg'), new File(['x'], 'memo.txt', { type: 'text/plain' }), image('b.jpg')]
    });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(['https://x/a.jpg', 'https://x/b.jpg'], '2-a');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('칸끼리 끌어 놓으면 자리가 바뀐다', async () => {
    drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    drop(slots()[1], { slot: 0 });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(['https://x/b.jpg', 'https://x/a.jpg'], '2-a');
  });

  it('장수와 레이아웃을 바꿔도 넣어 둔 사진은 순서대로 남는다', async () => {
    drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    await click(button('3장'));
    expect(slots()).toHaveLength(3);

    await click(document.querySelector<HTMLElement>('[aria-label="세로1 + 가로2"]')!);
    drop(slots()[2], { files: [image('c.jpg')] });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(
      ['https://x/a.jpg', 'https://x/b.jpg', 'https://x/c.jpg'],
      '3-c'
    );
  });

  it('실패한 칸은 사유를 보여주고, 다시 시도하면 그 칸만 올린다', async () => {
    uploadImage.mockImplementationOnce(async () => ({ url: 'https://x/a.jpg' }));
    uploadImage.mockImplementationOnce(async () => ({ error: '용량이 너무 큽니다.' }));
    drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });

    await click(button('삽입'));
    expect(onInsert).not.toHaveBeenCalled();
    expect(slots()[1].textContent).toContain('용량이 너무 큽니다.');

    await click(button('다시 시도'));
    expect(uploadImage).toHaveBeenCalledTimes(3);
    expect(uploadImage.mock.calls[2][0].name).toBe('b.jpg');
    expect(onInsert).toHaveBeenCalledWith(['https://x/a.jpg', 'https://x/b.jpg'], '2-a');
  });
});
