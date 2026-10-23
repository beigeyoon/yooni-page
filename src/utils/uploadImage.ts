import { MAX_UPLOAD_BYTES } from '@/constants/upload';

// 압축(HEIC 변환 포함)은 배치 창이 사진을 놓을 때 이미 끝낸다.
// 미리보기와 업로드가 같은 변환 결과를 쓰도록, 여기서는 받은 파일을 그대로 올린다.

export type UploadResult = { url: string } | { error: string };

const TOO_LARGE = '용량이 너무 큽니다.';

async function uploadImage(file: File): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) return { error: TOO_LARGE };

  const formData = new FormData();
  formData.append('file', file);

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
