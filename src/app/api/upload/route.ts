import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseForServer';
import { getAppSession, isAdminEmail } from '@/lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg'
};

function getSafeImageExtension(mimeType: string) {
  return IMAGE_EXTENSIONS_BY_MIME[mimeType.toLowerCase()] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const session = await getAppSession();

    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: '❌ 이미지 업로드 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: '파일이 유효하지 않음' },
        { status: 400 }
      );
    }

    const extension = getSafeImageExtension(file.type);
    if (!extension) {
      return NextResponse.json(
        { error: '지원하지 않는 이미지 형식입니다.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '10MB 이하의 이미지만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    const fileName = `${randomUUID()}.${extension}`;
    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(fileName);

    return NextResponse.json(
      { url: publicUrlData?.publicUrl },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
