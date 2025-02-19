'use client';

import { useCallback, useEffect, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { CircleCheck } from 'lucide-react';

interface Props {
  trigger: React.ReactNode;
  textToCopy: string;
}

export default function CopyButton({ trigger, textToCopy }: Props) {
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);

  useEffect(() => {
    if (popoverOpen) {
      const timer = setTimeout(() => {
        setPopoverOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [popoverOpen]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setPopoverOpen(true);
    } catch (error) {
      console.error('클립보드 복사 실패: ', error);
    }
  }, [textToCopy]);

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}>
      <PopoverTrigger onClick={handleCopy}>{trigger}</PopoverTrigger>
      <PopoverContent
        sideOffset={10}
        className="flex w-fit items-center gap-1 p-2 text-xs text-sky-800">
        <CircleCheck size={14} />
        복사되었습니다!
      </PopoverContent>
    </Popover>
  );
}
