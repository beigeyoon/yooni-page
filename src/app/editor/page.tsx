'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
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
import { createPost } from '@/lib/api/posts';
import { PostFormValues as FormValues } from '@/types';

export default function Editor() {
  const { isAdmin, status } = useAuth();
  const router = useRouter();
  const editorRef = useRef<{ getEditorContent: () => string } | null>(null);

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
      title: '',
      subtitle: '',
      category: undefined,
      isPublished: false
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

    // userId 수정 필요
    const payload = {
      ...data,
      content,
      userId: '32e5b74b-4dc8-47de-b464-a6c7f90d7c9b',
      isPublished: clickedButton === 'publish'
    };

    const response = await createPost(payload);
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
      className="flex gap-12 p-8">
      <section className="flex-1">
        <TiptapEditor
          ref={editorRef}
          register={register}
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
                  <SelectItem value="TRAVEL">TRAVEL</SelectItem>
                  <SelectItem value="DEV">DEV</SelectItem>
                  <SelectItem value="PROJECT">PROJECT</SelectItem>
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
}
