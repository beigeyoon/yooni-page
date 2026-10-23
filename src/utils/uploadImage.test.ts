import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import uploadImage from './uploadImage';

const compressImage = vi.hoisted(() => vi.fn());
vi.mock('./compressImage', () => ({ default: compressImage }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
  compressImage.mockReset();
});

const original = new File(['original'], 'a.jpg', { type: 'image/jpeg' });
const compressed = new File(['small'], 'a.webp', { type: 'image/webp' });

describe('uploadImage', () => {
  it('압축한 파일을 올리고 URL을 돌려준다', async () => {
    compressImage.mockResolvedValue(compressed);
    fetchMock.mockResolvedValue(Response.json({ url: 'https://x/a.webp' }));

    expect(await uploadImage(original)).toEqual({ url: 'https://x/a.webp' });
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect((body.get('file') as File).name).toBe('a.webp');
  });

  it('압축에 실패하면 올리지 않는다', async () => {
    compressImage.mockRejectedValue(new Error('broken'));

    expect(await uploadImage(original)).toEqual({
      error: '이미지를 읽을 수 없습니다.'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('압축 후에도 4MB를 넘으면 올리지 않는다', async () => {
    compressImage.mockResolvedValue(
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'big.webp', {
        type: 'image/webp'
      })
    );

    expect(await uploadImage(original)).toEqual({
      error: '용량이 너무 큽니다.'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('JSON이 아닌 413 응답을 용량 초과로 처리한다', async () => {
    compressImage.mockResolvedValue(compressed);
    fetchMock.mockResolvedValue(
      new Response('Request Entity Too Large', { status: 413 })
    );

    expect(await uploadImage(original)).toEqual({
      error: '용량이 너무 큽니다.'
    });
  });

  it('API 에러 메시지를 그대로 돌려준다', async () => {
    compressImage.mockResolvedValue(compressed);
    fetchMock.mockResolvedValue(
      Response.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 })
    );

    expect(await uploadImage(original)).toEqual({
      error: '파일 업로드에 실패했습니다.'
    });
  });

  it('네트워크 오류를 처리한다', async () => {
    compressImage.mockResolvedValue(compressed);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await uploadImage(original)).toEqual({
      error: '네트워크 오류로 업로드하지 못했습니다.'
    });
  });
});
