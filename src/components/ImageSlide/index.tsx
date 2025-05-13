'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

const ImageSlide = ({ images }: { images: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    let currentLeft = 0;

    const intervalId = setInterval(() => {
      const firstItem = track.querySelector('.image-item') as HTMLDivElement;
      if (!firstItem) return;

      const containerLeft = container.getBoundingClientRect().left;
      const firstItemRight = firstItem.getBoundingClientRect().right;

      if (firstItemRight <= containerLeft) {
        track.appendChild(firstItem);
        currentLeft = currentLeft + firstItem.offsetWidth + 16; // + gap
      }

      currentLeft -= 1;
      track.style.marginLeft = `${currentLeft}px`;
    }, 10);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto h-[150px] w-full overflow-hidden max-sm:h-[100px]">
      <div
        ref={trackRef}
        className="m-0 flex p-0">
        {images.map((src, idx) => (
          <div
            key={idx}
            className="image-item mr-4 w-[150px] flex-none text-center max-sm:w-[100px]">
            <Image
              src={src}
              alt={`img-${idx}`}
              width={150}
              height={150}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSlide;
