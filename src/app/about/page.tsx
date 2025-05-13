import { PROFILE, ABOUT_CONTENT } from '@/constants/about';
import ItemCard from '@/components/ItemCard';
import Image from 'next/image';
import { Copy } from 'lucide-react';
import CopyButton from '@/components/CopyButton';

export default function About() {
  return (
    <div className="flex flex-row-reverse justify-center gap-16 pb-10 max-sm:flex-col-reverse max-sm:p-6">
      <div className="flex flex-col gap-8">
        {ABOUT_CONTENT.map((item, idx) => (
          <ItemCard
            key={idx}
            content={item}
          />
        ))}
      </div>
      <div className="flex flex-col items-center">
        <Image
          src="/images/yooni.webp"
          alt="yooni-profile-image"
          width={280}
          height={280}
          className="mb-8 rounded-full"
        />
        {PROFILE.map(item => (
          <div
            key={item.name}
            className={`text-center text-neutral-600 ${item.name === 'name' ? 'pb-2 text-lg font-bold' : 'text-sm'}`}>
            {item.name === 'email' ? (
              <CopyButton
                trigger={
                  <div className="mx-auto flex cursor-pointer items-center gap-1 pt-2 font-semibold underline">
                    {item.value}
                    <Copy size={14} />
                  </div>
                }
                textToCopy={item.value}
              />
            ) : (
              item.value
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
