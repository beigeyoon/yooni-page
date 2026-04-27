'use client';

import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  summary: string;
  imgHref: string;
  detail: {
    description: string[];
    links?: {
      title: string;
      src: string;
    }[];
  };
}

export default function ProjectModal({
  open,
  onOpenChange,
  title,
  summary,
  imgHref,
  detail,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] w-[calc(100vw-32px)] max-w-[960px] gap-0 overflow-y-auto rounded-[10px] p-0 sm:rounded-[10px]">
        <div className="grid grid-cols-1 sm:grid-cols-4">
          <div className="h-[280px] bg-neutral-100 p-6 sm:col-span-3 sm:h-[480px]">
            <div className="relative h-full w-full">
              <Image
                src={imgHref}
                alt={`${title} 프로젝트 이미지`}
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 p-6 sm:col-span-1">
            <DialogHeader>
              <DialogTitle className="text-xl text-neutral-900">
                {title}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs font-bold text-neutral-700">
              {summary}
            </DialogDescription>
            <div className="flex flex-col gap-2">
              {detail.description.map((item, idx) => (
                <div
                  key={idx}
                  className="text-sm text-neutral-600">
                  - {item}
                </div>
              ))}
              {detail.links?.map((item, idx) => (
                <div
                  key={idx}
                  className="text-sm font-bold text-neutral-600">
                  <a
                    href={item.src}
                    target="_blank"
                    rel="noopener noreferrer">
                    - {item.title}{' '}
                    <ExternalLink className="inline-block h-[12px] w-[12px] align-baseline" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
