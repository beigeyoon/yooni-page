// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageLayoutDialog from '.';
import { getLayoutsByCount } from '@/utils/imageLayouts';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const uploadImage = vi.hoisted(() => vi.fn());
vi.mock('@/utils/uploadImage', () => ({ default: uploadImage }));
const compressImage = vi.hoisted(() => vi.fn());
vi.mock('@/utils/compressImage', () => ({ default: compressImage }));

// 변환 결과는 확장자만 .webp로 바뀐 파일로 흉내 낸다.
const toWebp = (file: File) =>
  new File(['small'], file.name.replace(/\.[^.]+$/, '.webp'), {
    type: 'image/webp'
  });

// jsdom에는 미리보기용 object URL이 없다. 어떤 파일로 만들었는지 보이게 이름을 싣는다.
URL.createObjectURL = (file: Blob) => `blob:${(file as File).name}`;
URL.revokeObjectURL = () => {};

let container: HTMLDivElement;
let root: Root;
const onInsert = vi.fn();
const onOpenChange = vi.fn();

beforeEach(() => {
  compressImage.mockImplementation(async (file: File) => toWebp(file));
  uploadImage.mockImplementation(async (file: File) => ({
    url: `https://x/${file.name}`
  }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <ImageLayoutDialog
        open
        onOpenChange={onOpenChange}
        onInsert={onInsert}
      />
    );
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  uploadImage.mockReset();
  compressImage.mockReset();
  onInsert.mockReset();
  onOpenChange.mockReset();
});

const image = (name: string) => new File(['x'], name, { type: 'image/jpeg' });
const slots = () => [...document.querySelectorAll<HTMLElement>('[data-slot]')];
const button = (name: string) =>
  [...document.querySelectorAll('button')].find(b => b.textContent === name)!;

// 놓자마자 시작하는 변환(비동기)까지 기다린다. 끝나지 않게 막아 둔 변환은 그대로 남는다.
async function drop(
  target: HTMLElement,
  data: { files?: File[]; slot?: number }
) {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files: data.files ?? [],
      getData: (type: string) =>
        type === 'application/x-image-slot' && data.slot !== undefined
          ? String(data.slot)
          : ''
    }
  });
  await act(async () => {
    target.dispatchEvent(event);
  });
}

// 막아 둔 변환을 풀어준 뒤 그 결과가 반영될 때까지 기다린다.
async function flush() {
  await act(async () => {});
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const altInputs = () => [
  ...document.querySelectorAll<HTMLInputElement>('input[data-alt-for]')
];
const altInput = (slot: number) =>
  document.querySelector<HTMLInputElement>(`input[data-alt-for="${slot}"]`)!;

// React는 value setter를 가로채므로 원래 setter로 값을 넣고 input 이벤트를 쏴야 onChange가 돈다.
function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function click(target: HTMLElement) {
  await act(async () => {
    target.click();
  });
}

describe('ImageLayoutDialog', () => {
  it('기본은 1장이고, 레이아웃이 하나뿐이라 썸네일을 보여주지 않는다', async () => {
    expect(slots()).toHaveLength(1);
    expect(document.querySelectorAll('[aria-pressed]')).toHaveLength(0);

    await drop(slots()[0], { files: [image('a.jpg')] });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(
      [{ src: 'https://x/a.webp', alt: '' }],
      '1-a'
    );
  });
});

describe('ImageLayoutDialog 사진 변환', () => {
  it('놓는 순간 한 번 변환해서, 변환된 파일로 미리보기를 보여준다', async () => {
    await drop(slots()[0], {
      files: [new File(['x'], 'IMG_1.HEIC', { type: '' })]
    });

    expect(compressImage).toHaveBeenCalledTimes(1);
    expect(slots()[0].querySelector('img')?.getAttribute('src')).toBe(
      'blob:IMG_1.webp'
    );
  });

  it('삽입할 때는 다시 변환하지 않고 변환된 파일을 올린다', async () => {
    await drop(slots()[0], { files: [image('a.jpg')] });
    await click(button('삽입'));

    expect(compressImage).toHaveBeenCalledTimes(1);
    expect(uploadImage.mock.calls[0][0].name).toBe('a.webp');
  });

  it('변환하는 동안에는 삽입할 수 없다', async () => {
    const pending = deferred<File>();
    compressImage.mockImplementationOnce(() => pending.promise);
    await drop(slots()[0], { files: [image('a.jpg')] });
    expect(button('삽입').disabled).toBe(true);

    pending.resolve(toWebp(image('a.jpg')));
    await flush();
    expect(button('삽입').disabled).toBe(false);
  });

  it('변환 중에 자리를 바꿔도 결과는 그 사진을 따라간다', async () => {
    await click(button('2장'));
    const pending = deferred<File>();
    compressImage.mockImplementationOnce(() => pending.promise);
    await drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    await drop(slots()[1], { slot: 0 });

    pending.resolve(toWebp(image('a.jpg')));
    await flush();
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(
      [
        { src: 'https://x/b.webp', alt: '' },
        { src: 'https://x/a.webp', alt: '' }
      ],
      '2-a'
    );
  });

  it('변환에 실패하면 사유를 보여주고, 다시 시도하면 다시 변환한다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    compressImage.mockRejectedValueOnce(new Error('broken'));
    await drop(slots()[0], { files: [image('a.jpg')] });
    expect(slots()[0].textContent).toContain('이미지를 읽을 수 없습니다.');

    await click(button('다시 시도'));

    expect(compressImage).toHaveBeenCalledTimes(2);
    expect(onInsert).toHaveBeenCalledWith(
      [{ src: 'https://x/a.webp', alt: '' }],
      '1-a'
    );
  });
});

