// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import compressImage, { getTargetSize } from './compressImage';

const heicTo = vi.hoisted(() => vi.fn());
vi.mock('heic-to', () => ({ heicTo }));

describe('getTargetSize', () => {
  it('가로 사진은 긴 변을 2048로 줄인다', () => {
    expect(getTargetSize(4032, 3024)).toEqual({ width: 2048, height: 1536 });
  });

  it('세로 사진은 긴 변을 2048로 줄인다', () => {
    expect(getTargetSize(3024, 4032)).toEqual({ width: 1536, height: 2048 });
  });

  it('정사각형도 줄인다', () => {
    expect(getTargetSize(3000, 3000)).toEqual({ width: 2048, height: 2048 });
  });

  it('작은 사진은 키우지 않는다', () => {
    expect(getTargetSize(1000, 800)).toEqual({ width: 1000, height: 800 });
  });
});

describe('compressImage', () => {
  const createImageBitmap = vi.fn();
  const drawImage = vi.fn();
  let encodable: string[];

  beforeEach(() => {
    encodable = ['image/webp', 'image/jpeg'];
    createImageBitmap.mockResolvedValue({
      width: 4032,
      height: 3024,
      close: vi.fn()
    });
    vi.stubGlobal('createImageBitmap', createImageBitmap);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage
    } as unknown as CanvasRenderingContext2D);
    // 인코딩을 지원하지 않는 타입을 요청하면 브라우저처럼 PNG를 돌려준다.
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      function (this: HTMLCanvasElement, callback, type) {
        const actual = type && encodable.includes(type) ? type : 'image/png';
        callback(new Blob([`${this.width}x${this.height}`], { type: actual }));
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    createImageBitmap.mockReset();
    drawImage.mockReset();
    heicTo.mockReset();
  });

  it('GIF와 SVG는 그대로 돌려준다', async () => {
    for (const type of ['image/gif', 'image/svg+xml']) {
      const file = new File(['x'], 'a', { type });
      expect(await compressImage(file)).toBe(file);
    }
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('줄인 크기로 그려 WebP로 저장한다', async () => {
    const out = await compressImage(
      new File(['x'], 'IMG_1.JPG', { type: 'image/jpeg' })
    );
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2048, 1536);
    expect(out.type).toBe('image/webp');
    expect(out.name).toBe('IMG_1.webp');
  });

  it('WebP 인코딩이 안 되면 JPEG로 저장한다', async () => {
    encodable = ['image/jpeg'];
    const out = await compressImage(
      new File(['x'], 'a.png', { type: 'image/png' })
    );
    expect(out.type).toBe('image/jpeg');
    expect(out.name).toBe('a.jpg');
  });

  it('HEIC를 직접 읽지 못하면 heic-to로 바로 디코딩한다', async () => {
    const bitmap = { width: 5712, height: 4284, close: vi.fn() };
    createImageBitmap.mockRejectedValueOnce(new Error('unsupported'));
    heicTo.mockResolvedValue(bitmap);
    const file = new File(['x'], 'IMG_2.HEIC', { type: '' });

    const out = await compressImage(file);

    expect(heicTo).toHaveBeenCalledWith({ blob: file, type: 'bitmap' });
    expect(createImageBitmap).toHaveBeenCalledOnce();
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 2048, 1536);
    expect(out.name).toBe('IMG_2.webp');
  });

  it('HEIC가 아닌데 읽지 못하면 실패한다', async () => {
    createImageBitmap.mockRejectedValue(new Error('broken'));
    await expect(
      compressImage(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    ).rejects.toThrow('broken');
    expect(heicTo).not.toHaveBeenCalled();
  });
});
