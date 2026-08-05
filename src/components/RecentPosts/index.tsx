import Link from 'next/link';
import { Post } from '@/types';
import handleTimeStirng from '@/utils/handleTimeStirng';

const CATEGORY_LABELS: Record<string, string> = {
  dev: '개발',
  travel: '여행',
  talk: '이야기'
};

export function RecentPosts({
  category,
  posts
}: {
  category: string;
  posts: Post[];
}) {
  const filteredPosts = posts?.filter(post => post.isPublished) ?? [];

  return (
    // min-w-0이 없으면 flex 아이템이 min-width:auto라 내용보다 작아지지 못해
    // 열이 컨테이너 밖으로 밀려난다. 표를 목록으로 바꾸면서 필요해진 부분이다.
    <div className="min-w-0 flex-1">
      <h3 className="border-b border-b-zinc-400 px-4 py-3 text-[16px] font-medium">
        {CATEGORY_LABELS[category] ?? ''}
      </h3>
      {filteredPosts.length === 0 ? (
        <p className="py-6 text-center">최근 포스트가 없습니다.</p>
      ) : (
        <ul>
          {filteredPosts.map(post => (
            <li key={post.id}>
              <Link
                href={`/${category}/${post.slug}`}
                className="flex w-full items-baseline gap-2 px-4 py-2 hover:bg-zinc-100">
                {/* 제목은 남는 폭을 차지하되 줄어들 수 있어야 하고, 날짜는 줄어들면 안 된다 */}
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {post.title}
                </span>
                <span className="shrink-0 text-[10px]">
                  {handleTimeStirng(post.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
