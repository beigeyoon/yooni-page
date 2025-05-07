import * as React from 'react';

export function PostPreview({
  post,
  onClick
}: {
  post: { id: string; title: string; subtitle: string; createdAt: string };
  onClick: () => void;
}) {
  const { title, subtitle, createdAt } = post;
  return (
    <div
      className="flex w-full flex-col justify-between border-b p-4 hover:cursor-pointer hover:bg-neutral-100"
      onClick={onClick}>
      <div className="mb-2 flex items-baseline justify-between gap-4 text-lg">
        <span className="text-xl font-bold">{title}</span>
        <span className="text-sm">{createdAt}</span>
      </div>
      <div className="text-md">{subtitle}</div>
    </div>
  );
}
