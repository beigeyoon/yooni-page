import Link from 'next/link';
import { Post } from '@/types';

type NavPost = Pick<Post, 'id' | 'slug' | 'title' | 'category'>;

export default function SeriesNav({
  prevPost,
  nextPost,
  prevLabel = '이전 글',
  nextLabel = '다음 글'
}: {
  prevPost: NavPost | null;
  nextPost: NavPost | null;
  prevLabel?: string;
  nextLabel?: string;
}) {
  return (
    <nav
      aria-label="글 이동"
      className="flex justify-between gap-4 py-12 text-sm text-neutral-400">
      {prevPost ? (
        <Link
          href={`/${prevPost.category}/${prevPost.slug}`}
          className="hover:text-neutral-700">
          ← {prevLabel}: {prevPost.title}
        </Link>
      ) : (
        <span />
      )}

      {nextPost ? (
        <Link
          href={`/${nextPost.category}/${nextPost.slug}`}
          className="text-right hover:text-neutral-700">
          {nextLabel}: {nextPost.title} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
