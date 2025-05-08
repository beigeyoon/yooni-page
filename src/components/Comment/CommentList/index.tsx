import { Loading } from '@/components/Loading';
import CommentItem from './CommentItem';
import { Comment, ExtendedSession } from '@/types';

const CommentList = ({
  comments,
  isLoading,
  session
}: {
  comments: Comment[] | undefined;
  isLoading: boolean;
  session: ExtendedSession | null;
}) => {
  if (isLoading) {
    return <Loading />;
  }
  if (!comments || comments.length === 0) {
    return null;
  }
  return (
    <>
      <div className="py-2 text-lg font-bold">Comments ({comments.length})</div>
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          session={session}
        />
      ))}
    </>
  );
};

export default CommentList;
