import { NextRequest, NextResponse } from 'next/server';
import { supabaseForServer } from '@/lib/supabaseForServer';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: '파일이 유효하지 않음' }, { status: 400 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseForServer.storage
    .from('images')
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrlData?.publicUrl }, { status: 200 });
}