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
        <span className="text-xl font-bold">
          {!isPublished && (
            <div className="mr-2 inline-block rounded-md border border-neutral-800 bg-neutral-200 px-2 py-[1px] text-sm">
              작성중
            </div>
          )}
          {title}
        </span>
        <span className="text-sm">{createdAt}</span>
      </div>
      <div className="text-md">{subtitle}</div>
    </div>
  );
}
