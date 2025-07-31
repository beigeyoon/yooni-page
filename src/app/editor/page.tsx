'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { getPost } from '@/lib/api/posts';
import { getSeries, Series } from '@/lib/api/series';
import { Post } from '@/types';
import dynamic from 'next/dynamic';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';
import PageReady from '@/components/Loading/PageReady';
import SeriesModal from '@/components/SeriesModal';
import { Plus } from 'lucide-react';

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), {
  ssr: false
});

const Editor = () => {
  const { isAdmin, status, session } = useAuth();
  const router = useRouteWithLoading();
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

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      title: post?.title || '',
      subtitle: post?.subtitle || '',
      category: post?.category || undefined,
      seriesId: post?.seriesId || undefined,
      isPublished: post?.isPublished || false
    }
  });

  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries
  });

  // 시리즈 목록 추출 (선택된 카테고리에 해당하는 것만)
  const selectedCategory = watch('category');
  const filteredSeriesList = Array.isArray(seriesData?.data) 
    ? seriesData.data.filter((series: Series) => series.category === selectedCategory)
    : [];

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !isAdmin) router.push('/');
  }, [isAdmin, router, status]);

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        subtitle: post.subtitle,
        category: post.category,
        seriesId: post.seriesId || undefined,
        isPublished: post.isPublished
      });
    }
  }, [post, reset]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: FormValues, event: any) => {
    if (!event.nativeEvent.submitter) return;
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
    <>
      <PageReady />
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
                key={field.value}
                onValueChange={field.onChange}
                value={field.value}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="dev">dev</SelectItem>
                    <SelectItem value="travel">travel</SelectItem>
                    <SelectItem value="talk">talk</SelectItem>
                    <SelectItem value="photo">photo</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <Controller
            name="seriesId"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Select
                  key={field.value}
                  onValueChange={field.onChange}
                  value={field.value || ""}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Series" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {seriesLoading ? (
                        <SelectItem value="loading" disabled>로딩 중...</SelectItem>
                      ) : filteredSeriesList.length > 0 ? (
                        filteredSeriesList.map((series: Series) => (
                          <SelectItem key={series.id} value={series.id}>
                            {series.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-data" disabled>시리즈 없음</SelectItem>
                      )}
                    </SelectGroup>
                    <div className="border-t pt-2 mt-2">
                      <SeriesModal
                        trigger={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            새 시리즈
                          </Button>
                        }
                      />
                    </div>
                  </SelectContent>
                </Select>
              </div>
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
              <Label key={key}>
                {errors[key as keyof FormValues]?.message}
              </Label>
            ))}
          </div>
        </section>
      </form>
    </>
  );
};

const DynamicEditor = dynamic(() => Promise.resolve(Editor), {
  ssr: false
});

export default DynamicEditor;
