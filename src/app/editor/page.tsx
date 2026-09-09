'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import Link from '@/components/AppLink';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { createPost, getPostForPreview, updatePost } from '@/lib/api/posts';
import { PostFormValues as FormValues } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { getSeries } from '@/lib/api/series';
import { Post, Series } from '@/types';
import dynamic from 'next/dynamic';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';
import PageReady from '@/components/Loading/PageReady';
import { Spinner } from '@/components/Loading/Spinner';
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

  const { data: post, isPending: postPending } = useQuery({
    queryKey: ['posts', id],
    enabled: !!id,
    queryFn: () => getPostForPreview(id!),
    select: (data: { data: Post }) => data.data,
    // 에디터는 최초 content만 반영하므로 캐시된 이전 본문으로 시작하면 안 된다.
    // 이 화면을 떠나는 즉시 캐시를 버려 다시 들어올 때마다 새로 조회한다.
    staleTime: 0,
    gcTime: 0
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
      seriesOrder: post?.seriesOrder ?? undefined,
      isPublished: post?.isPublished || false
    }
  });

  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries
  });

  // 시리즈 목록 추출 (선택된 카테고리에 해당하는 것만)
  const selectedCategory = watch('category');
  const selectedSeriesId = watch('seriesId');
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
        seriesOrder: post.seriesOrder ?? undefined,
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

    try {
      const response = isEditMode
        ? await updatePost({ ...payload, id: post?.id })
        : await createPost(payload);
      if (response.message) {
        router.push('/');
      }
    } catch (error) {
      console.error('❌ 게시글 업로드 실패:', error);
      alert(error instanceof Error ? error.message : '게시글 저장에 실패했습니다.');
    }
  };

  if (!isAdmin) return <></>;
  // tiptap은 content를 에디터 생성 시점에만 읽는다. 글이 도착하기 전에 에디터를 만들면
  // 나중에 온 본문이 버려지므로, 편집 모드에서는 글 조회가 끝난 뒤에만 폼을 렌더링한다.
  // isPending은 오프라인으로 멈춘(paused) 동안에도 true라 그때도 로딩으로 보여 준다.
  if (isEditMode && postPending) return <Spinner />;
  if (isEditMode && !post) {
    return (
      <p className="pt-10 text-center text-red-500">
        게시글을 불러오지 못했습니다.
      </p>
    );
  }
  return (
    <>
      <PageReady />
      <div className="mx-auto mb-6 flex max-w-[980px] justify-end">
        <Button
          asChild
          variant="outline">
          <Link href="/admin">관리자</Link>
        </Button>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex gap-12 justify-center">
        <section className="flex-1 max-w-[780px]">
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
          {selectedSeriesId && (
            <div className="space-y-1">
              <Label htmlFor="seriesOrder" className="text-sm text-neutral-600">
                시리즈 순번
              </Label>
              <Input
                id="seriesOrder"
                type="number"
                min={1}
                step={1}
                placeholder="1"
                className="w-[140px]"
                {...register('seriesOrder', {
                  setValueAs: value => {
                    if (value === '' || value === null || value === undefined) return null;
                    const num = Number(value);
                    return Number.isFinite(num) ? Math.round(num) : null;
                  }
                })}
              />
            </div>
          )}
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
