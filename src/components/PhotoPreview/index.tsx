import { SquarePen } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRouteWithLoading } from '@/hooks/useRouteWithLoading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import PhotoSlide from '../PhotoSlide';

const PhotoPreview = ({
  post
}: {
  post: {
    id: string;
    title: string;
    subtitle: string;
    content?: string;
    createdAt: string;
    isPublished: boolean;
  };
}) => {
  const router = useRouteWithLoading();
  const { isAdmin } = useAuth();

  const imageUrls = useMemo(() => {
    if (post.content) {
      return extractImageSrcList(post.content!);
    } else return [];
  }, [post]);

  const onClickEdit = useCallback(() => {
    router.push(`/editor?id=${post.id}`);
  }, [post, router]);

  return (
    <Dialog>
      <div className="group relative mb-10 h-[150px] w-fit overflow-visible">
        {isAdmin && (
          <Button
            variant="ghost"
            className="absolute left-[-50px]"
            onClick={onClickEdit}>
            <SquarePen width={18} />
          </Button>
        )}

        <div className="flex items-end">
          {/* 첫 번째 이미지 */}
          <DialogTrigger>
            <div className="relative z-10 h-[150px] w-[150px] grayscale transition duration-500 ease-in-out group-hover:grayscale-0">
              <Image
                src={imageUrls[0]}
                fill
                sizes="150"
                className="object-cover object-center"
                alt="gallery-image"
                priority
              />
            </div>
          </DialogTrigger>
          {/* 텍스트 박스 */}
          <div className="duration-800 mb-2 ml-8 transition-opacity duration-500 ease-in-out group-hover:opacity-0">
            <div className="whitespace-nowrap text-sm text-neutral-600">
              <div className="text-2xl font-extrabold">{post.title}</div>
              <div className="mt-2">{post.subtitle}</div>
            </div>
          </div>
        </div>

        {/* 나머지 이미지들 */}
        <div className="absolute left-0 top-0 ml-4 flex translate-x-0 opacity-0 transition-all duration-500 ease-in-out group-hover:translate-x-[150px] group-hover:opacity-100">
          {imageUrls.slice(1).map(url => (
            <div
              className="relative mr-4 h-[150px] w-[150px] overflow-hidden"
              key={url}>
              <Image
                src={url}
                fill
                sizes="150"
                className="object-cover object-center"
                alt="gallery-image"
              />
            </div>
          ))}
        </div>
      </div>
      <DialogContent className="max-h-[680px] max-w-[720px] gap-0 px-[60px]">
        <DialogTitle className="h-0" />
        <DialogDescription className="h-0" />
        <PhotoSlide imageUrls={imageUrls} />
      </DialogContent>
    </Dialog>
  );
};

export default PhotoPreview;

export function extractImageSrcList(html: string): string[] {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const result: string[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    result.push(match[1]);
  }

  return result;
}
