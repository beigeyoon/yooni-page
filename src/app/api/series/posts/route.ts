import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAppSession, isAdminEmail } from '@/lib/auth';
import {
  buildSeriesPostLocations,
  parseSeriesPostIds
} from '@/lib/api/seriesPosts';
import { revalidateContent } from '@/lib/revalidateContent';
import isUuid from '@/utils/isUuid';

// 시리즈의 소속 글과 순번을 한 번에 저장한다. 본문 배열의 순서가 곧 순번(1부터)이다.
// 목록에서 빠진 기존 소속 글은 시리즈에서 분리되고, 다른 시리즈에 있던 글은 이 시리즈로 옮겨진다.
// 여러 행을 원자적으로 바꿔야 해서 Supabase REST 대신 Prisma 트랜잭션을 쓴다.
export async function PUT(request: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json(
        { error: '❌ 업로드 권한이 없습니다.' },
        { status: 401 }
      );
    }

    const seriesId = new URL(request.url).searchParams.get('id');
    if (!seriesId) {
      return NextResponse.json(
        { error: '시리즈 id가 필요합니다.' },
        { status: 400 }
      );
    }
    // UUID가 아니면 Postgres 캐스팅 오류로 500이 나므로 먼저 거른다.
    const series = isUuid(seriesId)
      ? await prisma.series.findUnique({
          where: { id: seriesId },
          select: { id: true, slug: true, category: true }
        })
      : null;
    if (!series) {
      return NextResponse.json(
        { error: '시리즈를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const parsed = parseSeriesPostIds(await request.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { postIds } = parsed;

    const memberSelect = {
      slug: true,
      category: true,
      seriesId: true
    } as const;

    const [previousMembers, nextMembers] = await Promise.all([
      prisma.post.findMany({
        where: { seriesId: series.id },
        select: memberSelect
      }),
      prisma.post.findMany({
        where: { id: { in: postIds } },
        select: memberSelect
      })
    ]);

    if (nextMembers.length !== postIds.length) {
      return NextResponse.json(
        { error: '존재하지 않는 글이 있습니다.' },
        { status: 400 }
      );
    }
    if (nextMembers.some(post => post.category !== series.category)) {
      return NextResponse.json(
        { error: '시리즈와 카테고리가 다른 글은 넣을 수 없습니다.' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.post.updateMany({
        where: { seriesId: series.id, id: { notIn: postIds } },
        data: { seriesId: null, seriesOrder: null }
      }),
      ...postIds.map((id, index) =>
        prisma.post.update({
          where: { id },
          data: { seriesId: series.id, seriesOrder: index + 1 }
        })
      )
    ]);

    // 글을 빼앗긴 다른 시리즈의 페이지도 낡는다.
    // 그 시리즈에 남은 글들도 목차와 이전/다음 편이 바뀌므로 함께 무효화한다.
    const otherSeriesIds = [
      ...new Set(
        nextMembers
          .map(post => post.seriesId)
          .filter((id): id is string => !!id && id !== series.id)
      )
    ];
    const [otherSeries, otherSeriesPosts] =
      otherSeriesIds.length > 0
        ? await Promise.all([
            prisma.series.findMany({
              where: { id: { in: otherSeriesIds } },
              select: { slug: true, category: true }
            }),
            prisma.post.findMany({
              where: { seriesId: { in: otherSeriesIds } },
              select: { slug: true, category: true }
            })
          ])
        : [[], []];

    revalidateContent(
      ...buildSeriesPostLocations(
        series,
        [...previousMembers, ...nextMembers, ...otherSeriesPosts],
        otherSeries
      )
    );

    return NextResponse.json(
      {
        message: '✅ Series posts updated successfully',
        data: { seriesId: series.id, postIds }
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
