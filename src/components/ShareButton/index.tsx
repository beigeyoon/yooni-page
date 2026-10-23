'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const TOOLTIP_DURATION = 3000;

const COPIED_MESSAGE = '링크가 복사되었습니다!';
const FAILED_MESSAGE = '링크를 복사하지 못했습니다.';

// 클립보드 API는 HTTPS가 아니거나 권한이 막히면 실패한다. 그때는 예전 방식으로 한 번 더 시도한다.
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }
}

export function ShareButton() {
  // 사라지는 동안에도 문구가 남아 있어야 상자가 줄어들지 않는다. 그래서 문구는 지우지 않는다.
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleShare = async () => {
    // 유입 경로 쿼리(utm 등)와 해시는 공유 링크에 남기지 않는다.
    const url = `${window.location.origin}${window.location.pathname}`;
    const copied = await copyText(url);

    setMessage(copied ? COPIED_MESSAGE : FAILED_MESSAGE);
    setIsVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsVisible(false), TOOLTIP_DURATION);
  };

  return (
    <div className="relative flex">
      <Button
        variant="ghost"
        aria-label="링크 복사"
        className="h-fit cursor-pointer px-2 py-1 text-neutral-500 hover:text-neutral-700"
        onClick={handleShare}>
        <Share2 width={18} />
      </Button>
      {/* 화면 오른쪽 끝에 있어 버튼 오른쪽에 맞춰 붙인다. 꼬리는 버튼 가운데를 가리킨다. */}
      <div
        role="status"
        aria-live="polite"
        data-visible={isVisible}
        className={cn(
          'pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white shadow-md transition-all duration-300 ease-out',
          "before:absolute before:-top-1 before:right-[13px] before:h-2 before:w-2 before:rotate-45 before:bg-neutral-800 before:content-['']",
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
        )}>
        {message}
      </div>
    </div>
  );
}
