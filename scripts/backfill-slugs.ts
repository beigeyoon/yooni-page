// 기존 글·시리즈에 슬러그를 채운다.
//
// 슬러그는 한 번 배정되면 바꾸지 않는다(URL이 조용히 깨지는 걸 막기 위해).
// 그래서 실제로 쓰기 전에 --dry-run으로 결과를 눈으로 확인하는 단계를 반드시 거친다.
//
//   pnpm backfill-slugs --dry-run   결과만 출력, DB 변경 없음
//   pnpm backfill-slugs             실제 반영
//
// 슬러그가 이미 있는 행은 건너뛰므로 여러 번 실행해도 안전하다.

import { PrismaClient } from '@prisma/client';
import {
  buildSlugCandidate,
  resolveUniqueSlug,
  type SlugKind
} from '../src/utils/generateSlug';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

// 이미 배정된 슬러그를 메모리에 모아 중복을 검사한다.
// 한 번의 실행 안에서 새로 만든 슬러그끼리 충돌하는 것도 막아야 하므로
// DB 조회만으로는 부족하다.
async function collectTakenSlugs(kind: SlugKind): Promise<Set<string>> {
  const rows =
    kind === 'post'
      ? await prisma.post.findMany({ select: { slug: true } })
      : await prisma.series.findMany({ select: { slug: true } });

  const taken = new Set<string>();
  for (const row of rows) {
    if (row.slug) taken.add(row.slug);
  }
  return taken;
}

async function assign(
  title: string,
  kind: SlugKind,
  taken: Set<string>
): Promise<string> {
  const slug = await resolveUniqueSlug(
    buildSlugCandidate(title, kind),
    async candidate => taken.has(candidate)
  );
  taken.add(slug);
  return slug;
}

async function main() {
  // post와 series는 서로 다른 URL 공간이라 슬러그 네임스페이스를 공유하지 않는다.
  const takenSeries = await collectTakenSlugs('series');
  const takenPosts = await collectTakenSlugs('post');

  const seriesRows = await prisma.series.findMany({
    where: { slug: null },
    select: { id: true, title: true },
    orderBy: { createdAt: 'asc' }
  });
  const postRows = await prisma.post.findMany({
    where: { slug: null },
    select: { id: true, title: true },
    orderBy: { createdAt: 'asc' }
  });

  console.log(
    `대상: 시리즈 ${seriesRows.length}건, 글 ${postRows.length}건` +
      (isDryRun ? '   [DRY RUN — DB를 바꾸지 않습니다]' : '   [실제 반영]')
  );
  console.log('');

  for (const row of seriesRows) {
    const slug = await assign(row.title, 'series', takenSeries);
    console.log(`[series] ${row.title}\n         → ${slug}`);
    if (!isDryRun) {
      await prisma.series.update({ where: { id: row.id }, data: { slug } });
    }
  }

  if (seriesRows.length) console.log('');

  for (const row of postRows) {
    const slug = await assign(row.title, 'post', takenPosts);
    console.log(`[post]   ${row.title}\n         → ${slug}`);
    if (!isDryRun) {
      await prisma.post.update({ where: { id: row.id }, data: { slug } });
    }
  }

  console.log('');
  console.log(
    isDryRun
      ? '✅ dry-run 완료 — DB는 변경되지 않았습니다.'
      : '✅ 백필 완료'
  );
}

main()
  .catch(e => {
    console.error('❌ 백필 실패:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
