'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProjectModal from '@/components/ProjectModal';

interface Props {
  content: {
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
  };
}

export default function ProjectCard({ content }: Props) {
  const [open, setOpen] = useState(false);
  const { title, summary, imgHref, detail } = content;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-[400px] flex-col justify-between overflow-hidden rounded-lg border border-neutral-300 text-left transition-transform duration-300 hover:scale-105">
        <div className="h-[280px] w-full shrink-0 overflow-hidden bg-neutral-100 p-4">
          <div className="relative h-full w-full">
            <Image
              src={imgHref}
              alt={`${title} 프로젝트 이미지`}
              fill
              style={{ objectFit: 'contain' }}
              className="grayscale transition-all duration-300 group-hover:grayscale-0"
            />
          </div>
        </div>
        <div className="p-6">
          <h1 className="mb-3 text-xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-600">{summary}</p>
        </div>
      </button>
      <ProjectModal
        open={open}
        onOpenChange={setOpen}
        title={title}
        summary={summary}
        imgHref={imgHref}
        detail={detail}
      />
    </>
  );
}
