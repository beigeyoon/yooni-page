// 업로드 전에 브라우저에서 사진을 줄인다.
// Vercel 함수의 요청 본문 한도(4.5MB)를 넘지 않게 하고, 재인코딩으로 EXIF(GPS 포함)도 지운다.

const MAX_EDGE = 2048;
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;

// 재인코딩하면 애니메이션과 벡터가 깨진다.
const PASSTHROUGH_TYPES = ['image/gif', 'image/svg+xml'];

export function getTargetSize(
  width: number,
  height: number,
  maxEdge = MAX_EDGE
) {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };

  const scale = maxEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}

function isHeic(file: File) {
  return /^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

// Safari는 HEIC를 직접 디코딩하므로 실패할 때만 heic-to로 디코딩한다.
// heic2any는 2019년 libheif를 써서 iPhone 17 Pro 같은 최신 HEIC(24MP)를
// ERR_LIBHEIF로 거부했다. heic-to는 최신 libheif라 이를 읽고, 바로 ImageBitmap을 줘서
// JPEG로 한 번 더 인코딩하는 단계도 없다. 용량이 커서 HEIC일 때만 불러온다.
async function decode(file: File) {
  try {
    return await createImageBitmap(file);
  } catch (error) {
    if (!isHeic(file)) throw error;
    const { heicTo } = await import('heic-to');
    return heicTo({ blob: file, type: 'bitmap' });
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, type, quality)
  );
}

async function compressImage(file: File): Promise<File> {
  if (PASSTHROUGH_TYPES.includes(file.type)) return file;

  const bitmap = await decode(file);
  const { width, height } = getTargetSize(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas를 사용할 수 없습니다.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP 인코딩을 지원하지 않는 브라우저(Safari 일부)는 조용히 PNG를 돌려준다.
  let blob = await toBlob(canvas, 'image/webp', WEBP_QUALITY);
  if (blob?.type !== 'image/webp') {
    blob = await toBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  }
  if (!blob) throw new Error('이미지를 압축하지 못했습니다.');

  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.${extension}`, {
    type: blob.type,
    lastModified: Date.now()
  });
}

export default compressImage;
