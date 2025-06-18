import { Spinner } from '@/components/Loading/Spinner';
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
    return <Spinner />;
  }
  if (!comments || comments.length === 0) {
    return null;
  }
  return (
    <>
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
