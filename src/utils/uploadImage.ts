import { MAX_UPLOAD_BYTES } from '@/constants/upload';
import compressImage from './compressImage';

export type UploadResult = { url: string } | { error: string };

const TOO_LARGE = '용량이 너무 큽니다.';

async function uploadImage(file: File): Promise<UploadResult> {
  let compressed: File;
  try {
    compressed = await compressImage(file);
  } catch (error) {
    console.error('❌ 이미지 압축 실패:', error);
    return { error: '이미지를 읽을 수 없습니다.' };
  }

  if (compressed.size > MAX_UPLOAD_BYTES) return { error: TOO_LARGE };

  const formData = new FormData();
  formData.append('file', compressed);

  let res: Response;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: formData });
  } catch {
    return { error: '네트워크 오류로 업로드하지 못했습니다.' };
  }

  // Vercel이 본문 한도로 거부한 413은 JSON이 아니다.
  if (res.status === 413) return { error: TOO_LARGE };

  const result = await res.json().catch(() => null);
  if (!res.ok || !result?.url) {
    console.error('❌ 이미지 업로드 실패:', result?.error);
    return { error: result?.error ?? '업로드에 실패했습니다.' };
  }

  return { url: result.url };
}

export default uploadImage;
