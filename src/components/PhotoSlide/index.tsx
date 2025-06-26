import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import Image from 'next/image';

const PhotoSlide = ({ imageUrls }: { imageUrls: string[] }) => {
  return (
    <Carousel>
      <CarouselContent>
        {imageUrls.map(url => (
          <CarouselItem
            key={url}
            className="flex items-center justify-center">
            <div className="relative h-[600px] w-full">
              <Image
                src={url}
                fill
                className="object-contain object-center"
                alt="gallery-image"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default PhotoSlide;
