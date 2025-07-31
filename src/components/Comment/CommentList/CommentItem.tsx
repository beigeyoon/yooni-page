import { Comment, ExtendedSession } from '@/types';
import handleTimeStirng from '@/utils/handleTimeStirng';
import Image from 'next/image';
import { deleteComment } from '@/lib/api/comments';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteButton } from '@/components/DeleteButton';

const CommentItem = ({
  comment,
  session
}: {
  comment: Comment;
  session: ExtendedSession | null;
}) => {
  const queryClient = useQueryClient();

  const onDeleteComment = async () => {
    if (session?.user?.id !== comment.userId) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    const response = await deleteComment(comment.id);
    if (response.message) {
      queryClient.invalidateQueries({
        queryKey: ['comments', comment.postId]
      });
    } else {
      console.error('❌ 댓글 삭제 실패:', response.error);
    }
  };
  return (
    <div className="flex flex-col gap-2 border-t border-gray-200 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src={comment.userImage || ''}
            alt="user-image"
            width={28}
            height={28}
            className="rounded-full"
          />
          <div className="text-sm font-bold">{comment.userName}</div>
        </div>
        {session?.user?.id === comment.userId && (
          <DeleteButton confirmDelete={onDeleteComment} />
        )}
      </div>
      <div className="flex justify-between">
        <div className="pl-1 text-sm text-gray-700">{comment.content}</div>
        <div className="min-w-[90px] text-sm text-neutral-400">
          {handleTimeStirng(comment.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
