import * as React from 'react';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export function PostPreview({
  post,
  onClick
}: {
  post: { id: string; title: string; subtitle: string; createdAt: string };
  onClick: () => void;
}) {
  const { title, subtitle, createdAt } = post;
  return (
    <Card
      className="flex w-full justify-between p-6 hover:cursor-pointer hover:bg-neutral-100"
      onClick={onClick}>
      <div>
        <CardTitle className="mb-2 text-lg">{title}</CardTitle>
        <CardDescription className="text-md">{subtitle}</CardDescription>
      </div>
      <div>{createdAt}</div>
    </Card>
  );
}
