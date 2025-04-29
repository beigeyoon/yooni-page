import ItemCard from '@/components/ItemCard';
import { PROJECTS_CONTENT } from '@/constants/projects';

export default function Projects() {
  return (
    <div className="flex w-full flex-col items-center gap-8 px-24">
      {PROJECTS_CONTENT.map((item, idx) => (
        <ItemCard
          key={idx}
          content={item}
          links={item.links}
          imgHref={item.imgHref}
        />
      ))}
    </div>
  );
}
