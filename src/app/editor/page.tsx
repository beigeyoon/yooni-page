'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import TiptapEditor from '@/components/TiptapEditor';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createPost, updatePost } from '@/lib/api/posts';
import { PostFormValues as FormValues } from '@/types';
import {
  useQuery,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { getPost } from '@/lib/api/posts';
import { Post } from '@/types';

const queryClient = new QueryClient();

const Editor = () => {
  const { isAdmin, status, session } = useAuth();
  const router = useRouter();
  const editorRef = useRef<{ getEditorContent: () => string } | null>(null);

  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEditMode = !!id;

  const { data: post } = useQuery({
    queryKey: ['posts', id],
    enabled: !!id,
    queryFn: () => getPost(id!) as Promise<{ data: { data: Post } }>,
    select: (data: { data: { data: Post } }) => data.data.data as Post
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !isAdmin) router.push('/');
  }, [isAdmin, router, status]);

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      title: post?.title || '',
      subtitle: post?.subtitle || '',
      category: post?.category || undefined,
      isPublished: post?.isPublished || false
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: FormValues, event: any) => {
    const content = editorRef.current?.getEditorContent() || '';

    if (content.length === 0 || content.trim() === '<p></p>') {
      setError('content', { message: '컨텐츠 내용을 입력하세요.' });
      return;
    }
    clearErrors();

    const clickedButton = event.nativeEvent.submitter.value;

    const payload = {
      ...data,
      content,
      userId: session?.user?.id as string,
      isPublished: clickedButton === 'publish'
    };

    const response = isEditMode
      ? await updatePost({ ...payload, id: post?.id })
      : await createPost(payload);
    if (response.success) {
      router.push('/');
    } else {
      console.error('❌ 게시글 업로드 실패:', response.error);
    }
  };

  if (!isAdmin) return <></>;
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex gap-12">
      <section className="flex-1">
        <TiptapEditor
          ref={editorRef}
          register={register}
          content={post?.content || ''}
        />
      </section>
      <section className="flex flex-col gap-4">
        <Controller
          name="category"
          control={control}
          rules={{ required: '카테고리를 선택하세요.' }}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="DEV">DEV</SelectItem>
                  <SelectItem value="TRAVEL">TRAVEL</SelectItem>
                  <SelectItem value="TALK">TALK</SelectItem>
                  <SelectItem value="PHOTO">PHOTO</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        <Button
          value="save"
          type="submit"
          variant="outline">
          임시저장
        </Button>
        <Button
          value="publish"
          type="submit">
          작성완료
        </Button>
        <div className="flex flex-col gap-2 text-red-500">
          {Object.keys(errors).map(key => (
            <Label key={key}>{errors[key as keyof FormValues]?.message}</Label>
          ))}
        </div>
      </section>
    </form>
  );
};

const EditorWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Editor />
    </QueryClientProvider>
  );
};

export default EditorWrapper;
