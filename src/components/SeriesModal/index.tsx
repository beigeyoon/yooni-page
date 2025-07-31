'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createSeries, updateSeries, SeriesPayload } from '@/lib/api/series';
import { useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SeriesModalProps {
  trigger: React.ReactNode;
  series?: {
    id: string;
    title: string;
    description?: string;
    category: string;
  };
  onSuccess?: () => void;
}

export default function SeriesModal({ trigger, series, onSuccess }: SeriesModalProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<SeriesPayload>({
    defaultValues: {
      title: series?.title || '',
      description: series?.description || '',
      category: series?.category || 'dev'
    }
  });

  const onSubmit = async (data: SeriesPayload) => {
    try {
      if (series) {
        await updateSeries({ ...data, id: series.id });
      } else {
        await createSeries(data);
      }
      
      // 쿼리 무효화 개선
      await queryClient.invalidateQueries({ queryKey: ['series'] });
      await queryClient.refetchQueries({ queryKey: ['series'] });
      
      setOpen(false);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('시리즈 저장 실패:', error);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {series ? '시리즈 수정' : '새 시리즈 만들기'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              {...register('title', { required: '제목을 입력하세요' })}
              placeholder="시리즈 제목을 입력하세요"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Controller
              name="category"
              control={control}
              rules={{ required: '카테고리를 선택하세요' }}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
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
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택사항)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="시리즈에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit">
              {series ? '수정' : '생성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 