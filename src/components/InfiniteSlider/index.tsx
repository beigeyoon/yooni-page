'use client';

import { useEffect, useMemo, useRef, useState, ReactNode } from 'react';

interface InfiniteSliderProps {
  children: ReactNode;
  direction?: 'left' | 'right';
  speed?: number;
  repeat?: number;
  backgroundColor?: string;
}

const InfiniteSlider = ({
  children,
  direction = 'right',
  speed = 0.5,
  repeat = 10,
  backgroundColor = 'transparent'
}: InfiniteSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const repeatedItems = useMemo(() => {
    const itemsArray = Array.isArray(children) ? children : [children];
    return Array.from({ length: repeat }).flatMap(() => itemsArray);
  }, [children, repeat]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    setTrackWidth(track.scrollWidth / repeat);
  }, [repeatedItems, repeat]);

  useEffect(() => {
    if (trackWidth === 0) return;

    const track = trackRef.current;
    if (!track) return;

    let posX = direction === 'right' ? -trackWidth : 0;
    let animationFrameId: number;

    const step = () => {
      posX += direction === 'right' ? speed : -speed;

      if (direction === 'right' && posX >= 0) {
        posX = -trackWidth;
      }

      if (direction === 'left' && posX <= -trackWidth) {
        posX = 0;
      }

      track.style.transform = `translateX(${posX}px)`;
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [trackWidth, direction, speed]);

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden py-1 bg-${backgroundColor}`}>
      <div
        ref={trackRef}
        className="m-0 flex p-0 will-change-transform">
        {repeatedItems.map((item, idx) => (
          <div
            key={idx}
            className={`mr-2 w-fit flex-none text-center`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfiniteSlider;
