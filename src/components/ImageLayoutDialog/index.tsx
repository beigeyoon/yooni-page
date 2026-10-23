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
import { getLayout, getLayoutsByCount, type LayoutCount } from '@/utils/imageLayouts';
import LayoutPicker from './LayoutPicker';
import SlotCell, { type SlotItem } from './SlotCell';
import { isImageFile, placeItems, resizeSlots, swapSlots, type Slots } from './slots';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (urls: string[], layoutId: string) => void;
}

const DEFAULT_COUNT: LayoutCount = 2;
const firstLayoutId = (count: LayoutCount) => getLayoutsByCount(count)[0].id;

export default function ImageLayoutDialog({ open, onOpenChange, onInsert }: Props) {
  const [count, setCount] = useState<LayoutCount>(DEFAULT_COUNT);
  const [layoutId, setLayoutId] = useState(firstLayoutId(DEFAULT_COUNT));
  const [slots, setSlots] = useState<Slots<SlotItem>>(() => resizeSlots([], DEFAULT_COUNT));
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

  const handleFiles = (index: number, files: File[]) => {
    const items = files.filter(isImageFile).map(file => ({ file, status: 'idle' as const }));
    if (items.length === 0) return;
    setSlots(prev => placeItems(prev, index, items));
  };

  const updateSlot = (index: number, patch: Partial<SlotItem>) =>
    setSlots(prev => prev.map((slot, i) => (i === index && slot ? { ...slot, ...patch } : slot)));

  // 이미 올라간 칸은 URL을 재사용하고, 나머지만 병렬로 올린다.
  const handleInsert = async () => {
    setIsUploading(true);
    const urls = await Promise.all(
      slots.map(async (slot, index) => {
        if (!slot) return null;
        if (slot.url) return slot.url;

        updateSlot(index, { status: 'uploading', error: undefined });
        const result = await uploadImage(slot.file);
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
    onInsert(urls as string[], layoutId);
    reset();
    onOpenChange(false);
  };

  const isComplete = slots.every(Boolean);
  const hasError = slots.some(slot => slot?.status === 'error');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        // 칸 밖에 떨어뜨린 파일을 브라우저가 열어버리지 않게 막는다.
        onDragOver={event => event.preventDefault()}
        onDrop={event => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>이미지 배치</DialogTitle>
          <DialogDescription>
            레이아웃을 고르고 각 칸에 사진을 끌어다 놓으세요. 칸끼리 끌면 자리가 바뀝니다.
          </DialogDescription>
        </DialogHeader>
        <LayoutPicker
          count={count}
          layoutId={layoutId}
          disabled={isUploading}
          onCountChange={handleCountChange}
          onLayoutChange={setLayoutId}
        />
        <div className="image-album" data-layout={layoutId}>
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
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button type="button" disabled={!isComplete || isUploading} onClick={handleInsert}>
            {isUploading ? '업로드 중…' : hasError ? '다시 시도' : '삽입'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
