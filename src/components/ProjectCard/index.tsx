import { ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface Props {
  content: {
    title: string;
    desc: string[] | string[][];
  };
  links?: {
    title: string;
    src: string;
  }[];
  imgHref: string;
}

export default function ProjectCard({ content, links, imgHref }: Props) {
  const { title, desc } = content;

  return (
    <div className="flex h-[400px] flex-col justify-between overflow-hidden rounded-lg border border-neutral-300">
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src={imgHref}
          alt="project-image"
          fill
          style={{ objectFit: 'cover' }}
          className="grayscale"
        />
      </div>
      <div className="p-6">
        <h1 className="mb-3 text-xl font-bold text-neutral-600">{title}</h1>
        <div>
          {desc.map((item, idx) => (
            <div
              key={idx}
              className="text-sm text-neutral-600">
              - {item}
            </div>
          ))}
          {links &&
            links.map((item, idx) => (
              <div
                key={idx}
                className="text-sm text-neutral-600">
                <a
                  href={item.src}
                  target="_blank"
                  rel="noopener noreferrer">
                  - {item.title}{' '}
                  <ExternalLink className="inline-block h-[12px] w-[12px] align-baseline" />
                </a>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
