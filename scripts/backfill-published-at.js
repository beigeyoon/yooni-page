// 게시 상태인데 publishedAt이 비어 있는 글에 createdAt을 채운다.
// publishedAt 컬럼을 추가한 시점(2026-09-08) 이전 글은 게시 시각 기록이 없어 createdAt이 최선의 근사값이다.
// 컬럼 추가와 코드 배포 사이에 게시된 글도 같은 처리를 받으므로, 배포 직후 한 번 더 실행한다.
// 멱등이라 여러 번 실행해도 안전하다.
//
// 실행: node --env-file=.env.development scripts/backfill-published-at.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.post.count({
    where: { isPublished: true, publishedAt: null }
  });
  console.log(`백필 대상: ${pending}건`);

  if (pending > 0) {
    const updated = await prisma.$executeRaw`
      UPDATE "post"
      SET "publishedAt" = "createdAt"
      WHERE "isPublished" = true AND "publishedAt" IS NULL
    `;
    console.log(`업데이트: ${updated}건`);
  }

  const [published, filled, drafts] = await Promise.all([
    prisma.post.count({ where: { isPublished: true } }),
    prisma.post.count({ where: { isPublished: true, publishedAt: { not: null } } }),
    prisma.post.count({ where: { isPublished: false } })
  ]);
  console.log(`게시글 ${published}건 중 publishedAt 있음 ${filled}건, 초안 ${drafts}건`);
}

main()
  .catch(e => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
