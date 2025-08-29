import * as React from 'react';

export function PostPreview({
  post,
  onClick
}: {
  post: {
    id: string;
    title: string;
    subtitle: string;
    createdAt: string;
    isPublished: boolean;
  };
  onClick: () => void;
}) {
  const { title, subtitle, createdAt, isPublished } = post;
  return (
    <div
      className={`flex w-full flex-col justify-between border-b p-4 hover:cursor-pointer hover:bg-neutral-100 ${!isPublished ? 'opacity-40' : ''}`}
      onClick={onClick}>
      <div className="mb-2 flex items-baseline justify-between gap-4 text-lg">
        <div className="flex-1 min-w-0 text-xl font-bold">
          {!isPublished && (
            <div className="mr-2 inline-block rounded-md border border-neutral-800 bg-neutral-200 px-2 py-[1px] text-sm">
              작성중
            </div>
          )}
          <span className="inline-block max-w-full truncate align-baseline">{title}</span>
        </div>
        <span className="text-sm min-w-[88px]">{createdAt}</span>
      </div>
      <div className="text-md">{subtitle}</div>
    </div>
  );
}
