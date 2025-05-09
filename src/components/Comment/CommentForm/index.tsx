'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createComment } from '@/lib/api/comments';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ExtendedSession } from '@/types';
import { LoaderCircle } from 'lucide-react';

const CommentForm = ({
  postId,
  session
}: {
  postId: string;
  session: ExtendedSession | null;
}) => {
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const onSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    const response = await createComment({
      content,
      postId,
      userId: session?.user?.id as string,
      userName: session?.user?.name as string,
      userImage: session?.user?.image as string
    });

    if (response.success) {
      setContent('');
      queryClient.invalidateQueries({
        queryKey: ['comments', postId]
      });
    } else {
      console.error('❌ 댓글 등록 실패:', response.error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex h-[60px] gap-4 py-2">
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <Button
        variant="outline"
        className="h-[60px] text-neutral-500"
        onClick={onSubmit}>
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : '등록'}
      </Button>
    </div>
  );
};

export default CommentForm;
