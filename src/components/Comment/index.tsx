'use client';

import CommentList from './CommentList';
import CommentFrom from './CommentForm';
import { useQuery } from '@tanstack/react-query';
import { getComments } from '@/lib/api/comments';
import { Comment as CommentType, ExtendedSession } from '@/types';

const Comment = ({
  postId,
  session,
  status
}: {
  postId: string;
  session: ExtendedSession | null;
  status: 'authenticated' | 'loading' | 'unauthenticated';
}) => {
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () =>
      getComments(postId) as Promise<{ data: { data: CommentType[] } }>,
    select: (data: { data: { data: CommentType[] } }) =>
      data.data.data as CommentType[]
  });

  return (
    <div>
      <div className="py-2 text-lg font-bold">Comments</div>
      <CommentList
        comments={comments}
        isLoading={isLoading}
        session={session}
      />
      <CommentFrom
        postId={postId}
        session={session}
        status={status}
      />
    </div>
  );
};

export default Comment;
