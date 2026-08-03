import Link from 'next/link';
import { Post } from '@/types';
import handleTimeStirng from '@/utils/handleTimeStirng';

const CATEGORY_LABELS: Record<string, string> = {
  dev: '개발',
  travel: '여행',
  talk: '얘기'
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
    <div className="flex-1">
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
                href={`/${category}/${post.id}`}
                className="flex w-full items-center justify-between gap-2 px-4 py-2 hover:bg-zinc-100">
                <span className="overflow-hidden truncate whitespace-nowrap font-semibold max-sm:max-w-[230px] md:max-w-[170px]">
                  {post.title}
                </span>
                <span className="text-[10px] sm:min-w-[82px]">
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
