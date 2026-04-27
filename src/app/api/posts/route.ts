import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseForServer';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { getAppSession, isAdminEmail } from '@/lib/auth';
import { isValidCategory } from '@/types';

function getPostPayload(body: Record<string, unknown>) {
  return {
    title: typeof body.title === 'string' ? body.title.trim() : '',
    subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() : null,
    category: typeof body.category === 'string' ? body.category : '',
    seriesId:
      typeof body.seriesId === 'string' && body.seriesId.length > 0
        ? body.seriesId
        : null,
    content: typeof body.content === 'string' ? body.content.trim() : '',
    isPublished: body.isPublished === true
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAppSession();
    const isAdmin = isAdminEmail(session?.user?.email);
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const category = searchParams.get('category');
    const seriesId = searchParams.get('seriesId');
    const canPreviewUnpublished =
      searchParams.get('preview') === 'true' && isAdmin;
    const supabase = canPreviewUnpublished
      ? getSupabaseAdmin()
      : getSupabasePublic();

    if (postId) {
      const { data, error } = await supabase
        .from('post')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
      if (error) {
        return NextResponse.json(
          { error: '게시글을 불러오는데 실패했습니다.' },
          { status: 500 }
        );
      }
      if (!data || (!data.isPublished && !canPreviewUnpublished)) {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data }, { status: 200 });
    } else {
      let query = supabase.from('post').select('*');
      if (!canPreviewUnpublished) {
        query = query.eq('isPublished', true);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (seriesId) {
        query = query.eq('seriesId', seriesId);
      }
      const { data, error } = await query;
      if (error) {
        return NextResponse.json(
          { error: '게시글 목록을 불러오는데 실패했습니다.' },
          { status: 500 }
        );
      }
      return NextResponse.json({ data }, { status: 200 });
    }
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const session = await getAppSession();
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: '❌ 게시글 작성 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const payload = getPostPayload(body);
    const userId = session.user?.id;

    if (
      !userId ||
      !payload.title ||
      !payload.content ||
      !isValidCategory(payload.category)
    ) {
      return NextResponse.json(
        { error: '필수 게시글 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }
    const { data, error } = await supabaseAdmin
      .from('post')
      .insert([{ ...payload, userId }]);

    if (error) {
      return NextResponse.json(
        { error: '게시글 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '✅ Post created successfully', data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const session = await getAppSession();
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: '❌ 게시글 수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body;
    const payload = getPostPayload(body);
    if (!id) {
      return NextResponse.json(
        { error: '게시글 id가 필요합니다.' },
        { status: 400 }
      );
    }
    if (
      !payload.title ||
      !payload.content ||
      !isValidCategory(payload.category)
    ) {
      return NextResponse.json(
        { error: '필수 게시글 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }
    const { data, error } = await supabaseAdmin
      .from('post')
      .update(payload)
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: '게시글 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '✅ Post updated successfully', data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const session = await getAppSession();
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: '❌ 게시글 삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json(
        { error: '게시글 id가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('post')
      .delete()
      .eq('id', postId);

    if (error) {
      return NextResponse.json(
        { error: '게시글 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '✅ Post deleted successfully', data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
