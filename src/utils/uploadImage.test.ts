import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import uploadImage from './uploadImage';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

// 압축은 배치 창이 사진을 놓을 때 이미 끝낸다. 여기서는 받은 파일을 그대로 올린다.
const compressed = new File(['small'], 'a.webp', { type: 'image/webp' });

describe('uploadImage', () => {
  it('받은 파일을 그대로 올리고 URL을 돌려준다', async () => {
    fetchMock.mockResolvedValue(Response.json({ url: 'https://x/a.webp' }));

    expect(await uploadImage(compressed)).toEqual({ url: 'https://x/a.webp' });
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect((body.get('file') as File).name).toBe('a.webp');
  });

  it('4MB를 넘으면 올리지 않는다', async () => {
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'big.webp', {
      type: 'image/webp'
    });

    expect(await uploadImage(big)).toEqual({
      error: '용량이 너무 큽니다.'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('JSON이 아닌 413 응답을 용량 초과로 처리한다', async () => {
    fetchMock.mockResolvedValue(
      new Response('Request Entity Too Large', { status: 413 })
    );

    expect(await uploadImage(compressed)).toEqual({
      error: '용량이 너무 큽니다.'
    });
  });

  it('API 에러 메시지를 그대로 돌려준다', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 })
    );

    expect(await uploadImage(compressed)).toEqual({
      error: '파일 업로드에 실패했습니다.'
    });
  });

  it('네트워크 오류를 처리한다', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await uploadImage(compressed)).toEqual({
      error: '네트워크 오류로 업로드하지 못했습니다.'
    });
  });
});