describe('ImageLayoutDialog 사진 설명', () => {
  it('칸마다 적은 설명을 앞뒤 공백을 지워 alt로 넘긴다', async () => {
    await click(button('2장'));
    await drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    type(altInput(0), '  우붓 논 풍경 ');
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(
      [
        { src: 'https://x/a.webp', alt: '우붓 논 풍경' },
        { src: 'https://x/b.webp', alt: '' }
      ],
      '2-a'
    );
  });

  it('칸끼리 자리를 바꾸면 설명도 사진을 따라간다', async () => {
    await click(button('2장'));
    await drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    type(altInput(0), 'A 사진');
    await drop(slots()[1], { slot: 0 });

    expect(altInput(1).value).toBe('A 사진');
    expect(altInput(0).value).toBe('');
  });

  it('사진이 없는 칸에는 설명 입력란이 없다', async () => {
    await click(button('2장'));
    await drop(slots()[0], { files: [image('a.jpg')] });

    expect(altInputs()).toHaveLength(1);
  });
});

describe('ImageLayoutDialog 2장', () => {
  beforeEach(async () => {
    await click(button('2장'));
  });

  it('정방형 나란히가 먼저 골라져 있고, 칸이 다 차야 삽입할 수 있다', async () => {
    expect(slots()).toHaveLength(2);
    expect(document.querySelectorAll('[aria-pressed]')).toHaveLength(
      getLayoutsByCount(2).length
    );
    expect(button('삽입').disabled).toBe(true);

    await drop(slots()[0], { files: [image('a.jpg')] });
    expect(button('삽입').disabled).toBe(true);

    await drop(slots()[1], { files: [image('b.jpg')] });
    expect(button('삽입').disabled).toBe(false);
  });

  it('여러 장을 한 칸에 놓으면 이어지는 빈 칸을 채우고, 이미지가 아닌 파일은 거른다', async () => {
    await drop(slots()[0], {
      files: [
        image('a.jpg'),
        new File(['x'], 'memo.txt', { type: 'text/plain' }),
        image('b.jpg')
      ]
    });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(
      [
        { src: 'https://x/a.webp', alt: '' },
        { src: 'https://x/b.webp', alt: '' }
      ],
      '2-a'
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('칸끼리 끌어 놓으면 자리가 바뀐다', async () => {
    await drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    await drop(slots()[1], { slot: 0 });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(
      [
        { src: 'https://x/b.webp', alt: '' },
        { src: 'https://x/a.webp', alt: '' }
      ],
      '2-a'
    );
  });

  it('장수와 레이아웃을 바꿔도 넣어 둔 사진은 순서대로 남는다', async () => {
    await drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });
    await click(button('3장'));
    expect(slots()).toHaveLength(3);

    await click(
      document.querySelector<HTMLElement>('[aria-label="세로1 + 가로2"]')!
    );
    await drop(slots()[2], { files: [image('c.jpg')] });
    await click(button('삽입'));

    expect(onInsert).toHaveBeenCalledWith(
      [
        { src: 'https://x/a.webp', alt: '' },
        { src: 'https://x/b.webp', alt: '' },
        { src: 'https://x/c.webp', alt: '' }
      ],
      '3-c'
    );
  });

  it('실패한 칸은 사유를 보여주고, 다시 시도하면 그 칸만 올린다', async () => {
    uploadImage.mockImplementationOnce(async () => ({
      url: 'https://x/a.webp'
    }));
    uploadImage.mockImplementationOnce(async () => ({
      error: '용량이 너무 큽니다.'
    }));
    await drop(slots()[0], { files: [image('a.jpg'), image('b.jpg')] });

    await click(button('삽입'));
    expect(onInsert).not.toHaveBeenCalled();
    expect(slots()[1].textContent).toContain('용량이 너무 큽니다.');

    await click(button('다시 시도'));
    expect(uploadImage).toHaveBeenCalledTimes(3);
    expect(uploadImage.mock.calls[2][0].name).toBe('b.webp');
    expect(onInsert).toHaveBeenCalledWith(
      [
        { src: 'https://x/a.webp', alt: '' },
        { src: 'https://x/b.webp', alt: '' }
      ],
      '2-a'
    );
  });
});
