import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseForServer';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { getAppSession, isAdminEmail } from '@/lib/auth';
import { isValidCategory } from '@/types';
import { buildSlugCandidate, resolveUniqueSlug } from '@/utils/generateSlug';
import { revalidateContent } from '@/lib/revalidateContent';

function getSeriesPayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const category =
    typeof body.category === 'string' ? body.category.trim() : '';
  const description =
    typeof body.description === 'string' && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  return {
    title,
    category,
    description
  };
}

export async function GET() {
  try {
    const supabasePublic = getSupabasePublic();
    const { data, error } = await supabasePublic.from('series').select('*');

    if (error) {
      return NextResponse.json(
        { error: '시리즈를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
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
        { error: '❌ 업로드 권한이 없습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const payload = getSeriesPayload(body);

    if (!payload.title || !isValidCategory(payload.category)) {
      return NextResponse.json(
        { error: '유효한 시리즈 제목과 카테고리가 필요합니다.' },
        { status: 400 }
      );
    }

    const slug = await resolveUniqueSlug(
      buildSlugCandidate(payload.title, 'series'),
      async candidate => {
        const { data: existing } = await supabaseAdmin
          .from('series')
          .select('id')
          .eq('slug', candidate)
          .maybeSingle();
        return existing !== null;
      }
    );

    const { data, error } = await supabaseAdmin
      .from('series')
      .insert([{ ...payload, slug }]);

    if (error) {
      return NextResponse.json(
        { error: '시리즈 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    revalidateContent({ category: payload.category, seriesSlug: slug });

    return NextResponse.json(
      { message: '✅ Series created successfully', data },
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
        { error: '❌ 업로드 권한이 없습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const payload = getSeriesPayload(body);

    if (!id) {
      return NextResponse.json(
        { error: '시리즈 id가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!payload.title || !isValidCategory(payload.category)) {
      return NextResponse.json(
        { error: '유효한 시리즈 제목과 카테고리가 필요합니다.' },
        { status: 400 }
      );
    }

    // 카테고리가 바뀌었을 수 있어, 무효화하려면 이전 위치를 알아야 한다.
    const { data: before } = await getSupabasePublic()
      .from('series')
      .select('slug, category')
      .eq('id', id)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('series')
      .update(payload)
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: '시리즈 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 시리즈 슬러그도 배정 후 불변이므로 양쪽에 같은 값을 쓴다.
    if (before) {
      revalidateContent(
        { category: before.category, seriesSlug: before.slug },
        { category: payload.category, seriesSlug: before.slug }
      );
    }

    return NextResponse.json(
      { message: '✅ Series updated successfully', data },
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
        { error: '❌ 업로드 권한이 없습니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '시리즈 id가 필요합니다.' },
        { status: 400 }
      );
    }

    // 시리즈를 지우면 소속 글들의 목차와 이전/다음 편도 사라지므로 함께 낡는다.
    const supabasePublic = getSupabasePublic();

    const [{ data: target }, { data: seriesPosts }] = await Promise.all([
      supabasePublic
        .from('series')
        .select('slug, category')
        .eq('id', id)
        .maybeSingle(),
      supabasePublic.from('post').select('slug, category').eq('seriesId', id)
    ]);

    const { data, error } = await supabaseAdmin
      .from('series')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: '시리즈 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (target) {
      revalidateContent(
        { category: target.category, seriesSlug: target.slug },
        ...(seriesPosts ?? []).map(post => ({
          category: post.category,
          slug: post.slug
        }))
      );
    }

    return NextResponse.json(
      { message: '✅ Series deleted successfully', data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
