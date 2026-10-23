'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Button } from '../ui/button';
import uploadImage from '@/utils/uploadImage';
import compressImage from '@/utils/compressImage';
import {
  getLayout,
  getLayoutsByCount,
  type LayoutCount
} from '@/utils/imageLayouts';
import LayoutPicker from './LayoutPicker';
import SlotCell, { type SlotItem } from './SlotCell';
import {
  isImageFile,
  placeItems,
  resizeSlots,
  swapSlots,
  type Slots
} from './slots';

export type InsertedImage = { src: string; alt: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (images: InsertedImage[], layoutId: string) => void;
}

const DEFAULT_COUNT: LayoutCount = 1;
const firstLayoutId = (count: LayoutCount) => getLayoutsByCount(count)[0].id;

export default function ImageLayoutDialog({
  open,
  onOpenChange,
  onInsert
}: Props) {
  const [count, setCount] = useState<LayoutCount>(DEFAULT_COUNT);
  const [layoutId, setLayoutId] = useState(firstLayoutId(DEFAULT_COUNT));
  const [slots, setSlots] = useState<Slots<SlotItem>>(() =>
    resizeSlots([], DEFAULT_COUNT)
  );
  const [isUploading, setIsUploading] = useState(false);
  const layout = getLayout(layoutId)!;

  const reset = () => {
    setCount(DEFAULT_COUNT);
    setLayoutId(firstLayoutId(DEFAULT_COUNT));
    setSlots(resizeSlots([], DEFAULT_COUNT));
  };

  const handleOpenChange = (next: boolean) => {
    if (isUploading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCountChange = (next: LayoutCount) => {
    setCount(next);
    setLayoutId(firstLayoutId(next));
    setSlots(prev => resizeSlots(prev, next));
  };

  const updateSlot = (index: number, patch: Partial<SlotItem>) =>
    setSlots(prev =>
      prev.map((slot, i) =>
        i === index && slot ? { ...slot, ...patch } : slot
      )
    );

  // 변환은 비동기라 끝날 즈음엔 칸 자리가 바뀌었을 수 있다. 칸 번호 대신 원본 파일로 찾는다.
  const updateByFile = (file: File, patch: Partial<SlotItem>) =>
    setSlots(prev =>
      prev.map(slot => (slot?.file === file ? { ...slot, ...patch } : slot))
    );

  const compress = async (file: File): Promise<File | null> => {
    try {
      const compressed = await compressImage(file);
      updateByFile(file, { compressed, status: 'idle', error: undefined });
      return compressed;
    } catch (error) {
      console.error('❌ 이미지 변환 실패:', error);
      updateByFile(file, {
        status: 'error',
        error: '이미지를 읽을 수 없습니다.'
      });
      return null;
    }
  };

  // 놓는 순간 변환해서, 미리보기와 업로드가 같은 결과를 쓰게 한다.
  const handleFiles = (index: number, files: File[]) => {
    const images = files.filter(isImageFile);
    if (images.length === 0) return;
    setSlots(prev =>
      placeItems(
        prev,
        index,
        images.map(file => ({ file, status: 'converting' as const }))
      )
    );
    images.forEach(compress);
  };

  // 이미 올라간 칸은 URL을 재사용하고, 나머지만 병렬로 올린다.
  // 변환에 실패했던 칸은 여기서 다시 변환한다.
  const handleInsert = async () => {
    setIsUploading(true);
    const urls = await Promise.all(
      slots.map(async (slot, index) => {
        if (!slot) return null;
        if (slot.url) return slot.url;

        const compressed = slot.compressed ?? (await compress(slot.file));
        if (!compressed) return null;

        updateSlot(index, { status: 'uploading', error: undefined });
        const result = await uploadImage(compressed);
        if ('url' in result) {
          updateSlot(index, { status: 'done', url: result.url });
          return result.url;
        }
        updateSlot(index, { status: 'error', error: result.error });
        return null;
      })
    );
    setIsUploading(false);

    if (urls.some(url => url === null)) return;
    onInsert(
      urls.map((url, index) => ({
        src: url as string,
        alt: slots[index]?.alt?.trim() ?? ''
      })),
      layoutId
    );
    reset();
    onOpenChange(false);
  };

  const isComplete = slots.every(slot => slot && slot.status !== 'converting');
  const hasError = slots.some(slot => slot?.status === 'error');

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        // 칸 밖에 떨어뜨린 파일을 브라우저가 열어버리지 않게 막는다.
        onDragOver={event => event.preventDefault()}
        onDrop={event => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>이미지 배치</DialogTitle>
          <DialogDescription>
            레이아웃을 고르고 각 칸에 사진을 끌어다 놓으세요. 칸끼리 끌면 자리가
            바뀝니다.
          </DialogDescription>
        </DialogHeader>
        <LayoutPicker
          count={count}
          layoutId={layoutId}
          disabled={isUploading}
          onCountChange={handleCountChange}
          onLayoutChange={setLayoutId}
        />
        <div
          className="image-album"
          data-layout={layoutId}>
          {layout.cells.map((ratio, index) => (
            <SlotCell
              key={index}
              index={index}
              ratio={ratio}
              item={slots[index]}
              disabled={isUploading}
              onFiles={handleFiles}
              onSwap={(from, to) => setSlots(prev => swapSlots(prev, from, to))}
            />
          ))}
        </div>
        {/* 입력란을 칸 안에 두면 칸의 클릭(파일 선택)·드래그와 부딪혀서 밖에 둔다.
            설명은 칸의 SlotItem에 들어 있어 자리를 바꾸면 사진을 따라간다. */}
        {slots.some(Boolean) && (
          <div className="flex flex-col gap-2">
            {slots.map((slot, index) =>
              slot ? (
                <label
                  key={index}
                  className="flex items-center gap-2 text-sm text-neutral-600">
                  <span className="shrink-0">사진 {index + 1} 설명</span>
                  <input
                    type="text"
                    data-alt-for={index}
                    value={slot.alt ?? ''}
                    disabled={isUploading}
                    placeholder="비워두면 글 제목으로 채워져요"
                    onChange={event =>
                      updateSlot(index, { alt: event.target.value })
                    }
                    className="w-full rounded border border-neutral-300 px-2 py-1 text-neutral-800"
                  />
                </label>
              ) : null
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button
            type="button"
            disabled={!isComplete || isUploading}
            onClick={handleInsert}>
            {isUploading ? '업로드 중…' : hasError ? '다시 시도' : '삽입'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
