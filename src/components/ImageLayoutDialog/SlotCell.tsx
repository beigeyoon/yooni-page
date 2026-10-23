'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CellRatio } from '@/utils/imageLayouts';

// 칸끼리 자리를 바꿀 때 쓰는 드래그 타입. 파인더에서 끌어온 파일과 구분한다.
export const SLOT_DRAG_TYPE = 'application/x-image-slot';

export type SlotItem = {
  file: File;
  status: 'idle' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
};

interface Props {
  index: number;
  ratio: CellRatio;
  item: SlotItem | null;
  disabled: boolean;
  onFiles: (index: number, files: File[]) => void;
  onSwap: (from: number, to: number) => void;
}

function useObjectUrl(file: File | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

export default function SlotCell({
  index,
  ratio,
  item,
  disabled,
  onFiles,
  onSwap
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = useObjectUrl(item?.file);

  // Chrome은 HEIC를 미리보기로 그리지 못한다. 그때는 파일 이름을 보여준다.
  useEffect(() => setPreviewFailed(false), [previewUrl]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOver(false);
    if (disabled) return;

    const from = event.dataTransfer.getData(SLOT_DRAG_TYPE);
    if (from !== '') {
      onSwap(Number(from), index);
      return;
    }
    onFiles(index, Array.from(event.dataTransfer.files));
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      data-slot={index}
      draggable={!!item && !disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={event => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragStart={event => {
        event.dataTransfer.setData(SLOT_DRAG_TYPE, String(index));
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={event => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        'relative flex cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-400',
        item && 'border-solid border-transparent',
        isOver && 'border-blue-500 bg-blue-50',
        // globals.css의 [data-layout] > * { min-height: 0 }에 지지 않도록 min-height가 아닌 height로 준다.
        ratio === 'original' && !item && 'h-60',
        disabled && 'cursor-default'
      )}>
      {item && previewUrl && !previewFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          draggable={false}
          onError={() => setPreviewFailed(true)}
          className="pointer-events-none"
        />
      ) : item ? (
        <span className="break-all px-2 text-neutral-600">
          {item.file.name}
        </span>
      ) : (
        <span>+ 사진 놓기</span>
      )}
      {item?.status === 'uploading' && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 className="animate-spin text-neutral-600" />
        </span>
      )}
      {item?.status === 'error' && (
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-red-600/90 px-1.5 py-0.5 text-xs text-white">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {item.error}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onClick={event => event.stopPropagation()}
        onChange={event => {
          onFiles(index, Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
    </div>
  );
}
