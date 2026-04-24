import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForServer } from '@/lib/supabaseForServer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const supabaseForServer = getSupabaseForServer();
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: '❌ 이미지 업로드 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '파일이 유효하지 않음' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '10MB 이하의 이미지만 업로드할 수 있습니다.' }, { status: 400 });
    }

    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabaseForServer.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      return NextResponse.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseForServer.storage
      .from('images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrlData?.publicUrl }, { status: 200 });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
