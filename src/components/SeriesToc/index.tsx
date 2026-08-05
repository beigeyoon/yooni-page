import Link from 'next/link';
import { Post, Series } from '@/types';

export default function SeriesToc({
  series,
  posts,
  currentPostId
}: {
  series: Pick<Series, 'id' | 'slug' | 'title' | 'category'>;
  posts: Pick<Post, 'id' | 'slug' | 'title'>[];
  currentPostId: string;
}) {
  if (posts.length === 0) return null;

  return (
    <nav
      aria-label="시리즈 목차"
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Series
      </p>
      <Link
        href={`/${series.category}/series/${series.slug}`}
        className="text-lg font-bold text-neutral-800 hover:underline">
        {series.title}
      </Link>
      <ol className="mt-4 flex flex-col gap-1">
        {posts.map((post, index) => {
          const isCurrent = post.id === currentPostId;
          return (
            <li
              key={post.id}
              className="flex gap-2 text-sm">
              <span className="min-w-[1.5rem] text-neutral-400">
                {index + 1}.
              </span>
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="font-bold text-neutral-900">
                  {post.title}
                </span>
              ) : (
                <Link
                  href={`/${series.category}/${post.slug}`}
                  className="text-neutral-600 hover:text-neutral-900 hover:underline">
                  {post.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
